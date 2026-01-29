-- Enable Extensions
create extension if not exists "uuid-ossp";

-- 1. System Config
create table if not exists public.cursor_system_settings (
    key text primary key,
    value text not null
);
insert into public.cursor_system_settings (key, value) values ('cursor_system_enabled', 'true') on conflict (key) do nothing;

-- 2. Teams
create table if not exists public.cursor_teams (
    id uuid default gen_random_uuid() primary key,
    team_name text not null,
    max_users integer not null default 2,
    current_users integer not null default 0,
    stability_score float not null default 100.0,
    supplier_id uuid,
    status text not null default 'active' check (status in ('active', 'risky', 'disabled', 'draining')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Customers
create table if not exists public.cursor_customers (
    id uuid default gen_random_uuid() primary key,
    email text unique not null,
    current_team_id uuid references public.cursor_teams(id) on delete set null,
    status text not null default 'active' check (status in ('active', 'removed')),
    removal_count integer not null default 0,
    last_restore_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    auto_restore_enabled boolean not null default true
);

-- 4. Invites
create table if not exists public.cursor_invites (
    id uuid default gen_random_uuid() primary key,
    team_id uuid not null references public.cursor_teams(id) on delete cascade,
    invite_link text unique not null,
    status text not null default 'active' check (status in ('active', 'assigned', 'joined', 'expired', 'revoked')),
    assigned_to uuid references public.cursor_customers(id) on delete set null,
    used_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Events
create table if not exists public.cursor_events (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.cursor_customers(id) on delete set null,
    team_id uuid references public.cursor_teams(id) on delete set null,
    event_type text not null check (event_type in ('removed', 'restored', 'joined')),
    metadata jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes
create index if not exists idx_cursor_customers_email on public.cursor_customers(email);
create index if not exists idx_cursor_teams_status_score on public.cursor_teams(status, stability_score);
create index if not exists idx_cursor_invites_status_team on public.cursor_invites(status, team_id);

-- RLS
alter table public.cursor_system_settings enable row level security;
alter table public.cursor_teams enable row level security;
alter table public.cursor_customers enable row level security;
alter table public.cursor_invites enable row level security;
alter table public.cursor_events enable row level security;

-- Admin Policies (Simplified for brevity, assuming Edge Function handles logic via Service Role or RPC security definer)
create policy "Admin All" on public.cursor_teams for all using ((select auth.jwt() ->> 'email') = 'admin@snippy.mk');
create policy "Admin All" on public.cursor_customers for all using ((select auth.jwt() ->> 'email') = 'admin@snippy.mk');
create policy "Admin All" on public.cursor_invites for all using ((select auth.jwt() ->> 'email') = 'admin@snippy.mk');
create policy "Admin All" on public.cursor_events for all using ((select auth.jwt() ->> 'email') = 'admin@snippy.mk');
create policy "Admin All" on public.cursor_system_settings for all using ((select auth.jwt() ->> 'email') = 'admin@snippy.mk');

-- --- FUNCTIONS ---

-- Recalculate Helper
create or replace function public.recalculate_team_users(target_team_id uuid)
returns void as $$
declare
    actual_count integer;
begin
    select count(*) into actual_count from public.cursor_customers where current_team_id = target_team_id and status = 'active';
    update public.cursor_teams set current_users = actual_count where id = target_team_id;
end;
$$ language plpgsql security definer;

-- CRITICAL RPC: Claim Invite Transaction
create or replace function public.claim_invite_transaction(user_email text)
returns json as $$
declare
    sys_enabled text;
    v_user_id uuid;
    v_team_id uuid;
    v_invite_id uuid;
    v_invite_link text;
    v_stability_score float;
    v_user_status text;
    v_current_team_id uuid;
    v_auto_restore boolean;
begin
    -- 1. Check System Enabled
    select value into sys_enabled from public.cursor_system_settings where key = 'cursor_system_enabled';
    if sys_enabled = 'false' then
        return json_build_object('error', 'maintenance_mode');
    end if;

    -- 2. Find/Create User
    select id, status, current_team_id, auto_restore_enabled into v_user_id, v_user_status, v_current_team_id, v_auto_restore
    from public.cursor_customers where email = user_email;

    if not found then
        insert into public.cursor_customers (email) values (user_email) returning id into v_user_id;
        v_user_status := 'active'; -- New user default
        v_auto_restore := true;
    end if;

    -- 3. Guard: If User Active & Has Team -> Return Current (No Op)
    if v_user_status = 'active' and v_current_team_id is not null then
        -- Ideally return current team's active invite or just say "already_active"
        -- For robust recovery, we assume they need a link. But if they are consistent, maybe we just return success.
        -- Let's check if they have a valid assigned invite? 
        -- Simplified: Just fail safe.
        return json_build_object('error', 'already_active');
    end if;

    if v_auto_restore = false then
        return json_build_object('error', 'auto_restore_disabled');
    end if;

    -- 4. Select Team (Locking)
    -- We try to find a team that has space.
    -- We allow selection from Active or Risky. Draining is excluded by Priority Order check (we won't query them ideally).
    select id into v_team_id
    from public.cursor_teams
    where status in ('active', 'risky')
      and current_users < max_users
    order by 
        case status when 'active' then 1 else 2 end asc,
        stability_score desc
    limit 1
    for update skip locked; -- Skip locked rows to try next available immediately instead of waiting blocks

    if v_team_id is null then
        return json_build_object('error', 'no_teams_available');
    end if;

    -- 5. Select Invite
    select id, invite_link into v_invite_id, v_invite_link
    from public.cursor_invites
    where team_id = v_team_id and status = 'active'
    limit 1
    for update;

    if v_invite_id is null then
        -- Edge case: Team has slots but no invites uploaded. 
        -- Should ideally fallback to next team, but for simplicity here we error.
        -- Real prod system might loop teams.
        return json_build_object('error', 'no_invites_available');
    end if;

    -- 6. Execute Assignments
    update public.cursor_invites 
    set status = 'assigned', assigned_to = v_user_id, used_at = now()
    where id = v_invite_id;

    update public.cursor_customers
    set status = 'active', current_team_id = v_team_id, last_restore_at = now()
    where id = v_user_id;

    update public.cursor_teams
    set current_users = current_users + 1
    where id = v_team_id;

    insert into public.cursor_events (user_id, team_id, event_type)
    values (v_user_id, v_team_id, 'restored');

    -- Safety Recalc
    perform public.recalculate_team_users(v_team_id);

    return json_build_object('success', true, 'invite_link', v_invite_link);
end;
$$ language plpgsql security definer;

-- RPC: Handle User Removal
create or replace function public.handle_user_removal_transaction(user_email text)
returns json as $$
declare
    v_user_id uuid;
    v_team_id uuid;
    v_max_users int;
    v_stability float;
    v_penalty float;
begin
    select id, current_team_id into v_user_id, v_team_id 
    from public.cursor_customers where email = user_email;

    if not found then
        return json_build_object('error', 'user_not_found');
    end if;

    -- Update User
    update public.cursor_customers
    set status = 'removed', removal_count = removal_count + 1
    where id = v_user_id;

    -- If had a team, penalize it
    if v_team_id is not null then
        select max_users, stability_score into v_max_users, v_stability
        from public.cursor_teams where id = v_team_id
        for update;

        v_penalty := LEAST(10.0, 100.0 / GREATEST(v_max_users, 1));
        v_stability := v_stability - v_penalty;

        update public.cursor_teams
        set stability_score = v_stability,
            current_users = GREATEST(current_users - 1, 0),
            status = case 
                when v_stability < 30 then 'disabled'
                when v_stability < 50 then 'risky'
                else status
            end
        where id = v_team_id;

        insert into public.cursor_events (user_id, team_id, event_type)
        values (v_user_id, v_team_id, 'removed');
        
        perform public.recalculate_team_users(v_team_id);
    end if;

    return json_build_object('success', true);
end;
$$ language plpgsql security definer;

-- Joined Handler
create or replace function public.handle_invite_joined(user_email text)
returns json as $$
declare
    v_user_id uuid;
    v_assigned_id uuid;
begin
   select id into v_user_id from public.cursor_customers where email = user_email;
   
   -- Find latest assigned invite
   select id into v_assigned_id from public.cursor_invites 
   where assigned_to = v_user_id and status = 'assigned'
   order by used_at desc limit 1;

   if v_assigned_id is not null then
       update public.cursor_invites set status = 'joined' where id = v_assigned_id;
       insert into public.cursor_events (user_id, event_type) values (v_user_id, 'joined');
   end if;
   
   return json_build_object('success', true);
end;
$$ language plpgsql security definer;

-- Enable Extensions
create extension if not exists "uuid-ossp";

-- 1. System Config
create table if not exists public.cursor_system_settings (
    key text primary key,
    value text not null
);
insert into public.cursor_system_settings (key, value) values ('cursor_system_enabled', 'true') on conflict (key) do nothing;

-- VERSION CONTROL SETTINGS
insert into public.cursor_system_settings (key, value) values 
    ('extension_min_version', '1.0.0'),      -- Users below this MUST update
    ('extension_latest_version', '1.0.0'),   -- Just for display
    ('extension_download_url', 'https://snippymart.com/download-extension') -- Where to get it
on conflict (key) do nothing;

-- 2. Teams (Schema Evolution)
create table if not exists public.cursor_teams (
    id uuid default gen_random_uuid() primary key
);

-- Handle potential rename from old schema
do $$
begin
    if exists(select 1 from information_schema.columns where table_name = 'cursor_teams' and column_name = 'name') then
        alter table public.cursor_teams rename column "name" to "team_name";
    end if;
end $$;

alter table public.cursor_teams add column if not exists team_name text;
alter table public.cursor_teams add column if not exists max_users integer not null default 2;
alter table public.cursor_teams add column if not exists current_users integer not null default 0;
alter table public.cursor_teams add column if not exists stability_score float not null default 100.0;
alter table public.cursor_teams add column if not exists supplier_id uuid;
alter table public.cursor_teams add column if not exists status text not null default 'active' check (status in ('active', 'risky', 'disabled', 'draining'));
alter table public.cursor_teams add column if not exists created_at timestamp with time zone default timezone('utc'::text, now()) not null;

-- Extension Remote Configuration (JSON)
insert into public.cursor_system_settings (key, value) values (
    'extension_config', 
    '{
        "version": "1.0.0",
        "cooldown_ms": 180000,
        "email_selectors": [
            "meta[name=\"user-email\"]",
            ".user-profile-email",
            "div[data-testid=\"user-email\"]",
            "div[class*=\"email\"]",
            "p[class*=\"email\"]"
        ],
        "free_plan_triggers": [
            "current plan: free",
            "your plan: free",
            "plan: personal",
            "upgrade to pro"
        ],
        "upgrade_btn_selectors": [
            "button[data-testid=\"upgrade-button\"]",
            ".badge-free"
        ]
    }'
) on conflict (key) do nothing;

-- 3. Customers (Schema Evolution)
create table if not exists public.cursor_customers (
    id uuid default gen_random_uuid() primary key
);

do $$
begin
    if exists(select 1 from information_schema.columns where table_name = 'cursor_customers' and column_name = 'team_id') then
        alter table public.cursor_customers rename column "team_id" to "current_team_id";
    end if;
end $$;

alter table public.cursor_customers add column if not exists email text;
-- Add unique constraint safely
do $$
begin
    if not exists (select 1 from pg_constraint where conname = 'cursor_customers_email_key') then
        alter table public.cursor_customers add constraint cursor_customers_email_key unique (email);
    end if;
end $$;

alter table public.cursor_customers add column if not exists current_team_id uuid references public.cursor_teams(id) on delete set null;
alter table public.cursor_customers add column if not exists status text not null default 'active' check (status in ('active', 'removed'));
alter table public.cursor_customers add column if not exists removal_count integer not null default 0;
alter table public.cursor_customers add column if not exists last_restore_at timestamp with time zone;
alter table public.cursor_customers add column if not exists auto_restore_enabled boolean not null default true;
alter table public.cursor_customers add column if not exists created_at timestamp with time zone default timezone('utc'::text, now()) not null;


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

-- Admin Policies
drop policy if exists "Admin All Teams" on public.cursor_teams;
create policy "Admin All Teams" on public.cursor_teams for all using (
    (select auth.jwt() ->> 'email') = 'admin@snippy.mk'
    OR exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
);

drop policy if exists "Admin All Customers" on public.cursor_customers;
create policy "Admin All Customers" on public.cursor_customers for all using (
    (select auth.jwt() ->> 'email') = 'admin@snippy.mk'
    OR exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
);

drop policy if exists "Admin All Invites" on public.cursor_invites;
create policy "Admin All Invites" on public.cursor_invites for all using (
    (select auth.jwt() ->> 'email') = 'admin@snippy.mk'
    OR exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
);

drop policy if exists "Admin All Events" on public.cursor_events;
create policy "Admin All Events" on public.cursor_events for all using (
    (select auth.jwt() ->> 'email') = 'admin@snippy.mk'
    OR exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
);

drop policy if exists "Admin All Settings" on public.cursor_system_settings;
create policy "Admin All Settings" on public.cursor_system_settings for all using (
    (select auth.jwt() ->> 'email') = 'admin@snippy.mk'
    OR exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
);

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

-- 1. System Config
insert into public.cursor_system_settings (key, value) values ('team_cooldown_seconds', '300') on conflict (key) do nothing;

-- 2. Teams (Schema Evolution) - Add last_assigned_at AND last_removal_at
alter table public.cursor_teams add column if not exists last_assigned_at timestamp with time zone;
alter table public.cursor_teams add column if not exists last_removal_at timestamp with time zone;

-- CRITICAL RPC: Claim Invite Transaction (Smart Routing)
create or replace function public.claim_invite_transaction(user_email text)
returns json as $$
declare
    v_cooldown_sec int;
    v_user_id uuid;
    v_team_id uuid;
    v_invite_id uuid;
    v_invite_link text;
    v_team_name text;
    v_user_status text;
    v_current_team_id uuid;
    v_auto_restore boolean;
begin
    -- 1. Configuration & User Check
    select value::int into v_cooldown_sec from public.cursor_system_settings where key = 'team_cooldown_seconds';
    if v_cooldown_sec is null then v_cooldown_sec := 60; end if;

    select id, status, current_team_id, auto_restore_enabled 
    into v_user_id, v_user_status, v_current_team_id, v_auto_restore
    from public.cursor_customers where email = user_email;

    if not found then
        insert into public.cursor_customers (email) values (user_email) returning id into v_user_id;
        v_user_status := 'active'; v_auto_restore := true;
    end if;

    if v_user_status = 'active' and v_current_team_id is not null then
        select team_name into v_team_name from public.cursor_teams where id = v_current_team_id;
        return json_build_object('error', 'already_active', 'team_name', v_team_name);
    end if;

    if v_auto_restore is false then return json_build_object('error', 'auto_restore_disabled'); end if;

    -- 2. INTELLIGENT ROUTING (The "Advanced Logic")
    -- Prioritize:
    -- 1. Stability Score (Healthy Teams First)
    -- 2. Emptiness (Load Balancing)
    -- Check Cooldowns.
    select id, team_name into v_team_id, v_team_name
    from public.cursor_teams
    where status = 'active'
      and current_users < max_users
      and (last_assigned_at is null OR last_assigned_at < now() - (v_cooldown_sec || ' seconds')::interval)
    order by stability_score desc, current_users asc 
    limit 1;

    if v_team_id is null then
        -- Fallback: Risky Teams?
        select id, team_name into v_team_id, v_team_name
        from public.cursor_teams
        where status = 'risky' and current_users < max_users
        order by stability_score desc
        limit 1;
        
        if v_team_id is null then
            -- No teams found. (Plan B/C below will handle this if we are lucky with invites)
        end if;
    end if;

    -- 3. LOCK INVITE
    -- If we found a team, try to get its invite.
    if v_team_id is not null then
        select id, invite_link into v_invite_id, v_invite_link
        from public.cursor_invites
        where team_id = v_team_id and status = 'active'
        limit 1
        for update skip locked;
    end if; 

    -- Fallbacks (Plan C)
    if v_invite_id is null then
       -- Plan C: DESPERATE MODE & RECYCLE.
       select i.id, i.invite_link, i.team_id, 'Emergency Team'
       into v_invite_id, v_invite_link, v_team_id, v_team_name
       from public.cursor_invites i
       where i.status in ('active', 'joined') 
       order by (i.status = 'active') desc, i.used_at asc
       limit 1
       for update; 

       if v_invite_id is null then
            -- return debug info
            declare v_count int;
            begin
                select count(*) into v_count from public.cursor_invites where status in ('active', 'joined');
                return json_build_object('error', 'no_invites_available', 'debug_count', v_count);
            end;
       end if;
    end if;

    -- 4. EXECUTE
    update public.cursor_invites 
    set status = 'assigned', assigned_to = v_user_id, used_at = now()
    where id = v_invite_id;

    update public.cursor_customers
    set status = 'active', current_team_id = v_team_id, last_restore_at = now()
    where id = v_user_id;

    if v_team_id is not null then
        update public.cursor_teams
        set current_users = current_users + 1, last_assigned_at = now()
        where id = v_team_id;
    end if;

    insert into public.cursor_events (user_id, team_id, event_type)
    values (v_user_id, v_team_id, 'restored');

    return json_build_object('success', true, 'invite_link', v_invite_link, 'team_name', v_team_name);
end;
$$ language plpgsql security definer;


-- RPC: Handle User Removal (Advanced Health Logic)
create or replace function public.handle_user_removal_transaction(user_email text)
returns json as $$
declare
    v_user_id uuid;
    v_team_id uuid;
    v_max_users int;
    v_stability float;
    v_penalty float;
    v_joined_at timestamp with time zone;
    v_survival_hours float;
begin
    select id, current_team_id, last_restore_at 
    into v_user_id, v_team_id, v_joined_at
    from public.cursor_customers where email = user_email;

    if not found then
        return json_build_object('error', 'user_not_found');
    end if;

    -- Update User
    update public.cursor_customers
    set status = 'removed', removal_count = removal_count + 1
    where id = v_user_id;

    -- If had a team, penalize it INTELLIGENTLY
    if v_team_id is not null then
        select max_users, stability_score into v_max_users, v_stability
        from public.cursor_teams where id = v_team_id
        for update;
        
        -- Calculate Survival Duration
        if v_joined_at is null then v_joined_at := now(); end if; -- fallback
        v_survival_hours := extract(epoch from (now() - v_joined_at)) / 3600.0;

        -- DYNAMIC PENALTY
        if v_survival_hours < 4.0 then
             -- "Suddenly user got removed"
             -- HUGE Penalty. Team is likely detected/burned.
             v_penalty := 25.0; 
        elsif v_survival_hours < 24.0 then
             -- Moderate Penalty.
             v_penalty := 10.0;
        else 
             -- "Team last for 2 days" -> "Damn thats healthy"
             -- Tiny Penalty. Probably user's fault or bad luck.
             v_penalty := 2.0;
        end if;

        v_stability := GREATEST(0.0, v_stability - v_penalty);

        update public.cursor_teams
        set stability_score = v_stability,
            current_users = GREATEST(current_users - 1, 0),
            last_removal_at = now(),
            status = case 
                when v_stability < 30 then 'disabled'
                when v_stability < 60 then 'risky'
                else 'active' -- If it stays high (e.g. 98 -> 96), it stays active.
            end
        where id = v_team_id;

        insert into public.cursor_events (user_id, team_id, event_type, metadata)
        values (v_user_id, v_team_id, 'removed', json_build_object('survival_hours', v_survival_hours, 'penalty', v_penalty));
        
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

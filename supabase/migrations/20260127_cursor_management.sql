-- Create cursor_teams table
create table if not exists public.cursor_teams (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    color text default '#3b82f6', -- default blue
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create cursor_customers table
create table if not exists public.cursor_customers (
    id uuid default gen_random_uuid() primary key,
    email text not null,
    team_id uuid references public.cursor_teams(id) on delete set null,
    purchase_date timestamp with time zone default timezone('utc'::text, now()) not null,
    duration_days integer not null default 30,
    end_date timestamp with time zone, -- Calculated via trigger
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Function to set end_date automatically
create or replace function public.set_cursor_end_date()
returns trigger as $$
begin
    NEW.end_date := NEW.purchase_date + (NEW.duration_days || ' days')::interval;
    return NEW;
end;
$$ language plpgsql;

-- Trigger
create trigger set_end_date_trigger
    before insert or update on public.cursor_customers
    for each row
    execute function public.set_cursor_end_date();

-- Enable RLS
alter table public.cursor_teams enable row level security;
alter table public.cursor_customers enable row level security;

-- Policies (Admin Only)
-- We use a DO block to safely apply policies whether has_role exists or not, 
-- or you can just run these directly if you know has_role exists. 
-- For simplicity in the editor, we will try to use the most common admin check pattern.

create policy "Admins can manage cursor_teams"
    on public.cursor_teams
    for all
    using ( 
        (select auth.jwt() ->> 'email') = 'admin@snippy.mk' 
        OR 
        (SELECT count(*) FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin') > 0
    )
    with check ( 
        (select auth.jwt() ->> 'email') = 'admin@snippy.mk' 
        OR 
        (SELECT count(*) FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin') > 0
    );

create policy "Admins can manage cursor_customers"
    on public.cursor_customers
    for all
    using ( 
        (select auth.jwt() ->> 'email') = 'admin@snippy.mk' 
        OR 
        (SELECT count(*) FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin') > 0
    )
    with check ( 
        (select auth.jwt() ->> 'email') = 'admin@snippy.mk' 
        OR 
        (SELECT count(*) FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin') > 0
    );

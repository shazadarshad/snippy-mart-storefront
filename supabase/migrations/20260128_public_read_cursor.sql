-- Allow public read access to cursor_teams
create policy "Public can view teams"
    on public.cursor_teams
    for select
    using (true);

-- Allow public read access to cursor_customers
create policy "Public can view customers"
    on public.cursor_customers
    for select
    using (true);

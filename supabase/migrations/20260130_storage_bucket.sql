
-- Create a new storage bucket for Extension Artifacts
insert into storage.buckets (id, name, public)
values ('extension-artifacts', 'extension-artifacts', true)
on conflict (id) do nothing;

-- Policy: Allow Public Read Access
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'extension-artifacts' );

-- Policy: Allow Authenticated Uploads (Admin Only ideally, but Auth for now)
create policy "Authenticated Uploads"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'extension-artifacts' );

-- Policy: Allow Authenticated Updates
create policy "Authenticated Updates"
on storage.objects for update
to authenticated
using ( bucket_id = 'extension-artifacts' );

-- 20260717000001: Signed contracts storage bucket (private).
--
-- Stores signed Participation Agreement PDFs generated during vet registration.
-- Accessible only to service_role and the individual vet via RLS.

insert into storage.buckets (id, name, public)
values ('signed-contracts', 'signed-contracts', false)
on conflict (id) do nothing;

-- Allow service_role full access (already granted by default).
-- Allow the owning vet to read their own contract.
create policy "Vets can read their own signed contract"
on storage.objects for select
to authenticated
using (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  or (auth.jwt() -> 'app_metadata' ->> 'role') = 'consultant'
  or (storage.foldername(name))[2] = auth.uid()::text
);

-- Only allow service_role (via edge function) to insert signed contracts.
create policy "Only server can upload signed contracts"
on storage.objects for insert
to authenticated
with check (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  or (auth.jwt() -> 'app_metadata' ->> 'role') = 'consultant'
);

-- Only allow service_role to delete.
create policy "Only server can delete signed contracts"
on storage.objects for delete
to authenticated
using (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  or (auth.jwt() -> 'app_metadata' ->> 'role') = 'consultant'
);

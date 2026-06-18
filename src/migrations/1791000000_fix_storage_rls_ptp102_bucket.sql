-- Fix Supabase Storage RLS for the ptp102-trial-portal bucket.
--
-- The browser uploads directly to this bucket (no server-side route), so
-- INSERT must be allowed for authenticated users writing under their own
-- userId prefix. SELECT must allow owners to read back their own files and
-- admins to read any file. UPDATE and DELETE are owner-only.
--
-- Path scheme: <category>/<userId>/<entityType>/<entityId>/<timestamp>-<safeName>
--   foldername() returns directory components as a 1-based array.
--   foldername(name)[2] is the userId segment.
--
-- Existing migration 1781380366 accidentally created a different bucket
-- ('private-uploads') with foldername()[4]. This migration targets the
-- actual bucket the app uses and corrects the foldername index.

-- Ensure the bucket exists (idempotent).
insert into storage.buckets (id, name, public)
values ('ptp102-trial-portal', 'ptp102-trial-portal', false)
on conflict (id) do nothing;

-- Drop any stale policies from the old migration, manual setup, or previous
-- partial application to guarantee a clean slate.
drop policy if exists "Users can read their own private uploads" on storage.objects;
drop policy if exists "Users can upload to their own private folder" on storage.objects;
drop policy if exists "Users can delete their own private uploads" on storage.objects;
drop policy if exists "ptp102_user_can_insert_own_path"          on storage.objects;
drop policy if exists "ptp102_user_can_read_own_path_or_admin"  on storage.objects;
drop policy if exists "ptp102_user_can_update_own_path"         on storage.objects;
drop policy if exists "ptp102_user_can_delete_own_path"         on storage.objects;

-- 1. INSERT: authenticated user can write under their own userId path prefix.
create policy "ptp102_user_can_insert_own_path"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'ptp102-trial-portal'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- 2. SELECT: owner can read, admin override.
create policy "ptp102_user_can_read_own_path_or_admin"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'ptp102-trial-portal'
    and (
      (storage.foldername(name))[2] = auth.uid()::text
      or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    )
  );

-- 3. UPDATE: owner only.
create policy "ptp102_user_can_update_own_path"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'ptp102-trial-portal'
    and (storage.foldername(name))[2] = auth.uid()::text
  )
  with check (
    bucket_id = 'ptp102-trial-portal'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- 4. DELETE: owner only.
create policy "ptp102_user_can_delete_own_path"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'ptp102-trial-portal'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

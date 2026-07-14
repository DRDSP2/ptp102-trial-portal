-- 1796000003: split Supabase Storage so note/scan documents get a hard 50 MB
-- server-side cap while gait videos keep a 500 MB ceiling.
--
-- Background:
--   All categories previously shared the single `ptp102-trial-portal` bucket,
--   which had NO file_size_limit. The only size enforcement was client-side
--   (validateUpload), so a crafted request could exceed limits. The vet
--   note/scan document flow (QuickAddNote) now targets a dedicated
--   `patient-note-docs` category that must be capped at 50 MB server-side per
--   product requirement, while gait videos (`patient-media`) legitimately need
--   up to 500 MB.
--
-- Approach:
--   1. Keep documents in `ptp102-trial-portal` and set its file_size_limit to
--      50 MB (native Supabase enforcement on every upload).
--   2. Move gait videos/images (`patient-media`) to a NEW `ptp102-trial-media`
--      bucket (500 MB), so the 50 MB documents cap does not reject videos.
--   3. Add RLS policies on the new bucket mirroring 1791000000 (same per-user
--      model, plus admin override). No existing rule is weakened: owners and
--      admins keep identical access, just on the new bucket.
--
-- Revertible: drop the new policies + bucket and reset ptp102-trial-portal's
-- file_size_limit to NULL to undo.

-- 1. New media bucket (videos / gait images). Private, 500 MB ceiling.
insert into storage.buckets (id, name, public, file_size_limit)
values ('ptp102-trial-media', 'ptp102-trial-media', false, 524288000)
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      public = excluded.public;

-- 2. Cap the documents bucket at 50 MB. Covers trial-documents, site-files,
--    consent-signatures, and the new patient-note-docs.
update storage.buckets
  set file_size_limit = 52428800
  where id = 'ptp102-trial-portal';

-- 3. RLS for the new media bucket (mirror 1791000000, bucket-scoped).
drop policy if exists "ptp102_media_user_can_insert_own_path" on storage.objects;
drop policy if exists "ptp102_media_user_can_read_own_path_or_admin" on storage.objects;
drop policy if exists "ptp102_media_user_can_update_own_path" on storage.objects;
drop policy if exists "ptp102_media_user_can_delete_own_path" on storage.objects;

create policy "ptp102_media_user_can_insert_own_path"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'ptp102-trial-media'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "ptp102_media_user_can_read_own_path_or_admin"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'ptp102-trial-media'
    and (
      (storage.foldername(name))[2] = auth.uid()::text
      or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    )
  );

create policy "ptp102_media_user_can_update_own_path"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'ptp102-trial-media'
    and (storage.foldername(name))[2] = auth.uid()::text
  )
  with check (
    bucket_id = 'ptp102-trial-media'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "ptp102_media_user_can_delete_own_path"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'ptp102-trial-media'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

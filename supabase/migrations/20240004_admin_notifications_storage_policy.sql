-- Allow admins to manage announcement/broadcast pubmats in student-documents bucket
-- Path pattern used by app: notifications/{announcement|broadcast}/...

drop policy if exists "admin notifications files select" on storage.objects;
drop policy if exists "admin notifications files insert" on storage.objects;
drop policy if exists "admin notifications files update" on storage.objects;
drop policy if exists "admin notifications files delete" on storage.objects;

create policy "admin notifications files select"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'student-documents'
    and name like 'notifications/%'
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );

create policy "admin notifications files insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'student-documents'
    and name like 'notifications/%'
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );

create policy "admin notifications files update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'student-documents'
    and name like 'notifications/%'
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  )
  with check (
    bucket_id = 'student-documents'
    and name like 'notifications/%'
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );

create policy "admin notifications files delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'student-documents'
    and name like 'notifications/%'
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );

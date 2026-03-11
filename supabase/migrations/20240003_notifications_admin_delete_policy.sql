-- Allow admins to delete notifications (announcements/broadcasts) via RLS

drop policy if exists "Admins can delete notifications" on public.notifications;

create policy "Admins can delete notifications"
  on public.notifications
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );

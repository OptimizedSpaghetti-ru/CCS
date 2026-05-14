-- Keep IT Support-targeted announcements from being categorized as assistance.

UPDATE public.notifications n
SET type = CASE
  WHEN COALESCE(a.category, '') = 'Event' THEN 'event'
  ELSE 'announcement'
END
FROM public.announcements a
WHERE n.announcement_id = a.id
  AND n.type = 'assistance';

INSERT INTO public.announcements (
  id,
  title,
  body,
  image_url,
  created_by,
  created_by_role,
  target_audience,
  category,
  is_published,
  created_at
)
SELECT
  n.id,
  COALESCE(NULLIF(n.title, ''), 'Announcement'),
  COALESCE(n.body, ''),
  n.image_url,
  n.created_by,
  p.role,
  'it_support',
  'Announcement',
  true,
  n.created_at
FROM public.notifications n
LEFT JOIN public.profiles p ON p.id = n.created_by
WHERE n.type = 'assistance'
  AND n.announcement_id IS NULL
  AND n.target_role = 'it_support'
  AND n.recipient_id IS NULL
  AND n.message_id IS NULL
  AND n.conversation_id IS NULL
  AND COALESCE(n.title, '') NOT IN (
    'New assistance request',
    'Assistance request received',
    'Assistance request updated',
    'Assistance request resolved'
  )
ON CONFLICT (id) DO NOTHING;

UPDATE public.notifications n
SET
  type = 'announcement',
  announcement_id = n.id
WHERE n.type = 'assistance'
  AND n.announcement_id IS NULL
  AND n.target_role = 'it_support'
  AND n.recipient_id IS NULL
  AND n.message_id IS NULL
  AND n.conversation_id IS NULL
  AND COALESCE(n.title, '') NOT IN (
    'New assistance request',
    'Assistance request received',
    'Assistance request updated',
    'Assistance request resolved'
  )
  AND EXISTS (
    SELECT 1
    FROM public.announcements a
    WHERE a.id = n.id
  );

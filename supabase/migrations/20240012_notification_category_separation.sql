-- ============================================================
-- Keep message and Assistance notification categories separate
-- ============================================================

DO $$
DECLARE
  constraint_name text;
BEGIN
  FOR constraint_name IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'notifications'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%type%'
  LOOP
    EXECUTE format('ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS %I', constraint_name);
  END LOOP;
END $$;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('announcement', 'event', 'message', 'assistance', 'system'));

UPDATE public.notifications
SET type = 'message'
WHERE message_id IS NOT NULL
  OR (
    conversation_id IS NOT NULL
    AND title = 'New Message'
  );

UPDATE public.notifications
SET type = 'assistance'
WHERE type <> 'message'
  AND (
    target_role = 'it_support'
    OR title IN (
      'New assistance request',
      'Assistance request received',
      'Assistance request updated',
      'Assistance request resolved'
    )
  );

WITH ranked_message_notifications AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY message_id, recipient_id
      ORDER BY created_at DESC, id DESC
    ) AS duplicate_rank
  FROM public.notifications
  WHERE message_id IS NOT NULL
    AND recipient_id IS NOT NULL
)
DELETE FROM public.notifications n
USING ranked_message_notifications ranked
WHERE n.id = ranked.id
  AND ranked.duplicate_rank > 1;

CREATE UNIQUE INDEX IF NOT EXISTS notifications_message_recipient_unique
  ON public.notifications(message_id, recipient_id)
  WHERE message_id IS NOT NULL
    AND recipient_id IS NOT NULL;

DROP POLICY IF EXISTS "Assistance notifications insert" ON public.notifications;

CREATE POLICY "Assistance notifications insert"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    type = 'assistance'
    AND public.current_user_status() = 'approved'
    AND (
      target_role = 'it_support'
      OR recipient_id = auth.uid()
      OR public.is_it_support_user()
    )
  );

CREATE OR REPLACE FUNCTION public.create_message_notifications(p_message_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  message_row public.messages;
  sender_name text;
  conversation_title text;
  is_group_chat boolean;
  recipient record;
BEGIN
  SELECT *
  INTO message_row
  FROM public.messages
  WHERE id = p_message_id;

  IF message_row.id IS NULL THEN
    RETURN;
  END IF;

  SELECT COALESCE(NULLIF(full_name, ''), email, 'Someone')
  INTO sender_name
  FROM public.profiles
  WHERE id = message_row.sender_id;

  SELECT title, is_group
  INTO conversation_title, is_group_chat
  FROM public.conversations
  WHERE id = message_row.conversation_id;

  FOR recipient IN
    SELECT cm.user_id
    FROM public.conversation_members cm
    JOIN public.profiles p ON p.id = cm.user_id
    WHERE cm.conversation_id = message_row.conversation_id
      AND cm.user_id <> message_row.sender_id
      AND p.status = 'approved'
  LOOP
    INSERT INTO public.notifications (
      title,
      body,
      type,
      recipient_id,
      sender_id,
      created_by,
      conversation_id,
      message_id,
      target_role
    )
    VALUES (
      'New Message',
      COALESCE(sender_name, 'Someone') || ' sent a message' ||
        CASE
          WHEN is_group_chat THEN ' in ' || COALESCE(NULLIF(conversation_title, ''), 'a group conversation')
          ELSE ''
        END || '.',
      'message',
      recipient.user_id,
      message_row.sender_id,
      message_row.sender_id,
      message_row.conversation_id,
      message_row.id,
      NULL
    )
    ON CONFLICT (message_id, recipient_id)
      WHERE message_id IS NOT NULL
        AND recipient_id IS NOT NULL
      DO NOTHING;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_message_notifications(uuid) TO authenticated;

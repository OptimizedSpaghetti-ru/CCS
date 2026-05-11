-- ============================================================
-- Message notification rows for conversation recipients
-- ============================================================

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS sender_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS notifications_message_id_idx
  ON public.notifications(message_id);

CREATE INDEX IF NOT EXISTS notifications_conversation_id_idx
  ON public.notifications(conversation_id);

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
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_message_notifications(uuid) TO authenticated;

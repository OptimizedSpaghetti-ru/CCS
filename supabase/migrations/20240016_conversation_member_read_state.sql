ALTER TABLE public.conversation_members
  ADD COLUMN IF NOT EXISTS last_read_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_conversation_members_user_read
  ON public.conversation_members (user_id, conversation_id, last_read_at);

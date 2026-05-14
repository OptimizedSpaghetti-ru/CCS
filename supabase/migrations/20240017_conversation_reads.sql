CREATE TABLE IF NOT EXISTS public.conversation_reads (
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  last_read_message_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_reads_user_updated
  ON public.conversation_reads (user_id, updated_at DESC);

ALTER TABLE public.conversation_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own conversation read state" ON public.conversation_reads;
CREATE POLICY "Users read own conversation read state"
  ON public.conversation_reads
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own conversation read state" ON public.conversation_reads;
CREATE POLICY "Users insert own conversation read state"
  ON public.conversation_reads
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.conversation_members cm
      WHERE cm.conversation_id = conversation_reads.conversation_id
        AND cm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users update own conversation read state" ON public.conversation_reads;
CREATE POLICY "Users update own conversation read state"
  ON public.conversation_reads
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

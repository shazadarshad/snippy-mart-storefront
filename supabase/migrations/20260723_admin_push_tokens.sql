-- Device tokens for Snippy Admin native APK (Capacitor + FCM).
-- Web/PWA admin is unchanged; this only stores push targets for the Android app.

CREATE TABLE IF NOT EXISTS public.admin_push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text NOT NULL DEFAULT 'android',
  device_label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_push_tokens_token_unique UNIQUE (token)
);

CREATE INDEX IF NOT EXISTS admin_push_tokens_user_id_idx ON public.admin_push_tokens (user_id);

ALTER TABLE public.admin_push_tokens ENABLE ROW LEVEL SECURITY;

-- Admins manage only their own tokens
DROP POLICY IF EXISTS "Admins manage own push tokens" ON public.admin_push_tokens;
CREATE POLICY "Admins manage own push tokens"
  ON public.admin_push_tokens
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Service role (edge functions) bypasses RLS by default.

COMMENT ON TABLE public.admin_push_tokens IS
  'FCM tokens for Snippy Admin Capacitor APK. Does not affect storefront or web admin UX.';

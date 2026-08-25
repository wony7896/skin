ALTER TABLE "public"."user_consents" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_consents_owner" ON "public"."user_consents" FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 참조/공용 데이터: 전체 조회 허용, 쓰기는 service_role만 (RLS는 켜두되 별도 쓰기 정책 없음)
ALTER TABLE "public"."ingredients" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ingredients_public_read" ON "public"."ingredients" FOR SELECT USING (true);

ALTER TABLE "public"."medications" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "medications_public_read" ON "public"."medications" FOR SELECT USING (true);

ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_public_read" ON "public"."products" FOR SELECT USING (true);

ALTER TABLE "public"."product_ingredients" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_ingredients_public_read" ON "public"."product_ingredients" FOR SELECT USING (true);

-- 사용자 소유 데이터: 본인 행만 조회/작성/수정/삭제 가능
ALTER TABLE "public"."skin_profiles" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "skin_profiles_owner" ON "public"."skin_profiles" FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE "public"."excluded_ingredients" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "excluded_ingredients_owner" ON "public"."excluded_ingredients" FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE "public"."trouble_reports" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trouble_reports_owner" ON "public"."trouble_reports" FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE "public"."user_medications" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_medications_owner" ON "public"."user_medications" FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE "public"."recommendations" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recommendations_owner" ON "public"."recommendations" FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE "public"."usage_feedback" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usage_feedback_owner" ON "public"."usage_feedback" FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

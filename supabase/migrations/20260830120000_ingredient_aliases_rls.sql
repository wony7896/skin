-- ingredient_aliases 는 참조/공용 데이터(성분 별칭 사전)인데, baseline 스쿼시
-- (20260101000000_baseline_schema.sql)에서 RLS 설정이 누락됐다. 원본 drizzle
-- 마이그레이션(0009_furry_network.sql)도 이 테이블에 RLS 를 켜지 않았다.
--
-- 운영 프로젝트(ocjsoichnjmihpsainjd)에는 이후 RLS 가 켜져 있어 baseline 과 어긋난
-- 상태였고, 개발 프로젝트/로컬은 RLS 가 꺼진 채라 anon 키로 PostgREST 를 통해
-- 전체 읽기·쓰기가 노출됐다.
--
-- 다른 참조 테이블(ingredients, products, product_ingredients, medications)과
-- 동일한 패턴으로 맞춘다: RLS on + 공개 읽기, 쓰기는 정책 없음(service_role 만).
-- 재실행/양쪽(dev·운영) 모두 안전하도록 idempotent 하게 작성.

ALTER TABLE "public"."ingredient_aliases" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ingredient_aliases_public_read" ON "public"."ingredient_aliases";
CREATE POLICY "ingredient_aliases_public_read" ON "public"."ingredient_aliases"
  FOR SELECT USING (true);

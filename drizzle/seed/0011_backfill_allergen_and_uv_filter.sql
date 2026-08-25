-- 정확한 향료 알레르겐(Annex III entry 45, 67~92 — 2005년부터 시행된 "고전 24종" 목록)과
-- 자외선차단 성분(Function="UV FILTER" 또는 "UV ABSORBER") 플래그를 큐레이션 성분에 백필한다.
UPDATE ingredients i
SET is_known_fragrance_allergen = true
FROM ingredient_ref.cosing_ingredients r
WHERE lower(i.inci_name) = lower(r.inci_name)
  AND r.restriction ~ '\yIII\y\s*/\s*(45|6[7-9]|[7-8][0-9]|9[0-2])\M';

UPDATE ingredients i
SET is_uv_filter = true
FROM ingredient_ref.cosing_ingredients r
WHERE lower(i.inci_name) = lower(r.inci_name)
  AND (r.functions @> ARRAY['UV FILTER'] OR r.functions @> ARRAY['UV ABSORBER']);

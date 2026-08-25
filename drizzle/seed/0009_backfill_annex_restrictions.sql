-- 큐레이션된 38개 성분(초기 시드, ingredient_ref 도입 이전)에는 restriction/is_eu_prohibited가
-- 채워져 있지 않았다. ingredient_ref.cosing_ingredients와 대소문자 무시로 대조해 백필한다.
UPDATE ingredients i
SET restriction = r.restriction
FROM ingredient_ref.cosing_ingredients r
WHERE lower(i.inci_name) = lower(r.inci_name)
  AND r.restriction IS NOT NULL AND r.restriction != '';

UPDATE ingredients
SET is_eu_prohibited = true
WHERE restriction ~ '\yII\y\s*/';

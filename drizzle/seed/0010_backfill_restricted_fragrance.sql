-- 큐레이션된 성분들 중 EU CosIng에서 Function="PERFUMING" + Annex III(사용 제한) 대상인
-- 것을 대소문자 무시로 대조해 is_restricted_fragrance를 백필한다.
UPDATE ingredients i
SET is_restricted_fragrance = true
FROM ingredient_ref.cosing_ingredients r
WHERE lower(i.inci_name) = lower(r.inci_name)
  AND r.functions @> ARRAY['PERFUMING']
  AND r.restriction ~ '\yIII\y\s*/';

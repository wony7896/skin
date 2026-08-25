-- 큐레이션된 성분들 중 EU CosIng에서 Function="PRESERVATIVE"인 것을 대소문자 무시로
-- 대조해 is_approved_preservative를 백필한다. isUvFilter와 같은 이유로 Annex V restriction
-- 번호가 아니라 Function 태그를 기준으로 판정한다(스냅샷 이후 승인된 보존제도 놓치지 않기 위함).
UPDATE ingredients i
SET is_approved_preservative = true
FROM ingredient_ref.cosing_ingredients r
WHERE lower(i.inci_name) = lower(r.inci_name)
  AND r.functions @> ARRAY['PRESERVATIVE'];

-- 성분 별칭 시드 — 지역별 라벨링 관행 차이 또는 업계에서 사실상 동일하게 통용되는
-- 이름만 등록한다. "같은 카테고리의 여러 물질 중 하나"(예: AHA, SD Alcohol 40)는
-- 실제로는 서로 다른 물질일 수 있어 의도적으로 제외했다 — 잘못된 별칭 하나가
-- 안전 제외 로직을 조용히 오작동시킬 수 있기 때문에, 확신이 없는 건 넣지 않는다.

INSERT INTO ingredient_aliases (ingredient_id, alias)
SELECT id, alias FROM ingredients, (VALUES
  -- 미국 라벨은 "Fragrance"로, EU/KR은 INCI "Parfum"으로 표기하는 동일 개념
  ('Parfum', 'Fragrance'),
  ('Parfum', 'Perfume'),
  -- 흔한 관용명 ↔ 정확한 INCI명 (동일 물질)
  ('Ascorbic Acid', 'Vitamin C'),
  ('Tocopherol', 'Vitamin E'),
  ('Niacinamide', 'Vitamin B3'),
  ('Panthenol', 'Vitamin B5'),
  ('Panthenol', 'Provitamin B5'),
  ('Retinol', 'Vitamin A'),
  ('Melaleuca Alternifolia (Tea Tree) Leaf Oil', 'Tea Tree Oil'),
  ('Glycerin', 'Glycerine'),
  ('Glycerin', 'Glycerol'),
  ('Ceramide NP', 'Ceramide 3'),
  ('Salicylic Acid', 'BHA'),
  ('Copper Tripeptide-1', 'GHK-Cu'),
  ('Centella Asiatica Extract', 'Cica'),
  ('Panax Ginseng Root Extract', 'Ginseng Extract'),
  ('Methylisothiazolinone', 'MIT'),
  ('Mentha Piperita (Peppermint) Oil', 'Peppermint Oil'),
  ('Alcohol Denat.', 'Denatured Alcohol')
) AS aliases(inci_name, alias)
WHERE ingredients.inci_name = aliases.inci_name
ON CONFLICT (alias) DO NOTHING;

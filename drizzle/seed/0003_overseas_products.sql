-- Phase 3 국가 필터 검증용 해외 테스트/플레이스홀더 제품. 실제 아마존·iHerb 제휴 연동 전까지
-- country 필터링 로직을 검증하기 위한 목적으로만 존재한다. external_url은 실재하지 않는 placeholder.
INSERT INTO "public"."products" ("name", "brand", "category", "retailer", "country", "external_url") VALUES
  ('[해외테스트] Vitamin C Brightening Serum', 'OverseasTestBrand', 'essence_serum', 'iHerb', 'US', 'https://example.com/placeholder/overseas-1'),
  ('[해외테스트] Hyaluronic Acid Moisturizer', 'OverseasTestBrand', 'cream_lotion', 'Amazon', 'US', 'https://example.com/placeholder/overseas-2'),
  ('[해외테스트] Retinol Night Cream', 'OverseasTestBrand', 'cream_lotion', 'iHerb', 'US', 'https://example.com/placeholder/overseas-3');

INSERT INTO "public"."product_ingredients" ("product_id", "ingredient_id", "position")
SELECT p.id, i.id, x.position
FROM (VALUES
  ('[해외테스트] Vitamin C Brightening Serum', 'Ascorbic Acid', 1),
  ('[해외테스트] Vitamin C Brightening Serum', 'Niacinamide', 2),
  ('[해외테스트] Vitamin C Brightening Serum', 'Glycerin', 3),

  ('[해외테스트] Hyaluronic Acid Moisturizer', 'Hyaluronic Acid', 1),
  ('[해외테스트] Hyaluronic Acid Moisturizer', 'Glycerin', 2),
  ('[해외테스트] Hyaluronic Acid Moisturizer', 'Panthenol', 3),

  ('[해외테스트] Retinol Night Cream', 'Retinol', 1),
  ('[해외테스트] Retinol Night Cream', 'Squalane', 2),
  ('[해외테스트] Retinol Night Cream', 'Dimethicone', 3)
) AS x(product_name, inci_name, position)
JOIN "public"."products" p ON p.name = x.product_name
JOIN "public"."ingredients" i ON i.inci_name = x.inci_name;

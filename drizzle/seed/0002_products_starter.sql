-- 테스트/플레이스홀더 제품 데이터. 실제 제품 카탈로그 연동(쿠팡/올리브영 등 크롤링·제휴 API) 전까지
-- 이벤트 리포트 → 성분 자동 승격 파이프라인을 검증하기 위한 목적으로만 존재한다.
-- external_url은 실재하지 않는 placeholder이며, 실제 판매 링크가 아니다.
INSERT INTO "public"."products" ("name", "brand", "category", "retailer", "external_url") VALUES
  ('[테스트] 아미노산 클렌징폼', '테스트브랜드', 'cleansing', '테스트', 'https://example.com/placeholder/1'),
  ('[테스트] 저자극 클렌징 워터', '테스트브랜드', 'cleansing', '테스트', 'https://example.com/placeholder/2'),
  ('[테스트] 진정 토너', '테스트브랜드', 'toner', '테스트', 'https://example.com/placeholder/3'),
  ('[테스트] 비타민C 세럼', '테스트브랜드', 'essence_serum', '테스트', 'https://example.com/placeholder/4'),
  ('[테스트] 트러블 세럼', '테스트브랜드', 'essence_serum', '테스트', 'https://example.com/placeholder/5'),
  ('[테스트] 세라마이드 크림', '테스트브랜드', 'cream_lotion', '테스트', 'https://example.com/placeholder/6'),
  ('[테스트] 선크림', '테스트브랜드', 'sunscreen_spot', '테스트', 'https://example.com/placeholder/7'),
  ('[테스트] 향기로운 바디로션', '테스트브랜드', 'cream_lotion', '테스트', 'https://example.com/placeholder/8');

INSERT INTO "public"."product_ingredients" ("product_id", "ingredient_id", "position")
SELECT p.id, i.id, x.position
FROM (VALUES
  ('[테스트] 아미노산 클렌징폼', 'Sodium Cocoyl Isethionate', 1),
  ('[테스트] 아미노산 클렌징폼', 'Cocamidopropyl Betaine', 2),
  ('[테스트] 아미노산 클렌징폼', 'Glycerin', 3),
  ('[테스트] 아미노산 클렌징폼', 'Panthenol', 4),

  ('[테스트] 저자극 클렌징 워터', 'Cocamidopropyl Betaine', 1),
  ('[테스트] 저자극 클렌징 워터', 'Butylene Glycol', 2),
  ('[테스트] 저자극 클렌징 워터', 'Glycerin', 3),
  ('[테스트] 저자극 클렌징 워터', 'Parfum', 4),

  ('[테스트] 진정 토너', 'Panthenol', 1),
  ('[테스트] 진정 토너', 'Allantoin', 2),
  ('[테스트] 진정 토너', 'Centella Asiatica Extract', 3),
  ('[테스트] 진정 토너', 'Butylene Glycol', 4),

  ('[테스트] 비타민C 세럼', 'Ascorbic Acid', 1),
  ('[테스트] 비타민C 세럼', 'Niacinamide', 2),
  ('[테스트] 비타민C 세럼', 'Glycerin', 3),
  ('[테스트] 비타민C 세럼', 'Tocopherol', 4),

  ('[테스트] 트러블 세럼', 'Salicylic Acid', 1),
  ('[테스트] 트러블 세럼', 'Melaleuca Alternifolia (Tea Tree) Leaf Oil', 2),
  ('[테스트] 트러블 세럼', 'Panthenol', 3),
  ('[테스트] 트러블 세럼', 'Alcohol Denat.', 4),

  ('[테스트] 세라마이드 크림', 'Ceramide NP', 1),
  ('[테스트] 세라마이드 크림', 'Squalane', 2),
  ('[테스트] 세라마이드 크림', 'Hyaluronic Acid', 3),
  ('[테스트] 세라마이드 크림', 'Dimethicone', 4),

  ('[테스트] 선크림', 'Titanium Dioxide', 1),
  ('[테스트] 선크림', 'Zinc Oxide', 2),
  ('[테스트] 선크림', 'Ethylhexyl Methoxycinnamate', 3),
  ('[테스트] 선크림', 'Glycerin', 4),

  ('[테스트] 향기로운 바디로션', 'Parfum', 1),
  ('[테스트] 향기로운 바디로션', 'Limonene', 2),
  ('[테스트] 향기로운 바디로션', 'Linalool', 3),
  ('[테스트] 향기로운 바디로션', 'Glycerin', 4)
) AS x(product_name, inci_name, position)
JOIN "public"."products" p ON p.name = x.product_name
JOIN "public"."ingredients" i ON i.inci_name = x.inci_name;

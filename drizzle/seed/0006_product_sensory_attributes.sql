-- 취향(향·제형) 매칭 검증용 테스트 제품 속성 백필. 실제 성분 구성(product_ingredients)에
-- 근거해 값을 매겼다 — 예: Parfum이 있으면 fragrance_level을 none이 아닌 값으로.
UPDATE products SET fragrance_level = 'none', texture = 'light' WHERE name = '[테스트] 아미노산 클렌징폼';
UPDATE products SET fragrance_level = 'light', texture = 'light' WHERE name = '[테스트] 저자극 클렌징 워터';
UPDATE products SET fragrance_level = 'none', texture = 'light' WHERE name = '[테스트] 진정 토너';
UPDATE products SET fragrance_level = 'none', texture = 'medium' WHERE name = '[테스트] 비타민C 세럼';
UPDATE products SET fragrance_level = 'light', texture = 'light' WHERE name = '[테스트] 트러블 세럼';
UPDATE products SET fragrance_level = 'none', texture = 'rich' WHERE name = '[테스트] 세라마이드 크림';
UPDATE products SET fragrance_level = 'strong', texture = 'rich' WHERE name = '[테스트] 향기로운 바디로션';
UPDATE products SET fragrance_level = 'none', texture = 'medium' WHERE name = '[테스트] 선크림';
UPDATE products SET fragrance_level = 'none', texture = 'medium' WHERE name = '[해외테스트] Vitamin C Brightening Serum';
UPDATE products SET fragrance_level = 'none', texture = 'medium' WHERE name = '[해외테스트] Hyaluronic Acid Moisturizer';
UPDATE products SET fragrance_level = 'none', texture = 'rich' WHERE name = '[해외테스트] Retinol Night Cream';

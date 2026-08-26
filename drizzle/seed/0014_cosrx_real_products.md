# 실제 제품 데이터 (COSRX 공식몰)

- **출처**: https://www.cosrx.com — 로그인 없이 공개된 제품 페이지를 브라우저로 직접 열어
  이름·이미지·가격·전성분을 그대로 옮겼다(자동 대량 스크래핑이 아니라 7개 제품을 하나씩
  수동으로 확인). 이미지는 사이트의 실제 Shopify CDN 파일(`{width}` 템플릿을 800px로 치환).
  전성분은 각 페이지의 "Full Ingredients"/"Ingredient List" 섹션에서 그대로 복사했다.
- **국가 태그**: `country = 'US'`로 넣었다 — cosrx.com은 USD로 가격이 매겨진 글로벌/미국
  스토어프론트라, 실제로 그렇게 표기하는 게 정확하다. 추천 페이지 기본값은 국내(KR)만
  보여주므로, 이 제품들은 `?intl=1` 국제 토글을 켜야 보인다.
- **카테고리 5개 전부 포함**: 클렌징(Low pH Good Morning Gel Cleanser), 토너(AHA/BHA
  Clarifying Treatment Toner), 에센스/세럼(Advanced Snail 96 Mucin Power Essence,
  The Niacinamide 15 Serum), 크림/로션(Advanced Snail 92 All In One Cream, The Retinol
  0.3 Cream), 선크림(Aloe Soothing Sun Cream SPF50 PA+++).
- **적용 스크립트**: `drizzle/seed/scripts/insert_cosrx_real_products.mjs` — 각 제품의
  전성분 문자열을 `", "`(콤마+공백) 기준으로 분리해(내부에 콤마가 있는 "1,2-Hexanediol" 같은
  이름이 깨지지 않도록) resolveIngredientId()와 동일한 로직으로 하나씩 해석했다.
- **버그 하나 잡음**: 최초 시도에서 단순 `","` 분리를 썼다가 "1,2-Hexanediol"이 "1"과
  "2-Hexanediol"로 깨지는 걸 발견 — 실제 DB에 가비지 행이 생기진 않았지만(매칭 실패로
  조용히 스킵됨) 데이터가 불완전했다. 전체를 지우고 분리 로직을 고쳐 다시 넣었다.
- **"Water" 별칭 추가**: 우리 참조 데이터는 INCI 정식 명칭인 "Aqua"만 갖고 있어서, 미국
  라벨에 흔한 "Water" 표기가 매칭되지 않았다. "Water"·"Aqua/Water"를 "Aqua"의 별칭으로
  등록해 앞으로 들어올 모든 제품에도 영구적으로 적용되게 했다.
- **매칭 안 된 성분들**: 일부 흔치 않은 식물성 오일·추출물(예: Limnanthes Alba (Meadowfoam)
  Seed Oil, Daucus Carota Sativa (Carrot) Root Extract)은 우리 24,094건 참조 데이터에
  없어서 매칭되지 않았다 — 버그가 아니라 참조 사전의 실제 커버리지 한계다.
- **실제 검증**: 민감 피부 테스트 프로필로 로그인해 실제 `/recommendations?intl=1` 페이지에서
  확인 — Niacinamide 15 Serum이 "목표(미백·톤업)에 맞는 나이아신아마이드 함유", Retinol 0.3
  Cream이 두 목표(주름·탄력 + 미백) 동시 매칭 + 농도 추정 문구, Aloe Soothing Sun Cream이
  실제 리모넨 함유로 "EU 지정 향료 알레르겐" 감점까지 전부 올바르게 표시됨을 확인했다.

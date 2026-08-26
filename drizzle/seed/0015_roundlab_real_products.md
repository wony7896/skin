# 실제 제품 데이터 (Round Lab 공식몰)

- **출처**: https://roundlab.com — COSRX와 같은 방식으로, 로그인 없이 공개된 제품 페이지를
  하나씩 직접 열어 이름·이미지·전성분을 그대로 옮겼다(5개 제품, 5개 카테고리 전부).
- **다른 브랜드 시도 중 스킵한 것들** (참고용 기록):
  - **Beauty of Joseon 한국 도메인**(beautyofjoseon.co.kr) — 실제 한국 도메인으로 정상
    리다이렉트됐지만, 상품 상세 페이지 본문이 거의 전부 이미지(디테일컷)로 돼 있어
    텍스트로 전성분을 추출할 수 없었다. 억지로 추측해 채우지 않고 스킵.
  - **Anua 공식몰**(anua.com) — "Full Ingredients" 섹션은 있었지만, 원문 자체에 OCR로
    보이는 오타가 있었다(예: "Alky1 Acrylate"의 l→1, "UImus"의 l→I, "1,2-He xanediol"처럼
    단어 중간에 공백 삽입). 브랜드 사이트 원문 자체의 품질 문제라 그대로 못 쓰고 스킵했다 —
    이런 오타를 넣으면 우리 참조사전과 매칭이 안 되거나(안전할 수도 있지만), 운 나쁘게
    다른 성분과 우연히 일치하면 잘못된 데이터가 될 위험이 있었다.
- **적용 스크립트**: `drizzle/seed/scripts/insert_roundlab_real_products.mjs` — COSRX 때와
  동일한 로직(`", "` 분리 + resolveIngredientId 캐스케이드).
- **매칭률**: 15/16, 37/38, 36/40, 40/42, 64/64 — 나머지는 우리 24,094건 참조사전에 없는
  희귀 식물 추출물들(예: Avena Sativa (Oat) Kernel Extract)로, 버그가 아니라 커버리지 한계.
- **실제 검증**: `/recommendations?intl=1`에서 5개 카테고리 전부 실제 썸네일로 노출 확인,
  Birch Moisturizing Serum이 수분·보습 + 미백 두 목표 동시 매칭(아스코빅애씨드 중간 함량
  추정)까지 정상 작동 확인.

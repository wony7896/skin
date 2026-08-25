# 2023년 향료 알레르겐 추가분 (Regulation (EU) 2023/1545)

- **원본**: Commission Regulation (EU) 2023/1545 of 26 July 2023, OJ L 188/1, 27.7.2023 —
  Annex III(화장품 규정 (EC) No 1223/2009)의 향료 알레르겐 개별표기 의무 목록을 24종 → 80여
  종으로 확장한 규정.
- **접근 경로**: EUR-Lex(`eur-lex.europa.eu`)는 `curl`/WebFetch 모두 AWS WAF 봇 챌린지에
  막혀 원문을 가져올 수 없었다 — 실제 브라우저 세션(Claude Browser 도구)으로 접속하니
  JS 챌린지를 통과해 원문 HTML을 그대로 읽을 수 있었다. 2차 소스(컴플라이언스 업체
  블로그 등)는 이성질체별 CAS 번호가 서로 달라 신뢰도가 낮아 사용하지 않았다.
- **적용 방법**: `drizzle/seed/scripts/apply_2023_1545_allergens.mjs` — 규정 Annex의
  "the following entries are added"(entry 327~371, 신설)에 담긴 "Name of Common
  Ingredients Glossary" 이름과 CAS 번호를 그대로 옮겨 담은 배열을 기준으로:
  - 같은 이름의 행이 `ingredient_ref.cosing_ingredients`에 이미 있고 restriction이
    비어 있으면 → 그 행에 restriction("III/{entry}")과 PERFUMING 기능만 추가(UPDATE)
  - 같은 이름의 행이 없으면 → 새 행 INSERT
  - 같은 이름의 행이 있는데 restriction에 **이미 다른 값**이 들어있으면 → 건드리지 않고
    건너뜀(스킵)
  최종 결과: 8개 신규 삽입, 67개 기존 행 보강, 0개 스킵(문제 되는 2개는 아래 참고).
- **의도적으로 제외한 2건**: "Laurus Nobilis Leaf Oil"(entry 359), "Citrus Limon Peel
  Oil"(entry 353) — 두 이름 모두 우리 2016년 스냅샷에 이미 **완전히 다른 규제**(Annex II
  전면 금지, 씨앗 추출유 한정/광독성 제한)가 붙어 있어서, 그 필드를 건드리면 더 안전에
  직결되는 금지 플래그를 훼손할 위험이 있었다. 두 실제 INCI명 다 향료 알레르겐이기도
  하지만, 이번엔 반영하지 않았다 — 코드 주석(`src/lib/ingredients.ts`)에도 명시해둠.
- **196번(Lippia citriodora absolute)도 정규식에서 제외**: 우리 2016년 데이터에 이미
  "III/196"이 완전히 다른 물질(HC Blue No. 11, 염모제)에 붙어 있어서, 향료 알레르겐
  entry 번호 정규식에 196을 넣으면 그 염모제 성분이 잘못 분류된다. 실제로 HC Blue No. 11이
  향료 알레르겐으로 **잘못** 분류되지 않는지 직접 검증했다.
- **여전히 남은 한계**: entry 45·46·70·73·86·88·109·114·122·124·131·133·154·157·175·196·324는
  "replaced"(기존 항목 갱신) 목록인데, 이 중 몇몇(46, 109, 114 등)은 2016년 스냅샷에 이미
  있던 값과 CAS가 일치해 안전하게 보강했지만, 정말 세밀하게 보면 각 항목의 세부 조건
  (제품 유형별 최대 농도 등)까지는 반영하지 않았다 — 지금 시스템은 "이 성분이 알레르겐인가
  아닌가"만 boolean으로 판단하고, 몇 %부터 표기 의무인지 같은 정량 규정은 다루지 않는다.

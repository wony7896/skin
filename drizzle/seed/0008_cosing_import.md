# ingredient_ref.cosing_ingredients 데이터 출처

- **원본**: EU 집행위 공식 CosIng "Ingredients/Fragrance Inventory" (Regulation (EC) No 1223/2009 기반).
  스냅샷 시점 2016-02-15 — 이후 추가·개정된 성분은 반영돼 있지 않을 수 있다.
- **직접 소스**: https://github.com/openfoodfacts/openbeautyfacts (Open Beauty Facts 프로젝트가
  보관 중인 EU 공식 원본 CSV 미러) — `cosing/COSING_Ingredients-Fragrance.Inventory_v2.csv`
- **필드**: COSING Ref No, INCI name, INN name, Ph. Eur. Name, CAS No, EINECS/ELINCS No,
  Chem/IUPAC Name/Description, Restriction, **Function**(콤마로 여러 개 나열, 예:
  "HUMECTANT, SKIN CONDITIONING, SKIN PROTECTING"), Update Date — 원본 그대로 보관.
  적재 후 SQL로 Function을 배열(`functions`)로 기계적으로 분해해뒀다(문자열 split일 뿐,
  판단이 들어가는 가공이 아니다).
- **적재 방법**: `curl`로 원본 CSV를 그대로 받은 뒤, 앞의 메타데이터 5줄(파일 생성일 등 비-CSV
  프리앰블)을 제거하고, RFC4180 규격을 지키는 직접 작성한 파서로 파싱해 배치 INSERT.
  일부 행(30개, 전체의 0.12%)은 원본 자체에 필드 구분이 깨져 있어(예: CAS/EC 번호를
  " / " 대신 콤마로 나열) 10개 컬럼에 맞지 않았고, 추측으로 고치지 않고 스킵했다 — 잘못
  추측해 고치는 것보다 정직하게 빼는 쪽이 안전하다. 최종 24,094행 적재, Function 정보 보유
  23,860행, CAS번호 보유 대다수.
- **없는 정보**: 한글명. Function 필드가 있긴 하지만 "SKIN CONDITIONING"처럼 매우 광범위한
  태그가 많아, 이것만으로 "이 성분이 수분·보습 목표에 맞다"처럼 사이트 특정 목표에 직접
  연결하기엔 부족하다 — 그 판단은 여전히 `public.ingredients`의 큐레이션 데이터(목표 매칭용
  액티브 목록, 자극 성분 분류)로만 한다.
- **역할**: 참조 전용 사전. 추천 스코어링은 여기를 직접 읽지 않고, `resolveIngredientId()`
  (src/lib/ingredients.ts)가 새 제품의 성분을 등록할 때만 조회해 `public.ingredients`에
  필요한 만큼만 정식 행으로 복사한다.
- **최신화**: 스냅샷이라 자동으로 갱신되지 않는다. 주기적으로 같은 방식(재다운로드 + 파싱 +
  배치 INSERT)으로 갱신이 필요하다.

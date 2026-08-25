# ingredient_ref.cosing_ingredients 데이터 출처

- **원본**: EU 집행위 공식 CosIng(화장품 성분 데이터베이스), Regulation (EC) No 1223/2009 기반
- **직접 소스**: https://github.com/beauteeru/cosmetic-ingredients-dataset (MIT License) — CosIng을
  INCI명(name)/COSING ID(substance_id)/CAS번호(cas_no)/EC번호(ec_no)/PubChem CID·URL로 재정리한 CSV
- **적재 방법**: `curl`로 원본 CSV를 그대로 다운로드한 뒤, `postgres`(porsager) 드라이버의
  `COPY ... FROM STDIN`으로 파일을 바이트 단위 그대로 적재 — 사람이나 모델이 값을 옮겨 적는
  과정이 없어 표기·기억 오류가 섞이지 않는다. 2026-08-25 기준 28,354행, CAS번호 보유 18,055행.
- **없는 정보**: 한글명, 성분 기능 분류(보습제/방부제/자외선차단제 등), 자극·알레르기 유발 여부.
  이런 정보가 필요한 목표 매칭·자극 성분 판단은 계속 `public.ingredients`의 큐레이션 데이터로만 한다.
- **역할**: 이 표는 참조 전용 사전이다. 실제 추천 스코어링은 여기를 직접 읽지 않고,
  `resolveIngredientId()`(src/lib/ingredients.ts)가 새 제품의 성분을 등록할 때만 이 표를 조회해
  `public.ingredients`에 필요한 만큼만 정식 행으로 복사한다.
- **최신화**: 이 CSV는 어느 시점의 스냅샷이며 CosIng 원본이 갱신돼도 자동으로 따라가지 않는다.
  주기적으로 같은 방식(재다운로드 + COPY)으로 갱신이 필요하다.

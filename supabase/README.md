# Supabase — 로컬 개발 & 마이그레이션

## 환경 3단계

| 환경 | DB | 접속 |
|---|---|---|
| local | `supabase start`로 뜨는 로컬 스택 (Docker 필요) | `.env.local` |
| staging | 별도 Supabase 프로젝트 (권장) | CI/Vercel Preview 시크릿 |
| prod | `ocjsoichnjmihpsainjd` | 배포 파이프라인만 |

**로컬 개발에 Docker가 없으면** 둘 중 하나:
1. Colima 또는 Docker Desktop 설치 후 `npm run db:start`
2. 무료 dev Supabase 프로젝트를 하나 더 만들어 `.env.local`이 그걸 보게 함 (Docker 불필요, prod와 동일 동작)

## 일상 작업

```bash
npm run db:start      # 로컬 스택 기동 (Studio: http://127.0.0.1:54323)
npm run db:reset      # 마이그레이션 전부 + 시드 재적용 (스키마 꼬였을 때)
# ... src/db/schema/*.ts 수정 ...
npm run db:generate   # drizzle/.generated/ 에 DDL 초안
npm run db:migration add_foo_column   # supabase/migrations/<ts>_add_foo_column.sql 생성 → SQL 붙여넣기
npm run db:reset      # 새 마이그레이션 검증
npm run db:stop
```

RLS·정책·함수는 `db:generate` 건너뛰고 `db:migration`으로 직접 작성.

## 마이그레이션 규칙

- `supabase/migrations/`가 **정본**. 빈 DB에서 순서대로 적용하면 전체 스키마가 재현돼야 한다 (CI가 매 PR 검증).
- `20260101000000_baseline_schema.sql` = 기존 `drizzle/0000~0021`을 스쿼시한 것. 원본은 git 히스토리에 있음.
- 마이그레이션은 되도록 되돌릴 수 있게, 데이터 파괴 변경은 별도 리뷰.

## prod 연결 (최초 1회, 관리자만)

기존 prod에는 이미 baseline과 동일한 스키마가 있으므로, baseline을 "적용됨"으로 표시만 하고 재실행하지 않도록 한다.

```bash
npx supabase login
npx supabase link --project-ref ocjsoichnjmihpsainjd
npx supabase migration repair --status applied 20260101000000
# 검증: 아래가 비어 있어야 함 (로컬 마이그레이션 == prod 스키마)
npx supabase db diff --linked
```

`db diff --linked`가 차이를 뱉으면 baseline이 prod와 어긋난 것 → 그 diff를 새 마이그레이션으로 만들어 정리.

이후 배포 시 prod 반영은 `npx supabase db push` (CI에서 prod 시크릿으로).

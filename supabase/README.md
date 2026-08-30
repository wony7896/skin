# Supabase — 로컬 개발 & 마이그레이션

## Supabase 프로젝트 2개

| 역할 | 프로젝트 | ref | 리전 | 누가 붙나 |
|---|---|---|---|---|
| **개발** | `skin local` | `rhayjzneuvaayervloki` | Seoul (ap-northeast-2) | 로컬 개발 (`.env` / `.env.local`), 로컬 repo 가 `supabase link` 로 연결 |
| **운영** | `skin` | `ocjsoichnjmihpsainjd` | Singapore (ap-southeast-1) | Vercel Production. 마이그레이션은 GitHub Actions 가 적용 |

- 마이그레이션 정본은 `supabase/migrations/`. **개발 프로젝트에서만 수시로 검증**하고, 운영에는 CI 를 거쳐 반영한다.
- **운영 DB 에는 `db reset`·seed 를 절대 실행하지 않는다.** 운영 데이터는 파괴 불가.
- 로컬 Docker 스택(`npm run db:start`)도 여전히 쓸 수 있다 (가장 빠른 이너 루프). 개발 프로젝트는 "Docker 없이 운영과 동일 동작"이 필요할 때의 대안.

### CLI 로그인

이 저장소 작업용 머신에서 `supabase login` 이 토큰을 저장하지 못하면(keychain 문제), 개인 액세스 토큰으로 우회한다:

```bash
# https://supabase.com/dashboard/account/tokens 에서 발급
export SUPABASE_ACCESS_TOKEN=sbp_...
```

## 환경변수

`.env.local` → `.env` 순으로 로드된다 (`.env.local` 우선, Next.js·drizzle-kit 동일). 자세한 형태는 [`.env.example`](../.env.example).

| 변수 | 용도 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 인증(Auth)에만 사용 |
| `DATABASE_URL` | Drizzle 직결 — 앱의 주 데이터 경로 (원격은 6543 풀러 + `?pgbouncer=true`) |

## 일상 작업 (개발 프로젝트 대상)

```bash
npx supabase link --project-ref rhayjzneuvaayervloki   # 최초 1회
npx supabase db push                                   # 마이그레이션 적용
# ... src/db/schema/*.ts 수정 ...
npm run db:generate                                    # drizzle/.generated/ 에 DDL 초안
npm run db:migration add_foo_column                    # supabase/migrations/<ts>_add_foo_column.sql 생성 → SQL 붙여넣기
npx supabase db push                                   # 새 마이그레이션 적용
```

로컬 Docker 스택을 쓸 때:

```bash
npm run db:start      # 로컬 스택 기동 (Studio: http://127.0.0.1:54323)
npm run db:reset      # 마이그레이션 전부 + 시드 재적용 (스키마 꼬였을 때) — 로컬 전용
npm run db:stop
```

RLS·정책·함수는 `db:generate` 건너뛰고 `db:migration` 으로 직접 작성.

## 마이그레이션 규칙

- `supabase/migrations/` 가 **정본**. 빈 DB 에서 순서대로 적용하면 전체 스키마가 재현돼야 한다 (CI `migrations` job 이 매 PR 검증).
- `20260101000000_baseline_schema.sql` = 기존 `drizzle/0000~0021` 을 스쿼시한 것. 원본은 git 히스토리에 있음.
- 마이그레이션은 되도록 되돌릴 수 있게, 데이터 파괴 변경은 별도 리뷰.

## 시드 데이터

`drizzle/seed/` — `.sql`(직접 실행), `.mjs`(스크립트), `.md`(수동 절차 문서)가 섞여 있고 **일괄 러너는 아직 없다**. 재실행 안전(idempotent)하지 않은 파일도 있으므로, 개발 프로젝트에 시드가 필요하면 파일별로 확인 후 적용:

```bash
psql "$DATABASE_URL" -f drizzle/seed/0001_ingredients_starter.sql   # DATABASE_URL 은 세션 풀러(5432) 권장
node drizzle/seed/scripts/<파일>.mjs                                 # DATABASE_URL 필요
```

## 운영 프로젝트 최초 연결 (관리자, 1회)

운영 `skin` 에는 baseline 과 동등한 스키마가 이미 있고, `schema_migrations` 에는 스쿼시 이전의
옛 마이그레이션 기록(`20260823...` ~ `20260828...`)이 들어 있다. baseline 을 재실행하지 않고
"적용됨"으로만 표시한다:

```bash
export SUPABASE_ACCESS_TOKEN=sbp_...
npx supabase link --project-ref ocjsoichnjmihpsainjd
npx supabase migration repair --status applied 20260101000000
# 검증: 아래가 비어 있어야 함 (baseline == 운영 스키마)
npx supabase db diff --linked
```

`db diff --linked` 가 차이를 뱉으면 baseline 이 운영과 어긋난 것 → 그 diff 를 새 마이그레이션으로 만들어 정리.

이후 로컬 repo 는 **개발 프로젝트로 다시 링크**해서 쓴다:

```bash
npx supabase link --project-ref rhayjzneuvaayervloki
```

## 운영 반영 파이프라인

`.github/workflows/deploy-migrations.yml`:

- **PR** 에 `supabase/migrations/**` 변경 → `supabase db push --dry-run` 으로 미리보기
- **main push** → `supabase db push` 로 운영 반영 (`db reset`·seed 없음)

필요한 GitHub Actions Secret (repo Settings → Secrets and variables → Actions):

| Secret | 값 |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | 개인 액세스 토큰 (dashboard/account/tokens) |
| `SUPABASE_DB_PASSWORD` | 운영 프로젝트 DB 비밀번호 |

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 데이터베이스 · 환경

**절대 프로덕션 DB에 직접 붙지 않는다.** 개발은 로컬 스택 또는 별도 dev 프로젝트에서만.

- 스키마 정본: `src/db/schema/*.ts` (타입 쿼리용) + `supabase/migrations/*.sql` (적용 정본)
- 마이그레이션 러너는 **Supabase CLI 하나**. drizzle-kit은 `db:generate`로 DDL 초안만 뽑는 도우미이며 `drizzle/.generated/`(gitignore)에 쓴다 → 필요한 SQL을 `supabase migration new`로 옮긴다.
- RLS·정책·함수·트리거·스토리지는 drizzle을 거치지 않고 `supabase migration new`로 직접 SQL 작성.
- `npm run db:start` (로컬 스택, Docker 필요) → `db:reset`으로 마이그레이션+시드 재적용 → `db:diff`로 변경분 확인 → `db:migration <name>`으로 파일 생성.
- 시드 데이터는 `drizzle/seed/`의 스크립트가 담당 (스키마 마이그레이션과 분리).
- `supabase/migrations/`는 "빈 DB에서 한 번에 전체 스키마 재현"이 항상 성립해야 한다. CI(`migrations` job)가 매 PR에서 이걸 검증한다.

## RLS는 Drizzle 경로에서 우회된다

`src/db/index.ts`가 `DATABASE_URL`(postgres 역할)로 직결하므로 RLS의 `auth.uid()`가 채워지지 않는다. 사용자 소유 데이터의 격리는 전적으로 "모든 서버 코드가 `@/lib/auth`의 `requireUser`/`getSessionUser`로 얻은 `user.id`로 쿼리를 스코프한다"는 규약에 의존한다. 자세한 내용과 대안은 [SECURITY.md](SECURITY.md).

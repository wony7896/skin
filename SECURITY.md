# 데이터 격리 모델 (읽고 시작할 것)

## 핵심: RLS는 Drizzle 경로에서 우회된다

`src/db/index.ts`의 `db`는 `DATABASE_URL`(Postgres `postgres` 역할)로 **직접**
접속한다. 이 경로에는 사용자 JWT가 없어 `auth.uid()`가 `NULL`이고, 따라서
`drizzle/0017_enable_rls.sql` 등에서 켠 **RLS 정책은 서버 액션·서버 컴포넌트의
Drizzle 쿼리에 적용되지 않는다.**

RLS가 실제로 막아주는 경로는:

- 브라우저/서버의 Supabase 클라이언트(`@/lib/supabase/*`)를 통한 PostgREST 접근
- Supabase Storage(`skin-photos` 버킷) 접근
- `supabase.rpc(...)` 호출

## 그래서 규약이 유일한 방어선이다

사용자 소유 데이터(`skin_profiles`, `excluded_ingredients`, `trouble_reports`,
`user_medications`, `recommendations`, `usage_feedback`, `user_consents`)를
다루는 **모든 서버 코드는 반드시:**

1. `@/lib/auth`의 `requireUser()`(페이지·레이아웃) 또는 `getSessionUser()`
   (서버 액션)로 인증된 `user`를 얻고,
2. 모든 읽기/쓰기 쿼리를 `eq(table.userId, user.id)`로 스코프하고,
3. 클라이언트가 넘긴 ID(`recommendationId`, `productId` 등)를 신뢰하기 전에
   그 리소스가 `user.id` 소유인지 별도 쿼리로 확인한다.

한 곳이라도 빠뜨리면 다른 사용자의 데이터가 노출·오염된다. 새 서버 액션은
`getSessionUser()` 호출로 시작하는 것을 기본형으로 삼는다.

## 회원탈퇴

`drizzle/0021_delete_current_user.sql`의 `public.delete_current_user()`는
`security definer` 함수로, `auth.uid()` 본인의 `auth.users` 행만 삭제한다.
`public` 테이블 행은 FK `ON DELETE CASCADE`로 함께 사라진다. Storage 파일은
FK가 없으므로 `deleteAccount` 서버 액션이 먼저 지운다.

## 미적용 마이그레이션 워크플로

`drizzle/0017`~`0021`은 drizzle-kit 저널(`drizzle/meta/_journal.json`)에
포함되지 않은 손수 작성한 SQL이다. `npm run db:migrate`로는 적용되지 않으니
로컬 Supabase에 직접 실행해야 한다:

```bash
psql "$DATABASE_URL" -f drizzle/0021_delete_current_user.sql
```

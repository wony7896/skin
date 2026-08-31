import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * 회원 데이터 접근 계층(DAL).
 *
 * 중요: Drizzle의 `db`는 `DATABASE_URL`(postgres 역할)로 직접 접속하므로
 * Postgres RLS의 `auth.uid()`가 채워지지 않는다 — 즉 RLS는 Drizzle 경로에서
 * 사실상 우회된다. 사용자 소유 데이터의 실제 격리는 "모든 서버 액션·페이지가
 * 여기서 얻은 user.id로 쿼리를 스코프한다"는 규약에 의존한다. 새 서버 코드는
 * 반드시 `requireUser()`(페이지) 또는 `getSessionUser()`(액션)로 시작할 것.
 * RLS 정책(drizzle/0017·0019)은 PostgREST/스토리지 경유 접근에 대한
 * 심층 방어로만 유효하다.
 */

/** 페이지·레이아웃용. 미인증이면 /login으로 보낸다. */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
}

/** 서버 액션용. 미인증이면 user가 null — 호출부에서 에러 객체를 반환하도록. */
export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

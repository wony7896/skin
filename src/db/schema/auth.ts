import { pgSchema, text, uuid } from "drizzle-orm/pg-core";

// Supabase가 관리하는 auth.users를 참조하기 위한 최소 정의 (마이그레이션 대상 아님).
// email은 "아이디 찾기"에서 서버 액션이 조회용으로만 읽는다 (Drizzle은 postgres 역할이라 auth 스키마 접근 가능).
export const authUsers = pgSchema("auth").table("users", {
  id: uuid("id").primaryKey(),
  email: text("email"),
});

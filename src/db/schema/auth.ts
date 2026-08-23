import { pgSchema, uuid } from "drizzle-orm/pg-core";

// Supabase가 관리하는 auth.users를 참조하기 위한 최소 정의 (마이그레이션 대상 아님)
export const authUsers = pgSchema("auth").table("users", {
  id: uuid("id").primaryKey(),
});

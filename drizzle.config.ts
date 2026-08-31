import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Next.js와 동일한 우선순위로 env를 읽는다: .env.local 이 .env 를 덮어쓴다.
// (dotenv 의 config()는 이미 설정된 값을 덮어쓰지 않으므로 .env.local 을 먼저 로드)
config({ path: ".env.local" });
config({ path: ".env" });

// drizzle-kit은 이제 "마이그레이션 러너"가 아니라 "DDL 생성 도우미"로만 쓴다.
// 마이그레이션의 정본(正本)은 supabase/migrations/ 이고, 적용은 Supabase CLI가 한다.
//
// 새 테이블/컬럼 변경 절차:
//   1) src/db/schema/*.ts 수정
//   2) npm run db:generate  → drizzle/.generated/ 에 SQL 초안이 나옴
//   3) supabase migration new <name> → 2)의 SQL 중 필요한 부분을 옮겨 담음
//   4) drizzle/.generated/ 내용은 버림 (gitignore)
// RLS·정책·함수·트리거는 2)를 건너뛰고 supabase migration new 로 직접 작성한다.
export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle/.generated",
  dialect: "postgresql",
  // auth.users는 Supabase가 이미 소유·관리하는 테이블이라 생성 대상에서 제외
  schemaFilter: ["public"],
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});

-- 계정 복구("아이디 찾기")용 이름·전화번호. auth.users 와 1:1.
-- 로그인 식별자는 이메일이지만, 이메일을 잊은 사용자가 이름+전화번호로
-- 가입 이메일을 (마스킹된 형태로) 조회할 수 있게 한다. 전화번호는 숫자만
-- 남겨 정규화해 저장한다(앱 계층에서 처리).

CREATE TABLE "user_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- 계정 삭제 시 함께 삭제 (delete_current_user() 가 auth.users 행을 지우면 CASCADE)
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk"
	FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;

-- 이름+전화번호 조회용
CREATE INDEX "user_profiles_name_phone_idx" ON "user_profiles" ("name", "phone");

-- 소유자 본인만 접근 (PostgREST/스토리지 경유 심층 방어).
-- "아이디 찾기" 서버 액션은 Drizzle(postgres 역할)로 직접 조회하므로 이 정책을 우회한다 — 의도된 동작.
ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_profiles_owner" ON "public"."user_profiles" FOR ALL
	USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

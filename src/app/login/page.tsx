import { LoginForm } from "@/components/auth/LoginForm";

const NOTICES: Record<string, string> = {
  deleted: "회원탈퇴가 완료됐어요. 이용해주셔서 감사합니다.",
  link_invalid: "링크가 만료됐거나 이미 사용됐어요. 다시 시도해주세요.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string; error?: string }>;
}) {
  const { deleted, error } = await searchParams;
  const notice = deleted ? NOTICES.deleted : error ? NOTICES[error] : null;

  return (
    <main className="min-h-screen bg-neutral-50 px-4">
      <LoginForm notice={notice} />
    </main>
  );
}

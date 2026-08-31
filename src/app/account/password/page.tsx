import Link from "next/link";
import { PasswordChangeForm } from "@/components/account/PasswordChangeForm";
import { requireUser } from "@/lib/auth";

// 로그인한 사용자의 비밀번호 변경 + 재설정 링크(/auth/confirm)를 타고 온
// 복구 세션의 새 비밀번호 설정, 두 경우를 함께 처리한다.
export default async function PasswordPage() {
  await requireUser();

  return (
    <main className="min-h-screen bg-neutral-50 px-4">
      <div className="mx-auto max-w-sm space-y-4 py-16">
        <h1 className="text-xl font-semibold text-neutral-900">비밀번호 변경</h1>
        <PasswordChangeForm />
        <Link
          href="/account"
          className="inline-block text-sm text-neutral-500 underline"
        >
          계정 관리로 돌아가기
        </Link>
      </div>
    </main>
  );
}

import Link from "next/link";
import { signOut } from "@/app/login/actions";
import { AppHeader } from "@/components/AppHeader";
import { ConsentManager } from "@/components/account/ConsentManager";
import { DeleteAccountForm } from "@/components/account/DeleteAccountForm";
import { hasConsent, type ConsentType } from "@/lib/consent";
import { requireUser } from "@/lib/auth";

export default async function AccountPage() {
  const { user } = await requireUser();

  const [sensitive, biometric] = await Promise.all([
    hasConsent(user.id, "sensitive_health_info"),
    hasConsent(user.id, "biometric_photo"),
  ]);
  const granted: Record<ConsentType, boolean> = {
    sensitive_health_info: sensitive,
    biometric_photo: biometric,
  };

  const joined = user.created_at
    ? new Date(user.created_at).toLocaleDateString("ko-KR")
    : "-";

  return (
    <>
      <AppHeader />
      <main className="min-h-screen bg-neutral-50 px-4 py-10">
        <div className="mx-auto max-w-xl space-y-10">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">계정 관리</h1>
          </div>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-neutral-900">기본 정보</h2>
            <div className="rounded-lg border border-neutral-200 bg-white p-4 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-neutral-500">이메일</span>
                <span className="text-neutral-900">{user.email}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-neutral-500">가입일</span>
                <span className="text-neutral-900">{joined}</span>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-neutral-900">진단 내역</h2>
            <Link
              href="/history"
              className="inline-block rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700"
            >
              날짜별 진단·추천·트러블 기록 보기
            </Link>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-neutral-900">비밀번호</h2>
            <Link
              href="/account/password"
              className="inline-block rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700"
            >
              비밀번호 변경
            </Link>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-neutral-900">
              개인정보 처리 동의
            </h2>
            <ConsentManager granted={granted} />
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-neutral-900">세션</h2>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700"
              >
                로그아웃
              </button>
            </form>
          </section>

          <section className="space-y-3 border-t border-neutral-200 pt-8">
            <h2 className="text-sm font-semibold text-red-600">회원탈퇴</h2>
            <DeleteAccountForm email={user.email ?? ""} />
          </section>
        </div>
      </main>
    </>
  );
}

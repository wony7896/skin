import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

// 비로그인 방문자의 진입점. 로그인 상태면 앱 홈(추천)으로 바로 보낸다.
export default async function Home() {
  const { user } = await getSessionUser();
  if (user) {
    redirect("/recommendations");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md py-20 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          성분으로 고르는 맞춤 스킨케어
        </h1>
        <p className="mt-3 text-sm leading-6 text-neutral-500">
          피부 상태·목표·알레르기 이력을 바탕으로 제외 성분을 걸러내고,
          목표에 맞는 제품을 카테고리별로 추천해드려요. 자가 평가 참고용이며
          의학적 진단이 아닙니다.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/signup"
            className="rounded-lg bg-neutral-900 px-6 py-3 text-sm font-medium text-white"
          >
            시작하기
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-neutral-300 px-6 py-3 text-sm font-medium text-neutral-700"
          >
            이미 계정이 있어요
          </Link>
        </div>
      </div>
    </main>
  );
}

import Link from "next/link";
import { signOut } from "@/app/login/actions";
import { getSessionUser } from "@/lib/auth";

// 앱 내 주요 화면으로 이동하는 링크. 서버 컴포넌트라 활성 표시는 하지 않는다.
const NAV = [
  { href: "/recommendations", label: "추천" },
  { href: "/checkin", label: "체크인" },
  { href: "/report", label: "트러블 리포트" },
  { href: "/feedback", label: "피드백" },
  { href: "/history", label: "내역" },
] as const;

// 로그인한 사용자용 공통 상단 바. 주요 화면 내비게이션 + 계정 링크·로그아웃을 어느 화면에서나 노출.
export async function AppHeader() {
  const { user } = await getSessionUser();
  if (!user) return null;

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-xs text-neutral-500">
        <Link href="/recommendations" className="font-semibold text-neutral-900">
          맞춤 스킨케어
        </Link>
        <nav className="flex flex-wrap gap-x-3 gap-y-1">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-neutral-900">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden truncate sm:inline">{user.email}</span>
          <Link href="/account" className="underline">
            계정
          </Link>
          <form action={signOut}>
            <button type="submit" className="underline">
              로그아웃
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

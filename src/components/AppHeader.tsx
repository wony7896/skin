import Link from "next/link";
import { signOut } from "@/app/login/actions";
import { getSessionUser } from "@/lib/auth";

// 로그인한 사용자용 공통 상단 바. 이메일·계정 링크·로그아웃을 어느 화면에서나 노출.
export async function AppHeader() {
  const { user } = await getSessionUser();
  if (!user) return null;

  return (
    <header className="flex items-center justify-end gap-3 border-b border-neutral-200 bg-white px-4 py-2 text-xs text-neutral-500">
      <span className="truncate">{user.email}</span>
      <Link href="/history" className="underline">
        내역
      </Link>
      <Link href="/account" className="underline">
        계정
      </Link>
      <form action={signOut}>
        <button type="submit" className="underline">
          로그아웃
        </button>
      </form>
    </header>
  );
}

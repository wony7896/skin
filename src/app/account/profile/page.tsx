import { eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { userProfiles } from "@/db/schema";
import { ContactProfileForm } from "@/components/account/ContactProfileForm";
import { requireUser } from "@/lib/auth";

// "아이디 찾기"의 근거가 되는 이름·전화번호 확인·수정.
export default async function ContactProfilePage() {
  const { user } = await requireUser();

  const [row] = await db
    .select({ name: userProfiles.name, phone: userProfiles.phone })
    .from(userProfiles)
    .where(eq(userProfiles.userId, user.id))
    .limit(1);

  return (
    <main className="min-h-screen bg-neutral-50 px-4">
      <div className="mx-auto max-w-sm space-y-4 py-16">
        <h1 className="text-xl font-semibold text-neutral-900">이름·전화번호</h1>
        <p className="text-sm text-neutral-500">
          이메일(아이디)을 잊었을 때 본인 확인용으로만 쓰여요.
        </p>
        <ContactProfileForm name={row?.name ?? ""} phone={row?.phone ?? ""} />
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

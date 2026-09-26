"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { authUsers, userProfiles } from "@/db/schema";
import { isValidPhone, normalizePhone } from "@/lib/phone";

// 로컬파트 앞 2자만 남기고 마스킹 — "wony7896@gmail.com" → "wo****@gmail.com"
// 별표 개수는 고정해 원본 길이가 드러나지 않게 한다.
function maskEmail(email: string): string {
  const at = email.lastIndexOf("@");
  if (at <= 0) return email;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const shown = local.slice(0, Math.min(2, local.length));
  return `${shown}****@${domain}`;
}

export async function findEmail(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const phone = normalizePhone(String(formData.get("phone") ?? ""));

  if (!name || !isValidPhone(phone)) {
    return { error: "이름과 전화번호를 정확히 입력해주세요." as const };
  }

  const rows = await db
    .select({ email: authUsers.email })
    .from(userProfiles)
    .innerJoin(authUsers, eq(authUsers.id, userProfiles.userId))
    .where(and(eq(userProfiles.name, name), eq(userProfiles.phone, phone)))
    .limit(2);

  const emails = rows
    .map((r) => r.email)
    .filter((e): e is string => Boolean(e));

  // 0건이면 없음, 2건 이상이면 같은 이름+번호로 여러 계정 — 어느 쪽이든 건수를 노출하지 않는다
  if (emails.length !== 1) {
    return {
      error:
        "일치하는 계정을 찾지 못했어요. 입력하신 정보를 다시 확인해주세요." as const,
    };
  }

  return { email: maskEmail(emails[0]) };
}

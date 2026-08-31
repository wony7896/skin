"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/app/forgot-password/actions";

type State = { error?: string; message?: string } | null;

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState<State, FormData>(
    async (_prev, formData) => (await requestPasswordReset(formData)) ?? null,
    null,
  );

  return (
    <form action={formAction} className="mx-auto max-w-sm space-y-4 py-16">
      <h1 className="text-xl font-semibold text-neutral-900">비밀번호 재설정</h1>
      <p className="text-sm text-neutral-500">
        가입하신 이메일 주소를 입력하시면 재설정 링크를 보내드려요.
      </p>

      <input
        type="email"
        name="email"
        placeholder="이메일"
        required
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
      />

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.message && (
        <p className="text-sm text-neutral-600">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isPending ? "보내는 중..." : "재설정 메일 보내기"}
      </button>

      <p className="text-center text-sm text-neutral-500">
        <Link href="/login" className="text-neutral-900 underline">
          로그인으로 돌아가기
        </Link>
      </p>
    </form>
  );
}

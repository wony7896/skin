"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp } from "@/app/login/actions";

type State = { error?: string; message?: string } | null;

export function SignupForm() {
  const [state, formAction, isPending] = useActionState<State, FormData>(
    async (_prev, formData) => (await signUp(formData)) ?? null,
    null,
  );

  return (
    <form action={formAction} className="mx-auto max-w-sm space-y-4 py-16">
      <h1 className="text-xl font-semibold text-neutral-900">회원가입</h1>

      <input
        type="email"
        name="email"
        placeholder="이메일"
        required
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
      />
      <input
        type="password"
        name="password"
        placeholder="비밀번호 (6자 이상)"
        required
        minLength={6}
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
        {isPending ? "가입 중..." : "회원가입"}
      </button>

      <p className="text-center text-sm text-neutral-500">
        이미 계정이 있나요?{" "}
        <Link href="/login" className="text-neutral-900 underline">
          로그인
        </Link>
      </p>
    </form>
  );
}

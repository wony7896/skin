"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn } from "@/app/login/actions";

type State = { error?: string } | null;

export function LoginForm() {
  const [state, formAction, isPending] = useActionState<State, FormData>(
    async (_prev, formData) => (await signIn(formData)) ?? null,
    null,
  );

  return (
    <form action={formAction} className="mx-auto max-w-sm space-y-4 py-16">
      <h1 className="text-xl font-semibold text-neutral-900">로그인</h1>

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
        placeholder="비밀번호"
        required
        minLength={6}
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
      />

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isPending ? "로그인 중..." : "로그인"}
      </button>

      <p className="text-center text-sm text-neutral-500">
        계정이 없나요?{" "}
        <Link href="/signup" className="text-neutral-900 underline">
          회원가입
        </Link>
      </p>
    </form>
  );
}

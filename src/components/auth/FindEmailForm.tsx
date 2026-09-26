"use client";

import { useActionState } from "react";
import Link from "next/link";
import { findEmail } from "@/app/find-email/actions";

type State = { error?: string; email?: string } | null;

export function FindEmailForm() {
  const [state, formAction, isPending] = useActionState<State, FormData>(
    async (_prev, formData) => (await findEmail(formData)) ?? null,
    null,
  );

  return (
    <form action={formAction} className="mx-auto max-w-sm space-y-4 py-16">
      <h1 className="text-xl font-semibold text-neutral-900">아이디 찾기</h1>
      <p className="text-sm text-neutral-500">
        가입 시 입력하신 이름과 전화번호로 이메일(아이디)을 찾아드려요.
      </p>

      <input
        type="text"
        name="name"
        placeholder="이름"
        required
        autoComplete="name"
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
      />
      <input
        type="tel"
        name="phone"
        placeholder="전화번호"
        required
        autoComplete="tel"
        inputMode="numeric"
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
      />

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.email && (
        <div className="rounded-lg bg-neutral-100 px-3 py-2 text-sm text-neutral-700">
          가입된 이메일: <span className="font-medium">{state.email}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isPending ? "찾는 중..." : "이메일 찾기"}
      </button>

      <div className="flex items-center justify-between text-sm text-neutral-500">
        <Link href="/login" className="underline">
          로그인으로 돌아가기
        </Link>
        <Link href="/forgot-password" className="underline">
          비밀번호 찾기
        </Link>
      </div>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { updatePassword } from "@/app/account/actions";

type State = { error?: string; message?: string } | null;

export function PasswordChangeForm() {
  const [state, formAction, isPending] = useActionState<State, FormData>(
    async (_prev, formData) => (await updatePassword(formData)) ?? null,
    null,
  );

  return (
    <form action={formAction} className="space-y-3">
      <input
        type="password"
        name="password"
        placeholder="새 비밀번호 (6자 이상)"
        required
        minLength={6}
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
      />
      <input
        type="password"
        name="confirm"
        placeholder="새 비밀번호 확인"
        required
        minLength={6}
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
      />

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.message && (
        <p className="text-sm text-green-700">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isPending ? "변경 중..." : "비밀번호 변경"}
      </button>
    </form>
  );
}

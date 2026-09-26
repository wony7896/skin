"use client";

import { useActionState } from "react";
import { updateContactProfile } from "@/app/account/actions";

type State = { error?: string; message?: string } | null;

export function ContactProfileForm({
  name,
  phone,
}: {
  name: string;
  phone: string;
}) {
  const [state, formAction, isPending] = useActionState<State, FormData>(
    async (_prev, formData) => (await updateContactProfile(formData)) ?? null,
    null,
  );

  return (
    <form action={formAction} className="space-y-3">
      <input
        type="text"
        name="name"
        defaultValue={name}
        placeholder="이름"
        required
        autoComplete="name"
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
      />
      <input
        type="tel"
        name="phone"
        defaultValue={phone}
        placeholder="전화번호"
        required
        autoComplete="tel"
        inputMode="numeric"
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
        {isPending ? "저장 중..." : "저장"}
      </button>
    </form>
  );
}

"use client";

import { useActionState, useState } from "react";
import { deleteAccount } from "@/app/account/actions";

type State = { error?: string } | null;

export function DeleteAccountForm({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<State, FormData>(
    async (_prev, formData) => (await deleteAccount(formData)) ?? null,
    null,
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600"
      >
        회원탈퇴
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <p className="text-sm text-neutral-700">
        탈퇴하면 진단 기록·추천 이력·업로드한 사진·동의 내역이 모두
        영구 삭제되며 복구할 수 없어요. 계속하려면 아래에 이메일 주소
        <span className="font-medium"> {email} </span>
        를 입력해주세요.
      </p>
      <input
        type="text"
        name="confirmation"
        autoComplete="off"
        placeholder="이메일 주소 입력"
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isPending ? "처리 중..." : "영구 삭제"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg px-4 py-2 text-sm text-neutral-500"
        >
          취소
        </button>
      </div>
    </form>
  );
}

"use client";

import { useActionState, useEffect } from "react";
import { createCorporation, updateCorporation, type Corporation } from "./actions";

type Props = {
  corporation?: Corporation;
  onSuccess?: () => void;
};

// corporation prop이 있으면 수정 모드, 없으면 신규 등록 모드로 동작한다.
export default function CorporationForm({ corporation, onSuccess }: Props) {
  const action = corporation ? updateCorporation : createCorporation;
  const [state, formAction, pending] = useActionState(action, {});

  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      onSuccess?.();
    }
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
      {corporation && <input type="hidden" name="id" value={corporation.id} />}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">법인명</label>
        <input
          name="name"
          defaultValue={corporation?.name}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">주간 Capa</label>
        <input
          name="weekly_capa"
          type="number"
          min={1}
          defaultValue={corporation?.weekly_capa}
          className="w-28 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "저장 중..." : corporation ? "수정 저장" : "추가"}
      </button>
      {state && "error" in state && state.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
    </form>
  );
}

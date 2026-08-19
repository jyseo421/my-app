"use client";

import { useActionState, useEffect } from "react";
import {
  createShippingDestination,
  updateShippingDestination,
  type ShippingDestination,
} from "./actions";

type Props = {
  destination?: ShippingDestination;
  onSuccess?: () => void;
};

// destination prop이 있으면 수정 모드, 없으면 신규 등록 모드로 동작한다.
export default function DestinationForm({ destination, onSuccess }: Props) {
  const action = destination ? updateShippingDestination : createShippingDestination;
  const [state, formAction, pending] = useActionState(action, {});

  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      onSuccess?.();
    }
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
      {destination && <input type="hidden" name="id" value={destination.id} />}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">출향지명</label>
        <input
          name="name"
          defaultValue={destination?.name}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">우선순위</label>
        <input
          name="priority"
          type="number"
          min={1}
          defaultValue={destination?.priority}
          className="w-24 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">규격취득 소요시간(주)</label>
        <input
          name="certification_weeks"
          type="number"
          min={0}
          defaultValue={destination?.certification_weeks}
          className="w-32 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "저장 중..." : destination ? "수정 저장" : "추가"}
      </button>
      {state && "error" in state && state.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
    </form>
  );
}

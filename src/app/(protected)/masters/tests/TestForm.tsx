"use client";

import { useActionState, useEffect } from "react";
import { createReliabilityTest, updateReliabilityTest, type ReliabilityTest } from "./actions";

type Props = {
  test?: ReliabilityTest;
  onSuccess?: () => void;
};

// test prop이 있으면 수정 모드, 없으면 신규 등록 모드로 동작한다.
export default function TestForm({ test, onSuccess }: Props) {
  const action = test ? updateReliabilityTest : createReliabilityTest;
  const [state, formAction, pending] = useActionState(action, {});

  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      onSuccess?.();
    }
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
      {test && <input type="hidden" name="id" value={test.id} />}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">항목명</label>
        <input
          name="name"
          defaultValue={test?.name}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">소요시간(일)</label>
        <input
          name="duration_days"
          type="number"
          min={1}
          defaultValue={test?.duration_days}
          className="w-24 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">병렬/직렬</label>
        <select
          name="execution_mode"
          defaultValue={test?.execution_mode ?? "parallel"}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        >
          <option value="parallel">병렬</option>
          <option value="serial">직렬</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "저장 중..." : test ? "수정 저장" : "추가"}
      </button>
      {state && "error" in state && state.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
    </form>
  );
}

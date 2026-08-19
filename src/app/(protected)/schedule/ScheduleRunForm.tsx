"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { runScheduling } from "./actions";

function todayLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function ScheduleRunForm({ modelCount }: { modelCount: number }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(runScheduling, {});
  const [startDate, setStartDate] = useState(todayLocal());

  const ready = modelCount > 0;

  return (
    <form
      action={async (formData) => {
        await formAction(formData);
        router.refresh();
      }}
      className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4"
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">일정 시작 기준일</label>
          <input
            type="date"
            name="start_date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          />
        </div>
        <button
          type="submit"
          disabled={!ready || pending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "계산 중..." : "자동 일정 수립 실행"}
        </button>
      </div>

      {!ready && (
        <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          등록된 모델이 없어 실행할 수 없습니다. 먼저 모델 정보 화면에서 모델을 등록하세요.
        </p>
      )}

      {state && "error" in state && state.error && (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
    </form>
  );
}

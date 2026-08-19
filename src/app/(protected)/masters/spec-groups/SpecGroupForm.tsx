"use client";

import { useActionState, useEffect } from "react";
import { createSpecGroup, updateSpecGroup, type SpecGroup } from "./actions";

type Props = {
  specGroup?: SpecGroup;
  onSuccess?: () => void;
};

// specGroup prop이 있으면 수정 모드, 없으면 신규 등록 모드로 동작한다.
export default function SpecGroupForm({ specGroup, onSuccess }: Props) {
  const action = specGroup ? updateSpecGroup : createSpecGroup;
  const [state, formAction, pending] = useActionState(action, {});

  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      onSuccess?.();
    }
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
      {specGroup && <input type="hidden" name="id" value={specGroup.id} />}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">그룹명</label>
        <input
          name="name"
          defaultValue={specGroup?.name}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">기구·성능개발 진행 방식</label>
        <select
          name="dev_mode"
          defaultValue={specGroup?.dev_mode ?? "parallel"}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        >
          <option value="parallel">병렬</option>
          <option value="serial">직렬</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">우선순위</label>
        <input
          name="priority"
          type="number"
          min={1}
          defaultValue={specGroup?.priority}
          className="w-24 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">기구개발 소요일</label>
        <input
          name="mechanical_dev_days"
          type="number"
          min={1}
          defaultValue={specGroup?.mechanical_dev_days}
          className="w-24 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">성능개발 소요일</label>
        <input
          name="performance_dev_days"
          type="number"
          min={1}
          defaultValue={specGroup?.performance_dev_days}
          className="w-24 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "저장 중..." : specGroup ? "수정 저장" : "추가"}
      </button>
      {state && "error" in state && state.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
    </form>
  );
}

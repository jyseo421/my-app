"use client";

import { useState, useTransition } from "react";
import { deleteReliabilityTest, type ReliabilityTest } from "./actions";
import TestForm from "./TestForm";

const EXECUTION_MODE_LABEL: Record<ReliabilityTest["execution_mode"], string> = {
  parallel: "병렬",
  serial: "직렬",
};

export default function TestTable({ tests }: { tests: ReliabilityTest[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function handleDelete(id: string) {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteReliabilityTest(id);
      if (result?.error) setDeleteError(result.error);
    });
  }

  if (tests.length === 0) {
    return <p className="text-sm text-slate-500">등록된 시험 항목이 없습니다.</p>;
  }

  return (
    <div>
      {deleteError && <p className="mb-2 text-sm text-red-600">{deleteError}</p>}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-500">
            <th className="py-2 font-medium">항목명</th>
            <th className="py-2 font-medium">소요시간(일)</th>
            <th className="py-2 font-medium">병렬/직렬</th>
            <th className="py-2 font-medium" />
          </tr>
        </thead>
        <tbody>
          {tests.map((t) =>
            editingId === t.id ? (
              <tr key={t.id} className="border-b border-slate-100">
                <td colSpan={4} className="py-3">
                  <TestForm test={t} onSuccess={() => setEditingId(null)} />
                </td>
              </tr>
            ) : (
              <tr key={t.id} className="border-b border-slate-100">
                <td className="py-2">{t.name}</td>
                <td className="py-2">{t.duration_days}</td>
                <td className="py-2">{EXECUTION_MODE_LABEL[t.execution_mode]}</td>
                <td className="py-2 text-right">
                  <button
                    onClick={() => setEditingId(t.id)}
                    className="mr-3 text-slate-600 hover:text-slate-900"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    disabled={isPending}
                    className="text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}

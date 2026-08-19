"use client";

import { useState, useTransition } from "react";
import { deleteCorporation, type Corporation } from "./actions";
import CorporationForm from "./CorporationForm";

export default function CorporationTable({ corporations }: { corporations: Corporation[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function handleDelete(id: string) {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteCorporation(id);
      if (result?.error) setDeleteError(result.error);
    });
  }

  if (corporations.length === 0) {
    return <p className="text-sm text-slate-500">등록된 법인이 없습니다.</p>;
  }

  return (
    <div>
      {deleteError && <p className="mb-2 text-sm text-red-600">{deleteError}</p>}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-500">
            <th className="py-2 font-medium">법인명</th>
            <th className="py-2 font-medium">주간 Capa</th>
            <th className="py-2 font-medium" />
          </tr>
        </thead>
        <tbody>
          {corporations.map((c) =>
            editingId === c.id ? (
              <tr key={c.id} className="border-b border-slate-100">
                <td colSpan={3} className="py-3">
                  <CorporationForm corporation={c} onSuccess={() => setEditingId(null)} />
                </td>
              </tr>
            ) : (
              <tr key={c.id} className="border-b border-slate-100">
                <td className="py-2">{c.name}</td>
                <td className="py-2">{c.weekly_capa}</td>
                <td className="py-2 text-right">
                  <button
                    onClick={() => setEditingId(c.id)}
                    className="mr-3 text-slate-600 hover:text-slate-900"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
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

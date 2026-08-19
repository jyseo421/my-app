"use client";

import { useState, useTransition } from "react";
import { deleteShippingDestination, type ShippingDestination } from "./actions";
import DestinationForm from "./DestinationForm";

export default function DestinationTable({
  destinations,
}: {
  destinations: ShippingDestination[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function handleDelete(id: string) {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteShippingDestination(id);
      if (result?.error) setDeleteError(result.error);
    });
  }

  if (destinations.length === 0) {
    return <p className="text-sm text-slate-500">등록된 출향지가 없습니다.</p>;
  }

  return (
    <div>
      {deleteError && <p className="mb-2 text-sm text-red-600">{deleteError}</p>}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-500">
            <th className="py-2 font-medium">우선순위</th>
            <th className="py-2 font-medium">출향지명</th>
            <th className="py-2 font-medium">규격취득 소요시간(주)</th>
            <th className="py-2 font-medium" />
          </tr>
        </thead>
        <tbody>
          {destinations.map((d) =>
            editingId === d.id ? (
              <tr key={d.id} className="border-b border-slate-100">
                <td colSpan={4} className="py-3">
                  <DestinationForm destination={d} onSuccess={() => setEditingId(null)} />
                </td>
              </tr>
            ) : (
              <tr key={d.id} className="border-b border-slate-100">
                <td className="py-2">{d.priority}</td>
                <td className="py-2">{d.name}</td>
                <td className="py-2">{d.certification_weeks}</td>
                <td className="py-2 text-right">
                  <button
                    onClick={() => setEditingId(d.id)}
                    className="mr-3 text-slate-600 hover:text-slate-900"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(d.id)}
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

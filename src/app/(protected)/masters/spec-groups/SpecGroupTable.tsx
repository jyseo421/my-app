"use client";

import { useState, useTransition } from "react";
import { deleteSpecGroup, type SpecGroup } from "./actions";
import SpecGroupForm from "./SpecGroupForm";

const DEV_MODE_LABEL: Record<SpecGroup["dev_mode"], string> = {
  parallel: "병렬",
  serial: "직렬",
};

export default function SpecGroupTable({ specGroups }: { specGroups: SpecGroup[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function handleDelete(id: string) {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteSpecGroup(id);
      if (result?.error) setDeleteError(result.error);
    });
  }

  if (specGroups.length === 0) {
    return <p className="text-sm text-slate-500">등록된 사양그룹이 없습니다.</p>;
  }

  return (
    <div>
      {deleteError && <p className="mb-2 text-sm text-red-600">{deleteError}</p>}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-500">
            <th className="py-2 font-medium">우선순위</th>
            <th className="py-2 font-medium">그룹명</th>
            <th className="py-2 font-medium">진행 방식</th>
            <th className="py-2 font-medium">기구개발(일)</th>
            <th className="py-2 font-medium">성능개발(일)</th>
            <th className="py-2 font-medium" />
          </tr>
        </thead>
        <tbody>
          {specGroups.map((g) =>
            editingId === g.id ? (
              <tr key={g.id} className="border-b border-slate-100">
                <td colSpan={6} className="py-3">
                  <SpecGroupForm specGroup={g} onSuccess={() => setEditingId(null)} />
                </td>
              </tr>
            ) : (
              <tr key={g.id} className="border-b border-slate-100">
                <td className="py-2">{g.priority}</td>
                <td className="py-2">{g.name}</td>
                <td className="py-2">{DEV_MODE_LABEL[g.dev_mode]}</td>
                <td className="py-2">{g.mechanical_dev_days}</td>
                <td className="py-2">{g.performance_dev_days}</td>
                <td className="py-2 text-right">
                  <button
                    onClick={() => setEditingId(g.id)}
                    className="mr-3 text-slate-600 hover:text-slate-900"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(g.id)}
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

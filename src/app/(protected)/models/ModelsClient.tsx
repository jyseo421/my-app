"use client";

import { useState, useTransition } from "react";
import {
  deleteModel,
  type Model,
  type Option,
  type CorporationOption,
  type SpecGroupOption,
} from "./actions";
import ModelForm from "./ModelForm";

type Props = {
  models: Model[];
  modelTestMap: Record<string, string[]>;
  specGroups: SpecGroupOption[];
  destinations: Option[];
  corporations: CorporationOption[];
  tests: Option[];
};

function nameOf(options: Option[], id: string) {
  return options.find((o) => o.id === id)?.name ?? "-";
}

export default function ModelsClient({
  models,
  modelTestMap,
  specGroups,
  destinations,
  corporations,
  tests,
}: Props) {
  const [mode, setMode] = useState<"none" | "create" | "edit">("none");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const selectedModel = models.find((m) => m.id === selectedId);

  function handleDelete(id: string) {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteModel(id);
      if (result?.error) setDeleteError(result.error);
      if (selectedId === id) {
        setMode("none");
        setSelectedId(null);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="min-w-0 flex-1">
        <button
          onClick={() => {
            setMode("create");
            setSelectedId(null);
          }}
          className="mb-3 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
        >
          새 모델 추가
        </button>

        {deleteError && <p className="mb-2 text-sm text-red-600">{deleteError}</p>}

        {models.length === 0 ? (
          <p className="text-sm text-slate-500">등록된 모델이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-3 py-2 font-medium">모델명</th>
                  <th className="px-3 py-2 font-medium">사양그룹</th>
                  <th className="px-3 py-2 font-medium">출향지</th>
                  <th className="px-3 py-2 font-medium">법인</th>
                  <th className="px-3 py-2 font-medium">규격취득</th>
                  <th className="px-3 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {models.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => {
                      setSelectedId(m.id);
                      setMode("edit");
                    }}
                    className={`cursor-pointer border-b border-slate-100 hover:bg-slate-50 ${
                      selectedId === m.id ? "bg-slate-50" : ""
                    }`}
                  >
                    <td className="px-3 py-2">{m.name}</td>
                    <td className="px-3 py-2">{nameOf(specGroups, m.spec_group_id)}</td>
                    <td className="px-3 py-2">{nameOf(destinations, m.shipping_destination_id)}</td>
                    <td className="px-3 py-2">{nameOf(corporations, m.corporation_id)}</td>
                    <td className="px-3 py-2">{m.certification_required ? "필요" : "-"}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(m.id);
                        }}
                        disabled={isPending}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="w-full shrink-0 lg:w-[420px]">
        {mode === "none" && (
          <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
            모델을 선택하거나 &quot;새 모델 추가&quot;를 눌러주세요.
          </p>
        )}
        {mode === "create" && (
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-medium text-slate-700">새 모델 등록</h2>
            <ModelForm
              specGroups={specGroups}
              destinations={destinations}
              corporations={corporations}
              tests={tests}
              onSuccess={() => setMode("none")}
              onCancel={() => setMode("none")}
            />
          </div>
        )}
        {mode === "edit" && selectedModel && (
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-medium text-slate-700">모델 수정</h2>
            <ModelForm
              model={{ ...selectedModel, testIds: modelTestMap[selectedModel.id] ?? [] }}
              specGroups={specGroups}
              destinations={destinations}
              corporations={corporations}
              tests={tests}
              onSuccess={() => {
                setMode("none");
                setSelectedId(null);
              }}
              onCancel={() => {
                setMode("none");
                setSelectedId(null);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useActionState, useEffect, useState } from "react";
import {
  createModel,
  updateModel,
  type Model,
  type Option,
  type CorporationOption,
  type SpecGroupOption,
} from "./actions";

type Props = {
  model?: Model & { testIds: string[] };
  specGroups: SpecGroupOption[];
  destinations: Option[];
  corporations: CorporationOption[];
  tests: Option[];
  onSuccess?: () => void;
  onCancel?: () => void;
};

export default function ModelForm({
  model,
  specGroups,
  destinations,
  corporations,
  tests,
  onSuccess,
  onCancel,
}: Props) {
  const action = model ? updateModel : createModel;
  const [state, formAction, pending] = useActionState(action, {});

  // 필수 항목이 다 채워졌는지 추적해서 저장 버튼 활성화 여부를 결정한다.
  const [name, setName] = useState(model?.name ?? "");
  const [specGroupId, setSpecGroupId] = useState(model?.spec_group_id ?? "");
  const [destinationId, setDestinationId] = useState(model?.shipping_destination_id ?? "");
  const [corporationId, setCorporationId] = useState(model?.corporation_id ?? "");

  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      onSuccess?.();
    }
  }, [state, onSuccess]);

  const canSubmit =
    name.trim() !== "" && specGroupId !== "" && destinationId !== "" && corporationId !== "";

  const selectedCorporation = corporations.find((c) => c.id === corporationId);
  const selectedSpecGroup = specGroups.find((g) => g.id === specGroupId);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {model && <input type="hidden" name="id" value={model.id} />}

      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">
          모델명 <span className="text-red-600">*</span>
        </label>
        <input
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">
            사양그룹 <span className="text-red-600">*</span>
          </label>
          <select
            name="spec_group_id"
            value={specGroupId}
            onChange={(e) => setSpecGroupId(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          >
            <option value="">선택</option>
            {specGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">
            출향지 <span className="text-red-600">*</span>
          </label>
          <select
            name="shipping_destination_id"
            value={destinationId}
            onChange={(e) => setDestinationId(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          >
            <option value="">선택</option>
            {destinations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">
            법인 <span className="text-red-600">*</span>
          </label>
          <select
            name="corporation_id"
            value={corporationId}
            onChange={(e) => setCorporationId(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          >
            <option value="">선택</option>
            {corporations.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedCorporation && (
        <p className="text-xs text-slate-500">
          이 법인의 주간 Capa:{" "}
          <span className="font-medium text-slate-700">{selectedCorporation.weekly_capa}</span>{" "}
          (읽기 전용, 법인 마스터에서 관리)
        </p>
      )}

      {selectedSpecGroup && (
        <p className="text-xs text-slate-500">
          이 사양그룹의 기구개발 소요일:{" "}
          <span className="font-medium text-slate-700">{selectedSpecGroup.mechanical_dev_days}</span>
          , 성능개발 소요일:{" "}
          <span className="font-medium text-slate-700">{selectedSpecGroup.performance_dev_days}</span>{" "}
          (읽기 전용, 사양그룹 마스터에서 관리)
        </p>
      )}

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name="certification_required"
          defaultChecked={model?.certification_required}
          className="h-4 w-4"
        />
        규격취득 필요
      </label>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">신뢰성 시험 항목</label>
        {tests.length === 0 ? (
          <p className="text-sm text-slate-400">등록된 시험 항목이 없습니다.</p>
        ) : (
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {tests.map((t) => (
              <label key={t.id} className="flex items-center gap-1.5 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="test_ids"
                  value={t.id}
                  defaultChecked={model?.testIds.includes(t.id)}
                  className="h-4 w-4"
                />
                {t.name}
              </label>
            ))}
          </div>
        )}
      </div>

      {state && "error" in state && state.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!canSubmit || pending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "저장 중..." : model ? "수정 저장" : "등록"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600"
          >
            취소
          </button>
        )}
      </div>
    </form>
  );
}

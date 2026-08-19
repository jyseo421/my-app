import type { ScheduleResultRow, ScheduleRun } from "./actions";
import { formatIsoWeekLabel } from "@/lib/scheduling/workday";

const FIELDS: {
  key: keyof ScheduleResultRow;
  label: string;
  format?: (v: string | null) => string;
}[] = [
  { key: "mechanical_start", label: "기구 시작" },
  { key: "mechanical_end", label: "기구 종료" },
  { key: "performance_start", label: "성능 시작" },
  { key: "performance_end", label: "성능 종료" },
  { key: "reliability_test_end", label: "신뢰성 시험 종료" },
  { key: "certification_end", label: "규격취득 종료" },
  { key: "completion_date", label: "완료일" },
  { key: "completion_week", label: "완료 주", format: (v) => (v ? formatIsoWeekLabel(v) : "-") },
];

function buildIndex(results: ScheduleResultRow[]) {
  return new Map(results.map((r) => [r.model_id, r]));
}

function Cell({
  value,
  changed,
}: {
  value: string | null;
  changed: boolean;
}) {
  return (
    <td className={`px-3 py-2 ${changed ? "bg-yellow-100 font-medium text-slate-900" : ""}`}>
      {value ?? "-"}
    </td>
  );
}

function ResultTable({
  title,
  results,
  otherById,
}: {
  title: string;
  results: ScheduleResultRow[];
  otherById: Map<string, ScheduleResultRow>;
}) {
  return (
    <div className="min-w-0 flex-1">
      <h3 className="mb-2 text-sm font-medium text-slate-700">{title}</h3>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="px-3 py-2 font-medium">모델명</th>
              {FIELDS.map((f) => (
                <th key={f.key} className="px-3 py-2 font-medium">
                  {f.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((r) => {
              const other = otherById.get(r.model_id);
              const isNewRow = !other;
              return (
                <tr key={r.model_id} className="border-b border-slate-100">
                  <td className="px-3 py-2">
                    {r.model_name}
                    {isNewRow && <span className="ml-1 text-xs text-amber-600">(신규)</span>}
                  </td>
                  {FIELDS.map((f) => {
                    const raw = r[f.key] as string | null;
                    return (
                      <Cell
                        key={f.key}
                        value={f.format ? f.format(raw) : raw}
                        changed={isNewRow || other![f.key] !== r[f.key]}
                      />
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ScheduleComparison({
  previous,
  latest,
}: {
  previous: ScheduleRun;
  latest: ScheduleRun;
}) {
  const previousById = buildIndex(previous.results);
  const latestById = buildIndex(latest.results);

  const removedModels = previous.results.filter((r) => !latestById.has(r.model_id));

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-slate-500">
        이전 실행({previous.startDate} 기준) vs 최신 실행({latest.startDate} 기준) — 노란색 칸이
        변경된 부분입니다.
      </p>
      <div className="flex flex-col gap-4 lg:flex-row">
        <ResultTable title="이전 일정" results={previous.results} otherById={latestById} />
        <ResultTable title="최신 일정" results={latest.results} otherById={previousById} />
      </div>
      {removedModels.length > 0 && (
        <p className="text-sm text-amber-700">
          최신 실행 결과에서 빠진 모델: {removedModels.map((m) => m.model_name).join(", ")}
        </p>
      )}
    </div>
  );
}

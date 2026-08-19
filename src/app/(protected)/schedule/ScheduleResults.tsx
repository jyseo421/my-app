import type { ScheduleResultRow } from "./actions";
import { formatIsoWeekLabel } from "@/lib/scheduling/workday";

function groupByCorpWeek(results: ScheduleResultRow[]) {
  const map = new Map<string, { corporation: string; week: string; count: number }>();
  for (const r of results) {
    const key = `${r.corporation_name}__${r.completion_week}`;
    const existing = map.get(key);
    if (existing) existing.count += 1;
    else map.set(key, { corporation: r.corporation_name, week: r.completion_week, count: 1 });
  }
  return Array.from(map.values()).sort(
    (a, b) => a.week.localeCompare(b.week) || a.corporation.localeCompare(b.corporation)
  );
}

export default function ScheduleResults({
  startDate,
  results,
}: {
  startDate: string;
  results: ScheduleResultRow[];
}) {
  const summary = groupByCorpWeek(results);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-500">
        시작 기준일 <span className="font-medium text-slate-700">{startDate}</span> · 총{" "}
        <span className="font-medium text-slate-700">{results.length}</span>개 모델
      </p>

      <div>
        <h2 className="mb-2 text-sm font-medium text-slate-700">법인별 주간 완료 모델 수</h2>
        <div className="flex flex-wrap gap-2">
          {summary.map((s) => (
            <div
              key={`${s.corporation}-${s.week}`}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <span className="text-slate-500">{formatIsoWeekLabel(s.week)} · {s.corporation}</span>{" "}
              <span className="font-semibold text-slate-900">{s.count}개</span>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="px-3 py-2 font-medium">모델명</th>
              <th className="px-3 py-2 font-medium">법인</th>
              <th className="px-3 py-2 font-medium">기구개발</th>
              <th className="px-3 py-2 font-medium">성능개발</th>
              <th className="px-3 py-2 font-medium">신뢰성 시험 종료</th>
              <th className="px-3 py-2 font-medium">규격취득 종료</th>
              <th className="px-3 py-2 font-medium">완료일</th>
              <th className="px-3 py-2 font-medium">완료 주</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.model_id} className="border-b border-slate-100">
                <td className="px-3 py-2">{r.model_name}</td>
                <td className="px-3 py-2">{r.corporation_name}</td>
                <td className="px-3 py-2">
                  {r.mechanical_start} ~ {r.mechanical_end}
                </td>
                <td className="px-3 py-2">
                  {r.performance_start} ~ {r.performance_end}
                </td>
                <td className="px-3 py-2">{r.reliability_test_end}</td>
                <td className="px-3 py-2">{r.certification_end ?? "-"}</td>
                <td className="px-3 py-2 font-medium">{r.completion_date}</td>
                <td className="px-3 py-2">{formatIsoWeekLabel(r.completion_week)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

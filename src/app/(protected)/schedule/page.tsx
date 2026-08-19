import { checkReadyToRun, getRecentRuns } from "./actions";
import ScheduleRunForm from "./ScheduleRunForm";
import ScheduleResults from "./ScheduleResults";
import ScheduleComparison from "./ScheduleComparison";
import ExportExcelButton from "../masters/_shared/ExportExcelButton";
import { formatIsoWeekLabel } from "@/lib/scheduling/workday";

export default async function SchedulePage() {
  const [{ modelCount }, { latest, previous }] = await Promise.all([checkReadyToRun(), getRecentRuns()]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">일정 수립 실행</h1>
          <p className="text-sm text-slate-500">
            시작 기준일을 입력하고 실행하면 등록된 모든 모델의 개발 순서·일정을 자동으로
            계산합니다. 조건을 바꾼 뒤 다시 실행하면 이전 결과와 나란히 비교해서 보여줍니다.
          </p>
        </div>
        {latest && (
          <ExportExcelButton
            filename="일정결과.xlsx"
            sheetName="일정 결과"
            headers={[
              "모델명",
              "법인",
              "기구 시작",
              "기구 종료",
              "성능 시작",
              "성능 종료",
              "신뢰성 시험 종료",
              "규격취득 종료",
              "완료일",
              "완료 주",
            ]}
            rows={latest.results.map((r) => [
              r.model_name,
              r.corporation_name,
              r.mechanical_start,
              r.mechanical_end,
              r.performance_start,
              r.performance_end,
              r.reliability_test_end,
              r.certification_end,
              r.completion_date,
              formatIsoWeekLabel(r.completion_week),
            ])}
          />
        )}
      </div>

      <ScheduleRunForm modelCount={modelCount} />

      {!latest && <p className="text-sm text-slate-400">아직 실행한 일정이 없습니다.</p>}

      {latest && !previous && <ScheduleResults startDate={latest.startDate} results={latest.results} />}

      {latest && previous && <ScheduleComparison previous={previous} latest={latest} />}
    </div>
  );
}

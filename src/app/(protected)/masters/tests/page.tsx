import { listReliabilityTests } from "./actions";
import TestForm from "./TestForm";
import TestTable from "./TestTable";
import TestBulkImport from "./TestBulkImport";
import ExportExcelButton from "../_shared/ExportExcelButton";

const MODE_LABEL: Record<"parallel" | "serial", string> = { parallel: "병렬", serial: "직렬" };

export default async function TestsPage() {
  const tests = await listReliabilityTests();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">신뢰성 시험</h1>
          <p className="text-sm text-slate-500">
            시험 항목명, 소요시간(일), 병렬/직렬 여부를 관리합니다. 모델은 이 항목들 중 필요한
            것을 선택해 적용합니다.
          </p>
        </div>
        <ExportExcelButton
          filename="신뢰성시험.xlsx"
          sheetName="신뢰성 시험"
          headers={["항목명", "소요시간(일)", "병렬/직렬"]}
          rows={tests.map((t) => [t.name, t.duration_days, MODE_LABEL[t.execution_mode]])}
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-medium text-slate-700">새 시험 항목 추가</h2>
        <TestForm key={tests.length} />
      </div>

      <TestBulkImport />

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <TestTable tests={tests} />
      </div>
    </div>
  );
}

import { listSpecGroups } from "./actions";
import SpecGroupForm from "./SpecGroupForm";
import SpecGroupTable from "./SpecGroupTable";
import SpecGroupBulkImport from "./SpecGroupBulkImport";
import ExportExcelButton from "../_shared/ExportExcelButton";

const DEV_MODE_LABEL: Record<"parallel" | "serial", string> = { parallel: "병렬", serial: "직렬" };

export default async function SpecGroupsPage() {
  const specGroups = await listSpecGroups();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">사양그룹</h1>
          <p className="text-sm text-slate-500">
            그룹명, 기구·성능개발 진행 방식(병렬/직렬), 법인 Capa 초과 시 1차 정렬 기준이 되는
            우선순위를 관리합니다.
          </p>
        </div>
        <ExportExcelButton
          filename="사양그룹.xlsx"
          sheetName="사양그룹"
          headers={["우선순위", "그룹명", "진행 방식", "기구개발 소요일", "성능개발 소요일"]}
          rows={specGroups.map((g) => [
            g.priority,
            g.name,
            DEV_MODE_LABEL[g.dev_mode],
            g.mechanical_dev_days,
            g.performance_dev_days,
          ])}
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-medium text-slate-700">새 사양그룹 추가</h2>
        <SpecGroupForm key={specGroups.length} />
      </div>

      <SpecGroupBulkImport />

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <SpecGroupTable specGroups={specGroups} />
      </div>
    </div>
  );
}

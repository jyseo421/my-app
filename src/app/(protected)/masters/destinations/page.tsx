import { listShippingDestinations } from "./actions";
import DestinationForm from "./DestinationForm";
import DestinationTable from "./DestinationTable";
import DestinationBulkImport from "./DestinationBulkImport";
import ExportExcelButton from "../_shared/ExportExcelButton";

export default async function DestinationsPage() {
  const destinations = await listShippingDestinations();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">규격·출향지</h1>
          <p className="text-sm text-slate-500">
            출향지명, 법인 Capa 초과 시 동일 그룹 내 2차 정렬 기준이 되는 우선순위,
            출향지별 규격취득 소요시간(주)을 관리합니다.
          </p>
        </div>
        <ExportExcelButton
          filename="규격_출향지.xlsx"
          sheetName="규격·출향지"
          headers={["우선순위", "출향지명", "규격취득 소요시간(주)"]}
          rows={destinations.map((d) => [d.priority, d.name, d.certification_weeks])}
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-medium text-slate-700">새 출향지 추가</h2>
        <DestinationForm key={destinations.length} />
      </div>

      <DestinationBulkImport />

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <DestinationTable destinations={destinations} />
      </div>
    </div>
  );
}

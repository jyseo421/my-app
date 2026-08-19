import { listCorporations } from "./actions";
import CorporationForm from "./CorporationForm";
import CorporationTable from "./CorporationTable";
import CorporationBulkImport from "./CorporationBulkImport";
import ExportExcelButton from "../_shared/ExportExcelButton";

export default async function CorporationsPage() {
  const corporations = await listCorporations();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">법인</h1>
          <p className="text-sm text-slate-500">
            법인명과 법인별 주간 Capa(주당 개발 완료 가능 모델 수)를 관리합니다.
          </p>
        </div>
        <ExportExcelButton
          filename="법인.xlsx"
          sheetName="법인"
          headers={["법인명", "주간 Capa"]}
          rows={corporations.map((c) => [c.name, c.weekly_capa])}
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-medium text-slate-700">새 법인 추가</h2>
        <CorporationForm key={corporations.length} />
      </div>

      <CorporationBulkImport />

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <CorporationTable corporations={corporations} />
      </div>
    </div>
  );
}

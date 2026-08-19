import {
  listModels,
  listModelTestMap,
  listSpecGroupOptions,
  listDestinationOptions,
  listCorporationOptions,
  listTestOptions,
} from "./actions";
import ModelsClient from "./ModelsClient";
import ModelBulkImport from "./ModelBulkImport";
import ExportExcelButton from "../masters/_shared/ExportExcelButton";

export default async function ModelsPage() {
  const [models, modelTestMap, specGroups, destinations, corporations, tests] = await Promise.all([
    listModels(),
    listModelTestMap(),
    listSpecGroupOptions(),
    listDestinationOptions(),
    listCorporationOptions(),
    listTestOptions(),
  ]);

  const specGroupById = new Map(specGroups.map((g) => [g.id, g.name]));
  const destinationById = new Map(destinations.map((d) => [d.id, d.name]));
  const corporationById = new Map(corporations.map((c) => [c.id, c.name]));
  const testById = new Map(tests.map((t) => [t.id, t.name]));

  const exportRows = models.map((m) => [
    m.name,
    specGroupById.get(m.spec_group_id) ?? "-",
    destinationById.get(m.shipping_destination_id) ?? "-",
    corporationById.get(m.corporation_id) ?? "-",
    m.certification_required ? "Y" : "N",
    (modelTestMap[m.id] ?? []).map((id) => testById.get(id) ?? "").join(","),
  ]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">모델 정보</h1>
          <p className="text-sm text-slate-500">
            모델별 사양그룹·출향지·법인, 규격취득 필요 여부, 적용할 신뢰성 시험 항목을
            관리합니다. 기구/성능개발 소요시간은 소속 사양그룹에서 관리합니다.
          </p>
        </div>
        <ExportExcelButton
          filename="모델정보.xlsx"
          sheetName="모델 정보"
          headers={["모델명", "사양그룹명", "출향지명", "법인명", "규격취득 필요", "신뢰성 시험 항목"]}
          rows={exportRows}
        />
      </div>

      {specGroups.length === 0 || destinations.length === 0 || corporations.length === 0 ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          모델을 등록하려면 먼저 마스터 관리에서 법인·사양그룹·출향지를 최소 1개씩 등록해야
          합니다.
        </p>
      ) : (
        <>
          <ModelBulkImport
            specGroups={specGroups}
            destinations={destinations}
            corporations={corporations}
            tests={tests}
          />
          <ModelsClient
            models={models}
            modelTestMap={modelTestMap}
            specGroups={specGroups}
            destinations={destinations}
            corporations={corporations}
            tests={tests}
          />
        </>
      )}
    </div>
  );
}

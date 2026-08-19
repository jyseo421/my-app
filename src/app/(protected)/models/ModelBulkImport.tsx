"use client";

import { useRouter } from "next/navigation";
import BulkImportPanel from "../masters/_shared/BulkImportPanel";
import { parseYesNo } from "@/lib/bulk-import/parseRows";
import { bulkCreateModels, type BulkModelRow, type Option, type CorporationOption } from "./actions";

type Props = {
  specGroups: Option[];
  destinations: Option[];
  corporations: CorporationOption[];
  tests: Option[];
};

function findId(options: Option[], name: string): string | null {
  return options.find((o) => o.name === name)?.id ?? null;
}

export default function ModelBulkImport({ specGroups, destinations, corporations, tests }: Props) {
  const router = useRouter();

  function parseRow(cells: string[], row: number) {
    const name = (cells[0] ?? "").trim();
    const specGroupName = (cells[1] ?? "").trim();
    const destinationName = (cells[2] ?? "").trim();
    const corporationName = (cells[3] ?? "").trim();
    const certificationRequired = parseYesNo(cells[4] ?? "");
    const testNames = (cells[5] ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s !== "");

    if (!name) return { row, error: "모델명이 비어 있습니다." };

    const specGroupId = findId(specGroups, specGroupName);
    if (!specGroupId) return { row, error: `존재하지 않는 사양그룹입니다: "${specGroupName}"` };

    const shippingDestinationId = findId(destinations, destinationName);
    if (!shippingDestinationId) {
      return { row, error: `존재하지 않는 출향지입니다: "${destinationName}"` };
    }

    const corporation = corporations.find((c) => c.name === corporationName);
    if (!corporation) return { row, error: `존재하지 않는 법인입니다: "${corporationName}"` };

    const uniqueTestNames = new Set(testNames);
    if (uniqueTestNames.size !== testNames.length) {
      return { row, error: "동일한 신뢰성 시험 항목이 중복 입력되었습니다." };
    }

    const testIds: string[] = [];
    for (const testName of testNames) {
      const testId = findId(tests, testName);
      if (!testId) return { row, error: `존재하지 않는 신뢰성 시험 항목입니다: "${testName}"` };
      testIds.push(testId);
    }

    const data: BulkModelRow = {
      name,
      specGroupId,
      shippingDestinationId,
      corporationId: corporation.id,
      certificationRequired,
      testIds,
    };
    return { row, data };
  }

  return (
    <BulkImportPanel<BulkModelRow>
      title="엑셀 붙여넣기/파일 첨부로 일괄 등록"
      columnLabels={[
        "모델명",
        "사양그룹명",
        "출향지명",
        "법인명",
        "규격취득 필요(Y/N)",
        "신뢰성 시험 항목(콤마로 구분, 선택)",
      ]}
      parseRow={parseRow}
      renderPreview={(r) => (
        <tr className="border-b border-slate-100 last:border-0">
          <td className="px-3 py-1.5">{r.name}</td>
          <td className="px-3 py-1.5">{specGroups.find((g) => g.id === r.specGroupId)?.name}</td>
          <td className="px-3 py-1.5">{destinations.find((d) => d.id === r.shippingDestinationId)?.name}</td>
          <td className="px-3 py-1.5">{corporations.find((c) => c.id === r.corporationId)?.name}</td>
          <td className="px-3 py-1.5">{r.certificationRequired ? "필요" : "-"}</td>
        </tr>
      )}
      onCommit={(rows) => bulkCreateModels(rows)}
      onSuccess={() => router.refresh()}
    />
  );
}

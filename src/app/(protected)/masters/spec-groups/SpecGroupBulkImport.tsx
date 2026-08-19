"use client";

import { useRouter } from "next/navigation";
import BulkImportPanel from "../_shared/BulkImportPanel";
import { parseDevMode } from "@/lib/bulk-import/parseRows";
import { bulkCreateSpecGroups, type DevMode } from "./actions";

type Row = {
  name: string;
  devMode: DevMode;
  priority: number;
  mechanicalDevDays: number;
  performanceDevDays: number;
};

const DEV_MODE_LABEL: Record<DevMode, string> = { parallel: "병렬", serial: "직렬" };

// 화면 표와 같은 순서(우선순위 → 그룹명 → 진행방식 → 기구개발일 → 성능개발일)로 입력받는다.
function parseRow(cells: string[], row: number) {
  const priority = Number((cells[0] ?? "").trim());
  const name = (cells[1] ?? "").trim();
  const devMode = parseDevMode(cells[2] ?? "");
  const mechanicalDevDays = Number((cells[3] ?? "").trim());
  const performanceDevDays = Number((cells[4] ?? "").trim());

  if (!Number.isInteger(priority) || priority <= 0) {
    return { row, error: "우선순위는 1 이상의 정수여야 합니다." };
  }
  if (!name) return { row, error: "그룹명이 비어 있습니다." };
  if (!devMode) return { row, error: "진행 방식은 '병렬' 또는 '직렬'로 입력하세요." };
  if (!Number.isInteger(mechanicalDevDays) || mechanicalDevDays <= 0) {
    return { row, error: "기구개발 소요일은 1 이상의 정수여야 합니다." };
  }
  if (!Number.isInteger(performanceDevDays) || performanceDevDays <= 0) {
    return { row, error: "성능개발 소요일은 1 이상의 정수여야 합니다." };
  }
  return { row, data: { name, devMode, priority, mechanicalDevDays, performanceDevDays } };
}

export default function SpecGroupBulkImport() {
  const router = useRouter();

  return (
    <BulkImportPanel<Row>
      title="엑셀 붙여넣기/파일 첨부로 일괄 등록"
      columnLabels={["우선순위", "그룹명", "진행 방식(병렬/직렬)", "기구개발 소요일", "성능개발 소요일"]}
      parseRow={parseRow}
      renderPreview={(r) => (
        <tr className="border-b border-slate-100 last:border-0">
          <td className="px-3 py-1.5">{r.priority}</td>
          <td className="px-3 py-1.5">{r.name}</td>
          <td className="px-3 py-1.5">{DEV_MODE_LABEL[r.devMode]}</td>
          <td className="px-3 py-1.5">{r.mechanicalDevDays}</td>
          <td className="px-3 py-1.5">{r.performanceDevDays}</td>
        </tr>
      )}
      onCommit={(rows) => bulkCreateSpecGroups(rows)}
      onSuccess={() => router.refresh()}
    />
  );
}

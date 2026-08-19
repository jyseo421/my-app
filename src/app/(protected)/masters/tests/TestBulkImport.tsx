"use client";

import { useRouter } from "next/navigation";
import BulkImportPanel from "../_shared/BulkImportPanel";
import { parseDevMode } from "@/lib/bulk-import/parseRows";
import { bulkCreateReliabilityTests, type ExecutionMode } from "./actions";

type Row = { name: string; durationDays: number; executionMode: ExecutionMode };

const MODE_LABEL: Record<ExecutionMode, string> = { parallel: "병렬", serial: "직렬" };

function parseRow(cells: string[], row: number) {
  const name = (cells[0] ?? "").trim();
  const durationDays = Number((cells[1] ?? "").trim());
  const executionMode = parseDevMode(cells[2] ?? "");

  if (!name) return { row, error: "항목명이 비어 있습니다." };
  if (!Number.isInteger(durationDays) || durationDays <= 0) {
    return { row, error: "소요시간은 1일 이상의 정수여야 합니다." };
  }
  if (!executionMode) return { row, error: "병렬/직렬 여부는 '병렬' 또는 '직렬'로 입력하세요." };
  return { row, data: { name, durationDays, executionMode } };
}

export default function TestBulkImport() {
  const router = useRouter();

  return (
    <BulkImportPanel<Row>
      title="엑셀 붙여넣기/파일 첨부로 일괄 등록"
      columnLabels={["항목명", "소요시간(일)", "병렬/직렬"]}
      parseRow={parseRow}
      renderPreview={(r) => (
        <tr className="border-b border-slate-100 last:border-0">
          <td className="px-3 py-1.5">{r.name}</td>
          <td className="px-3 py-1.5">{r.durationDays}</td>
          <td className="px-3 py-1.5">{MODE_LABEL[r.executionMode]}</td>
        </tr>
      )}
      onCommit={(rows) => bulkCreateReliabilityTests(rows)}
      onSuccess={() => router.refresh()}
    />
  );
}

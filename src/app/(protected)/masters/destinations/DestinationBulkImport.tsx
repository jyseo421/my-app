"use client";

import { useRouter } from "next/navigation";
import BulkImportPanel from "../_shared/BulkImportPanel";
import { bulkCreateShippingDestinations } from "./actions";

type Row = { name: string; priority: number; certificationWeeks: number };

// 화면 표와 같은 순서(우선순위 → 출향지명 → 규격취득 소요시간)로 입력받는다.
function parseRow(cells: string[], row: number) {
  const priority = Number((cells[0] ?? "").trim());
  const name = (cells[1] ?? "").trim();
  const certificationWeeks = Number((cells[2] ?? "").trim());

  if (!Number.isInteger(priority) || priority <= 0) {
    return { row, error: "우선순위는 1 이상의 정수여야 합니다." };
  }
  if (!name) return { row, error: "출향지명이 비어 있습니다." };
  if (!Number.isInteger(certificationWeeks) || certificationWeeks < 0) {
    return { row, error: "규격취득 소요시간은 0 이상의 정수(주)여야 합니다." };
  }
  return { row, data: { name, priority, certificationWeeks } };
}

export default function DestinationBulkImport() {
  const router = useRouter();

  return (
    <BulkImportPanel<Row>
      title="엑셀 붙여넣기/파일 첨부로 일괄 등록"
      columnLabels={["우선순위", "출향지명", "규격취득 소요시간(주)"]}
      parseRow={parseRow}
      renderPreview={(r) => (
        <tr className="border-b border-slate-100 last:border-0">
          <td className="px-3 py-1.5">{r.priority}</td>
          <td className="px-3 py-1.5">{r.name}</td>
          <td className="px-3 py-1.5">{r.certificationWeeks}</td>
        </tr>
      )}
      onCommit={(rows) => bulkCreateShippingDestinations(rows)}
      onSuccess={() => router.refresh()}
    />
  );
}

"use client";

import { useRouter } from "next/navigation";
import BulkImportPanel from "../_shared/BulkImportPanel";
import { bulkCreateCorporations } from "./actions";

type Row = { name: string; weeklyCapa: number };

function parseRow(cells: string[], row: number) {
  const name = (cells[0] ?? "").trim();
  const weeklyCapa = Number((cells[1] ?? "").trim());

  if (!name) return { row, error: "법인명이 비어 있습니다." };
  if (!Number.isInteger(weeklyCapa) || weeklyCapa <= 0) {
    return { row, error: "주간 Capa는 1 이상의 정수여야 합니다." };
  }
  return { row, data: { name, weeklyCapa } };
}

export default function CorporationBulkImport() {
  const router = useRouter();

  return (
    <BulkImportPanel<Row>
      title="엑셀 붙여넣기/파일 첨부로 일괄 등록"
      columnLabels={["법인명", "주간 Capa"]}
      parseRow={parseRow}
      renderPreview={(r) => (
        <tr className="border-b border-slate-100 last:border-0">
          <td className="px-3 py-1.5">{r.name}</td>
          <td className="px-3 py-1.5">{r.weeklyCapa}</td>
        </tr>
      )}
      onCommit={(rows) => bulkCreateCorporations(rows)}
      onSuccess={() => router.refresh()}
    />
  );
}

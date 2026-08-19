"use client";

import { exportToExcel, type ExcelCell } from "@/lib/excel/exportExcel";

type Props = {
  filename: string;
  sheetName: string;
  headers: string[];
  rows: ExcelCell[][];
};

export default function ExportExcelButton({ filename, sheetName, headers, rows }: Props) {
  return (
    <button
      type="button"
      onClick={() => exportToExcel(filename, sheetName, headers, rows)}
      className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
    >
      엑셀 다운로드
    </button>
  );
}

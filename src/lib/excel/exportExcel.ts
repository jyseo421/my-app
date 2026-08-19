import * as XLSX from "xlsx";

export type ExcelCell = string | number | null;

// 헤더 + 데이터 배열을 엑셀 파일로 만들어 바로 다운로드한다.
export function exportToExcel(
  filename: string,
  sheetName: string,
  headers: string[],
  rows: ExcelCell[][]
) {
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
}

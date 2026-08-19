import * as XLSX from "xlsx";

// 엑셀에서 복사한 데이터를 붙여넣으면 클립보드에 탭으로 구분된 표 형태 텍스트가 들어온다.
export function parseClipboardText(text: string): string[][] {
  return text
    .split(/\r\n|\r|\n/)
    .filter((line) => line.trim() !== "")
    .map((line) => line.split("\t").map((cell) => cell.trim()));
}

// 첨부한 엑셀(.xlsx/.xls) 또는 CSV 파일의 첫 번째 시트를 표 형태(문자열 2차원 배열)로 읽는다.
export async function parseSpreadsheetFile(file: File): Promise<string[][]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false, defval: "" });
  return rows
    .filter((row) => row.some((cell) => String(cell ?? "").trim() !== ""))
    .map((row) => row.map((cell) => String(cell ?? "").trim()));
}

export function parseYesNo(cell: string): boolean {
  const v = cell.trim().toLowerCase();
  return v === "y" || v === "예" || v === "o" || v === "true";
}

export function parseDevMode(cell: string): "parallel" | "serial" | null {
  const v = cell.trim();
  if (v === "병렬" || v.toLowerCase() === "parallel") return "parallel";
  if (v === "직렬" || v.toLowerCase() === "serial") return "serial";
  return null;
}

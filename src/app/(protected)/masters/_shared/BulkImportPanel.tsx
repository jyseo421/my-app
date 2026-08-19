"use client";

import { Fragment, useState } from "react";
import { parseClipboardText, parseSpreadsheetFile } from "@/lib/bulk-import/parseRows";

type RowResult<T> = { row: number; data: T } | { row: number; error: string };

type Props<T> = {
  title: string;
  columnLabels: string[];
  parseRow: (cells: string[], rowNumber: number) => RowResult<T>;
  renderPreview: (data: T) => React.ReactNode;
  onCommit: (rows: T[]) => Promise<{ error?: string }>;
  onSuccess: () => void;
};

// 마스터/모델 화면에서 공통으로 쓰는 엑셀 붙여넣기(Ctrl+V)·파일 첨부 일괄 등록 패널.
// 한 행이라도 문제가 있으면 전체 등록을 막고, 문제 없을 때만 "일괄 등록" 버튼을 보여준다.
export default function BulkImportPanel<T>({
  title,
  columnLabels,
  parseRow,
  renderPreview,
  onCommit,
  onSuccess,
}: Props<T>) {
  const [results, setResults] = useState<RowResult<T>[] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function processRows(rawRows: string[][]) {
    setResults(rawRows.map((cells, i) => parseRow(cells, i + 1)));
    setSubmitError(null);
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const text = e.clipboardData.getData("text/plain");
    if (!text.trim()) return;
    processRows(parseClipboardText(text));
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    processRows(await parseSpreadsheetFile(file));
  }

  const errors = results?.filter((r): r is { row: number; error: string } => "error" in r) ?? [];
  const validRows = results?.filter((r): r is { row: number; data: T } => "data" in r) ?? [];
  const hasResults = results !== null;
  const hasErrors = errors.length > 0;

  async function handleCommit() {
    setSubmitting(true);
    setSubmitError(null);
    const result = await onCommit(validRows.map((r) => r.data));
    setSubmitting(false);
    if (result?.error) {
      setSubmitError(result.error);
      return;
    }
    setResults(null);
    onSuccess();
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-2 text-sm font-medium text-slate-700">{title}</h2>
      <p className="mb-2 text-xs text-slate-500">
        엑셀에서 아래 열 순서 그대로(헤더 행 없이 데이터만) 복사해서 붙여넣거나(Ctrl+V), 파일을
        첨부하세요.
        <br />
        <span className="font-medium text-slate-600">{columnLabels.join(" · ")}</span>
      </p>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <textarea
          onPaste={handlePaste}
          rows={2}
          placeholder="여기를 클릭하고 Ctrl+V로 붙여넣기"
          className="flex-1 rounded-md border border-dashed border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        />
        <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="text-sm" />
      </div>

      {hasResults && (
        <div className="mt-3">
          {hasErrors ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <p className="mb-1 font-medium">
                아래 문제로 전체 등록이 차단되었습니다 ({errors.length}건). 데이터를 고친 뒤 다시
                붙여넣어 주세요.
              </p>
              <ul className="list-inside list-disc">
                {errors.map((e, i) => (
                  <li key={i}>
                    {e.row}행: {e.error}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div>
              <p className="mb-2 text-sm text-slate-600">
                {validRows.length}건을 등록할 준비가 되었습니다. 내용을 확인하고 등록하세요.
              </p>
              <div className="max-h-64 overflow-auto rounded-md border border-slate-200">
                <table className="w-full text-sm">
                  <tbody>
                    {validRows.map((r) => (
                      <Fragment key={r.row}>{renderPreview(r.data)}</Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              {submitError && <p className="mt-2 text-sm text-red-600">{submitError}</p>}
              <button
                onClick={handleCommit}
                disabled={submitting}
                className="mt-3 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {submitting ? "등록 중..." : `일괄 등록 (${validRows.length}건)`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

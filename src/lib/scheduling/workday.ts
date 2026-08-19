import Holidays from "date-holidays";
import { addDays, getISOWeek, isWeekend as isCalendarWeekend, startOfISOWeek } from "date-fns";

// 한국 공휴일 데이터 (별도 API 키/네트워크 요청 없이 오프라인으로 계산됨)
const koreanHolidays = new Holidays("KR");

export function isKoreanHoliday(date: Date): boolean {
  return koreanHolidays.isHoliday(date) !== false;
}

// PRD 기준: 기구/성능개발과 신뢰성 시험은 주말·한국 공휴일에는 진행하지 않는다.
export function isWorkday(date: Date): boolean {
  return !isCalendarWeekend(date) && !isKoreanHoliday(date);
}

// date가 근무일이면 그대로, 아니면 그 다음 첫 근무일을 반환한다.
export function firstWorkdayOnOrAfter(date: Date): Date {
  let cursor = date;
  while (!isWorkday(cursor)) {
    cursor = addDays(cursor, 1);
  }
  return cursor;
}

// date 다음의 첫 근무일을 반환한다 (직렬 작업이 이어질 때 사용).
export function nextWorkday(date: Date): Date {
  return firstWorkdayOnOrAfter(addDays(date, 1));
}

// startDate에서 시작해 "근무일 기준 durationDays일"이 걸리는 작업의 종료일을 구한다.
// 시작일이 근무일이 아니면 다음 근무일부터 시작하고, 시작일 자체를 1일차로 센다.
export function addWorkdays(startDate: Date, durationDays: number): Date {
  if (!Number.isInteger(durationDays) || durationDays <= 0) {
    throw new Error("durationDays는 1 이상의 정수여야 합니다.");
  }

  let cursor = firstWorkdayOnOrAfter(startDate);

  let remaining = durationDays - 1;
  while (remaining > 0) {
    cursor = addDays(cursor, 1);
    if (isWorkday(cursor)) remaining -= 1;
  }

  return cursor;
}

// 규격취득은 신뢰성 시험과 달리 공휴일을 제외하지 않고 캘린더 주(週) 그대로 계산한다.
export function addCalendarWeeks(startDate: Date, weeks: number): Date {
  if (!Number.isInteger(weeks) || weeks < 0) {
    throw new Error("weeks는 0 이상의 정수여야 합니다.");
  }
  return addDays(startDate, weeks * 7);
}

// 완료 주 판정 기준(월요일 시작, ISO week)의 시작일을 반환한다.
export function startOfCompletionWeek(date: Date): Date {
  return startOfISOWeek(date);
}

// Date를 "YYYY-MM-DD"로 표기한다. Date.toISOString()은 UTC로 변환하면서
// 한국 시간대(UTC+9) 기준 날짜보다 하루 이른 날짜를 반환할 수 있어 쓰지 않는다.
export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// "YYYY-MM-DD" 완료 주 날짜(월요일)를 "W33 (33주차)" 형태로 표기한다.
export function formatIsoWeekLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const week = getISOWeek(new Date(y, m - 1, d));
  const weekStr = String(week).padStart(2, "0");
  return `W${weekStr} (${weekStr}주차)`;
}

import {
  addWorkdays,
  addCalendarWeeks,
  nextWorkday,
  startOfCompletionWeek,
} from "./workday";

export type TestItem = {
  durationDays: number;
  executionMode: "parallel" | "serial";
};

export type CompletionScheduleInput = {
  devMechanicalEnd: Date;
  devPerformanceEnd: Date;
  tests: TestItem[];
  certificationRequired: boolean;
  certificationWeeks: number;
};

export type CompletionScheduleResult = {
  reliabilityTestStart: Date;
  reliabilityTestEnd: Date;
  certificationEnd: Date | null;
  completionDate: Date;
  completionWeekStart: Date;
};

// 신뢰성 시험(항목별 병렬/직렬)과 규격취득(신뢰성 시험과 항상 병렬)을 계산하고,
// 개발 완료일과 완료 주(월요일 시작 기준)를 확정한다 (PRD 5절).
export function calculateCompletionSchedule({
  devMechanicalEnd,
  devPerformanceEnd,
  tests,
  certificationRequired,
  certificationWeeks,
}: CompletionScheduleInput): CompletionScheduleResult {
  // 신뢰성 시험은 기구개발·성능개발이 모두 끝난 다음 근무일부터 시작한다.
  const devEnd = devMechanicalEnd > devPerformanceEnd ? devMechanicalEnd : devPerformanceEnd;
  const reliabilityTestStart = nextWorkday(devEnd);

  const parallelItems = tests.filter((t) => t.executionMode === "parallel");
  const serialItems = tests.filter((t) => t.executionMode === "serial");

  let reliabilityTestEnd = reliabilityTestStart;

  // 병렬 항목: 모두 같은 날 시작, 가장 오래 걸리는 항목이 끝나는 날 완료
  if (parallelItems.length > 0) {
    const maxDuration = Math.max(...parallelItems.map((t) => t.durationDays));
    const parallelEnd = addWorkdays(reliabilityTestStart, maxDuration);
    if (parallelEnd > reliabilityTestEnd) reliabilityTestEnd = parallelEnd;
  }

  // 직렬 항목: 순서대로 하나씩 이어서 진행 (항목 간 순서는 총 소요시간에 영향 없음)
  if (serialItems.length > 0) {
    let cursor: Date | null = null;
    for (const item of serialItems) {
      const itemStart = cursor === null ? reliabilityTestStart : nextWorkday(cursor);
      cursor = addWorkdays(itemStart, item.durationDays);
    }
    if (cursor !== null && cursor > reliabilityTestEnd) reliabilityTestEnd = cursor;
  }

  // 규격취득: "필요" 모델만, 신뢰성 시험과 같은 날 시작해서 캘린더 주 단위로 계산
  const certificationEnd = certificationRequired
    ? addCalendarWeeks(reliabilityTestStart, certificationWeeks)
    : null;

  const completionDate =
    certificationEnd !== null && certificationEnd > reliabilityTestEnd
      ? certificationEnd
      : reliabilityTestEnd;

  return {
    reliabilityTestStart,
    reliabilityTestEnd,
    certificationEnd,
    completionDate,
    completionWeekStart: startOfCompletionWeek(completionDate),
  };
}

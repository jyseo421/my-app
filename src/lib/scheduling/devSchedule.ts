import { addWorkdays, firstWorkdayOnOrAfter, nextWorkday } from "./workday";

export type DevMode = "parallel" | "serial";

export type DevScheduleInput = {
  startDate: Date;
  devMode: DevMode;
  mechanicalDevDays: number;
  performanceDevDays: number;
};

export type DevScheduleResult = {
  mechanicalStart: Date;
  mechanicalEnd: Date;
  performanceStart: Date;
  performanceEnd: Date;
};

// 사양그룹의 병렬/직렬 설정에 따라 기구개발(설계)·성능개발(성능검토·진동소음검토)의
// 시작/종료일을 계산한다 (PRD 5절). 병렬이면 둘 다 시작 기준일부터 동시에 시작하고,
// 직렬이면 기구개발이 끝난 다음 근무일부터 성능개발이 이어서 시작한다.
export function calculateDevSchedule({
  startDate,
  devMode,
  mechanicalDevDays,
  performanceDevDays,
}: DevScheduleInput): DevScheduleResult {
  const mechanicalStart = firstWorkdayOnOrAfter(startDate);
  const mechanicalEnd = addWorkdays(mechanicalStart, mechanicalDevDays);

  const performanceStart =
    devMode === "parallel" ? firstWorkdayOnOrAfter(startDate) : nextWorkday(mechanicalEnd);
  const performanceEnd = addWorkdays(performanceStart, performanceDevDays);

  return { mechanicalStart, mechanicalEnd, performanceStart, performanceEnd };
}

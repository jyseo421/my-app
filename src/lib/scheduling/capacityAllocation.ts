import { addDays } from "date-fns";

export type CapacityModelInput = {
  modelId: string;
  corporationId: string;
  specGroupPriority: number;
  destinationPriority: number;
  completionWeekStart: Date;
};

export type CapacityModelResult = {
  modelId: string;
  completionWeekStart: Date;
  deferredWeeks: number;
};

const MAX_ITERATIONS = 520; // 최대 10년치 주(週)까지 이월을 시도해보고, 그래도 안 되면 멈춘다

// 법인별 주간 Capa를 초과하는 주가 있으면, 사양그룹 우선순위 -> 동일 그룹 내 출향지
// 우선순위 순으로 낮은 우선순위 모델의 완료 주를 다음 주로 이월한다. 이월 때문에 다음 주가
// 다시 초과되면 더 이상 초과가 없을 때까지 반복한다 (PRD 5절, DESIGN.md 처리 5~6).
export function applyCorporationCapacity(
  models: CapacityModelInput[],
  weeklyCapaByCorporation: Record<string, number>
): CapacityModelResult[] {
  const working = models.map((m) => ({
    ...m,
    currentWeek: m.completionWeekStart,
    deferredWeeks: 0,
  }));

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const groups = new Map<string, typeof working>();
    for (const m of working) {
      const key = `${m.corporationId}__${m.currentWeek.getTime()}`;
      const group = groups.get(key);
      if (group) group.push(m);
      else groups.set(key, [m]);
    }

    let anyDeferred = false;

    for (const group of groups.values()) {
      const capa = weeklyCapaByCorporation[group[0].corporationId] ?? 0;
      if (group.length <= capa) continue;

      group.sort(
        (a, b) => a.specGroupPriority - b.specGroupPriority || a.destinationPriority - b.destinationPriority
      );

      for (const overflow of group.slice(capa)) {
        overflow.currentWeek = addDays(overflow.currentWeek, 7);
        overflow.deferredWeeks += 1;
        anyDeferred = true;
      }
    }

    if (!anyDeferred) break;
  }

  return working.map((m) => ({
    modelId: m.modelId,
    completionWeekStart: m.currentWeek,
    deferredWeeks: m.deferredWeeks,
  }));
}

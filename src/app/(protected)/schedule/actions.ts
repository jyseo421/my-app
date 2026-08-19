"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import { calculateDevSchedule } from "@/lib/scheduling/devSchedule";
import { calculateCompletionSchedule } from "@/lib/scheduling/completionSchedule";
import { applyCorporationCapacity, type CapacityModelInput } from "@/lib/scheduling/capacityAllocation";
import { formatLocalDate } from "@/lib/scheduling/workday";
import { addDays } from "date-fns";
import type { ActionState } from "@/lib/forms/actionState";

const MODEL_TABLE = "02_model";
const CORPORATION_TABLE = "01_corporation";
const SPEC_GROUP_TABLE = "03_spec_group";
const DESTINATION_TABLE = "04_shipping_destination";
const TEST_TABLE = "05_reliability_test";
const MODEL_TEST_TABLE = "06_model_test";
const RUN_TABLE = "07_schedule_run";
const RESULT_TABLE = "08_schedule_result";

export type ModelCheckResult = { ready: boolean; modelCount: number };

export async function checkReadyToRun(): Promise<ModelCheckResult> {
  const { count, error } = await supabaseAdmin.from(MODEL_TABLE).select("id", { count: "exact", head: true });
  if (error) throw error;
  return { ready: (count ?? 0) > 0, modelCount: count ?? 0 };
}

export async function runScheduling(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const startDateRaw = String(formData.get("start_date") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDateRaw)) {
    return { error: "일정 시작 기준일을 입력하세요." };
  }
  const [y, m, d] = startDateRaw.split("-").map(Number);
  const startDate = new Date(y, m - 1, d);

  const [models, corporations, specGroups, destinations, tests, modelTests] = await Promise.all([
    supabaseAdmin
      .from(MODEL_TABLE)
      .select("id, name, spec_group_id, shipping_destination_id, corporation_id, certification_required")
      .then((r) => r.data ?? []),
    supabaseAdmin.from(CORPORATION_TABLE).select("id, weekly_capa").then((r) => r.data ?? []),
    supabaseAdmin
      .from(SPEC_GROUP_TABLE)
      .select("id, dev_mode, priority, mechanical_dev_days, performance_dev_days")
      .then((r) => r.data ?? []),
    supabaseAdmin.from(DESTINATION_TABLE).select("id, priority, certification_weeks").then((r) => r.data ?? []),
    supabaseAdmin.from(TEST_TABLE).select("id, duration_days, execution_mode").then((r) => r.data ?? []),
    supabaseAdmin.from(MODEL_TEST_TABLE).select("model_id, test_id").then((r) => r.data ?? []),
  ]);

  if (models.length === 0) {
    return { error: "등록된 모델이 없습니다. 먼저 모델을 등록하세요." };
  }

  const corpById = new Map(corporations.map((c) => [c.id, c]));
  const specGroupById = new Map(specGroups.map((g) => [g.id, g]));
  const destinationById = new Map(destinations.map((d) => [d.id, d]));
  const testById = new Map(tests.map((t) => [t.id, t]));
  const testIdsByModel = new Map<string, string[]>();
  for (const row of modelTests) {
    (testIdsByModel.get(row.model_id) ?? testIdsByModel.set(row.model_id, []).get(row.model_id)!).push(
      row.test_id
    );
  }

  // 필수 참조 데이터가 빠진 모델이 있으면 실행 자체를 막는다.
  const missing = models.filter(
    (m) =>
      !specGroupById.has(m.spec_group_id) ||
      !destinationById.has(m.shipping_destination_id) ||
      !corpById.has(m.corporation_id)
  );
  if (missing.length > 0) {
    return {
      error: `${missing.length}개 모델의 사양그룹/출향지/법인 정보를 찾을 수 없습니다: ${missing
        .map((m) => m.name)
        .join(", ")}`,
    };
  }

  type Computed = {
    modelId: string;
    corporationId: string;
    specGroupPriority: number;
    destinationPriority: number;
    mechanicalStart: Date;
    mechanicalEnd: Date;
    performanceStart: Date;
    performanceEnd: Date;
    reliabilityTestEnd: Date;
    certificationEnd: Date | null;
    completionDate: Date;
    completionWeekStart: Date;
  };

  const computed: Computed[] = models.map((m) => {
    const specGroup = specGroupById.get(m.spec_group_id)!;
    const destination = destinationById.get(m.shipping_destination_id)!;

    const dev = calculateDevSchedule({
      startDate,
      devMode: specGroup.dev_mode,
      mechanicalDevDays: specGroup.mechanical_dev_days,
      performanceDevDays: specGroup.performance_dev_days,
    });

    const testItems = (testIdsByModel.get(m.id) ?? [])
      .map((testId) => testById.get(testId))
      .filter((t): t is NonNullable<typeof t> => !!t)
      .map((t) => ({ durationDays: t.duration_days, executionMode: t.execution_mode }));

    const completion = calculateCompletionSchedule({
      devMechanicalEnd: dev.mechanicalEnd,
      devPerformanceEnd: dev.performanceEnd,
      tests: testItems,
      certificationRequired: m.certification_required,
      certificationWeeks: destination.certification_weeks,
    });

    return {
      modelId: m.id,
      corporationId: m.corporation_id,
      specGroupPriority: specGroup.priority,
      destinationPriority: destination.priority,
      mechanicalStart: dev.mechanicalStart,
      mechanicalEnd: dev.mechanicalEnd,
      performanceStart: dev.performanceStart,
      performanceEnd: dev.performanceEnd,
      reliabilityTestEnd: completion.reliabilityTestEnd,
      certificationEnd: completion.certificationEnd,
      completionDate: completion.completionDate,
      completionWeekStart: completion.completionWeekStart,
    };
  });

  const weeklyCapaByCorporation = Object.fromEntries(corporations.map((c) => [c.id, c.weekly_capa]));
  const capacityInput: CapacityModelInput[] = computed.map((c) => ({
    modelId: c.modelId,
    corporationId: c.corporationId,
    specGroupPriority: c.specGroupPriority,
    destinationPriority: c.destinationPriority,
    completionWeekStart: c.completionWeekStart,
  }));
  const capacityResult = applyCorporationCapacity(capacityInput, weeklyCapaByCorporation);
  const deferredByModel = new Map(capacityResult.map((r) => [r.modelId, r.deferredWeeks]));

  const { data: run, error: runError } = await supabaseAdmin
    .from(RUN_TABLE)
    .insert({ start_date: startDateRaw })
    .select("id")
    .single();

  if (runError || !run) return { error: "일정 실행 이력 저장에 실패했습니다." };

  const resultRows = computed.map((c) => {
    const deferredWeeks = deferredByModel.get(c.modelId) ?? 0;
    const shift = deferredWeeks * 7;
    const completionDate = addDays(c.completionDate, shift);
    const completionWeek = addDays(c.completionWeekStart, shift);

    return {
      run_id: run.id,
      model_id: c.modelId,
      mechanical_start: formatLocalDate(c.mechanicalStart),
      mechanical_end: formatLocalDate(c.mechanicalEnd),
      performance_start: formatLocalDate(c.performanceStart),
      performance_end: formatLocalDate(c.performanceEnd),
      reliability_test_end: formatLocalDate(c.reliabilityTestEnd),
      certification_end: c.certificationEnd ? formatLocalDate(addDays(c.certificationEnd, shift)) : null,
      completion_date: formatLocalDate(completionDate),
      completion_week: formatLocalDate(completionWeek),
    };
  });

  const { error: insertError } = await supabaseAdmin.from(RESULT_TABLE).insert(resultRows);
  if (insertError) return { error: "일정 결과 저장에 실패했습니다." };

  revalidatePath("/schedule");
  return { ok: true };
}

export type ScheduleResultRow = {
  model_id: string;
  model_name: string;
  corporation_name: string;
  mechanical_start: string;
  mechanical_end: string;
  performance_start: string;
  performance_end: string;
  reliability_test_end: string;
  certification_end: string | null;
  completion_date: string;
  completion_week: string;
};

export type ScheduleRun = {
  runId: string;
  startDate: string;
  createdAt: string;
  results: ScheduleResultRow[];
};

async function fetchResultRows(
  runId: string,
  modelById: Map<string, { name: string; corporation_id: string }>,
  corpById: Map<string, string>
): Promise<ScheduleResultRow[]> {
  const { data: results, error } = await supabaseAdmin
    .from(RESULT_TABLE)
    .select(
      "model_id, mechanical_start, mechanical_end, performance_start, performance_end, reliability_test_end, certification_end, completion_date, completion_week"
    )
    .eq("run_id", runId);

  if (error) throw error;

  return (results ?? [])
    .map((r) => {
      const model = modelById.get(r.model_id);
      return {
        model_id: r.model_id,
        model_name: model?.name ?? "(삭제된 모델)",
        corporation_name: corpById.get(model?.corporation_id ?? "") ?? "-",
        mechanical_start: r.mechanical_start,
        mechanical_end: r.mechanical_end,
        performance_start: r.performance_start,
        performance_end: r.performance_end,
        reliability_test_end: r.reliability_test_end,
        certification_end: r.certification_end,
        completion_date: r.completion_date,
        completion_week: r.completion_week,
      };
    })
    .sort((a, b) => a.completion_date.localeCompare(b.completion_date) || a.model_name.localeCompare(b.model_name));
}

// 최신 실행(run)과, 비교 화면에 쓸 그 직전 실행을 함께 가져온다.
export async function getRecentRuns(): Promise<{ latest: ScheduleRun | null; previous: ScheduleRun | null }> {
  const [{ data: runs, error: runsError }, { data: models }, { data: corporations }] = await Promise.all([
    supabaseAdmin.from(RUN_TABLE).select("id, start_date, created_at").order("created_at", { ascending: false }).limit(2),
    supabaseAdmin.from(MODEL_TABLE).select("id, name, corporation_id"),
    supabaseAdmin.from(CORPORATION_TABLE).select("id, name"),
  ]);

  if (runsError) throw runsError;
  if (!runs || runs.length === 0) return { latest: null, previous: null };

  const modelById = new Map((models ?? []).map((m) => [m.id, { name: m.name, corporation_id: m.corporation_id }]));
  const corpById = new Map((corporations ?? []).map((c) => [c.id, c.name]));

  const [latestResults, previousResults] = await Promise.all([
    fetchResultRows(runs[0].id, modelById, corpById),
    runs[1] ? fetchResultRows(runs[1].id, modelById, corpById) : Promise.resolve(null),
  ]);

  return {
    latest: { runId: runs[0].id, startDate: runs[0].start_date, createdAt: runs[0].created_at, results: latestResults },
    previous: runs[1]
      ? { runId: runs[1].id, startDate: runs[1].start_date, createdAt: runs[1].created_at, results: previousResults! }
      : null,
  };
}

"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/forms/actionState";

const TABLE = "05_reliability_test";

export type ExecutionMode = "parallel" | "serial";

export type ReliabilityTest = {
  id: string;
  name: string;
  duration_days: number;
  execution_mode: ExecutionMode;
};

export async function listReliabilityTests(): Promise<ReliabilityTest[]> {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select("id, name, duration_days, execution_mode")
    .order("name");

  if (error) throw error;
  return data ?? [];
}

function parseInput(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const executionMode = String(formData.get("execution_mode") ?? "");
  const durationRaw = String(formData.get("duration_days") ?? "").trim();
  const durationDays = Number(durationRaw);

  if (!name) return { error: "항목명을 입력하세요." } as const;
  if (executionMode !== "parallel" && executionMode !== "serial") {
    return { error: "병렬/직렬 여부를 선택하세요." } as const;
  }
  if (!Number.isInteger(durationDays) || durationDays <= 0) {
    return { error: "소요시간은 1일 이상의 정수여야 합니다." } as const;
  }
  return { name, executionMode: executionMode as ExecutionMode, durationDays } as const;
}

export async function createReliabilityTest(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseInput(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { error } = await supabaseAdmin.from(TABLE).insert({
    name: parsed.name,
    execution_mode: parsed.executionMode,
    duration_days: parsed.durationDays,
  });

  if (error) {
    if (error.code === "23505") return { error: "이미 같은 이름의 시험 항목이 있습니다." };
    return { error: "등록에 실패했습니다." };
  }

  revalidatePath("/masters/tests");
  return { ok: true };
}

export async function updateReliabilityTest(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const id = String(formData.get("id") ?? "");
  const parsed = parseInput(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { error } = await supabaseAdmin
    .from(TABLE)
    .update({
      name: parsed.name,
      execution_mode: parsed.executionMode,
      duration_days: parsed.durationDays,
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") return { error: "이미 같은 이름의 시험 항목이 있습니다." };
    return { error: "수정에 실패했습니다." };
  }

  revalidatePath("/masters/tests");
  return { ok: true };
}

export async function bulkCreateReliabilityTests(
  rows: { name: string; executionMode: ExecutionMode; durationDays: number }[]
) {
  const { error } = await supabaseAdmin.from(TABLE).insert(
    rows.map((r) => ({
      name: r.name,
      execution_mode: r.executionMode,
      duration_days: r.durationDays,
    }))
  );

  if (error) {
    if (error.code === "23505") {
      return { error: "붙여넣은 데이터 안에 이미 있는 이름의 시험 항목이 있습니다." };
    }
    return { error: "일괄 등록에 실패했습니다." };
  }

  revalidatePath("/masters/tests");
  return {};
}

export async function deleteReliabilityTest(id: string) {
  const { error } = await supabaseAdmin.from(TABLE).delete().eq("id", id);

  if (error) {
    if (error.code === "23503") {
      return { error: "이 시험 항목을 사용 중인 모델이 있어 삭제할 수 없습니다." };
    }
    return { error: "삭제에 실패했습니다." };
  }

  revalidatePath("/masters/tests");
  return { ok: true };
}

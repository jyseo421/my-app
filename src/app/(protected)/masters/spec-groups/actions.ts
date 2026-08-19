"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/forms/actionState";

const TABLE = "03_spec_group";

export type DevMode = "parallel" | "serial";

export type SpecGroup = {
  id: string;
  name: string;
  dev_mode: DevMode;
  priority: number;
  mechanical_dev_days: number;
  performance_dev_days: number;
};

export async function listSpecGroups(): Promise<SpecGroup[]> {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select("id, name, dev_mode, priority, mechanical_dev_days, performance_dev_days")
    .order("priority");

  if (error) throw error;
  return data ?? [];
}

function parseInput(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const devMode = String(formData.get("dev_mode") ?? "");
  const priorityRaw = String(formData.get("priority") ?? "").trim();
  const priority = Number(priorityRaw);
  const mechanicalDevDays = Number(String(formData.get("mechanical_dev_days") ?? "").trim());
  const performanceDevDays = Number(String(formData.get("performance_dev_days") ?? "").trim());

  if (!name) return { error: "그룹명을 입력하세요." } as const;
  if (devMode !== "parallel" && devMode !== "serial") {
    return { error: "기구·성능개발 진행 방식을 선택하세요." } as const;
  }
  if (!Number.isInteger(priority) || priority <= 0) {
    return { error: "우선순위는 1 이상의 정수여야 합니다." } as const;
  }
  if (!Number.isInteger(mechanicalDevDays) || mechanicalDevDays <= 0) {
    return { error: "기구개발 소요일은 1 이상의 정수여야 합니다." } as const;
  }
  if (!Number.isInteger(performanceDevDays) || performanceDevDays <= 0) {
    return { error: "성능개발 소요일은 1 이상의 정수여야 합니다." } as const;
  }
  return {
    name,
    devMode: devMode as DevMode,
    priority,
    mechanicalDevDays,
    performanceDevDays,
  } as const;
}

export async function createSpecGroup(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseInput(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { error } = await supabaseAdmin.from(TABLE).insert({
    name: parsed.name,
    dev_mode: parsed.devMode,
    priority: parsed.priority,
    mechanical_dev_days: parsed.mechanicalDevDays,
    performance_dev_days: parsed.performanceDevDays,
  });

  if (error) {
    if (error.code === "23505") return { error: "이미 같은 이름 또는 같은 우선순위의 사양그룹이 있습니다." };
    return { error: "등록에 실패했습니다." };
  }

  revalidatePath("/masters/spec-groups");
  return { ok: true };
}

export async function updateSpecGroup(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const id = String(formData.get("id") ?? "");
  const parsed = parseInput(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { error } = await supabaseAdmin
    .from(TABLE)
    .update({
      name: parsed.name,
      dev_mode: parsed.devMode,
      priority: parsed.priority,
      mechanical_dev_days: parsed.mechanicalDevDays,
      performance_dev_days: parsed.performanceDevDays,
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") return { error: "이미 같은 이름 또는 같은 우선순위의 사양그룹이 있습니다." };
    return { error: "수정에 실패했습니다." };
  }

  revalidatePath("/masters/spec-groups");
  return { ok: true };
}

export async function bulkCreateSpecGroups(
  rows: {
    name: string;
    devMode: DevMode;
    priority: number;
    mechanicalDevDays: number;
    performanceDevDays: number;
  }[]
) {
  const { error } = await supabaseAdmin.from(TABLE).insert(
    rows.map((r) => ({
      name: r.name,
      dev_mode: r.devMode,
      priority: r.priority,
      mechanical_dev_days: r.mechanicalDevDays,
      performance_dev_days: r.performanceDevDays,
    }))
  );

  if (error) {
    if (error.code === "23505") {
      return { error: "붙여넣은 데이터 안에 이미 있는 이름 또는 우선순위가 있습니다." };
    }
    return { error: "일괄 등록에 실패했습니다." };
  }

  revalidatePath("/masters/spec-groups");
  return {};
}

export async function deleteSpecGroup(id: string) {
  const { error } = await supabaseAdmin.from(TABLE).delete().eq("id", id);

  if (error) {
    if (error.code === "23503") {
      return { error: "이 사양그룹을 사용 중인 모델이 있어 삭제할 수 없습니다." };
    }
    return { error: "삭제에 실패했습니다." };
  }

  revalidatePath("/masters/spec-groups");
  return { ok: true };
}

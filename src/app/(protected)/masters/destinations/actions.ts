"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/forms/actionState";

const TABLE = "04_shipping_destination";

export type ShippingDestination = {
  id: string;
  name: string;
  priority: number;
  certification_weeks: number;
};

export async function listShippingDestinations(): Promise<ShippingDestination[]> {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select("id, name, priority, certification_weeks")
    .order("priority");

  if (error) throw error;
  return data ?? [];
}

function parseInput(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const priorityRaw = String(formData.get("priority") ?? "").trim();
  const weeksRaw = String(formData.get("certification_weeks") ?? "").trim();
  const priority = Number(priorityRaw);
  const certificationWeeks = Number(weeksRaw);

  if (!name) return { error: "출향지명을 입력하세요." } as const;
  if (!Number.isInteger(priority) || priority <= 0) {
    return { error: "우선순위는 1 이상의 정수여야 합니다." } as const;
  }
  if (!Number.isInteger(certificationWeeks) || certificationWeeks < 0) {
    return { error: "규격취득 소요시간은 0 이상의 정수(주)여야 합니다." } as const;
  }
  return { name, priority, certificationWeeks } as const;
}

export async function createShippingDestination(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseInput(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { error } = await supabaseAdmin.from(TABLE).insert({
    name: parsed.name,
    priority: parsed.priority,
    certification_weeks: parsed.certificationWeeks,
  });

  if (error) {
    if (error.code === "23505") return { error: "이미 같은 이름 또는 같은 우선순위의 출향지가 있습니다." };
    return { error: "등록에 실패했습니다." };
  }

  revalidatePath("/masters/destinations");
  return { ok: true };
}

export async function updateShippingDestination(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const id = String(formData.get("id") ?? "");
  const parsed = parseInput(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { error } = await supabaseAdmin
    .from(TABLE)
    .update({
      name: parsed.name,
      priority: parsed.priority,
      certification_weeks: parsed.certificationWeeks,
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") return { error: "이미 같은 이름 또는 같은 우선순위의 출향지가 있습니다." };
    return { error: "수정에 실패했습니다." };
  }

  revalidatePath("/masters/destinations");
  return { ok: true };
}

export async function bulkCreateShippingDestinations(
  rows: { name: string; priority: number; certificationWeeks: number }[]
) {
  const { error } = await supabaseAdmin.from(TABLE).insert(
    rows.map((r) => ({
      name: r.name,
      priority: r.priority,
      certification_weeks: r.certificationWeeks,
    }))
  );

  if (error) {
    if (error.code === "23505") {
      return { error: "붙여넣은 데이터 안에 이미 있는 이름 또는 우선순위가 있습니다." };
    }
    return { error: "일괄 등록에 실패했습니다." };
  }

  revalidatePath("/masters/destinations");
  return {};
}

export async function deleteShippingDestination(id: string) {
  const { error } = await supabaseAdmin.from(TABLE).delete().eq("id", id);

  if (error) {
    if (error.code === "23503") {
      return { error: "이 출향지를 사용 중인 모델이 있어 삭제할 수 없습니다." };
    }
    return { error: "삭제에 실패했습니다." };
  }

  revalidatePath("/masters/destinations");
  return { ok: true };
}

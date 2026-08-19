"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/forms/actionState";

const TABLE = "01_corporation";

export type Corporation = {
  id: string;
  name: string;
  weekly_capa: number;
};

export async function listCorporations(): Promise<Corporation[]> {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select("id, name, weekly_capa")
    .order("name");

  if (error) throw error;
  return data ?? [];
}

function parseInput(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const weeklyCapaRaw = String(formData.get("weekly_capa") ?? "").trim();
  const weeklyCapa = Number(weeklyCapaRaw);

  if (!name) return { error: "법인명을 입력하세요." } as const;
  if (!Number.isInteger(weeklyCapa) || weeklyCapa <= 0) {
    return { error: "주간 Capa는 1 이상의 정수여야 합니다." } as const;
  }
  return { name, weeklyCapa } as const;
}

export async function createCorporation(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseInput(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { error } = await supabaseAdmin
    .from(TABLE)
    .insert({ name: parsed.name, weekly_capa: parsed.weeklyCapa });

  if (error) {
    if (error.code === "23505") return { error: "이미 같은 이름의 법인이 있습니다." };
    return { error: "등록에 실패했습니다." };
  }

  revalidatePath("/masters/corporations");
  return { ok: true };
}

export async function updateCorporation(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const id = String(formData.get("id") ?? "");
  const parsed = parseInput(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { error } = await supabaseAdmin
    .from(TABLE)
    .update({ name: parsed.name, weekly_capa: parsed.weeklyCapa })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") return { error: "이미 같은 이름의 법인이 있습니다." };
    return { error: "수정에 실패했습니다." };
  }

  revalidatePath("/masters/corporations");
  return { ok: true };
}

export async function bulkCreateCorporations(rows: { name: string; weeklyCapa: number }[]) {
  const { error } = await supabaseAdmin
    .from(TABLE)
    .insert(rows.map((r) => ({ name: r.name, weekly_capa: r.weeklyCapa })));

  if (error) {
    if (error.code === "23505") {
      return { error: "붙여넣은 데이터 안에 이미 있는 이름의 법인이 있습니다." };
    }
    return { error: "일괄 등록에 실패했습니다." };
  }

  revalidatePath("/masters/corporations");
  return {};
}

export async function deleteCorporation(id: string) {
  const { error } = await supabaseAdmin.from(TABLE).delete().eq("id", id);

  if (error) {
    if (error.code === "23503") {
      return { error: "이 법인을 사용 중인 모델이 있어 삭제할 수 없습니다." };
    }
    return { error: "삭제에 실패했습니다." };
  }

  revalidatePath("/masters/corporations");
  return { ok: true };
}

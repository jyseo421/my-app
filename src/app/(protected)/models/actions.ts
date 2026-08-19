"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/forms/actionState";

const MODEL_TABLE = "02_model";
const MODEL_TEST_TABLE = "06_model_test";
const SPEC_GROUP_TABLE = "03_spec_group";
const DESTINATION_TABLE = "04_shipping_destination";
const CORPORATION_TABLE = "01_corporation";
const TEST_TABLE = "05_reliability_test";

export type Model = {
  id: string;
  name: string;
  spec_group_id: string;
  shipping_destination_id: string;
  corporation_id: string;
  certification_required: boolean;
};

export type Option = { id: string; name: string };
export type CorporationOption = Option & { weekly_capa: number };
export type SpecGroupOption = Option & { mechanical_dev_days: number; performance_dev_days: number };

export async function listModels(): Promise<Model[]> {
  const { data, error } = await supabaseAdmin
    .from(MODEL_TABLE)
    .select("id, name, spec_group_id, shipping_destination_id, corporation_id, certification_required")
    .order("name");

  if (error) throw error;
  return data ?? [];
}

// 모델별로 선택된 신뢰성 시험 항목 id 목록을 한 번에 모아서 반환한다 (N+1 조회 방지).
export async function listModelTestMap(): Promise<Record<string, string[]>> {
  const { data, error } = await supabaseAdmin.from(MODEL_TEST_TABLE).select("model_id, test_id");
  if (error) throw error;

  const map: Record<string, string[]> = {};
  for (const row of data ?? []) {
    (map[row.model_id] ??= []).push(row.test_id);
  }
  return map;
}

export async function listSpecGroupOptions(): Promise<SpecGroupOption[]> {
  const { data, error } = await supabaseAdmin
    .from(SPEC_GROUP_TABLE)
    .select("id, name, mechanical_dev_days, performance_dev_days")
    .order("priority");
  if (error) throw error;
  return data ?? [];
}

export async function listDestinationOptions(): Promise<Option[]> {
  const { data, error } = await supabaseAdmin.from(DESTINATION_TABLE).select("id, name").order("priority");
  if (error) throw error;
  return data ?? [];
}

export async function listCorporationOptions(): Promise<CorporationOption[]> {
  const { data, error } = await supabaseAdmin
    .from(CORPORATION_TABLE)
    .select("id, name, weekly_capa")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function listTestOptions(): Promise<Option[]> {
  const { data, error } = await supabaseAdmin.from(TEST_TABLE).select("id, name").order("name");
  if (error) throw error;
  return data ?? [];
}

function parseInput(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const specGroupId = String(formData.get("spec_group_id") ?? "");
  const shippingDestinationId = String(formData.get("shipping_destination_id") ?? "");
  const corporationId = String(formData.get("corporation_id") ?? "");
  const certificationRequired = formData.get("certification_required") === "on";
  const testIds = formData.getAll("test_ids").map(String);

  if (!name) return { error: "모델명을 입력하세요." } as const;
  if (!specGroupId) return { error: "사양그룹을 선택하세요." } as const;
  if (!shippingDestinationId) return { error: "출향지를 선택하세요." } as const;
  if (!corporationId) return { error: "법인을 선택하세요." } as const;

  return {
    name,
    specGroupId,
    shippingDestinationId,
    corporationId,
    certificationRequired,
    testIds,
  } as const;
}

async function replaceModelTests(modelId: string, testIds: string[]) {
  const { error: deleteError } = await supabaseAdmin.from(MODEL_TEST_TABLE).delete().eq("model_id", modelId);
  if (deleteError) throw deleteError;

  if (testIds.length === 0) return;

  const { error: insertError } = await supabaseAdmin
    .from(MODEL_TEST_TABLE)
    .insert(testIds.map((testId) => ({ model_id: modelId, test_id: testId })));
  if (insertError) throw insertError;
}

export async function createModel(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseInput(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { data, error } = await supabaseAdmin
    .from(MODEL_TABLE)
    .insert({
      name: parsed.name,
      spec_group_id: parsed.specGroupId,
      shipping_destination_id: parsed.shippingDestinationId,
      corporation_id: parsed.corporationId,
      certification_required: parsed.certificationRequired,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "등록에 실패했습니다." };

  try {
    await replaceModelTests(data.id, parsed.testIds);
  } catch {
    return { error: "시험 항목 저장에 실패했습니다." };
  }

  revalidatePath("/models");
  return { ok: true };
}

export async function updateModel(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const id = String(formData.get("id") ?? "");
  const parsed = parseInput(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { error } = await supabaseAdmin
    .from(MODEL_TABLE)
    .update({
      name: parsed.name,
      spec_group_id: parsed.specGroupId,
      shipping_destination_id: parsed.shippingDestinationId,
      corporation_id: parsed.corporationId,
      certification_required: parsed.certificationRequired,
    })
    .eq("id", id);

  if (error) return { error: "수정에 실패했습니다." };

  try {
    await replaceModelTests(id, parsed.testIds);
  } catch {
    return { error: "시험 항목 저장에 실패했습니다." };
  }

  revalidatePath("/models");
  return { ok: true };
}

export type BulkModelRow = {
  name: string;
  specGroupId: string;
  shippingDestinationId: string;
  corporationId: string;
  certificationRequired: boolean;
  testIds: string[];
};

export async function bulkCreateModels(rows: BulkModelRow[]) {
  const { data, error } = await supabaseAdmin
    .from(MODEL_TABLE)
    .insert(
      rows.map((r) => ({
        name: r.name,
        spec_group_id: r.specGroupId,
        shipping_destination_id: r.shippingDestinationId,
        corporation_id: r.corporationId,
        certification_required: r.certificationRequired,
      }))
    )
    .select("id");

  if (error || !data) return { error: "일괄 등록에 실패했습니다." };

  const testRows = data.flatMap((model, i) =>
    rows[i].testIds.map((testId) => ({ model_id: model.id, test_id: testId }))
  );

  if (testRows.length > 0) {
    const { error: testError } = await supabaseAdmin.from(MODEL_TEST_TABLE).insert(testRows);
    if (testError) return { error: "모델은 등록됐지만 시험 항목 연결에 실패했습니다." };
  }

  revalidatePath("/models");
  return {};
}

export async function deleteModel(id: string) {
  const { error } = await supabaseAdmin.from(MODEL_TABLE).delete().eq("id", id);
  if (error) return { error: "삭제에 실패했습니다." };

  revalidatePath("/models");
  return { ok: true };
}

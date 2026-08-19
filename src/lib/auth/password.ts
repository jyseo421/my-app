import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase/server";

// 00_app_setting은 항상 id=true인 행 하나만 존재하는 싱글턴 테이블이다.
// (이름 앞 "00_"은 Supabase 대시보드 테이블 목록 정렬 순서를 맞추기 위한 접두사)
const SETTING_ID = true;

export async function getStoredPasswordHash(): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("00_app_setting")
    .select("password_hash")
    .eq("id", SETTING_ID)
    .maybeSingle();

  if (error) throw error;
  return data?.password_hash ?? null;
}

export async function hasPasswordBeenSet(): Promise<boolean> {
  return (await getStoredPasswordHash()) !== null;
}

export async function setPassword(newPassword: string): Promise<void> {
  const passwordHash = await bcrypt.hash(newPassword, 10);
  const { error } = await supabaseAdmin
    .from("00_app_setting")
    .upsert({ id: SETTING_ID, password_hash: passwordHash, updated_at: new Date().toISOString() });

  if (error) throw error;
}

export async function verifyPassword(candidate: string): Promise<boolean> {
  const hash = await getStoredPasswordHash();
  if (!hash) return false;
  return bcrypt.compare(candidate, hash);
}

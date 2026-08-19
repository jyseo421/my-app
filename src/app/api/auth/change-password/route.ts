import { NextResponse } from "next/server";
import { verifyPassword, setPassword } from "@/lib/auth/password";
import { isSessionTokenValid, SESSION_COOKIE_NAME } from "@/lib/auth/session";

// 로그인된 상태에서만 허용되는 비밀번호 변경. 변경 전 현재 비밀번호를 다시 확인한다.
export async function POST(request: Request) {
  const session = request.headers
    .get("cookie")
    ?.split("; ")
    .find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`))
    ?.split("=")[1];

  if (!(await isSessionTokenValid(session))) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { currentPassword, newPassword } = await request.json();

  if (typeof currentPassword !== "string" || !(await verifyPassword(currentPassword))) {
    return NextResponse.json({ error: "현재 비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  if (typeof newPassword !== "string" || newPassword.length < 4) {
    return NextResponse.json({ error: "새 비밀번호는 4자 이상이어야 합니다." }, { status: 400 });
  }

  await setPassword(newPassword);
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { hasPasswordBeenSet, setPassword } from "@/lib/auth/password";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session";

// 최초 1회만 허용되는 비밀번호 최초 설정.
export async function POST(request: Request) {
  const { password } = await request.json();

  if (typeof password !== "string" || password.length < 4) {
    return NextResponse.json({ error: "비밀번호는 4자 이상이어야 합니다." }, { status: 400 });
  }

  if (await hasPasswordBeenSet()) {
    return NextResponse.json({ error: "이미 비밀번호가 설정되어 있습니다." }, { status: 409 });
  }

  await setPassword(password);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, await createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}

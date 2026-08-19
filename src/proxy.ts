import { NextRequest, NextResponse } from "next/server";
import { isSessionTokenValid, SESSION_COOKIE_NAME } from "@/lib/auth/session";

// /login, /api/auth/* 를 제외한 모든 페이지는 로그인(세션 쿠키)이 있어야 접근 가능하다.
export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (await isSessionTokenValid(token)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)"],
};

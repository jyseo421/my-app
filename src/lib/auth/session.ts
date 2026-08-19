// 계정 없이 "단일 비밀번호"로만 접근을 통제하는 세션 토큰 유틸.
// Edge(middleware)와 Node(API Route) 양쪽에서 동일하게 동작해야 하므로
// Buffer 대신 Web Crypto(SubtleCrypto)만 사용한다.

const COOKIE_NAME = "app_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7일

function bytesToHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmac(data: string): Promise<string> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET 환경변수가 설정되어 있지 않습니다.");
  }
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data)
  );
  return bytesToHex(signature);
}

// 로그인 성공 시 쿠키에 담을 서명된 세션 값을 만든다 (만료시각.서명 형태).
export async function createSessionToken(): Promise<string> {
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  const signature = await hmac(String(expiresAt));
  return `${expiresAt}.${signature}`;
}

// 쿠키 값이 위조되지 않았고 만료되지 않았는지 확인한다.
export async function isSessionTokenValid(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [expiresAtRaw, signature] = token.split(".");
  if (!expiresAtRaw || !signature) return false;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  const expected = await hmac(expiresAtRaw);
  return expected === signature;
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
export const SESSION_MAX_AGE_SECONDS = SESSION_TTL_SECONDS;

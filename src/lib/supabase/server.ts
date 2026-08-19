import { createClient } from "@supabase/supabase-js";

// 서버(API Route, 서버 컴포넌트)에서만 쓰는 Supabase 관리자 클라이언트.
// service role 키는 모든 데이터에 접근 가능하므로 절대 브라우저로 보내면 안 된다.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

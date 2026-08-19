import { createClient } from "@supabase/supabase-js";

// 브라우저(클라이언트 컴포넌트)에서 쓰는 Supabase 클라이언트.
// anon 키만 사용하므로 화면 코드에 그대로 포함되어도 안전하다.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

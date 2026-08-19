import Link from "next/link";
import LogoutButton from "./LogoutButton";

// 이 레이아웃 아래 모든 페이지는 로그인 여부와 상관없이 DB를 직접 조회하므로
// 빌드 시점에 정적으로 굳어지면 안 된다 (그러면 배포 후 데이터가 항상 빌드
// 당시 상태로 고정되어버린다). 하위 페이지 전체에 적용되도록 레이아웃에서 지정한다.
export const dynamic = "force-dynamic";

// 로그인한 뒤에만 보이는 화면들의 공통 레이아웃. 우측 상단에 비밀번호 변경/로그아웃 메뉴를 둔다.
export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
        <span className="text-sm font-semibold text-slate-900">
          신모델 개발일정 관리 시스템
        </span>
        <nav className="flex items-center gap-4 text-sm text-slate-600">
          <Link href="/schedule" className="hover:text-slate-900">
            일정 수립
          </Link>
          <Link href="/models" className="hover:text-slate-900">
            모델 정보
          </Link>
          <Link href="/masters" className="hover:text-slate-900">
            마스터 관리
          </Link>
          <Link href="/change-password" className="hover:text-slate-900">
            비밀번호 변경
          </Link>
          <LogoutButton />
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}

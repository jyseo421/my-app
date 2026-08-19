import Link from "next/link";

// 마스터 관리 화면의 공통 틀: 좌측 탭(법인/사양그룹/신뢰성 시험/규격·출향지) + 우측 내용.
// 법인 탭만 이번 작업에서 실제로 구현되어 있고, 나머지는 다음 작업에서 하나씩 채운다.
const TABS = [
  { href: "/masters/corporations", label: "법인", ready: true },
  { href: "/masters/spec-groups", label: "사양그룹", ready: true },
  { href: "/masters/tests", label: "신뢰성 시험", ready: true },
  { href: "/masters/destinations", label: "규격·출향지", ready: true },
];

export default function MastersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-5xl gap-6 px-6 py-8">
      <nav className="w-40 shrink-0">
        <ul className="flex flex-col gap-1">
          {TABS.map((tab) =>
            tab.ready ? (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  {tab.label}
                </Link>
              </li>
            ) : (
              <li
                key={tab.href}
                className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-slate-400"
              >
                {tab.label}
                <span className="text-xs">준비 중</span>
              </li>
            )
          )}
        </ul>
      </nav>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

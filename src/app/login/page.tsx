import { hasPasswordBeenSet } from "@/lib/auth/password";
import LoginForm from "./LoginForm";
import SetupForm from "./SetupForm";

// DB를 조회하는 페이지라 빌드 시점에 정적으로 굳어지면 안 된다
// (그러면 배포 후에도 항상 빌드 당시의 비밀번호 설정 여부로 고정되어버린다).
export const dynamic = "force-dynamic";

// 비밀번호가 아직 한 번도 설정되지 않았으면 "최초 설정" 화면을,
// 이미 설정되어 있으면 "비밀번호 입력" 화면을 보여준다.
export default async function LoginPage() {
  const alreadySet = await hasPasswordBeenSet();

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-lg font-semibold text-slate-900">
          신모델 개발일정 관리 시스템
        </h1>
        <p className="mb-6 text-sm text-slate-500">
          {alreadySet ? "비밀번호를 입력하세요." : "처음 실행되었습니다. 사용할 비밀번호를 설정하세요."}
        </p>
        {alreadySet ? <LoginForm /> : <SetupForm />}
      </div>
    </main>
  );
}

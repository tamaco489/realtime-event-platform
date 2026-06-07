import { authSignOut } from "@features/auth/api";
import { useAuthStore } from "@features/auth/model/store";
import { AuthPage } from "@features/auth/ui/AuthPage";
import { EventDashboardPage } from "@pages/event-dashboard/ui/EventDashboardPage";

function App() {
  // Zustand から認証状態を取得する。isAuthenticated が変わると App が再レンダリングされる
  const { isAuthenticated, clearAuth } = useAuthStore();

  async function handleSignOut() {
    // Cognito のセッションを破棄する
    await authSignOut();

    // Zustand の認証状態をリセットし、認証ガードで AuthPage に戻す
    clearAuth();
  }

  // 未認証の場合は AuthPage を表示する。
  // SignInForm が setAuth を呼ぶと isAuthenticated が true になりダッシュボードへ遷移する
  if (!isAuthenticated) {
    return <AuthPage onSignedIn={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <span className="text-sm font-semibold text-white">Realtime Event Platform</span>
        <button
          onClick={handleSignOut}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          サインアウト
        </button>
      </header>
      <EventDashboardPage />
    </div>
  );
}

export default App;

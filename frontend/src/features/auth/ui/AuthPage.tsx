import { useState } from "react";

import { SignInForm } from "@features/auth/ui/SignInForm";
import { SignUpForm } from "@features/auth/ui/SignUpForm";

type Tab = "signin" | "signup";

interface Props {
  onSignedIn: () => void;
}

/**
 * 認証ページ
 *
 * サインインとサインアップをタブで切り替える。
 */
export function AuthPage({ onSignedIn }: Props) {
  const [tab, setTab] = useState<Tab>("signin");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-full max-w-sm bg-gray-800 rounded-2xl p-8 space-y-6">
        <h1 className="text-xl font-bold text-white text-center">Realtime Event Platform</h1>

        <div className="flex rounded-lg overflow-hidden border border-gray-700">
          <button
            onClick={() => setTab("signin")}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              tab === "signin" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            サインイン
          </button>
          <button
            onClick={() => setTab("signup")}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              tab === "signup" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            サインアップ
          </button>
        </div>

        {tab === "signin" ? (
          <SignInForm onSignedIn={onSignedIn} />
        ) : (
          <SignUpForm onComplete={() => setTab("signin")} />
        )}
      </div>
    </div>
  );
}

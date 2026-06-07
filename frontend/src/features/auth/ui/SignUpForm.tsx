import { useState } from "react";

import { authConfirmSignUp, authSignUp } from "../api";

type Step = "form" | "confirm" | "done";

interface Props {
  onComplete: () => void;
}

/**
 * サインアップフォーム
 *
 * step 1: メール・パスワード・テナント ID・企業名を入力
 * step 2: メールに届いた確認コードを入力
 * step 3: 仮登録完了メッセージを表示
 */
export function SignUpForm({ onComplete }: Props) {
  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authSignUp({ email, password, tenantId, companyName });
      setStep("confirm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "サインアップに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authConfirmSignUp(email, code);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "確認コードの検証に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  if (step === "done") {
    return (
      <div className="text-center space-y-4">
        <p className="text-green-400 font-semibold">仮登録が完了しました。</p>
        <p className="text-gray-400 text-sm">
          企業管理者に本登録を依頼してください。
          <br />
          管理者が承認するとサービスをご利用いただけます。
        </p>
        <button
          onClick={onComplete}
          className="mt-4 text-sm text-indigo-400 hover:text-indigo-300 underline"
        >
          サインイン画面へ
        </button>
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <form onSubmit={handleConfirm} className="space-y-4">
        <p className="text-sm text-gray-400">
          {email} に確認コードを送信しました。メールを確認して入力してください。
        </p>
        <div>
          <label className="block text-sm text-gray-400 mb-1">確認コード</label>
          <input
            type="text"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg font-semibold text-sm transition-colors"
        >
          {loading ? "確認中..." : "確認コードを送信"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSignUp} className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1">メールアドレス</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">パスワード</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">テナント ID</label>
        <input
          type="text"
          required
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">企業名</label>
        <input
          type="text"
          required
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg font-semibold text-sm transition-colors"
      >
        {loading ? "送信中..." : "サインアップ"}
      </button>
    </form>
  );
}

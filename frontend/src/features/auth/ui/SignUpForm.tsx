import { useSignUpForm } from "@features/auth/model/useSignUpForm";

interface Props {
  onComplete: () => void;
}

/**
 * サインアップフォーム
 *
 * ロジックは useSignUpForm に委譲し、レンダリングのみを担う。
 *
 * step による画面の切り替え:
 * - form    : 初期状態。メール・パスワード・テナント ID・企業名を入力してサインアップを送信する
 * - confirm : authSignUp 成功後。Cognito から届いた確認コードを入力して本人確認を行う
 * - done    : authConfirmSignUp 成功後。仮登録完了を通知し、サインイン画面への導線を表示する
 */
export function SignUpForm({ onComplete }: Props) {
  const { form, setField, step, loading, error, handleSignUp, handleConfirm } = useSignUpForm();

  // done: サインアップ完了の案内を表示
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

  // confirm: 確認コード入力フォームを表示
  if (step === "confirm") {
    return (
      <form onSubmit={handleConfirm} className="space-y-4">
        <p className="text-sm text-gray-400">
          {form.email} に確認コードを送信しました。メールを確認して入力してください。
        </p>
        <div>
          <label className="block text-sm text-gray-400 mb-1">確認コード</label>
          <input
            type="text"
            required
            value={form.code}
            onChange={(e) => setField("code", e.target.value)}
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

  // form: サインアップフォームを表示
  return (
    <form onSubmit={handleSignUp} className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1">メールアドレス</label>
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => setField("email", e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">パスワード</label>
        <input
          type="password"
          required
          value={form.password}
          onChange={(e) => setField("password", e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">テナント ID</label>
        <input
          type="text"
          required
          value={form.tenantId}
          onChange={(e) => setField("tenantId", e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">企業名</label>
        <input
          type="text"
          required
          value={form.companyName}
          onChange={(e) => setField("companyName", e.target.value)}
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

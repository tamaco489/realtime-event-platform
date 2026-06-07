import { useSignInForm } from "@features/auth/model/useSignInForm";

interface Props {
  onSignedIn: () => void;
}

/**
 * サインインフォーム (SRP 認証)
 */
export function SignInForm({ onSignedIn }: Props) {
  const { email, setEmail, password, setPassword, loading, error, handleSubmit } =
    useSignInForm(onSignedIn);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg font-semibold text-sm transition-colors"
      >
        {loading ? "サインイン中..." : "サインイン"}
      </button>
    </form>
  );
}

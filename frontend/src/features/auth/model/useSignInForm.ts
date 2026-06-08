import React, { useState } from "react";

import { authSignIn, getAuthClaims } from "@features/auth/api";
import { useAuthStore } from "@features/auth/model/store";

/**
 * サインインフォームの状態と送信ロジックを管理するカスタムフック
 *
 * @returns email - メールアドレス
 * @returns password - パスワード
 * @returns setEmail - メールアドレスを更新する関数
 * @returns setPassword - パスワードを更新する関数
 * @returns loading - 送信中フラグ
 * @returns error - エラーメッセージ (正常時は null)
 * @returns handleSubmit - フォーム送信ハンドラ
 */
export function useSignInForm(onSignedIn: () => void) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Zustand ストアから setAuth を取得し、サインイン成功時に認証状態を更新する
  const setAuth = useAuthStore((s) => s.setAuth);

  // Cognito へサインインし、JWT から tenantId・userId を取得して認証状態をセットする
  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authSignIn({ email, password });

      // サインイン成功後に ID Token のクレームを取得する
      const claims = await getAuthClaims();

      // Zustand の認証状態を更新し、認証ガードで ダッシュボードへ遷移させる
      setAuth(claims.tenantId, claims.userId);

      // サインイン完了後のコールバックを呼び出す (例: サインイン画面を閉じる)
      onSignedIn();
    } catch (err) {
      // ページリロード後に Amplify の localStorage セッションが残っている場合、
      // signIn が失敗するため既存セッションからクレームを取得してサインイン状態にする
      if (err instanceof Error && err.message.includes("There is already a signed in user")) {
        try {
          const claims = await getAuthClaims();
          setAuth(claims.tenantId, claims.userId);
          onSignedIn();
          return;
        } catch {
          // フォールスルー: 通常のエラー処理へ
        }
      }
      setError(err instanceof Error ? err.message : "サインインに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return { email, setEmail, password, setPassword, loading, error, handleSubmit };
}

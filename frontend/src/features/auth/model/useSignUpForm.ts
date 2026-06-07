import React, { useState } from "react";

import { authConfirmSignUp, authSignUp } from "@features/auth/api";

export type SignUpStep = "form" | "confirm" | "done";

/**
 * サインアップフォームの入力値
 *
 * @property email - メールアドレス
 * @property password - パスワード (12 文字以上、大小英字・数字・記号を含む)
 * @property tenantId - テナント ID (4 桁の数字)
 * @property companyName - 企業名
 * @property code - Cognito から届いたメール確認コード。"confirm" step でのみ使用する
 */
interface SignUpFormState {
  email: string;
  password: string;
  tenantId: string;
  companyName: string;
  code: string;
}

/** フォームの初期値。ステップリセット時にも使用する */
const DEFAULT_FORM: SignUpFormState = {
  email: "",
  password: "",
  tenantId: "",
  companyName: "",
  code: "",
};

/**
 * サインアップフォームの状態と送信ロジックを管理するカスタムフック
 *
 * step 1 (form)   : メール・パスワード・テナント ID・企業名を入力してサインアップ
 * step 2 (confirm): メールに届いた確認コードを入力して登録完了
 * step 3 (done)   : 仮登録完了
 *
 * @returns form - 現在のフォーム値
 * @returns setField - フィールドを個別に更新する関数
 * @returns step - 現在のステップ
 * @returns loading - 送信中フラグ
 * @returns error - エラーメッセージ (正常時は null)
 * @returns handleSignUp - サインアップ送信ハンドラ
 * @returns handleConfirm - 確認コード送信ハンドラ
 */
export function useSignUpForm() {
  // フォーム全体の入力値を一元管理する
  const [form, setForm] = useState<SignUpFormState>(DEFAULT_FORM);

  // 現在表示するステップを管理する ("form" → "confirm" → "done" の順に遷移する)
  const [step, setStep] = useState<SignUpStep>("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 任意のフィールドを部分更新する。スプレッドで他フィールドを保持したまま上書きする
  function setField<K extends keyof SignUpFormState>(key: K, value: SignUpFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // step: "form" → Cognito へサインアップリクエストを送信し、成功したら確認コード入力画面へ進む
  async function handleSignUp(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authSignUp({
        email: form.email,
        password: form.password,
        tenantId: form.tenantId,
        companyName: form.companyName,
      });
      setStep("confirm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "サインアップに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  // step: "confirm" → メールで受け取った確認コードを検証し、成功したら仮登録完了画面へ進む
  async function handleConfirm(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authConfirmSignUp(form.email, form.code);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "確認コードの検証に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return { form, setField, step, loading, error, handleSignUp, handleConfirm };
}

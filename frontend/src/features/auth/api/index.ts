import { confirmSignUp, fetchAuthSession, signIn, signOut, signUp } from "aws-amplify/auth";

/**
 * サインアップのリクエスト型
 *
 * @property email - メールアドレス。サインイン識別子として使用する
 * @property password - パスワード。Cognito のパスワードポリシーを満たす必要がある
 * @property tenantId - テナント ID。Pre Sign-up Lambda に validationData として渡す
 * @property companyName - 企業名。tenantId とセットで Pre Sign-up Lambda が照合する
 */
export interface SignUpParams {
  email: string;
  password: string;
  tenantId: string;
  companyName: string;
}

/**
 * サインインのリクエスト型
 *
 * @property email - メールアドレス
 * @property password - パスワード
 */
export interface SignInParams {
  email: string;
  password: string;
}

/**
 * ID Token から抽出した認証情報
 *
 * @property tenantId - custom:tenantId。管理者が AdminUpdateUserAttributes で付与するまで null
 * @property userId - JWT の sub (Cognito ユーザー ID)
 */
export interface AuthClaims {
  tenantId: string | null;
  userId: string;
}

/**
 * Cognito サインアップ
 *
 * tenantId と companyName は validationData で Pre Sign-up Lambda に渡す。
 * writeAttributes の制限により custom:tenantId はクライアントから書き込めないため、
 * userAttributes には email のみ含める。
 */
export async function authSignUp({
  email,
  password,
  tenantId,
  companyName,
}: SignUpParams): Promise<void> {
  await signUp({
    username: email,
    password,
    options: {
      userAttributes: { email },
      validationData: { tenantId, companyName },
    },
  });
}

/** メール確認コードで登録を完了する */
export async function authConfirmSignUp(email: string, code: string): Promise<void> {
  await confirmSignUp({ username: email, confirmationCode: code });
}

/** Cognito サインイン (SRP 認証) */
export async function authSignIn({ email, password }: SignInParams): Promise<void> {
  await signIn({ username: email, password: password });
}

/** Cognito サインアウト */
export async function authSignOut(): Promise<void> {
  await signOut();
}

/**
 * 現在のセッションから ID Token の claims を取得する
 *
 * custom:tenantId は管理者が AdminUpdateUserAttributes で付与するまで存在しない。
 */
export async function getAuthClaims(): Promise<AuthClaims> {
  const session = await fetchAuthSession();
  const payload = session.tokens?.idToken?.payload;
  if (!payload || !payload.sub) throw new Error("セッション情報の取得に失敗しました");

  return {
    tenantId: (payload["custom:tenantId"] as string | undefined) ?? null,
    userId: payload.sub as string,
  };
}

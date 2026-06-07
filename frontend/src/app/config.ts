/**
 * アプリケーション固有の設定
 *
 * amplify.ts で管理する Cognito・AppSync 設定を除いた、アプリ固有の環境変数を集約する。
 * import.meta.env への直接アクセスはこのファイルのみに限定する。
 *
 * @property appEnv - 実行環境 ("local" | "prd")
 * @property apiBaseUrl - バックエンド API のベース URL
 */
export const config = {
  appEnv: import.meta.env.VITE_APP_ENV as "local" | "prd",
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "",
} as const;

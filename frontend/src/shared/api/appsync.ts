// AppSync クライアント設定 (aws-amplify v6)
// Amplify.configure() の呼び出しは src/app/ で行う
export const appSyncConfig = {
  endpoint: import.meta.env.VITE_APPSYNC_ENDPOINT ?? "",
  region: import.meta.env.VITE_AWS_REGION ?? "ap-northeast-1",
  apiKey: import.meta.env.VITE_APPSYNC_API_KEY ?? "",
} as const;

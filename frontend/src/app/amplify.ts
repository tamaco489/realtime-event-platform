import { Amplify } from "aws-amplify";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID ?? "",
      userPoolClientId: import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID ?? "",
    },
  },
  API: {
    Events: {
      endpoint: import.meta.env.VITE_APPSYNC_HTTP_URL ?? "",
      region: import.meta.env.VITE_AWS_REGION ?? "ap-northeast-1",
      defaultAuthMode: "apiKey",
      apiKey: import.meta.env.VITE_APPSYNC_API_KEY ?? "",
    },
  },
});

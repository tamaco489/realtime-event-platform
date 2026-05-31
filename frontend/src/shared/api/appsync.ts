import { generateClient } from "aws-amplify/api";

// Amplify.configure() は src/app/amplify.ts で初期化後に使用する
export const appSyncClient = generateClient();

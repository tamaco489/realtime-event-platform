import * as cdk from "aws-cdk-lib";
import * as appsync from "aws-cdk-lib/aws-appsync";
import { Construct } from "constructs";

/**
 * AppSyncApi コンストラクタプロパティ
 *
 * @property envName - 環境名。リソースの命名に使用する
 */
interface AppSyncApiProps {
  readonly envName: string;
}

/**
 * AppSync Events API コンストラクト
 *
 * API キー認証で AppSync Events API を定義する。
 * HTTP Publish エンドポイント・WebSocket エンドポイント・API キーを Stack Output に出力する。
 *
 * @see {@link https://docs.aws.amazon.com/appsync/latest/eventapi/welcome.html AWS AppSync Events}
 */
export class AppSyncApi extends Construct {
  /** AppSync Events API インスタンス */
  readonly api: appsync.EventApi;
  /** デフォルトチャンネル名前空間 */
  readonly channelNamespace: appsync.ChannelNamespace;

  constructor(scope: Construct, id: string, props: AppSyncApiProps) {
    super(scope, id);

    this.api = new appsync.EventApi(this, "EventApi", {
      apiName: `${props.envName}-realtime-event-api`,
      authorizationConfig: {
        authProviders: [
          { authorizationType: appsync.AppSyncAuthorizationType.API_KEY },
        ],
        connectionAuthModeTypes: [appsync.AppSyncAuthorizationType.API_KEY],
        defaultPublishAuthModeTypes: [appsync.AppSyncAuthorizationType.API_KEY],
        defaultSubscribeAuthModeTypes: [
          appsync.AppSyncAuthorizationType.API_KEY,
        ],
      },
    });

    this.channelNamespace = this.api.addChannelNamespace("default");

    // HTTP Publish エンドポイント (バックエンド Lambda の APPSYNC_ENDPOINT 環境変数に設定する)
    new cdk.CfnOutput(scope, "AppSyncHttpUrl", {
      value: `https://${this.api.httpDns}`,
      description: "AppSync Events HTTP Publish endpoint URL",
    });

    // WebSocket 接続エンドポイント (フロントエンドの VITE_APPSYNC_REALTIME_URL 環境変数に設定する)
    new cdk.CfnOutput(scope, "AppSyncRealtimeUrl", {
      value: `wss://${this.api.realtimeDns}`,
      description: "AppSync Events WebSocket endpoint URL",
    });

    // API キーはデフォルトで 7 日間有効。期限切れ前に再デプロイすれば新しいキーが発行される設計
    new cdk.CfnOutput(scope, "AppSyncApiKey", {
      value: this.api.apiKeys["Default"].attrApiKey,
      description: "AppSync API key",
    });
  }
}

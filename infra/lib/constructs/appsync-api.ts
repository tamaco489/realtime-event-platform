import * as cdk from "aws-cdk-lib";
import * as appsync from "aws-cdk-lib/aws-appsync";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

/**
 * AppSyncApi コンストラクタプロパティ
 *
 * @property envName - 環境名。リソースの命名に使用する
 * @property authorizerFn - Subscribe 認可に使用する Lambda Authorizer 関数
 */
interface AppSyncApiProps {
  readonly envName: string;
  readonly authorizerFn: lambda.IFunction;
}

/**
 * AppSync Events API コンストラクト
 *
 * Subscribe 認証を Lambda Authorizer (JWT + チャンネルパス照合) に変更し、
 * Publish 認証を IAM に変更する。API Key は廃止する。
 * HTTP Publish エンドポイントと WebSocket エンドポイントを Stack Output に出力する。
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

    // AppSync Events API を定義する
    this.api = new appsync.EventApi(this, "EventApi", {
      apiName: `${props.envName}-realtime-event-api`,

      // Subscribe: Lambda Authorizer / Publish: IAM で認証を構成
      authorizationConfig: {
        // 使用可能な認証プロバイダーを登録
        authProviders: [
          {
            // Subscribe 認証に使用する Lambda Authorizer プロバイダー
            authorizationType: appsync.AppSyncAuthorizationType.LAMBDA,
            lambdaAuthorizerConfig: {
              handler: props.authorizerFn,
            },
          },
          // Publish 認証に使用する IAM プロバイダー
          { authorizationType: appsync.AppSyncAuthorizationType.IAM },
        ],

        // WebSocket 接続時の認証モードを Lambda Authorizer に設定
        connectionAuthModeTypes: [appsync.AppSyncAuthorizationType.LAMBDA],

        // Publish のデフォルト認証モードを IAM に設定
        defaultPublishAuthModeTypes: [appsync.AppSyncAuthorizationType.IAM],

        // Subscribe のデフォルト認証モードを Lambda Authorizer に設定
        defaultSubscribeAuthModeTypes: [
          appsync.AppSyncAuthorizationType.LAMBDA,
        ],
      },
    });

    // チケット注文配信用のチャンネル名前空間を追加する
    this.channelNamespace = this.api.addChannelNamespace("tickets");

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
  }
}

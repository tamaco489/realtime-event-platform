import * as path from "path";

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
 * AppSync GraphQL API コンストラクト
 *
 * API キー認証で GraphQL API を定義し、エンドポイント URL と API キーを Stack Output に出力する。
 * スキーマは schema.graphql から読み込む。
 *
 * @see {@link https://docs.aws.amazon.com/appsync/latest/devguide/what-is-appsync.html AWS AppSync}
 */
export class AppSyncApi extends Construct {
  /** AppSync GraphQL API インスタンス */
  readonly api: appsync.GraphqlApi;

  constructor(scope: Construct, id: string, props: AppSyncApiProps) {
    super(scope, id);

    this.api = new appsync.GraphqlApi(this, "Api", {
      name: `realtime-event-api-${props.envName}`,
      // __dirname (このファイルと同階層) の schema.graphql を cdk synth 時にインライン展開する
      definition: appsync.Definition.fromFile(
        path.join(__dirname, "schema.graphql"),
      ),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.API_KEY,
        },
      },
    });

    new cdk.CfnOutput(scope, "AppSyncUrl", {
      value: this.api.graphqlUrl,
      description: "AppSync GraphQL エンドポイント URL",
    });

    new cdk.CfnOutput(scope, "AppSyncApiKey", {
      value: this.api.apiKey ?? "",
      description: "AppSync API キー",
    });
  }
}

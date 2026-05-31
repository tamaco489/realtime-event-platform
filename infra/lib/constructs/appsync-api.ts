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
      name: `${props.envName}-realtime-event-api`,
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

    // addNoneDataSource を使うことで type: NONE を明示。外部データソースを持たず Subscription へのパススルーのみを担う
    const noneDS = this.api.addNoneDataSource("NoneDataSource", {
      name: `${props.envName}-realtime-event-none-ds`,
      description: "Passthrough data source for publishEvent mutation",
    });

    // Mutation.publishEvent のリクエストマッピングテンプレートとレスポンスマッピングテンプレートを JS で定義する
    noneDS.createResolver("PublishEventResolver", {
      typeName: "Mutation",
      fieldName: "publishEvent",
      // *.js は .gitignore 対象のため fromInline でインライン定義する
      code: appsync.Code.fromInline(`
        export function request(ctx) { return { payload: ctx.args.input }; }
        export function response(ctx) {
          return {
            event_id: util.autoId(),
            event_type: ctx.result.event_type,
            payload: ctx.result.payload,
            created_at: util.time.nowEpochSeconds(),
          };
        }
      `),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
    });

    // AppSync のエンドポイント URL と API キーを CloudFormation Stack Output に出力
    new cdk.CfnOutput(scope, "AppSyncUrl", {
      value: this.api.graphqlUrl,
      description: "AppSync GraphQL endpoint URL",
    });

    // API キーはデフォルトで 7 日間有効。期限切れ前に再デプロイすれば新しいキーが発行される設計
    new cdk.CfnOutput(scope, "AppSyncApiKey", {
      value: this.api.apiKey ?? "",
      description: "AppSync API key",
    });
  }
}

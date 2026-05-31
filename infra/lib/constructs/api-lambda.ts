import * as path from "path";

import * as cdk from "aws-cdk-lib";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";

/**
 * ApiLambda コンストラクタプロパティ
 *
 * @property envName - 環境名。リソースの命名に使用する
 * @property queue - SQS メインキュー。Lambda 環境変数と SendMessage 権限付与に使用する
 * @property lambdaMemorySize - Lambda 関数のメモリサイズ (MB)
 */
interface ApiLambdaProps {
  readonly envName: string;
  readonly queue: sqs.Queue;
  readonly lambdaMemorySize: number;
}

/**
 * API Lambda + API Gateway v2 (HTTP API) コンストラクト
 *
 * arm64 / provided.al2023 で Lambda を定義し、HTTP API 経由で外部公開する。
 * IAM 実行ロールに SQS SendMessage 権限を付与し、エンドポイント URL を Stack Output に出力する。
 */
export class ApiLambda extends Construct {
  /** API Lambda 関数 */
  readonly fn: lambda.Function;

  /** HTTP API */
  readonly httpApi: apigwv2.HttpApi;

  constructor(scope: Construct, id: string, props: ApiLambdaProps) {
    super(scope, id);

    const role = new iam.Role(this, "Role", {
      roleName: `${props.envName}-realtime-event-api-lambda-role`,
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole",
        ),
      ],
    });

    this.fn = new lambda.Function(this, "Function", {
      functionName: `${props.envName}-realtime-event-api`,
      description:
        "Receives HTTP requests via API Gateway and publishes events to SQS",
      runtime: lambda.Runtime.PROVIDED_AL2023,
      architecture: lambda.Architecture.ARM_64,
      handler: "bootstrap",
      // backend/build/api に go build -trimpath -o build/api ./cmd/api でビルドしたバイナリを配置する
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../../../backend/build/api"),
      ),
      role,
      memorySize: props.lambdaMemorySize,
      timeout: cdk.Duration.seconds(29),
      environment: {
        SQS_QUEUE_URL: props.queue.queueUrl,
      },
    });

    props.queue.grantSendMessages(this.fn);

    this.httpApi = new apigwv2.HttpApi(this, "HttpApi", {
      apiName: `${props.envName}-realtime-event-http-api`,
      description: "HTTP API for the realtime event delivery platform",
      defaultIntegration: new integrations.HttpLambdaIntegration(
        "Integration",
        this.fn,
      ),
    });

    new cdk.CfnOutput(scope, "ApiEndpointUrl", {
      value: this.httpApi.apiEndpoint,
      description: "API Gateway HTTP API endpoint URL",
    });
  }
}

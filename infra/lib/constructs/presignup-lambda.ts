import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

/**
 * PreSignupLambda コンストラクタプロパティ
 *
 * @property envName - 環境名。リソースの命名に使用する
 * @property lambdaMemorySize - Lambda 関数のメモリサイズ (MB)
 * @property artifactsBucketName - Lambda ビルド成果物を格納する S3 バケット名
 */
interface PreSignupLambdaProps {
  readonly envName: string;
  readonly lambdaMemorySize: number;
  readonly artifactsBucketName: string;
}

/**
 * Cognito Pre Sign-up Lambda コンストラクト
 *
 * サインアップ時に tenantId と companyName をテナント定義と照合し、不正登録を防ぐ。
 * 照合が成功した場合のみ autoConfirmUser: false を返してサインアップを受け付ける。
 */
export class PreSignupLambda extends Construct {
  /** Pre Sign-up Lambda 関数 */
  readonly fn: lambda.Function;

  constructor(scope: Construct, id: string, props: PreSignupLambdaProps) {
    super(scope, id);

    // Pre Sign-up Lambda の実行ロール。CloudWatch Logs への書き込み権限のみ付与する
    const role = new iam.Role(this, "Role", {
      roleName: `${props.envName}-realtime-event-presignup-role`,
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole",
        ),
      ],
    });

    // DOC: https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-pre-sign-up.html
    // Pre Sign-up Lambda 関数。Cognito サインアップトリガーとして Cognito から直接呼び出される
    this.fn = new lambda.Function(this, "Function", {
      functionName: `${props.envName}-realtime-event-presignup`,
      description:
        "Cognito Pre Sign-up trigger — validates tenantId and companyName against hardcoded tenant definitions",
      runtime: lambda.Runtime.PROVIDED_AL2023,
      architecture: lambda.Architecture.ARM_64,
      handler: "bootstrap",
      code: lambda.Code.fromBucket(
        s3.Bucket.fromBucketName(
          this,
          "ArtifactsBucket",
          props.artifactsBucketName,
        ),
        "artifacts/presignup/bootstrap.zip",
      ),
      role,
      memorySize: props.lambdaMemorySize,
      // DOC: https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-working-with-lambda-triggers.html
      // NOTE: Cognito 同期型トリガーのタイムアウト上限は 5 秒。上限に合わせて設定
      timeout: cdk.Duration.seconds(5),
    });

    const managedLogGroup = this.fn.node.findChild("LogGroup") as logs.LogGroup;
    (managedLogGroup.node.defaultChild as logs.CfnLogGroup).retentionInDays = 7;
    managedLogGroup.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
  }
}

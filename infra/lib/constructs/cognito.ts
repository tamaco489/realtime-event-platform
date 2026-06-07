import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

/**
 * Cognito コンストラクタプロパティ
 *
 * @property envName - 環境名。リソースの命名に使用する
 */
interface CognitoProps {
  readonly envName: string;
}

/**
 * Cognito User Pool コンストラクト
 *
 * マルチテナント対応の認証基盤。custom:tenantId 属性でテナントを識別する。
 * UserPoolId と UserPoolClientId を Stack Output に出力する。
 */
export class Cognito extends Construct {
  /** Cognito User Pool */
  readonly userPool: cognito.UserPool;

  /** Cognito User Pool Client */
  readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: CognitoProps) {
    super(scope, id);

    // User Pool - ユーザーの認証基盤となる User Pool を作成
    this.userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: `${props.envName}-realtime-event-user-pool`,
      /* TODO(#113) selfSignUpEnabled について:
        - DOC: https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cognito.UserPool.html
        - Pre Sign-up Lambda 実装後に完全に機能する
        - ユーザーはサインアップ時にテナント ID + 企業名を入力し、Lambda がテナント定義と照合して検証する
        - 管理者が AdminUpdateUserAttributes で custom:tenantId を付与するまで JWT に tenantId が含まれず BE-001 の JWT 検証で 403 になるため、ユーザーはサービスを利用できない状態になる
      */
      selfSignUpEnabled: true,

      // メールは大小文字区別しない
      signInCaseSensitive: false,

      // メールアドレスをサインイン識別子として使用する
      signInAliases: { email: true },

      // ユーザー属性の定義。email は標準属性、tenantId はカスタム属性として定義
      customAttributes: {
        tenantId: new cognito.StringAttribute({ minLen: 4, maxLen: 4 }), // テナント識別子。形式: 1234 (作成後変更不可)
      },

      // メール認証専用構成のためメールのみで復旧する
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      passwordPolicy: {
        minLength: 12, // 推奨最小文字数
        requireLowercase: true, // 小文字を含む
        requireUppercase: true, // 大文字を含む
        requireDigits: true, // 数字を含む
        requireSymbols: true, // 記号を含む
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY, // スタック削除時に User Pool も削除する (本番運用時は RETAIN 推奨)
    });

    // User Pool Client - User Pool にアクセスするクライアントを定義
    this.userPoolClient = this.userPool.addClient("UserPoolClient", {
      userPoolClientName: `${props.envName}-realtime-event-user-pool-client`,

      // DOC: https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-authentication-flow-methods.html
      // SRP (Secure Remote Password) ベース認証 / パスワードを平文で送信しない認証フローを有効化する
      authFlows: { userSrp: true },

      // ユーザー列挙攻撃を防ぐため存在しないユーザーに汎用エラーを返す
      preventUserExistenceErrors: true,

      // Cognito ユーザー属性への書き込みを email のみ許可する (custom:tenantId はクライアントからの書き込みを禁止する)
      writeAttributes: new cognito.ClientAttributes().withStandardAttributes({
        email: true,
      }),
    });

    new cdk.CfnOutput(scope, "UserPoolId", {
      value: this.userPool.userPoolId,
      description: "Cognito User Pool ID",
    });

    new cdk.CfnOutput(scope, "UserPoolClientId", {
      value: this.userPoolClient.userPoolClientId,
      description: "Cognito User Pool Client ID",
    });
  }
}

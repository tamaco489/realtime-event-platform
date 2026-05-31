/**
 * CDK スタックに渡す環境設定の型定義
 *
 * stg / prd を追加する場合はこのファイルに定数を追加するだけでよい。
 * CloudFormation Parameters / Conditions は使用しない — 環境差異は合成時に TypeScript で決定する。
 */
export interface EnvConfig {
  /** 環境名。スタック ID やリソースの命名に使用する */
  readonly envName: string;

  /**
   * cdk bootstrap 時に指定した qualifier
   *
   * bootstrap ロール名 (cdk-{qualifier}-deploy-role-...) と一致させる必要がある。
   * qualifier を変更した場合は cdk bootstrap を再実行すること。
   */
  readonly bootstrapQualifier: string;

  /** Lambda 関数のメモリサイズ (MB) */
  readonly lambdaMemorySize: number;
}

/** 開発環境設定 */
export const devConfig: EnvConfig = {
  envName: "dev",
  bootstrapQualifier: "tamaco489",
  lambdaMemorySize: 128,
};

/** 本番環境設定 */
export const prdConfig: EnvConfig = {
  envName: "prd",
  bootstrapQualifier: "tamaco489",
  lambdaMemorySize: 128,
};

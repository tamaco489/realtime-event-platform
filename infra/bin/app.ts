#!/usr/bin/env node

/**
 * CDK App エントリーポイント
 *
 * このファイルの責務はスタックのインスタンス化のみ。
 * process.env の参照はここに集約し、コンストラクト・スタック内からは参照しない。
 *
 * @see {@link https://docs.aws.amazon.com/cdk/v2/guide/best-practices.html CDK Best Practices}
 */
import * as cdk from "aws-cdk-lib";
import { RealtimeEventStack } from "../lib/stacks/realtime-event-stack";
import { devConfig } from "../config/env-config";

const app = new cdk.App();

new RealtimeEventStack(app, `RealtimeEventStack-${devConfig.envName}`, {
  /**
   * cdk bootstrap 時に指定した qualifier と一致させる必要がある。
   * qualifier が異なると CDK bootstrap ロールの assume に失敗する。
   */
  synthesizer: new cdk.DefaultStackSynthesizer({
    qualifier: devConfig.bootstrapQualifier,
  }),
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  config: devConfig,
});

import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { RealtimeEventStack } from "../lib/stacks/realtime-event-stack";
import { devConfig } from "../config/env-config";

/**
 * RealtimeEventStack スナップショットテスト
 *
 * CDK スタックを合成した CloudFormation テンプレートを __snapshots__ に保存し、
 * コンストラクトの変更がテンプレートに意図しない影響を与えていないことを検証する。
 *
 * スナップショットの更新が必要な場合 (意図的な変更時):
 * @example
 * npm test -- -u
 */
test("snapshot", () => {
  const app = new cdk.App({
    context: {
      "@aws-cdk/aws-lambda:useCdkManagedLogGroup": true,
    },
  });
  const stack = new RealtimeEventStack(app, "TestStack", { config: devConfig });
  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});

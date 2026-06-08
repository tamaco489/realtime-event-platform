import { useEffect, useState } from "react";
import type { EventsChannel } from "aws-amplify/api";
import { fetchAuthSession, signOut } from "aws-amplify/auth";

import { config } from "@app/config";
import { events } from "@shared/api/appsync";
import { useAuthStore } from "@features/auth/model/store";
import { buildEventItem } from "@features/event-feed/model/buildEventItem";
import type { EventItem } from "@features/event-feed/model/store";
import { useEventFeedStore } from "@features/event-feed/model/store";

/**
 * AppSync Events チャンネルの受信データ型
 *
 * @property id - AppSync が付与するメッセージ ID
 * @property type - メッセージ種別 (例: "data")
 * @property event - イベント本体
 * @property event.event_type - アプリケーション定義のイベント種別 (例: "ticket_ordered")
 * @property event.payload - イベントペイロード
 */
interface ReceivedEvent {
  id: string;
  type: string;
  event: {
    event_type: string;
    payload: Record<string, unknown>;
  };
}

/**
 * AppSync Events WebSocket サブスクリプション カスタムフック
 *
 * サインイン後に `tickets/orders/{tenantId}/{userId}` チャンネルへ接続し、
 * 受信イベントを useEventFeedStore に追加する。
 * tenantId・userId のどちらかが null の場合は接続しない。
 * サインアウト時は clearAuth() により両値が null になり、useEffect のクリーンアップで自動切断する。
 * Subscription エラー時は Cognito セッションを破棄して再サインインを促す。
 * VITE_APP_ENV が "local" のときは接続しない。イベント追加は postTicketOrder が直接行う。
 *
 * @returns error - 接続エラーメッセージ。正常時は null
 */
export function useEventSubscription(): { error: string | null } {
  // 受信イベントをストアに追加するコールバック
  const addEvent = useEventFeedStore((s) => s.addEvent);

  // テナント別チャンネルパスの構築に使用する。管理者が付与するまで tenantId は null になる
  const tenantId = useAuthStore((s) => s.tenantId);
  const userId = useAuthStore((s) => s.userId);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // tenantId・userId が未セットの場合は購読しない
    if (!tenantId || !userId) return;

    // 購読するチャンネルパスを構築
    const channel = `tickets/orders/${tenantId}/${userId}`;

    if (config.appEnv === "local") {
      console.log(
        "[Subscription] ローカル環境のため WebSocket 接続をスキップ。イベント追加は postTicketOrder のモック実装が直接行う"
      );
      return;
    }
    if (config.appEnv !== "prd") {
      throw new Error(`Unknown VITE_APP_ENV: ${config.appEnv}`);
    }

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    fetchAuthSession()
      .then((session) => {
        if (cancelled) return;
        const idToken = session.tokens?.idToken?.toString();
        if (!idToken) {
          setError("ID Token の取得に失敗しました");
          return;
        }
        // Subscription エラー時は Cognito セッションを破棄して再サインインへ誘導する
        cleanup = subscribeChannel(
          channel,
          addEvent,
          () => {
            signOut().finally(() => clearAuth());
          },
          idToken
        );
      })
      .catch(() => {
        if (!cancelled) setError("セッション取得に失敗しました");
      });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [addEvent, tenantId, userId, clearAuth]);

  return { error };
}

/**
 * AppSync Events チャンネルに接続してイベントを購読する
 *
 * @param channel - 購読するチャンネルパス (例: "tickets/orders/{tenantId}/{userId}")
 * @param addEvent - 受信したイベントをストアに追加するコールバック
 * @param onSessionExpired - エラー発生時のコールバック。Cognito セッションを破棄して再サインインへ誘導する
 * @param idToken - Cognito ID Token。Lambda Authorizer に渡す。custom:tenantId を含む
 * @returns チャンネルをクローズするクリーンアップ関数
 */
function subscribeChannel(
  channel: string,
  addEvent: (item: EventItem) => void,
  onSessionExpired: () => void,
  idToken: string
): () => void {
  console.log(`[Subscription] 開始: ${channel}`);

  // 接続成功後にチャンネルをクローズするため、外部で変数を宣言しておく
  let ch: EventsChannel | null = null;

  // AppSync Events チャンネルに接続してイベントを購読
  events
    // ID Token を明示的に渡す。defaultAuthMode: "userPool" は Access Token を送るため
    // Lambda Authorizer が custom:tenantId を取得できない問題を回避する
    .connect(channel, { authMode: "lambda", authToken: idToken })

    // 接続成功
    .then((c) => {
      ch = c;
      c.subscribe({
        next: (data: ReceivedEvent) => {
          console.log("[Subscription] next:", JSON.stringify(data));
          addEvent(buildEventItem(data.event.event_type, data.event.payload));
        },

        // Token 期限切れ等による接続エラー → Cognito セッション破棄で再サインインへ誘導する
        error: (err: unknown) => {
          console.error("[Subscription] error:", err);
          onSessionExpired();
        },
      });
    })

    // 接続エラー
    .catch((err: unknown) => {
      console.error("[Subscription] connect error:", err);
      onSessionExpired();
    });

  return () => {
    // クリーンアップ関数。チャンネルが存在すればクローズする
    console.log(`[Subscription] 終了: ${channel}`);
    ch?.close();
  };
}

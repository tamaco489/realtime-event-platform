import { useEffect, useState } from "react";
import type { EventsChannel } from "aws-amplify/api";

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // tenantId・userId が未セットの場合は購読しない
    if (!tenantId || !userId) return;

    // 購読するチャンネルパスを構築
    const channel = `tickets/orders/${tenantId}/${userId}`;
    switch (config.appEnv) {
      case "prd":
        return subscribeChannel(channel, addEvent, setError);
      case "local":
        console.log(
          "[Subscription] ローカル環境のため WebSocket 接続をスキップ。イベント追加は postTicketOrder のモック実装が直接行う"
        );
        return;
      default:
        throw new Error(`Unknown VITE_APP_ENV: ${config.appEnv}`);
    }
  }, [addEvent, tenantId, userId]);

  return { error };
}

/**
 * AppSync Events チャンネルに接続してイベントを購読する
 *
 * @param channel - 購読するチャンネルパス (例: "tickets/orders/{tenantId}/{userId}")
 * @param addEvent - 受信したイベントをストアに追加するコールバック
 * @param setError - エラーメッセージをセットするコールバック
 * @returns チャンネルをクローズするクリーンアップ関数
 */
function subscribeChannel(
  channel: string,
  addEvent: (item: EventItem) => void,
  setError: (msg: string) => void
): () => void {
  console.log(`[Subscription] 開始: ${channel}`);

  // 接続成功後にチャンネルをクローズするため、外部で変数を宣言しておく
  let ch: EventsChannel | null = null;

  // AppSync Events チャンネルに接続してイベントを購読
  events
    // 接続開始。接続成功後に then() で購読開始、失敗したら catch() でエラーハンドリングする
    .connect(channel)

    // 接続成功
    .then((c) => {
      ch = c;
      // 購読開始。受信イベントは addEvent でストアに追加、エラーは setError でエラーメッセージをセットする
      c.subscribe({
        next: (data: ReceivedEvent) => {
          console.log("[Subscription] next:", JSON.stringify(data));
          addEvent(buildEventItem(data.event.event_type, data.event.payload));
        },

        // 購読エラーは接続エラーと同様に扱う
        error: (err: unknown) => {
          console.error("[Subscription] error:", err);
          setError(err instanceof Error ? err.message : "Subscription 接続に失敗しました");
        },
      });
    })

    // 接続エラー
    .catch((err: unknown) => {
      console.error("[Subscription] connect error:", err);
      setError(err instanceof Error ? err.message : "WebSocket 接続に失敗しました");
    });

  return () => {
    // クリーンアップ関数。チャンネルが存在すればクローズする
    console.log(`[Subscription] 終了: ${channel}`);
    ch?.close();
  };
}

import { useEffect, useState } from "react";
import type { EventsChannel } from "aws-amplify/api";

import { events } from "@shared/api/appsync";
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
 * マウント時に `tickets/orders` チャンネルへ接続し、受信イベントを useEventFeedStore に追加する。
 * アンマウント時に自動でチャンネルを close する。
 * VITE_APP_ENV が "local" のときは接続しない。イベント追加は postTicketOrder が直接行う。
 *
 * @returns error - 接続エラーメッセージ。正常時は null
 */
export function useEventSubscription(): { error: string | null } {
  const addEvent = useEventFeedStore((s) => s.addEvent);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    switch (import.meta.env.VITE_APP_ENV) {
      case "prd":
        return subscribeChannel(addEvent, setError);
      case "local":
        return;
      default:
        throw new Error(`Unknown VITE_APP_ENV: ${import.meta.env.VITE_APP_ENV}`);
    }
  }, [addEvent]);

  return { error };
}

/**
 * AppSync Events チャンネルに接続してイベントを購読する
 *
 * @param addEvent - 受信したイベントをストアに追加するコールバック
 * @param setError - エラーメッセージをセットするコールバック
 * @returns チャンネルをクローズするクリーンアップ関数
 */
function subscribeChannel(
  addEvent: (item: EventItem) => void,
  setError: (msg: string) => void
): () => void {
  console.log("[Subscription] 開始: tickets/orders");
  let channel: EventsChannel | null = null;

  events
    .connect("tickets/orders")
    .then((ch) => {
      channel = ch;
      ch.subscribe({
        next: (data: ReceivedEvent) => {
          console.log("[Subscription] next:", JSON.stringify(data));
          addEvent(buildEventItem(data.event.event_type, data.event.payload));
        },
        error: (err: unknown) => {
          console.error("[Subscription] error:", err);
          setError(err instanceof Error ? err.message : "Subscription 接続に失敗しました");
        },
      });
    })
    .catch((err: unknown) => {
      console.error("[Subscription] connect error:", err);
      setError(err instanceof Error ? err.message : "WebSocket 接続に失敗しました");
    });

  return () => {
    console.log("[Subscription] 終了");
    channel?.close();
  };
}

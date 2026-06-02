import { useEffect, useState } from "react";

import type { EventsChannel } from "aws-amplify/api";

import { events } from "@shared/api/appsync";

import { type EventItem, useEventFeedStore } from "@features/event-feed/model/store";

/** AppSync Events チャンネルの受信データ型 */
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
 * マウント時に `default/events` チャンネルへ接続し、受信イベントを useEventFeedStore に追加する。
 * アンマウント時に自動でチャンネルを close する。
 *
 * @returns error - 接続エラーメッセージ。正常時は null
 */
export function useEventSubscription(): { error: string | null } {
  const addEvent = useEventFeedStore((s) => s.addEvent);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("[Subscription] 開始: default/events");
    let channel: EventsChannel | null = null;

    events
      .connect("default/events")
      .then((ch) => {
        channel = ch;
        ch.subscribe({
          next: (data: ReceivedEvent) => {
            console.log("[Subscription] next:", JSON.stringify(data));
            const { event_type, payload } = data.event;
            const item: EventItem = {
              event_id: crypto.randomUUID(),
              event_type,
              payload: JSON.stringify(payload, null, 2),
              created_at: Math.floor(Date.now() / 1000),
            };
            addEvent(item);
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
  }, [addEvent]);

  return { error };
}

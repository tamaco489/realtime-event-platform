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
 * 受信データから EventItem を生成する
 *
 * @param event_type - イベント種別
 * @param payload - イベントペイロード
 */
function buildEventItem(event_type: string, payload: Record<string, unknown>): EventItem {
  return {
    event_id: crypto.randomUUID(),
    event_type,
    payload: JSON.stringify(payload, null, 2),
    created_at: Math.floor(Date.now() / 1000),
  };
}

/** モック用のダミー EventItem を生成する */
function buildMockEventItem(): EventItem {
  const eventTypes = ["order.created", "order.updated", "order.cancelled"];
  const event_type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  return buildEventItem(event_type, {
    order_id: crypto.randomUUID(),
    amount: Math.floor(Math.random() * 10000),
  });
}

/**
 * AppSync Events WebSocket サブスクリプション カスタムフック
 *
 * マウント時に `default/events` チャンネルへ接続し、受信イベントを useEventFeedStore に追加する。
 * アンマウント時に自動でチャンネルを close する。
 * VITE_APP_ENV が "prd" 以外のときはモックを使用し、3 秒ごとにダミーイベントを生成する。
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
        return startMock(addEvent);
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
  console.log("[Subscription] 開始: default/events");
  let channel: EventsChannel | null = null;

  events
    .connect("default/events")
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

/**
 * 3 秒ごとにダミーイベントを生成するモックサブスクリプションを開始する
 *
 * maxEvents 件に達したらインターバルを自動停止する。
 *
 * @param addEvent - 生成したイベントをストアに追加するコールバック
 * @returns インターバルをクリアするクリーンアップ関数
 */
function startMock(addEvent: (item: EventItem) => void): () => void {
  const maxEvents = 5;
  console.log("[Subscription] mock モードで起動");
  let count = 0;
  const timer = setInterval(() => {
    if (count >= maxEvents) {
      clearInterval(timer);
      return;
    }
    const item = buildMockEventItem();
    console.log("[Subscription] mock next:", JSON.stringify(item));
    addEvent(item);
    count++;
  }, 3000);
  return () => {
    console.log("[Subscription] mock 終了");
    clearInterval(timer);
  };
}

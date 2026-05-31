import { useEffect, useState } from "react";

import { appSyncClient } from "@shared/api/appsync";

import { type EventItem, useEventFeedStore } from "@features/event-feed/model/store";

const ON_EVENT_RECEIVED = /* GraphQL */ `
  subscription OnEventReceived {
    onEventReceived {
      event_id
      event_type
      payload
      created_at
    }
  }
`;

/** AppSync Subscription のレスポンス型 */
interface SubscriptionResponse {
  data: { onEventReceived: EventItem | null };
}

/** graphql() が Subscription のとき返す Observable 互換の型 */
interface SubscriptionObservable {
  subscribe(handlers: {
    next: (value: SubscriptionResponse) => void;
    error: (error: unknown) => void;
  }): { unsubscribe(): void };
}

/**
 * AppSync onEventReceived Subscription カスタムフック
 *
 * マウント時に Subscription を開始し、受信イベントを useEventFeedStore に追加する。
 * アンマウント時に自動で unsubscribe する。
 *
 * @returns error - 接続エラーメッセージ。正常時は null
 */
export function useEventSubscription(): { error: string | null } {
  const addEvent = useEventFeedStore((s) => s.addEvent);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const observable = appSyncClient.graphql({
      query: ON_EVENT_RECEIVED,
    }) as unknown as SubscriptionObservable;

    const sub = observable.subscribe({
      next: ({ data }) => {
        const item = data?.onEventReceived;
        if (item) addEvent(item);
      },
      error: (err) => {
        setError(err instanceof Error ? err.message : "Subscription 接続に失敗しました");
      },
    });

    return () => sub.unsubscribe();
  }, [addEvent]);

  return { error };
}

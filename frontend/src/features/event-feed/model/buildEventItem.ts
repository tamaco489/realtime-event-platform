import type { EventItem } from "./store";

/**
 * AppSync から受信したデータを EventItem に変換する
 *
 * @param event_type - イベント種別
 * @param payload - イベントペイロード
 */
export function buildEventItem(event_type: string, payload: Record<string, unknown>): EventItem {
  return {
    event_id: crypto.randomUUID(),
    event_type,
    payload: JSON.stringify(payload, null, 2),
    created_at: Math.floor(Date.now() / 1000),
  };
}

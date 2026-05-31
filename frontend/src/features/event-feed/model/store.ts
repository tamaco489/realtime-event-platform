import { create } from "zustand";

/**
 * イベントフィードの 1 件分のデータ型
 *
 * @property event_id - イベントの一意識別子
 * @property event_type - イベントの種別
 * @property payload - イベントペイロード (JSON 文字列)
 * @property created_at - イベントの作成日時 (Unix タイムスタンプ, 秒)
 */
export interface EventItem {
  event_id: string;
  event_type: string;
  payload: string;
  created_at: number;
}

/**
 * イベントフィードストアの state とアクションの定義
 *
 * @property events - 受信済みイベントの一覧 (新着順)
 * @property addEvent - イベントをリスト先頭に追加する
 * @property clearEvents - イベントリストをリセットする
 */
interface EventFeedState {
  events: EventItem[];
  addEvent: (item: EventItem) => void;
  clearEvents: () => void;
}

/**
 * イベントフィード Zustand ストア
 *
 * AppSync Subscription で受信したイベントをリアクティブに管理する。
 * addEvent で先頭追加、clearEvents で全件クリアを行う。
 */
export const useEventFeedStore = create<EventFeedState>((set) => ({
  events: [],
  addEvent: (item) => set((state) => ({ events: [item, ...state.events] })),
  clearEvents: () => set({ events: [] }),
}));

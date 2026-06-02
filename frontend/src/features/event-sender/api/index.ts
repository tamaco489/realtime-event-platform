import { post } from "@shared/api/http";
import { useEventFeedStore } from "@features/event-feed/model/store";

/**
 * POST /v1/tickets/orders のリクエスト型
 *
 * @property event_id - イベント ID
 * @property event_name - イベント名
 * @property seat_type - 席種 (general / vip / premium)
 * @property quantity - 枚数
 * @property amount - 合計金額 (円)
 */
interface PostTicketOrderRequest {
  event_id: string;
  event_name: string;
  seat_type: string;
  quantity: number;
  amount: number;
}

/**
 * POST /v1/tickets/orders — チケット注文を送信する
 *
 * VITE_APP_ENV が "local" のときはストアへ直接 EventItem を追加してモックする。
 * "prd" のときは API Lambda へ HTTP リクエストを送信する。
 */
export async function postTicketOrder(req: PostTicketOrderRequest): Promise<void> {
  if (import.meta.env.VITE_APP_ENV === "local") {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    useEventFeedStore.getState().addEvent({
      event_id: crypto.randomUUID(),
      event_type: "created",
      payload: JSON.stringify(
        { order_id: `ord-${crypto.randomUUID()}`, status: "confirmed" },
        null,
        2
      ),
      created_at: Math.floor(Date.now() / 1000),
    });
    return;
  }

  await post<void>("/v1/tickets/orders", req);
}

import { post } from "@shared/api/http";

/**
 * POST /events のリクエスト型
 *
 * @property event_type - イベントの種別
 * @property payload - イベントペイロード (JSON オブジェクト)
 */
interface PostEventsRequest {
  event_type: string;
  payload: Record<string, unknown>;
}

/** POST /events — イベントを API Lambda に送信する */
export async function postEvents(req: PostEventsRequest): Promise<void> {
  await post<void>("/events", req);
}

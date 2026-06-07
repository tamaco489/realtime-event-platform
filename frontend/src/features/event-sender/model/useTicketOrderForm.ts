import React, { useState } from "react";

import { postTicketOrder } from "@features/event-sender/api";

export const SEAT_TYPES = ["general", "vip", "premium"] as const;
export type SeatType = (typeof SEAT_TYPES)[number];

/**
 * チケット注文フォームの入力値
 *
 * @property eventId - イベント ID
 * @property eventName - イベント名
 * @property seatType - 席種 (general / vip / premium)
 * @property quantity - 枚数
 * @property amount - 合計金額 (円)
 */
interface FormState {
  eventId: string;
  eventName: string;
  seatType: SeatType;
  quantity: number;
  amount: number;
}

/** フォームの初期値。送信成功後のリセット時にも使用する */
const DEFAULT_FORM: FormState = {
  eventId: "evt-001",
  eventName: "技術カンファレンス 2026",
  seatType: "general",
  quantity: 1,
  amount: 5000,
};

/**
 * チケット注文フォームの状態と送信ロジックを管理するカスタムフック
 *
 * @returns form - 現在のフォーム値
 * @returns setField - フィールドを個別に更新する関数
 * @returns loading - 送信中フラグ
 * @returns error - エラーメッセージ (正常時は null)
 * @returns handleSubmit - フォーム送信ハンドラ
 */
export function useTicketOrderForm() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await postTicketOrder({
        event_id: form.eventId,
        event_name: form.eventName,
        seat_type: form.seatType,
        quantity: form.quantity,
        amount: form.amount,
      });
      setForm(DEFAULT_FORM);
    } catch (err) {
      setError(err instanceof Error ? err.message : "送信に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return { form, setField, loading, error, handleSubmit };
}

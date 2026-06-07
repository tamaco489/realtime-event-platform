import { config } from "@app/config";

const BASE_URL = config.apiBaseUrl;

/**
 * GET リクエストを送信する
 *
 * @param path - ベース URL に結合するパス (例: `/events`)
 * @returns レスポンスを T 型にパースした値
 */
export async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

/**
 * JSON ボディで POST リクエストを送信する
 *
 * @param path - ベース URL に結合するパス (例: `/events`)
 * @param body - リクエストボディ。JSON シリアライズして送信する
 * @returns レスポンスを T 型にパースした値。ボディなし (202 等) の場合は undefined
 */
export async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

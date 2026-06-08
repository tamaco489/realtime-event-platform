import { fetchAuthSession } from "aws-amplify/auth";

import { config } from "@app/config";

const BASE_URL = config.apiBaseUrl;

async function getIdToken(): Promise<string> {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (!token) throw new Error("ID Token の取得に失敗しました");
  return token;
}

/**
 * GET リクエストを送信する
 *
 * @param path - ベース URL に結合するパス (例: `/events`)
 * @returns レスポンスを T 型にパースした値
 */
export async function get<T>(path: string): Promise<T> {
  const token = await getIdToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
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
  const token = await getIdToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

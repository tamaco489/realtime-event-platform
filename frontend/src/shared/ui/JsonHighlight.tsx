/** JSON 値を型に応じた色でレンダリングするコンポーネント */
function JsonValue({ value }: { value: unknown }) {
  if (value === null) return <span className="text-purple-400">null</span>;
  if (typeof value === "boolean") return <span className="text-purple-400">{String(value)}</span>;
  if (typeof value === "number") return <span className="text-lime-400">{value}</span>;
  if (typeof value === "string") return <span className="text-amber-300">"{value}"</span>;
  return <span className="text-gray-300">{JSON.stringify(value)}</span>;
}

/**
 * JSON 文字列をシンタックスハイライト付きでレンダリングするコンポーネント
 *
 * キーは sky、文字列値は amber、数値は lime、boolean/null は purple で色付けする。
 * パース失敗時はプレーンテキストにフォールバックする。
 *
 * @property json - 表示する JSON 文字列
 */
export function JsonHighlight({ json }: { json: string }) {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(json) as Record<string, unknown>;
  } catch {
    return <span className="text-gray-300">{json}</span>;
  }

  const entries = Object.entries(parsed);

  return (
    <>
      <span className="text-gray-400">{"{"}</span>
      {"\n"}
      {entries.map(([key, value], i) => (
        <span key={key}>
          {"  "}
          <span className="text-sky-300">"{key}"</span>
          <span className="text-gray-400">: </span>
          <JsonValue value={value} />
          {i < entries.length - 1 && <span className="text-gray-400">,</span>}
          {"\n"}
        </span>
      ))}
      <span className="text-gray-400">{"}"}</span>
    </>
  );
}

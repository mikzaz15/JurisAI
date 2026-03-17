type TipTapNode = {
  type: string;
  content?: TipTapNode[];
  text?: string;
};

export function tiptapToPlainText(json: string | object): string {
  let node: TipTapNode;
  try {
    node = typeof json === "string" ? JSON.parse(json) : (json as TipTapNode);
  } catch {
    return typeof json === "string" ? json : "";
  }

  function extract(n: TipTapNode): string {
    if (n.type === "text") return n.text ?? "";
    if (n.content)
      return n.content
        .map(extract)
        .join(n.type === "paragraph" ? "\n" : "");
    return "";
  }

  return extract(node).trim();
}

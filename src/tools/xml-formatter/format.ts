export type XmlResult = { ok: true; value: string } | { ok: false; error: string };

function serializeNode(node: Node, depth: number): string {
  const pad = "  ".repeat(depth);

  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent ?? "").trim();
  }
  if (node.nodeType === Node.COMMENT_NODE) {
    return `${pad}<!--${node.textContent}-->`;
  }
  if (node.nodeType === Node.CDATA_SECTION_NODE) {
    return `${pad}<![CDATA[${node.textContent}]]>`;
  }
  if (node.nodeType === Node.PROCESSING_INSTRUCTION_NODE) {
    const pi = node as ProcessingInstruction;
    return `${pad}<?${pi.target} ${pi.data}?>`;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const el = node as Element;
  const attrs = Array.from(el.attributes)
    .map((a) => `${a.name}="${a.value}"`)
    .join(" ");
  const attrStr = attrs ? ` ${attrs}` : "";
  const tag = el.tagName;

  const children = Array.from(el.childNodes);
  if (children.length === 0) return `${pad}<${tag}${attrStr}/>`;

  const onlyText =
    children.length === 1 && children[0].nodeType === Node.TEXT_NODE;
  if (onlyText) {
    const text = (children[0].textContent ?? "").trim();
    return `${pad}<${tag}${attrStr}>${text}</${tag}>`;
  }

  const inner = children
    .map((c) => serializeNode(c, depth + 1))
    .filter((s) => s.length > 0)
    .join("\n");

  return `${pad}<${tag}${attrStr}>\n${inner}\n${pad}</${tag}>`;
}

function parseStrict(input: string): Document {
  const parser = new DOMParser();
  const doc = parser.parseFromString(input, "text/xml");
  const err = doc.querySelector("parsererror");
  if (err) {
    const msg = err.textContent?.replace(/\s+/g, " ").trim() ?? "Invalid XML";
    throw new Error(msg);
  }
  return doc;
}

export function formatXml(input: string): XmlResult {
  if (input.trim() === "") return { ok: true, value: "" };
  try {
    const doc = parseStrict(input);
    const lines: string[] = [];
    if (input.trimStart().startsWith("<?xml")) {
      const decl = input.match(/^<\?xml[^?]*\?>/)?.[0];
      if (decl) lines.push(decl);
    }
    lines.push(serializeNode(doc.documentElement, 0));
    return { ok: true, value: lines.join("\n") };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export function minifyXml(input: string): XmlResult {
  if (input.trim() === "") return { ok: true, value: "" };
  try {
    const doc = parseStrict(input);
    const serializer = new XMLSerializer();
    const raw = serializer.serializeToString(doc);
    return { ok: true, value: raw.replace(/>\s+</g, "><").trim() };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Tiny CommonMark-subset parser for the TUI.
 *
 * Block layer: ATX headings, fenced code blocks, unordered/ordered lists,
 * blockquotes, horizontal rules, and plain paragraphs.
 *
 * Inline layer: `code`, **bold**, *italic* / _italic_, [text](url), and \\ escapes.
 *
 * Designed for streaming: re-tokenize the accumulated text on every tick. To
 * keep the render stable, unclosed inline tokens at the end of the input are
 * dropped, and a fenced code block that hasn't seen its closing fence yet is
 * emitted as-is (the partial block is still useful).
 */

export type Run = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  link?: boolean;
};

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type Block =
  | { kind: "h"; level: HeadingLevel; runs: Run[] }
  | { kind: "p"; runs: Run[] }
  | { kind: "code"; lang?: string; text: string }
  | { kind: "ul"; items: Run[][] }
  | { kind: "ol"; items: Run[][] }
  | { kind: "quote"; runs: Run[] }
  | { kind: "hr" };

// ---------- block layer ----------

export function parseMarkdown(src: string): Block[] {
  const lines = src.split("\n");
  const blocks: Block[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? "";

    // Fenced code block — collects raw lines until the closing fence.
    const fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      const lang = fence[1] || undefined;
      const buf: string[] = [];
      i += 1;
      while (i < lines.length) {
        const next = lines[i] ?? "";
        if (/^```\s*$/.test(next)) {
          i += 1;
          break;
        }
        buf.push(next);
        i += 1;
      }
      blocks.push(
        lang !== undefined
          ? { kind: "code", lang, text: buf.join("\n") }
          : { kind: "code", text: buf.join("\n") },
      );
      continue;
    }

    // ATX heading.
    const heading = line.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/);
    if (heading) {
      const level = heading[1]!.length as HeadingLevel;
      blocks.push({ kind: "h", level, runs: parseInline(heading[2] ?? "") });
      i += 1;
      continue;
    }

    // Horizontal rule.
    if (/^(?:---|\*\*\*|___)\s*$/.test(line)) {
      blocks.push({ kind: "hr" });
      i += 1;
      continue;
    }

    // Unordered list — group consecutive "- " / "* " lines.
    if (/^[-*]\s+/.test(line)) {
      const items: Run[][] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i] ?? "")) {
        items.push(parseInline((lines[i] ?? "").replace(/^[-*]\s+/, "")));
        i += 1;
      }
      blocks.push({ kind: "ul", items });
      continue;
    }

    // Ordered list — group consecutive "1. " / "42. " lines.
    if (/^\d+\.\s+/.test(line)) {
      const items: Run[][] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i] ?? "")) {
        items.push(parseInline((lines[i] ?? "").replace(/^\d+\.\s+/, "")));
        i += 1;
      }
      blocks.push({ kind: "ol", items });
      continue;
    }

    // Blockquote — group consecutive "> " lines.
    if (/^>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i] ?? "")) {
        buf.push((lines[i] ?? "").replace(/^>\s?/, ""));
        i += 1;
      }
      blocks.push({ kind: "quote", runs: parseInline(buf.join(" ")) });
      continue;
    }

    // Blank line — skip.
    if (line.trim() === "") {
      i += 1;
      continue;
    }

    // Paragraph — group consecutive non-blank, non-block-starting lines.
    const paraLines: string[] = [];
    while (i < lines.length) {
      const cur = lines[i] ?? "";
      if (
        cur.trim() === "" ||
        /^#{1,6}\s+/.test(cur) ||
        /^```/.test(cur) ||
        /^[-*]\s+/.test(cur) ||
        /^\d+\.\s+/.test(cur) ||
        /^>\s?/.test(cur) ||
        /^(?:---|\*\*\*|___)\s*$/.test(cur)
      ) {
        break;
      }
      paraLines.push(cur);
      i += 1;
    }
    blocks.push({ kind: "p", runs: parseInline(paraLines.join(" ")) });
  }

  return blocks;
}

// ---------- inline layer ----------

export function parseInline(input: string): Run[] {
  const runs: Run[] = [];
  let buf = "";
  let i = 0;

  const flush = () => {
    if (buf.length > 0) {
      runs.push({ text: buf });
      buf = "";
    }
  };

  while (i < input.length) {
    const ch = input[i]!;

    // Backslash escape — consume the next char verbatim.
    if (ch === "\\" && i + 1 < input.length) {
      buf += input[i + 1];
      i += 2;
      continue;
    }

    // Inline code — `…` until next backtick. No nested parsing.
    if (ch === "`") {
      const end = input.indexOf("`", i + 1);
      if (end !== -1) {
        flush();
        runs.push({ text: input.slice(i + 1, end), code: true });
        i = end + 1;
        continue;
      }
      // Unclosed — drop the backtick, keep the text after it.
      i += 1;
      continue;
    }

    // Bold — **…**.
    if (ch === "*" && input[i + 1] === "*") {
      const end = input.indexOf("**", i + 2);
      if (end !== -1) {
        flush();
        runs.push({ text: input.slice(i + 2, end), bold: true });
        i = end + 2;
        continue;
      }
      // Unclosed — drop the markers.
      i += 2;
      continue;
    }

    // Italic — *…* or _…_.
    if (ch === "*" || ch === "_") {
      const marker = ch;
      const end = input.indexOf(marker, i + 1);
      if (end !== -1 && input[end - 1] !== "\\") {
        flush();
        runs.push({ text: input.slice(i + 1, end), italic: true });
        i = end + 1;
        continue;
      }
      // Unclosed — drop the marker.
      i += 1;
      continue;
    }

    // Link — [text](url).
    if (ch === "[") {
      const close = input.indexOf("]", i + 1);
      if (close !== -1 && input[close + 1] === "(") {
        const urlEnd = input.indexOf(")", close + 2);
        if (urlEnd !== -1) {
          flush();
          runs.push({ text: input.slice(i + 1, close), link: true });
          i = urlEnd + 1;
          continue;
        }
      }
      // Unclosed or malformed — drop the bracket.
      i += 1;
      continue;
    }

    buf += ch;
    i += 1;
  }

  flush();
  return runs;
}

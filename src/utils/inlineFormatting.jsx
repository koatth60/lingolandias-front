import React from "react";

// Slack-style inline formatting: *bold*, _italic_, ~strikethrough~, `code`.
// Single-char delimiters (not markdown's **bold**) to match what the user
// actually asked for ("como Slack o Teams"), and because chained single-pass
// splitting sequential-format handles the classic bold/italic asterisk
// ambiguity for free — once a pass turns matched text into a React element,
// later passes skip it (they only ever re-split plain strings).
const INLINE_PATTERNS = [
  { regex: /\*([^\n*]+)\*/g, render: (content, key) => <strong key={key}>{content}</strong> },
  { regex: /_([^\n_]+)_/g, render: (content, key) => <em key={key}>{content}</em> },
  { regex: /~([^\n~]+)~/g, render: (content, key) => <s key={key}>{content}</s> },
  {
    regex: /`([^\n`]+)`/g,
    render: (content, key) => (
      <code key={key} className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[0.9em]">
        {content}
      </code>
    ),
  },
];

const applyPattern = (nodes, regex, render, keyPrefix) => {
  const result = [];
  let tokenIndex = 0;
  nodes.forEach((node) => {
    if (typeof node !== "string") {
      result.push(node);
      return;
    }
    let lastIndex = 0;
    let match;
    regex.lastIndex = 0;
    while ((match = regex.exec(node)) !== null) {
      if (match.index > lastIndex) result.push(node.slice(lastIndex, match.index));
      result.push(render(match[1], `${keyPrefix}-${tokenIndex++}`));
      lastIndex = regex.lastIndex;
    }
    const tail = node.slice(lastIndex);
    if (tail) result.push(tail);
  });
  return result;
};

// Runs bold/italic/strike/code passes, then linkifies whatever plain text is
// left. `linkClassName` lets callers match their own sender/receiver bubble
// styling instead of this baking in one look.
export const renderInlineFormatting = (text, keyPrefix, linkClassName = "underline break-all") => {
  let nodes = [text];
  INLINE_PATTERNS.forEach(({ regex, render }, i) => {
    nodes = applyPattern(nodes, regex, render, `${keyPrefix}-f${i}`);
  });
  nodes = applyPattern(
    nodes,
    /(https?:\/\/[^\s]+)/g,
    (content, key) => (
      <a key={key} href={content} target="_blank" rel="noopener noreferrer" className={linkClassName}
        onClick={(e) => e.stopPropagation()}>
        {content}
      </a>
    ),
    `${keyPrefix}-url`
  );
  return nodes;
};

import React from "react";

function colorizeJson(json: string): React.ReactNode {
  // Regex for JSON tokens
  const regex = /("(\\.|[^"])*"|\b(true|false|null)\b|\d+(?:\.\d+)?)/g;
  let lastIndex = 0;
  const elements: React.ReactNode[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(json))) {
    // Add text before match
    if (match.index > lastIndex) {
      elements.push(json.slice(lastIndex, match.index));
    }
    const token = match[0];
    let color = "";
    if (/^"/.test(token)) {
      // Key or string
      color = /:/.test(
        json.slice(match.index + token.length, match.index + token.length + 1),
      )
        ? "text-sky-400" // key
        : "text-amber-300"; // string
    } else if (/true|false/.test(token)) {
      color = "text-lime-400";
    } else if (/null/.test(token)) {
      color = "text-pink-400";
    } else {
      color = "text-orange-300"; // number
    }
    elements.push(
      <span key={match.index} className={color}>
        {token}
      </span>,
    );
    lastIndex = match.index + token.length;
  }
  // Add remaining text
  if (lastIndex < json.length) {
    elements.push(json.slice(lastIndex));
  }
  return elements;
}

export function JsonHighlight({ json }: { json: string }) {
  return <>{colorizeJson(json)}</>;
}

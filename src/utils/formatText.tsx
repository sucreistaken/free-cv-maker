import type { ReactNode } from 'react';

/**
 * Parses markdown-style bold (**text**) and italic (*text*) markers
 * into React elements. Supports nested ***bold+italic***.
 * No dangerouslySetInnerHTML — returns safe React nodes.
 */
export function parseFormattedText(text: string): ReactNode {
  if (!text) return text;

  const parts: ReactNode[] = [];
  let key = 0;

  // Regex: match ***...*** first, then **...**, then *...*
  const regex = /(\*{3}(.+?)\*{3}|\*{2}(.+?)\*{2}|\*(?!\s)(.+?)(?<!\s)\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[2] !== undefined) {
      parts.push(<strong key={key}><em>{parseFormattedText(match[2])}</em></strong>);
    } else if (match[3] !== undefined) {
      parts.push(<strong key={key}>{parseFormattedText(match[3])}</strong>);
    } else if (match[4] !== undefined) {
      parts.push(<em key={key}>{parseFormattedText(match[4])}</em>);
    }

    key++;
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  if (parts.length === 0) return text;
  if (parts.length === 1 && typeof parts[0] === 'string') return text;

  return <>{parts}</>;
}

/**
 * Toggle bold/italic markers around selection.
 * If already wrapped → unwrap. Otherwise → wrap.
 */
export function applyFormatting(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  marker: string,
): { newValue: string; newStart: number; newEnd: number } {
  const m = marker.length;
  const selected = value.slice(selectionStart, selectionEnd);

  if (selected) {
    // Check if markers sit just outside the selection
    const before = value.slice(Math.max(0, selectionStart - m), selectionStart);
    const after = value.slice(selectionEnd, selectionEnd + m);

    if (before === marker && after === marker) {
      // Unwrap — remove outer markers
      return {
        newValue: value.slice(0, selectionStart - m) + selected + value.slice(selectionEnd + m),
        newStart: selectionStart - m,
        newEnd: selectionEnd - m,
      };
    }

    // Check if selection itself starts+ends with the marker
    if (selected.startsWith(marker) && selected.endsWith(marker) && selected.length >= m * 2) {
      const inner = selected.slice(m, -m);
      return {
        newValue: value.slice(0, selectionStart) + inner + value.slice(selectionEnd),
        newStart: selectionStart,
        newEnd: selectionStart + inner.length,
      };
    }

    // Wrap
    return {
      newValue: value.slice(0, selectionStart) + marker + selected + marker + value.slice(selectionEnd),
      newStart: selectionStart + m,
      newEnd: selectionEnd + m,
    };
  }

  // No selection — cursor only
  const before = value.slice(Math.max(0, selectionStart - m), selectionStart);
  const after = value.slice(selectionStart, selectionStart + m);

  if (before === marker && after === marker) {
    // Cursor between empty markers → remove them
    return {
      newValue: value.slice(0, selectionStart - m) + value.slice(selectionStart + m),
      newStart: selectionStart - m,
      newEnd: selectionStart - m,
    };
  }

  // Insert empty markers
  return {
    newValue: value.slice(0, selectionStart) + marker + marker + value.slice(selectionStart),
    newStart: selectionStart + m,
    newEnd: selectionStart + m,
  };
}

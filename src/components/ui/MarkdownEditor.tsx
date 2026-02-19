import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  previewRenderer?: (md: string) => ReactNode;
  className?: string;
}

function defaultRenderer(md: string): ReactNode {
  const lines = md.split("\n");
  const elements: ReactNode[] = [];
  let listItems: string[] = [];
  let blockquoteLines: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="list-disc pl-6 space-y-1">
          {listItems.map((li, i) => (
            <li key={i}>{renderInline(li)}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  const flushBlockquote = () => {
    if (blockquoteLines.length > 0) {
      elements.push(
        <blockquote
          key={`bq-${elements.length}`}
          className="border-l-4 border-accent pl-4 italic text-muted-foreground"
        >
          {blockquoteLines.map((l, i) => (
            <p key={i}>{renderInline(l)}</p>
          ))}
        </blockquote>
      );
      blockquoteLines = [];
    }
  };

  for (const line of lines) {
    // Blockquote
    if (line.startsWith("> ")) {
      flushList();
      blockquoteLines.push(line.slice(2));
      continue;
    }
    flushBlockquote();

    // List item
    if (line.startsWith("- ")) {
      listItems.push(line.slice(2));
      continue;
    }
    flushList();

    // Headings
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={`h-${elements.length}`} className="text-base font-semibold mt-3 mb-1">
          {renderInline(line.slice(4))}
        </h3>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h2 key={`h-${elements.length}`} className="text-lg font-semibold mt-4 mb-1">
          {renderInline(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith("# ")) {
      elements.push(
        <h1 key={`h-${elements.length}`} className="text-xl font-bold mt-4 mb-2">
          {renderInline(line.slice(2))}
        </h1>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={`br-${elements.length}`} className="h-2" />);
    } else {
      elements.push(
        <p key={`p-${elements.length}`}>{renderInline(line)}</p>
      );
    }
  }

  flushList();
  flushBlockquote();

  return <div className="space-y-1">{elements}</div>;
}

function renderInline(text: string): ReactNode {
  // Bold then italic: **text** and *text*
  const parts: ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) {
      parts.push(<strong key={match.index}>{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<em key={match.index}>{match[3]}</em>);
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

export function MarkdownEditor({
  value,
  onChange,
  previewRenderer,
  className,
}: MarkdownEditorProps) {
  const render = previewRenderer ?? defaultRenderer;

  return (
    <div className={cn("grid grid-cols-2 gap-4 min-h-[300px]", className)}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-border bg-muted p-4 font-mono text-sm text-foreground resize-none overflow-auto focus:outline-none focus:ring-2 focus:ring-ring"
        placeholder="Write markdown here..."
      />
      <div className="rounded-lg border border-border bg-muted p-4 text-sm text-foreground overflow-auto">
        {render(value)}
      </div>
    </div>
  );
}

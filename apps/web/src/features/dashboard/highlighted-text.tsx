// Color styles for highlighting (using inline styles to override prose)
const highlightColors: Record<string, { light: string; dark: string }> = {
  pink: {
    light: "rgba(251, 207, 232, 0.8)",
    dark: "rgba(236, 72, 153, 0.3)",
  },
  amber: {
    light: "rgba(253, 230, 138, 0.8)",
    dark: "rgba(245, 158, 11, 0.3)",
  },
  violet: {
    light: "rgba(221, 214, 254, 0.8)",
    dark: "rgba(139, 92, 246, 0.3)",
  },
};

// Color sequence for quoted terms
const colorSequence = ["pink", "amber", "violet"];

// Component to highlight quoted terms in AI response
// Since AI uses quotes for important terms (which may be translated), we highlight ALL quoted text
export function HighlightedText({
  text,
}: {
  text: string;
  highlights?: { term: string; color: string }[]; // kept for backwards compatibility
}) {
  const isDark = document.documentElement.classList.contains("dark");

  const renderContent = (content: string): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    let keyIdx = 0;
    let colorIdx = 0;

    // Match quoted text: "text" or «text» or „text" or "text"
    const quoteRegex = /["«„"\u201C]([^"»"'"\u201D]+)["»"'"\u201D]/g;
    let lastIndex = 0;
    let match;

    while ((match = quoteRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        result.push(
          <span key={keyIdx++}>{content.slice(lastIndex, match.index)}</span>,
        );
      }

      const colorKey = colorSequence[colorIdx % colorSequence.length];
      const colors = highlightColors[colorKey];
      colorIdx++;

      result.push(
        <mark
          key={keyIdx++}
          style={{
            backgroundColor: isDark ? colors.dark : colors.light,
            padding: "1px 4px",
            borderRadius: "3px",
            fontWeight: 700,
          }}
        >
          {match[1]}
        </mark>,
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      result.push(<span key={keyIdx++}>{content.slice(lastIndex)}</span>);
    }

    return result.length > 0 ? result : [<span key={0}>{content}</span>];
  };

  if (!text) return null;

  const paragraphs = text.split(/\n\n+/);

  return (
    <div className="space-y-4">
      {paragraphs.map((paragraph, idx) => (
        <p key={idx} className="text-foreground leading-relaxed">
          {renderContent(paragraph)}
        </p>
      ))}
    </div>
  );
}

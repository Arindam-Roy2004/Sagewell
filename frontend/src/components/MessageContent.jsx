import { Streamdown } from 'streamdown';
import CodeBlock from './CodeBlock';

/**
 * Renders assistant/user message text as Markdown.
 *
 * Rendered with Streamdown (a streaming-aware react-markdown wrapper): it memoizes
 * completed blocks so only the tail block re-renders per token, and auto-closes
 * unterminated markdown (**, ```, lists) mid-stream. GFM is built in.
 *
 * Why a markdown library instead of the previous hand-rolled regex parser:
 *  - Correctly handles nested lists, links, blockquotes, GitHub-flavored tables, and
 *    task lists (via remark-gfm).
 *  - Gracefully renders half-finished Markdown while streaming (e.g. an unclosed ```code
 *    fence) instead of producing broken output.
 *  - Styling is reused from the existing `.markdown-content` CSS, so the look is unchanged.
 */
// Streamdown ships its own Tailwind classes for each element. Map them back to plain
// tags so the existing `.markdown-content` CSS keeps controlling the look.
const PLAIN_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 'blockquote', 'hr',
  'table', 'thead', 'tbody', 'tr', 'th', 'td', 'strong', 'em', 'del', 'img',
];
const plainComponents = Object.fromEntries(
  PLAIN_TAGS.map((Tag) => [Tag, ({ node, ...props }) => <Tag {...props} />])
);

export default function MessageContent({ content, isStreaming = false }) {
  return (
    <div className="markdown-content text-sm leading-relaxed text-foreground/90 break-words">
      <Streamdown
        mode={isStreaming ? 'streaming' : 'static'}
        isAnimating={isStreaming}
        controls={false}
        components={{
          ...plainComponents,
          // Strip the default <pre> wrapper — fenced code is rendered by <CodeBlock/>,
          // which brings its own container, language label, and copy button.
          pre: ({ children }) => <>{children}</>,
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const text = String(children ?? '').replace(/\n$/, '');
            const isBlock = Boolean(match) || text.includes('\n');
            if (!isBlock) {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }
            return <CodeBlock language={match ? match[1] : 'text'}>{text}</CodeBlock>;
          },
          // Open links safely in a new tab.
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-strong underline underline-offset-2 hover:opacity-80"
            >
              {children}
            </a>
          ),
        }}
      >
        {content || ''}
      </Streamdown>
    </div>
  );
}

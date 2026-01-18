import { useEffect, useState, useMemo, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import { createHighlighter, type Highlighter, type BundledLanguage } from 'shiki';

interface MarkdownContentProps {
  content: string;
}

const SUPPORTED_LANGUAGES: BundledLanguage[] = [
  'javascript',
  'typescript',
  'python',
  'java',
  'c',
  'cpp',
  'csharp',
  'go',
  'rust',
  'ruby',
  'php',
  'swift',
  'kotlin',
  'html',
  'css',
  'scss',
  'json',
  'yaml',
  'xml',
  'markdown',
  'sql',
  'bash',
  'shell',
  'powershell',
  'dockerfile',
  'diff',
  'jsx',
  'tsx',
];

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-dark', 'github-light'],
      langs: SUPPORTED_LANGUAGES,
    });
  }
  return highlighterPromise;
}

interface CodeBlockProps {
  language: string;
  code: string;
}

const CodeBlock = memo(function CodeBlock({ language, code }: CodeBlockProps) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getHighlighter().then((highlighter) => {
      if (cancelled) return;
      const lang = SUPPORTED_LANGUAGES.includes(language as BundledLanguage)
        ? (language as BundledLanguage)
        : 'text';
      const highlighted = highlighter.codeToHtml(code, {
        lang: lang === 'text' ? 'javascript' : lang,
        themes: {
          light: 'github-light',
          dark: 'github-dark',
        },
        defaultColor: false,
      });
      setHtml(highlighted);
    });
    return () => {
      cancelled = true;
    };
  }, [language, code]);

  if (!html) {
    return (
      <pre className="shiki-fallback">
        <code>{code}</code>
      </pre>
    );
  }

  // eslint-disable-next-line react/no-danger
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
});

export const MarkdownContent = memo(function MarkdownContent({ content }: MarkdownContentProps) {
  const components = useMemo(
    () => ({
      code({ className, children, ...props }: React.ComponentProps<'code'>) {
        const match = /language-(\w+)/.exec(className || '');
        const codeString = String(children).replace(/\n$/, '');

        if (match) {
          return <CodeBlock language={match[1]} code={codeString} />;
        }

        return (
          <code className="inline-code" {...props}>
            {children}
          </code>
        );
      },
      pre({ children }: React.ComponentProps<'pre'>) {
        return <div className="code-block-wrapper">{children}</div>;
      },
    }),
    []
  );

  return (
    <div className="markdown-content">
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
});

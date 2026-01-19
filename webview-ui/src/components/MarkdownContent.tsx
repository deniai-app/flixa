import { useEffect, useState, useMemo, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import { createHighlighterCore, type HighlighterCore } from 'shiki/core';
import { createOnigurumaEngine } from 'shiki/engine/oniguruma';
import githubDark from 'shiki/themes/github-dark.mjs';
import githubLight from 'shiki/themes/github-light.mjs';
import langJavascript from 'shiki/langs/javascript.mjs';
import langTypescript from 'shiki/langs/typescript.mjs';
import langPython from 'shiki/langs/python.mjs';
import langJava from 'shiki/langs/java.mjs';
import langC from 'shiki/langs/c.mjs';
import langCpp from 'shiki/langs/cpp.mjs';
import langCsharp from 'shiki/langs/csharp.mjs';
import langGo from 'shiki/langs/go.mjs';
import langRust from 'shiki/langs/rust.mjs';
import langRuby from 'shiki/langs/ruby.mjs';
import langPhp from 'shiki/langs/php.mjs';
import langSwift from 'shiki/langs/swift.mjs';
import langKotlin from 'shiki/langs/kotlin.mjs';
import langHtml from 'shiki/langs/html.mjs';
import langCss from 'shiki/langs/css.mjs';
import langScss from 'shiki/langs/scss.mjs';
import langJson from 'shiki/langs/json.mjs';
import langYaml from 'shiki/langs/yaml.mjs';
import langXml from 'shiki/langs/xml.mjs';
import langMarkdown from 'shiki/langs/markdown.mjs';
import langSql from 'shiki/langs/sql.mjs';
import langBash from 'shiki/langs/bash.mjs';
import langShell from 'shiki/langs/shellscript.mjs';
import langPowershell from 'shiki/langs/powershell.mjs';
import langDockerfile from 'shiki/langs/dockerfile.mjs';
import langDiff from 'shiki/langs/diff.mjs';
import langJsx from 'shiki/langs/jsx.mjs';
import langTsx from 'shiki/langs/tsx.mjs';

interface MarkdownContentProps {
  content: string;
}

const SUPPORTED_LANGUAGES = [
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
  'shellscript',
  'powershell',
  'dockerfile',
  'diff',
  'jsx',
  'tsx',
] as const;

const LANG_MODULES = [
  langJavascript,
  langTypescript,
  langPython,
  langJava,
  langC,
  langCpp,
  langCsharp,
  langGo,
  langRust,
  langRuby,
  langPhp,
  langSwift,
  langKotlin,
  langHtml,
  langCss,
  langScss,
  langJson,
  langYaml,
  langXml,
  langMarkdown,
  langSql,
  langBash,
  langShell,
  langPowershell,
  langDockerfile,
  langDiff,
  langJsx,
  langTsx,
];

let highlighterPromise: Promise<HighlighterCore> | null = null;

function getHighlighter(): Promise<HighlighterCore> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [githubDark, githubLight],
      langs: LANG_MODULES,
      engine: createOnigurumaEngine(import('shiki/wasm')),
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
      const supportedLang = SUPPORTED_LANGUAGES.find((l) => l === language);
      const lang = supportedLang ?? 'javascript';
      const highlighted = highlighter.codeToHtml(code, {
        lang,
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

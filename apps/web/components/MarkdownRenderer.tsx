'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-invert prose-sm max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          h1: ({ children }) => <h1 className="text-2xl font-bold mt-6 mb-4 text-white">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-bold mt-6 mb-3 text-white">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-bold mt-4 mb-2 text-white">{children}</h3>,
          p: ({ children }) => <p className="mb-4 text-white/80 font-sans leading-relaxed">{children}</p>,
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match;
            
            return isInline ? (
              <code className="bg-white/10 px-1.5 py-0.5 rounded text-sm text-violet-300 font-mono" {...props}>
                {children}
              </code>
            ) : (
              <div className="relative my-4 rounded-lg overflow-hidden border border-white/10">
                <div className="absolute top-2 right-2 text-xs text-white/40 px-2 py-1 rounded bg-black/30">
                  {match[1]}
                </div>
                <pre className="p-4 bg-black/30 overflow-x-auto">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            );
          },
          ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-1 text-white/80 font-sans">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-1 text-white/80 font-sans">{children}</ol>,
          li: ({ children }) => <li className="ml-4">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-violet-500 pl-4 my-4 text-white/60 italic">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border border-white/10 rounded-lg">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2 bg-white/5 border-b border-white/10 text-left text-sm font-semibold text-white">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 border-b border-white/5 text-sm text-white/70">
              {children}
            </td>
          ),
          hr: () => <hr className="my-6 border-white/10" />,
          a: ({ href, children }) => (
            <a href={href} className="text-violet-400 hover:text-violet-300 underline transition-colors" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
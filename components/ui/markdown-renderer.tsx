// components/ui/markdown-renderer.tsx
// 마크다운 텍스트를 HTML로 렌더링하는 컴포넌트
// react-markdown과 remark-gfm을 사용하여 GitHub Flavored Markdown 지원
// 관련 파일: app/notes/[id]/page.tsx, components/notes/note-card.tsx

'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import 'highlight.js/styles/github.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-gray max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          // 코드 블록 스타일링
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <pre className="bg-gray-100 rounded-lg p-4 overflow-x-auto">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            ) : (
              <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props}>
                {children}
              </code>
            );
          },
          // 링크 스타일링
          a({ children, ...props }) {
            return (
              <a
                className="text-blue-600 hover:text-blue-800 underline"
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              >
                {children}
              </a>
            );
          },
          // 테이블 스타일링
          table({ children }) {
            return (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300">
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="border border-gray-300 bg-gray-50 px-4 py-2 text-left font-semibold">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="border border-gray-300 px-4 py-2">
                {children}
              </td>
            );
          },
          // 인용문 스타일링
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-700">
                {children}
              </blockquote>
            );
          },
          // 목록 스타일링
          ul({ children }) {
            return (
              <ul className="list-disc pl-6 space-y-1">
                {children}
              </ul>
            );
          },
          ol({ children }) {
            return (
              <ol className="list-decimal pl-6 space-y-1">
                {children}
              </ol>
            );
          },
          // 제목 스타일링
          h1({ children }) {
            return (
              <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-4">
                {children}
              </h1>
            );
          },
          h2({ children }) {
            return (
              <h2 className="text-2xl font-bold text-gray-900 mt-6 mb-3">
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="text-xl font-bold text-gray-900 mt-4 mb-2">
                {children}
              </h3>
            );
          },
          h4({ children }) {
            return (
              <h4 className="text-lg font-bold text-gray-900 mt-3 mb-2">
                {children}
              </h4>
            );
          },
          h5({ children }) {
            return (
              <h5 className="text-base font-bold text-gray-900 mt-2 mb-1">
                {children}
              </h5>
            );
          },
          h6({ children }) {
            return (
              <h6 className="text-sm font-bold text-gray-900 mt-2 mb-1">
                {children}
              </h6>
            );
          },
          // 단락 스타일링
          p({ children }) {
            return (
              <p className="text-gray-700 leading-relaxed mb-4">
                {children}
              </p>
            );
          },
          // 구분선 스타일링
          hr() {
            return <hr className="border-gray-300 my-6" />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

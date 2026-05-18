import { useEffect, useRef } from 'react';
import { marked } from 'marked';
import hljs from 'highlight.js';
import DOMPurify from 'dompurify';
import 'highlight.js/styles/github.css';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

// Configure marked renderer for code highlighting
const renderer = new marked.Renderer();
renderer.code = function({ text, lang }: { text: string; lang?: string }) {
  if (lang && hljs.getLanguage(lang)) {
    try {
      const highlighted = hljs.highlight(text, { language: lang }).value;
      return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`;
    } catch (err) {
      console.error('Highlight error:', err);
    }
  }
  const highlighted = hljs.highlightAuto(text).value;
  return `<pre><code class="hljs">${highlighted}</code></pre>`;
};

marked.setOptions({
  renderer,
  breaks: true,
  gfm: true
});

export function MarkdownContent({ content, className = '' }: MarkdownContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      // Parse markdown to HTML
      const rawHtml = marked.parse(content) as string;

      // Sanitize HTML to prevent XSS
      const cleanHtml = DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: [
          'p', 'br', 'strong', 'em', 'u', 'code', 'pre',
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'ul', 'ol', 'li', 'blockquote',
          'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
          'span', 'div'
        ],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'title', 'target']
      });

      contentRef.current.innerHTML = cleanHtml;
    }
  }, [content]);

  return (
    <div
      ref={contentRef}
      className={`markdown-content prose prose-sm max-w-none ${className}`}
    />
  );
}

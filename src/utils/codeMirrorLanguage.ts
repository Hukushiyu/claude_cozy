import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { rust } from '@codemirror/lang-rust';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { json } from '@codemirror/lang-json';
import { xml } from '@codemirror/lang-xml';
import { yaml } from '@codemirror/lang-yaml';
import { sql } from '@codemirror/lang-sql';
import { markdown } from '@codemirror/lang-markdown';
import { php } from '@codemirror/lang-php';
import type { LanguageSupport } from '@codemirror/language';

export function getLanguageExtension(fileName: string): LanguageSupport | null {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  switch (ext) {
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
      return javascript({ jsx: true });
    case 'ts':
    case 'tsx':
      return javascript({ typescript: true, jsx: ext === 'tsx' });
    case 'py':
      return python();
    case 'rs':
      return rust();
    case 'java':
      return java();
    case 'cpp':
    case 'cc':
    case 'cxx':
    case 'c':
    case 'h':
    case 'cs':
      return cpp();
    case 'css':
    case 'scss':
    case 'sass':
      return css();
    case 'html':
    case 'htm':
    case 'vue':
    case 'svelte':
      return html();
    case 'json':
    case 'jsonc':
      return json();
    case 'xml':
    case 'svg':
      return xml();
    case 'yaml':
    case 'yml':
      return yaml();
    case 'sql':
      return sql();
    case 'md':
    case 'mdx':
    case 'markdown':
      return markdown();
    case 'php':
      return php();
    default:
      return null;
  }
}

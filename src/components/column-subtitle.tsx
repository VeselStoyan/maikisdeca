import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h3 className="mb-2 mt-4 border-b border-zinc-200 pb-1 text-sm font-semibold tracking-tight text-zinc-900 first:mt-0 dark:border-zinc-700 dark:text-zinc-50">
      {children}
    </h3>
  ),
  h2: ({ children }) => (
    <h4 className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-700 first:mt-0 dark:text-zinc-300">
      {children}
    </h4>
  ),
  h3: ({ children }) => (
    <h5 className="mb-1.5 mt-3 text-xs font-semibold text-zinc-800 first:mt-0 dark:text-zinc-200">
      {children}
    </h5>
  ),
  h4: ({ children }) => (
    <h6 className="mb-1 mt-2 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
      {children}
    </h6>
  ),
  p: ({ children }) => (
    <p className="mb-2 text-xs leading-relaxed text-zinc-600 last:mb-0 dark:text-zinc-400">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="mb-2 ml-3.5 list-disc space-y-1.5 text-xs leading-relaxed text-zinc-600 marker:text-zinc-400 dark:text-zinc-400 dark:marker:text-zinc-500">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 ml-3.5 list-decimal space-y-1.5 text-xs leading-relaxed text-zinc-600 marker:text-zinc-400 dark:text-zinc-400">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-0.5">{children}</li>,
  hr: () => (
    <hr className="my-3 border-0 border-t border-zinc-200 dark:border-zinc-700" />
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-zinc-800 dark:text-zinc-200">
      {children}
    </strong>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="font-medium text-teal-700 underline decoration-teal-700/35 underline-offset-2 hover:text-teal-800 hover:decoration-teal-800 dark:text-teal-400 dark:decoration-teal-400/40 dark:hover:text-teal-300"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
};

export function ColumnSubtitle({ markdown }: { markdown: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkBreaks]}
      components={markdownComponents}
    >
      {markdown.trim()}
    </ReactMarkdown>
  );
}

import { useMemo } from "react";
import { Link, useParams, useLocation, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, Calendar, Tag } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import BottomNav from "@/components/BottomNav";
import PageTransition from "@/components/PageTransition";
import { legalDocs } from "@/data/legalContent";

const Legal = () => {
  const { slug } = useParams<{ slug: string }>();
  const { pathname } = useLocation();
  const doc = useMemo(() => {
    const key = slug ?? pathname.replace("/", "");
    if (!key) return null;
    return legalDocs[key as keyof typeof legalDocs] ?? null;
  }, [slug, pathname]);

  if (!doc) {
    return <Navigate to="/settings" replace />;
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-24 noise">
        {/* Header */}
        <header className="sticky top-0 z-40 glass border-b border-border/50">
          <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
            <Link
              to="/settings"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors"
              aria-label="뒤로가기"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-sm font-semibold tracking-tight">{doc.title}</h1>
            <div className="w-9" />
          </div>
        </header>

        <motion.main
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mx-auto max-w-lg px-4 pt-6"
        >
          {/* Title block */}
          <div className="glass rounded-3xl border border-border/50 p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold tracking-tight">{doc.title}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{doc.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground">
                    <Tag className="h-3 w-3" />
                    {doc.version}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    시행 {doc.effectiveDate}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <article className="glass mt-4 rounded-3xl border border-border/50 p-6">
            <div
              className="prose-legal text-sm leading-relaxed text-foreground/90"
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h2: ({ children }) => (
                    <h2 className="mt-6 mb-2 text-base font-semibold tracking-tight text-foreground first:mt-0">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="mt-4 mb-1.5 text-sm font-semibold text-foreground">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="my-2.5 text-sm leading-relaxed text-foreground/85">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="my-2.5 ml-4 list-disc space-y-1 text-sm text-foreground/85 marker:text-accent/70">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="my-2.5 ml-4 list-decimal space-y-1 text-sm text-foreground/85 marker:text-accent/70">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => <li className="pl-1">{children}</li>,
                  strong: ({ children }) => (
                    <strong className="font-semibold text-foreground">{children}</strong>
                  ),
                  hr: () => <hr className="my-6 border-border/50" />,
                  table: ({ children }) => (
                    <div className="my-3 overflow-x-auto rounded-xl border border-border/50">
                      <table className="w-full text-xs">{children}</table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-muted/40 text-foreground">{children}</thead>
                  ),
                  th: ({ children }) => (
                    <th className="px-3 py-2 text-left font-medium">{children}</th>
                  ),
                  td: ({ children }) => (
                    <td className="border-t border-border/40 px-3 py-2 text-foreground/85">
                      {children}
                    </td>
                  ),
                  code: ({ children }) => (
                    <code className="rounded bg-muted/50 px-1.5 py-0.5 text-[12px] font-mono text-accent">
                      {children}
                    </code>
                  ),
                  a: ({ children, href }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent underline-offset-2 hover:underline"
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {doc.content}
              </ReactMarkdown>
            </div>
          </article>

          <p className="py-6 text-center text-[11px] text-muted-foreground">
            문의: support@picks.kr
          </p>
        </motion.main>

        <BottomNav />
      </div>
    </PageTransition>
  );
};

export default Legal;

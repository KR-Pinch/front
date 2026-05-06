import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import {
  subscribeBrandFindings,
  clearBrandFindings,
  type RemoteFinding,
} from "./remoteAudit";

/** 다운로드 트리거 — 메모리 Blob 으로 저장. */
function downloadBlob(filename: string, mime: string, content: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const CSV_COLUMNS: (keyof RemoteFinding)[] = [
  "source",
  "path",
  "match",
  "replacement",
  "kind",
  "reason",
  "snippet",
];

function escapeCsv(value: unknown): string {
  const s = value == null ? "" : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(findings: RemoteFinding[]): string {
  const header = CSV_COLUMNS.join(",");
  const rows = findings.map((f) => CSV_COLUMNS.map((c) => escapeCsv(f[c])).join(","));
  return [header, ...rows].join("\n");
}

function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

const MAX_VISIBLE = 8;
const ALL = "__all__";

export const BrandAuditOverlay = () => {
  const isDev = (import.meta as { env?: { DEV?: boolean } }).env?.DEV;
  const [findings, setFindings] = useState<RemoteFinding[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [dismissedUntil, setDismissedUntil] = useState(0);
  const [sourceFilter, setSourceFilter] = useState<string>(ALL);
  const [kindFilter, setKindFilter] = useState<string>(ALL);
  const [pathQuery, setPathQuery] = useState<string>("");

  useEffect(() => {
    if (!isDev) return;
    return subscribeBrandFindings((batch) => {
      setFindings((prev) => {
        if (batch.length === 0) return [];
        const key = (f: RemoteFinding) => `${f.source}|${f.path}|${f.match}`;
        const map = new Map(prev.map((f) => [key(f), f]));
        for (const f of batch) map.set(key(f), f);
        return Array.from(map.values()).slice(-MAX_VISIBLE * 8);
      });
    });
  }, [isDev]);

  const sources = useMemo(
    () => Array.from(new Set(findings.map((f) => f.source))).sort(),
    [findings],
  );
  const kinds = useMemo(
    () => Array.from(new Set(findings.map((f) => f.kind))).sort(),
    [findings],
  );

  const filtered = useMemo(() => {
    const q = pathQuery.trim().toLowerCase();
    return findings.filter((f) => {
      if (sourceFilter !== ALL && f.source !== sourceFilter) return false;
      if (kindFilter !== ALL && f.kind !== kindFilter) return false;
      if (q && !f.path.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [findings, sourceFilter, kindFilter, pathQuery]);

  if (!isDev) return null;
  if (findings.length === 0) return null;
  if (Date.now() < dismissedUntil) return null;

  const visible = filtered.slice(-MAX_VISIBLE).reverse();
  const hasFilter =
    sourceFilter !== ALL || kindFilter !== ALL || pathQuery.trim().length > 0;

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[9999] flex max-w-sm flex-col gap-2"
      role="status"
      aria-live="polite"
      data-testid="brand-audit-overlay"
    >
      <div className="pointer-events-auto rounded-xl border border-amber-500/60 bg-background/95 shadow-xl backdrop-blur">
        <header className="flex items-center justify-between gap-2 border-b border-amber-500/30 px-3 py-2">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
            <span>PINCH brand audit</span>
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-mono text-amber-600 dark:text-amber-400">
              {hasFilter ? `${filtered.length}/${findings.length}` : findings.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                if (filtered.length === 0) return;
                downloadBlob(
                  `brand-audit-${timestamp()}.json`,
                  "application/json",
                  JSON.stringify(filtered, null, 2),
                );
              }}
              disabled={filtered.length === 0}
              className="rounded px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-muted disabled:opacity-40"
              title="필터 결과를 JSON 으로 내보내기"
            >
              JSON
            </button>
            <button
              type="button"
              onClick={() => {
                if (filtered.length === 0) return;
                downloadBlob(
                  `brand-audit-${timestamp()}.csv`,
                  "text/csv;charset=utf-8",
                  toCsv(filtered),
                );
              }}
              disabled={filtered.length === 0}
              className="rounded px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-muted disabled:opacity-40"
              title="필터 결과를 CSV 로 내보내기"
            >
              CSV
            </button>
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className="rounded px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-muted"
            >
              {collapsed ? "펼치기" : "접기"}
            </button>
            <button
              type="button"
              onClick={() => {
                clearBrandFindings();
                setFindings([]);
              }}
              className="rounded px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-muted"
            >
              비우기
            </button>
            <button
              type="button"
              onClick={() => setDismissedUntil(Date.now() + 60_000)}
              className="rounded px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-muted"
              title="1분간 숨김"
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
        </header>
        {!collapsed && (
          <>
            <div className="flex flex-wrap items-center gap-1.5 border-b border-border/40 px-3 py-2 text-[11px]">
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="max-w-[120px] truncate rounded border border-border bg-background px-1.5 py-0.5 text-[11px]"
                aria-label="source 필터"
                title="source 필터"
              >
                <option value={ALL}>source: 전체 ({sources.length})</option>
                {sources.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <select
                value={kindFilter}
                onChange={(e) => setKindFilter(e.target.value)}
                className="rounded border border-border bg-background px-1.5 py-0.5 text-[11px]"
                aria-label="kind 필터"
                title="kind 필터"
              >
                <option value={ALL}>kind: 전체</option>
                {kinds.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
              <input
                type="search"
                value={pathQuery}
                onChange={(e) => setPathQuery(e.target.value)}
                placeholder="path 검색"
                aria-label="path 검색"
                className="min-w-[80px] flex-1 rounded border border-border bg-background px-1.5 py-0.5 text-[11px] placeholder:text-muted-foreground/60"
              />
              {hasFilter && (
                <button
                  type="button"
                  onClick={() => {
                    setSourceFilter(ALL);
                    setKindFilter(ALL);
                    setPathQuery("");
                  }}
                  className="rounded px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-muted"
                  title="필터 초기화"
                >
                  초기화
                </button>
              )}
            </div>
            <ul className="max-h-72 overflow-auto px-3 py-2 text-[11px]">
              {visible.length === 0 ? (
                <li className="py-2 text-center text-muted-foreground">
                  필터 조건에 맞는 항목이 없습니다.
                </li>
              ) : (
                visible.map((f, i) => (
                  <li
                    key={`${f.source}-${f.path}-${f.match}-${i}`}
                    className="border-b border-border/40 py-1.5 last:border-b-0"
                  >
                    <div className="flex items-baseline gap-2">
                      <code className="rounded bg-amber-500/10 px-1 font-mono text-amber-700 dark:text-amber-300">
                        {f.match}
                      </code>
                      <span className="text-muted-foreground">→</span>
                      <code className="font-mono">{f.replacement}</code>
                      <button
                        type="button"
                        onClick={() => setKindFilter(f.kind)}
                        className="ml-auto rounded bg-muted px-1.5 text-[10px] uppercase tracking-wide text-muted-foreground hover:bg-amber-500/20"
                        title={`kind=${f.kind} 로 필터`}
                      >
                        {f.kind}
                      </button>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 truncate font-mono text-[10px] text-muted-foreground">
                      <button
                        type="button"
                        onClick={() => setSourceFilter(f.source)}
                        className="rounded px-1 hover:bg-muted"
                        title={`source=${f.source} 로 필터`}
                      >
                        {f.source}
                      </button>
                      <span>·</span>
                      <button
                        type="button"
                        onClick={() => setPathQuery(f.path)}
                        className="truncate rounded px-1 text-left hover:bg-muted"
                        title={`path=${f.path} 로 필터`}
                      >
                        {f.path}
                      </button>
                    </div>
                    <div className="text-muted-foreground">{f.snippet}</div>
                  </li>
                ))
              )}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

export default BrandAuditOverlay;

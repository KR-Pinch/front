import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

/**
 * Dev-only multi-viewport preview.
 *
 * Renders the current app inside three iframes (mobile / tablet / desktop)
 * side-by-side so we can eyeball responsive layout regressions without
 * resizing the browser.
 *
 * Not linked from the app — open via `/_dev/preview` directly.
 */

type Tier = {
  id: string;
  label: string;
  /** CSS pixel width passed to the iframe + scale calc */
  width: number;
  /** CSS pixel height of the simulated device viewport */
  height: number;
  hint: string;
};

const TIERS: Tier[] = [
  { id: "mobile", label: "Mobile", width: 390, height: 844, hint: "< md (BottomNav)" },
  { id: "tablet", label: "Tablet", width: 820, height: 1180, hint: "md..xl (Sidebar)" },
  { id: "desktop", label: "Desktop", width: 1440, height: 900, hint: "xl+ (Sidebar + Right rail)" },
];

const ROUTES = ["/", "/topic", "/archive", "/ranking", "/mypage", "/settings"];

const DevPreview = () => {
  const [route, setRoute] = useState("/");
  const [scale, setScale] = useState(0.5);

  // Pass a flag so the embedded app could optionally suppress dev-preview if
  // ever needed (currently unused, just future-proof).
  const src = useMemo(() => `${route}?__dev_preview=1`, [route]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Toolbar */}
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center gap-3 px-4 py-3">
          <Link
            to="/"
            className="text-sm font-black"
          >
            <span className="text-gradient">PICKS</span>
            <span className="ml-2 text-xs font-medium text-muted-foreground">
              · Dev Preview
            </span>
          </Link>

          <div className="flex-1" />

          {/* Route picker */}
          <label className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Route</span>
            <select
              value={route}
              onChange={(e) => setRoute(e.target.value)}
              className="rounded-md border border-border bg-secondary px-2 py-1 text-xs font-semibold"
            >
              {ROUTES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>

          {/* Custom route */}
          <input
            type="text"
            value={route}
            onChange={(e) => setRoute(e.target.value || "/")}
            placeholder="/custom/route"
            className="w-44 rounded-md border border-border bg-secondary px-2 py-1 text-xs font-mono"
          />

          {/* Scale */}
          <label className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Scale</span>
            <input
              type="range"
              min={0.25}
              max={1}
              step={0.05}
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
            />
            <span className="w-10 text-right font-mono">{Math.round(scale * 100)}%</span>
          </label>
        </div>
      </header>

      {/* Tier grid */}
      <div className="mx-auto flex max-w-screen-2xl flex-wrap items-start gap-6 px-4 py-6">
        {TIERS.map((tier) => {
          const scaledW = Math.round(tier.width * scale);
          const scaledH = Math.round(tier.height * scale);

          return (
            <section key={tier.id} className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-sm font-bold">
                  {tier.label}
                  <span className="ml-2 text-[10px] font-mono text-muted-foreground">
                    {tier.width}×{tier.height}
                  </span>
                </h2>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {tier.hint}
                </span>
              </div>

              {/* Frame box. Outer box uses the SCALED size so the surrounding
                  flex layout stays sane; the iframe inside is rendered at the
                  device's true CSS px width and then visually scaled. */}
              <div
                className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-lg"
                style={{ width: scaledW, height: scaledH }}
              >
                <iframe
                  key={`${tier.id}-${route}`}
                  title={`${tier.label} preview of ${route}`}
                  src={src}
                  // Render at true device width, then scale down.
                  style={{
                    width: tier.width,
                    height: tier.height,
                    border: 0,
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                    display: "block",
                  }}
                />
              </div>
            </section>
          );
        })}
      </div>

      <footer className="px-4 pb-10 text-center text-[11px] text-muted-foreground">
        Tip: 각 프레임은 실제 디바이스 너비로 렌더된 뒤 시각적으로만 축소됩니다.
        Tailwind 브레이크포인트는 iframe 내부의 실제 CSS 픽셀 폭을 기준으로 동작합니다.
      </footer>
    </div>
  );
};

export default DevPreview;

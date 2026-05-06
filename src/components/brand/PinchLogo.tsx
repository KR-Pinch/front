import PicksMark from "./PicksMark";

/**
 * Canonical PINCH logo lockup: PicksMark + wordmark.
 *
 * Use this anywhere the full brand should appear (sidebar header, footer,
 * auth screen, hero). For icon-only contexts use <PicksMark /> directly.
 */
interface Props {
  className?: string;
  /** Wordmark size variant. */
  size?: "sm" | "md" | "lg";
  /** Hide the wordmark (mark only) — used in collapsed sidebars. */
  markOnly?: boolean;
  /** Optional tagline shown under the wordmark. */
  withTagline?: boolean;
}

const sizeMap = {
  sm: { mark: "h-7 w-7", word: "text-sm", gap: "gap-2" },
  md: { mark: "h-8 w-8", word: "text-base", gap: "gap-2.5" },
  lg: { mark: "h-10 w-10", word: "text-xl", gap: "gap-3" },
};

const PicksLogo = ({
  className = "",
  size = "md",
  markOnly = false,
  withTagline = false,
}: Props) => {
  const s = sizeMap[size];

  return (
    <span className={`inline-flex items-center ${s.gap} ${className}`}>
      <PicksMark className={`${s.mark} shrink-0`} />
      {!markOnly && (
        <span className="flex flex-col leading-none">
          <span className={`brand-wordmark ${s.word}`}>
            <span className="text-gradient">PINCH</span>
          </span>
          {withTagline && (
            <span className="mt-1 text-[10px] font-medium tracking-[0.18em] text-muted-foreground">
              ONLY ONE REMAINS
            </span>
          )}
        </span>
      )}
    </span>
  );
};

export default PicksLogo;

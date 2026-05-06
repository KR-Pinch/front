import markSrc from "@/assets/picks-mark.png";

/**
 * PicksMark — official PICKS brand logomark.
 *
 * Final mark (decided): a dark rounded-square tile with a white stroke
 * leaning toward a single gold dot — visualizing the brand idea
 * "모든 의견이 남지 않습니다. 오직 선택된 하나만 남습니다."
 *
 * Implementation: rendered from the canonical PNG asset (src/assets/picks-mark.png)
 * so the artwork stays pixel-identical across the app. The image already includes
 * its own dark background, so it works on both light and dark themes.
 *
 * Usage:
 *   <PicksMark className="h-8 w-8" />
 *   <PicksMark size={24} />
 *
 * Always pair with the PICKS wordmark using `.brand-wordmark` for the
 * canonical lockup. Never recolor or redraw.
 */
interface Props {
  className?: string;
  size?: number;
  /** Reserved for API compatibility — the PNG mark has no separate compact form. */
  compact?: boolean;
  title?: string;
}

const PicksMark = ({ className, size, title = "PICKS" }: Props) => {
  const dimension = size ? { width: size, height: size } : undefined;

  return (
    <img
      src={markSrc}
      alt={title}
      className={className}
      style={{ ...dimension, borderRadius: "22%" }}
      draggable={false}
    />
  );
};

export default PicksMark;

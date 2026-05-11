import { useEffect, useRef, useState } from "react";

const ADFIT_SCRIPT_SRC = "https://t1.kakaocdn.net/kas/static/ba.min.js";

interface AdFitBannerProps {
  adUnitId?: string;
  width?: number;
  height?: number;
  className?: string;
}

type AdFitSlot = Required<Pick<AdFitBannerProps, "adUnitId" | "width" | "height">>;

interface ResponsiveAdFitBannerProps {
  mobileSlot: AdFitSlot;
  wideSlot: AdFitSlot;
  breakpoint?: number;
  className?: string;
}

const AdFitBanner = ({ adUnitId, width = 320, height = 100, className = "" }: AdFitBannerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!adUnitId || initialized.current) return;
    if (!containerRef.current) return;

    let ins: HTMLModElement | null = null;
    let script: HTMLScriptElement | null = null;

    try {
      ins = document.createElement("ins");
      ins.className = "kakao_ad_area";
      ins.style.display = "none";
      ins.style.width = "100%";
      ins.setAttribute("data-ad-unit", adUnitId);
      ins.setAttribute("data-ad-width", String(width));
      ins.setAttribute("data-ad-height", String(height));
      containerRef.current.appendChild(ins);

      script = document.createElement("script");
      script.async = true;
      script.type = "text/javascript";
      script.src = ADFIT_SCRIPT_SRC;
      script.onerror = () => console.error("AdFit SDK load error:", adUnitId);
      containerRef.current.appendChild(script);

      initialized.current = true;
    } catch (error) {
      console.error("AdFit load error:", error);
    }

    return () => {
      ins?.remove();
      script?.remove();
      initialized.current = false;
    };
  }, [adUnitId, width, height]);

  return (
    <div
      ref={containerRef}
      className={`flex items-center justify-center overflow-hidden rounded-xl ${
        adUnitId ? "" : "bg-secondary/50 border border-border/30"
      } ${className}`}
      style={{
        minHeight: height,
        width: "100%",
        maxWidth: "100%",
      }}
    >
      {!adUnitId && (
        <div className="flex flex-col items-center gap-1 py-4 text-center">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
            AD
          </span>
          <span className="text-xs text-muted-foreground/40">
            AD area ({width}x{height})
          </span>
        </div>
      )}
    </div>
  );
};

export const ResponsiveAdFitBanner = ({
  mobileSlot,
  wideSlot,
  breakpoint = 768,
  className = "",
}: ResponsiveAdFitBannerProps) => {
  const [isWide, setIsWide] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(`(min-width: ${breakpoint}px)`).matches;
  });

  useEffect(() => {
    const media = window.matchMedia(`(min-width: ${breakpoint}px)`);
    const sync = () => setIsWide(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [breakpoint]);

  const slot = isWide ? wideSlot : mobileSlot;

  return (
    <AdFitBanner
      key={`${slot.adUnitId}-${slot.width}x${slot.height}`}
      {...slot}
      className={className}
    />
  );
};

export default AdFitBanner;

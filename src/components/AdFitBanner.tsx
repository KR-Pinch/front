import { useEffect, useRef, useState } from "react";

const ADFIT_SCRIPT_ID = "kakao-adfit-sdk";
const ADFIT_SCRIPT_SRC = "https://t1.daumcdn.net/kas/static/ba.min.js";

declare global {
  interface Window {
    adfit?: {
      display: (adUnitId: string) => void;
    };
    __adfitSdkPromise?: Promise<void>;
  }
}

interface AdFitBannerProps {
  /** AdFit 광고 단위 ID */
  adUnitId?: string;
  /** 광고 너비 (기본 320) */
  width?: number;
  /** 광고 높이 (기본 100) */
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

const loadAdFitSdk = () => {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.__adfitSdkPromise) return window.__adfitSdkPromise;

  window.__adfitSdkPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(ADFIT_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      if (window.adfit) resolve();
      else existing.addEventListener("load", () => resolve(), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = ADFIT_SCRIPT_ID;
    script.async = true;
    script.src = ADFIT_SCRIPT_SRC;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Kakao AdFit SDK"));
    document.head.appendChild(script);
  });

  return window.__adfitSdkPromise;
};

/**
 * 카카오 AdFit 배너 광고 컴포넌트
 * 
 * 사용법:
 * 1. index.html <head>에 AdFit SDK 스크립트 추가:
 *    <script async src="https://t1.daumcdn.net/kas/static/ba.min.js"></script>
 * 2. adUnitId에 발급받은 광고 단위 ID를 전달
 */
const AdFitBanner = ({ adUnitId, width = 320, height = 100, className = "" }: AdFitBannerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!adUnitId || initialized.current) return;
    if (!containerRef.current) return;

    let ins: HTMLModElement | null = null;
    let isMounted = true;

    try {
      ins = document.createElement("ins");
      ins.className = "kakao_ad_area";
      ins.style.display = "none";
      ins.setAttribute("data-ad-unit", adUnitId);
      ins.setAttribute("data-ad-width", String(width));
      ins.setAttribute("data-ad-height", String(height));
      containerRef.current.appendChild(ins);

      // AdFit SDK가 로드되어 있으면 광고 렌더
      loadAdFitSdk()
        .then(() => {
          if (isMounted) window.adfit?.display(adUnitId);
        })
        .catch((error) => console.error("AdFit SDK load error:", error));
      initialized.current = true;
    } catch (e) {
      console.error("AdFit load error:", e);
    }

    return () => {
      isMounted = false;
      ins?.remove();
      initialized.current = false;
    };
  }, [adUnitId, width, height]);

  return (
    <div
      ref={containerRef}
      className={`flex items-center justify-center overflow-hidden rounded-xl ${
        adUnitId ? "" : "bg-secondary/50 border border-border/30"
      } ${className}`}
      style={{ minHeight: height, maxWidth: "100%" }}
    >
      {!adUnitId && (
        <div className="flex flex-col items-center gap-1 py-4 text-center">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
            AD
          </span>
          <span className="text-xs text-muted-foreground/40">
            광고 영역 ({width}×{height})
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

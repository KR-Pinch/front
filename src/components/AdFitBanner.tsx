import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adfit?: {
      display: (adUnitId: string) => void;
    };
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

    try {
      const ins = document.createElement("ins");
      ins.className = "kakao_ad_area";
      ins.style.display = "none";
      ins.setAttribute("data-ad-unit", adUnitId);
      ins.setAttribute("data-ad-width", String(width));
      ins.setAttribute("data-ad-height", String(height));
      containerRef.current.appendChild(ins);

      // AdFit SDK가 로드되어 있으면 광고 렌더
      window.adfit?.display(adUnitId);
      initialized.current = true;
    } catch (e) {
      console.error("AdFit load error:", e);
    }

    return () => {
      initialized.current = false;
    };
  }, [adUnitId, width, height]);

  return (
    <div
      ref={containerRef}
      className={`flex items-center justify-center overflow-hidden rounded-xl bg-secondary/50 border border-border/30 ${className}`}
      style={{ minHeight: height }}
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

export default AdFitBanner;

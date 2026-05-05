import { useEffect, useRef } from "react";
import { auditRemoteDocument, type AuditOptions, type RemoteFinding } from "./remoteAudit";

/**
 * 컴포넌트에 주입된 외부 문서(CMS 응답, i18n 번들 등)를
 * 렌더링 시점에 자동으로 검증한다. 같은 문서 참조에 대해서는 한 번만 실행한다.
 *
 *   const { data } = useQuery(...);
 *   useBrandAudit(data, { source: "cms:homepage" });
 */
export function useBrandAudit<T>(doc: T | undefined | null, options: AuditOptions): RemoteFinding[] {
  const ref = useRef<{ doc: unknown; findings: RemoteFinding[] }>({ doc: undefined, findings: [] });
  useEffect(() => {
    if (doc == null) return;
    if (ref.current.doc === doc) return;
    const { findings } = auditRemoteDocument(doc, options);
    ref.current = { doc, findings };
    // options.source 변경은 의도적으로 무시 — source 라벨은 호출 컴포넌트당 고정 가정
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc]);
  return ref.current.findings;
}

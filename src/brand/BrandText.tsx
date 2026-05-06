import { Children, isValidElement, cloneElement, type ReactNode } from "react";
import { applyBrandTerms } from "./terms";

/**
 * 자식 트리의 문자열 노드에 브랜드 용어 규칙을 일괄 적용합니다.
 * - JSX 구조/스타일은 보존
 * - 문자열 노드만 `applyBrandTerms`로 정규화
 *
 * 사용 예:
 *   <BrandText>
 *     <p>오늘의 한마디입니다.</p>
 *   </BrandText>
 *   // → "오늘의 PINCH입니다."
 *
 * 의미 보존이 중요한 카피는 작성 단계에서 직접 교정을 권장합니다.
 * 이 컴포넌트는 안전망(런타임 가드)입니다.
 */
export function BrandText({ children }: { children: ReactNode }) {
  return <>{transform(children)}</>;
}

function transform(node: ReactNode): ReactNode {
  if (typeof node === "string") return applyBrandTerms(node);
  if (Array.isArray(node)) return node.map((n, i) => {
    const t = transform(n);
    if (isValidElement(t) && t.key == null) {
      return cloneElement(t, { key: i });
    }
    return t;
  });
  if (isValidElement(node)) {
    const props = node.props as { children?: ReactNode };
    if (props?.children !== undefined) {
      return cloneElement(node, undefined, transform(props.children));
    }
  }
  return node;
}

export { applyBrandTerms as brand } from "./terms";

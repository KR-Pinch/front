# PINCH 브랜드 정합성 리포트

❌ **4건의 위반**이 발견되었습니다.

## 금칙어 (legacy term) · 2건

| 파일 | 라인 | 매치 | 사유 |
|------|------|------|------|
| `src/__brand_demo__/sample.tsx` | 1 | `한마디` | 레거시 서비스명. 'PINCH'로 대체하세요. |
| `src/__brand_demo__/sample.tsx` | 1 | `박제` | 레거시 메타포. 문맥에 따라 '오늘의 PINCH' 또는 '선택된 PINCH'로 대체하세요. |

## 브랜드 대소문자 · 2건

| 파일 | 라인 | 매치 | 사유 |
|------|------|------|------|
| `src/__brand_demo__/sample.tsx` | 1 | `Pinch` | 브랜드 표기는 항상 대문자 'PINCH' 입니다. |
| `src/__brand_demo__/sample.tsx` | 1 | `pinch` | 브랜드 표기는 항상 대문자 'PINCH' 입니다. |

> 규칙 정의: `src/brand/terms.mjs` · 로컬 재현: `npm run scan:brand`
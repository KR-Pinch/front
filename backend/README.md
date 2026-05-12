# PINCH Backend

PINCH 백엔드는 MySQL 8.x 기준으로 설계합니다. 기존 프론트의 mock 데이터, localStorage 기반 인증, 관리자 mock 데이터를 실제 API와 DB로 옮기기 위한 기준 문서와 초기 SQL을 이 폴더에 둡니다.

## 폴더 구조

```text
backend/
├── README.md
├── FRONTEND_API_REQUIREMENTS.md
├── migrations/
│   └── 0001_init.sql
└── seed/
    └── 001_seed.sql
```

## 적용 순서

```bash
mysql -u root -p < backend/migrations/0001_init.sql
mysql -u root -p pinch < backend/seed/001_seed.sql
```

`0001_init.sql`은 `pinch` 데이터베이스를 생성하고 기본 테이블, 인덱스, 제약조건을 만듭니다. `001_seed.sql`은 프론트에서 사용하는 기본 카테고리와 샘플 토픽을 넣습니다.

## 핵심 규칙

| 규칙 | DB/API 보장 방식 |
| --- | --- |
| 하루 1인 1 PINCH | `pinches`의 generated column + unique key |
| 하루 기준은 KST | API 서버에서 `kst_day`를 `Asia/Seoul` 기준으로 계산 |
| PINCH 좋아요는 1인 1회 | `pinch_likes(pinch_id, user_id)` unique key |
| 자기 PINCH 좋아요 금지 | API 트랜잭션에서 검증 |
| 토픽 교체 시 기존 PINCH 보존 | `status = 'archived_invalid'`로 무효화 |
| 랭킹/아카이브 집계 | `pinches.status = 'active'`만 포함 |
| 영구 정지 전화번호 재가입 차단 | `banned_phones.phone_hash` 검사 |
| 관리자 기능 분리 | `users.role = 'admin'` 검증과 `admin_audit_logs` 기록 |

## 프론트 교체 대상

| 프론트 파일 | 백엔드 연결 방향 |
| --- | --- |
| `src/hooks/useAuth.ts` | `/api/auth/*`, `/api/me` |
| `src/hooks/useAdminAuth.ts` | `/api/admin/auth/*`, `/api/admin/me` |
| `src/data/mockData.ts` | `/api/home`, `/api/topics`, `/api/archive`, `/api/rankings` |
| `src/data/adminData.ts` | `/api/admin/*` |
| `src/data/myPageData.ts` | `/api/me/profile`, `/api/me/stats`, `/api/me/pinches` |

상세 API 계약은 `FRONTEND_API_REQUIREMENTS.md`를 기준으로 합니다.

## 보안 기준

- 비밀번호는 Argon2id 또는 bcrypt로 해시합니다.
- refresh token은 httpOnly secure cookie 사용을 권장합니다.
- 전화번호는 평문 저장 금지입니다. 검색/차단용 hash와 표시/복호화용 encrypted value를 분리합니다.
- SMS 인증번호는 원문 저장 금지입니다. hash, 만료 시간, 시도 횟수만 저장합니다.
- PINCH 작성, 좋아요, 신고, 로그인, SMS 발송은 rate limit을 적용합니다.
- 관리자 액션은 반드시 `admin_audit_logs`에 남깁니다.
- SQL은 parameterized query 또는 ORM/query builder만 사용합니다.

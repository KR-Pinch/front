# PINCH Frontend API Requirements

현재 프론트엔드가 mock 데이터, localStorage, 외부 RSS 직접 호출로 처리하는 기능을 실제 백엔드 API로 옮기기 위한 요구사항입니다.

Target DB: MySQL 8.x

## 1. 제품 규칙

| 규칙 | 백엔드 보장 방식 |
| --- | --- |
| 하루 1인 1 PINCH | `pinches`의 `active_day_key` generated column + `UNIQUE(user_id, active_day_key)` |
| 하루 기준은 KST | API 서버에서 `Asia/Seoul` 기준 `kst_day` 계산 |
| 마감은 매일 KST 00:00 | 마감 이후 작성/좋아요 제한 |
| PINCH 좋아요는 1인 1회 | `pinch_likes(pinch_id, user_id)` unique key |
| 자기 PINCH 좋아요 금지 | API 트랜잭션에서 검증 |
| 토픽 교체 시 기존 PINCH 삭제 금지 | `status = 'archived_invalid'`로 무효화 |
| 랭킹/아카이브 집계 | `pinches.status = 'active'`만 포함 |
| 영구 정지 전화번호 재가입 차단 | `banned_phones.phone_hash` 검사 |
| 관리자 기능 분리 | `/api/admin/*` + admin role 검사 |

## 2. 인증 API

현재 교체 대상:

- `src/hooks/useAuth.ts`
- `src/components/auth/AuthLoginForm.tsx`
- `src/components/auth/AuthSignupFlow.tsx`
- `src/components/auth/PhoneVerifyStep.tsx`
- `src/hooks/useAdminAuth.ts`

| Method | Endpoint | 설명 | Auth |
| --- | --- | --- | --- |
| `POST` | `/api/auth/signup/start` | 이메일, 닉네임, 비밀번호 사전 검증 | Public |
| `POST` | `/api/auth/phone/send` | 휴대폰 인증번호 발송 | Public |
| `POST` | `/api/auth/phone/verify` | 휴대폰 인증번호 확인 | Public |
| `POST` | `/api/auth/signup/complete` | 회원가입 완료 | Public |
| `POST` | `/api/auth/login` | 이메일/비밀번호 로그인 | Public |
| `POST` | `/api/auth/logout` | 로그아웃 | User |
| `POST` | `/api/auth/refresh` | access token 재발급 | Refresh |
| `GET` | `/api/me` | 현재 로그인 사용자 정보 | User |
| `POST` | `/api/admin/auth/login` | 관리자 로그인 | Public |
| `POST` | `/api/admin/auth/logout` | 관리자 로그아웃 | Admin |
| `GET` | `/api/admin/me` | 관리자 세션 확인 | Admin |

보안 기준:

- 비밀번호는 Argon2id 또는 bcrypt로 해시합니다.
- SMS 인증번호는 원문 저장 금지입니다.
- SMS, 로그인, 회원가입은 IP/전화번호 기준 rate limit이 필요합니다.
- 가입 전 `banned_phones.phone_hash`를 검사합니다.
- 현재 `admin/admin1234` 하드코딩은 제거 대상입니다.

## 3. 공개 조회 API

현재 교체 대상:

- `src/pages/Index.tsx`
- `src/pages/Topic.tsx`
- `src/pages/Archive.tsx`
- `src/pages/Ranking.tsx`
- `src/data/mockData.ts`

| Method | Endpoint | 설명 |
| --- | --- | --- |
| `GET` | `/api/categories` | 카테고리 목록 |
| `GET` | `/api/home` | 홈 화면용 인기 토픽, 카테고리별 토픽, 주간 랭킹 |
| `GET` | `/api/topics/today` | 오늘 노출할 토픽 |
| `GET` | `/api/topics` | 토픽 목록. `category`, `status`, `date` query 지원 |
| `GET` | `/api/topics/:topicId` | 토픽 상세 |
| `GET` | `/api/topics/:topicId/pinches` | 토픽별 PINCH 목록 |
| `GET` | `/api/archive` | 지난 토픽과 우승 PINCH 목록 |
| `GET` | `/api/archive/:archiveId` | 공유 링크용 아카이브 상세 |
| `GET` | `/api/rankings` | 주간/월간 사용자 랭킹 |

## 4. PINCH API

| Method | Endpoint | 설명 | Auth |
| --- | --- | --- | --- |
| `POST` | `/api/topics/:topicId/pinches` | 오늘의 PINCH 작성 | User |
| `POST` | `/api/pinches/:pinchId/like` | 좋아요 | User |
| `DELETE` | `/api/pinches/:pinchId/like` | 좋아요 취소 | User |
| `POST` | `/api/pinches/:pinchId/report` | PINCH 신고 | User |

필수 검증:

- `text`는 trim 후 1자 이상이어야 합니다.
- 프론트와 백엔드의 최대 글자 수를 동일하게 맞춥니다.
- 같은 KST 날짜에 이미 active PINCH가 있으면 `409 ALREADY_SUBMITTED`를 반환합니다.
- 마감된 토픽이면 `409 TOPIC_CLOSED`를 반환합니다.
- 정지 유저면 `403 USER_BANNED`를 반환합니다.
- 자기 PINCH 좋아요는 거부합니다.

## 5. 마이페이지/설정 API

현재 교체 대상:

- `src/pages/MyPage.tsx`
- `src/pages/Settings.tsx`
- `src/data/myPageData.ts`

| Method | Endpoint | 설명 | Auth |
| --- | --- | --- | --- |
| `GET` | `/api/me/profile` | 내 프로필 | User |
| `PATCH` | `/api/me/profile` | 닉네임, bio, 마케팅 동의 수정 | User |
| `GET` | `/api/me/stats` | 내 활동 통계 | User |
| `GET` | `/api/me/pinches` | 내가 작성한 PINCH 목록 | User |
| `GET` | `/api/me/activity` | 최근 활동 히트맵 | User |
| `GET` | `/api/me/notifications` | 내 알림 목록 | User |
| `PATCH` | `/api/me/notifications/:id/read` | 알림 읽음 처리 | User |
| `DELETE` | `/api/me` | 계정 탈퇴 | User |

## 6. 관리자 API

현재 교체 대상:

- `src/pages/Admin.tsx`
- `src/data/adminData.ts`
- `src/lib/googleNews.ts`

| Method | Endpoint | 설명 | Auth |
| --- | --- | --- | --- |
| `GET` | `/api/admin/dashboard` | DAU, 오늘 PINCH, 정지, 신고 대기 수 | Admin |
| `GET` | `/api/admin/users` | 유저 검색/목록 | Admin |
| `GET` | `/api/admin/users/:userId` | 유저 상세 | Admin |
| `POST` | `/api/admin/users/:userId/ban` | 유저 정지 | Admin |
| `DELETE` | `/api/admin/users/:userId/ban` | 정지 해제 | Admin |
| `GET` | `/api/admin/banned-phones` | 영구 차단 전화번호 목록 | Admin |
| `GET` | `/api/admin/banned-phones/check` | 전화번호 차단 여부 검사 | Admin |
| `GET` | `/api/admin/topics` | 관리자 토픽 목록 | Admin |
| `POST` | `/api/admin/topics` | 토픽 생성 | Admin |
| `PATCH` | `/api/admin/topics/:topicId` | 토픽 수정 | Admin |
| `DELETE` | `/api/admin/topics/:topicId` | 토픽 삭제 | Admin |
| `GET` | `/api/admin/topics/:topicId/impact` | 교체 전 영향 미리보기 | Admin |
| `GET` | `/api/admin/topics/:topicId/revisions` | 토픽 변경 이력 | Admin |
| `PUT` | `/api/admin/topics/active/global` | 전역 오늘의 토픽 지정/해제 | Admin |
| `PUT` | `/api/admin/topics/active/categories/:categoryId` | 카테고리별 오늘의 토픽 지정/해제 | Admin |
| `GET` | `/api/admin/reports` | 신고 목록 | Admin |
| `POST` | `/api/admin/reports/:reportId/resolve` | 신고 처리 | Admin |
| `GET` | `/api/admin/news/top` | Google News RSS 기반 토픽 후보 | Admin |

토픽 replace 처리:

1. `topics` 업데이트
2. 해당 topic의 active `pinches`를 `archived_invalid`로 전환
3. 영향 받은 PINCH 수와 좋아요 합계를 `topic_revisions`에 저장
4. 작성자별 `notifications` 생성
5. 랭킹/아카이브 집계에서 invalid PINCH 제외

## 7. 에러 코드

```json
{
  "error": {
    "code": "ALREADY_SUBMITTED",
    "message": "오늘은 이미 PINCH를 남겼습니다."
  }
}
```

| HTTP | Code | 상황 |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | 입력값 오류 |
| 401 | `UNAUTHENTICATED` | 로그인 필요 |
| 403 | `FORBIDDEN` | 권한 없음 |
| 403 | `USER_BANNED` | 정지 유저 |
| 404 | `NOT_FOUND` | 리소스 없음 |
| 409 | `ALREADY_SUBMITTED` | 오늘 이미 PINCH 작성 |
| 409 | `TOPIC_CLOSED` | 토픽 마감 |
| 409 | `ALREADY_LIKED` | 이미 좋아요 |
| 429 | `RATE_LIMITED` | SMS/로그인/신고 제한 |

## 8. 구현 우선순위

1. 일반 auth: signup/login/logout/me
2. 카테고리/오늘 토픽 조회
3. PINCH 작성/목록/좋아요
4. 아카이브 목록
5. 주간/월간 랭킹
6. 마이페이지 기본 통계
7. 관리자 로그인/권한
8. 유저 검색/정지/전화번호 차단
9. 관리자 토픽 생성/수정/오늘 적용
10. 신고 처리
11. Google News RSS 프록시 + 캐시

## 9. 프론트 교체 계획

| 현재 파일 | 교체 방향 |
| --- | --- |
| `src/data/mockData.ts` | `/api/home`, `/api/topics`, `/api/rankings`, `/api/archive` 호출 |
| `src/data/adminData.ts` | `/api/admin/*` 호출 |
| `src/data/myPageData.ts` | `/api/me/profile`, `/api/me/stats`, `/api/me/pinches` 호출 |
| `src/hooks/useAuth.ts` | 토큰 기반 auth client |
| `src/hooks/useAdminAuth.ts` | 관리자 세션 API |
| `src/lib/googleNews.ts` | `/api/admin/news/top` 프록시 |

추천 프론트 클라이언트 형태:

```ts
export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  // base URL, Authorization header, JSON parsing, error code handling
}
```

## 10. 아직 결정할 정책

1. 토픽 replace 후 같은 날 재작성 허용 여부
2. PINCH 최대 글자 수
3. 계정 탈퇴 시 기존 PINCH 익명화/삭제 정책
4. OAuth 우선순위: 카카오, 구글, 애플 중 무엇부터 붙일지
5. MySQL 배포 위치: RDS, PlanetScale, Railway, Vercel Marketplace 등

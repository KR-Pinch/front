# 모달 위치 회귀 — 모바일/태블릿 수동 체크리스트

> 대상 모달: `WelcomeModal`(회원가입 완료), `ForgotPasswordModal`(비밀번호 재설정 4단계).
> 두 모달 모두 `createPortal`로 `document.body`에 직접 렌더링되며, 중앙 정렬은 `fixed inset-0 flex items-center justify-center` wrapper로 보장됩니다.
> 자동 회귀는 `src/components/auth/WelcomeModal.test.tsx`에 있고, 이 문서는 **렌더 결과를 눈으로 확인**해야 하는 항목만 다룹니다.

## 0. 사전 준비

- 프리뷰 상단의 디바이스 토글(폰/태블릿/PC 아이콘)로 viewport를 전환합니다.
- 다크 / 라이트 모드 둘 다 한 번씩 확인합니다 (`Settings` 또는 헤더 토글).
- 모달을 띄우는 경로
  - `WelcomeModal` → `/auth` → "회원가입" 탭 → 정보 입력 → 휴대폰 인증 완료
  - `ForgotPasswordModal` → `/auth` → "로그인" 탭 → "비밀번호를 잊으셨나요?" 클릭

## 1. 테스트할 viewport

| 티어 | 대표 해상도 | 비고 |
|---|---|---|
| Mobile (소형) | 320 × 568 | iPhone SE 1세대 — 가장 좁음 |
| Mobile (표준) | 375 × 812 | iPhone 13 mini |
| Mobile (대형) | 414 × 896 | iPhone 11 Pro Max |
| Tablet (세로) | 768 × 1024 | iPad |
| Tablet (가로) | 1024 × 768 | iPad 가로 — 사이드바 등장 경계 |
| Tablet (대형) | 820 × 1180 / 834 × 1194 | iPad Air / Pro 11" |

> `xl` 브레이크포인트(≥1280px)는 우측 레일까지 추가됩니다 — 별도 PC 체크리스트에서 다룹니다.

## 2. 공통 체크 항목 (각 viewport마다)

### 2.1 위치
- [ ] 모달 카드가 viewport **정확히 중앙**(가로/세로 모두)에 위치한다.
- [ ] 스크롤을 내려도 모달은 viewport 기준으로 그대로 중앙에 고정된다 (`fixed` 동작).
- [ ] 주소창이 보이는 상태와 숨은 상태에서 모두 잘리지 않는다 (모바일 Safari에서 특히).

### 2.2 사이즈 / 여백
- [ ] 모달 카드의 좌우에 최소 16px(p-4) 이상 여백이 있다 — 화면에 꽉 차지 않는다.
- [ ] 모달 카드 너비가 `max-w-sm`(384px)을 넘지 않는다.
- [ ] 320px 너비에서도 텍스트가 가로 스크롤 없이 줄바꿈된다.
- [ ] 카드 내부 콘텐츠(헤딩, 입력, 버튼)가 카드 밖으로 새지 않는다.

### 2.3 레이어링 (z-index)
- [ ] 오버레이가 `BottomNav`(z-50), `.page-sticky-header`(z-40), `.shell-top-bar`(z-30) **위**를 모두 덮는다.
- [ ] 모달이 떠 있는 동안 BottomNav가 모달 위로 비치지 않는다.
- [ ] 사이드바(태블릿 가로/PC) 위에도 모달이 정상적으로 덮인다.

### 2.4 인터랙션
- [ ] 오버레이 클릭으로 모달이 닫힌다.
- [ ] `Esc` 키로 모달이 닫힌다 (`ForgotPasswordModal` 한정 — 키보드가 있는 태블릿에서).
- [ ] 모달 안의 버튼/입력은 정상 클릭된다 (오버레이의 `pointer-events`가 차단하지 않음).
- [ ] 모달 밖(오버레이 영역)은 클릭이 카드로 전파되지 않는다.

### 2.5 애니메이션
- [ ] 등장 시 fade + scale + y 애니메이션이 부드럽고, **최종 위치가 정중앙**으로 안착한다 (translate 잔재로 어긋나지 않음).
- [ ] 퇴장 애니메이션 후 portal 노드가 DOM에서 제거된다.

## 3. 모달별 추가 항목

### 3.1 `WelcomeModal`
- [ ] 카운트다운(`(N초)`)이 버튼 라벨 안에서 줄바꿈을 일으키지 않는다.
- [ ] 데코레이션 그라데이션(우상단/좌하단 blur)이 카드 밖으로 새지 않는다 (`overflow-hidden`).
- [ ] 자동 리다이렉트(3.5초) 동안 모달 위치가 흔들리지 않는다.

### 3.2 `ForgotPasswordModal` (4단계 모두)
각 단계를 거치면서 위치가 유지되는지 확인:

- [ ] **request**: 이메일 입력 단계 — 입력 포커스 시 모바일 키보드가 올라와도 모달이 viewport 안에 남는다.
- [ ] **sent**: "메일을 확인하세요" 단계 — 큰 이메일 주소가 줄바꿈되어도 카드 밖으로 새지 않는다.
- [ ] **reset**: 새 비밀번호 입력 단계 — 두 입력 필드 + 우측 eye 아이콘이 카드 안에 들어온다.
- [ ] **done**: 완료 단계 — 체크 아이콘이 중앙 정렬되어 있다.
- [ ] 단계 전환 애니메이션 중에도 카드 자체의 중앙 정렬이 유지된다 (자식 슬라이드 X만 변함).
- [ ] 뒤로(`←`) / 닫기(`×`) 버튼이 헤더 안에서 카드 모서리를 침범하지 않는다.

## 4. 회귀가 의심될 때 빠른 진단

| 증상 | 원인 가능성 | 확인 |
|---|---|---|
| 모달이 좌상단에 붙음 | `createPortal` 누락 → transformed 부모 안에서 `fixed`가 viewport 기준이 아님 | 소스에서 `createPortal(..., document.body)` 확인. 자동 테스트(`WelcomeModal.test.tsx > portal regression`)도 같은 보장. |
| 살짝 어긋남 (수 px) | framer-motion `transform` + Tailwind `-translate-*` 동시 사용 | wrapper에 `top-1/2 left-1/2 -translate-*` 패턴이 다시 들어왔는지 확인 (자동 테스트가 이미 가드). |
| 모바일에서만 위가 잘림 | 카드 자체에 `top-N` 적용됨 / 뷰포트 단위(`vh`) 사용 | wrapper는 `inset-0`만 사용해야 함. |
| BottomNav가 모달 위로 보임 | BottomNav z-index 변경 / 오버레이 z-index 누락 | 오버레이/wrapper 모두 `z-50` 유지, BottomNav도 `z-50`이지만 portal이 body 끝에 붙어 stacking context 우선. |
| 키보드 올라오면 가려짐 | 카드가 너무 길어 viewport 높이를 초과 | 카드 내부에 `max-h` + 내부 스크롤 추가 검토 (현재 두 모달은 짧아서 불필요). |

## 5. 통과 기준

위 모든 viewport × 두 모달 × 라이트/다크 조합에서:
- 위치 / 사이즈 / 레이어링 / 인터랙션 항목이 모두 체크되어야 합니다.
- 하나라도 실패하면 자동 회귀 테스트(`WelcomeModal.test.tsx`)에 케이스를 추가한 뒤 수정합니다.

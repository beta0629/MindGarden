# 어드민 SMS·카카오 알림톡 테스트 발송 도구 — 기획서 (D8 / 2026-05-22)

> 역할: `core-planner` · 코드 직수정 / 직접 위임 없음 (분배 골격만)
> 산출물: 본 기획서 1장 (200~280 라인 목표)
> 후속: §5 분배실행 표 기반으로 별도 오케스트레이션 시 `core-designer` → `core-coder`(BE/FE) → `core-tester` → `core-deployer` 순 위임 검토.

---

## §0 결정 요약 (TL;DR)

- **범위**: 어드민 페이지 1장 + 백엔드 컨트롤러 1·DTO 2·Flyway 1(감사로그 테이블, C6 결정 시) + 프론트 페이지 1·라우트 1·메뉴 1 (서비스는 기존 `KakaoAlimTalkServiceImpl`·`SolapiSmsProvider`·`SmsAuthService` 그대로 활용 → **신규 서비스 0**).
- **시나리오**: 발송 채널 2종(SMS / 카카오 알림톡) × 수신자 모드 3종(SELF / DB 사용자 / 임의 번호) = **최대 6 조합**(C3 결정에 따라 축소).
- **보안 가드 4중**: 권한(`HQ_ADMIN` 계열) · 수신자 동의(또는 명시 체크) · rate-limit · 감사로그.
- **목적**: 어제(2026-05-21, `c5b181d28`) 솔라피 통합 운영 반영 + 오늘 핫픽스 4건 정착 직후, **운영 발송 검증·재현·예방을 위한 어드민 도구**. 솔라피 PFID·템플릿 검수·발신번호 정합·변수 매칭을 어드민이 즉시 검증한다.
- **사용자 컨펌 필요 7건**(§4: C1~C7). 컨펌 완료 시 §5 분배실행으로 진행.

---

## §1 사용자 요청 정리 + 가치

- **요청 원문**: "DB 기반 테스트용 SMS, 카카오톡 기능 구현해줘 어드민에"
- **배경**:
  - 2026-05-21 솔라피 SMS·카카오 알림톡 통합 운영 반영 (`c5b181d28`).
  - 2026-05-22 미수신 디버그·핫픽스 4건 적용 (참조: `docs/project-management/2026-05-22/SOLAPI_NOTIFICATION_MISS_DEBUG.md`).
  - 핫픽스 정착 직후 → 운영 사고 재현·예방 도구 부재.
- **가치 (Why)**:
  1. **검증 가속**: 솔라피 PFID·템플릿·발신번호 등록 정합을 어드민이 즉시 확인.
  2. **검수 정합**: 카카오 검수 승인 템플릿의 변수 매칭(`#{사용자명}` 등)을 즉시 검증.
  3. **다중 단말 검증**: 본인 번호 외 동료/지인·다양한 통신사 단말 검증.
  4. **운영 사고 대응**: 미수신 의심 시 어드민이 단발 재현 → 솔라피 콘솔 cross-check.

---

## §2 기능 인벤토리

### §2.1 핵심 UI 요소

- **수신자 선택 모드** (라디오 그룹):
  - (a) **DB 사용자 선택** — 검색 가능 드롭다운(`BadgeSelect` 활용, 이름·이메일·역할 검색, `tenant_id` 필터).
  - (b) **임의 번호 직접 입력** — `010-XXXX-XXXX` 정규식 검증.
  - (c) **본인(SELF)** — 1-click, 현재 로그인 사용자 `User.phone` 자동 채움.
- **채널 선택** (라디오 또는 탭):
  - **SMS** — 자유 텍스트 메시지(한글 70자 / 영문 160자, 카운터 표시).
  - **카카오 알림톡** — 검수 승인 템플릿 선택 + 변수 입력 폼.
- **알림톡 템플릿 선택** (C4에 따라):
  - (1) 코드 enum 정의 목록 — 빠르고 안전.
  - (2) 솔라피 API 실시간 조회(`/kakao/v1/templates`) — 항상 최신.
  - (3) 양쪽 병행 — 표준 사용 enum + "솔라피 전체 보기" 토글.
- **변수 입력 폼**:
  - 선택한 템플릿의 변수 스키마(`name`, `required`, `sampleValue`)에 따라 동적 폼 렌더.
  - 미입력 시 클라이언트 검증 + 서버 재검증.
- **발송 사유** (필수 입력): 감사로그 기록용 자유 텍스트 (예: "사용자 #123 매핑 확정 알림 검증").
- **발송 결과**: 솔라피 응답 (성공/실패 + `groupId` + `messageId` + 실패 사유 + 솔라피 콘솔 링크).

### §2.2 발송 가드 (보안·비용 보호)

- **권한 가드**: `@PreAuthorize` + `PermissionCheckUtils` + 공통코드 `MENU_PERMISSION` (C2 결정에 따른 역할 화이트리스트).
- **rate-limit**: 사용자 단위 분당/일당 카운터 (C5 결정).
- **수신자 동의 체크** (정책 따라 선택):
  - DB 사용자 모드: `notification_consent` 컬럼 확인(없으면 Flyway 추가 검토).
  - 임의 번호 모드: "수신자 동의 확인" 체크박스 의무 + 사유 입력.
- **감사로그**: 발송 요청자·시각·수신자(마스킹)·채널·템플릿·사유·결과 (C6 결정).
- **prod 환경 추가 가드** (C7 결정): 2-step 확인 모달 또는 OTP.
- **로그 마스킹**: `PhoneLogMasking.maskForLog(phoneNumber)` 일관 적용.

### §2.3 결과 표시

- **성공**: 솔라피 `groupId`·`messageId`·발송 시각·"솔라피 콘솔에서 보기" 링크(새 탭).
- **실패**: 솔라피 에러 코드 + 메시지 + 재시도 버튼 + 디버그 가이드 링크.
- **수신 확인**: 수동 확인 (단말 수신 후 운영자가 "수신 확인" 체크).
- **이력 패널**: 최근 30건(현재 사용자, tenant 격리) — 채널·결과·시각·수신자(마스킹).

---

## §3 API 명세 (초안)

> 멀티테넌트: 모든 엔드포인트는 `TenantContextHolder.getRequiredTenantId()` 필수 적용.
> 인증: 세션 기반 + `@PreAuthorize` 역할 화이트리스트 (C2 결정).

### §3.1 수신자 목록 조회
- `GET /api/v1/admin/test-notifications/recipients?search={query}&role={ROLE}&hasPhone=true`
- 응답: `[{ userId, name, email, role, phoneMasked, hasConsent, lastSentAt }]`
- 권한: HQ_ADMIN / SUPER_ADMIN / ADMIN (C2 결정).

### §3.2 알림톡 템플릿 목록 조회
- (1) `GET /api/v1/admin/test-notifications/alimtalk-templates` — 코드 enum.
- (2) `GET /api/v1/admin/test-notifications/alimtalk-templates/live` — 솔라피 실시간(검수 승인 한정).
- 응답: `[{ templateCode, contentKey, title, status, variables: [{ name, required, sampleValue }] }]`.

### §3.3 SMS 테스트 발송
- `POST /api/v1/admin/test-notifications/sms`
- 요청:
  ```json
  { "recipientMode": "USER|PHONE|SELF", "userId": null, "phone": null, "message": "...", "reason": "..." }
  ```
- 응답: `{ "success": true, "groupId": "...", "messageId": "...", "error": null, "sentAt": "..." }`.

### §3.4 알림톡 테스트 발송
- `POST /api/v1/admin/test-notifications/alimtalk`
- 요청:
  ```json
  { "recipientMode": "USER|PHONE|SELF", "userId": null, "phone": null,
    "templateCode": "...", "templateParams": { "사용자명": "홍길동" },
    "reason": "...", "fallbackToSms": false }
  ```
- 응답: SMS와 동일 + `fallbackUsed: boolean`.

### §3.5 발송 이력 조회 (감사로그)
- `GET /api/v1/admin/test-notifications/history?from={date}&to={date}&channel={SMS|ALIMTALK}&result={SUCCESS|FAIL}`
- 응답: `[{ id, sentBy, sentAt, recipient(masked), channel, templateCode, reason, success, error }]`.

---

## §4 사용자 컨펌 필요 항목 (구현 전)

> **본 7건은 사용자 답변 후 §5 분배실행으로 진행.**

### C1. UI 위치
- (a) 어드민 메뉴 신설 — `/admin/test-notifications` 별도 메뉴(시스템 도구 그룹).
- (b) 기존 시스템 도구 페이지 통합 — `frontend/src/components/admin/system/SystemTools.js` 카드/탭 추가.
- (c) 어드민 대시보드 우상단 빠른 액션 — 사이드 모달.

### C2. 권한
- (a) **HQ_ADMIN + SUPER_ADMIN만** — 최소 권한, 보수적.
- (b) **HQ_ADMIN + SUPER_ADMIN + ADMIN** — 표준 (BRANCH_SUPER_ADMIN 포함 검토).
- (c) CONSULTANT까지 — 본인 번호로만(SELF 강제) — 광범위.

### C3. 수신자 선택 범위
- (a) 본인(SELF)만 — 가장 안전.
- (b) 본인 + DB 사용자(현재 tenant) — 표준.
- (c) 본인 + DB 사용자 + 임의 번호 입력 — 가장 유연하지만 PII 위험.

### C4. 알림톡 템플릿 목록 출처
- (a) 코드 enum 정의 — 빠르고 안전, 신규 등록 시 코드 변경 필요.
- (b) 솔라피 API 실시간 조회 — 항상 최신, 솔라피 의존.
- (c) 양쪽 병행 — 표준 enum + "솔라피 전체 보기" 토글.

### C5. rate-limit 정책
- (a) 분당 10 / 일당 100 / 사용자당.
- (b) 분당 5 / 일당 50 / 사용자당 (보수).
- (c) 분당 20 / 일당 200 (개발용 관대).
- + dev/prod 분기 적용 여부.

### C6. 감사로그 저장 방식
- (a) 신규 테이블 `admin_test_notification_logs` 생성 + 90일 보관.
- (b) 기존 `application_logs` / `audit_logs` 테이블 INSERT (있으면).
- (c) 파일 로그만(`logger.info` 마스킹) — 가장 가벼움.

### C7. 운영 환경 추가 가드 (선택)
- (a) 사용함 (운영자 본인 OTP 또는 2-step 확인 모달).
- (b) 사용 안 함 (개발과 동일).
- (c) prod 한정 2-step 확인 모달만 (OTP 없음).

### §4.X 사용자 컨펌 결과 (2026-05-22 14:15 KST)

| 항목 | 선택 | 의미 |
|---|---|---|
| **C1 UI 위치** | (b) `system_tools` | 기존 `frontend/src/components/admin/system/SystemTools.js`에 카드/탭 추가 (신규 라우트 없음) |
| **C2 권한** | (정정 2026-05-22 14:25) `admin_staff` | **ADMIN + STAFF만** — 현행 4역할 체계(`frontend/src/constants/roles.js`) 기준. HQ_ADMIN·SUPER_ADMIN은 deprecated 레거시이므로 사용 금지. CONSULTANT·CLIENT 제외. |
| **C3 수신자 범위** | (b) `self_plus_db` | SELF + DB 사용자(현재 tenant 격리) — **임의 번호 입력 모드 제외** |
| **C4 알림톡 템플릿 출처** | (c) `both_hybrid` | 코드 enum 우선 표시 + "솔라피 전체 보기" 토글로 실시간 조회 |
| **C5 rate-limit** | (a) `10_100` | **분당 10 / 일당 100 / 사용자당** (dev/prod 동일, 향후 분기 검토는 D9 이월) |
| **C6 감사로그 저장** | (a) `new_table` | **신규 테이블 `admin_test_notification_logs` + 90일 보관** (Flyway 1건 필요) |
| **C7 운영 추가 가드** | (c) `2step_only` | **prod 한정 2-step 확인 모달**만 (OTP 없음, dev는 가드 없음) |

**구현 파급 요약**:
- 프론트: 신규 페이지/라우트 없음 → 기존 `SystemTools.js`에 **카드 또는 탭 1개 추가** + 발송 폼 컴포넌트.
- 백엔드: `AdminTestNotificationController` 5 엔드포인트 + DTO 2종 + Flyway 1건(`admin_test_notification_logs`) + `RateLimiter`(10/min, 100/day).
- 권한: `@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")` 일관 적용 + `PermissionCheckUtils` 이중 검증. (현행 4역할 체계: `frontend/src/constants/roles.js` SSOT, HQ_*·SUPER_* deprecated.)
- 수신자: `recipientMode ∈ {SELF, USER}` (PHONE 모드 백엔드/프론트 모두 미구현).
- 템플릿: enum + `/alimtalk-templates/live` 양쪽 엔드포인트 제공, 프론트 토글 UI.
- 감사로그: 신규 테이블 (컬럼: `id, tenant_id, sent_by, sent_at, recipient_user_id, recipient_phone_masked, channel, template_code, reason, success, error_code, error_message, solapi_group_id, solapi_message_id`).
- prod 가드: 프론트 `process.env.REACT_APP_ENV === 'production'` 시 UnifiedModal 2-step 확인 (확인 1단계 → "정말 발송" 2단계).

---

## §5 분배실행 표 (위임 골격)

> **본 표는 골격만**. 사용자 컨펌(§4) 후 `core-planner`가 별도 호출로 위임 트리거.

| Phase | 책무 | 담당 | 위임 프롬프트 골격 (요약) | 모델 권장 |
|---|---|---|---|---|
| P1 | UI/UX 와이어프레임 + D8 토큰 정합 디자인 핸드오프 (§2.1) | `core-designer` | (a) 페이지 레이아웃, (b) 4 컴포넌트(수신자 선택/채널 선택/템플릿 폼/결과 모달), (c) D8 디자인 토큰 활용, (d) UnifiedModal 적용. **완료 조건**: 디자인 핸드오프 문서 1장. | `gemini-3.1-pro` |
| P2-a | 백엔드 컨트롤러·DTO·권한·rate-limit·감사로그 | `core-coder` | (1) `AdminTestNotificationController` 5 엔드포인트. (2) DTO 2종(`TestSmsRequest`, `TestAlimtalkRequest`). (3) `PermissionCheckUtils` 가드. (4) `RateLimiter` 적용. (5) `admin_test_notification_logs` Flyway(C6). **완료 조건**: 백엔드 빌드 + 단위 테스트 PASS, `tenant_id` 격리 검증. | 기본 |
| P2-b | 프론트 페이지·라우트·메뉴 | `core-coder` | (1) `AdminTestNotificationsPage.js`(또는 `SystemTools` 통합 — C1 결정). (2) 라우트 추가. (3) 어드민 메뉴 추가. (4) `StandardizedApi` 호출. (5) `UnifiedModal` 결과 표시. **완료 조건**: 프론트 빌드 + lint + i18n 정합. | 기본 |
| P3 | E2E 검증 (개발 환경 발송 + 솔라피 콘솔 cross-check) | `core-tester` | (1) HQ_ADMIN으로 SELF 발송 1건(SMS·알림톡 각 1). (2) DB 사용자 선택 1건. (3) 임의 번호 1건(C3에 따라). (4) rate-limit 초과 1건(실패 확인). (5) 감사로그 INSERT 확인. (6) 솔라피 콘솔 발송 내역·실제 단말 수신 사진 캡처. **완료 조건**: HIGH 0건. | `gemini-3.1-pro` |
| P4 | 운영 push (develop → main FF, prod 환경 분기 가드 활성화 — C7) | `core-deployer` | 단일 PR 분리 push. Flyway 마이그레이션 검증. prod 가드(C7) 활성화 확인. | 기본 |

---

## §6 시각 회귀·UX 위험·검수 우선 영역

- 어드민 페이지 D8 토큰 정합 (`unified-design-tokens.css` SSOT, 색상·간격·타이포).
- 발송 결과 모달 UnifiedModal 표준 일치 (제목·본문·푸터 슬롯).
- 임의 번호 입력 폼 정규식 검증 + 마스킹 표시 일관성.
- 권한 가드 — HQ_ADMIN 외 접근 시 403 응답 + 프론트 진입 차단.
- 발송 이력 패널 페이지네이션·tenant 격리 누수 점검.

---

## §7 위험·완화

| 위험 | 영향도 | 완화 |
|---|---|---|
| 운영자 실수로 대량 발송 | High | rate-limit + 발송 사유 필수 + prod 2-step 모달(C7) |
| PII 유출 (DB 사용자 phone 노출) | High | 응답·로그 마스킹 + 권한 가드 + tenant 격리 |
| 솔라피 비용 폭주 | Med | rate-limit + 일일 발송 통계 대시보드(향후) |
| 알림톡 템플릿 미승인 발송 | Low | 솔라피 콘솔 검수 상태 표시 + 미승인 disabled |
| 멀티테넌트 격리 누락 | High | `tenant_id` 필터 + 단위·통합 테스트 케이스 |
| 감사로그 누락 | Med | 발송 직전 INSERT, 결과 UPDATE 패턴 + 트랜잭션 경계 |

---

## §8 향후 확장 (D9 이월 가능)

- 알림톡 발송 실패 자동 재시도 큐.
- 다국어 템플릿 자동 매핑 (`i18n` 정합).
- 본인 인증 OTP 게이트 (운영 강력 모드).
- 일괄 발송 도구 (`recipientMode=BULK_TENANT|BULK_ROLE` — 별도 안전 가드 필수).
- 솔라피 webhook 연동 → 자동 수신 확인.

---

## §9 변경 이력

- **2026-05-22 core-planner**: 어드민 SMS·카카오 알림톡 테스트 발송 기능 신규 기획.
  - 사용자 요청 직후 §0~§9 작성. §4 컨펌 7건 식별. §5 분배 골격 정의(직접 위임 없음).
  - 참조: `docs/project-management/2026-05-22/SOLAPI_NOTIFICATION_MISS_DEBUG.md`(어제 디버그 사례),
    `c5b181d28`(어제 운영 반영 커밋).
- **2026-05-22 14:15 KST main-assistant**: §4 컨펌 7건 응답 기록(§4.X).
  - C1=system_tools / C2=hq_super / C3=self_plus_db / C4=both_hybrid / C5=10_100 / C6=new_table / C7=2step_only.
  - 다음 단계: P1 `core-designer`(`gemini-3.1-pro`) 위임 트리거 — `SystemTools.js` 통합 + HQ/SUPER만 + SELF/DB + 양쪽 병행 템플릿 + 분당 10/일당 100 + 신규 감사로그 테이블 + prod 2-step 모달 반영.
- **2026-05-22 14:25 KST main-assistant**: §4.X C2 권한 정정.
  - 사용자 지적: "2번은 예전 권한이고 현재는 admin/staff 만 있으면 돼" → C2를 `hq_super` → `admin_staff`로 변경.
  - 근거: `frontend/src/constants/roles.js`에서 `LEGACY_USER_ROLES`(HQ_ADMIN·SUPER_ADMIN 등)는 `@deprecated`, 표준은 `USER_ROLES` = ADMIN/STAFF/CONSULTANT/CLIENT 4역할.
  - 영향: BE `@PreAuthorize("hasAnyRole('ADMIN','STAFF')")`, FE `SystemTools.js` 카드 가드 `['ADMIN','STAFF']`. P2-a/P2-b 진행 중 서브에이전트 interrupt + 권한 정정 지시.

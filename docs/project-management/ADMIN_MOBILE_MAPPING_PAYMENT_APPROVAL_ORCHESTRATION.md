# Admin Mobile Sprint 1c — 매칭 결제·입금 승인 웹 브릿지 오케스트레이션

**작성일**: 2026-05-16 (초안) · **갱신**: 2026-05-18  
**작성자**: core-planner (문서 SSOT)  
**상태**: **Sprint 1c** 웹 브릿지 완료 · **Sprint 1d** Expo 네이티브 3단계(`confirm-payment` / `confirm-deposit` / `approve`)·UnifiedModal·일정 CTA SSOT 반영  
**선행**: Sprint 1b 신규 매칭·통합 허브 — [`ADMIN_MOBILE_SCHEDULE_REGISTER_ORCHESTRATION.md`](./ADMIN_MOBILE_SCHEDULE_REGISTER_ORCHESTRATION.md) §5B  
**ERP·API SSOT**: [`.cursor/skills/core-solution-erp/SKILL.md`](../../.cursor/skills/core-solution-erp/SKILL.md), [`DEPOSIT_ERP_REFUND_FLOW_ANALYSIS.md`](../debug/DEPOSIT_ERP_REFUND_FLOW_ANALYSIS.md)

---

## 목차

1. [목표·배경](#1-목표배경)
2. [즉시 운영 가이드](#2-즉시-운영-가이드)
3. [상태·API 표](#3-상태api-표)
4. [모바일 UX 옵션·Phase P0/P1/P2](#4-모바일-ux-옵션ap-b-하이브리드-권장--phase-p0p1p2)
5. [Sprint 1c 완료 기준](#5-sprint-1c-완료-기준)
6. [영향 파일 표](#6-영향-파일-표)
7. [분배실행 표](#7-분배실행-표)
8. [변경 이력](#8-변경-이력)

---

## 1. 목표·배경

| 항목 | 내용 |
|------|------|
| **문제** | Expo에서 **신규 매칭 5스텝** 완료 후 매칭 상태가 **`PENDING_PAYMENT`(결제 대기)** 로 남는다. 모바일에는 웹 `MappingPaymentModal`에 대응하는 **`confirm-payment` / `confirm-deposit` 네이티브 UI가 없다**. |
| **Sprint 1b 비목표** | 네이티브 결제·입금 확인 모달 전체 복제 — 본 Sprint 1c에서 **웹 브릿지**로 격차를 메운다. |
| **Sprint 1c 목표** | 현장 ADMIN/STAFF가 **앱을 떠나지 않고**(딥링크·인앱 브라우저) **웹 어드민 통합 스케줄·매칭 관리**에서 결제·입금 승인을 완료할 수 있게 **CTA·경로·카피·정책**을 SSOT로 고정한다. |
| **성공 지표** | `PENDING_PAYMENT` 매칭에 대해 모바일에서 **「웹에서 결제 확인」** 1탭 → 웹에서 `confirm-payment` 성공 → 목록 새로고침 시 상태가 **`PAYMENT_CONFIRMED` 이상**으로 전이. |

**웹 결제 UI SSOT**

- `frontend/src/components/admin/mapping/MappingPaymentModal.js`  
  - 모달 제목: **「결제 확인」**  
  - 제출 버튼: **「입금 확인」** (UI 라벨)  
  - API: `POST /api/v1/admin/mappings/{id}/confirm-payment`  
  - Body: `paymentMethod`, `paymentReference`, `paymentAmount`  
- 입금 전용(가예약·별도 플로우): `MappingDepositModal.js` → `POST .../confirm-deposit` (`depositReference`)

**Expo 웹 브릿지 패턴 SSOT**

- `expo-app/app/(admin)/(messages)/index.tsx` — `AdminMessagesWebFallback` + `buildAdminWebUrl(ADMIN_MOBILE_MESSAGES_COPY.WEB_ROUTE)` + `Linking.openURL`
- URL 조합: `expo-app/src/config/webBaseUrl.ts` — `getWebBaseUrl()` → `buildAdminWebUrl(relativePath)`

---

## 2. 즉시 운영 가이드

> **코드 배포 전에도** 아래 웹 경로로 결제 승인 가능. 모바일은 Sprint 1c 구현 전까지 **수동으로 웹 어드민**을 연다.

### 2.1 권장 진입 경로

| 상황 | 웹 경로 | 조작 |
|------|---------|------|
| **통합 스케줄에서 매칭 카드 처리** (권장) | `/admin/integrated-schedule` | 좌측 매칭 카드 → **「결제 확인」** → 모달에서 결제 수단·금액 확인 → **「입금 확인」** 버튼 |
| **매칭 관리 테이블에서 일괄 처리** | `/admin/mapping-management` | 행 액션 **「결제 확인」** → 동일 `MappingPaymentModal` |
| **상태 필터** | `?status=PENDING_PAYMENT` (매칭 관리) | 결제 대기 건만 모아 처리 |

**기획 SSOT 웹 상수** (추가 예정: `ADMIN_MOBILE_WEB_ROUTES`)

| 키 | 상대 경로 |
|----|-----------|
| `INTEGRATED_SCHEDULE` | `/admin/integrated-schedule` |
| `MAPPING_MANAGEMENT` | `/admin/mapping-management` |

웹 프론트 기존 정의: `frontend/src/constants/adminRoutes.js` — `ADMIN_ROUTES.INTEGRATED_SCHEDULE`, `ADMIN_ROUTES.MAPPING_MANAGEMENT`.

### 2.2 `confirm-payment` vs `confirm-deposit` (운영·개발 공통)

| 구분 | confirm-payment | confirm-deposit |
|------|-----------------|-----------------|
| **API** | `POST /api/v1/admin/mappings/{id}/confirm-payment` | `POST /api/v1/admin/mappings/{id}/confirm-deposit` |
| **웹 UI** | `MappingPaymentModal` (통합 스케줄·매칭 관리 기본) | `MappingDepositModal` |
| **요청** | `paymentMethod`, `paymentReference`, `paymentAmount` | `depositReference` |
| **ERP** | 4인자(금액 있음) → **INCOME**; 3인자(금액 없음) → **RECEIVABLES** | **INCOME** + `status → DEPOSIT_PENDING` |
| **언제 쓰나** | 신규 매칭 생성 직후 **`PENDING_PAYMENT`** — Sprint 1b 모바일 완료 화면의 **1차 목표** | 가예약·입금 확인 후 **관리자 승인 대기** 등 별도 플로우 |

상세: [`.cursor/skills/core-solution-erp/SKILL.md`](../../.cursor/skills/core-solution-erp/SKILL.md).

### 2.3 모바일 미구현 시 현장 체크리스트

1. Expo **매칭 탭**에서 `결제 대기` 뱃지 확인.  
2. PC 또는 모바일 브라우저로 **웹 어드민** 로그인(동일 테넌트).  
3. **통합 스케줄**에서 해당 매칭 → **결제 확인** → **입금 확인** 완료.  
4. 앱 매칭 목록 **당겨서 새로고침** — 상태·잔여 회기 반영 확인.  
5. 필요 시 **「이 매칭으로 일정 잡기」** — [`INTEGRATED_SCHEDULE_RESERVE_FIRST_PAY_LATER_ORCHESTRATION.md`](./INTEGRATED_SCHEDULE_RESERVE_FIRST_PAY_LATER_ORCHESTRATION.md) 가예약 정책 참고.

---

## 3. 상태·API 표

### 3.1 매칭 상태 (백엔드 `ConsultantClientMapping.MappingStatus`)

| 상태 | 모바일 라벨 (`adminMappingCopy`) | 결제·승인 관점 | 일정 등록 (웹 SSOT) |
|------|----------------------------------|----------------|---------------------|
| `PENDING_PAYMENT` | 결제 대기 | **confirm-payment 대상** | `isPaymentConfirmed === false` — 확정 예약·드래그 **차단** (가예약 별도) |
| `PAYMENT_CONFIRMED` | 결제 확인 | 결제 확인 완료 | 결제 확인 이후 집합 — 일정 정책은 잔여 회기·ACTIVE와 연동 |
| `DEPOSIT_PENDING` | 승인 대기 | confirm-deposit 이후 | 가예약 **불가** (웹 `canTentativeBeforeDepositScheduleForMapping`) |
| `ACTIVE` | 활성 | 운영 중 | `remainingSessions > 0` 시 확정 예약·가예약(ACTIVE만) |
| `INACTIVE` / `SUSPENDED` / `TERMINATED` / `SESSIONS_EXHAUSTED` | (카피 SSOT) | — | 웹·모바일 동일 제한 |

모바일 상태 라벨: `expo-app/src/constants/adminMappingCopy.ts` — `ADMIN_MAPPING_STATUS_LABELS`.

### 3.2 API (Sprint 1c 범위)

| Method·Path | 용도 | 모바일 Sprint 1c |
|-------------|------|------------------|
| `POST /api/v1/admin/mappings` | 신규 매칭 생성 (`status: PENDING_PAYMENT`) | ✅ Sprint 1b (유지) |
| `POST /api/v1/admin/mappings/{id}/confirm-payment` | 결제·입금 확인 (`MappingPaymentModal`) | ❌ 네이티브 — **웹 브릿지** |
| `POST /api/v1/admin/mappings/{id}/confirm-deposit` | 입금 확인·승인 대기 전환 | ❌ 네이티브 — 웹 |
| `POST /api/v1/admin/mappings/{id}/approve` | 매칭 활성 승인 | Sprint 2+ / 웹 |
| `GET /api/v1/admin/mappings` | 목록·상태 표시 | ✅ invalidate after 웹 복귀 |

### 3.3 웹 vs 모바일 결제 확인 호출부

| 레이어 | 파일 | 호출 |
|--------|------|------|
| 웹 | `MappingPaymentModal.js` | `apiPost(.../confirm-payment, { paymentMethod, paymentReference, paymentAmount })` |
| Expo (1c 목표) | `buildAdminWebUrl(INTEGRATED_SCHEDULE)` 등 | **HTTP 호출 없음** — `Linking.openURL` |

---

## 4. 모바일 UX 옵션 A/B + 하이브리드(권장) · Phase P0/P1/P2

### 4.1 옵션 비교

| 옵션 | 내용 | 장점 | 단점 | 채택 |
|------|------|------|------|------|
| **A. 웹 fallback 전용** | `AdminMessagesWebFallback` 패턴 — EmptyState + **「웹에서 결제 확인」** → `buildAdminWebUrl` | 구현 빠름·ERP·모달 웹 SSOT 1:1·1b 비목표 준수 | 앱↔웹 컨텍스트 전환·세션 쿠키 이슈 가능 | **P0~P1 핵심** |
| **B. 네이티브 confirm-payment/deposit** | `MappingPaymentModal` 필드·mutation Expo 이식 | 단일 앱 UX | ERP·금액 검증·중복 거래·공통코드 — **Sprint 1b 비목표 위반** | ❌ |
| **C. 하이브리드 (권장)** | 목록·5스텝 완료는 **네이티브**; **결제 승인만 웹**; 복귀 후 **pull-to-refresh**·optional `useAppForegroundRefetch` | 현장 병목(결제 대기)만 웹으로; 일정 잡기는 앱 유지 | 웹 URL·테넌트 origin 설정 필요 (`EXPO_PUBLIC_WEB_BASE_URL`) | **✅ Sprint 1c 채택** |

### 4.2 C안 — UI 배치 (기획)

| 화면 | CTA | URL 빌더 |
|------|-----|----------|
| `schedule/mapping/create.tsx` **Step 5** | Primary 유지: 「이 매칭으로 일정 잡기」 / Secondary: **「웹에서 결제 확인」** (`createdMappingId` 있을 때, `PENDING_PAYMENT`) | `buildAdminWebUrl(INTEGRATED_SCHEDULE)` — 추후 `?mappingId=` 쿼리는 P2 검토 |
| `schedule/index.tsx` **MappingListCard** | Primary: 「이 매칭으로 일정 잡기」 / Secondary: **「웹에서 결제 확인」** (`PENDING_PAYMENT` \| `DEPOSIT_PENDING` 정책은 §5) | 동일 + 필요 시 `MAPPING_MANAGEMENT?status=PENDING_PAYMENT` |
| (선택) 매칭 탭 빈 상태 | 웹 통합 스케줄 안내 1줄 | `INTEGRATED_SCHEDULE` |

**카피 SSOT (추가 예정)**

- `adminMappingCopy.ts`: `ACTION_OPEN_WEB_PAYMENT`, `WEB_PAYMENT_FALLBACK_TITLE`, `WEB_PAYMENT_FALLBACK_BODY`
- `adminMobileScreensCopy.ts`: `ADMIN_MOBILE_WEB_ROUTES.INTEGRATED_SCHEDULE`, `MAPPING_MANAGEMENT`

### 4.3 Phase P0 / P1 / P2

| Phase | 범위 | 산출 |
|-------|------|------|
| **P0** | **문서·운영** (본 작업) | 본 MD, §2 운영 가이드, 1b 오케스트레이션 링크 |
| **P1** | **디자인** | Step 5·매칭 카드 Secondary CTA, 아이콘(`ExternalLink`), ADMIN/STAFF 동일 |
| **P2** | **구현·테스트** | `core-coder` + `core-tester` — §5 완료 기준 |

---

## 5. Sprint 1c 완료 기준

### 5.1 제품·UX

- [ ] **`PENDING_PAYMENT`** 매칭 카드에 **「웹에서 결제 확인」** Secondary CTA 노출 (`MappingListCard`).  
- [ ] 신규 매칭 **Step 5**에 동일 CTA — 생성 직후 결제 대기 안내.  
- [ ] CTA 탭 시 `buildAdminWebUrl(ADMIN_MOBILE_WEB_ROUTES.INTEGRATED_SCHEDULE)` (또는 기획 확정 경로)로 `Linking.openURL`.  
- [ ] 카피·접근성: 메시지 fallback과 동일 톤 (`OPEN_WEB_CTA` 패턴).  
- [ ] 웹에서 결제 확인 후 앱 **당겨서 새로고침** 시 상태 갱신.

### 5.2 라우트·상수

- [ ] `adminMobileScreensCopy.ts` — `ADMIN_MOBILE_WEB_ROUTES.INTEGRATED_SCHEDULE`, `MAPPING_MANAGEMENT` 추가.  
- [ ] 컴포넌트에 호스트 하드코딩 **금지** — `webBaseUrl.ts` only.

### 5.3 결제 대기 시 **일정 CTA** 정책 (웹 SSOT 정합)

| 매칭 상태 | 「이 매칭으로 일정 잡기」 | 「웹에서 결제 확인」 | 비고 |
|-----------|---------------------------|----------------------|------|
| `PENDING_PAYMENT` | **노출 유지** (Sprint 1b) — 서버가 가예약·검증으로 거절 가능 | **필수 노출** | 웹: 결제 미확인 시 확정 예약 차단; 모바일은 **안내 문구**로 웹 결제 유도 |
| `DEPOSIT_PENDING` | 정책 **P1 디자인**에서 확정 (기본: 일정 CTA 유지·웹 승인 CTA) | **노출** (`confirm-deposit` / approve는 웹) |
| `ACTIVE` + 잔여 회기 | Primary | 숨김 | |
| `PAYMENT_CONFIRMED` | Primary | 숨김 | |

참고: `integratedScheduleSidebarFilterConstants.js` — `isPaymentConfirmed`, `canScheduleForMapping`.

### 5.4 테스트

- [ ] Jest: `buildAdminWebUrl` — base origin + `/admin/integrated-schedule` 조합 단위 테스트 (`webBaseUrl` 또는 전용 `__tests__/buildAdminWebUrl.test.ts`).  
- [ ] Jest: 매칭 카드 CTA 노출 조건 순수 함수(상태 → `showWebPaymentCta`) — 선택.  
- [ ] Maestro(선택): 매칭 탭 → 웹 CTA 탭 → 외부 브라우저 intent (스모크).  
- [ ] `npm run test:utils` 회귀.

### 5.5 비범위 (재확인)

- 네이티브 `MappingPaymentModal` / `confirm-payment` mutation.  
- `amount-info`·ERP 거래 상세 네이티브 UI.

---

## 6. 영향 파일 표

| 구분 | 경로 | Sprint 1c 변경 요지 |
|------|------|---------------------|
| Expo UI | `expo-app/app/(admin)/(operation)/schedule/mapping/create.tsx` | Step 5 — 웹 결제 CTA, `createdMappingId` |
| Expo UI | `expo-app/app/(admin)/(operation)/schedule/index.tsx` | `MappingListCard` Secondary CTA |
| 카피 | `expo-app/src/constants/adminMappingCopy.ts` | 웹 결제 CTA·fallback 문구 |
| 카피·경로 | `expo-app/src/constants/adminMobileScreensCopy.ts` | `INTEGRATED_SCHEDULE`, `MAPPING_MANAGEMENT` |
| URL | `expo-app/src/config/webBaseUrl.ts` | `buildAdminWebUrl` (기존 유지) |
| 패턴 참조 | `expo-app/app/(admin)/(messages)/index.tsx` | `AdminMessagesWebFallback` |
| 웹 SSOT | `frontend/src/components/admin/mapping/MappingPaymentModal.js` | confirm-payment |
| 웹 경로 | `frontend/src/constants/adminRoutes.js` | 경로 상수 |
| 테스트 | `expo-app/src/utils/__tests__/buildAdminWebUrl.test.ts` (신규 권장) | URL 빌더 |
| 기획 연계 | [`ADMIN_MOBILE_SCHEDULE_REGISTER_ORCHESTRATION.md`](./ADMIN_MOBILE_SCHEDULE_REGISTER_ORCHESTRATION.md) | §5B.3 Step 5 링크 |

---

## 7. 분배실행 표

| Phase | subagent | model | 산출물 | 프롬프트 요약 |
|-------|----------|-------|--------|----------------|
| **0** | (기획·문서) | — | **본 문서** | SSOT·운영 가이드·§5 완료 기준 — **코드 수정 없음** |
| **1** | `core-designer` | **gemini-3.1-pro** | Step 5·매칭 카드 Secondary CTA 시안 | §4.2, 메시지 fallback 톤, `ExternalLink` |
| **2** | `core-coder` | default | CTA·상수·`Linking`·invalidate | §6 파일, METRO·표시 경계, 하드코딩 금지 |
| **3** | `core-tester` | default | Jest URL·Maestro 스모크 | §5.4, 1b 회귀 |

**게이트**: Phase 2는 Phase 1 시안 승인 후. Phase 3는 [`CORE_PLANNER_DELEGATION_ORDER.md`](./CORE_PLANNER_DELEGATION_ORDER.md) 테스터 게이트.

---

## 8. 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-05-16 | 초안 — `webBaseUrl`·메시지 웹 fallback 패턴 확립, Sprint 1b 비목표(네이티브 결제) 명시 |
| 2026-05-18 | Sprint 1c SSOT 확정 — 운영 가이드·옵션 C·완료 기준·분배실행표 |

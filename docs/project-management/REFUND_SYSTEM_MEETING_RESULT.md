# 환불 시스템 회의 결과

**작성일**: 2025-03-16  
**담당**: core-planner (서브에이전트 회의 오케스트레이션)  
**목적**: (1) ERP에서 환불이 됐을 때 우리 시스템 처리 방법, (2) 화면의 어떤 결제 단계에서 환불을 하면 좋은지 정리. **본 회의에서는 코드 수정 없음.** 추후 구현 시 체크리스트만 작성.

---

## 1. 회의 요약

### 1.1 참여 및 산출

| 참여 서브에이전트 | 담당 내용 | 산출 요약 |
|------------------|-----------|-----------|
| **core-component-manager** | 결제·환불·매칭 상태 관련 화면·API·엔티티·ERP 연동 조사 | 결제 단계 노출 위치, 환불 버튼/API, 우리→ERP 전송 경로(모의), ERP→우리 수신 경로 없음 |
| **core-debugger** | ERP 환불 완료 반영 경로 추적, 갭 분석, 처리 방법 후보 제안 | `docs/debug/REFUND_SYSTEM_ERP_AND_UI_ANALYSIS.md` (현재 구조·갭·방안 A/B/C) |
| **core-designer** | 결제 단계별 환불 가능 여부, 환불 수행하기 좋은 단계, 부분/전액/사유 UI 배치 | 단계별 표, 시나리오 A·B, 모달 블록·필드 순서 제안 |
| **core-publisher** | 환불 모달/폼 필수 요소 마크업·접근성 | form/fieldset/label, aria-*, required, role="alert", BEM·HTML 조각 제안 |
| **core-planner** | 취합·회의 결과 문서 작성 | 본 문서 + 추후 구현 체크리스트 |

- **core-coder**: 본 회의에서는 **호출하지 않음**. 구현은 아래 체크리스트 기준으로 추후 진행.

### 1.2 회의 주제

1. **ERP에 환불이 됐을 경우 처리 방법**  
   - ERP 쪽에서 환불이 처리되었을 때, 우리 시스템(매칭·결제·스케줄 상태 등)에서 어떻게 반영할지.  
   - 동기/비동기, 웹훅·폴링·수동 반영, 상태값 정의, 재고/정산 반영 등.

2. **화면의 어떤 결제 단계에서 환불을 하면 좋은지**  
   - 결제 단계별 어느 단계에서 환불 버튼/액션을 노출할지, 부분환불/전액환불 구분, 취소·미참석·고객 요청 등 사유별 처리.

---

## 2. ERP에서 환불이 됐을 때 처리 방법

### 2.1 현행 정리 (core-debugger 분석)

- **우리 → ERP**: `terminateMapping` / `partialRefundMapping` → `sendRefundToErp` → `sendToErpSystem`.  
  `sendToErpSystem`은 **모의 구현**(실제 HTTP 없이 `true` 반환).  
- **ERP → 우리**: 웹훅·ERP 콜백 URL·주기 조회·“ERP 환불 반영” 수동 API **모두 없음**.  
- **갭**: ERP만 환불 시 우리 매칭은 활성 유지, 우리 쪽 환불 거래(EXPENSE) 미생성, 스케줄·정산·환불 이력 `erpStatus`(고정 "SENT") 부정확.

상세: `docs/debug/REFUND_SYSTEM_ERP_AND_UI_ANALYSIS.md` 참조.

### 2.2 권장안 (1~2개)

| 방안 | 내용 | 장점 | 단점 |
|------|------|------|------|
| **권장 1: 수동 반영** | “ERP 환불 반영” 버튼/API로 관리자가 우리 쪽만 갱신. 예: `POST …/mappings/{id}/reflect-erp-refund` | 구현 범위 작음, ERP 연동 방식에 덜 의존 | 수동·누락·지연 가능 |
| **권장 2: ERP 콜백** | ERP에 “환불 처리 완료 시 호출할 URL” 등록, 우리 API 수신 시 매칭·환불 거래·스케줄 반영 | 완료 시점에 가깝게 자동 반영 | ERP 쪽 구현·보안·재시도 필요, 우리는 인증·멱등·에러 처리 설계 필요 |

- **선택 검토**: ERP가 콜백을 지원하지 않을 경우 **주기적 ERP 조회 후 동기화**(배치)를 대안으로 검토. (갭 문서 방안 C.)

---

## 3. 화면의 어떤 결제 단계에서 환불을 하면 좋은지

### 3.1 결제(매칭) 단계별 환불 가능 여부 (core-designer 제안)

| 단계 (코드) | 전액 환불 | 부분 환불 | 비고 |
|-------------|-----------|-----------|------|
| **PENDING_PAYMENT** | ✅ 허용 권장 | ❌ 불허 | 취소만. 부분 환불 무의미. |
| **PAYMENT_CONFIRMED** | ✅ 허용 권장 | ⚠️ 예약금만 | 결재확인·예약대기. 미참석/취소 시 예약금만 환불 옵션. |
| **DEPOSIT_PENDING** | ✅ 허용 권장 | ✅ 허용 권장 | 입금 확인 후 승인 대기. 전액·부분 모두 허용. |
| **DEPOSIT_CONFIRMED** | ✅ 허용 권장 | ✅ 허용 권장 | 입금 확인 완료. ACTIVE와 동일 정책 검토. |
| **ACTIVE** | ✅ 허용 권장 | ✅ 허용 권장 | 상담 진행 중. 전액(terminate)+회기 단위 부분 환불. |
| **INACTIVE / SUSPENDED** | ✅ 허용 권장 | ✅ 허용 권장 | 잔여 회기·금액 정리용. |
| **TERMINATED** | ❌ 불허 | ❌ 불허 | 이력 조회만. |
| **SESSIONS_EXHAUSTED** | ❌(또는 전액만 예외) | ❌ 불허 | 회기 소진. 정책상 예외 시 전액만 검토. |

### 3.2 환불을 수행하기 좋은 단계 (권장)

- **시나리오 A — 입금확인 후 ~ 상담완료 전**  
  - 대상: DEPOSIT_PENDING, DEPOSIT_CONFIRMED, ACTIVE.  
  - 매칭 관리 페이지에서 해당 상태일 때 **전액 환불(종료)** + **부분 환불** 버튼 노출.  
  - 금액·회기 정보가 있어 부분 환불 입력이 명확함.

- **시나리오 B — 예약취소/미참석 전용**  
  - 대상: PAYMENT_CONFIRMED(결재확인·예약대기).  
  - **예약금 환불** 또는 **예약 취소(전액 취소)** 버튼만 노출.  
  - 미참석/취소 시 예약금 50% 등 정책과 연동하기 좋음.

**권장 조합**: A + B.  
- PAYMENT_CONFIRMED → 예약금 환불/전액 취소 전용.  
- DEPOSIT_PENDING ~ ACTIVE(및 INACTIVE/SUSPENDED) → 전액(terminate) + 부분 환불(PartialRefundModal) 노출.  
- TERMINATED / SESSIONS_EXHAUSTED → 환불 버튼 비노출.

### 3.3 제한 사항

- “예약대기”·“상담완료”·“전액수령” 전용 상태/라벨은 현재 없음. UI에서는 결제 대기·결제 확인·입금 확인·활성·종료 등으로 표시.
- “결제 확인” vs “입금확인” 라벨 혼용 있음 — 추후 용어 통일 권장.
- RefundManagement는 **조회·통계용**. 환불 실행 버튼은 **매칭 관리 페이지**에서만 노출하는 구조 유지.

---

## 4. 환불 모달/폼 필수 요소 (core-publisher 요약)

- **구조**: `<form>` + `<fieldset>`/`<legend>`로 그룹화. 모든 입력에 `<label for="id">` 연결.
- **필수 요소**: 사유(선택/입력), 금액(전액/부분·입력), 환불일(또는 처리일), ERP 반영 여부 표시(읽기 전용, 예: "ERP 전송 완료" / "대기 중").
- **접근성**: 필수 필드 `required`·`aria-required`, 에러 시 `aria-invalid`·`aria-describedby`·`role="alert"`/`aria-live="polite"`, 버튼은 텍스트 명확 시 `aria-label` 생략 가능. UnifiedModal `role="dialog"`·`aria-modal="true"` 전제.
- **클래스**: BEM `mg-v2-refund-form__*`, 공통 `mg-v2-form-label`, `mg-v2-button`, `mg-v2-status-badge`.

---

## 5. 추후 구현 체크리스트

아래는 회의 결과를 반영한 **추후 구현 시** 참고용 체크리스트. 코드 수정은 본 회의에서 수행하지 않음.

### 5.1 ERP 환불 반영

- [ ] **수동 반영**: `POST /api/v1/admin/mappings/{id}/reflect-erp-refund` (또는 동등) API 및 “ERP 환불 반영” 버튼/화면 검토·구현.
- [ ] **선택** ERP 콜백: ERP 측 “환불 완료 시 호출 URL” 연동 시 우리 수신 API(`/api/v1/erp/callbacks/refund-completed` 등) 설계·인증·멱등·에러 처리.
- [ ] **선택** 주기 조회: ERP 환불 API 주기 조회 배치 및 우리 DB 동기화(중복 방지 포함).
- [ ] `sendToErpSystem` 실제 HTTP 전송 구현 여부 결정 및 반영.
- [ ] `getRefundHistory`의 `erpStatus`를 실제 ERP 처리 결과로 반영할 경로 설계(수동/콜백/배치 중 선택 후 구현).

### 5.2 결제 단계별 환불 UI

- [ ] 상태별 환불 버튼 노출 조건 구현: PENDING_PAYMENT(전액 취소만), PAYMENT_CONFIRMED(예약금 환불/전액 취소), DEPOSIT_PENDING~ACTIVE(전액+부분), TERMINATED/SESSIONS_EXHAUSTED(비노출).
- [ ] PAYMENT_CONFIRMED 전용 “예약금 환불” 플로우/API 검토(기존 partial-refund 확장 또는 전용 API).
- [ ] 환불 모달: 전액/부분(또는 예약금) 선택, 금액/회기, 사유(공통코드 REFUND_REASON_GROUP + 상세), 청약 철회 안내 등 designer·publisher 제안 반영.
- [ ] 환불 모달 마크업·접근성: form/fieldset/label, aria-*, required, role="alert", BEM 클래스 적용.

### 5.3 기타

- [ ] 결제 단계 용어 통일: “결제 확인” vs “입금확인”, “예약대기” 등 라벨·상수 정리.
- [ ] RefundManagement API prefix: `/api/admin/...` vs `/api/v1/admin/...` 통일 여부 확인 및 수정.

---

## 6. 참조 문서

| 문서 | 설명 |
|------|------|
| `docs/debug/REFUND_SYSTEM_ERP_AND_UI_ANALYSIS.md` | 현재 구조·ERP 환불 반영 경로·갭·제안(방안 A/B/C) |
| `docs/debug/DEPOSIT_ERP_REFUND_FLOW_ANALYSIS.md` | 예약금·결재확인·ERP 등록·환불 플로우 상세 |
| `docs/project-management/DEPOSIT_ERP_REFUND_MEETING_RESULT.md` | 예약금·결재확인·ERP 등록·환불 회의 결과(이전 회의) |
| `docs/project-management/DEPOSIT_PAYMENT_ERP_REFUND_MEETING_SURVEY.md` | 코드베이스 조사 요약(상태·매칭·환불) |

---

**문서 끝.**  
회의·분석·문서화만 수행했으며, 코드 수정은 추후 체크리스트 기준으로 진행한다.

# ERP 환불 완료 → 우리 시스템 반영 경로 분석 및 제안

**작성일**: 2025-03-16  
**담당**: core-debugger  
**참조 스킬**: `core-solution-debug`, `core-solution-erp`  
**관련 문서**: `docs/debug/DEPOSIT_ERP_REFUND_FLOW_ANALYSIS.md` (예약금·결재확인·환불 플로우·갭 상세)

---

## 1. 현재 구조·환불 관련 코드 경로 요약

### 1.1 우리 시스템 → ERP 방향 (전송)

| 구분 | API/트리거 | 서비스 메서드 | ERP 전송 |
|------|------------|---------------|----------|
| 전액 환불(강제 종료) | `POST /api/v1/admin/mappings/{id}/terminate` | `AdminServiceImpl.terminateMapping` | `sendRefundToErp` → `sendToErpSystem` |
| 부분 환불 | `POST /api/v1/admin/mappings/{id}/partial-refund` | `AdminServiceImpl.partialRefundMapping` | `sendRefundToErp` → `sendToErpSystem` |

- **내부 재무 반영**: `createConsultationRefundTransaction` / `createPartialConsultationRefundTransaction` → `FinancialTransactionService.createTransaction` (EXPENSE, `CONSULTANT_CLIENT_MAPPING_REFUND` 등).
- **외부 ERP 전송**: `AdminServiceImpl.sendRefundToErp` → `getErpRefundApiUrl()` (기본 `http://erp.company.com/api/refund`) → `sendToErpSystem(url, erpData, headers)`.  
  **현재 `sendToErpSystem`은 모의 구현**으로 실제 HTTP 요청 없이 로그 후 `true` 반환.  
  (상세 플로우·confirm-payment vs confirm-deposit 등은 기존 문서 참조: `DEPOSIT_ERP_REFUND_FLOW_ANALYSIS.md`.)

### 1.2 환불 이력·ERP 상태 노출

- **API**: `GET /api/v1/admin/refund-history` (페이지/기간/상태), `AdminServiceImpl.getRefundHistory`.
- **erpStatus**: 응답의 `erpStatus`는 **ERP에서 조회한 값이 아니라 우리 쪽에서 고정값 `"SENT"`으로 세팅**됨 (AdminServiceImpl 3423, 3441, 3472라인 부근).  
  즉, “ERP에 전송 완료/처리 완료/반려” 등 실제 ERP 처리 결과를 반영하는 경로 없음.

### 1.3 참고 코드 위치

- `AdminServiceImpl.java`: `terminateMapping`, `partialRefundMapping`, `sendRefundToErp`, `sendToErpSystem`, `getErpRefundApiUrl`, `createConsultationRefundTransaction`, `createPartialConsultationRefundTransaction`, `getRefundHistory`
- `AdminController.java`: `terminateMapping`, `partialRefundMapping`, `getRefundHistory`
- `FinancialTransactionServiceImpl.java`: `CONSULTANT_CLIENT_MAPPING_REFUND` 관련 거래 생성
- 프론트: `RefundManagement.js`, `RefundHistoryTable.js` (환불 이력·erpStatus 배지 표시)

---

## 2. ERP 환불 완료 → 우리 시스템 반영 경로 유무

**결론: 현재 ERP 환불 완료가 우리 시스템(매칭·결제·스케줄·정산)에 자동으로 반영되는 경로는 없음.**

아래 항목을 코드·설정 기준으로 확인함.

| 구분 | 조사 결과 |
|------|-----------|
| **웹훅(webhook)** | ERP에서 “환불 처리 완료” 시 우리 시스템을 호출하는 웹훅 수신 API 없음. (결제 쪽 `PaymentWebhookRequest`·Toss 웹훅은 ERP 환불과 무관.) |
| **배치(job)** | `StatisticsSchedulerServiceImpl`의 `@Scheduled` 작업은 통계·성과 업데이트(FINANCIAL/SALARY/CUSTOMER 타입)이며, **외부 ERP를 조회해 환불 상태를 가져오거나 우리 DB를 갱신하는 로직 없음.** |
| **수동 API(“ERP 환불 반영” 버튼 등)** | 관리자가 “ERP에서 환불 완료됐다”고 우리 쪽 상태를 반영하는 전용 API(예: `POST …/mappings/{id}/reflect-erp-refund`) 없음. |
| **ERP 콜백 URL** | 우리가 ERP에 등록해 둔 “환불 완료 시 호출할 URL” 설정·호출부 없음. `getErpRefundApiUrl()`은 **우리 → ERP 전송용 URL**이며, 역방향 콜백용 아님. |
| **주기적 ERP 조회** | ERP 환불 API를 주기적으로 조회해 우리 매칭/결제/스케줄과 동기화하는 스케줄러·서비스 없음. |

따라서 **“ERP에서 환불이 완료되었을 때” 우리 시스템에 자동 반영되는 경로는 현재 없음.**

---

## 3. 갭 분석 (반영 경로가 없을 때)

ERP에서만 환불이 처리되고 우리 시스템에는 그 사실이 들어오지 않을 때 생길 수 있는 갭을 요약하면 다음과 같다.

| 갭 | 설명 |
|----|------|
| **매칭 상태** | 우리는 “환불 처리”를 **우리 쪽 terminate/partial-refund API 호출**로 매칭 상태(TERMINATED 등)를 바꿈. ERP에서 먼저 환불만 하고 우리 API를 타지 않으면, **ERP에는 환불 반영·우리 DB에는 매칭이 계속 활성**인 불일치 가능. |
| **결제/재무 상태** | 우리 재무 거래(FinancialTransaction, EXPENSE)는 우리가 terminate/partial-refund 할 때만 생성됨. **ERP에서만 환불 처리 시** 우리 쪽에는 환불 거래가 생기지 않아, **결제·입금 대비 환불 현황이 우리 시스템에서 부정확**해질 수 있음. |
| **스케줄** | 스케줄 취소/상태 변경은 `terminateMapping`/`partialRefundMapping` 내부에서 처리됨. ERP만 환불 처리 시 **해당 매칭의 스케줄은 그대로**라 예약/완료 집계와 실제 금액 흐름이 어긋날 수 있음. |
| **정산** | 우리 정산이 내부 `FinancialTransaction`·매칭 기준이면, ERP에서만 반영된 환불은 **정산 데이터에 포함되지 않음**. ERP를 정산 원천으로 쓰는 경우에도, 우리 매칭/회기 정보와 ERP 환불 건이 자동으로 매칭되지 않음. |
| **환불 이력·erpStatus** | `getRefundHistory`의 `erpStatus`는 고정 `"SENT"`. **ERP 실제 처리 결과(완료/처리중/반려)** 를 받아오는 경로가 없어, UI에서 “ERP 반영 상태”를 신뢰할 수 없음. |

---

## 4. 제안(후보 방안)

ERP에서 환불이 됐을 때 우리 쪽을 맞추는 방법 후보 2~3가지와 장단점을 정리했다.

### 방안 A: 수동 상태 반영 (관리자 버튼/메뉴)

- **내용**: “ERP에서 환불 완료됨”을 전제로, 관리자가 특정 매칭(또는 환불 건)에 대해 **“ERP 환불 반영” 버튼**을 눌러 우리 시스템만 갱신하는 API/화면 제공.  
  예: `POST /api/v1/admin/mappings/{id}/reflect-erp-refund` (필요 시 금액·회기·사유 등 파라미터).
- **장점**: 구현 범위가 작고, ERP 연동 방식(API 유무·인증)에 덜 의존함.  
- **단점**: 수동 작업 필요, 누락·지연 가능성, “ERP 완료 시점”과 “우리 반영 시점” 불일치.

### 방안 B: ERP 콜백 URL 제공 후 우리 API 호출

- **내용**: ERP에 “환불 처리 완료 시 호출할 URL”을 등록하고, ERP가 그 URL로 우리 API를 호출하도록 함.  
  예: `POST /api/v1/erp/callbacks/refund-completed` (서명·토큰 검증 필수).  
  수신 시 해당 매칭에 대해 우리 쪽 환불 거래 생성·매칭 상태·스케줄 반영(기존 terminate/partial-refund 로직 재사용 또는 전용 로직).
- **장점**: ERP 처리 완료 시점에 가깝게 자동 반영 가능.  
- **단점**: ERP 쪽에서 콜백 구현·재시도·보안 요구사항을 만족해야 하며, 우리는 인증·멱등·에러 처리 설계 필요.

### 방안 C: 주기적으로 ERP 조회해 동기화

- **내용**: 배치(스케줄러)에서 **ERP 환불 API(또는 거래 목록)** 를 주기적으로 조회해, “우리 쪽에 없는 ERP 환불 건”을 찾아 매칭 ID 등으로 매핑한 뒤 우리 DB에 반영(환불 거래 생성, 매칭/스케줄 상태 갱신).
- **장점**: ERP가 콜백을 지원하지 않아도 적용 가능.  
- **단점**: 주기 간격만큼 지연, ERP API 스펙·인증·필터 설계 필요, 중복 반영 방지(멱등) 로직 필요.

---

**문서 끝.**  
코드 수정 없이 분석·갭 정리·후보 방안 제안만 수행. 구현 시 core-coder 위임 시 위 방안과 `DEPOSIT_ERP_REFUND_FLOW_ANALYSIS.md`의 “환불 시 외부 ERP 전송 미구현” 갭을 함께 고려하면 됨.

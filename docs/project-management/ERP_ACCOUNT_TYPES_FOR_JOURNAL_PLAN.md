# ERP 분개용 계정과목 조회·선택 기획

## 1. 목표·배경

### 목표
- 거래(분개) 등록/수정 모달에서 **계정과목을 숫자 직접 입력이 아닌 "표준 계정과목 목록 조회 → 셀렉트 선택"**으로 변경하여, 잘못된 ID 입력으로 인한 오류를 방지하고 사용성을 개선한다.

### 배경
- 현재 **IntegratedFinanceDashboard** 내 분개 생성/수정 모달(`JournalEntryCreateModal`, `JournalEntryEditModal`)에서 계정과목을 **숫자 입력(`<input type="number">`)** 으로 받고 있어, 사용자가 잘못된 ID를 입력하면 오류가 발생할 수 있음.
- 표준 계정과목은 이미 백엔드에 존재함:
  - **CommonCode** `codeGroup="ERP_ACCOUNT_TYPE"`, `codeValue`: REVENUE / EXPENSE / CASH
  - **extraData**: `{"accountId": <Long>}` 형태로 실제 Account ID 저장
  - **Account** 테이블: `accountNumber`가 ERP-REVENUE, ERP-EXPENSE, ERP-CASH 인 계정이 있으며, `description`은 "수익 계정", "비용 계정", "현금 계정"
- `ensureErpAccountMappingForTenant(tenantId)`가 데이터 동기화(또는 운영 현황 > 데이터 동기화) 시 위 계정·공통코드를 생성/갱신함.
- **요청 사항**: (1) 표준 계정과목을 조회해 가져와 선택하도록 하는 방안 기획 (2) 백엔드에 테넌트별 ERP 계정과목 목록 API 추가 (3) 프론트에서 해당 API로 목록을 받아 계정과목을 셀렉트(드롭다운)로 변경 (4) 계정이 없을 때 안내 문구 표시.

---

## 2. API 스펙

### 경로·메서드
- **경로 예시**: `GET /api/v1/erp/accounting/account-types` 또는 `GET /api/v1/erp/accounting/accounts-for-journal`
- **메서드**: GET
- **쿼리**: 없음 (테넌트는 세션/헤더 등 기존 tenantId 확정 방식 사용)

### 응답 형식
- **성공(200)**  
  - 본문: 배열. 각 요소는 `accountId`, `label`, `codeValue` 포함.
  - 예시:
```json
[
  { "accountId": 101, "label": "수익", "codeValue": "REVENUE" },
  { "accountId": 102, "label": "비용", "codeValue": "EXPENSE" },
  { "accountId": 103, "label": "현금", "codeValue": "CASH" }
]
```
- **빈 목록**: 계정/공통코드가 아직 없으면(데이터 동기화 전) `[]` 반환. 200으로 처리.
- **에러**: 401/403 등은 기존 ERP 회계 API와 동일한 규칙 적용.

### 데이터 소스(백엔드 구현 시 참고)
- **Option A**: `CommonCodeRepository.findByTenantIdAndCodeGroupAndIsActiveTrueOrderBySortOrderAsc(tenantId, "ERP_ACCOUNT_TYPE")` 로 조회 후, 각 항목의 `extraData` JSON에서 `accountId` 파싱. `label`은 `codeLabel` 또는 `koreanName`(한글명), `codeValue`는 그대로 사용.
- **Option B**: Account 테이블에서 해당 테넌트의 ERP 가상 계정(예: accountNumber가 ERP-REVENUE, ERP-EXPENSE, ERP-CASH)만 조회해 `accountId`, `description` 기반 label, codeValue 매핑하여 반환.
- 구현 시 기존 `AccountingServiceImpl`의 `ensureErpAccountMappingForTenant` 및 `getDefaultAccountId`와 사용하는 데이터 구조가 일치하도록 선택.

### 권한
- 분개 목록/생성/수정에 접근 가능한 역할과 동일하게 적용. (예: 관리자 또는 ERP 회계 메뉴 접근 권한이 있는 사용자. 기존 `AccountingController`·`LedgerController` 등 ERP accounting API 권한 정책을 따름.)

---

## 3. 프론트 변경 요약

### 대상 화면·컴포넌트
- **IntegratedFinanceDashboard.js** 내:
  - **JournalEntryCreateModal**: 분개 생성 모달
  - **JournalEntryEditModal**: 분개 수정 모달

### API 호출 시점
- 모달이 **열릴 때**(또는 해당 탭/모달이 마운트될 때) 위 계정과목 목록 API를 **한 번** 호출하여 상태에 저장.
- 생성/수정 모달이 동일한 부모에서 열리는 구조라면, 부모에서 한 번 조회 후 props로 넘기거나, 각 모달이 열릴 때마다 호출해도 됨. (중복 호출 최소화 권장.)

### 셀렉트 바인딩
- 계정과목 컬럼: 기존 **숫자 입력 `<input type="number">`** 를 **`<select>`** 로 교체.
  - `option`의 **표시 텍스트**: API 응답의 `label`(한글명, 예: 수익, 비용, 현금).
  - `option`의 **value**: `accountId` (문자열로 바인딩해도 되며, 제출 시 기존과 동일하게 숫자로 전달).
- 각 거래 라인(`lines`)의 `accountId` 필드는 선택된 `accountId`로 유지. (기존 분개 생성/수정 API 페이로드 형식 변경 없음.)

### 에러·빈 목록 처리
- **API 실패(네트워크/4xx/5xx)**: 기존 패턴(StandardizedApi 등)에 따라 에러 메시지 표시. 계정과목 필드는 비활성화하거나 "목록을 불러올 수 없습니다" 안내.
- **목록이 비어 있음**(`[]`):  
  **"계정과목이 없습니다. 운영 현황 > 데이터 동기화를 먼저 실행해 주세요."** 라는 안내 문구를 모달 내에 표시하고, 계정과목 셀렉트는 비활성화하거나 placeholder만 노출.

---

## 4. core-coder 전달용 구현 체크리스트

### 백엔드 할 일
- [ ] 테넌트별 ERP 계정과목 목록을 반환하는 **GET** API 추가.
  - 경로: `/api/v1/erp/accounting/account-types` 또는 `/api/v1/erp/accounting/accounts-for-journal` 중 프로젝트 규칙에 맞게 하나 확정.
  - 응답: `[{ "accountId": Long, "label": String, "codeValue": String }]`.
  - 데이터 소스: CommonCode(ERP_ACCOUNT_TYPE) + extraData의 accountId 파싱, 또는 Account 테이블 ERP 가상 계정 조회. `AccountingServiceImpl`/기존 ERP 계정 로직과 일관되게 구현.
- [ ] tenantId는 기존 ERP API와 동일하게 세션/컨텍스트에서 필수 확정.
- [ ] 권한: 기존 분개/회계 API와 동일한 역할·권한 적용.
- [ ] 빈 목록 시 `[]` 반환, 200.

### 프론트 할 일
- [ ] `frontend/src/constants/api.js`(또는 동일한 API 상수 파일)에 새 엔드포인트 상수 추가.
- [ ] **JournalEntryCreateModal**: 모달 열릴 때(또는 상위에서 조회 후 전달) 계정과목 목록 API 호출. 응답을 state에 저장.
- [ ] **JournalEntryCreateModal**: 계정과목 입력을 `<input type="number">` → `<select>`로 변경. option 표시는 `label`, value는 `accountId`. 기존 `lines[].accountId` 상태 및 제출 페이로드 형식 유지.
- [ ] **JournalEntryEditModal**: 동일하게 계정과목 목록 조회 후, 계정과목을 `<select>`로 변경. 기존 수정 페이로드 형식 유지.
- [ ] 목록이 비어 있을 때: "계정과목이 없습니다. 운영 현황 > 데이터 동기화를 먼저 실행해 주세요." 안내 문구 표시 및 셀렉트 비활성/placeholder 처리.
- [ ] API 실패 시: 에러 메시지 표시 및 계정과목 입력 비활성 또는 안내 처리.
- [ ] 기존 분개 생성/수정 API 호출 시 `accountId` 타입·값이 기존과 호환되는지 확인(숫자로 전달).

---

*문서 작성: 기획(core-planner). 구현은 core-coder에게 위 체크리스트와 본 문서 §2·§3를 전달하여 수행.*

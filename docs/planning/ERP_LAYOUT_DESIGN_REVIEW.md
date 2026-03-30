# ERP 섹션 레이아웃·UI 검토

**작성일**: 2025-03-04  
**목적**: ERP 페이지의 레이아웃·컨테이너·헤더 일관성 검토. 기획 문서 `docs/planning/ERP_SECTION_AUDIT_AND_PLANNING.md` §4.3 레이아웃 제안에 따른 디자인 관점 정리.  
**참조**: 어드민 대시보드 샘플 https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample

---

## 1. ERP 페이지별 AdminCommonLayout 사용 여부

| 페이지(컴포넌트) | AdminCommonLayout | 본문 내부 구조(컨테이너·헤더) | 비고 |
|------------------|-------------------|------------------------------|------|
| ErpDashboard | ✅ 사용 | `mg-dashboard-layout` + `mg-dashboard-header` (제목·부제·액션) | 대시보드 카드 그리드 |
| PurchaseManagement | ✅ 사용 | `erp-container` + `erp-header` | 구매 요청/발주 카드 |
| FinancialManagement | ✅ 사용 | `erp-container` + `erp-header` | 재무·거래 목록 |
| BudgetManagement | ✅ 사용 | `erp-container` + `erp-header` / `erp-login-header` | 예산 목록·진행률 |
| ImprovedTaxManagement | ✅ 사용 | `erp-container` + `erp-header` (제목·부제) + `erp-tabs` | 세무 탭·카드 |
| ItemManagement | ✅ 사용 | `item-management-container` | 테이블·카드 |
| AdminApprovalDashboard | ✅ 사용 | `approval-dashboard-container` | 승인 목록 |
| SuperAdminApprovalDashboard | ✅ 사용 | `approval-dashboard-container` | 슈퍼 승인 목록 |
| RefundManagement | ✅ 사용 | `erp-system erp-refund-container` | 환불 목록·필터 |
| SalaryManagement | ✅ 사용 | `mg-dashboard-layout` + `mg-dashboard-header` | 급여 설정·미리보기 |
| PurchaseRequestForm | ✅ 사용 | `purchase-request-form-container` + `mg-v2-container` | 폼 단일 컨테이너 |
| TaxManagement | ✅ 사용 | `mg-dashboard-layout` + `mg-dashboard-header` | 세금 계산 UI |
| IntegratedFinanceDashboard | ✅ 사용 | `mg-dashboard-layout` + `mg-dashboard-header` | 통합 재무 대시보드 |

**결론**: **모든 주요 ERP 페이지가 이미 AdminCommonLayout을 사용**하고 있음. 자체 헤더/컨테이너만 쓰고 Layout을 쓰지 않는 ERP 페이지는 없음.

---

## 2. 어드민 샘플·다른 어드민 페이지와의 비교

### 2.1 공통점

- **LNB·GNB**: AdminCommonLayout을 쓰므로 ERP도 동일한 사이드바(약 260px)·상단 바 구조를 가짐.
- **라우트·위젯 링크**: Phase 3 정리 기준으로 ERP 진입 경로는 일관됨.

### 2.2 본문 구조 차이 (ERP만 다른 점)

어드민 대시보드 샘플·시스템 설정 관리·심리검사 관리 등은 아래 패턴을 사용함.

- **본문**: `ContentArea` + `ContentHeader`(제목·부제·액션) + `mg-v2-ad-b0kla__*` 섹션 블록(카드·섹션 제목).
- **클래스**: `mg-v2-ad-b0kla`, `mg-v2-ad-b0kla__container`, `mg-v2-ad-b0kla__card`, `mg-v2-ad-b0kla__section-title` 등 디자인 시스템 토큰.

ERP는 **ContentArea / ContentHeader를 사용하지 않고**, 본문 안에 아래와 같은 **자체 컨테이너·헤더**를 둠.

| 구분 | ERP 페이지 | 비고 |
|------|-----------|------|
| **erp-container + erp-header** | PurchaseManagement, FinancialManagement, BudgetManagement, ImprovedTaxManagement | 페이지 제목·부제를 Layout `title`과 **중복** 노출 가능 |
| **mg-dashboard-layout + mg-dashboard-header** | ErpDashboard, SalaryManagement, TaxManagement, IntegratedFinanceDashboard | 동일하게 본문 내부에 제목·액션 바 존재 |
| **단일 컨테이너** | ItemManagement, AdminApprovalDashboard, SuperAdminApprovalDashboard, RefundManagement, PurchaseRequestForm | 헤더는 상대적으로 단순하나, B0KlA 섹션 블록 구조는 미적용 |

따라서 **“ERP만 다른 레이아웃”**이라기보다는, **같은 AdminCommonLayout 아래에서 본문 구조(컨테이너·헤더·섹션 클래스)만 어드민 샘플과 다름**으로 보는 것이 맞음.

---

## 3. AdminCommonLayout 적용 시 레이아웃·비주얼 개선점 및 주의점

(현재 이미 적용된 상태이므로, “추가 적용”이 아니라 “본문 구조를 어드민 샘플에 맞춰 정리할 때”의 개선점·주의점으로 기술함.)

### 3.1 개선 방향 (비주얼·일관성)

1. **이중 제목 제거**  
   Layout의 `title`로 이미 페이지 제목이 나오므로, 본문 내부 `erp-header` / `mg-dashboard-header`의 **동일 제목(h1)**은 제거하거나, 부제·설명만 남기고 제목은 한 곳에서만 노출하도록 정리하면 샘플과 톤이 맞음.

2. **본문 구조를 B0KlA 패턴으로 점진 통일**  
   - 본문 루트: `ContentArea` + `ContentHeader`(필요 시 부제·주요 액션만)  
   - 섹션: `mg-v2-ad-b0kla__card`, `mg-v2-ad-b0kla__section-title` 등으로 블록 구분  
   → 어드민 샘플과 동일한 “상단 바(제목+액션) 하나 + 섹션 블록” 구조로 맞출 수 있음.

3. **색상·간격**  
   - 이미 정의된 `var(--mg-*)`·`mg-v2-*` 토큰 사용 시, ERP 전용 커스텀 색·여백을 줄이면 샘플과의 비주얼 일관성이 커짐.

4. **섹션 블록 좌측 악센트**  
   - 샘플처럼 섹션 제목 왼쪽에 세로 악센트 바(4px, 주조색)를 두면 ERP도 동일한 시각 언어 유지에 유리함.

### 3.2 적용 시 주의점

1. **탭·카드·테이블 비중**  
   ERP는 탭(세무 등)·카드 그리드·테이블이 많음. ContentHeader에 “주요 액션만” 올리고, 탭/필터/테이블 툴바는 각 섹션 블록 내부에 두어, **한 화면에 액션 영역이 과도하게 나뉘지 않도록** 구성하는 것이 좋음.

2. **기존 erp-* / mg-dashboard-* 클래스**  
   한 번에 제거하기보다는, **페이지별로 ContentArea + ContentHeader + mg-v2-ad-b0kla__* 로 치환**하면서 기존 동작(반응형·카드 레이아웃)을 유지하는 방식이 안전함.

3. **모달·폼**  
   QuickExpenseForm, ErpReportModal, SalaryConfigModal 등은 레이아웃 검토 대상이 아님. UnifiedModal·기존 모달 스타일만 유지하면 됨.

4. **반응형**  
   현재 카드형/그리드 반응형을 유지한 채, **섹션 블록만 B0KlA 클래스로 감싸는** 수준으로 적용하면 브레이크포인트 이슈를 줄일 수 있음.

---

## 4. 요약

| 항목 | 내용 |
|------|------|
| AdminCommonLayout | ERP 주요 페이지 **전부 사용 중**. 미사용 페이지 없음. |
| ERP만 다른 점 | **본문 구조**: ContentArea/ContentHeader·mg-v2-ad-b0kla__* 미사용, erp-* / mg-dashboard-* 자체 헤더·컨테이너 사용. |
| 개선 제안 | 이중 제목 정리, 본문을 ContentArea + ContentHeader + 섹션 블록으로 점진 통일, 디자인 토큰 일관 적용. |
| 주의점 | 탭/카드/테이블 비중 고려해 액션 배치 정리, 기존 클래스는 페이지 단위로 점진 치환. |

코드 수정 없이 레이아웃·비주얼 관점만 정리한 문서이며, 실제 변경은 core-coder와 협의 후 진행하는 것을 권장함.

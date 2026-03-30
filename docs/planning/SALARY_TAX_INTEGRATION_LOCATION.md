# 급여·세금 통합 구현 위치

**작성**: 2026-02-12  
**목적**: 오늘 통합 구현한 급여·세금 기능이 화면/코드 어디에 있는지 확인용 정리

---

## 1. 화면(URL) 위치

| 기능 | URL | 비고 |
|------|-----|------|
| **급여 관리** (급여+세금 통합 UI) | `/erp/salary` | 급여 프로필, 급여 계산, **세금 통계** 한 페이지 |
| **세금(세무) 관리** | `/erp/tax` | 세금 통계·유형별 내역·추가 세금 계산 등 |

---

## 2. 메뉴에서 들어가는 방법

- **LNB(좌측 메뉴)**  
  - **운영·재무** > **급여 관리** → `/erp/salary`  
  - **운영·재무** > **세무 관리** → `/erp/tax`  
- **ERP 대시보드** (`/erp/dashboard`)  
  - **빠른 액션** 카드: **급여 관리**, **세금 관리** 클릭 시 각각 `/erp/salary`, `/erp/tax` 이동  
  - (권한: `SALARY_MANAGE`, `TAX_MANAGE` 또는 ADMIN 역할일 때만 카드 표시)

---

## 3. 프론트엔드 코드 위치

| 구분 | 경로 |
|------|------|
| **급여 관리 페이지** (통합) | `frontend/src/components/erp/SalaryManagement.js` |
| **세금 전용 페이지 (TaxManagement)** | `frontend/src/components/erp/TaxManagement.js` |
| **세금 전용 페이지 (ImprovedTaxManagement)** | `frontend/src/components/erp/ImprovedTaxManagement.js` |
| **라우트 정의** | `frontend/src/App.js` — `/erp/salary` → `SalaryManagement`, `/erp/tax` → 위 두 컴포넌트 중 하나(중복 라우트 있음) |
| **LNB 메뉴** | `frontend/src/components/dashboard-v2/constants/menuItems.js` — 운영·재무 children에 급여 관리·세무 관리 |
| **ERP 대시보드 카드** | `frontend/src/components/erp/ErpDashboard.js` — 빠른 액션 섹션 |

---

## 4. 백엔드 API (급여·세금 통합)

- **급여**: `GET/POST /api/v1/admin/salary/*` (계산, 기산일, 프로필 등)  
- **세금 통합**:  
  - `GET /api/v1/admin/salary/tax/statistics?period=...`  
  - `GET /api/v1/admin/salary/tax/type/:taxType`  
  - `POST /api/v1/admin/salary/tax/calculate`  
- 컨트롤러: `SalaryManagementController`, `SalaryConfigController`, `SalaryBatchController` 등 (세금 API는 salary 하위 경로로 통합)

---

## 5. 요약

- **급여·세금 통합 화면**: **`/erp/salary`** (`SalaryManagement.js`) — 여기서 급여와 세금 통계를 함께 다룸.  
- **세금만 따로**: **`/erp/tax`** — `TaxManagement` 또는 `ImprovedTaxManagement` (App.js 라우트 순서에 따라 하나만 노출).  
- **진입**: LNB **운영·재무 > 급여 관리 / 세무 관리** 또는 ERP 대시보드 **빠른 액션** 카드.

# 환불 관리 시스템 페이지 컴포넌트 조사

**작성일**: 2025-03-16  
**담당**: core-component-manager  
**목적**: 경로·구성·아토믹 디자인 적용 여부 정리, 개선 포인트 제안(문서화만, 코드 수정 없음)

---

## 1. 경로·라우트

| 항목 | 값 |
|------|-----|
| **URL 경로** | `/erp/refund-management` |
| **라우트 정의** | `frontend/src/App.js` 563행: `<Route path="/erp/refund-management" element={<RefundManagement />} />` |
| **페이지 진입점** | `frontend/src/components/erp/RefundManagement.js` |
| **다른 진입** | `ErpDashboard.js`: 버튼 클릭 시 `navigate('/erp/refund-management')` |

---

## 2. 사용 컴포넌트 목록 (파일 경로·역할·계층)

### 2.1 페이지·레이아웃

| 파일 경로 | 컴포넌트 | 역할 | Atoms/Molecules/Organisms |
|-----------|----------|------|---------------------------|
| `frontend/src/components/erp/RefundManagement.js` | RefundManagement | 페이지 컨테이너, 상태·API·핸들러 통합 | **Page** |
| `frontend/src/components/layout/AdminCommonLayout.js` | AdminCommonLayout | 공통 레이아웃(사이드바 등) | Template/Layout |
| `frontend/src/components/dashboard-v2/content/ContentHeader.js` | ContentHeader | 상단 헤더(제목, 부제, actions) | Organism |
| `frontend/src/components/dashboard-v2/content/ContentArea.js` | ContentArea | 본문 영역 래퍼 | Organism |
| `frontend/src/components/common/UnifiedLoading.js` | UnifiedLoading | 페이지 로딩 UI | Molecule/공통 |

### 2.2 환불 전용 섹션 (erp/refund/)

| 파일 경로 | 컴포넌트 | 역할 | Atoms/Molecules/Organisms |
|-----------|----------|------|---------------------------|
| `frontend/src/components/erp/refund/RefundStatsCards.js` | RefundStatsCards | 환불 통계 카드 4종(건수, 금액, 회기, 연동 상태) | **Organism** |
| `frontend/src/components/erp/refund/RefundFilters.js` | RefundFilters | 필터 및 제어(기간, 상태, 새로고침, 엑셀) | **Organism** |
| `frontend/src/components/erp/refund/RefundHistoryTable.js` | RefundHistoryTable | 환불 이력 테이블 + 페이징 | **Organism** |
| `frontend/src/components/erp/refund/RefundReasonStats.js` | RefundReasonStats | 환불 사유별 통계 카드 그리드 | **Organism** |
| `frontend/src/components/erp/refund/ErpSyncStatus.js` | ErpSyncStatus | ERP 동기화 상태(연결, 성공률, 대기, 실패, 마지막 동기화) | **Organism** |
| `frontend/src/components/erp/refund/RefundAccountingStatus.js` | RefundAccountingStatus | 회계 처리 현황(오늘 처리, 승인 대기, 총 환불 금액) | **Organism** |

### 2.3 공통 부품 (erp/common/)

| 파일 경로 | 컴포넌트 | 역할 | Atoms/Molecules/Organisms |
|-----------|----------|------|---------------------------|
| `frontend/src/components/erp/common/ErpCard.js` | ErpCard | 카드 래퍼(mg-v2-card / mg-glass-card, 제목·body) | **Molecule** |
| `frontend/src/components/erp/common/ErpButton.js` | ErpButton | 버튼(mg-v2-button, variant/size/loading) | **Atom** |

### 2.4 스타일 파일 (refund 전용)

| CSS 파일 | 대응 컴포넌트 |
|----------|----------------|
| `RefundStatsCards.css` | RefundStatsCards |
| `RefundFilters.css` | RefundFilters |
| `RefundReasonStats.css` | RefundReasonStats |
| `ErpSyncStatus.css` | ErpSyncStatus |
| `RefundAccountingStatus.css` | RefundAccountingStatus |
| RefundHistoryTable | 전용 CSS 없음 → `mg-v2-table*` 등 공통 클래스만 사용 |

---

## 3. 섹션별 구성 요약

| 순서 | 섹션 | 컴포넌트 | 비고 |
|------|------|----------|------|
| 1 | 환불 통계 카드 | RefundStatsCards | 건수, 금액, 회기, 연동 상태 |
| 2 | 필터 및 제어 | RefundFilters | 기간, 상태, 새로고침, 엑셀 |
| 3 | 환불 이력 테이블 | RefundHistoryTable | 테이블 + 페이징(ErpButton) |
| 4 | 환불 사유별 통계 | RefundReasonStats | 사유별 건수 그리드 |
| 5 | ERP 동기화 상태 | ErpSyncStatus | 연결/성공률/대기/실패/마지막 동기화 |
| 6 | 회계 처리 현황 | RefundAccountingStatus | 오늘 처리, 승인 대기, 총 환불 금액 |

---

## 4. 아토믹 디자인 적용 여부

### 4.1 현재 상태

- **Organism 단위**: 환불 6개 섹션이 각각 Organism 수준으로 분리되어 있음(RefundStatsCards, RefundFilters, RefundHistoryTable, RefundReasonStats, ErpSyncStatus, RefundAccountingStatus).
- **공통만 사용**: 하위 단위는 **ErpCard**, **ErpButton** 등 `erp/common/` 공통 컴포넌트만 사용.
- **refund 전용 Atoms/Molecules 미구분**:
  - 통계 “숫자+라벨” 블록, “상태 뱃지”, “필터 select+라벨”, “테이블 행 한 줄” 등이 각 Organism 내부에 인라인으로만 존재.
  - 동일 패턴이 **RefundStatsCards / RefundReasonStats / ErpSyncStatus / RefundAccountingStatus**에서 반복됨(카드형 그리드 + 라벨 + 값).

### 4.2 BEM·디자인 토큰

- **BEM**: refund 쪽 CSS는 대체로 BEM 유사 네이밍 사용  
  (`refund-stats-grid`, `refund-stats-value--danger`, `refund-filter-group`, `erp-sync-card--success`, `refund-accounting-card--success` 등).
- **디자인 토큰 불일치**:
  - **일부만 토큰 사용**: `var(--mg-error-500)`, `var(--mg-primary-500)`, `var(--font-size-sm)`, `var(--mg-gray-100)` 등은 사용.
  - **하드코딩 색상 다수**: `#6f42c1`, `#fd7e14`, `#666`, `#d4edda`, `#c3e6cb`, `#f8d7da`, `#155724`, `#721c24`, `#d1ecf1`, `#fff3cd`, `#856404`, `#e9ecef`, `#383d41` 등이 CSS에 직접 기입됨.
- **테이블**: RefundHistoryTable은 `mg-v2-table`, `mg-v2-table-container`, `mg-v2-table-cell` 등 공통 클래스 사용(디자인 시스템 정렬 양호). ERP 상태 뱃지는 `refund-history-table-status`만 사용, 색상은 `statusConfig`의 `var(--mg-*)`로 일부 적용.

---

## 5. 개선 포인트 제안

### 5.1 Atoms/Molecules/Organisms 분리

- **Atoms (refund 또는 erp 공통)**  
  - **StatValue**: 숫자+단위(건수, 금액, 회기 등) 표시용 작은 블록.  
  - **StatusBadge**: ERP 상태·연동 상태 등 텍스트 뱃지(색상은 디자인 토큰으로).  
  - (이미 공통인) **ErpButton** 유지, 필요 시 icon 슬롯 지원 검토(현재 RefundManagement에서 `icon` 전달하나 ErpButton에서 미사용 가능성 있음).
- **Molecules**  
  - **StatCard**: “라벨 + 값” 카드 한 칸(RefundStatsCards, RefundReasonStats, ErpSyncStatus, RefundAccountingStatus에서 공통화).  
  - **FilterGroup**: 라벨 + select 한 세트(RefundFilters에서 분리).  
  - **DataTableRow** (선택): 환불 이력 한 행을 컴포넌트화하면 테이블 재사용·테스트에 유리.
- **Organisms**  
  - 현재 6개 Organism은 유지하되, 위 Atom/Molecule을 조합하도록 리팩터하면 “반복 제거” 및 “적재적소 배치”에 부합.

### 5.2 BEM·디자인 토큰 일관화

- **색상**: 하드코딩된 hex 값을 `var(--mg-*)` 또는 `var(--erp-*)` 등 디자인 토큰으로 치환(에러/성공/경고/정보/중립 등).
- **BEM**: 이미 사용 중인 `block__element--modifier` 패턴을 refund·erp 전역에 통일하고, 공통 StatCard/StatusBadge 등은 `mg-*` 또는 `erp-*` 네임스페이스로 정리 제안.

### 5.3 재사용 가능 단위 분리 제안

- **카드 그리드 + 라벨+값**:  
  RefundStatsCards, RefundReasonStats, ErpSyncStatus, RefundAccountingStatus에서 반복되는 “작은 카드(라벨+값)”를 **StatCard** Molecule로 추출하면, ERP 대시·다른 통계 페이지에서도 재사용 가능.
- **테이블 행**:  
  RefundHistoryTable의 한 행을 **RefundHistoryRow** 또는 공통 **ErpDataTableRow** 형태로 분리하면 가독성·단위 테스트·다른 ERP 테이블과 일관성에 도움.
- **필터 바**:  
  RefundFilters의 “기간/상태 select + 버튼들”을 **ErpFilterBar** Molecule로 두고, 다른 ERP 목록 화면에서도 재사용 검토.

---

## 6. 정리

| 항목 | 내용 |
|------|------|
| **경로** | `/erp/refund-management`, 진입점 `RefundManagement.js` |
| **구성** | 6개 Organism(통계 카드, 필터, 이력 테이블, 사유별 통계, ERP 동기화, 회계 현황) + ContentHeader/ContentArea/AdminCommonLayout/UnifiedLoading |
| **공통 부품** | ErpCard, ErpButton(erp/common) |
| **아토믹** | Organism 단위는 있음. refund 전용 Atoms/Molecules 미구분, 통계·카드 패턴 반복. |
| **개선** | StatCard/StatusBadge/FilterGroup 등 Molecule 추출, 디자인 토큰 일관화, BEM 네임스페이스 통일, 테이블 행 분리 검토. |

실제 코드 수정·이동·통합은 **core-coder**가 수행하고, 반영 후 필요 시 본 문서와 컴포넌트 인벤토리 갱신을 component-manager에 요청하면 됩니다.

---

**저장 위치**: `docs/project-management/REFUND_MANAGEMENT_COMPONENT_SURVEY.md`

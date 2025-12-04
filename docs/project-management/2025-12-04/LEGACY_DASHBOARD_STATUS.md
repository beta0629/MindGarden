# 레거시 대시보드 표준화 상태

**작성일**: 2025-12-04  
**기준**: 레거시 대시보드 (다이나믹 대시보드 제외)

---

## 📋 레거시 대시보드 목록

### ✅ 완료된 대시보드 (Priority 2.4 적용 완료)

#### 1. AdminDashboard.js (관리자 대시보드)
- **경로**: `/admin/dashboard`
- **역할**: ADMIN, HQ_MASTER
- **표준화 완료**:
  - ✅ 하드코딩 제한값 → 상수로 변경 (`.slice(0, 10)` → `WIDGET_CONSTANTS.DASHBOARD_LIMITS.MAX_ITEMS`)
  - ✅ 모든 StatCard에 onClick 핸들러 추가
    - 총 사용자 → `/admin/user-management`
    - 예약된 상담 → `/admin/schedules`
    - 완료된 상담 → `/admin/sessions`
    - 상담사 → `/admin/consultant-comprehensive`
    - 내담자 → `/admin/client-comprehensive`
    - 매칭 → `/admin/mapping-management`
    - 활성 매칭 → `/admin/mapping-management?status=ACTIVE`
    - 입금 확인 대기 → `/admin/mapping-management?status=PENDING_PAYMENT`
    - 환불 통계 → `/admin/mapping-management?tab=refunds`
    - 상담 완료 통계 → `/admin/sessions`, `/admin/statistics`

#### 2. ClientDashboard.js (내담자 대시보드)
- **경로**: `/client/dashboard`
- **역할**: CLIENT
- **표준화 완료**:
  - ✅ 하드코딩 제한값 → 상수로 변경 (`.slice(0, 3)` → `WIDGET_CONSTANTS.DASHBOARD_LIMITS.DEFAULT_ITEMS`)
  - ✅ 모든 통계 카드에 클릭 가능한 링크 추가
    - 오늘의 상담 → `/client/consultations?filter=today`
    - 완료한 상담 → `/client/consultations?filter=completed`
    - 이번 주 상담 → `/client/consultations?filter=weekly`
    - 남은 회기 → `/client/mappings`
  - ✅ 스케줄 항목에 상세 페이지 링크 추가

#### 3. CommonDashboard.js (상담사 대시보드)
- **경로**: `/consultant/dashboard`
- **역할**: CONSULTANT
- **표준화 완료**:
  - ✅ 하드코딩 제한값 → 상수로 변경 (`.slice(0, 5)` → `WIDGET_CONSTANTS.DASHBOARD_LIMITS.DEFAULT_ITEMS`)
  - ✅ SummaryPanels.js에 링크 추가 완료

---

### ⚠️ 확인 필요 대시보드

#### 4. ErpDashboard.js (ERP 대시보드) ✅ 표준화 완료
- **경로**: `/erp/dashboard`
- **역할**: CONSULTANT, ADMIN, HQ_MASTER (ERP 접근 권한)
- **표준화 완료**:
  - ✅ `SimpleLayout`, `UnifiedLoading` 사용 확인
  - ✅ 모든 StatCard에 onClick 핸들러 추가
    - 총 아이템 수 → `/erp/items`
    - 승인 대기 요청 → `/erp/approvals`
    - 총 주문 수 → `/erp/purchase-orders`
    - 예산 사용률 → `/erp/budget`
  - ✅ 버튼 표준화 (Button 컴포넌트 사용, 2중 클릭 방지)
  - ✅ `WIDGET_CONSTANTS` import 추가

#### 5. AcademyDashboard.js (학원 대시보드) ✅ 확인 완료
- **경로**: `/academy/dashboard`
- **역할**: STUDENT, TEACHER
- **상태**:
  - ✅ `SimpleLayout` 사용 확인
  - ✅ 탭 기반 UI로 네비게이션 처리 (별도 StatCard 없음)
  - ✅ 데이터 제한 불필요 (리스트 컴포넌트에서 처리)
  - ✅ 링크는 탭으로 처리되어 표준화 완료

---

### ❓ 사무원(STAFF) 대시보드

**상태**: 별도 대시보드 파일 없음

**확인 사항**:
- `dashboardUtils.js`에서 STAFF 역할에 대한 대시보드 매핑 없음
- `getLegacyDashboardPath()` 함수에서 STAFF 역할 처리 확인 필요
- 사무원은 다른 대시보드(예: CommonDashboard 또는 AdminDashboard)를 사용하는 것으로 추정

**조치 필요**:
- [ ] STAFF 역할의 대시보드 경로 확인
- [ ] STAFF 전용 대시보드 필요 여부 확인
- [ ] 필요시 CommonDashboard 또는 AdminDashboard 사용

---

## 📊 표준화 적용 현황

### 완료된 표준화 항목

1. **데이터 제한 표준화**
   - ✅ `WIDGET_CONSTANTS.DASHBOARD_LIMITS` 상수 추가
   - ✅ `MAX_ITEMS: 10` (대시보드 최대 표시 개수)
   - ✅ `DEFAULT_ITEMS: 5` (기본 표시 개수)

2. **링크 표준화**
   - ✅ StatCard 컴포넌트에 onClick prop 추가
   - ✅ 클릭 가능한 스타일 추가 (`mg-dashboard-stat-card--clickable`)
   - ✅ 모든 통계 카드에 상세 페이지 링크 추가

3. **하드코딩 제거**
   - ✅ `.slice(0, 10)` → `WIDGET_CONSTANTS.DASHBOARD_LIMITS.MAX_ITEMS`
   - ✅ `.slice(0, 5)` → `WIDGET_CONSTANTS.DASHBOARD_LIMITS.DEFAULT_ITEMS`
   - ✅ `.slice(0, 3)` → `WIDGET_CONSTANTS.DASHBOARD_LIMITS.DEFAULT_ITEMS`

---

## 🔄 다음 작업

### 우선순위 1: ErpDashboard.js 표준화
- [ ] 데이터 제한 확인 및 상수 적용
- [ ] StatCard 링크 추가

### 우선순위 2: AcademyDashboard.js 표준화
- [ ] 데이터 제한 확인 및 상수 적용
- [ ] 링크 추가

### 우선순위 3: STAFF 역할 대시보드 확인
- [ ] STAFF 역할의 대시보드 경로 확인
- [ ] 필요시 표준화 적용

---

## 📝 참고 사항

- **다이나믹 대시보드**: 현재 디자인 이슈로 사용하지 않음
- **위젯 시스템**: 현재 사용하지 않음
- **레거시 대시보드**: 실제 사용 중인 대시보드 기준으로 표준화 진행

---

**마지막 업데이트**: 2025-12-04


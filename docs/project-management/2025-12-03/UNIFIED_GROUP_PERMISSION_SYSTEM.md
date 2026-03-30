# 통합 그룹 기반 권한 시스템 (전체 역할)

**작성일**: 2025-12-03  
**목적**: 관리자, 사무원, 상담사, 내담자 모두 그룹 코드 기반 권한 관리

---

## 🎯 핵심 개념

### 기존 문제
```
❌ 역할별로 다른 대시보드 컴포넌트
- AdminDashboard.js
- ConsultantDashboard.js
- ClientDashboard.js
- StaffDashboard.js (관리자와 동일하지만 ERP 제외)

❌ 하드코딩된 권한 체크
{role === 'ADMIN' && <ERPSection />}
{role === 'CONSULTANT' && <ConsultationSection />}
```

### 새로운 방식
```
✅ 하나의 통합 대시보드
- UnifiedDashboard.js (모든 역할 공통)

✅ 그룹 코드 기반 권한 체크
{hasPermissionGroup('ERP_MANAGEMENT') && <ERPSection />}
{hasPermissionGroup('CONSULTATION_MANAGEMENT') && <ConsultationSection />}
{hasPermissionGroup('CLIENT_WELLNESS') && <WellnessSection />}
```

---

## 📊 전체 그룹 구조 설계

### 1. 관리자 (ADMIN) 그룹

```
ADMIN_DASHBOARD
├─ DASHBOARD_STATISTICS (통계 섹션)
│  ├─ STAT_OVERVIEW (전체 개요)
│  ├─ STAT_USERS (사용자 통계)
│  ├─ STAT_CONSULTATIONS (상담 통계)
│  ├─ STAT_REVENUE (매출 통계)
│  └─ STAT_PERFORMANCE (성과 분석)
│
├─ DASHBOARD_MANAGEMENT (관리 섹션)
│  ├─ MGMT_USERS (사용자 관리)
│  ├─ MGMT_CONSULTANTS (상담사 관리)
│  ├─ MGMT_CLIENTS (내담자 관리)
│  ├─ MGMT_SCHEDULES (일정 관리)
│  └─ MGMT_MAPPING (매핑 관리)
│
├─ DASHBOARD_ERP (ERP 섹션) ⭐ 관리자만
│  ├─ ERP_PURCHASE (구매 관리)
│  ├─ ERP_FINANCIAL (재무 관리)
│  ├─ ERP_BUDGET (예산 관리)
│  └─ ERP_INVENTORY (재고 관리)
│
└─ DASHBOARD_SYSTEM (시스템 섹션)
   ├─ SYS_SETTINGS (설정)
   ├─ SYS_CODES (공통코드)
   ├─ SYS_LOGS (로그)
   └─ SYS_DASHBOARDS (대시보드 관리)
```

### 2. 사무원 (STAFF) 그룹

```
STAFF_DASHBOARD
├─ DASHBOARD_STATISTICS (통계 섹션) - 읽기만
│  ├─ STAT_OVERVIEW
│  ├─ STAT_USERS
│  └─ STAT_CONSULTATIONS
│
├─ DASHBOARD_MANAGEMENT (관리 섹션) - 제한적
│  ├─ MGMT_SCHEDULES (일정 관리)
│  ├─ MGMT_CLIENTS (내담자 관리)
│  └─ MGMT_DOCUMENTS (문서 관리)
│
└─ DASHBOARD_OFFICE (사무 섹션)
   ├─ OFFICE_RECEPTION (접수 관리)
   ├─ OFFICE_DOCUMENTS (문서 작성)
   └─ OFFICE_COMMUNICATION (커뮤니케이션)
```

### 3. 상담사 (CONSULTANT) 그룹

```
CONSULTANT_DASHBOARD
├─ DASHBOARD_MY_CONSULTATIONS (내 상담 섹션)
│  ├─ CONSULT_SCHEDULE (상담 일정)
│  ├─ CONSULT_CLIENTS (담당 내담자)
│  ├─ CONSULT_SESSIONS (상담 회기)
│  └─ CONSULT_NOTES (상담 기록)
│
├─ DASHBOARD_CLIENT_MANAGEMENT (내담자 관리)
│  ├─ CLIENT_LIST (내담자 목록)
│  ├─ CLIENT_PROFILE (프로필 관리)
│  ├─ CLIENT_PROGRESS (진행 상황)
│  └─ CLIENT_REPORTS (상담 보고서)
│
├─ DASHBOARD_RESOURCES (리소스 섹션)
│  ├─ RESOURCE_MATERIALS (상담 자료)
│  ├─ RESOURCE_ASSESSMENTS (평가 도구)
│  └─ RESOURCE_LIBRARY (자료실)
│
└─ DASHBOARD_PERSONAL (개인 섹션)
   ├─ PERSONAL_SCHEDULE (내 일정)
   ├─ PERSONAL_PERFORMANCE (내 성과)
   └─ PERSONAL_SETTINGS (설정)
```

### 4. 내담자 (CLIENT) 그룹

```
CLIENT_DASHBOARD
├─ DASHBOARD_MY_WELLNESS (나의 웰니스)
│  ├─ WELLNESS_OVERVIEW (전체 개요)
│  ├─ WELLNESS_MOOD (기분 기록)
│  ├─ WELLNESS_JOURNAL (일기)
│  └─ WELLNESS_GOALS (목표 관리)
│
├─ DASHBOARD_CONSULTATIONS (상담 섹션)
│  ├─ CONSULT_BOOKING (상담 예약)
│  ├─ CONSULT_SCHEDULE (내 일정)
│  ├─ CONSULT_HISTORY (상담 내역)
│  └─ CONSULT_FEEDBACK (피드백)
│
├─ DASHBOARD_RESOURCES (리소스 섹션)
│  ├─ RESOURCE_CONTENT (콘텐츠)
│  ├─ RESOURCE_EXERCISES (실습 자료)
│  └─ RESOURCE_COMMUNITY (커뮤니티)
│
└─ DASHBOARD_PERSONAL (개인 섹션)
   ├─ PERSONAL_PROFILE (프로필)
   ├─ PERSONAL_PAYMENT (결제 내역)
   └─ PERSONAL_SETTINGS (설정)
```

---

## 🗂️ 데이터베이스 설계

### permission_groups 기본 데이터

```sql
-- ========================================
-- 1. 관리자 그룹
-- ========================================
INSERT INTO permission_groups (tenant_id, group_code, group_name, group_type, parent_group_code, sort_order) VALUES
-- 통계
(NULL, 'DASHBOARD_STATISTICS', '통계 섹션', 'DASHBOARD_SECTION', NULL, 1),
(NULL, 'STAT_OVERVIEW', '전체 개요', 'DASHBOARD_WIDGET', 'DASHBOARD_STATISTICS', 1),
(NULL, 'STAT_USERS', '사용자 통계', 'DASHBOARD_WIDGET', 'DASHBOARD_STATISTICS', 2),
(NULL, 'STAT_CONSULTATIONS', '상담 통계', 'DASHBOARD_WIDGET', 'DASHBOARD_STATISTICS', 3),
(NULL, 'STAT_REVENUE', '매출 통계', 'DASHBOARD_WIDGET', 'DASHBOARD_STATISTICS', 4),

-- 관리
(NULL, 'DASHBOARD_MANAGEMENT', '관리 섹션', 'DASHBOARD_SECTION', NULL, 2),
(NULL, 'MGMT_USERS', '사용자 관리', 'DASHBOARD_WIDGET', 'DASHBOARD_MANAGEMENT', 1),
(NULL, 'MGMT_CONSULTANTS', '상담사 관리', 'DASHBOARD_WIDGET', 'DASHBOARD_MANAGEMENT', 2),
(NULL, 'MGMT_CLIENTS', '내담자 관리', 'DASHBOARD_WIDGET', 'DASHBOARD_MANAGEMENT', 3),
(NULL, 'MGMT_SCHEDULES', '일정 관리', 'DASHBOARD_WIDGET', 'DASHBOARD_MANAGEMENT', 4),

-- ERP (관리자 전용)
(NULL, 'DASHBOARD_ERP', 'ERP 섹션', 'DASHBOARD_SECTION', NULL, 3),
(NULL, 'ERP_PURCHASE', '구매 관리', 'DASHBOARD_WIDGET', 'DASHBOARD_ERP', 1),
(NULL, 'ERP_FINANCIAL', '재무 관리', 'DASHBOARD_WIDGET', 'DASHBOARD_ERP', 2),
(NULL, 'ERP_BUDGET', '예산 관리', 'DASHBOARD_WIDGET', 'DASHBOARD_ERP', 3),

-- 시스템
(NULL, 'DASHBOARD_SYSTEM', '시스템 섹션', 'DASHBOARD_SECTION', NULL, 4),
(NULL, 'SYS_SETTINGS', '설정', 'DASHBOARD_WIDGET', 'DASHBOARD_SYSTEM', 1),
(NULL, 'SYS_CODES', '공통코드', 'DASHBOARD_WIDGET', 'DASHBOARD_SYSTEM', 2);

-- ========================================
-- 2. 사무원 그룹
-- ========================================
INSERT INTO permission_groups (tenant_id, group_code, group_name, group_type, parent_group_code, sort_order) VALUES
(NULL, 'DASHBOARD_OFFICE', '사무 섹션', 'DASHBOARD_SECTION', NULL, 5),
(NULL, 'OFFICE_RECEPTION', '접수 관리', 'DASHBOARD_WIDGET', 'DASHBOARD_OFFICE', 1),
(NULL, 'OFFICE_DOCUMENTS', '문서 작성', 'DASHBOARD_WIDGET', 'DASHBOARD_OFFICE', 2);

-- ========================================
-- 3. 상담사 그룹
-- ========================================
INSERT INTO permission_groups (tenant_id, group_code, group_name, group_type, parent_group_code, sort_order) VALUES
(NULL, 'DASHBOARD_MY_CONSULTATIONS', '내 상담 섹션', 'DASHBOARD_SECTION', NULL, 10),
(NULL, 'CONSULT_SCHEDULE', '상담 일정', 'DASHBOARD_WIDGET', 'DASHBOARD_MY_CONSULTATIONS', 1),
(NULL, 'CONSULT_CLIENTS', '담당 내담자', 'DASHBOARD_WIDGET', 'DASHBOARD_MY_CONSULTATIONS', 2),
(NULL, 'CONSULT_SESSIONS', '상담 회기', 'DASHBOARD_WIDGET', 'DASHBOARD_MY_CONSULTATIONS', 3),
(NULL, 'CONSULT_NOTES', '상담 기록', 'DASHBOARD_WIDGET', 'DASHBOARD_MY_CONSULTATIONS', 4),

(NULL, 'DASHBOARD_CLIENT_MANAGEMENT', '내담자 관리 섹션', 'DASHBOARD_SECTION', NULL, 11),
(NULL, 'CLIENT_LIST', '내담자 목록', 'DASHBOARD_WIDGET', 'DASHBOARD_CLIENT_MANAGEMENT', 1),
(NULL, 'CLIENT_PROFILE', '프로필 관리', 'DASHBOARD_WIDGET', 'DASHBOARD_CLIENT_MANAGEMENT', 2),
(NULL, 'CLIENT_PROGRESS', '진행 상황', 'DASHBOARD_WIDGET', 'DASHBOARD_CLIENT_MANAGEMENT', 3);

-- ========================================
-- 4. 내담자 그룹
-- ========================================
INSERT INTO permission_groups (tenant_id, group_code, group_name, group_type, parent_group_code, sort_order) VALUES
(NULL, 'DASHBOARD_MY_WELLNESS', '나의 웰니스 섹션', 'DASHBOARD_SECTION', NULL, 20),
(NULL, 'WELLNESS_OVERVIEW', '전체 개요', 'DASHBOARD_WIDGET', 'DASHBOARD_MY_WELLNESS', 1),
(NULL, 'WELLNESS_MOOD', '기분 기록', 'DASHBOARD_WIDGET', 'DASHBOARD_MY_WELLNESS', 2),
(NULL, 'WELLNESS_JOURNAL', '일기', 'DASHBOARD_WIDGET', 'DASHBOARD_MY_WELLNESS', 3),

(NULL, 'DASHBOARD_CONSULTATIONS', '상담 섹션', 'DASHBOARD_SECTION', NULL, 21),
(NULL, 'CONSULT_BOOKING', '상담 예약', 'DASHBOARD_WIDGET', 'DASHBOARD_CONSULTATIONS', 1),
(NULL, 'CONSULT_SCHEDULE', '내 일정', 'DASHBOARD_WIDGET', 'DASHBOARD_CONSULTATIONS', 2),
(NULL, 'CONSULT_HISTORY', '상담 내역', 'DASHBOARD_WIDGET', 'DASHBOARD_CONSULTATIONS', 3);
```

### 역할별 그룹 권한 매핑

```sql
-- ========================================
-- 관리자 (Director) 권한 매핑
-- ========================================
INSERT INTO role_permission_groups (tenant_id, tenant_role_id, permission_group_code, access_level)
SELECT 
    tr.tenant_id,
    tr.tenant_role_id,
    pg.group_code,
    'FULL'
FROM tenant_roles tr
CROSS JOIN permission_groups pg
WHERE tr.name_en = 'Director' 
  AND pg.tenant_id IS NULL
  AND pg.group_code IN (
    'DASHBOARD_STATISTICS', 'STAT_OVERVIEW', 'STAT_USERS', 'STAT_CONSULTATIONS', 'STAT_REVENUE',
    'DASHBOARD_MANAGEMENT', 'MGMT_USERS', 'MGMT_CONSULTANTS', 'MGMT_CLIENTS', 'MGMT_SCHEDULES',
    'DASHBOARD_ERP', 'ERP_PURCHASE', 'ERP_FINANCIAL', 'ERP_BUDGET',
    'DASHBOARD_SYSTEM', 'SYS_SETTINGS', 'SYS_CODES'
  );

-- ========================================
-- 사무원 (Staff) 권한 매핑 (ERP 제외)
-- ========================================
INSERT INTO role_permission_groups (tenant_id, tenant_role_id, permission_group_code, access_level)
SELECT 
    tr.tenant_id,
    tr.tenant_role_id,
    pg.group_code,
    CASE 
        WHEN pg.group_code LIKE 'STAT_%' THEN 'READ'
        ELSE 'WRITE'
    END
FROM tenant_roles tr
CROSS JOIN permission_groups pg
WHERE tr.name_en = 'Staff' 
  AND pg.tenant_id IS NULL
  AND pg.group_code IN (
    'DASHBOARD_STATISTICS', 'STAT_OVERVIEW', 'STAT_USERS', 'STAT_CONSULTATIONS',
    'DASHBOARD_MANAGEMENT', 'MGMT_SCHEDULES', 'MGMT_CLIENTS',
    'DASHBOARD_OFFICE', 'OFFICE_RECEPTION', 'OFFICE_DOCUMENTS'
  );

-- ========================================
-- 상담사 (Counselor) 권한 매핑
-- ========================================
INSERT INTO role_permission_groups (tenant_id, tenant_role_id, permission_group_code, access_level)
SELECT 
    tr.tenant_id,
    tr.tenant_role_id,
    pg.group_code,
    'FULL'
FROM tenant_roles tr
CROSS JOIN permission_groups pg
WHERE tr.name_en = 'Counselor' 
  AND pg.tenant_id IS NULL
  AND pg.group_code IN (
    'DASHBOARD_MY_CONSULTATIONS', 'CONSULT_SCHEDULE', 'CONSULT_CLIENTS', 'CONSULT_SESSIONS', 'CONSULT_NOTES',
    'DASHBOARD_CLIENT_MANAGEMENT', 'CLIENT_LIST', 'CLIENT_PROFILE', 'CLIENT_PROGRESS'
  );

-- ========================================
-- 내담자 (Client) 권한 매핑
-- ========================================
INSERT INTO role_permission_groups (tenant_id, tenant_role_id, permission_group_code, access_level)
SELECT 
    tr.tenant_id,
    tr.tenant_role_id,
    pg.group_code,
    'FULL'
FROM tenant_roles tr
CROSS JOIN permission_groups pg
WHERE tr.name_en = 'Client' 
  AND pg.tenant_id IS NULL
  AND pg.group_code IN (
    'DASHBOARD_MY_WELLNESS', 'WELLNESS_OVERVIEW', 'WELLNESS_MOOD', 'WELLNESS_JOURNAL',
    'DASHBOARD_CONSULTATIONS', 'CONSULT_BOOKING', 'CONSULT_SCHEDULE', 'CONSULT_HISTORY'
  );
```

---

## 💻 통합 대시보드 구현

### UnifiedDashboard.js

```javascript
import React from 'react';
import { usePermissionGroups } from '../../hooks/usePermissionGroups';
import { SECTION_COMPONENTS } from '../../constants/sectionComponents';

const UnifiedDashboard = () => {
    const { hasPermissionGroup, loading } = usePermissionGroups();

    if (loading) return <LoadingSpinner />;

    return (
        <div className="unified-dashboard">
            {/* ============ 관리자/사무원 섹션 ============ */}
            
            {/* 통계 섹션 */}
            {hasPermissionGroup('DASHBOARD_STATISTICS') && (
                <DashboardSection title="통계">
                    {hasPermissionGroup('STAT_OVERVIEW') && <StatOverview />}
                    {hasPermissionGroup('STAT_USERS') && <StatUsers />}
                    {hasPermissionGroup('STAT_CONSULTATIONS') && <StatConsultations />}
                    {hasPermissionGroup('STAT_REVENUE') && <StatRevenue />}
                </DashboardSection>
            )}

            {/* 관리 섹션 */}
            {hasPermissionGroup('DASHBOARD_MANAGEMENT') && (
                <DashboardSection title="관리">
                    {hasPermissionGroup('MGMT_USERS') && <MgmtUsers />}
                    {hasPermissionGroup('MGMT_CONSULTANTS') && <MgmtConsultants />}
                    {hasPermissionGroup('MGMT_CLIENTS') && <MgmtClients />}
                    {hasPermissionGroup('MGMT_SCHEDULES') && <MgmtSchedules />}
                </DashboardSection>
            )}

            {/* ERP 섹션 (관리자만) */}
            {hasPermissionGroup('DASHBOARD_ERP') && (
                <DashboardSection title="ERP 관리">
                    {hasPermissionGroup('ERP_PURCHASE') && <ErpPurchase />}
                    {hasPermissionGroup('ERP_FINANCIAL') && <ErpFinancial />}
                    {hasPermissionGroup('ERP_BUDGET') && <ErpBudget />}
                </DashboardSection>
            )}

            {/* 사무 섹션 (사무원) */}
            {hasPermissionGroup('DASHBOARD_OFFICE') && (
                <DashboardSection title="사무 관리">
                    {hasPermissionGroup('OFFICE_RECEPTION') && <OfficeReception />}
                    {hasPermissionGroup('OFFICE_DOCUMENTS') && <OfficeDocuments />}
                </DashboardSection>
            )}

            {/* ============ 상담사 섹션 ============ */}
            
            {/* 내 상담 섹션 */}
            {hasPermissionGroup('DASHBOARD_MY_CONSULTATIONS') && (
                <DashboardSection title="내 상담">
                    {hasPermissionGroup('CONSULT_SCHEDULE') && <ConsultSchedule />}
                    {hasPermissionGroup('CONSULT_CLIENTS') && <ConsultClients />}
                    {hasPermissionGroup('CONSULT_SESSIONS') && <ConsultSessions />}
                    {hasPermissionGroup('CONSULT_NOTES') && <ConsultNotes />}
                </DashboardSection>
            )}

            {/* 내담자 관리 섹션 */}
            {hasPermissionGroup('DASHBOARD_CLIENT_MANAGEMENT') && (
                <DashboardSection title="내담자 관리">
                    {hasPermissionGroup('CLIENT_LIST') && <ClientList />}
                    {hasPermissionGroup('CLIENT_PROFILE') && <ClientProfile />}
                    {hasPermissionGroup('CLIENT_PROGRESS') && <ClientProgress />}
                </DashboardSection>
            )}

            {/* ============ 내담자 섹션 ============ */}
            
            {/* 나의 웰니스 섹션 */}
            {hasPermissionGroup('DASHBOARD_MY_WELLNESS') && (
                <DashboardSection title="나의 웰니스">
                    {hasPermissionGroup('WELLNESS_OVERVIEW') && <WellnessOverview />}
                    {hasPermissionGroup('WELLNESS_MOOD') && <WellnessMood />}
                    {hasPermissionGroup('WELLNESS_JOURNAL') && <WellnessJournal />}
                </DashboardSection>
            )}

            {/* 상담 섹션 */}
            {hasPermissionGroup('DASHBOARD_CONSULTATIONS') && (
                <DashboardSection title="상담">
                    {hasPermissionGroup('CONSULT_BOOKING') && <ConsultBooking />}
                    {hasPermissionGroup('CONSULT_SCHEDULE') && <ConsultSchedule />}
                    {hasPermissionGroup('CONSULT_HISTORY') && <ConsultHistory />}
                </DashboardSection>
            )}

            {/* 시스템 섹션 */}
            {hasPermissionGroup('DASHBOARD_SYSTEM') && (
                <DashboardSection title="시스템">
                    {hasPermissionGroup('SYS_SETTINGS') && <SysSettings />}
                    {hasPermissionGroup('SYS_CODES') && <SysCodes />}
                </DashboardSection>
            )}
        </div>
    );
};

export default UnifiedDashboard;
```

---

## 🎯 역할별 대시보드 결과

### 관리자가 보는 화면
```
✅ 통계 섹션 (전체)
✅ 관리 섹션 (전체)
✅ ERP 섹션 (전체) ⭐
✅ 시스템 섹션 (전체)
```

### 사무원이 보는 화면
```
✅ 통계 섹션 (읽기만)
✅ 관리 섹션 (일정, 내담자만)
✅ 사무 섹션 (전체)
❌ ERP 섹션 (숨김) ⭐
❌ 시스템 섹션 (숨김)
```

### 상담사가 보는 화면
```
✅ 내 상담 섹션 (전체)
✅ 내담자 관리 섹션 (전체)
❌ 관리자 섹션 (숨김)
```

### 내담자가 보는 화면
```
✅ 나의 웰니스 섹션 (전체)
✅ 상담 섹션 (전체)
❌ 관리 섹션 (숨김)
```

---

## ✅ 장점 요약

1. **하나의 컴포넌트로 모든 역할 지원**
   - AdminDashboard, ConsultantDashboard, ClientDashboard 통합
   - 유지보수 용이

2. **그룹 코드만 추가하면 자동 생성**
   ```sql
   -- 새 섹션 추가
   INSERT INTO permission_groups VALUES (..., 'NEW_SECTION', ...);
   
   -- 역할에 권한 부여
   INSERT INTO role_permission_groups VALUES (..., 'ADMIN', 'NEW_SECTION', ...);
   
   -- 프론트엔드 자동 적용!
   {hasPermissionGroup('NEW_SECTION') && <NewSection />}
   ```

3. **테넌트별 커스터마이징 가능**
   - 테넌트마다 다른 섹션 구성 가능
   - 역할별 권한 세밀 조정 가능

4. **확장성 극대화**
   - 새 역할 추가 시 코드 수정 불필요
   - 그룹만 추가하면 끝

---

**작성 완료**: 2025-12-03  
**다음 작업**: 마이그레이션 SQL 실행 준비


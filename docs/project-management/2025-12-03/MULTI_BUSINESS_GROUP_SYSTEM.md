# 다업종 그룹 기반 권한 시스템 (상담소 + 학원)

**작성일**: 2025-12-03  
**목적**: 상담소, 학원 등 모든 업종을 그룹 코드 기반으로 통합 관리

---

## 🎯 핵심 개념

### 업종별 특성
```
상담소 (CONSULTATION)
├─ 역할: 원장, 상담사, 내담자, 사무원
├─ 특화 기능: 상담 관리, 회기 관리, 심리 평가
└─ 대시보드: 상담 통계, 내담자 관리

학원 (ACADEMY)
├─ 역할: 원장, 강사, 학생, 사무원
├─ 특화 기능: 수업 관리, 성적 관리, 출결 관리
└─ 대시보드: 학습 통계, 학생 관리
```

### 통합 전략
```
✅ 공통 그룹 (모든 업종)
- DASHBOARD_STATISTICS (통계)
- DASHBOARD_MANAGEMENT (관리)
- DASHBOARD_ERP (ERP)
- DASHBOARD_SYSTEM (시스템)

✅ 업종별 그룹 (비즈니스 타입별)
- CONSULTATION_* (상담소 전용)
- ACADEMY_* (학원 전용)
- HOSPITAL_* (병원 전용) - 향후 확장
```

---

## 📊 업종별 그룹 구조

### 1. 상담소 (CONSULTATION) 전용 그룹

```sql
-- ========================================
-- 상담소 전용 그룹
-- ========================================
INSERT INTO permission_groups (tenant_id, group_code, group_name, group_type, business_type, sort_order) VALUES
-- 상담 관리
(NULL, 'CONSULTATION_MANAGEMENT', '상담 관리 섹션', 'DASHBOARD_SECTION', 'CONSULTATION', 100),
(NULL, 'CONSULT_SESSIONS', '회기 관리', 'DASHBOARD_WIDGET', 'CONSULTATION', 101),
(NULL, 'CONSULT_ASSESSMENT', '심리 평가', 'DASHBOARD_WIDGET', 'CONSULTATION', 102),
(NULL, 'CONSULT_TREATMENT_PLAN', '치료 계획', 'DASHBOARD_WIDGET', 'CONSULTATION', 103),
(NULL, 'CONSULT_PROGRESS_NOTES', '진행 노트', 'DASHBOARD_WIDGET', 'CONSULTATION', 104),

-- 내담자 관리
(NULL, 'CLIENT_MANAGEMENT', '내담자 관리 섹션', 'DASHBOARD_SECTION', 'CONSULTATION', 110),
(NULL, 'CLIENT_INTAKE', '접수 관리', 'DASHBOARD_WIDGET', 'CONSULTATION', 111),
(NULL, 'CLIENT_PROFILE', '프로필 관리', 'DASHBOARD_WIDGET', 'CONSULTATION', 112),
(NULL, 'CLIENT_HISTORY', '상담 이력', 'DASHBOARD_WIDGET', 'CONSULTATION', 113),
(NULL, 'CLIENT_WELLNESS', '웰니스 관리', 'DASHBOARD_WIDGET', 'CONSULTATION', 114),

-- 상담사 관리
(NULL, 'CONSULTANT_MANAGEMENT', '상담사 관리 섹션', 'DASHBOARD_SECTION', 'CONSULTATION', 120),
(NULL, 'CONSULTANT_SCHEDULE', '상담사 일정', 'DASHBOARD_WIDGET', 'CONSULTATION', 121),
(NULL, 'CONSULTANT_PERFORMANCE', '상담사 성과', 'DASHBOARD_WIDGET', 'CONSULTATION', 122),
(NULL, 'CONSULTANT_SUPERVISION', '슈퍼비전', 'DASHBOARD_WIDGET', 'CONSULTATION', 123);
```

### 2. 학원 (ACADEMY) 전용 그룹

```sql
-- ========================================
-- 학원 전용 그룹
-- ========================================
INSERT INTO permission_groups (tenant_id, group_code, group_name, group_type, business_type, sort_order) VALUES
-- 수업 관리
(NULL, 'ACADEMY_CLASS_MANAGEMENT', '수업 관리 섹션', 'DASHBOARD_SECTION', 'ACADEMY', 200),
(NULL, 'CLASS_SCHEDULE', '수업 일정', 'DASHBOARD_WIDGET', 'ACADEMY', 201),
(NULL, 'CLASS_CURRICULUM', '커리큘럼 관리', 'DASHBOARD_WIDGET', 'ACADEMY', 202),
(NULL, 'CLASS_ATTENDANCE', '출결 관리', 'DASHBOARD_WIDGET', 'ACADEMY', 203),
(NULL, 'CLASS_MATERIALS', '수업 자료', 'DASHBOARD_WIDGET', 'ACADEMY', 204),

-- 학생 관리
(NULL, 'ACADEMY_STUDENT_MANAGEMENT', '학생 관리 섹션', 'DASHBOARD_SECTION', 'ACADEMY', 210),
(NULL, 'STUDENT_ENROLLMENT', '등록 관리', 'DASHBOARD_WIDGET', 'ACADEMY', 211),
(NULL, 'STUDENT_PROFILE', '학생 프로필', 'DASHBOARD_WIDGET', 'ACADEMY', 212),
(NULL, 'STUDENT_GRADES', '성적 관리', 'DASHBOARD_WIDGET', 'ACADEMY', 213),
(NULL, 'STUDENT_PROGRESS', '학습 진도', 'DASHBOARD_WIDGET', 'ACADEMY', 214),
(NULL, 'STUDENT_PARENT_COMM', '학부모 소통', 'DASHBOARD_WIDGET', 'ACADEMY', 215),

-- 강사 관리
(NULL, 'ACADEMY_TEACHER_MANAGEMENT', '강사 관리 섹션', 'DASHBOARD_SECTION', 'ACADEMY', 220),
(NULL, 'TEACHER_SCHEDULE', '강사 일정', 'DASHBOARD_WIDGET', 'ACADEMY', 221),
(NULL, 'TEACHER_PERFORMANCE', '강사 평가', 'DASHBOARD_WIDGET', 'ACADEMY', 222),
(NULL, 'TEACHER_TRAINING', '강사 교육', 'DASHBOARD_WIDGET', 'ACADEMY', 223),

-- 학원 특화 기능
(NULL, 'ACADEMY_EXAM_MANAGEMENT', '시험 관리 섹션', 'DASHBOARD_SECTION', 'ACADEMY', 230),
(NULL, 'EXAM_SCHEDULE', '시험 일정', 'DASHBOARD_WIDGET', 'ACADEMY', 231),
(NULL, 'EXAM_RESULTS', '시험 결과', 'DASHBOARD_WIDGET', 'ACADEMY', 232),
(NULL, 'EXAM_ANALYSIS', '성적 분석', 'DASHBOARD_WIDGET', 'ACADEMY', 233);
```

---

## 🗂️ 테이블 구조 수정

### permission_groups 테이블에 business_type 추가

```sql
ALTER TABLE permission_groups 
ADD COLUMN business_type VARCHAR(50) NULL COMMENT '업종 타입 (NULL=공통, CONSULTATION=상담소, ACADEMY=학원)' 
AFTER group_type;

-- 인덱스 추가
CREATE INDEX idx_business_type ON permission_groups(business_type);
```

---

## 💻 백엔드 구현

### PermissionGroupService.java 업데이트

```java
@Service
public class PermissionGroupService {
    
    /**
     * 테넌트의 업종에 맞는 그룹 조회
     */
    public List<PermissionGroup> getGroupsByBusinessType(String tenantId) {
        // 1. 테넌트 정보 조회
        Tenant tenant = tenantRepository.findById(tenantId)
            .orElseThrow(() -> new NotFoundException("테넌트를 찾을 수 없습니다"));
        
        String businessType = tenant.getBusinessType(); // CONSULTATION, ACADEMY 등
        
        // 2. 공통 그룹 + 업종별 그룹 조회
        return permissionGroupRepository.findByBusinessTypeInAndIsActiveTrue(
            Arrays.asList(null, businessType) // NULL (공통) + 해당 업종
        );
    }
    
    /**
     * 사용자의 권한 그룹 조회 (업종 필터링 포함)
     */
    public List<String> getUserPermissionGroups(String tenantId, String tenantRoleId) {
        // 1. 테넌트 업종 확인
        String businessType = getBusinessType(tenantId);
        
        // 2. 역할 권한 그룹 조회
        List<RolePermissionGroup> roleGroups = rolePermissionGroupRepository
            .findByTenantIdAndTenantRoleIdAndIsActiveTrue(tenantId, tenantRoleId);
        
        // 3. 업종에 맞는 그룹만 필터링
        return roleGroups.stream()
            .map(RolePermissionGroup::getPermissionGroupCode)
            .filter(groupCode -> isValidGroupForBusinessType(groupCode, businessType))
            .collect(Collectors.toList());
    }
    
    private boolean isValidGroupForBusinessType(String groupCode, String businessType) {
        PermissionGroup group = permissionGroupRepository
            .findByGroupCodeAndIsActiveTrue(groupCode)
            .orElse(null);
        
        if (group == null) return false;
        
        // 공통 그룹이거나 업종이 일치하면 true
        return group.getBusinessType() == null || 
               group.getBusinessType().equals(businessType);
    }
}
```

---

## 🎯 역할별 권한 매핑 (업종별)

### 상담소 - 원장 (Director)

```sql
INSERT INTO role_permission_groups (tenant_id, tenant_role_id, permission_group_code, access_level)
SELECT 
    tr.tenant_id,
    tr.tenant_role_id,
    pg.group_code,
    'FULL'
FROM tenant_roles tr
CROSS JOIN permission_groups pg
INNER JOIN tenants t ON tr.tenant_id = t.tenant_id
WHERE tr.name_en = 'Director' 
  AND t.business_type = 'CONSULTATION'
  AND (pg.business_type IS NULL OR pg.business_type = 'CONSULTATION')
  AND pg.group_code IN (
    -- 공통 그룹
    'DASHBOARD_STATISTICS', 'DASHBOARD_MANAGEMENT', 'DASHBOARD_ERP', 'DASHBOARD_SYSTEM',
    -- 상담소 전용 그룹
    'CONSULTATION_MANAGEMENT', 'CLIENT_MANAGEMENT', 'CONSULTANT_MANAGEMENT'
  );
```

### 학원 - 원장 (Director)

```sql
INSERT INTO role_permission_groups (tenant_id, tenant_role_id, permission_group_code, access_level)
SELECT 
    tr.tenant_id,
    tr.tenant_role_id,
    pg.group_code,
    'FULL'
FROM tenant_roles tr
CROSS JOIN permission_groups pg
INNER JOIN tenants t ON tr.tenant_id = t.tenant_id
WHERE tr.name_en = 'Director' 
  AND t.business_type = 'ACADEMY'
  AND (pg.business_type IS NULL OR pg.business_type = 'ACADEMY')
  AND pg.group_code IN (
    -- 공통 그룹
    'DASHBOARD_STATISTICS', 'DASHBOARD_MANAGEMENT', 'DASHBOARD_ERP', 'DASHBOARD_SYSTEM',
    -- 학원 전용 그룹
    'ACADEMY_CLASS_MANAGEMENT', 'ACADEMY_STUDENT_MANAGEMENT', 'ACADEMY_TEACHER_MANAGEMENT', 'ACADEMY_EXAM_MANAGEMENT'
  );
```

### 상담소 - 상담사 (Counselor)

```sql
INSERT INTO role_permission_groups (tenant_id, tenant_role_id, permission_group_code, access_level)
SELECT 
    tr.tenant_id,
    tr.tenant_role_id,
    pg.group_code,
    'FULL'
FROM tenant_roles tr
CROSS JOIN permission_groups pg
INNER JOIN tenants t ON tr.tenant_id = t.tenant_id
WHERE tr.name_en = 'Counselor' 
  AND t.business_type = 'CONSULTATION'
  AND (pg.business_type IS NULL OR pg.business_type = 'CONSULTATION')
  AND pg.group_code IN (
    'CONSULTATION_MANAGEMENT', 'CONSULT_SESSIONS', 'CONSULT_ASSESSMENT', 'CONSULT_PROGRESS_NOTES',
    'CLIENT_MANAGEMENT', 'CLIENT_PROFILE', 'CLIENT_HISTORY', 'CLIENT_WELLNESS'
  );
```

### 학원 - 강사 (Teacher)

```sql
INSERT INTO role_permission_groups (tenant_id, tenant_role_id, permission_group_code, access_level)
SELECT 
    tr.tenant_id,
    tr.tenant_role_id,
    pg.group_code,
    'FULL'
FROM tenant_roles tr
CROSS JOIN permission_groups pg
INNER JOIN tenants t ON tr.tenant_id = t.tenant_id
WHERE tr.name_en = 'Teacher' 
  AND t.business_type = 'ACADEMY'
  AND (pg.business_type IS NULL OR pg.business_type = 'ACADEMY')
  AND pg.group_code IN (
    'ACADEMY_CLASS_MANAGEMENT', 'CLASS_SCHEDULE', 'CLASS_CURRICULUM', 'CLASS_ATTENDANCE',
    'ACADEMY_STUDENT_MANAGEMENT', 'STUDENT_GRADES', 'STUDENT_PROGRESS'
  );
```

---

## 💻 프론트엔드 구현

### UnifiedDashboard.js (업종 자동 감지)

```javascript
import React, { useEffect, useState } from 'react';
import { usePermissionGroups } from '../../hooks/usePermissionGroups';
import { useTenant } from '../../hooks/useTenant';

const UnifiedDashboard = () => {
    const { hasPermissionGroup, loading: permLoading } = usePermissionGroups();
    const { tenant, loading: tenantLoading } = useTenant();
    
    if (permLoading || tenantLoading) return <LoadingSpinner />;
    
    const businessType = tenant?.businessType; // 'CONSULTATION' or 'ACADEMY'

    return (
        <div className="unified-dashboard">
            {/* ============ 공통 섹션 (모든 업종) ============ */}
            
            {hasPermissionGroup('DASHBOARD_STATISTICS') && (
                <DashboardSection title="통계">
                    <StatisticsContent />
                </DashboardSection>
            )}

            {hasPermissionGroup('DASHBOARD_MANAGEMENT') && (
                <DashboardSection title="관리">
                    <ManagementContent />
                </DashboardSection>
            )}

            {hasPermissionGroup('DASHBOARD_ERP') && (
                <DashboardSection title="ERP 관리">
                    <ERPContent />
                </DashboardSection>
            )}

            {/* ============ 상담소 전용 섹션 ============ */}
            
            {businessType === 'CONSULTATION' && (
                <>
                    {hasPermissionGroup('CONSULTATION_MANAGEMENT') && (
                        <DashboardSection title="상담 관리">
                            {hasPermissionGroup('CONSULT_SESSIONS') && <ConsultSessions />}
                            {hasPermissionGroup('CONSULT_ASSESSMENT') && <ConsultAssessment />}
                            {hasPermissionGroup('CONSULT_PROGRESS_NOTES') && <ProgressNotes />}
                        </DashboardSection>
                    )}

                    {hasPermissionGroup('CLIENT_MANAGEMENT') && (
                        <DashboardSection title="내담자 관리">
                            {hasPermissionGroup('CLIENT_INTAKE') && <ClientIntake />}
                            {hasPermissionGroup('CLIENT_PROFILE') && <ClientProfile />}
                            {hasPermissionGroup('CLIENT_WELLNESS') && <ClientWellness />}
                        </DashboardSection>
                    )}
                </>
            )}

            {/* ============ 학원 전용 섹션 ============ */}
            
            {businessType === 'ACADEMY' && (
                <>
                    {hasPermissionGroup('ACADEMY_CLASS_MANAGEMENT') && (
                        <DashboardSection title="수업 관리">
                            {hasPermissionGroup('CLASS_SCHEDULE') && <ClassSchedule />}
                            {hasPermissionGroup('CLASS_CURRICULUM') && <ClassCurriculum />}
                            {hasPermissionGroup('CLASS_ATTENDANCE') && <ClassAttendance />}
                        </DashboardSection>
                    )}

                    {hasPermissionGroup('ACADEMY_STUDENT_MANAGEMENT') && (
                        <DashboardSection title="학생 관리">
                            {hasPermissionGroup('STUDENT_ENROLLMENT') && <StudentEnrollment />}
                            {hasPermissionGroup('STUDENT_GRADES') && <StudentGrades />}
                            {hasPermissionGroup('STUDENT_PROGRESS') && <StudentProgress />}
                        </DashboardSection>
                    )}

                    {hasPermissionGroup('ACADEMY_EXAM_MANAGEMENT') && (
                        <DashboardSection title="시험 관리">
                            {hasPermissionGroup('EXAM_SCHEDULE') && <ExamSchedule />}
                            {hasPermissionGroup('EXAM_RESULTS') && <ExamResults />}
                            {hasPermissionGroup('EXAM_ANALYSIS') && <ExamAnalysis />}
                        </DashboardSection>
                    )}
                </>
            )}

            {/* ============ 시스템 섹션 ============ */}
            
            {hasPermissionGroup('DASHBOARD_SYSTEM') && (
                <DashboardSection title="시스템">
                    <SystemContent />
                </DashboardSection>
            )}
        </div>
    );
};

export default UnifiedDashboard;
```

---

## 🎯 결과 시뮬레이션

### 상담소 원장이 보는 화면
```
✅ 통계 섹션 (공통)
✅ 관리 섹션 (공통)
✅ ERP 섹션 (공통)
✅ 상담 관리 섹션 (상담소 전용)
✅ 내담자 관리 섹션 (상담소 전용)
✅ 상담사 관리 섹션 (상담소 전용)
✅ 시스템 섹션 (공통)
❌ 학원 관련 섹션 (숨김)
```

### 학원 원장이 보는 화면
```
✅ 통계 섹션 (공통)
✅ 관리 섹션 (공통)
✅ ERP 섹션 (공통)
✅ 수업 관리 섹션 (학원 전용)
✅ 학생 관리 섹션 (학원 전용)
✅ 강사 관리 섹션 (학원 전용)
✅ 시험 관리 섹션 (학원 전용)
✅ 시스템 섹션 (공통)
❌ 상담소 관련 섹션 (숨김)
```

### 상담소 상담사가 보는 화면
```
✅ 상담 관리 섹션 (상담소 전용)
✅ 내담자 관리 섹션 (상담소 전용)
❌ ERP 섹션 (숨김)
❌ 시스템 섹션 (숨김)
❌ 학원 관련 섹션 (숨김)
```

### 학원 강사가 보는 화면
```
✅ 수업 관리 섹션 (학원 전용)
✅ 학생 관리 섹션 (학원 전용)
❌ ERP 섹션 (숨김)
❌ 시스템 섹션 (숨김)
❌ 상담소 관련 섹션 (숨김)
```

---

## ✅ 장점

### 1. 업종 확장 용이
```sql
-- 새 업종 추가 (예: 병원)
INSERT INTO permission_groups VALUES 
(..., 'HOSPITAL_PATIENT_MANAGEMENT', '환자 관리', ..., 'HOSPITAL', ...);

-- 자동으로 병원 테넌트에만 표시됨!
```

### 2. 코드 수정 불필요
- 상담소 추가 → SQL만 추가
- 학원 추가 → SQL만 추가
- 병원 추가 → SQL만 추가
- **프론트엔드 코드 변경 없음!**

### 3. 테넌트별 커스터마이징
```sql
-- 특정 학원만 특별한 기능 추가
INSERT INTO permission_groups VALUES 
('TENANT-ACADEMY-001', 'CUSTOM_FEATURE', '맞춤 기능', ..., 'ACADEMY', ...);
```

---

## 📋 마이그레이션 순서

```
1. permission_groups 테이블에 business_type 컬럼 추가
2. 공통 그룹 데이터 삽입 (business_type = NULL)
3. 상담소 전용 그룹 삽입 (business_type = 'CONSULTATION')
4. 학원 전용 그룹 삽입 (business_type = 'ACADEMY')
5. 역할별 권한 매핑 (업종별로)
6. 백엔드 Service 업데이트
7. 프론트엔드 UnifiedDashboard 적용
```

---

**작성 완료**: 2025-12-03  
**확장 가능 업종**: 상담소, 학원, 병원, 요양원, 복지관 등 무한 확장 가능!


# 완전 동적 권한 시스템 구현 (2025-11-27)

**작성일**: 2025-11-27  
**목적**: 하드코딩 제거 및 테넌트별/전역 공통코드 기반 동적 권한 시스템 구축

---

## 🎯 **구현 목표**

### 기존 문제점
- ❌ **하드코딩된 권한**: `List.of("ADMIN_DASHBOARD_VIEW", "USER_MANAGE")`
- ❌ **정적 역할 매핑**: 코드에서 역할별 권한 정의
- ❌ **확장성 부족**: 새 권한 추가 시 코드 수정 필요

### 새로운 시스템
- ✅ **공통코드 기반**: 모든 권한이 `common_codes` 테이블에서 관리
- ✅ **테넌트별/전역 분리**: `tenant_id`로 구분
- ✅ **완전 동적**: 코드 수정 없이 권한 추가/제거

---

## 🏗️ **시스템 구조**

### 공통코드 분리 전략

#### 전역 공통코드 (tenant_id = NULL)
```sql
-- 시스템 레벨 기본 권한 정의
code_group = 'CORE_ADMIN_PERMISSIONS'
- DASHBOARD_VIEW (기본 대시보드 접근)
- USER_MANAGE (기본 사용자 관리)
- SYSTEM_STATUS_VIEW (기본 시스템 상태)
```

#### 테넌트별 공통코드 (tenant_id = 실제값)  
```sql
-- 각 테넌트가 커스터마이징할 수 있는 권한
code_group = 'ADMIN_PERMISSIONS' 
- 기본 권한들 + 테넌트별 추가 권한
- 상담소: CONSULTATION_MANAGE, SESSION_VIEW
- 학원: CLASS_MANAGE, ATTENDANCE_VIEW
```

### 권한 메타데이터 구조
```json
{
  "category": "ADMIN",
  "auto_grant": true,         // 자동 부여 여부
  "level": 100,              // 권한 레벨
  "customizable": true,      // 테넌트별 커스터마이징 가능
  "description": "관리자 기본 권한"
}
```

---

## 🔄 **동적 권한 플로우**

### 1. 권한 초기화
```java
// 1. 전역 권한을 테넌트별로 복사
copyGlobalPermissionsToTenant(tenantId);

// 2. 테넌트별 권한을 role_permissions에 적용  
updateRolePermissionsFromTenantCodes(tenantId, "ADMIN");
```

### 2. 권한 확인
```java
// 1. 테넌트별 권한 우선 조회
List<CommonCode> permissions = commonCodeService.getTenantCodesByGroup(tenantId, "ADMIN_PERMISSIONS");

// 2. 없으면 전역 권한으로 폴백
if (permissions.isEmpty()) {
    permissions = commonCodeService.getCoreCodesByGroup("CORE_ADMIN_PERMISSIONS");
}

// 3. role_permissions 테이블과 매칭
boolean hasPermission = permissions.contains(requestedPermission);
```

### 3. 권한 커스터마이징
```sql  
-- 테넌트별 권한 추가
INSERT INTO common_codes (tenant_id, code_group, code_value, code_label, extra_data) 
VALUES ('tenant-abc-123', 'ADMIN_PERMISSIONS', 'CUSTOM_FEATURE', '커스텀 기능', '{"auto_grant": true}');

-- 권한 비활성화 (제거가 아닌)
UPDATE common_codes 
SET is_active = 0 
WHERE tenant_id = 'tenant-abc-123' AND code_group = 'ADMIN_PERMISSIONS' AND code_value = 'UNWANTED_PERMISSION';
```

---

## 📊 **구현 완료 상태**

### 데이터베이스
- ✅ **테넌트별 권한 복사**: 전역 → `tenant-unknown-consultation-001`
- ✅ **role_permissions 갱신**: 테넌트별 권한 기반으로 생성
- ✅ **메타데이터**: `auto_grant`, `category` 정보 포함

### 백엔드 서비스  
- ✅ **DynamicAdminPermissionService**: 공통코드 기반 권한 관리
- ✅ **CommonCodeServiceImpl**: 테넌트별/전역 분리 조회
- ✅ **PermissionInitializationServiceImpl**: 동적 권한 초기화

### 권한 확인 결과
```
role_name: ADMIN
permission_code: DASHBOARD_VIEW, USER_MANAGE, CLIENT_MANAGE, 
                 CONSULTANT_MANAGE, MAPPING_VIEW, SCHEDULE_MANAGE, STATISTICS_VIEW
granted_by: TENANT_DYNAMIC
```

---

## 🎯 **커스터마이징 시나리오**

### 상담소 테넌트 전용 권한 추가
```sql
INSERT INTO common_codes (tenant_id, code_group, code_value, code_label, korean_name, extra_data) 
VALUES ('tenant-unknown-consultation-001', 'ADMIN_PERMISSIONS', 'SESSION_RECORD_MANAGE', '상담 기록 관리', '상담 기록 관리', '{"auto_grant": true, "business_specific": "CONSULTATION"}');
```

### 학원 테넌트 전용 권한 추가
```sql  
INSERT INTO common_codes (tenant_id, 'tenant-abc-academy-001', code_group, code_value, code_label, korean_name, extra_data) 
VALUES ('tenant-abc-academy-001', 'ADMIN_PERMISSIONS', 'CLASS_SCHEDULE_MANAGE', '수업 일정 관리', '수업 일정 관리', '{"auto_grant": true, "business_specific": "ACADEMY"}');
```

### 권한 비활성화 (특정 테넌트에서만)
```sql
UPDATE common_codes 
SET is_active = 0 
WHERE tenant_id = 'tenant-unknown-consultation-001' 
AND code_group = 'ADMIN_PERMISSIONS' 
AND code_value = 'FINANCIAL_VIEW'; -- 재무 조회 권한 제거
```

---

## 🚀 **확장 가능성**

### 새로운 업종 추가
1. 해당 업종의 기본 권한을 전역 코드로 정의
2. 각 테넌트에 자동 복사
3. 테넌트별 커스터마이징

### 권한 상속
1. 상위 역할의 권한을 하위 역할이 상속
2. 공통코드 메타데이터로 상속 관계 정의
3. 동적 권한 계산

### API 기반 권한 관리
1. `/api/admin/permissions` - 테넌트별 권한 관리
2. 실시간 권한 추가/제거/수정
3. 즉시 적용 (캐시 무효화)

---

## 📝 **다음 단계**

1. **브라우저 새로고침 테스트**: 현재 권한 적용 확인
2. **햄버거 메뉴 표시**: 관리자 메뉴들 정상 표시 확인  
3. **브랜딩 정보**: "테스트 상담소" 표시 확인
4. **권한 API**: 테넌트별 권한 관리 UI 구현

---

**핵심**: 이제 **완전히 동적인 권한 시스템**이 됩니다! 코드 수정 없이 데이터베이스에서 권한을 실시간으로 관리할 수 있습니다.

---

**마지막 업데이트**: 2025-11-27 16:23

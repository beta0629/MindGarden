# 역할 공통코드 분리 계획

**작성일:** 2025-12-03  
**목표:** 시스템 공통코드와 테넌트 공통코드 명확히 분리  
**우선순위:** 🔥 최우선 (역할 시스템 마이그레이션 전 필수)

---

## 📋 현재 문제점

### 1. **역할 코드가 어디에 속하는지 불명확**
- `USER_ROLE` 코드 그룹이 시스템 공통코드인지 테넌트 공통코드인지 모호
- 레거시 역할들이 혼재되어 있음

### 2. **등급(Grade) 코드가 정의되지 않음**
- `ADMIN_GRADE`, `CONSULTANT_GRADE`, `CLIENT_GRADE` 코드 그룹 없음
- 등급 시스템이 하드코딩되어 있음

---

## 🎯 분리 전략

### ✅ 권장 방안: 3단계 구조

```
┌─────────────────────────────────────────────────────────┐
│ 1단계: 시스템 공통코드 (common_codes, tenant_id = NULL) │
├─────────────────────────────────────────────────────────┤
│ - USER_ROLE_TEMPLATE: 기본 역할 템플릿 (4개)             │
│   * ADMIN (관리자)                                       │
│   * CONSULTANT (상담사/강사/의사)                        │
│   * CLIENT (내담자/학생/환자)                            │
│   * STAFF (사무원)                                       │
│                                                          │
│ - ADMIN_GRADE: 관리자 등급 정의                          │
│ - CONSULTANT_GRADE: 상담사 등급 정의                     │
│ - CLIENT_GRADE: 내담자 등급 정의                         │
│                                                          │
│ ⚠️ 시스템 관리자만 수정 가능                             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 2단계: 테넌트 공통코드 (common_codes, tenant_id = UUID) │
├─────────────────────────────────────────────────────────┤
│ - USER_ROLE: 테넌트별 역할 정의 (무제한 추가 가능)       │
│   * 기본 4개 (템플릿에서 복사)                           │
│   * 커스텀 역할 (테넌트 관리자가 추가)                   │
│     - 수석 상담사                                        │
│     - 인턴 상담사                                        │
│     - 학부모                                             │
│     - 간호팀장                                           │
│     - 의료 코디네이터                                    │
│     - 등등...                                            │
│                                                          │
│ ✅ 테넌트 관리자가 추가/수정/삭제 가능                   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 3단계: 사용자 역할 매핑 (users 테이블)                  │
├─────────────────────────────────────────────────────────┤
│ - user.role: 테넌트 공통코드의 role_code 참조           │
│ - user.grade: 등급 코드 참조 (선택)                     │
│                                                          │
│ 예시:                                                    │
│ - user1: role="ADMIN", grade="ADMIN_SUPER"              │
│ - user2: role="SENIOR_CONSULTANT", grade=NULL           │
│ - user3: role="PARENT", grade=NULL                      │
└─────────────────────────────────────────────────────────┘
```

### 핵심 차이점

**기존 방안 (2단계)**:
- 역할이 시스템 고정 (5개만)
- 테넌트는 역할명만 커스터마이징

**새로운 방안 (3단계)** ⭐:
- 역할 템플릿만 시스템 고정 (4개)
- 테넌트는 역할을 **무제한 추가/수정/삭제** 가능
- 각 역할마다 독립적인 권한 설정
- 각 역할마다 독립적인 대시보드

---

## 📊 데이터베이스 구조

### 1. 시스템 공통코드 (common_codes)

```sql
-- ===== 역할 템플릿 코드 그룹 =====
-- tenant_id = NULL (시스템 공통코드)

-- USER_ROLE_TEMPLATE: 기본 역할 템플릿 (테넌트 생성 시 복사용)
INSERT INTO common_codes (tenant_id, code_group, code_value, code_label, korean_name, sort_order, is_active, extra_data)
VALUES 
    (NULL, 'USER_ROLE_TEMPLATE', 'ADMIN', 'Admin', '관리자', 1, true, '{"default_permissions": ["ALL"], "dashboard_type": "ADMIN"}'),
    (NULL, 'USER_ROLE_TEMPLATE', 'CONSULTANT', 'Consultant', '상담사', 2, true, '{"default_permissions": ["SCHEDULE_MANAGE", "CLIENT_VIEW"], "dashboard_type": "CONSULTANT"}'),
    (NULL, 'USER_ROLE_TEMPLATE', 'CLIENT', 'Client', '내담자', 3, true, '{"default_permissions": ["SCHEDULE_VIEW"], "dashboard_type": "CLIENT"}'),
    (NULL, 'USER_ROLE_TEMPLATE', 'STAFF', 'Staff', '사무원', 4, true, '{"default_permissions": ["SCHEDULE_MANAGE", "CLIENT_MANAGE"], "dashboard_type": "STAFF"}');

-- ADMIN_GRADE: 관리자 등급
INSERT INTO common_codes (tenant_id, code_group, code_value, code_label, korean_name, sort_order, is_active, extra_data)
VALUES 
    (NULL, 'ADMIN_GRADE', 'ADMIN_MANAGER', 'Manager', '매니저', 1, true, '{"level": 1, "color": "#6b7280"}'),
    (NULL, 'ADMIN_GRADE', 'ADMIN_DIRECTOR', 'Director', '디렉터', 2, true, '{"level": 2, "color": "#3b82f6"}'),
    (NULL, 'ADMIN_GRADE', 'ADMIN_EXECUTIVE', 'Executive', '임원', 3, true, '{"level": 3, "color": "#8b5cf6"}'),
    (NULL, 'ADMIN_GRADE', 'ADMIN_SUPER', 'Super Admin', '최고 관리자', 4, true, '{"level": 4, "color": "#7c3aed"}');

-- CONSULTANT_GRADE: 상담사 등급
INSERT INTO common_codes (tenant_id, code_group, code_value, code_label, korean_name, sort_order, is_active, extra_data)
VALUES 
    (NULL, 'CONSULTANT_GRADE', 'CONSULTANT_JUNIOR', 'Junior', '주니어', 1, true, '{"level": 1, "color": "#3b82f6", "fee_rate": 0.50}'),
    (NULL, 'CONSULTANT_GRADE', 'CONSULTANT_SENIOR', 'Senior', '시니어', 2, true, '{"level": 2, "color": "#10b981", "fee_rate": 0.60}'),
    (NULL, 'CONSULTANT_GRADE', 'CONSULTANT_EXPERT', 'Expert', '엑스퍼트', 3, true, '{"level": 3, "color": "#f59e0b", "fee_rate": 0.70}'),
    (NULL, 'CONSULTANT_GRADE', 'CONSULTANT_MASTER', 'Master', '마스터', 4, true, '{"level": 4, "color": "#6366f1", "fee_rate": 0.80}');

-- CLIENT_GRADE: 내담자 등급
INSERT INTO common_codes (tenant_id, code_group, code_value, code_label, korean_name, sort_order, is_active, extra_data)
VALUES 
    (NULL, 'CLIENT_GRADE', 'CLIENT_BRONZE', 'Bronze', '브론즈', 1, true, '{"level": 1, "color": "#cd7f32", "discount": 0.00, "min_sessions": 0}'),
    (NULL, 'CLIENT_GRADE', 'CLIENT_SILVER', 'Silver', '실버', 2, true, '{"level": 2, "color": "#c0c0c0", "discount": 0.05, "min_sessions": 10}'),
    (NULL, 'CLIENT_GRADE', 'CLIENT_GOLD', 'Gold', '골드', 3, true, '{"level": 3, "color": "#ffd700", "discount": 0.10, "min_sessions": 30}'),
    (NULL, 'CLIENT_GRADE', 'CLIENT_PLATINUM', 'Platinum', '플래티넘', 4, true, '{"level": 4, "color": "#e5e4e2", "discount": 0.15, "min_sessions": 50}');
```

### 2. 코드 그룹 메타데이터 (code_group_metadata)

```sql
-- 코드 그룹 타입 정의
INSERT INTO code_group_metadata (code_group, group_name, code_type, description, is_active)
VALUES 
    ('USER_ROLE', '사용자 역할', 'CORE', '시스템 핵심 역할 (5개)', true),
    ('ADMIN_GRADE', '관리자 등급', 'CORE', '관리자 등급 (4단계)', true),
    ('CONSULTANT_GRADE', '상담사 등급', 'CORE', '상담사 등급 (4단계)', true),
    ('CLIENT_GRADE', '내담자 등급', 'CORE', '내담자 등급 (4단계)', true);
```

### 2. 테넌트 공통코드 (common_codes)

```sql
-- ===== 테넌트별 역할 코드 그룹 =====
-- tenant_id = UUID (테넌트 공통코드)

-- 예시: 상담소 테넌트 (tenant-001)
-- 기본 4개 역할 (템플릿에서 복사)
INSERT INTO common_codes (tenant_id, code_group, code_value, code_label, korean_name, sort_order, is_active, extra_data)
VALUES 
    ('tenant-001', 'USER_ROLE', 'ADMIN', '원장', '원장', 1, true, '{"permissions": ["ALL"], "dashboard_type": "ADMIN"}'),
    ('tenant-001', 'USER_ROLE', 'CONSULTANT', '상담사', '상담사', 2, true, '{"permissions": ["SCHEDULE_MANAGE", "CLIENT_VIEW"], "dashboard_type": "CONSULTANT"}'),
    ('tenant-001', 'USER_ROLE', 'CLIENT', '내담자', '내담자', 3, true, '{"permissions": ["SCHEDULE_VIEW"], "dashboard_type": "CLIENT"}'),
    ('tenant-001', 'USER_ROLE', 'STAFF', '사무원', '사무원', 4, true, '{"permissions": ["SCHEDULE_MANAGE", "CLIENT_MANAGE"], "dashboard_type": "STAFF"}');

-- 커스텀 역할 (테넌트 관리자가 추가)
INSERT INTO common_codes (tenant_id, code_group, code_value, code_label, korean_name, sort_order, is_active, extra_data)
VALUES 
    ('tenant-001', 'USER_ROLE', 'SENIOR_CONSULTANT', '수석 상담사', '수석 상담사', 5, true, '{"permissions": ["SCHEDULE_MANAGE", "CLIENT_VIEW", "CONSULTANT_MANAGE"], "dashboard_type": "CONSULTANT"}'),
    ('tenant-001', 'USER_ROLE', 'INTERN_CONSULTANT', '인턴 상담사', '인턴 상담사', 6, true, '{"permissions": ["SCHEDULE_VIEW", "CLIENT_VIEW"], "dashboard_type": "CONSULTANT"}');

-- 예시: 학원 테넌트 (tenant-002)
-- 기본 4개 역할 + 학부모
INSERT INTO common_codes (tenant_id, code_group, code_value, code_label, korean_name, sort_order, is_active, extra_data)
VALUES 
    ('tenant-002', 'USER_ROLE', 'ADMIN', '원장', '원장', 1, true, '{"permissions": ["ALL"], "dashboard_type": "ADMIN"}'),
    ('tenant-002', 'USER_ROLE', 'CONSULTANT', '강사', '강사', 2, true, '{"permissions": ["SCHEDULE_MANAGE", "CLIENT_VIEW"], "dashboard_type": "CONSULTANT"}'),
    ('tenant-002', 'USER_ROLE', 'CLIENT', '학생', '학생', 3, true, '{"permissions": ["SCHEDULE_VIEW"], "dashboard_type": "CLIENT"}'),
    ('tenant-002', 'USER_ROLE', 'STAFF', '행정직원', '행정직원', 4, true, '{"permissions": ["SCHEDULE_MANAGE", "CLIENT_MANAGE"], "dashboard_type": "STAFF"}'),
    ('tenant-002', 'USER_ROLE', 'PARENT', '학부모', '학부모', 5, true, '{"permissions": ["CHILD_VIEW"], "dashboard_type": "PARENT"}');

-- 커스텀 역할 (테넌트 관리자가 추가)
INSERT INTO common_codes (tenant_id, code_group, code_value, code_label, korean_name, sort_order, is_active, extra_data)
VALUES 
    ('tenant-002', 'USER_ROLE', 'HEAD_INSTRUCTOR', '수석 강사', '수석 강사', 6, true, '{"permissions": ["SCHEDULE_MANAGE", "CLIENT_VIEW", "CONSULTANT_MANAGE"], "dashboard_type": "CONSULTANT"}'),
    ('tenant-002', 'USER_ROLE', 'LEARNING_MANAGER', '학습 매니저', '학습 매니저', 7, true, '{"permissions": ["CLIENT_MANAGE", "PARENT_CONTACT"], "dashboard_type": "STAFF"}');
```

### 3. 사용자 테이블 (users)

```sql
-- 사용자의 역할은 테넌트 공통코드의 code_value를 참조
-- 예시 데이터

-- 상담소 테넌트 (tenant-001)
INSERT INTO users (tenant_id, username, email, role, grade, is_active)
VALUES 
    ('tenant-001', 'admin1', 'admin@example.com', 'ADMIN', 'ADMIN_SUPER', true),
    ('tenant-001', 'consultant1', 'consultant1@example.com', 'SENIOR_CONSULTANT', 'CONSULTANT_MASTER', true),
    ('tenant-001', 'consultant2', 'consultant2@example.com', 'CONSULTANT', 'CONSULTANT_SENIOR', true),
    ('tenant-001', 'intern1', 'intern1@example.com', 'INTERN_CONSULTANT', 'CONSULTANT_JUNIOR', true),
    ('tenant-001', 'client1', 'client1@example.com', 'CLIENT', 'CLIENT_GOLD', true);

-- 학원 테넌트 (tenant-002)
INSERT INTO users (tenant_id, username, email, role, grade, is_active)
VALUES 
    ('tenant-002', 'admin2', 'admin@school.com', 'ADMIN', 'ADMIN_DIRECTOR', true),
    ('tenant-002', 'teacher1', 'teacher1@school.com', 'HEAD_INSTRUCTOR', 'CONSULTANT_EXPERT', true),
    ('tenant-002', 'teacher2', 'teacher2@school.com', 'CONSULTANT', 'CONSULTANT_SENIOR', true),
    ('tenant-002', 'student1', 'student1@school.com', 'CLIENT', 'CLIENT_SILVER', true),
    ('tenant-002', 'parent1', 'parent1@school.com', 'PARENT', NULL, true),
    ('tenant-002', 'manager1', 'manager1@school.com', 'LEARNING_MANAGER', NULL, true);
```

---

## 🔄 마이그레이션 절차

### Phase 1: 시스템 공통코드 정리 (2시간)

#### 1.1 레거시 역할 코드 삭제
```sql
-- 1. 레거시 역할 삭제
DELETE FROM common_codes 
WHERE code_group = 'USER_ROLE' 
AND code_value IN (
    'BRANCH_ADMIN', 
    'BRANCH_SUPER_ADMIN', 
    'HQ_ADMIN', 
    'SUPER_HQ_ADMIN', 
    'HQ_MASTER', 
    'HQ_SUPER_ADMIN', 
    'BRANCH_MANAGER',
    'PRINCIPAL',
    'OWNER',
    'TENANT_ADMIN'
);

-- 2. 삭제 확인
SELECT COUNT(*) as deleted_count
FROM common_codes
WHERE code_group = 'USER_ROLE'
AND tenant_id IS NULL;
-- 결과: 5개만 남아야 함 (ADMIN, CONSULTANT, CLIENT, STAFF, PARENT)
```

#### 1.2 핵심 역할 코드 추가
```sql
-- 핵심 5개 역할 추가 (위의 INSERT 문 실행)
INSERT INTO common_codes (tenant_id, code_group, code_value, code_label, korean_name, sort_order, is_active)
VALUES 
    (NULL, 'USER_ROLE', 'ADMIN', 'Admin', '관리자', 1, true),
    (NULL, 'USER_ROLE', 'CONSULTANT', 'Consultant', '상담사', 2, true),
    (NULL, 'USER_ROLE', 'CLIENT', 'Client', '내담자', 3, true),
    (NULL, 'USER_ROLE', 'STAFF', 'Staff', '사무원', 4, true),
    (NULL, 'USER_ROLE', 'PARENT', 'Parent', '학부모', 5, true)
ON DUPLICATE KEY UPDATE 
    korean_name = VALUES(korean_name),
    sort_order = VALUES(sort_order),
    is_active = VALUES(is_active);
```

#### 1.3 등급 코드 추가
```sql
-- ADMIN_GRADE, CONSULTANT_GRADE, CLIENT_GRADE 추가
-- (위의 INSERT 문 실행)
```

#### 1.4 코드 그룹 메타데이터 추가
```sql
-- code_group_metadata 추가
-- (위의 INSERT 문 실행)
```

---

### Phase 2: 테넌트 역할 정리 (2시간)

#### 2.1 테넌트 역할 테이블 확인
```sql
-- 현재 테넌트 역할 확인
SELECT tenant_id, role_code, name_ko, name_en
FROM tenant_roles
ORDER BY tenant_id, role_code;
```

#### 2.2 레거시 역할 코드 업데이트
```sql
-- 레거시 역할 코드를 핵심 역할 코드로 매핑
UPDATE tenant_roles
SET role_code = 'ADMIN'
WHERE role_code IN (
    'BRANCH_ADMIN', 
    'BRANCH_SUPER_ADMIN', 
    'HQ_ADMIN', 
    'SUPER_HQ_ADMIN', 
    'HQ_MASTER', 
    'HQ_SUPER_ADMIN', 
    'BRANCH_MANAGER',
    'PRINCIPAL',
    'OWNER',
    'TENANT_ADMIN'
);

-- 업데이트 확인
SELECT role_code, COUNT(*) as count
FROM tenant_roles
GROUP BY role_code;
```

#### 2.3 누락된 역할 추가
```sql
-- 모든 테넌트에 핵심 역할 추가 (누락된 경우)
INSERT INTO tenant_roles (tenant_id, role_code, name_ko, name_en, is_active)
SELECT 
    t.tenant_id,
    'ADMIN',
    '관리자',
    'Admin',
    true
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM tenant_roles tr 
    WHERE tr.tenant_id = t.tenant_id AND tr.role_code = 'ADMIN'
);

-- CONSULTANT, CLIENT, STAFF도 동일하게 추가
```

---

## 💻 백엔드 구현

### 1. CommonCodeService 개선

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class CommonCodeServiceImpl implements CommonCodeService {
    
    private final CommonCodeRepository commonCodeRepository;
    
    /**
     * 시스템 역할 코드 조회
     * 
     * @return 핵심 5개 역할 목록
     */
    public List<CommonCode> getSystemRoles() {
        return commonCodeRepository
            .findByTenantIdIsNullAndCodeGroupAndIsActiveOrderBySortOrder(
                "USER_ROLE", true
            );
    }
    
    /**
     * 역할별 등급 코드 조회
     * 
     * @param role 역할 (ADMIN, CONSULTANT, CLIENT)
     * @return 등급 목록
     */
    public List<CommonCode> getGradesByRole(UserRole role) {
        String codeGroup = switch (role) {
            case ADMIN -> "ADMIN_GRADE";
            case CONSULTANT -> "CONSULTANT_GRADE";
            case CLIENT -> "CLIENT_GRADE";
            default -> null;
        };
        
        if (codeGroup == null) {
            return Collections.emptyList();
        }
        
        return commonCodeRepository
            .findByTenantIdIsNullAndCodeGroupAndIsActiveOrderBySortOrder(
                codeGroup, true
            );
    }
    
    /**
     * 등급 정보 조회 (extra_data 포함)
     * 
     * @param gradeCode 등급 코드
     * @return 등급 정보
     */
    public GradeInfo getGradeInfo(String gradeCode) {
        CommonCode gradeCode = commonCodeRepository
            .findByTenantIdIsNullAndCodeValue(gradeCode)
            .orElseThrow(() -> new NotFoundException("등급을 찾을 수 없습니다."));
        
        // extra_data JSON 파싱
        ObjectMapper mapper = new ObjectMapper();
        try {
            Map<String, Object> extraData = mapper.readValue(
                gradeCode.getExtraData(), 
                new TypeReference<Map<String, Object>>() {}
            );
            
            return GradeInfo.builder()
                .code(gradeCode.getCodeValue())
                .name(gradeCode.getKoreanName())
                .level((Integer) extraData.get("level"))
                .color((String) extraData.get("color"))
                .extraData(extraData)
                .build();
        } catch (JsonProcessingException e) {
            log.error("등급 정보 파싱 실패: {}", gradeCode, e);
            throw new RuntimeException("등급 정보 파싱 실패", e);
        }
    }
}
```

### 2. UserRoleService 개선 (역할 부여 + 대시보드 자동 생성)

```java
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UserRoleServiceImpl implements UserRoleService {
    
    private final UserRepository userRepository;
    private final TenantRoleRepository tenantRoleRepository;
    private final CommonCodeService commonCodeService;
    private final DashboardService dashboardService;
    private final PermissionService permissionService;
    
    /**
     * 사용자에게 역할 부여 (테넌트 관리자 권한)
     * 
     * @param tenantId 테넌트 ID
     * @param userId 사용자 ID
     * @param roleCode 역할 코드 (ADMIN, CONSULTANT, CLIENT, STAFF, PARENT)
     * @param grade 등급 (선택)
     * @param assignedBy 부여자
     */
    public void assignRole(String tenantId, Long userId, String roleCode, 
                          String grade, String assignedBy) {
        log.info("역할 부여 시작: tenantId={}, userId={}, roleCode={}, grade={}", 
            tenantId, userId, roleCode, grade);
        
        // 1. 시스템 역할 코드 검증
        CommonCode systemRole = commonCodeService
            .getCommonCodeByGroupAndValue("USER_ROLE", roleCode);
        
        if (systemRole == null) {
            throw new BadRequestException("유효하지 않은 역할 코드입니다: " + roleCode);
        }
        
        // 2. 테넌트 역할 존재 확인
        TenantRole tenantRole = tenantRoleRepository
            .findByTenantIdAndRoleCode(tenantId, roleCode)
            .orElseThrow(() -> new NotFoundException(
                "테넌트 역할을 찾을 수 없습니다: " + roleCode
            ));
        
        // 3. 사용자 조회
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다."));
        
        // 4. 테넌트 검증
        if (!tenantId.equals(user.getTenantId())) {
            throw new ForbiddenException("다른 테넌트의 사용자입니다.");
        }
        
        // 5. 역할 부여
        UserRole oldRole = user.getRole();
        user.setRole(UserRole.valueOf(roleCode));
        
        // 6. 등급 부여 (선택)
        if (grade != null && !grade.isEmpty()) {
            validateGrade(roleCode, grade);
            user.setGrade(grade);
        }
        
        userRepository.save(user);
        
        log.info("역할 부여 완료: userId={}, oldRole={}, newRole={}, grade={}", 
            userId, oldRole, roleCode, grade);
        
        // 7. 역할별 기본 권한 부여
        permissionService.grantDefaultPermissions(tenantId, userId, roleCode);
        
        // 8. 역할별 대시보드 자동 생성
        createDashboardForRole(tenantId, userId, roleCode);
        
        log.info("역할 부여 프로세스 완료: userId={}, roleCode={}", userId, roleCode);
    }
    
    /**
     * 역할별 대시보드 자동 생성
     * 
     * @param tenantId 테넌트 ID
     * @param userId 사용자 ID
     * @param roleCode 역할 코드
     */
    private void createDashboardForRole(String tenantId, Long userId, String roleCode) {
        log.info("역할별 대시보드 생성 시작: userId={}, roleCode={}", userId, roleCode);
        
        try {
            // 1. 기존 대시보드 확인
            boolean dashboardExists = dashboardService
                .existsByTenantIdAndUserIdAndRoleCode(tenantId, userId, roleCode);
            
            if (dashboardExists) {
                log.info("대시보드가 이미 존재합니다: userId={}, roleCode={}", userId, roleCode);
                return;
            }
            
            // 2. 역할별 기본 대시보드 생성
            Dashboard dashboard = dashboardService.createDefaultDashboard(
                tenantId, 
                userId, 
                roleCode
            );
            
            log.info("대시보드 생성 완료: dashboardId={}, userId={}, roleCode={}", 
                dashboard.getId(), userId, roleCode);
            
            // 3. 역할별 기본 위젯 자동 구성
            dashboardService.addDefaultWidgets(dashboard.getId(), roleCode);
            
            log.info("기본 위젯 구성 완료: dashboardId={}, roleCode={}", 
                dashboard.getId(), roleCode);
            
        } catch (Exception e) {
            log.error("대시보드 생성 실패: userId={}, roleCode={}", userId, roleCode, e);
            // 대시보드 생성 실패해도 역할 부여는 성공으로 처리
            // 사용자가 로그인 시 대시보드가 없으면 자동 생성
        }
    }
    
    /**
     * 등급 검증
     * 
     * @param roleCode 역할 코드
     * @param grade 등급
     */
    private void validateGrade(String roleCode, String grade) {
        String codeGroup = switch (roleCode) {
            case "ADMIN" -> "ADMIN_GRADE";
            case "CONSULTANT" -> "CONSULTANT_GRADE";
            case "CLIENT" -> "CLIENT_GRADE";
            default -> null;
        };
        
        if (codeGroup == null) {
            throw new BadRequestException("등급을 지원하지 않는 역할입니다: " + roleCode);
        }
        
        CommonCode gradeCode = commonCodeService
            .getCommonCodeByGroupAndValue(codeGroup, grade);
        
        if (gradeCode == null) {
            throw new BadRequestException("유효하지 않은 등급입니다: " + grade);
        }
    }
}
```

### 3. TenantRoleService 개선 (역할명 커스터마이징)

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class TenantRoleServiceImpl implements TenantRoleService {
    
    private final TenantRoleRepository tenantRoleRepository;
    private final CommonCodeService commonCodeService;
    
    /**
     * 테넌트 역할 조회 (커스터마이징된 이름 포함)
     * 
     * @param tenantId 테넌트 ID
     * @return 테넌트 역할 목록
     */
    public List<TenantRoleResponse> getTenantRoles(String tenantId) {
        List<TenantRole> tenantRoles = tenantRoleRepository
            .findByTenantIdAndIsActive(tenantId, true);
        
        return tenantRoles.stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }
    
    /**
     * 테넌트 역할 커스터마이징 (테넌트 관리자 권한)
     * 
     * @param tenantId 테넌트 ID
     * @param roleCode 역할 코드
     * @param nameKo 한글명 (커스터마이징)
     * @param nameEn 영문명 (커스터마이징)
     */
    public void customizeTenantRole(String tenantId, String roleCode, 
                                    String nameKo, String nameEn) {
        // 1. 시스템 역할 코드 검증
        CommonCode systemRole = commonCodeService
            .getCommonCodeByGroupAndValue("USER_ROLE", roleCode);
        
        if (systemRole == null) {
            throw new BadRequestException("유효하지 않은 역할 코드입니다.");
        }
        
        // 2. 테넌트 역할 업데이트
        TenantRole tenantRole = tenantRoleRepository
            .findByTenantIdAndRoleCode(tenantId, roleCode)
            .orElseThrow(() -> new NotFoundException("테넌트 역할을 찾을 수 없습니다."));
        
        tenantRole.setNameKo(nameKo);
        tenantRole.setNameEn(nameEn);
        tenantRoleRepository.save(tenantRole);
        
        log.info("테넌트 역할 커스터마이징: tenantId={}, roleCode={}, nameKo={}", 
            tenantId, roleCode, nameKo);
    }
}
```

---

## 🌐 프론트엔드 구현

### 1. roleApi 유틸리티

```javascript
import { apiGet } from './ajax';

/**
 * 시스템 역할 목록 조회
 * 
 * @returns {Promise<Array>} 핵심 5개 역할
 */
export async function getSystemRoles() {
    try {
        const response = await apiGet('/api/v1/common-codes?codeGroup=USER_ROLE');
        return response.success ? response.data : [];
    } catch (error) {
        console.error('시스템 역할 조회 실패:', error);
        return [];
    }
}

/**
 * 역할별 등급 조회
 * 
 * @param {string} role - 역할 (ADMIN, CONSULTANT, CLIENT)
 * @returns {Promise<Array>} 등급 목록
 */
export async function getGradesByRole(role) {
    const codeGroupMap = {
        'ADMIN': 'ADMIN_GRADE',
        'CONSULTANT': 'CONSULTANT_GRADE',
        'CLIENT': 'CLIENT_GRADE'
    };
    
    const codeGroup = codeGroupMap[role];
    if (!codeGroup) {
        return [];
    }
    
    try {
        const response = await apiGet(`/api/v1/common-codes?codeGroup=${codeGroup}`);
        return response.success ? response.data : [];
    } catch (error) {
        console.error('등급 조회 실패:', error);
        return [];
    }
}

/**
 * 테넌트 역할 목록 조회 (커스터마이징된 이름 포함)
 * 
 * @returns {Promise<Array>} 테넌트 역할 목록
 */
export async function getTenantRoles() {
    try {
        const response = await apiGet('/api/v1/tenant/roles');
        return response.success ? response.data : [];
    } catch (error) {
        console.error('테넌트 역할 조회 실패:', error);
        return [];
    }
}
```

---

## ✅ 체크리스트

### Phase 1: 시스템 공통코드 정리
- [ ] 레거시 역할 코드 삭제 (10개)
- [ ] 핵심 역할 코드 추가 (5개)
- [ ] 등급 코드 추가 (ADMIN_GRADE, CONSULTANT_GRADE, CLIENT_GRADE)
- [ ] 코드 그룹 메타데이터 추가
- [ ] 시스템 공통코드 검증 (5개만 남아야 함)

### Phase 2: 테넌트 역할 정리
- [ ] 테넌트 역할 테이블 확인
- [ ] 레거시 역할 코드 업데이트 (role_code 매핑)
- [ ] 누락된 역할 추가 (모든 테넌트)
- [ ] 테넌트 역할 검증

### Phase 3: 백엔드 구현
- [ ] CommonCodeService 개선
- [ ] TenantRoleService 개선
- [ ] API 엔드포인트 추가

### Phase 4: 프론트엔드 구현
- [ ] roleApi 유틸리티 작성
- [ ] 역할 선택 컴포넌트 개선
- [ ] 등급 배지 컴포넌트 작성

---

## 📊 전체 일정

| Phase | 작업 | 예상 시간 | 우선순위 |
|-------|------|----------|---------|
| Phase 1 | 시스템 공통코드 정리 | 2시간 | 🔥 최우선 |
| Phase 2 | 테넌트 역할 정리 | 2시간 | 🔥 최우선 |
| Phase 3 | 백엔드 구현 | 4시간 | ⭐ 높음 |
| Phase 4 | 프론트엔드 구현 | 2시간 | ⭐ 높음 |

**총 예상 시간:** 10시간 (1.25일)

---

## 🚨 주의사항

### 1. **시스템 공통코드는 절대 수정 금지**
- `tenant_id = NULL`인 코드는 시스템 관리자만 수정 가능
- 테넌트 관리자는 수정 불가

### 2. **테넌트 관리자 권한**
- ✅ **사용자에게 역할 부여 가능** (ADMIN, CONSULTANT, CLIENT, STAFF, PARENT)
- ✅ **사용자에게 등급 부여 가능** (MANAGER, DIRECTOR, JUNIOR, SENIOR 등)
- ✅ **역할명 커스터마이징 가능** (예: "관리자" → "원장", "상담사" → "강사")
- ✅ **역할별 권한 설정 가능** (role_permissions)
- ❌ **역할 코드 변경 불가** (ADMIN, CONSULTANT 등은 시스템 고정)

### 3. **역할 부여 시 자동 대시보드 생성**
```
프로세스:
1. 테넌트 관리자가 사용자에게 역할 부여
   POST /api/v1/users/{userId}/role
   { "roleCode": "CONSULTANT", "grade": "CONSULTANT_JUNIOR" }

2. 시스템이 자동으로 대시보드 생성
   - UserRoleService.assignRole() 호출
   - DashboardService.createUserDashboard() 자동 호출
   - 역할별 기본 위젯 자동 구성

3. 사용자 로그인 시 자동으로 대시보드 표시
   - CONSULTANT → Consultant Dashboard
   - CLIENT → Client Dashboard
```

### 4. **등급 시스템은 선택적**
- 등급을 사용하지 않는 테넌트도 있을 수 있음
- 등급이 없는 경우 기본 역할만 사용

---

## 📚 참고 문서

- [공통코드 시스템 표준](../../standards/COMMON_CODE_SYSTEM_STANDARD.md)
- [테넌트 역할 시스템 표준](../../standards/TENANT_ROLE_SYSTEM_STANDARD.md)
- [역할 시스템 마이그레이션 계획](./ROLE_SYSTEM_MIGRATION_PLAN.md)

---

**작성자:** AI Assistant  
**최종 수정:** 2025-12-03  
**다음 단계:** Phase 1 시스템 공통코드 정리 시작 (사용자 승인 후)


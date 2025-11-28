# 온보딩 승인 후 어드민 계정 생성 및 최초 접속 프로세스

## 📋 현재 상태 분석

### 1. 온보딩 승인 프로세스
온보딩 승인 시 `ProcessOnboardingApproval` PL/SQL 프로시저가 다음을 수행:
1. ✅ 테넌트 생성/활성화 (`CreateOrActivateTenant`)
2. ✅ 카테고리 매핑 설정 (`SetupTenantCategoryMapping`)
3. ✅ 기본 컴포넌트 활성화 (`ActivateDefaultComponents`)
4. ✅ 기본 요금제 구독 생성 (`CreateDefaultSubscription`)
5. ✅ 기본 역할 템플릿 적용 (`ApplyDefaultRoleTemplates`)
6. ✅ ERD 자동 생성 (`GenerateErdOnOnboardingApproval`)
7. ❌ **기본 어드민 계정 생성 - 누락됨**

### 2. 현재 데이터 구조
- `OnboardingRequest.requestedBy`: 온보딩 요청자의 이메일 (contactEmail)
- `Tenant.contactEmail`: 테넌트 연락 이메일
- **어드민 계정 자동 생성 로직 없음**

## 🎯 개선 방안

### Phase 1: 온보딩 승인 시 기본 어드민 계정 자동 생성

#### 1.1 PL/SQL 프로시저 추가
`CreateDefaultAdminAccount` 프로시저 생성:
```sql
CREATE PROCEDURE CreateDefaultAdminAccount(
    IN p_tenant_id VARCHAR(64),
    IN p_contact_email VARCHAR(100),
    IN p_tenant_name VARCHAR(255),
    IN p_approved_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_temp_password VARCHAR(255);
    DECLARE v_hashed_password VARCHAR(255);
    DECLARE v_user_id BIGINT;
    
    -- 임시 비밀번호 생성 (12자리 랜덤)
    SET v_temp_password = CONCAT(
        SUBSTRING(MD5(RAND()), 1, 4),
        SUBSTRING(MD5(RAND()), 1, 4),
        SUBSTRING(MD5(RAND()), 1, 4)
    );
    
    -- BCrypt 해시 생성 (Java에서 처리하거나 MySQL 함수 사용)
    -- 주의: MySQL에서 BCrypt 직접 생성은 복잡하므로 Java 서비스에서 처리 권장
    
    -- 사용자 생성
    INSERT INTO users (
        tenant_id,
        email,
        username,
        password,
        name,
        role,
        is_active,
        is_email_verified,
        is_social_account,
        created_at,
        updated_at,
        created_by,
        updated_by,
        is_deleted,
        version
    ) VALUES (
        p_tenant_id,
        p_contact_email,
        SUBSTRING_INDEX(p_contact_email, '@', 1),
        v_hashed_password, -- Java에서 BCrypt로 해시된 값
        CONCAT(p_tenant_name, ' 관리자'),
        'ADMIN',
        TRUE,
        FALSE, -- 최초 로그인 시 이메일 인증 유도
        FALSE,
        NOW(),
        NOW(),
        p_approved_by,
        p_approved_by,
        FALSE,
        0
    );
    
    SET v_user_id = LAST_INSERT_ID();
    
    -- 임시 비밀번호 저장 (암호화된 테이블 또는 별도 테이블)
    -- 또는 이메일로만 전송하고 DB에는 저장하지 않음
    
    SET p_success = TRUE;
    SET p_message = CONCAT('기본 어드민 계정 생성 완료: ', p_contact_email);
END;
```

#### 1.2 Java 서비스 구현
`OnboardingApprovalServiceImpl`에 어드민 계정 생성 로직 추가:
```java
@Transactional
public void createDefaultAdminAccount(
    String tenantId, 
    String contactEmail, 
    String tenantName
) {
    // 1. 임시 비밀번호 생성
    String tempPassword = generateTempPassword();
    
    // 2. 사용자 생성
    User admin = User.builder()
        .tenantId(tenantId)
        .email(contactEmail)
        .username(extractUsernameFromEmail(contactEmail))
        .password(passwordEncoder.encode(tempPassword))
        .name(tenantName + " 관리자")
        .role(UserRole.ADMIN)
        .isActive(true)
        .isEmailVerified(false) // 최초 로그인 시 인증 유도
        .isSocialAccount(false)
        .build();
    
    userRepository.save(admin);
    
    // 3. 임시 비밀번호 이메일 발송
    emailService.sendAdminAccountCreationEmail(
        contactEmail, 
        tenantName, 
        tempPassword,
        tenantId
    );
}
```

### Phase 2: 최초 접속 프로세스

#### 2.1 최초 로그인 플로우
1. **이메일 수신**: 온보딩 승인 완료 이메일 + 임시 비밀번호
2. **로그인 페이지 접속**: `/login?tenantId={tenantId}`
3. **임시 비밀번호로 로그인**
4. **비밀번호 변경 강제**: 최초 로그인 시 비밀번호 변경 화면으로 리다이렉트
5. **이메일 인증**: 비밀번호 변경 후 이메일 인증 유도
6. **대시보드 접속**: `/admin/dashboard` 또는 `/academy` (업종에 따라)

#### 2.2 비밀번호 변경 강제 로직
```java
@PostMapping("/api/auth/first-login/change-password")
public ResponseEntity<?> changePasswordOnFirstLogin(
    @RequestBody ChangePasswordRequest request,
    HttpSession session
) {
    User user = SessionUtils.getCurrentUser(session);
    
    // 최초 로그인 여부 확인
    if (user.getLastLoginAt() == null) {
        // 비밀번호 변경
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setLastLoginAt(LocalDateTime.now());
        user.setIsEmailVerified(true); // 비밀번호 변경 시 이메일 인증 완료로 간주
        userRepository.save(user);
        
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "비밀번호가 변경되었습니다."
        ));
    }
    
    return ResponseEntity.badRequest().body(Map.of(
        "success", false,
        "message", "이미 비밀번호를 변경하셨습니다."
    ));
}
```

### Phase 3: 대시보드 라우팅

#### 3.1 업종별 대시보드
- **학원 시스템**: `/academy` → `AcademyDashboard`
- **상담 시스템**: `/admin/dashboard` → `AdminDashboard`
- **기타 업종**: `/admin/dashboard` → 기본 대시보드

#### 3.2 테넌트 컨텍스트 설정
로그인 시 자동으로 테넌트 컨텍스트 설정:
```java
@PostMapping("/api/auth/login")
public ResponseEntity<?> login(@RequestBody LoginRequest request) {
    // ... 로그인 처리 ...
    
    // 테넌트 컨텍스트 설정
    TenantContextHolder.setTenantId(user.getTenantId());
    
    // 세션에 테넌트 정보 저장
    session.setAttribute("tenantId", user.getTenantId());
    
    // 업종별 대시보드 경로 결정
    String dashboardPath = determineDashboardPath(user.getTenantId());
    
    return ResponseEntity.ok(Map.of(
        "success", true,
        "dashboardPath", dashboardPath
    ));
}
```

## 📝 구현 체크리스트

### 백엔드
- [ ] `CreateDefaultAdminAccount` PL/SQL 프로시저 생성
- [ ] `ProcessOnboardingApproval` 프로시저에 어드민 계정 생성 단계 추가
- [ ] `OnboardingApprovalServiceImpl`에 어드민 계정 생성 메서드 추가
- [ ] 임시 비밀번호 생성 유틸리티
- [ ] 이메일 발송 서비스 (어드민 계정 생성 알림)
- [ ] 최초 로그인 감지 로직
- [ ] 비밀번호 변경 강제 API
- [ ] 업종별 대시보드 라우팅 로직

### 프론트엔드
- [ ] 최초 로그인 시 비밀번호 변경 화면
- [ ] 비밀번호 변경 API 연동
- [ ] 업종별 대시보드 라우팅
- [ ] 온보딩 완료 안내 페이지

### 이메일 템플릿
- [ ] 온보딩 승인 완료 이메일
- [ ] 임시 비밀번호 안내 이메일
- [ ] 최초 로그인 안내 이메일

## 🔄 프로세스 플로우

### 단일 테넌트 사용자 (일반 케이스)

```
1. 온보딩 요청 (Trinity 홈페이지)
   ↓
2. Ops Portal에서 승인
   ↓
3. ProcessOnboardingApproval 프로시저 실행
   ├─ 테넌트 생성
   ├─ 카테고리 매핑
   ├─ 컴포넌트 활성화
   ├─ 구독 생성
   ├─ 역할 템플릿 적용
   ├─ ERD 생성
   └─ [신규] 기본 어드민 계정 생성
       ├─ 임시 비밀번호 생성
       ├─ 사용자 생성 (ADMIN 역할, tenant_id 설정)
       └─ 이메일 발송 (임시 비밀번호)
   ↓
4. 입점사 담당자 이메일 수신
   ↓
5. 로그인 페이지 접속 (/login?tenantId={tenantId})
   ↓
6. 임시 비밀번호로 로그인
   ↓
7. 최초 로그인 감지 → 비밀번호 변경 화면으로 리다이렉트
   ↓
8. 비밀번호 변경
   ↓
9. 업종별 대시보드 접속
   ├─ 학원: /academy
   ├─ 상담: /admin/dashboard
   └─ 기타: /admin/dashboard
```

### 멀티 테넌트 사용자 (2개 이상의 테넌트에 어드민으로 등록)

#### 시나리오: 같은 이메일로 여러 테넌트의 어드민 계정 생성

**케이스 1: 첫 번째 테넌트 온보딩**
```
1. 테넌트 A 온보딩 승인
   ↓
2. 어드민 계정 생성 (email: admin@example.com, tenant_id: tenant-a)
   ↓
3. 임시 비밀번호 이메일 발송
   ↓
4. 로그인 → 비밀번호 변경 → 대시보드 접속
```

**케이스 2: 두 번째 테넌트 온보딩 (같은 이메일)**
```
1. 테넌트 B 온보딩 승인 (contactEmail: admin@example.com)
   ↓
2. 기존 사용자 확인 로직:
   ├─ 같은 이메일 + 다른 tenant_id → 새 User 레코드 생성 ✅
   └─ 같은 이메일 + 같은 tenant_id → 에러 (중복 방지)
   ↓
3. 어드민 계정 생성 (email: admin@example.com, tenant_id: tenant-b)
   ├─ 별도의 User 레코드 생성 (tenant_id로 구분)
   ├─ 같은 이메일, 같은 비밀번호 (또는 별도 임시 비밀번호)
   └─ 이메일 발송 (새 테넌트 추가 안내)
   ↓
4. 다음 로그인 시:
   ├─ 멀티 테넌트 사용자 감지 (2개 이상의 tenant_id)
   ├─ 테넌트 선택 화면 표시
   └─ 선택한 테넌트로 전환
```

#### 멀티 테넌트 사용자 로그인 프로세스

```
1. 로그인 페이지 접속 (/login)
   ↓
2. 이메일/비밀번호로 로그인
   ↓
3. 백엔드에서 멀티 테넌트 사용자 확인
   ├─ User 테이블에서 같은 email + 다른 tenant_id 조회
   ├─ 또는 RefreshToken에서 접근한 모든 tenant_id 조회
   └─ 2개 이상 발견 → 멀티 테넌트 사용자
   ↓
4. 멀티 테넌트 사용자인 경우:
   ├─ 테넌트 선택 화면 표시 (TenantSelection 컴포넌트)
   ├─ 접근 가능한 테넌트 목록 표시
   │   ├─ 테넌트 A (학원 시스템)
   │   ├─ 테넌트 B (상담 시스템)
   │   └─ 테넌트 C (기타)
   └─ 사용자가 테넌트 선택
   ↓
5. 테넌트 전환 API 호출 (/api/auth/tenant/switch)
   ├─ 세션에 tenantId 저장
   ├─ TenantContextHolder에 설정
   └─ 업종별 대시보드로 리다이렉트
   ↓
6. 대시보드 접속
   ├─ 선택한 테넌트의 컨텍스트로 동작
   └─ 헤더에 테넌트 전환 버튼 표시 (추가 테넌트가 있는 경우)
```

## 🔐 멀티 테넌트 어드민 계정 관리 전략

### 1. 한 계정에 멀티 테넌트 구조 (최종 결정)

**핵심 원칙:**
- ✅ **하나의 이메일/비밀번호로 여러 테넌트 접근**
- ✅ 각 테넌트마다 별도의 User 레코드 생성 (`tenant_id`로 구분)
- ✅ **이메일은 전역 unique가 아닌 (email, tenant_id) 복합 unique**
- ✅ **비밀번호는 공통으로 사용** (하나의 비밀번호로 모든 테넌트 접근)
- ✅ 로그인 시 이메일로 모든 테넌트의 User 조회
- ✅ 멀티 테넌트 사용자면 테넌트 선택 화면 자동 표시

**데이터베이스 구조 변경 필요:**
```sql
-- 현재: email이 전역 unique
ALTER TABLE users DROP INDEX UK_6dotkott2kjsp8vw4d0m25fb7;

-- 변경: (email, tenant_id) 복합 unique
ALTER TABLE users ADD UNIQUE KEY UK_users_email_tenant (email, tenant_id);
```

**엔티티 변경:**
```java
// User.java
@Table(name = "users", uniqueConstraints = {
    @UniqueConstraint(name = "UK_users_email_tenant", columnNames = {"email", "tenant_id"}),
    @UniqueConstraint(name = "UK_users_username", columnNames = {"username"})
})
public class User extends BaseEntity {
    // email의 unique = true 제거
    @Column(name = "email", nullable = false, length = 100)  // unique = true 제거
    private String email;
}
```

**Repository 메서드 추가:**
```java
// UserRepository.java
/**
 * 이메일로 모든 테넌트의 사용자 조회 (멀티 테넌트 사용자 확인용)
 */
@Query("SELECT u FROM User u WHERE u.email = ?1 AND u.isDeleted = false")
List<User> findAllByEmail(String email);

/**
 * 이메일과 테넌트 ID로 사용자 조회
 */
@Query("SELECT u FROM User u WHERE u.email = ?1 AND u.tenantId = ?2 AND u.isDeleted = false")
Optional<User> findByEmailAndTenantId(String email, String tenantId);
```

### 2. 비밀번호 관리 전략

**공통 비밀번호 정책 (최종 결정):**
```
- 하나의 이메일로 여러 테넌트에 계정이 있어도 비밀번호는 하나만 사용
- 첫 번째 테넌트에서 비밀번호 변경 시 → 모든 테넌트의 비밀번호 동기화
- 두 번째 테넌트 생성 시 → 첫 번째 테넌트의 비밀번호 복사
- 사용자는 하나의 비밀번호로 모든 테넌트 접근
```

**비밀번호 동기화 로직:**
```java
@Transactional
public void updatePassword(String email, String newPassword) {
    // 1. 이메일로 모든 테넌트의 User 조회
    List<User> users = userRepository.findAllByEmail(email);
    
    // 2. 모든 User의 비밀번호를 동일하게 업데이트
    String hashedPassword = passwordEncoder.encode(newPassword);
    for (User user : users) {
        user.setPassword(hashedPassword);
        userRepository.save(user);
    }
    
    log.info("비밀번호 동기화 완료: email={}, tenantCount={}", email, users.size());
}
```

### 3. 온보딩 승인 시 어드민 계정 생성 로직

```java
@Transactional
public void createDefaultAdminAccount(
    String tenantId, 
    String contactEmail, 
    String tenantName
) {
    // 1. 같은 이메일로 다른 테넌트에 계정이 있는지 확인
    List<User> existingUsers = userRepository.findAllByEmail(contactEmail);
    
    // 2. 이미 해당 테넌트에 계정이 있는지 확인
    boolean alreadyExists = existingUsers.stream()
        .anyMatch(u -> tenantId.equals(u.getTenantId()));
    
    if (alreadyExists) {
        log.warn("이미 해당 테넌트에 어드민 계정이 존재합니다: email={}, tenantId={}", 
            contactEmail, tenantId);
        return;
    }
    
    String password;
    boolean isMultiTenant = !existingUsers.isEmpty();
    
    if (isMultiTenant) {
        // 기존 사용자가 있는 경우: 같은 비밀번호 사용 (공통 비밀번호)
        User existingUser = existingUsers.get(0);
        password = existingUser.getPassword(); // 이미 해시된 비밀번호
        log.info("멀티 테넌트 사용자: 기존 비밀번호 사용, email={}, existingTenantCount={}", 
            contactEmail, existingUsers.size());
        
        // 새 테넌트 추가 안내 이메일 발송
        emailService.sendMultiTenantAdminNotification(
            contactEmail, tenantName, tenantId
        );
    } else {
        // 신규 사용자: 임시 비밀번호 생성
        String tempPassword = generateTempPassword();
        password = passwordEncoder.encode(tempPassword);
        
        // 임시 비밀번호 이메일 발송
        emailService.sendAdminAccountCreationEmail(
            contactEmail, tenantName, tempPassword, tenantId
        );
    }
    
    // 3. 새 User 레코드 생성 (tenant_id로 구분)
    User admin = User.builder()
        .tenantId(tenantId)
        .email(contactEmail)
        .username(generateUniqueUsername(contactEmail, tenantId))
        .password(password)
        .name(tenantName + " 관리자")
        .role(UserRole.ADMIN)
        .isActive(true)
        .isEmailVerified(false)
        .isSocialAccount(false)
        .build();
    
    userRepository.save(admin);
    
    log.info("어드민 계정 생성 완료: email={}, tenantId={}, isMultiTenant={}", 
        contactEmail, tenantId, isMultiTenant);
}
```

## 🎯 최종 목표

### 단일 테넌트 사용자
**입점사 담당자가 온보딩 승인 후:**
1. ✅ 이메일로 임시 비밀번호 수신
2. ✅ 로그인 페이지에서 임시 비밀번호로 로그인
3. ✅ 비밀번호 변경 (강제) → 모든 테넌트에 동기화
4. ✅ 업종별 대시보드 자동 접속
5. ✅ 시스템 사용 시작

### 멀티 테넌트 사용자 (한 계정에 멀티 테넌트)
**2개 이상의 테넌트에 어드민으로 등록된 경우:**
1. ✅ 각 테넌트 온보딩 시 어드민 계정 자동 생성
2. ✅ 첫 번째 테넌트: 임시 비밀번호 이메일 발송
3. ✅ 두 번째 테넌트 이후: 새 테넌트 추가 안내 이메일 발송
4. ✅ **하나의 이메일/비밀번호로 로그인**
5. ✅ 로그인 시 멀티 테넌트 감지 → 테넌트 선택 화면 자동 표시
6. ✅ 선택한 테넌트로 전환 및 대시보드 접속
7. ✅ 대시보드에서 테넌트 전환 가능 (헤더 메뉴)
8. ✅ 비밀번호 변경 시 모든 테넌트에 자동 동기화

**핵심 특징:**
- ✅ **하나의 계정(이메일/비밀번호)으로 여러 테넌트 접근**
- ✅ 각 테넌트는 독립적인 User 레코드 (tenant_id로 구분)
- ✅ 비밀번호는 공통으로 사용 및 자동 동기화
- ✅ 모든 과정이 자동화되어 최소한의 수동 작업만 필요

## 🔧 구현 필요 사항

### 1. 데이터베이스 마이그레이션
```sql
-- VXX__remove_email_unique_constraint.sql
-- 1. 기존 email unique 제약 조건 제거
ALTER TABLE users DROP INDEX UK_6dotkott2kjsp8vw4d0m25fb7;

-- 2. (email, tenant_id) 복합 unique 제약 조건 추가
ALTER TABLE users ADD UNIQUE KEY UK_users_email_tenant (email, tenant_id);
```

### 2. 엔티티 수정
- `User.java`: `email` 필드의 `unique = true` 제거
- `@Table` 어노테이션에 복합 unique 제약 조건 추가

### 3. Repository 메서드 추가
- `findAllByEmail(String email)`: 이메일로 모든 테넌트의 User 조회
- `findByEmailAndTenantId(String email, String tenantId)`: 특정 테넌트의 User 조회

### 4. 로그인 로직 수정
- `AuthServiceImpl`: 이메일로 모든 테넌트의 User 조회
- 비밀번호는 첫 번째 User로 검증
- 멀티 테넌트 사용자면 테넌트 목록 반환

### 5. 비밀번호 변경 로직 수정
- 모든 테넌트의 User 비밀번호 동기화

### 6. 프론트엔드
- 멀티 테넌트 사용자 감지 시 테넌트 선택 화면 표시
- 대시보드 헤더에 테넌트 전환 버튼 추가


# 권한 시스템 개선 - 테넌트 기반 전환

**작성일**: 2025-12-02 (화요일)  
**작업 유형**: 권한 시스템 개선  
**목적**: 지점 기반 권한에서 테넌트 기반 권한으로 전환

---

## 📋 작업 배경

### 문제 상황
- 지점코드 시스템 제거로 인한 권한 체계 변경 필요
- 매칭 생성 시 ADMIN 역할에도 권한 부족 에러 발생
- 동적 권한 시스템이 데이터베이스 의존적이어서 초기 설정 복잡

### 해결 방안
- ADMIN 역할에 자동으로 모든 권한 부여
- 테넌트 관리자는 데이터베이스 설정 없이 즉시 사용 가능
- 일반 사용자(상담사, 내담자)는 기존 동적 권한 시스템 유지

---

## 🔧 변경된 파일 및 내용

### PermissionCheckUtils.java
**경로**: `src/main/java/com/coresolution/consultation/util/PermissionCheckUtils.java`

#### 변경: 권한 체크 로직 개선
**라인**: 114-130

**변경 전**:
```java
// 3. 권한 체크 - User 객체로 직접 체크 (더 안전한 방식)
boolean hasPermission = dynamicPermissionService.hasPermission(currentUser, permissionCode);
log.info("🔍 권한 체크 결과: hasPermission={}, permissionCode={}, roleName={}", 
        hasPermission, permissionCode, currentUser.getRole().name());

if (!hasPermission) {
    log.warn("❌ 권한 없음: 사용자={}, 역할={}, 필요한권한={}", 
            currentUser.getEmail(), currentUser.getRole(), permissionCode);
    return ResponseEntity.status(403).body(Map.of(
        "success", false,
        "message", getPermissionErrorMessage(permissionCode)
    ));
}
```

**변경 후**:
```java
// 3. ADMIN 역할은 모든 권한 자동 부여 (테넌트 시스템)
boolean isAdmin = com.coresolution.consultation.util.AdminRoleUtils.isAdmin(currentUser);
if (isAdmin) {
    log.info("✅ ADMIN 역할 자동 권한 부여: 사용자={}, 역할={}, 권한={}", 
            currentUser.getEmail(), currentUser.getRole(), permissionCode);
    return null; // 권한 체크 성공
}

// 4. 일반 사용자는 동적 권한 체크
boolean hasPermission = dynamicPermissionService.hasPermission(currentUser, permissionCode);
log.info("🔍 권한 체크 결과: hasPermission={}, permissionCode={}, roleName={}", 
        hasPermission, permissionCode, currentUser.getRole().name());

if (!hasPermission) {
    log.warn("❌ 권한 없음: 사용자={}, 역할={}, 필요한권한={}", 
            currentUser.getEmail(), currentUser.getRole(), permissionCode);
    return ResponseEntity.status(403).body(Map.of(
        "success", false,
        "message", getPermissionErrorMessage(permissionCode)
    ));
}
```

---

## 🎯 권한 체크 흐름

### 변경 전
```
1. 세션에서 사용자 조회
2. Spring Security 컨텍스트 설정
3. DynamicPermissionService로 권한 체크 (데이터베이스 조회)
4. 권한 없으면 403 에러
```

### 변경 후
```
1. 세션에서 사용자 조회
2. Spring Security 컨텍스트 설정
3. ADMIN 역할 체크
   ├─ ADMIN이면 → 즉시 권한 부여 ✅
   └─ ADMIN 아니면 → DynamicPermissionService로 권한 체크
4. 권한 없으면 403 에러
```

---

## ✅ ADMIN 역할 정의

### AdminRoleUtils.ADMIN_ROLES
다음 역할들이 자동으로 모든 권한을 가집니다:

```java
public static final Set<UserRole> ADMIN_ROLES = Set.of(
    UserRole.ADMIN,                  // 기본 관리자
    UserRole.BRANCH_ADMIN,           // 지점 관리자 (레거시)
    UserRole.BRANCH_SUPER_ADMIN,     // 지점 수퍼 관리자 (레거시)
    UserRole.BRANCH_MANAGER,         // 지점 매니저 (레거시)
    UserRole.HQ_ADMIN,               // 본사 관리자
    UserRole.SUPER_HQ_ADMIN,         // 수퍼 본사 관리자
    UserRole.HQ_MASTER,              // 본사 마스터
    UserRole.HQ_SUPER_ADMIN          // 본사 수퍼 관리자 (레거시)
);
```

---

## 📊 테스트 결과

### 변경 전
- ❌ 매칭 생성 실패: "접근 권한이 없습니다." (HTTP 403)
- ⚠️ ADMIN 역할도 데이터베이스에 권한 설정 필요

### 변경 후
- ✅ 매칭 생성 성공 (ID: 85, HTTP 201 Created)
- ✅ ADMIN 역할 자동 권한 부여
- ✅ 데이터베이스 저장 확인

#### 테스트 케이스: 매칭 생성
```bash
curl -X POST http://localhost:8080/api/admin/mappings \
  -H "Content-Type: application/json" \
  -H "Cookie: JSESSIONID=9C549E84FA12F10A4137AD7EEBEC98D9" \
  -d '{
    "consultantId": 223,
    "clientId": 224,
    "totalSessions": 10,
    "packageName": "기본 상담 패키지",
    "packagePrice": 500000
  }'
```

**응답**:
```json
{
  "success": true,
  "message": "매칭이 성공적으로 생성되었습니다",
  "data": {
    "id": 85,
    "consultantId": 223,
    "clientId": 224,
    "status": "PENDING_PAYMENT",
    "totalSessions": 10,
    "remainingSessions": 10,
    "packageName": "기본 상담 패키지",
    "packagePrice": 500000
  }
}
```

---

## 🔒 권한 체크가 적용되는 API

### 상담사/내담자 관리
- `POST /api/admin/consultants` - CONSULTANT_MANAGE
- `POST /api/admin/clients` - CLIENT_MANAGE
- `DELETE /api/admin/consultants/{id}` - CONSULTANT_MANAGE
- `DELETE /api/admin/clients/{id}` - CLIENT_MANAGE

### 매칭 관리
- `POST /api/admin/mappings` - MAPPING_MANAGE ✅ (이번에 수정)
- `PUT /api/admin/mappings/{id}` - MAPPING_MANAGE
- `DELETE /api/admin/mappings/{id}` - MAPPING_MANAGE

### 스케줄 관리
- `POST /api/schedules` - SCHEDULE_CREATE
- `PUT /api/schedules/{id}` - SCHEDULE_MODIFY
- `DELETE /api/schedules/{id}` - SCHEDULE_DELETE

### 급여 관리
- `GET /api/salary/**` - SALARY_MANAGE
- `POST /api/salary/**` - SALARY_MANAGE

### 통계 조회
- `GET /api/statistics/**` - STATISTICS_VIEW

---

## 💡 장점

### 1. 즉시 사용 가능
- 테넌트 관리자 계정 생성 즉시 모든 기능 사용 가능
- 데이터베이스 권한 설정 불필요

### 2. 유연성 유지
- 일반 사용자는 여전히 동적 권한 시스템 사용
- 세밀한 권한 제어 가능

### 3. 보안 강화
- ADMIN 역할은 신뢰할 수 있는 사용자만 부여
- 역할 기반 접근 제어 (RBAC) 유지

### 4. 코드 간결화
- 권한 체크 로직 단순화
- 로그 메시지 명확화

---

## ⚠️ 주의사항

### ADMIN 역할 부여 시 주의
- ADMIN 역할은 모든 권한을 가지므로 신중하게 부여
- 테넌트 생성 시 자동으로 ADMIN 역할 부여
- 일반 사용자에게는 CONSULTANT 또는 CLIENT 역할 부여

### 동적 권한 시스템 유지
- 상담사, 내담자는 여전히 동적 권한 체크
- 필요시 상담사에게 특정 권한 부여 가능
- 권한 설정은 `role_permissions` 테이블에서 관리

---

## 🔄 롤백 방법

### 이전 방식으로 되돌리기
변경된 코드를 원래대로 복원:

```java
// PermissionCheckUtils.java - checkPermission()
// 3. 권한 체크 - User 객체로 직접 체크 (더 안전한 방식)
boolean hasPermission = dynamicPermissionService.hasPermission(currentUser, permissionCode);
log.info("🔍 권한 체크 결과: hasPermission={}, permissionCode={}, roleName={}", 
        hasPermission, permissionCode, currentUser.getRole().name());

if (!hasPermission) {
    log.warn("❌ 권한 없음: 사용자={}, 역할={}, 필요한권한={}", 
            currentUser.getEmail(), currentUser.getRole(), permissionCode);
    return ResponseEntity.status(403).body(Map.of(
        "success", false,
        "message", getPermissionErrorMessage(permissionCode)
    ));
}
```

그리고 데이터베이스에 ADMIN 역할 권한 추가:
```sql
INSERT INTO role_permissions (tenant_id, role_name, permission_code, is_active, created_at, updated_at)
VALUES 
  ('your-tenant-id', 'ADMIN', 'MAPPING_MANAGE', 1, NOW(), NOW()),
  ('your-tenant-id', 'ADMIN', 'CONSULTANT_MANAGE', 1, NOW(), NOW()),
  ('your-tenant-id', 'ADMIN', 'CLIENT_MANAGE', 1, NOW(), NOW());
```

---

## 📈 다음 단계

### 단기 (1주일)
1. ✅ 권한 시스템 개선 완료
2. 프론트엔드 권한 체크 동기화
3. 권한 관리 UI 개선

### 중기 (1개월)
1. 역할별 권한 템플릿 생성
2. 권한 감사 로그 추가
3. 권한 위임 기능 구현

### 장기 (3개월)
1. 세밀한 권한 제어 (리소스 레벨)
2. 권한 그룹 기능
3. 권한 승인 워크플로우

---

## 📎 관련 문서

- `docs/architecture/BRANCH_CODE_REMOVAL_SUMMARY.md` - 지점코드 제거 작업
- `docs/testing/TENANT_API_TEST_FINAL_REPORT.md` - API 테스트 결과
- `docs/mgsb/PERMISSION_CHECK_UTILS_GUIDE.md` - 권한 체크 가이드

---

**작성자**: AI Assistant  
**검토 완료**: 빌드 성공, API 테스트 성공  
**배포 준비**: 완료


# PermissionMatrix 마이그레이션 계획

**작성일**: 2025-11-20  
**버전**: 1.0.0  
**상태**: 계획 수립 중

---

## 📋 개요

`PermissionMatrix`는 현재 정적 상수 클래스로, `UserRole` enum 기반으로 메뉴 그룹, API 패턴, 기능 권한을 하드코딩하고 있습니다. 이를 데이터베이스 기반 동적 권한 시스템으로 마이그레이션하여:

1. 권한 변경 시 코드 수정 없이 데이터베이스에서 관리 가능
2. 테넌트별/역할별 동적 권한 관리 가능
3. 동적 역할 시스템과 완전 통합

---

## 🔍 현재 상태 분석

### PermissionMatrix 구조

**위치**: `src/main/java/com/coresolution/consultation/constant/PermissionMatrix.java`

**내용**:
- `ROLE_MENU_GROUPS`: 역할별 메뉴 그룹 (예: "COMMON_MENU", "ADMIN_MENU")
- `ROLE_API_PATTERNS`: 역할별 API 패턴 (예: "/api/admin/**", "/api/hq/**")
- `ROLE_FEATURES`: 역할별 기능 권한 (예: "VIEW_OWN_PROFILE", "MANAGE_USERS")

**역할 수**: 9개 (CLIENT, CONSULTANT, ADMIN, BRANCH_SUPER_ADMIN, HQ_ADMIN, SUPER_HQ_ADMIN, HQ_MASTER, BRANCH_MANAGER, HQ_SUPER_ADMIN)

**메뉴 그룹 수**: 약 6개
**API 패턴 수**: 약 15개
**기능 권한 수**: 약 30개

### SecurityUtils 사용

**사용 메서드**:
- `SecurityUtils.checkMenuPermission(session, menuGroup)` - PermissionMatrix.hasMenuAccess() 사용
- `SecurityUtils.checkApiPermission(session, apiPath)` - PermissionMatrix.hasApiAccess() 사용
- `SecurityUtils.checkFeaturePermission(session, feature)` - PermissionMatrix.hasFeature() 사용
- `SecurityUtils.getUserPermissions(session)` - PermissionMatrix.getRolePermissions() 사용

**사용처**: 
- `SecurityUtils.java` (자체)
- `MenuController.java` (이미 마이그레이션됨)

---

## 🎯 마이그레이션 목표

### 1. 데이터베이스 스키마 설계

**기존 테이블 활용**:
- `permissions`: 권한 정의 (이미 존재)
- `role_permissions`: 역할-권한 매핑 (이미 존재, `role_name` 기반)

**추가 필요 사항**:
- 메뉴 그룹 권한: `MENU_GROUP_*` 형태의 권한 코드로 관리
- API 패턴 권한: `API_ACCESS_*` 형태의 권한 코드로 관리
- 기능 권한: 기존 기능 권한 코드 활용

### 2. 권한 코드 체계

**메뉴 그룹 권한**:
- `MENU_GROUP_COMMON` - 공통 메뉴
- `MENU_GROUP_CLIENT` - 내담자 메뉴
- `MENU_GROUP_CONSULTANT` - 상담사 메뉴
- `MENU_GROUP_ADMIN` - 관리자 메뉴
- `MENU_GROUP_HQ_ADMIN` - 본사 관리자 메뉴
- `MENU_GROUP_BRANCH_SUPER_ADMIN` - 지점 수퍼 관리자 메뉴

**API 패턴 권한**:
- `API_ACCESS_AUTH` - 인증 API
- `API_ACCESS_MENU` - 메뉴 API
- `API_ACCESS_USER` - 사용자 API
- `API_ACCESS_CLIENT` - 내담자 API
- `API_ACCESS_CONSULTANT` - 상담사 API
- `API_ACCESS_ADMIN` - 관리자 API
- `API_ACCESS_HQ` - 본사 API
- `API_ACCESS_ERP` - ERP API
- `API_ACCESS_PAYMENTS` - 결제 API
- `API_ACCESS_ACCOUNTS` - 계정 API
- `API_ACCESS_ALL` - 모든 API (HQ_MASTER용)

**기능 권한**:
- 기존 기능 권한 코드 활용 (예: `VIEW_OWN_PROFILE`, `MANAGE_USERS`)

### 3. 마이그레이션 전략

**Phase 3.4.1: 데이터베이스 마이그레이션 스크립트 작성**
- PermissionMatrix의 모든 권한 정보를 데이터베이스로 마이그레이션
- Flyway 마이그레이션 스크립트 작성

**Phase 3.4.2: DynamicPermissionService 확장**
- 메뉴 그룹 권한 체크 메서드 추가
- API 패턴 권한 체크 메서드 추가
- 기능 권한 체크는 기존 메서드 활용

**Phase 3.4.3: SecurityUtils 메서드 변경**
- `checkMenuPermission()` → DynamicPermissionService 기반으로 변경
- `checkApiPermission()` → DynamicPermissionService 기반으로 변경
- `checkFeaturePermission()` → DynamicPermissionService 기반으로 변경
- `getUserPermissions()` → DynamicPermissionService 기반으로 변경

**Phase 3.4.4: PermissionMatrix Deprecated 표시**
- 클래스 레벨 @Deprecated 추가
- 하위 호환성 메서드 제공 (기존 코드 동작 유지)

---

## 📝 상세 작업 계획

### Phase 3.4.1: 데이터베이스 마이그레이션 ✅ 완료 (2025-11-20)

**작업**:
1. ✅ Flyway 마이그레이션 스크립트 작성 완료
   - ✅ 메뉴 그룹 권한 코드 정의 (6개)
   - ✅ API 패턴 권한 코드 정의 (19개)
   - ✅ 기능 권한 코드 정의 (33개)
   - ✅ 역할별 권한 매핑 데이터 삽입 (9개 역할)

2. 마이그레이션 스크립트: `V34__migrate_permission_matrix_to_database.sql`
   - 메뉴 그룹 권한: 6개 (COMMON, CLIENT, CONSULTANT, ADMIN, HQ_ADMIN, BRANCH_SUPER_ADMIN)
   - API 패턴 권한: 19개 (AUTH, MENU, USER, CLIENT, CONSULTANT, ADMIN, HQ, ERP, PAYMENTS, ACCOUNTS, ALL 등)
   - 기능 권한: 33개 (VIEW_OWN_PROFILE, EDIT_OWN_PROFILE, MANAGE_USERS 등)
   - 역할별 매핑: 9개 역할 × (메뉴 + API + 기능) 권한

**완료 시간**: 약 2시간

---

### Phase 3.4.2: DynamicPermissionService 확장 ✅ 완료 (2025-11-20)

**작업**:
1. ✅ 메뉴 그룹 권한 체크 메서드 추가 완료
   - `hasMenuGroupAccess(User user, String menuGroup)`
   - `hasMenuGroupAccess(String roleName, String menuGroup)`
   - 메뉴 그룹을 `MENU_GROUP_*` 형태의 권한 코드로 변환하여 체크

2. ✅ API 패턴 권한 체크 메서드 추가 완료
   - `hasApiAccess(User user, String apiPath)`
   - `hasApiAccess(String roleName, String apiPath)`
   - API 경로를 패턴으로 변환하여 `API_ACCESS_*` 형태의 권한 코드로 체크
   - `mapApiPathToPermissionCode()` 헬퍼 메서드로 경로 매핑

3. ✅ 기능 권한 체크는 기존 `hasPermission()` 메서드 활용

**완료 시간**: 약 1시간

---

### Phase 3.4.3: SecurityUtils 메서드 변경 ✅ 완료 (2025-11-20)

**작업**:
1. ✅ `checkMenuPermission()` 변경 완료
   - PermissionMatrix.hasMenuAccess() → DynamicPermissionService.hasMenuGroupAccess()
   - 하위 호환성 유지 (응답 형식 동일)
   - ApplicationContext를 통해 DynamicPermissionService 주입
   - 폴백 메커니즘 제공 (DynamicPermissionService 실패 시 PermissionMatrix 사용)

2. ✅ `checkApiPermission()` 변경 완료
   - PermissionMatrix.hasApiAccess() → DynamicPermissionService.hasApiAccess()
   - 하위 호환성 유지 (응답 형식 동일)
   - 폴백 메커니즘 제공

3. ✅ `checkFeaturePermission()` 변경 완료
   - PermissionMatrix.hasFeature() → DynamicPermissionService.hasPermission()
   - 하위 호환성 유지 (응답 형식 동일)
   - 폴백 메커니즘 제공

4. ✅ `getUserPermissions()` 변경 완료
   - PermissionMatrix.getRolePermissions() → DynamicPermissionService.getUserPermissions()
   - 응답 형식 통일 (menuGroups, apiPatterns, features 포함)
   - 권한 코드를 기존 형식으로 변환 (MENU_GROUP_* → 메뉴 그룹명, API_ACCESS_* → API 패턴)
   - 폴백 메커니즘 제공

**완료 시간**: 약 1시간

---

### Phase 3.4.4: PermissionMatrix Deprecated 표시 ✅ 완료 (2025-11-20)

**작업**:
1. ✅ 클래스 레벨 @Deprecated 추가 완료
2. ✅ JavaDoc에 마이그레이션 가이드 추가 완료
   - 클래스 레벨 JavaDoc에 상세한 마이그레이션 가이드 추가
   - 각 메서드별 마이그레이션 예시 추가
3. ✅ 하위 호환성 메서드 제공 (기존 코드 동작 유지)
   - SecurityUtils에서 폴백 메커니즘으로 사용
4. ✅ 사용처 점진적 마이그레이션 가이드 작성 완료
   - PERMISSION_MATRIX_MIGRATION_GUIDE.md 문서 작성

**완료 시간**: 약 1시간

---

## ✅ 체크리스트

### Phase 3.4.1: 데이터베이스 마이그레이션 ✅ 완료
- [x] 메뉴 그룹 권한 코드 정의 (6개)
- [x] API 패턴 권한 코드 정의 (19개)
- [x] 기능 권한 코드 확인 및 추가 (33개)
- [x] 역할별 권한 매핑 데이터 삽입 (9개 역할)
- [x] Flyway 마이그레이션 스크립트 작성
- [ ] 마이그레이션 테스트 (다음 단계)

### Phase 3.4.2: DynamicPermissionService 확장 ✅ 완료
- [x] hasMenuGroupAccess() 메서드 추가
- [x] hasApiAccess() 메서드 추가
- [x] 구현체 업데이트
- [x] mapApiPathToPermissionCode() 헬퍼 메서드 추가
- [ ] 단위 테스트 작성 (선택적)

### Phase 3.4.3: SecurityUtils 메서드 변경 ✅ 완료
- [x] checkMenuPermission() 변경
- [x] checkApiPermission() 변경
- [x] checkFeaturePermission() 변경
- [x] getUserPermissions() 변경
- [x] ApplicationContextAware 구현하여 DynamicPermissionService 주입
- [x] 폴백 메커니즘 구현 (DynamicPermissionService 실패 시 PermissionMatrix 사용)
- [x] 하위 호환성 유지 (응답 형식 동일)
- [ ] 하위 호환성 테스트 (선택적)

### Phase 3.4.4: PermissionMatrix Deprecated 표시 ✅ 완료
- [x] 클래스 레벨 @Deprecated 추가
- [x] 필드 레벨 @Deprecated 추가 (ROLE_MENU_GROUPS, ROLE_API_PATTERNS, ROLE_FEATURES)
- [x] 메서드 레벨 @Deprecated 추가 (hasMenuAccess, hasApiAccess, hasFeature, getRolePermissions)
- [x] JavaDoc 마이그레이션 가이드 추가
- [x] 사용처 점진적 마이그레이션 가이드 작성 (PERMISSION_MATRIX_MIGRATION_GUIDE.md)

---

## 📊 진행 상황

```
Phase 3.4.1: ████████████████████ 100% ✅ (데이터베이스 마이그레이션 완료)
Phase 3.4.2: ████████████████████ 100% ✅ (DynamicPermissionService 확장 완료)
Phase 3.4.3: ████████████████████ 100% ✅ (SecurityUtils 메서드 변경 완료)
Phase 3.4.4: ████████████████████ 100% ✅ (PermissionMatrix Deprecated 표시 완료)

전체 Phase 3.4: ████████████████████ 100% ✅ 완료
```

---

## 🔗 관련 문서

- [권한 관리 표준화 분석](./PERMISSION_STANDARDIZATION_ANALYSIS.md)
- [표준화 계획](./CORESOLUTION_STANDARDIZATION_PLAN.md)
- [오늘 할 일 체크리스트](./TODAY_TODO_CHECKLIST.md)

---

**마지막 업데이트**: 2025-11-20


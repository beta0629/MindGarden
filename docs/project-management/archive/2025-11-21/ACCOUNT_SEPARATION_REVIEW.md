# 테넌트 계정 vs 코어솔루션 계정 분리 검토

**작성일**: 2025-11-21  
**상태**: 검토 필요  
**우선순위**: P0 (긴급)

---

## 📋 문제 상황

### 현재 발생한 문제
- `beta74@live.co.kr`이 이미 `TENANT-MAIN001` 테넌트의 `CLIENT` 역할로 존재
- 온보딩으로 새 테넌트를 만들려고 하는데 같은 이메일 사용
- 현재 이메일 중복 체크 로직이 테넌트의 `contact_email`만 체크하고, User 테이블의 기존 계정은 체크하지 않음
- **테넌트 계정과 코어솔루션 계정의 구분이 명확하지 않아 혼란 발생**

---

## 🔍 현재 구조 분석

### User 테이블 구조
```sql
users 테이블:
- id (PK)
- email (NOT NULL)
- tenant_id (NULL 허용)
- role (UserRole enum)
- (email, tenant_id) 복합 unique 제약
```

### 현재 계정 분류 (명확하지 않음)

#### 1. 코어솔루션 계정 (추정)
- `tenant_id = NULL`
- 역할: `HQ_MASTER`, `HQ_ADMIN`, `SUPER_HQ_ADMIN`, `HQ_SUPER_ADMIN`, `OPS` 등
- 권한: 모든 테넌트 접근 가능, 플랫폼 관리

#### 2. 테넌트 계정
- `tenant_id = 실제 테넌트 UUID`
- 역할: `ADMIN`, `BRANCH_SUPER_ADMIN`, `CONSULTANT`, `CLIENT` 등
- 권한: 해당 테넌트 내에서만 접근

### 문제점
1. **명확한 구분 기준 없음**: `tenant_id = NULL`이 코어솔루션 계정인지 불명확
2. **이메일 중복 체크 로직 불완전**: 
   - 테넌트의 `contact_email`만 체크
   - User 테이블의 기존 계정은 체크하지 않음
3. **온보딩 시 계정 생성 로직**: 
   - 테넌트 계정만 생성
   - 코어솔루션 계정과의 충돌 방지 로직 없음

---

## 🎯 검토 사항

### 1. 계정 분리 전략

#### 옵션 A: tenant_id 기반 분리 (현재 구조)
```
코어솔루션 계정: tenant_id = NULL
테넌트 계정: tenant_id = 실제 테넌트 UUID
```

**장점:**
- 현재 구조와 호환
- 구현이 간단

**단점:**
- NULL 값의 의미가 불명확
- 코어솔루션 계정도 특정 테넌트에 속할 수 있는 경우 처리 어려움

#### 옵션 B: account_type 컬럼 추가
```sql
ALTER TABLE users ADD COLUMN account_type ENUM('CORE_SOLUTION', 'TENANT') NOT NULL DEFAULT 'TENANT';
```

**장점:**
- 명확한 구분
- 확장 가능 (향후 다른 계정 타입 추가 가능)

**단점:**
- 스키마 변경 필요
- 기존 데이터 마이그레이션 필요

#### 옵션 C: 별도 테이블 분리
```
core_solution_users (코어솔루션 계정)
tenant_users (테넌트 계정)
```

**장점:**
- 완전한 분리
- 각각의 특성에 맞는 필드 추가 가능

**단점:**
- 대규모 리팩토링 필요
- 공통 로직 중복 가능

### 2. 이메일 중복 체크 로직

#### 현재 로직
```java
// OnboardingServiceImpl.isEmailDuplicate()
1. PENDING 상태의 온보딩 요청 확인
2. 활성 테넌트의 contact_email 확인
3. User 테이블 체크 없음 ❌
```

#### 개선 방안
```java
// 개선된 로직
1. PENDING 상태의 온보딩 요청 확인
2. 활성 테넌트의 contact_email 확인
3. User 테이블에서 테넌트 계정 확인 (tenant_id IS NOT NULL)
   - 같은 이메일로 이미 테넌트 계정이 있으면 중복
4. 코어솔루션 계정 확인 (tenant_id IS NULL)
   - 코어솔루션 계정은 테넌트 온보딩과 무관하므로 체크하지 않음
```

### 3. 온보딩 시 계정 생성 로직

#### 현재 로직
```java
// OnboardingServiceImpl.createTenantAdminAccount()
- checklistJson에서 adminPassword 추출
- User 테이블에 ADMIN 역할 계정 생성
- tenant_id = 생성된 테넌트 ID
```

#### 개선 방안
```java
// 개선된 로직
1. 기존 User 계정 확인
   - 같은 이메일로 tenant_id IS NOT NULL인 계정이 있으면 중복
   - 코어솔루션 계정(tenant_id IS NULL)은 무시
2. 계정 생성
   - tenant_id = 생성된 테넌트 ID
   - role = ADMIN
   - account_type = 'TENANT' (옵션 B 선택 시)
```

---

## 📊 데이터 현황 (개발 서버)

```
전체 사용자: 67명
- 코어솔루션 계정 (tenant_id IS NULL): 45명
- 테넌트 계정 (tenant_id IS NOT NULL): 22명
- 고유 테넌트 수: 2개
```

### beta74@live.co.kr 현황
```
- User ID: 23
- Email: beta74@live.co.kr
- Tenant ID: TENANT-MAIN001
- Role: CLIENT
- Status: ACTIVE
```

**문제**: 이미 테넌트 계정이 존재하는데, 온보딩으로 새 테넌트를 만들려고 함

---

## 🔧 권장 개선 방안

### Phase 1: 즉시 수정 (P0)

1. **이메일 중복 체크 로직 개선**
   ```java
   // OnboardingServiceImpl.isEmailDuplicate()
   - User 테이블에서 테넌트 계정(tenant_id IS NOT NULL) 확인 추가
   - 코어솔루션 계정(tenant_id IS NULL)은 체크하지 않음
   ```

2. **온보딩 승인 시 계정 생성 전 검증**
   ```java
   // OnboardingServiceImpl.createTenantAdminAccount()
   - 같은 이메일로 이미 테넌트 계정이 있는지 확인
   - 있으면 계정 생성 스킵하고 기존 계정 사용 안내
   ```

### Phase 2: 구조 개선 (P1)

1. **account_type 컬럼 추가** (옵션 B)
   ```sql
   ALTER TABLE users ADD COLUMN account_type ENUM('CORE_SOLUTION', 'TENANT') NOT NULL DEFAULT 'TENANT';
   
   -- 기존 데이터 마이그레이션
   UPDATE users SET account_type = 'CORE_SOLUTION' WHERE tenant_id IS NULL;
   UPDATE users SET account_type = 'TENANT' WHERE tenant_id IS NOT NULL;
   ```

2. **명확한 구분 로직 구현**
   ```java
   // User 엔티티에 메서드 추가
   public boolean isCoreSolutionAccount() {
       return accountType == AccountType.CORE_SOLUTION;
   }
   
   public boolean isTenantAccount() {
       return accountType == AccountType.TENANT;
   }
   ```

### Phase 3: 문서화 및 가이드라인 (P2)

1. **계정 분리 가이드라인 문서 작성**
2. **온보딩 프로세스 문서 업데이트**
3. **이메일 중복 체크 로직 문서화**

---

## ✅ 해결 방안 (최종 결정)

### 멀티 테넌트 지원 원칙
1. **같은 이메일로 여러 테넌트에 계정 생성 가능**
   - User 테이블: `(email, tenant_id)` 복합 unique 제약
   - 같은 이메일로 여러 테넌트에 계정 보유 가능

2. **온보딩 시 이메일 중복 체크**
   - PENDING 상태의 온보딩 요청만 체크
   - 테넌트의 `contact_email` 중복 체크 제거
   - User 테이블의 기존 계정 체크 제거

3. **로그인 시 멀티 테넌트 처리**
   - `checkMultiTenantUser()`로 같은 이메일의 모든 테넌트 계정 조회
   - 2개 이상이면 테넌트 선택 화면 표시
   - 사용자가 테넌트 선택 후 해당 테넌트로 로그인

### 수정 완료 사항
- ✅ `isEmailDuplicate()`: PENDING 상태의 온보딩 요청만 체크
- ✅ `isEmailDuplicateForTenantCreation()`: deprecated (항상 false 반환)
- ✅ `decideInternal()`: 테넌트 생성 시 이메일 중복 체크 제거
- ✅ `createTenantAdminAccount()`: 다른 테넌트에 계정이 있어도 새 테넌트 계정 생성 진행

---

## 📝 체크리스트

### 즉시 수정 필요 (P0)
- [ ] `isEmailDuplicate()` 메서드에 User 테이블 체크 추가
- [ ] `createTenantAdminAccount()` 메서드에 기존 계정 확인 로직 추가
- [ ] 온보딩 승인 시 기존 계정과의 충돌 방지 로직 추가

### 구조 개선 (P1)
- [ ] account_type 컬럼 추가 검토
- [ ] 계정 분리 전략 최종 결정
- [ ] 마이그레이션 스크립트 작성

### 문서화 (P2)
- [ ] 계정 분리 가이드라인 문서 작성
- [ ] 온보딩 프로세스 문서 업데이트
- [ ] 개발자 가이드 업데이트

---

## 🔗 관련 문서

- [온보딩 시스템 개발 가이드](./ONBOARDING_SYSTEM_DEVELOPMENT_GUIDE.md)
- [데이터 코어 및 PL/SQL 전략](../DATA_CORE_AND_PL_SQL.md)
- [아키텍처 개요](../ARCHITECTURE_OVERVIEW.md)

---

**마지막 업데이트**: 2025-11-21


# branchCode 완전 제거 계획

**작성일**: 2025-12-05  
**상태**: 계획 수립

---

## 📋 표준화 문서 확인 결과

### DATABASE_SCHEMA_STANDARD.md

**브랜치 개념 제거** (2025-12-02 현행화):
- ❌ `branch_code` 컬럼 사용 금지 (신규 테이블)
- ❌ `branch_id` 컬럼 사용 금지 (신규 테이블)
- ✅ `tenant_id`로 대체
- ⚠️ 기존 `branch_code` 컬럼은 NULL 허용으로 유지 (레거시 호환)
- ⚠️ 브랜치 관련 로직은 주석처리됨 (2025-12-02)

**사용 금지 컬럼**:
```sql
-- ❌ 사용 금지
branch_code VARCHAR(50)
branch_id BIGINT
branch_name VARCHAR(255)
```

**대체 방법**: `tenant_id` 사용

---

## 🔍 현재 상황 분석

### 1. Entity 계층
**branchCode 필드를 가진 Entity** (10개):
1. `Schedule.java` - @Deprecated, 레거시 호환
2. `FinancialTransaction.java` - @Deprecated, 레거시 호환
3. `DiscountAccountingTransaction.java` - @Deprecated, 레거시 호환
4. `ConsultantClientMapping.java` - @Deprecated, 레거시 호환
5. `Branch.java` - **⚠️ Branch 엔티티 자체가 문제**
6. `User.java` - 확인 필요
7. `SalaryCalculation.java` - 확인 필요
8. `SalaryProfile.java` - 확인 필요
9. `Item.java` - 확인 필요
10. `DailyStatistics.java` - 확인 필요

**상태**: Entity 필드는 레거시 호환을 위해 유지하되, 사용 금지

---

### 2. Service 계층
**branchCode 사용 발견** (121개 사용):
- `AdminServiceImpl.java` - 46개 사용
- `BranchServiceImpl.java` - 7개 사용
- `UserServiceImpl.java` - 6개 사용
- `FinancialTransactionServiceImpl.java` - 8개 사용
- `SocialAuthServiceImpl.java` - 9개 사용
- 기타 17개 파일

**상태**: Service 계층에서 여전히 branchCode 사용 중

---

### 3. Repository 계층
**branchCode 사용 발견** (22개):
- `BranchRepository.java` - `findByBranchCodeAndIsDeletedFalse`
- `ConsultantClientMappingRepository.java` - `findByConsultantIdAndBranchCodeAndStatusNot`
- `DailyStatisticsRepository.java` - `findByStatDateAndBranchCode`, `findByBranchCodeAndStatDateBetweenOrderByStatDateDesc`
- 기타 7개 Repository

**상태**: Repository 메서드에서 branchCode 파라미터 사용 중

---

## 🎯 제거 계획

### Phase 1: Service 계층 branchCode 사용 제거 (우선순위: HIGH)

#### 1.1 AdminServiceImpl.java
**현재 상태**: 46개 branchCode 사용
**수정 계획**:
- [ ] `branchCode` 파라미터를 받는 메서드에서 파라미터 제거 또는 무시
- [ ] `getRefundStatistics`, `getRefundHistory` 등 메서드 수정
- [ ] `getCurrentUserBranchCode` 메서드 제거 또는 Deprecated 처리
- [ ] 모든 branchCode 관련 로직을 tenantId 기반으로 변경

#### 1.2 BranchServiceImpl.java
**현재 상태**: 7개 branchCode 사용
**수정 계획**:
- [ ] Branch 엔티티 자체의 역할 재검토 필요
- [ ] Branch는 tenantId 기반으로만 관리
- [ ] branchCode를 통한 조회 로직 제거

#### 1.3 UserServiceImpl.java
**현재 상태**: 6개 branchCode 사용
**수정 계획**:
- [ ] `registerUser`에서 branchCode 처리 제거
- [ ] `findByBranchCode` 메서드 제거 또는 Deprecated 처리
- [ ] 모든 사용자 조회를 tenantId 기반으로 변경

#### 1.4 기타 Service 파일들
**수정 계획**:
- [ ] 각 Service 파일에서 branchCode 사용 제거
- [ ] tenantId 기반으로만 데이터 조회
- [ ] 레거시 호환을 위한 주석 추가

---

### Phase 2: Repository 계층 branchCode 사용 제거 (우선순위: HIGH)

#### 2.1 Repository 메서드 수정
**수정 계획**:
- [ ] `findByBranchCode*` 메서드 제거 또는 Deprecated 처리
- [ ] `findByTenantId*` 메서드로 대체
- [ ] 복합 쿼리에서 branchCode 조건 제거

**예시**:
```java
// 제거 대상
Optional<Branch> findByBranchCodeAndIsDeletedFalse(String branchCode);

// 대체 방법
Optional<Branch> findByTenantIdAndIsDeletedFalse(String tenantId);
```

---

### Phase 3: Entity 계층 branchCode 필드 처리 (우선순위: MEDIUM)

#### 3.1 Entity 필드 처리
**현재 상태**: @Deprecated 주석만 있음
**수정 계획**:
- [ ] 모든 Entity에서 branchCode 필드에 @Deprecated 어노테이션 추가
- [ ] getter/setter 메서드에도 @Deprecated 추가
- [ ] 사용 금지 주석 강화

**예시**:
```java
/**
 * @Deprecated - 🚨 레거시 호환: 브랜치 코드 기반 필터링 사용 금지
 * 레거시 데이터 호환을 위해 필드 유지 (NULL 허용)
 * 새로운 코드에서는 사용하지 마세요. 테넌트 ID만 사용하세요.
 * 
 * 제거 예정: 2026-01-01
 */
@Deprecated
@Column(name = "branch_code", length = 20)
private String branchCode;
```

---

### Phase 4: Branch 엔티티 재검토 (우선순위: MEDIUM)

#### 4.1 Branch 엔티티 역할 재정의
**현재 상태**: Branch 엔티티가 branchCode를 필수 필드로 가짐
**문제점**:
- Branch 엔티티 자체가 branchCode를 식별자로 사용
- 표준화 문서에 따르면 branchCode 사용 금지

**수정 계획**:
- [ ] Branch 엔티티의 역할 재정의 필요
- [ ] branchCode를 tenantId + branchId 조합으로 대체 검토
- [ ] 또는 Branch 개념 자체를 제거하고 tenantId만 사용

---

### Phase 5: Frontend branchCode 제거 (우선순위: LOW)

#### 5.1 Frontend 코드 수정
**수정 계획**:
- [ ] API 호출에서 branchCode 파라미터 제거
- [ ] 컴포넌트에서 branchCode prop 제거
- [ ] 브랜치 유틸리티 함수 Deprecated 처리

---

## 📊 작업 우선순위

### Critical (즉시 수정)
1. ✅ Service 계층에서 branchCode를 사용하는 비즈니스 로직 제거
2. ✅ Repository에서 branchCode를 사용하는 쿼리 제거

### High (우선 수정)
3. ⏳ Entity에서 branchCode 필드에 @Deprecated 강화
4. ⏳ Branch 엔티티 역할 재정의

### Medium (점진적 수정)
5. ⏳ Frontend branchCode 제거
6. ⏳ 테스트 코드에서 branchCode 사용 제거

---

## 🔧 수정 방법

### 1. Service 메서드 수정 예시

**수정 전**:
```java
public List<FinancialTransaction> getTransactionsByBranch(String branchCode) {
    return financialTransactionRepository.findByBranchCodeAndIsDeletedFalse(branchCode);
}
```

**수정 후**:
```java
/**
 * @Deprecated - branchCode 파라미터는 무시됩니다. tenantId 기반으로 조회합니다.
 */
@Deprecated
public List<FinancialTransaction> getTransactionsByBranch(String branchCode) {
    String tenantId = TenantContextHolder.getRequiredTenantId();
    return financialTransactionRepository.findByTenantIdAndIsDeletedFalse(tenantId);
}

// 새로운 메서드
public List<FinancialTransaction> getTransactionsByTenant() {
    String tenantId = TenantContextHolder.getRequiredTenantId();
    return financialTransactionRepository.findByTenantIdAndIsDeletedFalse(tenantId);
}
```

### 2. Repository 메서드 수정 예시

**수정 전**:
```java
Optional<Branch> findByBranchCodeAndIsDeletedFalse(String branchCode);
```

**수정 후**:
```java
/**
 * @Deprecated - branchCode 사용 금지. findByTenantIdAndIsDeletedFalse 사용하세요.
 */
@Deprecated
Optional<Branch> findByBranchCodeAndIsDeletedFalse(String branchCode);

// 새로운 메서드
Optional<Branch> findByTenantIdAndIsDeletedFalse(String tenantId);
```

---

## 📝 체크리스트

### Phase 1: Service 계층
- [ ] AdminServiceImpl.java - branchCode 사용 제거
- [ ] BranchServiceImpl.java - branchCode 사용 제거
- [ ] UserServiceImpl.java - branchCode 사용 제거
- [ ] FinancialTransactionServiceImpl.java - branchCode 사용 제거
- [ ] SocialAuthServiceImpl.java - branchCode 사용 제거
- [ ] 기타 17개 Service 파일 - branchCode 사용 제거

### Phase 2: Repository 계층
- [ ] BranchRepository.java - branchCode 메서드 제거
- [ ] ConsultantClientMappingRepository.java - branchCode 메서드 제거
- [ ] DailyStatisticsRepository.java - branchCode 메서드 제거
- [ ] 기타 7개 Repository - branchCode 메서드 제거

### Phase 3: Entity 계층
- [ ] 모든 Entity에 @Deprecated 어노테이션 추가
- [ ] 사용 금지 주석 강화

### Phase 4: Branch 엔티티
- [ ] Branch 엔티티 역할 재정의
- [ ] branchCode 필드 처리 방안 결정

### Phase 5: Frontend
- [ ] API 호출에서 branchCode 제거
- [ ] 컴포넌트에서 branchCode 제거

---

## 🚨 주의사항

1. **레거시 데이터 호환**: 기존 데이터는 유지하되, 새로운 코드에서는 사용 금지
2. **점진적 제거**: 한 번에 모든 것을 제거하지 않고 단계적으로 진행
3. **테스트 필수**: 각 단계마다 테스트 실행하여 회귀 방지
4. **문서화**: 모든 변경사항을 WORK_LOG.md에 기록

---

## 🔗 참조 문서

- [데이터베이스 스키마 표준](../../standards/DATABASE_SCHEMA_STANDARD.md)
- [작업 로그](./WORK_LOG.md)
- [표준화 진행 상황](./STANDARDIZATION_PROGRESS.md)

---

**최종 업데이트**: 2025-12-05


# Deprecated 메서드 교체 작업 계획

**작성일**: 2025-12-04  
**목적**: 사용 중인 Deprecated 브랜치 코드 메서드를 표준 메서드로 교체

---

## 📊 현재 상황

### ✅ 완료된 작업
1. BranchServiceImpl에서 브랜치 코드 사용 제거 완료
2. ConsultantRepository의 사용되지 않는 Deprecated 메서드 2개 제거 완료
3. 커밋 및 푸시 완료

### ⏳ 진행 필요 작업
사용 중인 Deprecated 메서드들을 표준 메서드로 교체해야 함

---

## 📋 교체 대상 메서드 및 사용처

### 1. `findByRoleAndIsActiveTrueAndBranchCode()` - 6개 파일

**Deprecated 메서드**:
```java
@Deprecated
@Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.role = :role AND u.isActive = true AND u.branchCode = :branchCode AND u.isDeleted = false")
List<User> findByRoleAndIsActiveTrueAndBranchCode(@Param("tenantId") String tenantId, @Param("role") UserRole role, @Param("branchCode") String branchCode);
```

**사용처**:
1. `AdminServiceImpl.java` (2곳)
   - 라인 4114: 지점별 활성 상담사 조회
   - 라인 4907: 지점별 활성 상담사 목록 조회
2. `SalaryManagementServiceImpl.java`
   - 라인 105: 상담사 조회
3. `StatisticsTestDataServiceImpl.java` (2곳)
   - 라인 67: 상담사 조회
   - 라인 77: 내담자 조회
4. `SalaryBatchServiceImpl.java`
   - 라인 212: 상담사 조회
5. `ConsultantRatingServiceImpl.java` (2곳)
   - 라인 545: 지점별 상담사 조회
   - 라인 616: 지점별 상담사 조회

**표준 메서드로 교체**:
- 브랜치 코드로 브랜치 엔티티를 먼저 조회
- `findByBranchAndRoleAndIsDeletedFalseOrderByUsername()` 사용
- 또는 `findAllByTenantIdAndBranchId()` 사용

---

### 2. `findByBranchCodeAndIsActive()` - 1개 파일

**Deprecated 메서드**:
```java
@Deprecated
@Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.branchCode = :branchCode AND (:isActive IS NULL OR u.isActive = :isActive) AND u.isDeleted = false")
List<User> findByBranchCodeAndIsActive(@Param("tenantId") String tenantId, @Param("branchCode") String branchCode, @Param("isActive") Boolean isActive);
```

**사용처**:
1. `AdminServiceImpl.java`
   - 라인 4597: 지점별 사용자 조회

**표준 메서드로 교체**:
- 브랜치 코드로 브랜치 엔티티를 먼저 조회
- `findByBranchAndIsDeletedFalseOrderByUsername()` 사용 후 필터링

---

### 3. `findByBranchCode()` - 1개 파일

**표준 메서드 (Deprecated 아님)**:
```java
@Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.branchCode = :branchCode AND u.isDeleted = false ORDER BY u.username")
List<User> findByBranchCode(@Param("tenantId") String tenantId, @Param("branchCode") String branchCode);
```

**사용처**:
1. `UserServiceImpl.java`
   - 라인 813: 지점 코드별 사용자 조회

**변경 필요**:
- 브랜치 코드 대신 브랜치 엔티티를 사용하도록 변경
- `findByBranchAndIsDeletedFalseOrderByUsername()` 사용

---

## 🎯 교체 전략

### 전략 1: 브랜치 코드 → 브랜치 엔티티 변환

각 교체 대상에서:
1. 브랜치 코드를 받는 경우 → 브랜치 코드로 브랜치 엔티티 조회
2. 브랜치 엔티티를 사용하는 표준 메서드 호출

### 전략 2: 메서드 시그니처 변경

가능한 경우:
- 브랜치 코드 파라미터를 브랜치 ID로 변경
- 브랜치 엔티티를 직접 받도록 변경

---

## 📋 단계별 실행 계획

### Phase 1: 표준 메서드 확인 및 정리 (1시간) - 완료 ✅
- [x] 표준 메서드 목록 확인
- [x] 각 교체 대상에 대한 표준 메서드 매핑
- [x] 교체 패턴 문서화

### Phase 2: 개별 파일 교체 (단계별 진행)

#### 2.1 UserServiceImpl.java (1개) - 완료 ✅
- [x] `findByBranchCode()` 메서드 수정 완료
  - 브랜치 코드 → 브랜치 엔티티로 변경
  - 표준 메서드 사용 (`findByBranchAndIsDeletedFalseOrderByUsername`)
  - null 체크 및 예외 처리 추가

#### 2.2 AdminServiceImpl.java (3곳) - 완료 ✅
- [x] 라인 4597: `findByBranchCodeAndIsActive()` 교체 완료
- [x] 라인 4114: `findByRoleAndIsActiveTrueAndBranchCode()` 교체 완료
- [x] 라인 4919: `findByRoleAndIsActiveTrueAndBranchCode()` 교체 완료
- [x] 브랜치 엔티티 기반 표준 메서드 사용으로 변경

#### 2.3 SalaryManagementServiceImpl.java (1곳) - 완료 ✅
- [x] 라인 105: `findByRoleAndIsActiveTrueAndBranchCode()` 교체 완료
- [x] BranchService 주입 추가
- [x] 브랜치 엔티티 기반 표준 메서드 사용으로 변경

#### 2.4 StatisticsTestDataServiceImpl.java (2곳) - 완료 ✅
- [x] 라인 67: `findByRoleAndIsActiveTrueAndBranchCode()` 교체 완료
- [x] 라인 77: `findByRoleAndIsActiveTrueAndBranchCode()` 교체 완료
- [x] BranchService 주입 추가
- [x] 브랜치 엔티티 기반 표준 메서드 사용으로 변경

#### 2.5 SalaryBatchServiceImpl.java (1곳) - 완료 ✅
- [x] 라인 212: `findByRoleAndIsActiveTrueAndBranchCode()` 교체 완료
- [x] BranchService 주입 추가
- [x] 브랜치 엔티티 기반 표준 메서드 사용으로 변경

#### 2.6 ConsultantRatingServiceImpl.java (2곳) - 완료 ✅
- [x] 라인 545: `findByRoleAndIsActiveTrueAndBranchCode()` 교체 완료
- [x] 라인 633: `findByRoleAndIsActiveTrueAndBranchCode()` 교체 완료
- [x] BranchService 주입 추가
- [x] 브랜치 엔티티 기반 표준 메서드 사용으로 변경

### Phase 3: Deprecated 메서드 제거 (1시간) - 완료 ✅
- [x] 모든 사용처 교체 확인 완료
- [x] UserRepository에서 Deprecated 메서드 완전 제거 완료
  - `findByRoleAndIsActiveTrueAndBranchCode()` 제거 완료
  - `findByBranchCodeAndIsActive()` 제거 완료
- [x] 최종 검증 완료 (grep 결과: 사용처 없음)

---

## 🔧 교체 패턴

### 패턴 1: 브랜치 코드로 브랜치 엔티티 조회 후 사용

```java
// 제거 전
List<User> users = userRepository.findByBranchCodeAndIsActive(tenantId, branchCode, isActive);

// 교체 후
Branch branch = branchService.getBranchByCode(branchCode);
List<User> users = userRepository.findByBranchAndIsDeletedFalseOrderByUsername(tenantId, branch);
// isActive 필터링은 Java 스트림으로 처리
if (isActive != null) {
    users = users.stream()
        .filter(u -> u.getIsActive().equals(isActive))
        .collect(Collectors.toList());
}
```

### 패턴 2: 역할 + 브랜치 조회

```java
// 제거 전
List<User> consultants = userRepository.findByRoleAndIsActiveTrueAndBranchCode(tenantId, role, branchCode);

// 교체 후
Branch branch = branchService.getBranchByCode(branchCode);
List<User> consultants = userRepository.findByBranchAndRoleAndIsDeletedFalseOrderByUsername(tenantId, branch, role);
// isActive = true 필터링은 Java 스트림으로 처리
consultants = consultants.stream()
    .filter(u -> Boolean.TRUE.equals(u.getIsActive()))
    .collect(Collectors.toList());
```

---

## ⚠️ 주의사항

1. **브랜치 코드 → 브랜치 엔티티 변환**
   - 각 교체 지점에서 브랜치 코드가 null일 수 있음
   - null 체크 필요

2. **성능 고려**
   - 브랜치 코드로 브랜치 엔티티 조회는 추가 쿼리 발생
   - 필요시 캐싱 고려

3. **기존 로직 유지**
   - isActive 필터링 등 기존 로직 유지
   - Java 스트림으로 필터링 처리

4. **테스트 필요**
   - 각 파일 교체 후 해당 기능 테스트
   - 통합 테스트 실행

---

## 📊 예상 작업 시간

- Phase 1: 표준 메서드 확인 및 정리 - 1시간
- Phase 2: 개별 파일 교체 - 6-8시간 (파일당 1시간)
- Phase 3: Deprecated 메서드 제거 - 1시간

**총 예상 시간**: 8-10시간

---

## 🎯 성공 기준

1. 모든 Deprecated 메서드 사용처 제거
2. 표준 메서드 사용으로 변경
3. 기존 기능 동작 유지
4. 코드 가독성 향상
5. 최종 검증 통과

---

**최종 업데이트**: 2025-12-04


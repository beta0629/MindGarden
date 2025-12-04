# 표준 메서드 매핑 가이드

**작성일**: 2025-12-04  
**목적**: Deprecated 브랜치 코드 메서드를 표준 메서드로 교체하기 위한 매핑 가이드

---

## 📋 표준 메서드 목록

### UserRepository 표준 메서드

1. **브랜치 엔티티로 조회**:
   ```java
   List<User> findByBranchAndIsDeletedFalseOrderByUsername(
       @Param("tenantId") String tenantId, 
       @Param("branch") Branch branch
   );
   ```

2. **브랜치 엔티티 + 역할로 조회**:
   ```java
   List<User> findByBranchAndRoleAndIsDeletedFalseOrderByUsername(
       @Param("tenantId") String tenantId, 
       @Param("branch") Branch branch, 
       @Param("role") UserRole role
   );
   ```

3. **브랜치 ID로 조회**:
   ```java
   List<User> findAllByTenantIdAndBranchId(
       @Param("tenantId") String tenantId, 
       @Param("branchId") Long branchId
   );
   ```

---

## 🔄 Deprecated 메서드 → 표준 메서드 매핑

### 1. `findByRoleAndIsActiveTrueAndBranchCode()` 교체

**Deprecated 메서드**:
```java
@Deprecated
List<User> findByRoleAndIsActiveTrueAndBranchCode(
    @Param("tenantId") String tenantId, 
    @Param("role") UserRole role, 
    @Param("branchCode") String branchCode
);
```

**표준 메서드로 교체**:
```java
// Step 1: 브랜치 코드로 브랜치 엔티티 조회
Branch branch = branchService.getBranchByCode(branchCode);

// Step 2: 표준 메서드로 조회
List<User> users = userRepository.findByBranchAndRoleAndIsDeletedFalseOrderByUsername(
    tenantId, branch, role
);

// Step 3: isActive = true 필터링 (Java 스트림)
users = users.stream()
    .filter(u -> Boolean.TRUE.equals(u.getIsActive()))
    .collect(Collectors.toList());
```

**주의사항**:
- `branchCode`가 null일 수 있으므로 null 체크 필요
- 브랜치를 찾을 수 없으면 예외 처리 필요

---

### 2. `findByBranchCodeAndIsActive()` 교체

**Deprecated 메서드**:
```java
@Deprecated
List<User> findByBranchCodeAndIsActive(
    @Param("tenantId") String tenantId, 
    @Param("branchCode") String branchCode, 
    @Param("isActive") Boolean isActive
);
```

**표준 메서드로 교체**:
```java
// Step 1: 브랜치 코드로 브랜치 엔티티 조회
Branch branch = branchService.getBranchByCode(branchCode);

// Step 2: 표준 메서드로 조회
List<User> users = userRepository.findByBranchAndIsDeletedFalseOrderByUsername(
    tenantId, branch
);

// Step 3: isActive 필터링 (Java 스트림)
if (isActive != null) {
    users = users.stream()
        .filter(u -> u.getIsActive().equals(isActive))
        .collect(Collectors.toList());
}
```

---

### 3. `findByBranchCode()` 교체

**현재 메서드 (표준이지만 브랜치 코드 사용)**:
```java
List<User> findByBranchCode(
    @Param("tenantId") String tenantId, 
    @Param("branchCode") String branchCode
);
```

**표준 메서드로 교체**:
```java
// Step 1: 브랜치 코드로 브랜치 엔티티 조회
Branch branch = branchService.getBranchByCode(branchCode);

// Step 2: 표준 메서드로 조회
return userRepository.findByBranchAndIsDeletedFalseOrderByUsername(
    tenantId, branch
);
```

---

## 🔧 공통 유틸리티 패턴

### 브랜치 코드 → 브랜치 엔티티 변환 헬퍼

```java
private Branch getBranchFromCode(String branchCode) {
    if (branchCode == null || branchCode.trim().isEmpty()) {
        return null;
    }
    try {
        return branchService.getBranchByCode(branchCode);
    } catch (EntityNotFoundException e) {
        log.warn("브랜치를 찾을 수 없습니다: {}", branchCode);
        return null;
    }
}
```

---

## 📊 교체 우선순위

1. **Phase 1**: UserServiceImpl.java (가장 간단)
2. **Phase 2**: AdminServiceImpl.java (3곳, 복잡도 중간)
3. **Phase 3**: 나머지 Service 파일들 (5개 파일, 7곳)

---

## ⚠️ 주의사항

1. **Null 체크 필수**: 브랜치 코드가 null일 수 있음
2. **예외 처리**: 브랜치를 찾을 수 없을 때의 처리
3. **성능**: 브랜치 코드 → 브랜치 엔티티 조회는 추가 쿼리
4. **로직 유지**: isActive 필터링 등 기존 로직 유지

---

**최종 업데이트**: 2025-12-04


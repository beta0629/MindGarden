# Deprecated 메서드 사용처 분석

**작성일**: 2025-12-04  
**목적**: 브랜치 코드 관련 Deprecated 메서드의 사용처 확인 및 제거 계획

---

## 📋 브랜치 코드 관련 Deprecated 메서드 목록

### ConsultantRepository
1. `findByBranchCodeAndIsDeletedFalse(String branchCode)` - 79-81줄
2. `findActiveConsultantsByBranchCode(String branchCode)` - 89-91줄

### UserRepository
1. `findByRoleAndIsActiveTrueAndBranchCode(String tenantId, UserRole role, String branchCode)` - 180-182줄
2. `findByBranchCodeAndIsActive(String tenantId, String branchCode, Boolean isActive)` - 360-361줄
3. `findByBranchCode(String tenantId, String branchCode)` - 916-917줄
4. `findByBranchCodeAndRoleAndIsDeletedFalseOrderByUsername(String tenantId, String branchCode, UserRole role)` - 929-930줄

---

## 🔍 사용처 조사

### 1. ConsultantRepository Deprecated 메서드
- `findByBranchCodeAndIsDeletedFalse()` - 사용처 확인 필요
- `findActiveConsultantsByBranchCode()` - 사용처 확인 필요

### 2. UserRepository Deprecated 메서드
- `findByBranchCodeAndIsActive()` - AdminServiceImpl.java에서 사용 중 (4597줄)
- `findByBranchCode()` - UserServiceImpl.java에서 사용 중 (813줄)
- `findByBranchCodeAndRoleAndIsDeletedFalseOrderByUsername()` - BranchServiceImpl.java에서 사용 중 (474줄)

---

## 📝 제거 계획

### Phase 1: 사용되지 않는 Deprecated 메서드 제거
- [ ] ConsultantRepository Deprecated 메서드 사용처 확인
- [ ] 사용되지 않으면 완전 제거

### Phase 2: 사용되는 Deprecated 메서드 교체
- [ ] AdminServiceImpl에서 `findByBranchCodeAndIsActive()` → 표준 메서드로 교체
- [ ] UserServiceImpl에서 `findByBranchCode()` → 표준 메서드로 교체
- [ ] BranchServiceImpl에서 `findByBranchCodeAndRoleAndIsDeletedFalseOrderByUsername()` → 표준 메서드로 교체

### Phase 3: Deprecated 메서드 완전 제거
- [ ] 모든 사용처 교체 완료 후 Deprecated 메서드 제거

---

**최종 업데이트**: 2025-12-04


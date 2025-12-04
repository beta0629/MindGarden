# Deprecated 메서드 제거 현황

**작성일**: 2025-12-04  
**상태**: 진행 중

---

## ✅ 완료된 작업

### 1. BranchServiceImpl 수정 완료
- [x] `getBranchConsultants()` 메서드에서 브랜치 코드 사용 제거
- [x] `findByBranchCodeAndRoleAndIsDeletedFalseOrderByUsername()` 호출 제거
- [x] 브랜치 엔티티만 사용하도록 변경

---

## 📋 Deprecated 메서드 사용 현황

### ConsultantRepository (사용되지 않음 - 제거 가능)
1. `findByBranchCodeAndIsDeletedFalse(String branchCode)` - **사용처 없음** ✅ 제거 가능
2. `findActiveConsultantsByBranchCode(String branchCode)` - **사용처 없음** ✅ 제거 가능

### UserRepository (여러 곳에서 사용 중)
1. `findByRoleAndIsActiveTrueAndBranchCode()` - **사용 중** (6개 파일)
   - AdminServiceImpl.java (2곳)
   - SalaryManagementServiceImpl.java
   - StatisticsTestDataServiceImpl.java (2곳)
   - SalaryBatchServiceImpl.java
   - ConsultantRatingServiceImpl.java (2곳)
   
2. `findByBranchCodeAndIsActive()` - **사용 중** (1개 파일)
   - AdminServiceImpl.java
   
3. `findByBranchCode()` - **사용 중** (1개 파일)
   - UserServiceImpl.java

### BranchRepository (사용 중)
1. `findByBranchCodeAndIsDeletedFalse()` - **사용 중** (1개 파일)
   - BranchInitializationService.java

---

## 🎯 제거 계획

### Phase 1: 사용되지 않는 Deprecated 메서드 제거 (즉시 가능)
- [ ] ConsultantRepository의 Deprecated 메서드 2개 제거
  - `findByBranchCodeAndIsDeletedFalse()`
  - `findActiveConsultantsByBranchCode()`

### Phase 2: 사용되는 Deprecated 메서드 교체 (단계적 진행)
- [ ] `findByRoleAndIsActiveTrueAndBranchCode()` 사용처 교체 (6개 파일)
- [ ] `findByBranchCodeAndIsActive()` 사용처 교체 (1개 파일)
- [ ] `findByBranchCode()` 사용처 교체 (1개 파일)
- [ ] `findByBranchCodeAndIsDeletedFalse()` 사용처 교체 (1개 파일)

### Phase 3: Deprecated 메서드 완전 제거
- [ ] 모든 사용처 교체 완료 후 Deprecated 메서드 제거

---

## 📝 다음 작업

1. **즉시 제거 가능**: ConsultantRepository의 Deprecated 메서드 2개
2. **단계적 교체 필요**: UserRepository의 Deprecated 메서드들 (8개 파일)
3. **특별 처리 필요**: BranchRepository의 `findByBranchCodeAndIsDeletedFalse()` (초기화 서비스에서 사용)

---

**최종 업데이트**: 2025-12-04


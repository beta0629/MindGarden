# Phase 2 작업 노트: Frontend 역할 하드코딩 제거

**작성일**: 2025-01-28  
**상태**: 진행 중

---

## ✅ 완료된 작업

### 1. 새로 생성된 파일

#### `frontend/src/constants/roles.js`
- 역할 상수 정의
- ADMIN_ROLES, HQ_ADMIN_ROLES, BRANCH_ADMIN_ROLES 목록
- RoleUtils 유틸리티 함수 제공
- 완료: ✅

#### `frontend/src/hooks/usePermissions.js`
- 권한 체크를 위한 Custom Hook
- hasPermission, hasAnyPermission, hasAllPermissions
- canManageCodeGroup, canManageUsers 등
- 완료: ✅

### 2. CommonCodeManagement.js 수정
- Import 추가 완료: ✅
- usePermissions Hook 추가 완료: ✅
- hasErpCodePermission 수정 완료: ✅
- hasBranchCodePermission 수정 완료: ✅
- hasGeneralCodePermission 수정 완료: ✅
- **남은 작업**: 
  - hasFinancialCodePermission
  - hasHqCodePermission

---

## 📝 남은 작업

### CommonCodeManagement.js
다음 2개 함수를 수정해야 합니다:

```javascript
// 라인 41-44: 수정 필요
const hasFinancialCodePermission = () => {
    // Before
    return user?.role === 'BRANCH_SUPER_ADMIN' || 
           user?.role === 'HQ_MASTER';
    // After
    return RoleUtils.hasRole(user, USER_ROLES.BRANCH_SUPER_ADMIN) ||
           RoleUtils.hasRole(user, USER_ROLES.HQ_MASTER);
};

// 라인 46-50: 수정 필요
const hasHqCodePermission = () => {
    // Before
    return user?.role === 'HQ_MASTER' || 
           user?.role === 'SUPER_HQ_ADMIN' ||
           user?.role === 'HQ_ADMIN';
    // After
    return RoleUtils.hasRole(user, USER_ROLES.HQ_MASTER) ||
           RoleUtils.hasRole(user, USER_ROLES.SUPER_HQ_ADMIN) ||
           RoleUtils.hasRole(user, USER_ROLES.HQ_ADMIN);
};
```

---

## 🔧 수동 수정 방법

1. 파일 열기: `frontend/src/components/admin/CommonCodeManagement.js`

2. 라인 41-44 찾아서 수정."
3. 라인 46-50 찾아서 수정
4. 저장하고 테스트

---

## 📋 다음 단계

CommonCodeManagement.js 수정 완료 후:
1. 기타 Frontend 파일 수정 (약 14개 파일)
2. 린트 체크 및 오류 수정
3. 테스트 및 검증
4. Phase 2 완료 보고서 작성


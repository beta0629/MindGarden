# Phase 2: 남은 작업 파일 요약

**작성일**: 2025-01-28

---

## ✅ 완료된 파일 (2개)

1. ✅ `CommonCodeManagement.js` - 5개 함수 수정 완료
2. ✅ `SessionContext.js` - 4개 함수 수정 완료

---

## 📋 수정 대상 파일 (5개)

### 1. `frontend/src/components/schedule/ScheduleDetailModal.js`
**상태**: 일부 수정됨 (import 추가 완료)
- **하드코딩 위치**: 1개
- 라인 37: `const isClient = user?.role === 'CLIENT';` → `RoleUtils.isClient(user)`

### 2. `frontend/src/components/dashboard/QuickActions.js` (7건)
**상태**: 미수정
- 라인 16: `user?.role === 'CONSULTANT'` → `RoleUtils.isConsultant(user)`
- 라인 48: `user?.role === 'CLIENT'` → `RoleUtils.isClient(user)`
- 라인 50: `user?.role === 'CONSULTANT'` → `RoleUtils.isConsultant(user)`
- 라인 82: `(user?.role === 'CLIENT' || user?.role === 'CONSULTANT')` → `(RoleUtils.isClient(user) || RoleUtils.isConsultant(user))`
- 라인 85: `user?.role === 'CLIENT' ? ...` → `RoleUtils.isClient(user) ? ...`
- 라인 90: `user?.role === 'CLIENT'` → `RoleUtils.isClient(user)`
- 라인 113: `(user?.role === 'ADMIN' || user?.role === 'BRANCH_SUPER_ADMIN' || user?.role === 'HQ_MASTER')` → `RoleUtils.isAdmin(user) || RoleUtils.hasRole(user, USER_ROLES.HQ_MASTER)`

### 3. `frontend/src/components/dashboard/SummaryPanels.js` (4건)
**상태**: 미수정
- 라인 56: `(user?.role === 'CONSULTANT' || user?.role === 'ADMIN' || user?.role === 'BRANCH_SUPER_ADMIN')` → `(RoleUtils.isConsultant(user) || RoleUtils.isAdmin(user))`
- 라인 130: `user?.role === 'CONSULTANT'` → `RoleUtils.isConsultant(user)`
- 라인 165: `(user?.role === 'ADMIN' || user?.role === 'BRANCH_SUPER_ADMIN')` → `RoleUtils.isAdmin(user)`
- 라인 197: `(user?.role === 'ADMIN' || user?.role === 'BRANCH_SUPER_ADMIN')` → `RoleUtils.isAdmin(user)`

### 4. `frontend/src/components/dashboard/CommonDashboard.js` (16건)
**상태**: 미수정
- 많은 하드코딩 존재 (16건)
- RoleUtils로 일괄 교체 필요

### 5. `frontend/src/components/hq/HQBranchManagement.js` (2건)
**상태**: 미수정
- 확인 필요

### 6. `frontend/src/components/dashboard/WelcomeSection.js`
**상태**: 미수정
- 확인 필요

---

## 📝 수정 패턴

### Import 추가
```javascript
import { RoleUtils, USER_ROLES } from '../../constants/roles';
```

### 단순 역할 체크
```javascript
// Before
user?.role === 'CLIENT'
user?.role === 'CONSULTANT'
user?.role === 'ADMIN'

// After
RoleUtils.isClient(user)
RoleUtils.isConsultant(user)
RoleUtils.isAdmin(user)
```

### 특정 역할 체크
```javascript
// Before
user?.role === 'BRANCH_SUPER_ADMIN'
user?.role === 'HQ_MASTER'

// After
RoleUtils.hasRole(user, USER_ROLES.BRANCH_SUPER_ADMIN)
RoleUtils.hasRole(user, USER_ROLES.HQ_MASTER)
```

### 여러 역할 중 하나 체크
```javascript
// Before
user?.role === 'ADMIN' || user?.role === 'BRANCH_SUPER_ADMIN' || user?.role === 'HQ_MASTER'

// After
RoleUtils.isAdmin(user) || RoleUtils.hasRole(user, USER_ROLES.HQ_MASTER)
```

---

## 🎯 우선순위

1. **높음**: `QuickActions.js` (7건), `SummaryPanels.js` (4건) - Dashboard 관련
2. **중간**: `CommonDashboard.js` (16건) - 많이 사용되는 컴포넌트
3. **낮음**: `HQBranchManagement.js`, `WelcomeSection.js`

---

**현재 진행률**: 2/7 파일 완료 (28.6%)


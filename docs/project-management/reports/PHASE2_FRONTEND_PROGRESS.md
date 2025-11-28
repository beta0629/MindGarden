# Phase 2: Frontend 역할 하드코딩 제거 진행 현황

**작성일**: 2025-01-28

---

## ✅ 완료된 작업

### 1. 유틸리티/상수 파일 생성
- ✅ `frontend/src/constants/roles.js` - 역할 상수 및 RoleUtils
- ✅ `frontend/src/hooks/usePermissions.js` - 권한 체크 Hook

### 2. 수정된 파일
- ✅ `frontend/src/components/admin/CommonCodeManagement.js` - 5개 함수 수정
- ✅ `frontend/src/contexts/SessionContext.js` - 4개 함수 수정

---

## 📋 남은 작업

### 수정 대상 파일 (5개)

#### 1. `frontend/src/components/schedule/ScheduleDetailModal.js`
- 확인 필요: 역할 비교 로직

#### 2. `frontend/src/components/dashboard/WelcomeSection.js`
- 확인 필요: 역할 비교 로직

#### 3. `frontend/src/components/dashboard/QuickActions.js`
- 확인 필요: 역할 비교 로직 (7건)

#### 4. `frontend/src/components/dashboard/SummaryPanels.js`
- 확인 필요: 역할 비교 로직 (4건)

#### 5. `frontend/src/components/dashboard/CommonDashboard.js`
- 확인 필요: 역할 비교 로직 (16건)

#### 6. `frontend/src/components/hq/HQBranchManagement.js`
- 확인 필요: 역할 비교 로직 (2건)

---

## 📝 수정 패턴

각 파일에서 다음 패턴을 찾아 수정:

```javascript
// Before
if (user?.role === 'ADMIN') { ... }
if (user?.role === 'BRANCH_SUPER_ADMIN') { ... }
user?.role === 'CLIENT' ? ... : ...

// After
if (동戍 ′user, USER_ROLES.ADMIN)) { ... }
if (RoleUtils.hasRole(user, USER_ROLES.BRANCH_SUPER_ADMIN)) { ... }
RoleUtils.isClient(user) ? ... : ...
```

---

## 🔧 다음 단계

1. 각 파일을 열어서 하드코딩 위치 확인
2. 상단에 import 추가: `import { RoleUtils, USER_ROLES } from '../../constants/roles';`
3. 역할 비교 코드를 RoleUtils 사용으로 변경
4. 린트 체크 및 테스트

---

**현재 진행률**: 2/7 파일 완료 (28.6%)


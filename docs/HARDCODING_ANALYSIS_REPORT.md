# 하드코딩 분석 보고서

**작성일**: 2025-01-28  
**분석 범위**: 전체 시스템 (Backend + Frontend)

---

## 📊 전체 현황 요약

### 하드코딩 유형별 현황
| 유형 | 위치 | 개수 | 우선순위 |
|------|------|------|----------|
| 역할 이름 | Backend Java | 5+ 파일 | 🔴 높음 |
| 역할 이름 | Frontend JS | 14 파일 | 🔴 높음 |
| 상태값 | Frontend JS | 다수 | 🟡 중간 |
| 색상/아이콘 | Frontend JS | 다수 | 🟢 낮음 |
| 코드그룹 | Frontend JS | 1 파일 | 🟡 중간 |

---

## 🔴 높은 우선순위: 역할 이름 하드코딩

### 1. Backend Java 파일

#### 1.1 `ConsultationMessageController.java` (Line 124)
```java
message.getSenderType().equals("CONSULTANT") ? "CLIENT" : "CONSULTANT"
```
**문제**: 역할 문자열을 하드코딩  
**해결**: `UserRole` enum 또는 공통코드 활용

#### 1.2 `AdminController.java` (Line 403)
```java
if (currentUser.getRole().name().equals("BRANCH_SUPER_ADMIN"))
```
**문제**: 역할 이름 비교를 문자열로 수행  
**해결**: enum 활용 (`currentUser.getRole() == UserRole.BRANCH_SUPER_ADMIN`)

#### 1.3 `BranchManagementController.java` (Line 147-148)
```java
.filter(u -> u.getRole().name().equals("CLIENT"))
.filter(u -> u.getRole().name().equals("CONSULTANT"))
```
**문제**: 다중 역할 문자열 비교  
**해결**: enum 리스트 활용

#### 1.4 `SystemConfigController.java` (Line 47-53)
```java
role.equals("ADMIN") ||
role.equals("BRANCH_ADMIN") ||
role.equals("BRANCH_MANAGER") ||
role.equals("BRANCH_SUPER_ADMIN") ||
role.equals("HQ_ADMIN") ||
role.equals("SUPER_HQ_ADMIN") ||
role.equals("HQ_MASTER")
```
**문제**: 여러 역할을 하드코딩된 문자열로 체크  
**해결**: 관리자 역할 리스트를 상수로 정의하거나 권한 시스템 활용

#### 1.5 `BranchServiceImpl.java` (Line 405-407)
```java
if (user.getRole().equals("CONSULTANT"))
else if (user.getRole().equals("CLIENT"))
```
**문제**: 역할별 로직 분기 시 하드코딩  
**해결**: enum switch 문 사용

### 2. Frontend JavaScript 파일

#### 2.1 `CommonCodeManagement.js` (Lines 34-60)
```javascript
const hasErpCodePermission = () => {
    return user?.role === 'BRANCH_SUPER_ADMIN' || 
           user?.role === 'HQ_MASTER';
};

const hasFinancialCodePermission = () => {
    return user?.role === 'BRANCH_SUPER_ADMIN' || 
           user?.role === 'HQ_MASTER';
};
// ... 더 많은 권한 체크 함수들
```
**개수**: 14개 권한 체크 함수에서 역할 하드코딩  
**문제**: 새로운 역할 추가 시 코드 수정 필요  
**해결**: 권한 시스템 API 활용 (`/api/permissions/my-permissions`)

#### 2.2 기타 Frontend 파일들
- `AdminDashboard.js`: 2개
- `SessionContext.js`: 3개
- `CommonDashboard.js`: 16개
- `ConsultationHistory.js`: 5개
- `UserManagement.js`: 5개
- **총 14개 파일에서 57건**

---

## 🟡 중간 우선순위: 상태값 하드코딩

### 1. Fallback 값 하드코딩

여러 컴포넌트에서 API 호출 실패 시 하드코딩된 fallback 값을 사용:

#### `ConsultationHistory.js` (Lines 51-60)
```javascript
setStatusOptions([
  { value: 'PENDING', label: '대기', icon: '⏳', color: '#f59e0b' },
  { value: 'BOOKED', label: '예약', icon: '📅', color: '#3b82f6' },
  { value: 'CONFIRMED', label: '확정', icon: '✅', color: '#10b981' },
  // ... 더 많은 상태값들
]);
```

#### `PaymentManagement.js` (Lines 70-79)
```javascript
setPaymentStatusOptions([
  { value: 'PENDING', label: '대기중', icon: '⏳', color: '#f59e0b' },
  { value: 'PROCESSING', label: '처리중', icon: '🔄', color: '#3b82f6' },
  // ... 더 많은 결제 상태값들
]);
```

#### `ConsultantClientList.js` (Lines 182-188)
```javascript
const defaultOptions = [
  { value: 'ACTIVE', label: '활성', icon: '🟢', color: '#10b981' },
  { value: 'INACTIVE', label: '비활성', icon: '🔴', color: '#6b7280' },
  // ... 더 많은 사용자 상태값들
];
```

**문제**: API 실패 시에도 동작하지만, DB 변경 시 불일치 발생 가능  
**해결**: DB에 상태값 저장, fallback 제거 또는 DB 기본값 강제

### 2. 코드그룹 하드코딩

#### `CommonCodeManagement.js` (Lines 62-80)
```javascript
const isErpCodeGroup = (codeGroup) => {
    return ['ITEM_CATEGORY', 'ITEM_STATUS', 'PURCHASE_STATUS', 
            'BUDGET_CATEGORY', 'APPROVAL_TYPE', 'APPROVAL_STATUS', 
            'APPROVAL_PRIORITY'].includes(codeGroup);
};

const isFinancialCodeGroup = (codeGroup) => {
    return ['FINANCIAL_CATEGORY', 'FINANCIAL_SUBCATEGORY', 
            'TRANSACTION_TYPE', 'PAYMENT_METHOD', 'PAYMENT_STATUS', 
            'SALARY_TYPE', 'SALARY_GRADE', 'TAX_TYPE'].includes(codeGroup);
};
// ... 더 많은 코드그룹 리스트들
```

**문제**: 코드그룹 분류가 하드코딩됨  
**해결**: 코드그룹 메타데이터에 `category` 필드 추가

---

## 🟢 낮은 우선순위: 색상/아이콘 하드코딩

여러 컴포넌트에서 상태별 색상과 아이콘이 fallback으로 하드코딩되어 있습니다.
이는 UI 일관성에 영향을 주지만, 기능적으로는 큰 문제가 아닙니다.

**이미 일부 개선됨**: `ScheduleCalendar.js` 등에서는 공통코드의 `color_code` 및 `icon` 필드를 우선 사용하고 있습니다.

---

## 📝 해결 방안

### Phase 1: Backend 역할 이름 하드코딩 제거 (높은 우선순위)

#### 1.1 UserRole enum 활용
모든 역할 비교를 enum으로 변경:
```java
// Before
if (user.getRole().name().equals("BRANCH_SUPER_ADMIN"))

// After
if (user.getRole() == UserRole.BRANCH_SUPER_ADMIN)
```

#### 1.2 상수 클래스 활용
**파일**: `src/main/java/com/mindgarden/consultation/constant/AdminRoles.java` (신규 생성)
```java
public class AdminRoles {
    public static final Set<String> ADMIN_ROLES = Set.of(
        UserRole.ADMIN.name(),
        UserRole.BRANCH_ADMIN.name(),
        UserRole.BRANCH_SUPER_ADMIN.name(),
        UserRole.HQ_MASTER.name(),
        UserRole.SUPER_HQ_ADMIN.name(),
        UserRole.HQ_ADMIN.name()
    );
    
    public static boolean isAdmin(User user) {
        return user != null && ADMIN_ROLES.contains(user.getRole().name());
    }
}
```

#### 1.3 권한 시스템 활용 (권장)
이미 존재하는 `DynamicPermissionService` 활용:
```java
// Before
if (user.getRole().name().equals("BRANCH_SUPER_ADMIN"))

// After
if (dynamicPermissionService.hasPermission(user, "CODE_MANAGE"))
```

### Phase 2: Frontend 역할/권한 체크 개선

#### 2.1 권한 API 활용
```javascript
// Before
const hasErpCodePermission = () => {
    return user?.role === 'BRANCH_SUPER_ADMIN' || 
           user?.role === 'HQ_MASTER';
};

// After
const hasErpCodePermission = () => {
    return userPermissions?.some(p => 
        p.code === 'ERP_CODE_MANAGE' || p.code === 'ALL_CODE_MANAGE'
    );
};
```

#### 2.2 Permission Hook 생성
**파일**: `frontend/src/hooks/usePermissions.js` (신규 생성)
```javascript
import { useSession } from '../contexts/SessionContext';

export const usePermissions = () => {
    const { user, userPermissions } = useSession();
    
    const hasPermission = (code) => {
        return userPermissions?.some(p => p.code === code);
    };
    
    const hasAnyPermission = (codes) => {
        return codes.some(code => hasPermission(code));
    };
    
    return { hasPermission, hasAnyPermission };
};
```

### Phase 3: 상태값 Fallback 제거

#### 3.1 DB에 기본값 강제
공통코드 삭제 불가 설정, 기본값 강제 적용

#### 3.2 에러 처리 개선
```javascript
// Before
} catch (error) {
    setStatusOptions([/* 하드코딩된 fallback */]);
}

// After
} catch (error) {
    console.error('상태 코드 로드 실패:', error);
    notificationManager.error('상태 코드를 불러올 수 없습니다. 관리자에게 문의하세요.');
    setStatusOptions([]); // 빈 배열
}
```

### Phase 4: 코드그룹 메타데이터 확장

#### 4.1 code_group_metadata 테이블 확장
```sql
ALTER TABLE code_group_metadata ADD COLUMN category VARCHAR(50);
-- 'ERP', 'FINANCIAL', 'HQ', 'BRANCH', 'GENERAL' 등
```

#### 4.2 동적 분류
```javascript
const isErpCodeGroup = (codeGroup) => {
    const metadata = groupMetadata.find(m => m.groupName === codeGroup);
    return metadata?.category === 'ERP';
};
```

---

## ✅ 즉시 적용 가능한 임시 해결책

### 1. 상수 파일 생성
**파일**: `frontend/src/constants/roles.js`
```javascript
export const USER_ROLES = {
    CLIENT: 'CLIENT',
    CONSULTANT: 'CONSULTANT',
    ADMIN: 'ADMIN',
    BRANCH_ADMIN: 'BRANCH_ADMIN',
    BRANCH_SUPER_ADMIN: 'BRANCH_SUPER_ADMIN',
    BRANCH_MANAGER: 'BRANCH_MANAGER',
    HQ_ADMIN: 'HQ_ADMIN',
    SUPER_HQ_ADMIN: 'SUPER_HQ_ADMIN',
    HQ_MASTER: 'HQ_MASTER'
};

export const ADMIN_ROLES = [
    USER_ROLES.ADMIN,
    USER_ROLES.BRANCH_ADMIN,
    USER_ROLES.BRANCH_SUPER_ADMIN,
    USER_ROLES.BRANCH_MANAGER,
    USER_ROLES.HQ_ADMIN,
    USER_ROLES.SUPER_HQ_ADMIN,
    USER_ROLES.HQ_MASTER
];
```

### 2. 공통 함수 생성
**파일**: `frontend/src/utils/roleUtils.js`
```javascript
export const isAdmin = (user) => {
    if (!user?.role) return false;
    const ADMIN_ROLES = ['ADMIN', 'BRANCH_ADMIN', 'BRANCH_SUPER_ADMIN', 
                         'BRANCH_MANAGER', 'HQ_ADMIN', 'SUPER_HQ_ADMIN', 'HQ_MASTER'];
    return ADMIN_ROLES.includes(user.role);
};

export const canManageErpCodes = (user) => {
    return user?.role === 'BRANCH_SUPER_ADMIN' || user?.role === 'HQ_MASTER';
};
```

---

## 📊 작업 우선순위 정리

### 즉시 처리 (높은 우선순위)
1. ✅ Backend Java: 역할 이름 enum 활용 (5개 파일)
2. ✅ Backend Java: 상수 클래스 또는 권한 시스템 활용
3. ⏳ Frontend: 권한 체크를 `usePermissions` Hook으로 교체 (14개 파일)
4. ⏳ Frontend: 상수 파일 생성 및 적용

### 단계적 처리 (중간 우선순위)
5. ⏳ 상태값 fallback 제거 또는 개선
6. ⏳ 코드그룹 분류를 메타데이터로 이동

### 장기 개선 (낮은 우선순위)
7. ⏳ 색상/아이콘을 DB에서 관리
8. ⏳ 전반적인 공통코드 시스템 고도화

---

## 📅 예상 작업 시간

- **Phase 1** (Backend): 4-6시간
- **Phase 2** (Frontend 권한): 6-8시간
- **Phase 3** (상태값 개선): 4-6시간
- **Phase 4** (메타데이터 확장): 2-4시간

**총 예상 시간**: 16-24시간

---

## 🔍 참고 사항

1. 이미 `archive/HARDCODED_ELEMENTS_ANALYSIS.md`에 일부 분석 내용이 있음
2. 이미 `archive/HARDCODED_SELECT_OPTIONS_REMAINING.md`에 셀렉트 박스 관련 하드코딩 분석이 있음
3. `CommonCodeConstants.java`에 일부 상수가 정의되어 있음
4. `DynamicPermissionService`가 이미 구현되어 있음

---

**작성자**: Auto (AI Assistant)  
**검토 필요**: 사용자 검토 및 승인 필요


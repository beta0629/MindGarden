# 코딩 표준

## ⚠️ **필수 규칙**

### **1. 컴포넌트화** 🧩
- **모든 UI 요소는 재사용 가능한 컴포넌트로 구현**
- **단일 책임 원칙 준수**
- **Props 기반 설계**
- **독립적인 CSS 파일 분리**

### **2. 상수 사용** 📊
- **모든 비즈니스 로직 값은 상수로 정의**
- **하드코딩 절대 금지**
- **CSS 변수, JavaScript 상수, API 엔드포인트 모두 상수화**

---

## 🧩 컴포넌트화 표준

### **컴포넌트 구조**
```
frontend/src/components/
├── [기능명]/
│   ├── [ComponentName].js      # 컴포넌트 로직
│   ├── [ComponentName].css     # 독립적인 스타일
│   └── index.js               # 컴포넌트 내보내기
```

### **컴포넌트 명명 규칙**
- **PascalCase** 사용 (예: `SystemStatus`, `UserProfile`)
- **기능명 + 역할** 조합 (예: `SystemStatus`, `UserProfile`, `DataTable`)
- **약어 사용 금지** (예: `SysStatus` ❌, `SystemStatus` ✅)

### **Props 설계 원칙**
```javascript
// ✅ 올바른 Props 설계
const UserProfile = ({ 
    user,           // 데이터
    onEdit,         // 이벤트 핸들러
    loading,        // 상태
    showActions     // 설정
}) => {
    // 컴포넌트 로직
};

// ❌ 잘못된 Props 설계
const UserProfile = () => {
    const user = { name: '홍길동' }; // 하드코딩 금지
    // ...
};
```

### **컴포넌트 파일 구조**
```javascript
// ComponentName.js
import React from 'react';
import { CONSTANTS } from '../../constants/componentName';
import './ComponentName.css';

/**
 * 컴포넌트 설명
 * 
 * @param {Object} props - 컴포넌트 Props
 * @param {Function} props.onAction - 액션 핸들러
 * @param {boolean} props.loading - 로딩 상태
 */
const ComponentName = ({ onAction, loading }) => {
    // 컴포넌트 로직
    return (
        <div className="component-name">
            {/* JSX 내용 */}
        </div>
    );
};

export default ComponentName;
```

---

## 📊 상수 사용 표준

### **JavaScript 상수**
```javascript
// constants/[기능명].js
export const [기능명]_CONSTANTS = {
    API_ENDPOINTS: {
        LIST: '/api/[기능명]',
        CREATE: '/api/[기능명]',
        UPDATE: '/api/[기능명]/{id}',
        DELETE: '/api/[기능명]/{id}'
    },
    STATUS: {
        ACTIVE: 'active',
        INACTIVE: 'inactive',
        PENDING: 'pending'
    },
    MESSAGES: {
        SUCCESS: '성공적으로 처리되었습니다.',
        ERROR: '오류가 발생했습니다.',
        LOADING: '로딩 중...'
    }
};
```

### **CSS 상수**
```css
/* CSS 변수 정의 */
:root {
    /* 색상 */
    --[기능명]-primary-color: #4A90E2;
    --[기능명]-success-color: #28a745;
    --[기능명]-error-color: #dc3545;
    
    /* 간격 */
    --[기능명]-spacing-xs: 4px;
    --[기능명]-spacing-sm: 8px;
    --[기능명]-spacing-md: 16px;
    
    /* 크기 */
    --[기능명]-border-radius: 8px;
    --[기능명]-box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* CSS에서 사용 */
.[기능명]-component {
    background: var(--[기능명]-primary-color);
    padding: var(--[기능명]-spacing-md);
    border-radius: var(--[기능명]-border-radius);
}
```

### **API 엔드포인트 상수**
```javascript
// constants/api.js
export const API_ENDPOINTS = {
    ADMIN: {
        DASHBOARD: '/api/admin/dashboard',
        USERS: '/api/admin/users',
        SYSTEM: {
            HEALTH: '/api/health',
            LOGS: '/api/admin/logs',
            BACKUP: '/api/admin/backup'
        }
    },
    USER: {
        PROFILE: '/api/user/profile',
        SETTINGS: '/api/user/settings'
    }
};
```

---

## 🚫 금지 사항

### **하드코딩 금지**
```javascript
// ❌ 하드코딩 금지
const fetchData = async () => {
    const response = await fetch('/api/admin/users'); // 하드코딩
    const data = await response.json();
    return data;
};

// ✅ 상수 사용
import { API_ENDPOINTS } from '../../constants/api';

const fetchData = async () => {
    const response = await fetch(API_ENDPOINTS.ADMIN.USERS);
    const data = await response.json();
    return data;
};
```

### **인라인 스타일 금지**
```javascript
// ❌ 인라인 스타일 금지
<div style={{ 
    backgroundColor: '#ffffff', 
    padding: '16px', 
    borderRadius: '8px' 
}}>
    내용
</div>

// ✅ CSS 클래스 사용
<div className="component-container">
    내용
</div>
```

### **컴포넌트 내부 로직 금지**
```javascript
// ❌ 컴포넌트 내부에 비즈니스 로직
const UserList = () => {
    const [users, setUsers] = useState([]);
    
    const fetchUsers = async () => {
        // API 호출 로직이 컴포넌트 내부에 있음
        const response = await fetch('/api/users');
        const data = await response.json();
        setUsers(data);
    };
    
    return <div>{/* JSX */}</div>;
};

// ✅ Props로 데이터와 핸들러 전달
const UserList = ({ users, onFetchUsers, loading }) => {
    return <div>{/* JSX */}</div>;
};
```

---

## ✅ 체크리스트

### **컴포넌트 개발 체크리스트**
- [ ] **단일 책임**: 컴포넌트가 하나의 명확한 역할을 가짐
- [ ] **Props 기반**: 모든 데이터와 이벤트가 Props로 전달됨
- [ ] **하드코딩 없음**: 모든 값이 상수로 정의됨
- [ ] **독립적 CSS**: 컴포넌트별 CSS 파일 분리
- [ ] **재사용 가능**: 다른 페이지에서도 사용 가능
- [ ] **테스트 가능**: 단위 테스트 작성 가능
- [ ] **문서화**: Props와 사용법이 명확히 문서화됨

### **상수 사용 체크리스트**
- [ ] **API 엔드포인트**: 모든 API URL이 상수로 정의됨
- [ ] **상태 값**: 모든 상태 값이 상수로 정의됨
- [ ] **메시지**: 모든 사용자 메시지가 상수로 정의됨
- [ ] **CSS 값**: 모든 색상, 간격, 크기가 CSS 변수로 정의됨
- [ ] **설정 값**: 모든 설정 값이 상수로 정의됨

---

## 📝 예시

### **완전한 컴포넌트 예시**

#### **1. 상수 정의**
```javascript
// constants/userProfile.js
export const USER_PROFILE_CONSTANTS = {
    API_ENDPOINTS: {
        GET_PROFILE: '/api/user/profile',
        UPDATE_PROFILE: '/api/user/profile'
    },
    STATUS: {
        LOADING: 'loading',
        SUCCESS: 'success',
        ERROR: 'error'
    },
    MESSAGES: {
        LOADING: '프로필을 불러오는 중...',
        SUCCESS: '프로필이 성공적으로 업데이트되었습니다.',
        ERROR: '프로필 업데이트에 실패했습니다.'
    }
};
```

#### **2. CSS 변수**
```css
/* UserProfile.css */
:root {
    --user-profile-bg: #ffffff;
    --user-profile-border: #e5e7eb;
    --user-profile-radius: 12px;
    --user-profile-spacing: 16px;
}

.user-profile {
    background: var(--user-profile-bg);
    border: 1px solid var(--user-profile-border);
    border-radius: var(--user-profile-radius);
    padding: var(--user-profile-spacing);
}
```

#### **3. 컴포넌트 구현**
```javascript
// UserProfile.js
import React from 'react';
import { USER_PROFILE_CONSTANTS } from '../../constants/userProfile';
import './UserProfile.css';

/**
 * 사용자 프로필 컴포넌트
 * 
 * @param {Object} user - 사용자 정보
 * @param {Function} onUpdate - 프로필 업데이트 핸들러
 * @param {string} status - 로딩 상태
 */
const UserProfile = ({ user, onUpdate, status }) => {
    const { API_ENDPOINTS, STATUS, MESSAGES } = USER_PROFILE_CONSTANTS;
    
    const handleUpdate = () => {
        onUpdate(API_ENDPOINTS.UPDATE_PROFILE, user);
    };
    
    return (
        <div className="user-profile">
            <h3>{user.name}</h3>
            <p>{user.email}</p>
            <button 
                onClick={handleUpdate}
                disabled={status === STATUS.LOADING}
            >
                {status === STATUS.LOADING ? MESSAGES.LOADING : '프로필 업데이트'}
            </button>
        </div>
    );
};

export default UserProfile;
```

#### **4. 사용법**
```javascript
// ParentComponent.js
import UserProfile from './UserProfile';
import { USER_PROFILE_CONSTANTS } from '../../constants/userProfile';

const ParentComponent = () => {
    const [user, setUser] = useState(null);
    const [status, setStatus] = useState(USER_PROFILE_CONSTANTS.STATUS.LOADING);
    
    const handleUpdate = async (endpoint, userData) => {
        setStatus(USER_PROFILE_CONSTANTS.STATUS.LOADING);
        try {
            // API 호출 로직
            setStatus(USER_PROFILE_CONSTANTS.STATUS.SUCCESS);
        } catch (error) {
            setStatus(USER_PROFILE_CONSTANTS.STATUS.ERROR);
        }
    };
    
    return (
        <UserProfile 
            user={user}
            onUpdate={handleUpdate}
            status={status}
        />
    );
};
```

---

## 🎯 결론

**모든 메뉴와 기능은 반드시 컴포넌트화하고 상수를 사용해야 합니다.**

- **컴포넌트화**: 재사용 가능한 구조로 개발
- **상수 사용**: 하드코딩 없이 유지보수 가능한 코드
- **일관성**: 프로젝트 전체에서 동일한 패턴 적용
- **확장성**: 새로운 기능 추가 시 기존 패턴 활용

이 표준을 준수하여 개발하면 **유지보수가 쉽고 확장 가능한 코드**를 작성할 수 있습니다.

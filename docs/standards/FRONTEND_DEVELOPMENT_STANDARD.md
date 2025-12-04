# 프론트엔드 개발 표준

**버전**: 1.0.0  
**최종 업데이트**: 2025-12-03  
**상태**: 공식 표준

---

## 📌 개요

MindGarden 프로젝트의 프론트엔드 개발 표준입니다.  
React 기반 프론트엔드 개발 시 준수해야 할 구조, 패턴, 규칙을 정의합니다.

### 참조 문서
- [코드 스타일 표준](./CODE_STYLE_STANDARD.md)
- [디자인 중앙화 표준](./DESIGN_CENTRALIZATION_STANDARD.md)
- [API 설계 표준](./API_DESIGN_STANDARD.md)
- [API 연동 표준](./API_INTEGRATION_STANDARD.md)
- [버튼 디자인 표준](./BUTTON_DESIGN_STANDARD.md)
- [화면 컴포넌트 구성 표준](./COMPONENT_STRUCTURE_STANDARD.md)
- [컴포넌트 템플릿 표준](./COMPONENT_TEMPLATE_STANDARD.md) (로딩바 표준 포함)

### 기술 스택
- **프레임워크**: React 18+
- **라우팅**: React Router v6
- **상태 관리**: Context API + useReducer
- **스타일링**: CSS (디자인 시스템)
- **빌드 도구**: Create React App

---

## 🎯 프론트엔드 개발 원칙

### 1. 컴포넌트 중심 개발
```
모든 UI 요소는 재사용 가능한 컴포넌트로 구현
```

**원칙**:
- ✅ 단일 책임 원칙 (Single Responsibility Principle)
- ✅ Props 기반 설계
- ✅ 재사용 가능한 컴포넌트 우선
- ❌ 비즈니스 로직과 UI 로직 혼재 금지

### 2. 상수 사용 필수
```
하드코딩 절대 금지, 모든 값은 상수로 정의
```

**원칙**:
- ✅ CSS 클래스명 상수화
- ✅ API 엔드포인트 상수화
- ✅ 메시지/라벨 상수화
- ✅ 매직 넘버 상수화

### 3. 디자인 시스템 준수
```
MindGarden 디자인 시스템 v2.0 준수 필수
```

**원칙**:
- ✅ `mg-v2-*` CSS 클래스 사용
- ✅ 공통 UI 컴포넌트 사용 (`components/ui/`)
- ✅ 인라인 스타일 금지
- ✅ 디자인 토큰 사용

---

## 📁 파일 구조

### 1. 디렉토리 구조

```
frontend/src/
├── components/          # 컴포넌트
│   ├── admin/          # 관리자 컴포넌트
│   ├── client/         # 클라이언트 컴포넌트
│   ├── consultant/     # 상담사 컴포넌트
│   ├── common/         # 공통 컴포넌트
│   └── ui/             # UI 라이브러리 (표준 컴포넌트)
├── constants/          # 상수 정의
│   ├── api.js          # API 엔드포인트
│   ├── css.js          # CSS 클래스명
│   └── roles.js        # 역할 상수
├── contexts/           # Context API
│   ├── SessionContext.js
│   └── ThemeContext.js
├── hooks/              # Custom Hooks
│   ├── useSession.js
│   └── usePermissions.js
├── utils/              # 유틸리티 함수
│   ├── ajax.js         # API 호출
│   └── sessionManager.js
├── styles/             # 스타일 파일
│   ├── main.css        # 메인 스타일
│   └── unified-design-tokens.css
└── App.js              # 루트 컴포넌트
```

### 2. 컴포넌트 파일 구조

```javascript
// components/admin/UserManagement.js
import React, { useState, useEffect } from 'react';
import { useSession } from '../../contexts/SessionContext';
import { apiGet, apiPost } from '../../utils/ajax';
import { ADMIN_API } from '../../constants/api';
import { MG_BUTTON, MG_CARD } from '../../constants/css';
import './UserManagement.css';

/**
 * 사용자 관리 컴포넌트
 * 
 * @description 관리자가 사용자를 생성, 수정, 삭제하는 컴포넌트
 */
const UserManagement = () => {
  // 컴포넌트 로직
  return (
    <div className="user-management">
      {/* JSX 내용 */}
    </div>
  );
};

export default UserManagement;
```

---

## 🧩 컴포넌트 개발 패턴

### 1. 컴포넌트 명명 규칙

```javascript
// ✅ 권장: PascalCase
const UserProfile = () => { };
const ConsultationList = () => { };
const AdminDashboard = () => { };

// ❌ 금지
const userProfile = () => { };
const user_profile = () => { };
```

### 2. Props 설계

```javascript
// ✅ 권장: 명확한 Props 정의
const UserCard = ({
  user,           // 데이터
  onEdit,         // 이벤트 핸들러
  onDelete,       // 이벤트 핸들러
  loading,        // 상태
  showActions     // 설정
}) => {
  // 컴포넌트 로직
};

// ❌ 금지: 비즈니스 로직 혼재
const UserCard = () => {
  const user = { name: '홍길동' }; // 하드코딩
  // ...
};
```

### 3. 컴포넌트 분리 원칙

```javascript
// ✅ 권장: 작고 명확한 컴포넌트
const UserList = () => {
  return (
    <div>
      {users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
};

const UserCard = ({ user }) => {
  return (
    <div className={MG_CARD}>
      <h3>{user.name}</h3>
    </div>
  );
};

// ❌ 금지: 큰 단일 컴포넌트
const UserList = () => {
  // 500줄 이상의 코드...
};
```

---

## 🎣 Custom Hooks 패턴

### 1. 데이터 페칭 Hook

```javascript
// hooks/useUsers.js
import { useState, useEffect } from 'react';
import { apiGet } from '../utils/ajax';
import { ADMIN_API } from '../constants/api';

/**
 * 사용자 목록 조회 Hook
 */
export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await apiGet(ADMIN_API.USERS);
        setUsers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return { users, loading, error };
};
```

### 2. 세션 관리 Hook

```javascript
// hooks/useSession.js
import { useContext } from 'react';
import { SessionContext } from '../contexts/SessionContext';

/**
 * 세션 정보 조회 Hook
 */
export const useSession = () => {
  const context = useContext(SessionContext);
  
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  
  return context;
};
```

---

## 🌐 API 호출 패턴

### 1. 표준 AJAX 유틸리티 사용

```javascript
// ✅ 권장: 표준 유틸리티 사용
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/ajax';
import { ADMIN_API } from '../constants/api';

// GET 요청
const users = await apiGet(ADMIN_API.USERS);

// POST 요청
const newUser = await apiPost(ADMIN_API.USERS, { name: '홍길동' });

// PUT 요청
const updatedUser = await apiPut(`${ADMIN_API.USERS}/${id}`, { name: '김철수' });

// DELETE 요청
await apiDelete(`${ADMIN_API.USERS}/${id}`);

// ❌ 금지: 직접 fetch 사용
const response = await fetch('/api/admin/users');
```

### 2. 에러 처리

```javascript
// ✅ 권장: 에러 처리 포함
const fetchUsers = async () => {
  try {
    setLoading(true);
    const users = await apiGet(ADMIN_API.USERS);
    setUsers(users);
  } catch (error) {
    console.error('사용자 목록 조회 실패:', error);
    notificationManager.error('사용자 목록을 불러올 수 없습니다.');
  } finally {
    setLoading(false);
  }
};

// ❌ 금지: 에러 처리 없음
const fetchUsers = async () => {
  const users = await apiGet(ADMIN_API.USERS);
  setUsers(users);
};
```

### 3. API 상수 정의

```javascript
// constants/api.js
export const ADMIN_API = {
  USERS: '/api/admin/users',
  USER_DETAIL: (id) => `/api/admin/users/${id}`,
  USER_CREATE: '/api/admin/users',
  USER_UPDATE: (id) => `/api/admin/users/${id}`,
  USER_DELETE: (id) => `/api/admin/users/${id}`
};

// 사용
const user = await apiGet(ADMIN_API.USER_DETAIL(userId));
```

---

## 🎨 스타일링 규칙

### 1. CSS 클래스 상수화

```javascript
// constants/css.js
export const MG_BUTTON = 'mg-v2-button';
export const MG_BUTTON_PRIMARY = 'mg-v2-button--primary';
export const MG_CARD = 'mg-v2-card';
export const MG_CARD_HEADER = 'mg-v2-card__header';

// 사용
<button className={MG_BUTTON + ' ' + MG_BUTTON_PRIMARY}>
  클릭
</button>

// ❌ 금지: 하드코딩
<button className="mg-v2-button mg-v2-button--primary">
  클릭
</button>
```

### 2. 인라인 스타일 금지

```javascript
// ❌ 금지: 인라인 스타일
<div style={{ backgroundColor: '#fff', padding: '10px' }}>
  내용
</div>

// ✅ 권장: CSS 클래스 사용
<div className={MG_CARD}>
  내용
</div>
```

### 3. 컴포넌트별 CSS 파일

```javascript
// UserManagement.js
import './UserManagement.css';

const UserManagement = () => {
  return (
    <div className="user-management">
      <div className="user-management__header">
        {/* 헤더 */}
      </div>
      <div className="user-management__body">
        {/* 본문 */}
      </div>
    </div>
  );
};
```

---

## 📦 Context API 패턴

### 1. Context 생성

```javascript
// contexts/SessionContext.js
import React, { createContext, useContext, useReducer } from 'react';

const SessionContext = createContext(null);

export const SessionProvider = ({ children }) => {
  const [state, dispatch] = useReducer(sessionReducer, initialState);
  
  return (
    <SessionContext.Provider value={{ state, dispatch }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
};
```

### 2. Context 사용

```javascript
// 컴포넌트에서 사용
import { useSession } from '../contexts/SessionContext';

const UserProfile = () => {
  const { state, dispatch } = useSession();
  const { user, isLoggedIn } = state;
  
  if (!isLoggedIn) {
    return <div>로그인이 필요합니다.</div>;
  }
  
  return <div>안녕하세요, {user.name}님</div>;
};
```

---

## 🔐 인증/인가 처리

### 1. 세션 확인

```javascript
import { useSession } from '../contexts/SessionContext';

const ProtectedComponent = () => {
  const { isLoggedIn, user } = useSession();
  
  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }
  
  return <div>보호된 콘텐츠</div>;
};
```

### 2. 권한 확인

```javascript
import { usePermissions } from '../hooks/usePermissions';

const AdminOnlyComponent = () => {
  const { hasPermission } = usePermissions();
  
  if (!hasPermission('ADMIN_ACCESS')) {
    return <div>권한이 없습니다.</div>;
  }
  
  return <div>관리자 전용 콘텐츠</div>;
};
```

---

## 🚫 금지 사항

### 1. 하드코딩 금지

```javascript
// ❌ 금지: 하드코딩
<button className="mg-v2-button">클릭</button>
const apiUrl = '/api/admin/users';

// ✅ 권장: 상수 사용
<button className={MG_BUTTON}>클릭</button>
const apiUrl = ADMIN_API.USERS;
```

### 2. 인라인 스타일 금지

```javascript
// ❌ 금지: 인라인 스타일
<div style={{ backgroundColor: '#fff' }}>내용</div>

// ✅ 권장: CSS 클래스
<div className={MG_CARD}>내용</div>
```

### 3. 비즈니스 로직과 UI 로직 혼재 금지

```javascript
// ❌ 금지: 비즈니스 로직 혼재
const UserList = () => {
  const [users, setUsers] = useState([]);
  
  useEffect(() => {
    // 복잡한 비즈니스 로직
    fetchUsers().then(processUsers).then(setUsers);
  }, []);
  
  // UI 로직
  return <div>{/* JSX */}</div>;
};

// ✅ 권장: Custom Hook으로 분리
const UserList = () => {
  const { users, loading } = useUsers();
  
  return <div>{/* JSX */}</div>;
};
```

### 4. 직접 DOM 조작 금지

```javascript
// ❌ 금지: 직접 DOM 조작
const handleClick = () => {
  document.getElementById('modal').style.display = 'block';
};

// ✅ 권장: React 상태 관리
const [isModalOpen, setIsModalOpen] = useState(false);
const handleClick = () => setIsModalOpen(true);
```

---

## ✅ 체크리스트

### 컴포넌트 개발 시
- [ ] 컴포넌트명은 PascalCase 사용
- [ ] Props는 명확하게 정의
- [ ] CSS 클래스는 상수로 정의
- [ ] 인라인 스타일 사용 안 함
- [ ] 비즈니스 로직은 Hook으로 분리
- [ ] 에러 처리 포함
- [ ] 로딩 상태 처리 포함

### API 호출 시
- [ ] 표준 AJAX 유틸리티 사용 (`apiGet`, `apiPost` 등)
- [ ] API 엔드포인트는 상수로 정의
- [ ] 에러 처리 포함
- [ ] 로딩 상태 관리

### 스타일링 시
- [ ] 디자인 시스템 CSS 클래스 사용
- [ ] 인라인 스타일 사용 안 함
- [ ] 컴포넌트별 CSS 파일 분리
- [ ] CSS 클래스명은 상수로 정의

---

## 💡 베스트 프랙티스

### 1. 컴포넌트 합성

```javascript
// 작은 컴포넌트들을 조합
const Dashboard = () => {
  return (
    <div className={MG_DASHBOARD}>
      <DashboardHeader />
      <DashboardStats />
      <DashboardContent />
    </div>
  );
};
```

### 2. 조건부 렌더링

```javascript
// ✅ 명확한 조건부 렌더링
{loading && <LoadingSpinner />}
{error && <ErrorMessage error={error} />}
{users.length > 0 && <UserList users={users} />}
```

### 3. 에러 바운더리

```javascript
// 에러 처리 컴포넌트
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div>오류가 발생했습니다.</div>;
    }
    return this.props.children;
  }
}
```

---

## 🔌 API 연동 패턴

### 관련 표준 문서
자세한 내용은 [API 연동 표준](./API_INTEGRATION_STANDARD.md)을 참조하세요.

### 핵심 원칙
1. **표준 버튼 사용**: API 연동 시 반드시 `Button` 컴포넌트 사용
2. **2중 클릭 방지**: `preventDoubleClick={true}` 필수
3. **로딩 상태 표시**: `loading` prop으로 상태 관리

### 빠른 예시
```javascript
import { Button } from '../ui/Button/Button';
import { apiPost } from '../../utils/ajax';

const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
    try {
        setLoading(true);
        await apiPost('/api/v1/data', formData);
    } finally {
        setLoading(false);
    }
};

<Button
    variant="primary"
    loading={loading}
    onClick={handleSubmit}
>
    저장
</Button>
```

---

## 📞 문의

프론트엔드 개발 표준 관련 문의:
- 프론트엔드 팀
- 아키텍처 팀

**최종 업데이트**: 2025-12-03


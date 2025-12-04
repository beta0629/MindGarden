# 공통 로딩바 표준

**버전**: 1.0.0  
**최종 업데이트**: 2025-12-03  
**상태**: 통합됨 ⚠️

---

## ⚠️ 중요 공지

이 문서는 **컴포넌트 템플릿 표준**으로 통합되었습니다.

**참조 문서**: [컴포넌트 템플릿 표준](./COMPONENT_TEMPLATE_STANDARD.md)의 "공통 로딩바 표준" 섹션

---

## 📌 개요

MindGarden 프로젝트의 공통 로딩바 표준입니다.  
하드코딩된 로딩바 사용을 금지하고 일관성 있게 공통 로딩 컴포넌트를 사용하도록 표준화합니다.

### 참조 문서
- **[컴포넌트 템플릿 표준](./COMPONENT_TEMPLATE_STANDARD.md)** ← **이 문서 참조 (통합됨)**
- [프론트엔드 개발 표준](./FRONTEND_DEVELOPMENT_STANDARD.md)
- [API 연동 표준](./API_INTEGRATION_STANDARD.md)

### 구현 위치
- **공통 로딩 컴포넌트**: `frontend/src/components/common/UnifiedLoading.js`
- **로딩 스타일**: `frontend/src/styles/main.css` (mg-loading 관련)

---

## 🎯 공통 로딩바 원칙

### 1. 표준 로딩 컴포넌트 사용 필수
```
모든 로딩 UI는 표준 로딩 컴포넌트 사용
```

**원칙**:
- ✅ `UnifiedLoading` 컴포넌트 사용
- ✅ 일관된 로딩 UI 제공
- ✅ 하드코딩된 로딩바 금지
- ❌ 인라인 로딩 HTML 작성 금지
- ❌ 커스텀 로딩 컴포넌트 작성 금지

### 2. 하드코딩 금지
```
로딩 HTML 구조를 직접 작성하지 않음
```

**원칙**:
- ✅ 표준 컴포넌트만 사용
- ✅ 로딩 텍스트는 props로 전달
- ❌ `<div className="mg-loading">로딩중...</div>` 직접 작성 금지
- ❌ 커스텀 스피너 HTML 작성 금지

### 3. 일관된 스타일
```
모든 로딩바는 동일한 디자인 시스템 사용
```

**원칙**:
- ✅ 표준 variant 사용 (spinner, dots, pulse, bars)
- ✅ 표준 size 사용 (small, medium, large)
- ✅ 표준 type 사용 (inline, fullscreen, page, button)
- ❌ 각기 다른 로딩 스타일 금지

---

## 📋 표준 로딩 컴포넌트 사용법

### 1. 기본 사용

#### 인라인 로딩 (기본)
```javascript
import UnifiedLoading from '../common/UnifiedLoading';

const MyComponent = () => {
    const [loading, setLoading] = useState(false);
    
    return (
        <div>
            {loading && (
                <UnifiedLoading 
                    text="로딩 중..." 
                    type="inline"
                />
            )}
        </div>
    );
};
```

#### 전체 화면 로딩
```javascript
import UnifiedLoading from '../common/UnifiedLoading';

const MyPage = () => {
    const [loading, setLoading] = useState(true);
    
    if (loading) {
        return (
            <UnifiedLoading 
                text="페이지를 불러오는 중..." 
                type="fullscreen"
                variant="spinner"
                size="large"
            />
        );
    }
    
    return <div>페이지 내용</div>;
};
```

#### 페이지 로딩
```javascript
import UnifiedLoading from '../common/UnifiedLoading';
import SimpleLayout from '../layout/SimpleLayout';

const MyPage = () => {
    const [loading, setLoading] = useState(true);
    
    return (
        <SimpleLayout title="페이지 제목">
            {loading ? (
                <UnifiedLoading 
                    text="데이터를 불러오는 중..." 
                    type="page"
                    variant="pulse"
                />
            ) : (
                <div>페이지 내용</div>
            )}
        </SimpleLayout>
    );
};
```

### 2. Variant (스타일)

#### Spinner (기본)
```javascript
<UnifiedLoading 
    variant="spinner"
    text="로딩 중..."
/>
```

#### Dots
```javascript
<UnifiedLoading 
    variant="dots"
    text="로딩 중..."
/>
```

#### Pulse
```javascript
<UnifiedLoading 
    variant="pulse"
    text="로딩 중..."
/>
```

#### Bars
```javascript
<UnifiedLoading 
    variant="bars"
    text="로딩 중..."
/>
```

#### Logo
```javascript
<UnifiedLoading 
    variant="logo"
    logoType="text"
    text="로딩 중..."
/>
```

### 3. Size (크기)

```javascript
// Small
<UnifiedLoading size="small" text="로딩 중..." />

// Medium (기본)
<UnifiedLoading size="medium" text="로딩 중..." />

// Large
<UnifiedLoading size="large" text="로딩 중..." />
```

### 4. Type (타입)

```javascript
// Inline (기본) - 인라인 로딩
<UnifiedLoading type="inline" text="로딩 중..." />

// Fullscreen - 전체 화면 로딩
<UnifiedLoading type="fullscreen" text="로딩 중..." />

// Page - 페이지 로딩
<UnifiedLoading type="page" text="로딩 중..." />

// Button - 버튼 내부 로딩
<UnifiedLoading type="button" text="로딩 중..." />
```

---

## 🔄 사용 시나리오

### 1. 페이지 로딩

```javascript
import SimpleLayout from '../layout/SimpleLayout';
import UnifiedLoading from '../common/UnifiedLoading';

const UserListPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        loadUsers();
    }, []);
    
    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await apiGet('/api/v1/users');
            setUsers(data);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <SimpleLayout title="사용자 목록">
            {loading ? (
                <UnifiedLoading 
                    type="page"
                    text="사용자 목록을 불러오는 중..."
                    variant="pulse"
                />
            ) : (
                <UserList users={users} />
            )}
        </SimpleLayout>
    );
};
```

### 2. 컴포넌트 로딩

```javascript
import UnifiedLoading from '../common/UnifiedLoading';

const UserCard = ({ userId }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        loadUser();
    }, [userId]);
    
    if (loading) {
        return (
            <div className="user-card">
                <UnifiedLoading 
                    type="inline"
                    text="사용자 정보를 불러오는 중..."
                    size="small"
                />
            </div>
        );
    }
    
    return (
        <div className="user-card">
            <h3>{user.name}</h3>
            <p>{user.email}</p>
        </div>
    );
};
```

### 3. 버튼 로딩 (Button 컴포넌트 사용)

```javascript
import { Button } from '../ui/Button/Button';

const SubmitButton = () => {
    const [loading, setLoading] = useState(false);
    
    const handleSubmit = async () => {
        setLoading(true);
        try {
            await apiPost('/api/v1/data', formData);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <Button
            variant="primary"
            loading={loading}
            loadingText="저장 중..."
            onClick={handleSubmit}
        >
            저장
        </Button>
    );
};
```

### 4. 테이블 로딩

```javascript
import { MGTable } from '../common/MGTable';
import UnifiedLoading from '../common/UnifiedLoading';

const UserTable = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // MGTable이 자동으로 로딩 처리
    return (
        <MGTable
            columns={columns}
            data={users}
            loading={loading}  // MGTable이 내부적으로 UnifiedLoading 사용
            error={null}
        />
    );
};
```

### 5. 위젯 로딩 (BaseWidget 사용)

```javascript
import BaseWidget from './BaseWidget';

const MyWidget = ({ widget, user }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    
    return (
        <BaseWidget
            widget={widget}
            user={user}
            loading={loading}  // BaseWidget이 내부적으로 UnifiedLoading 사용
            error={null}
        >
            {/* 위젯 내용 */}
        </BaseWidget>
    );
};
```

---

## 🚫 금지 사항

### 1. 하드코딩된 로딩 HTML 작성 금지

```javascript
// ❌ 금지: 하드코딩된 로딩 HTML
const BadComponent = () => {
    const [loading, setLoading] = useState(false);
    
    return (
        <div>
            {loading && (
                <div className="mg-loading">로딩중...</div>
            )}
        </div>
    );
};

// ✅ 권장: 표준 컴포넌트 사용
const GoodComponent = () => {
    const [loading, setLoading] = useState(false);
    
    return (
        <div>
            {loading && (
                <UnifiedLoading 
                    text="로딩 중..." 
                    type="inline"
                />
            )}
        </div>
    );
};
```

### 2. 커스텀 로딩 컴포넌트 작성 금지

```javascript
// ❌ 금지: 커스텀 로딩 컴포넌트 작성
const CustomLoading = () => {
    return (
        <div className="custom-spinner">
            <div className="spinner"></div>
            <span>로딩 중...</span>
        </div>
    );
};

// ✅ 권장: 표준 컴포넌트 사용
import UnifiedLoading from '../common/UnifiedLoading';
```

### 3. 인라인 스타일 로딩 금지

```javascript
// ❌ 금지: 인라인 스타일로 로딩 표시
const BadComponent = () => {
    return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ 
                width: '40px', 
                height: '40px', 
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #3498db',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }}></div>
            <p>로딩 중...</p>
        </div>
    );
};

// ✅ 권장: 표준 컴포넌트 사용
const GoodComponent = () => {
    return (
        <UnifiedLoading 
            text="로딩 중..." 
            type="inline"
        />
    );
};
```

### 4. 각기 다른 로딩 스타일 금지

```javascript
// ❌ 금지: 컴포넌트마다 다른 로딩 스타일
const Component1 = () => {
    return <div className="loading-1">로딩...</div>;
};

const Component2 = () => {
    return <div className="loading-2">로딩중...</div>;
};

const Component3 = () => {
    return <div className="loading-3">처리중...</div>;
};

// ✅ 권장: 표준 컴포넌트로 통일
const Component1 = () => {
    return <UnifiedLoading text="로딩 중..." />;
};

const Component2 = () => {
    return <UnifiedLoading text="로딩 중..." />;
};

const Component3 = () => {
    return <UnifiedLoading text="로딩 중..." />;
};
```

---

## ✅ 체크리스트

### 컴포넌트 작성 시

- [ ] `UnifiedLoading` 컴포넌트 import
- [ ] 하드코딩된 로딩 HTML 없음
- [ ] 적절한 type 선택 (inline, fullscreen, page, button)
- [ ] 적절한 variant 선택 (spinner, dots, pulse, bars)
- [ ] 적절한 size 선택 (small, medium, large)
- [ ] 로딩 텍스트 제공

### 코드 리뷰 시

- [ ] 표준 로딩 컴포넌트 사용 확인
- [ ] 하드코딩된 로딩 HTML 없음
- [ ] 일관된 로딩 스타일 사용
- [ ] 적절한 로딩 타입 선택

---

## 📊 UnifiedLoading Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `text` | string | "로딩 중..." | 로딩 텍스트 |
| `size` | string | "medium" | 크기 (small, medium, large) |
| `variant` | string | "spinner" | 스타일 (spinner, dots, pulse, bars, logo) |
| `type` | string | "inline" | 타입 (inline, fullscreen, page, button) |
| `showText` | boolean | true | 텍스트 표시 여부 |
| `className` | string | "" | 추가 CSS 클래스 |
| `centered` | boolean | true | 중앙 정렬 여부 |
| `logoType` | string | "text" | 로고 타입 (text, image, custom) |
| `logoImage` | string | "" | 커스텀 로고 이미지 URL |
| `logoAlt` | string | "MindGarden" | 로고 alt 텍스트 |
| `logoRotate` | boolean | true | 로고 회전 애니메이션 여부 |

---

## 💡 베스트 프랙티스

### 1. 적절한 Type 선택

```javascript
// ✅ 권장: 상황에 맞는 type 선택

// 전체 화면 초기 로딩
<UnifiedLoading type="fullscreen" text="페이지를 불러오는 중..." />

// 페이지 내 데이터 로딩
<UnifiedLoading type="page" text="데이터를 불러오는 중..." />

// 작은 영역 로딩
<UnifiedLoading type="inline" text="로딩 중..." />

// 버튼 내부 로딩 (Button 컴포넌트의 loading prop 사용 권장)
<Button loading={loading} loadingText="저장 중..." />
```

### 2. 로딩 상태 관리

```javascript
// ✅ 권장: 명확한 로딩 상태 관리
const MyComponent = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    
    const loadData = async () => {
        setLoading(true);
        try {
            const result = await apiGet('/api/v1/data');
            setData(result);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div>
            {loading ? (
                <UnifiedLoading type="inline" text="데이터를 불러오는 중..." />
            ) : (
                <DataDisplay data={data} />
            )}
        </div>
    );
};
```

### 3. 중첩 로딩 처리

```javascript
// ✅ 권장: 여러 로딩 상태가 있을 때 우선순위 처리
const ComplexComponent = () => {
    const [pageLoading, setPageLoading] = useState(true);
    const [dataLoading, setDataLoading] = useState(false);
    
    // 전체 페이지 로딩이 최우선
    if (pageLoading) {
        return (
            <UnifiedLoading 
                type="fullscreen" 
                text="페이지를 불러오는 중..." 
            />
        );
    }
    
    return (
        <div>
            {dataLoading && (
                <UnifiedLoading 
                    type="inline" 
                    text="데이터를 불러오는 중..." 
                />
            )}
            {/* 내용 */}
        </div>
    );
};
```

### 4. 에러 처리와 함께 사용

```javascript
// ✅ 권장: 로딩과 에러 상태 함께 처리
const DataComponent = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    
    if (loading) {
        return (
            <UnifiedLoading 
                type="page" 
                text="데이터를 불러오는 중..." 
            />
        );
    }
    
    if (error) {
        return (
            <div className="error-message">
                {error}
            </div>
        );
    }
    
    return <DataDisplay data={data} />;
};
```

---

## 🔧 기존 코드 마이그레이션

### Before (하드코딩)

```javascript
// ❌ 기존 코드
const OldComponent = () => {
    const [loading, setLoading] = useState(false);
    
    return (
        <div>
            {loading && (
                <div className="mg-loading">로딩중...</div>
            )}
        </div>
    );
};
```

### After (표준 컴포넌트)

```javascript
// ✅ 새로운 코드
import UnifiedLoading from '../common/UnifiedLoading';

const NewComponent = () => {
    const [loading, setLoading] = useState(false);
    
    return (
        <div>
            {loading && (
                <UnifiedLoading 
                    text="로딩 중..." 
                    type="inline"
                />
            )}
        </div>
    );
};
```

---

## 📞 문의

공통 로딩바 표준 관련 문의:
- 프론트엔드 팀
- UX 팀

**최종 업데이트**: 2025-12-03


# API 연동 표준

**버전**: 1.0.0  
**최종 업데이트**: 2025-12-03  
**상태**: 공식 표준

---

## 📌 개요

MindGarden 프로젝트의 API 연동 표준입니다.  
API 호출 시 표준 버튼 컴포넌트 사용 및 2중 클릭 방지를 포함한 표준 패턴을 정의합니다.

### 참조 문서
- [API 설계 표준](./API_DESIGN_STANDARD.md)
- [버튼 디자인 표준](./BUTTON_DESIGN_STANDARD.md)
- [프론트엔드 개발 표준](./FRONTEND_DEVELOPMENT_STANDARD.md)
- [에러 처리 표준](./ERROR_HANDLING_STANDARD.md)

### 구현 위치
- **표준 버튼**: `frontend/src/components/ui/Button/Button.js`
- **API 유틸리티**: `frontend/src/utils/ajax.js`
- **알림 시스템**: `frontend/src/utils/notificationManager.js`

---

## 🎯 API 연동 원칙

### 1. 표준 버튼 컴포넌트 사용
```
API 연동 시 반드시 표준 버튼 컴포넌트 사용
```

**원칙**:
- ✅ `Button` 컴포넌트 사용 (ui/Button)
- ✅ 2중 클릭 방지 활성화 (기본값: true)
- ✅ 로딩 상태 표시
- ❌ 네이티브 `<button>` 태그 직접 사용 금지
- ❌ 커스텀 버튼 컴포넌트 금지

### 2. 2중 클릭 방지 필수
```
API 호출 시 중복 요청 방지 필수
```

**원칙**:
- ✅ `preventDoubleClick={true}` 기본값
- ✅ 로딩 상태 동안 버튼 비활성화
- ✅ API 응답 대기 중 추가 클릭 무시
- ❌ 2중 클릭 방지 없이 API 호출 금지

### 3. 로딩 상태 표시
```
API 호출 중 사용자에게 명확한 피드백 제공
```

**원칙**:
- ✅ 버튼 로딩 상태 표시
- ✅ 로딩 텍스트 제공
- ✅ 버튼 비활성화 (시각적 피드백)

---

## 🔌 API 연동 패턴

### 1. 기본 API 호출 패턴

#### 구조
```javascript
import { Button } from '../ui/Button/Button';
import { apiPost, apiGet, apiPut, apiDelete } from '../../utils/ajax';
import notificationManager from '../../utils/notificationManager';

const FormComponent = () => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({});

    const handleSubmit = async () => {
        try {
            setLoading(true);
            
            const response = await apiPost('/api/v1/users', formData);
            
            if (response.success) {
                notificationManager.success('저장되었습니다.');
                // 성공 후 처리
            }
        } catch (error) {
            notificationManager.error('저장에 실패했습니다.');
            console.error('저장 실패:', error);
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
            preventDoubleClick={true}
        >
            저장
        </Button>
    );
};
```

### 2. GET 요청 패턴

```javascript
const DataList = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);

    const handleLoadData = async () => {
        try {
            setLoading(true);
            
            const response = await apiGet('/api/v1/users');
            
            if (response.success) {
                setData(response.data || []);
            }
        } catch (error) {
            notificationManager.error('데이터를 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Button
                variant="primary"
                loading={loading}
                loadingText="로딩 중..."
                onClick={handleLoadData}
            >
                데이터 불러오기
            </Button>
            
            {/* 데이터 표시 */}
        </>
    );
};
```

### 3. POST 요청 패턴 (생성)

```javascript
const CreateForm = () => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: ''
    });

    const handleCreate = async () => {
        // 유효성 검사
        if (!formData.name || !formData.email) {
            notificationManager.warning('필수 항목을 입력해주세요.');
            return;
        }

        try {
            setLoading(true);
            
            const response = await apiPost('/api/v1/users', formData);
            
            if (response.success) {
                notificationManager.success('생성되었습니다.');
                // 폼 초기화 또는 페이지 이동
                setFormData({ name: '', email: '' });
            }
        } catch (error) {
            notificationManager.error('생성에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant="primary"
            loading={loading}
            loadingText="생성 중..."
            onClick={handleCreate}
        >
            생성
        </Button>
    );
};
```

### 4. PUT 요청 패턴 (수정)

```javascript
const EditForm = ({ userId, initialData }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState(initialData);

    const handleUpdate = async () => {
        try {
            setLoading(true);
            
            const response = await apiPut(`/api/v1/users/${userId}`, formData);
            
            if (response.success) {
                notificationManager.success('수정되었습니다.');
            }
        } catch (error) {
            notificationManager.error('수정에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant="primary"
            loading={loading}
            loadingText="수정 중..."
            onClick={handleUpdate}
        >
            수정
        </Button>
    );
};
```

### 5. DELETE 요청 패턴

```javascript
const DeleteButton = ({ itemId, onDelete }) => {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        // 확인 다이얼로그
        if (!window.confirm('정말 삭제하시겠습니까?')) {
            return;
        }

        try {
            setLoading(true);
            
            const response = await apiDelete(`/api/v1/users/${itemId}`);
            
            if (response.success) {
                notificationManager.success('삭제되었습니다.');
                if (onDelete) {
                    onDelete();
                }
            }
        } catch (error) {
            notificationManager.error('삭제에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant="danger"
            loading={loading}
            loadingText="삭제 중..."
            onClick={handleDelete}
        >
            삭제
        </Button>
    );
};
```

---

## 🚫 2중 클릭 방지

### 1. 표준 버튼 컴포넌트의 2중 클릭 방지

#### 자동 방지 (기본 동작)
```javascript
// ✅ 권장: preventDoubleClick 기본값 (true)
<Button
    variant="primary"
    onClick={handleSubmit}
>
    저장
</Button>

// 명시적 설정
<Button
    variant="primary"
    onClick={handleSubmit}
    preventDoubleClick={true}  // 명시적 설정
    clickDelay={1000}          // 1초 대기 (기본값)
>
    저장
</Button>
```

#### 작동 원리
```javascript
// Button 컴포넌트 내부 동작
const handleClick = async (e) => {
    // 이미 처리 중이면 무시
    if (isProcessing || disabled || loading) {
        e.preventDefault();
        return;
    }

    // 2중 클릭 방지 활성화
    if (preventDoubleClick) {
        setIsProcessing(true);
    }

    try {
        // API 호출
        if (onClick) {
            await onClick(e);
        }
    } catch (error) {
        // 에러 처리
    } finally {
        // 일정 시간 대기 후 다시 활성화
        if (preventDoubleClick) {
            setTimeout(() => {
                setIsProcessing(false);
            }, clickDelay);
        }
    }
};
```

### 2. 로딩 상태와 함께 사용

```javascript
const FormSubmit = () => {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        try {
            setLoading(true);  // 로딩 시작
            
            const response = await apiPost('/api/v1/data', formData);
            
            // API 응답 처리
        } catch (error) {
            // 에러 처리
        } finally {
            setLoading(false);  // 로딩 종료
        }
    };

    return (
        <Button
            variant="primary"
            loading={loading}              // 로딩 상태 전달
            loadingText="저장 중..."       // 로딩 텍스트
            onClick={handleSubmit}
            preventDoubleClick={true}      // 2중 클릭 방지
        >
            저장
        </Button>
    );
};
```

### 3. 커스텀 대기 시간 설정

```javascript
// 빠른 API (0.5초 대기)
<Button
    onClick={handleQuickAction}
    clickDelay={500}
>
    빠른 실행
</Button>

// 느린 API (2초 대기)
<Button
    onClick={handleSlowAction}
    clickDelay={2000}
>
    처리 실행
</Button>
```

---

## 🚫 금지 사항

### 1. 네이티브 버튼 직접 사용 금지
```javascript
// ❌ 금지: 네이티브 버튼으로 API 호출
const handleSubmit = async () => {
    await apiPost('/api/v1/data', formData);
};

<button onClick={handleSubmit}>
    저장
</button>

// ✅ 권장: 표준 Button 컴포넌트 사용
<Button
    variant="primary"
    loading={loading}
    onClick={handleSubmit}
>
    저장
</Button>
```

### 2. 2중 클릭 방지 비활성화 금지
```javascript
// ❌ 금지: 2중 클릭 방지 비활성화
<Button
    onClick={handleApiCall}
    preventDoubleClick={false}  // 금지!
>
    저장
</Button>

// ✅ 권장: 항상 2중 클릭 방지 활성화
<Button
    onClick={handleApiCall}
    preventDoubleClick={true}  // 또는 생략 (기본값)
>
    저장
</Button>
```

### 3. 로딩 상태 없이 API 호출 금지
```javascript
// ❌ 금지: 로딩 상태 없이 API 호출
const handleSubmit = async () => {
    // 로딩 상태 설정 없음
    const response = await apiPost('/api/v1/data', formData);
};

// ✅ 권장: 로딩 상태 관리
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
    try {
        setLoading(true);
        const response = await apiPost('/api/v1/data', formData);
    } finally {
        setLoading(false);
    }
};

<Button loading={loading} onClick={handleSubmit}>
    저장
</Button>
```

### 4. try-catch 없이 API 호출 금지
```javascript
// ❌ 금지: 에러 처리 없이 API 호출
const handleSubmit = async () => {
    const response = await apiPost('/api/v1/data', formData);
    // 에러 처리 없음
};

// ✅ 권장: 에러 처리 포함
const handleSubmit = async () => {
    try {
        const response = await apiPost('/api/v1/data', formData);
        if (response.success) {
            notificationManager.success('성공했습니다.');
        }
    } catch (error) {
        notificationManager.error('실패했습니다.');
        console.error('API 호출 실패:', error);
    }
};
```

---

## ✅ 체크리스트

### API 연동 구현 시
- [ ] 표준 Button 컴포넌트 사용
- [ ] 2중 클릭 방지 활성화 (`preventDoubleClick={true}`)
- [ ] 로딩 상태 관리 (`loading` state)
- [ ] 로딩 텍스트 제공 (`loadingText`)
- [ ] try-catch 에러 처리
- [ ] 알림 메시지 표시 (성공/실패)
- [ ] finally 블록에서 로딩 상태 해제

### 버튼 설정 확인
- [ ] `preventDoubleClick` 설정 확인
- [ ] `loading` prop 전달
- [ ] `loadingText` 제공
- [ ] 적절한 `variant` 선택
- [ ] 적절한 `size` 선택

---

## 💡 베스트 프랙티스

### 1. 재사용 가능한 API 훅

```javascript
// hooks/useApiCall.js
export const useApiCall = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const execute = async (apiCall) => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await apiCall();
            return response;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { execute, loading, error };
};

// 사용 예시
const MyComponent = () => {
    const { execute, loading } = useApiCall();

    const handleSubmit = async () => {
        await execute(async () => {
            const response = await apiPost('/api/v1/data', formData);
            if (response.success) {
                notificationManager.success('성공했습니다.');
            }
        });
    };

    return (
        <Button
            variant="primary"
            loading={loading}
            onClick={handleSubmit}
        >
            저장
        </Button>
    );
};
```

### 2. 폼 제출 패턴

```javascript
const FormComponent = () => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({});

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 유효성 검사
        if (!validateForm(formData)) {
            notificationManager.warning('입력값을 확인해주세요.');
            return;
        }

        try {
            setLoading(true);
            
            const response = await apiPost('/api/v1/users', formData);
            
            if (response.success) {
                notificationManager.success('저장되었습니다.');
                // 성공 후 처리
            }
        } catch (error) {
            notificationManager.error('저장에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {/* 폼 필드 */}
            
            <Button
                type="submit"
                variant="primary"
                loading={loading}
                loadingText="저장 중..."
            >
                저장
            </Button>
        </form>
    );
};
```

### 3. 삭제 확인 패턴

```javascript
const DeleteButton = ({ itemId, onSuccess }) => {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        // 확인 다이얼로그
        const confirmed = window.confirm('정말 삭제하시겠습니까?');
        if (!confirmed) return;

        try {
            setLoading(true);
            
            const response = await apiDelete(`/api/v1/users/${itemId}`);
            
            if (response.success) {
                notificationManager.success('삭제되었습니다.');
                if (onSuccess) {
                    onSuccess();
                }
            }
        } catch (error) {
            notificationManager.error('삭제에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant="danger"
            loading={loading}
            loadingText="삭제 중..."
            onClick={handleDelete}
        >
            삭제
        </Button>
    );
};
```

---

## 📞 문의

API 연동 표준 관련 문의:
- 프론트엔드 팀
- 백엔드 팀

**최종 업데이트**: 2025-12-03


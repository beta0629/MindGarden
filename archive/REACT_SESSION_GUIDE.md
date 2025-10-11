# React 세션 관리 가이드

## 최근 업데이트 (2025-09-01)

### 세션 체크 개선사항

#### 1. 401 Unauthorized 응답 처리 개선
- **문제**: 로그인되지 않은 상태에서 세션 체크 시 401 오류가 콘솔에 표시됨
- **해결**: 401 응답을 정상적인 상황으로 처리하도록 개선
- **파일**: `frontend/src/utils/sessionManager.js`

```javascript
// 개선 전: 401 오류를 에러로 처리
if (userResponse.status === 401 || sessionResponse.status === 401) {
    console.error('❌ 세션 정보 로드 실패:', userResponse.status, sessionResponse.status);
}

// 개선 후: 401을 정상적인 상황으로 처리
if (userResponse.status === 401 || sessionResponse.status === 401) {
    console.log('ℹ️ 로그인되지 않은 상태 - 정상적인 상황');
}
```

#### 2. 네트워크 오류 처리 개선
- **문제**: 서버가 실행되지 않았을 때 네트워크 오류가 에러로 표시됨
- **해결**: 네트워크 오류를 정보성 메시지로 처리

```javascript
// 개선된 네트워크 오류 처리
if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
    console.log('ℹ️ 네트워크 연결 실패 - 서버가 실행되지 않았을 수 있습니다');
} else {
    console.error('❌ 세션 확인 중 예외 발생:', error);
}
```

### 프로필 이미지 세션 관리

#### 1. 이미지 우선순위 시스템
- **구현**: 세션에서 프로필 이미지 우선순위 관리
- **우선순위**: 사용자 업로드 > 소셜 > 기본 아이콘
- **파일**: `frontend/src/components/common/SessionUserProfile.js`

```javascript
const getProfileImageUrl = () => {
  if (sessionUser?.profileImageUrl && !imageLoadError) {
    console.log('🖼️ 사용자 업로드 이미지 사용:', sessionUser.profileImageUrl);
    return sessionUser.profileImageUrl;
  }
  if (sessionUser?.socialProfileImage && !imageLoadError) {
    console.log('🖼️ 소셜 이미지 사용:', sessionUser.socialProfileImage);
    return sessionUser.socialProfileImage;
  }
  console.log('🖼️ 기본 아이콘 사용');
  return null;
};
```

#### 2. 이미지 로드 에러 처리
- **구현**: 이미지 로드 실패 시 자동으로 다음 우선순위로 대체
- **디버깅**: 이미지 로드 상태를 콘솔에 표시

```javascript
const [imageLoadError, setImageLoadError] = useState(false);

const handleImageError = () => {
  console.log('🖼️ 프로필 이미지 로드 실패, 기본 아이콘으로 대체');
  setImageLoadError(true);
};

const handleImageLoad = () => {
  console.log('🖼️ 프로필 이미지 로드 성공');
};
```

### 세션 데이터 구조

#### 1. 프로필 이미지 관련 필드
```javascript
// 세션 사용자 객체에 추가된 필드
{
  id: 23,
  name: '이재학',
  nickname: '반짝반짝',
  role: 'CLIENT',
  profileImageUrl: 'https://example.com/user-uploaded-image.jpg', // 사용자 업로드 이미지
  socialProfileImage: 'https://example.com/social-image.jpg',    // 소셜 이미지
  socialProvider: 'NAVER'                                        // 소셜 제공자
}
```

#### 2. 이미지 타입 배지 시스템
```javascript
const getProfileImageTypeText = () => {
  if (sessionUser?.profileImageUrl && !imageLoadError) {
    return '사용자';
  }
  if (sessionUser?.socialProfileImage && !imageLoadError) {
    return sessionUser.socialProvider || '소셜';
  }
  return '기본';
};
```

### 세션 초기화 개선

#### 1. 세션 상태 관리
- **구현**: 세션 로딩 상태를 명확하게 관리
- **사용**: `useSession` 훅에서 로딩 상태 제공

```javascript
const { user: sessionUser, isLoading } = useSession();

// 로딩 중일 때 처리
if (isLoading) {
  return <div>세션 로딩 중...</div>;
}
```

#### 2. 세션 변경 감지
- **구현**: 세션 데이터 변경 시 자동으로 컴포넌트 업데이트
- **사용**: `useEffect`를 통한 세션 변경 감지

```javascript
useEffect(() => {
  setImageLoadError(false);
}, [sessionUser?.id, sessionUser?.profileImageUrl, sessionUser?.socialProfileImage]);
```

### 디버깅 및 로깅

#### 1. 세션 디버깅 로그
```javascript
// 세션 데이터 확인
console.log('🔍 SessionUserProfile - 세션 데이터:', sessionUser);

// 렌더링 상태 확인
console.log('🔍 SessionUserProfile 렌더링:', {
  sessionUser: sessionUser?.id,
  profileImageUrl,
  imageLoadError,
  hasImage: !!profileImageUrl
});
```

#### 2. 세션 초기화 로그
```javascript
// 세션 초기화 시작
console.log('🚀 세션 초기화 시작...');

// 세션 정보 로드 완료
console.log('✅ 세션 정보 로드 완료:', { user: this.user, sessionInfo: this.sessionInfo });

// 세션 초기화 완료
console.log('✅ 세션 초기화 완료');
```

### 성능 최적화

#### 1. 불필요한 리렌더링 방지
- **구현**: 세션 데이터 변경 시에만 컴포넌트 리렌더링
- **사용**: `useMemo`와 `useCallback` 활용

#### 2. 이미지 로드 최적화
- **구현**: 이미지 로드 실패 시 캐시된 에러 상태 활용
- **효과**: 불필요한 이미지 재시도 방지

### 문제 해결 가이드

#### 1. 세션 초기화 중복 호출
- **증상**: 세션 초기화가 여러 번 호출됨
- **원인**: React Strict Mode 또는 컴포넌트 마운트/언마운트
- **해결**: 개발 환경에서만 발생하는 현상으로 기능상 문제 없음

#### 2. 이미지 표시 안됨
- **증상**: 이미지 로드 로그는 정상이지만 화면에 표시되지 않음
- **해결**: CSS 스타일링 확인 및 인라인 스타일 추가

#### 3. 401 오류 메시지
- **증상**: 로그인 전에 401 오류가 콘솔에 표시됨
- **해결**: 정상적인 상황으로 처리하도록 개선됨

### 다음 단계

1. **세션 지속성 개선**: 페이지 새로고침 시 세션 유지
2. **세션 만료 처리**: 세션 만료 시 자동 로그아웃
3. **세션 동기화**: 여러 탭에서 세션 상태 동기화
4. **성능 모니터링**: 세션 관련 성능 지표 수집

# React 세션 관리 및 인증 가이드

## 📋 개요

이 문서는 MindGarden React 앱의 세션 관리 및 인증 시스템에 대한 상세한 가이드를 제공합니다.

## 🏗️ 세션 관리 아키텍처

### **전체 구조**
```
React Components (useSession Hook)
    ↓
SessionManager (전역 상태 관리)
    ↓
Session Utils (JWT 토큰, 로컬 스토리지)
    ↓
Spring Boot Backend (세션 검증, 사용자 정보)
```

### **핵심 컴포넌트**

#### **1. useSession Hook**
```javascript
import { useSession } from '../hooks/useSession';

const MyComponent = () => {
  const { user, sessionInfo, isLoading, logout } = useSession();
  
  if (isLoading) return <div>로딩 중...</div>;
  if (!user) return <div>로그인이 필요합니다.</div>;
  
  return (
    <div>
      <h1>안녕하세요, {user.name}님!</h1>
      <button onClick={logout}>로그아웃</button>
    </div>
  );
};
```

#### **2. SessionManager**
```javascript
class SessionManager {
  constructor() {
    this.user = null;
    this.sessionInfo = null;
    this.listeners = [];
  }
  
  // 세션 상태 확인
  async checkSession() {
    const [userResponse, sessionResponse] = await Promise.all([
      fetch('/api/auth/current-user', { credentials: 'include' }),
      fetch('/api/auth/session-info', { credentials: 'include' })
    ]);
    
    if (userResponse.ok && sessionResponse.ok) {
      this.user = await userResponse.json();
      this.sessionInfo = await sessionResponse.json();
      this.notifyListeners();
    }
  }
  
  // 5분마다 자동 세션 확인
  startAutoRefresh() {
    setInterval(() => {
      this.checkSession();
    }, 5 * 60 * 1000);
  }
}
```

#### **3. Session Utils**
```javascript
// JWT 토큰 관리
export const setLoginSession = (userInfo, tokens) => {
  storage.set('user', userInfo);
  storage.set('accessToken', tokens.accessToken);
  storage.set('refreshToken', tokens.refreshToken);
  
  const loginTime = Date.now();
  const sessionExpiry = loginTime + SESSION_DURATION;
  storage.set('loginTime', loginTime);
  storage.set('sessionExpiry', sessionExpiry);
};

// 세션 만료 확인
export const isSessionExpired = () => {
  const expiry = storage.get('sessionExpiry');
  return expiry && Date.now() > expiry;
};
```

## 🔐 인증 시스템

### **로그인 플로우**

#### **1. 이메일 로그인**
```javascript
const handleLogin = async (formData) => {
  try {
    const response = await authAPI.login(formData);
    if (response.success) {
      // 세션 설정
      const sessionSet = setLoginSession(response.userInfo, {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken
      });
      
      if (sessionSet) {
        // 역할에 따른 대시보드로 리다이렉트
        redirectToDashboard(response.userInfo);
      }
    }
  } catch (error) {
    console.error('로그인 오류:', error);
  }
};
```

#### **2. 소셜 로그인**
```javascript
const handleKakaoLogin = () => {
  const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;
  window.location.href = kakaoAuthUrl;
};

// OAuth2 콜백 처리
const checkOAuthCallback = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  const provider = urlParams.get('provider');
  
  if (code && state && provider) {
    const result = await socialHandleOAuthCallback(provider, code, state);
    if (result?.requiresSignup) {
      setSocialUserInfo(result.socialUserInfo);
      setShowSocialSignupModal(true);
    }
  }
};
```

### **세션 상태 관리**

#### **1. 세션 상태 구독**
```javascript
const { user, sessionInfo, isLoading } = useSession();

useEffect(() => {
  if (user) {
    console.log('사용자 로그인됨:', user);
  } else if (!isLoading) {
    console.log('사용자 로그아웃됨');
  }
}, [user, isLoading]);
```

#### **2. 세션 변경 이벤트**
```javascript
useEffect(() => {
  const handleSessionChange = (newState) => {
    console.log('세션 상태 변경:', newState);
    setSessionState(newState);
  };
  
  sessionManager.addListener(handleSessionChange);
  
  return () => {
    sessionManager.removeListener(handleSessionChange);
  };
}, []);
```

## 🚀 구현 예시

### **보호된 라우트 컴포넌트**
```javascript
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, isLoading } = useSession();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    } else if (user && requiredRole && user.role !== requiredRole) {
      navigate('/unauthorized');
    }
  }, [user, isLoading, requiredRole, navigate]);
  
  if (isLoading) return <LoadingSpinner />;
  if (!user) return null;
  if (requiredRole && user.role !== requiredRole) return null;
  
  return children;
};

// 사용 예시
<ProtectedRoute requiredRole="ADMIN">
  <AdminDashboard />
</ProtectedRoute>
```

### **로그인 상태에 따른 조건부 렌더링**
```javascript
const Header = () => {
  const { user, logout } = useSession();
  
  return (
    <header>
      {user ? (
        <div className="user-menu">
          <span>안녕하세요, {user.name}님</span>
          <button onClick={logout}>로그아웃</button>
        </div>
      ) : (
        <div className="auth-menu">
          <Link to="/login">로그인</Link>
          <Link to="/register">회원가입</Link>
        </div>
      )}
    </header>
  );
};
```

### **소셜 계정 연동 관리**
```javascript
const SocialAccounts = () => {
  const { user } = useSession();
  const [socialAccounts, setSocialAccounts] = useState([]);
  
  useEffect(() => {
    if (user) {
      fetchSocialAccounts();
    }
  }, [user]);
  
  const fetchSocialAccounts = async () => {
    try {
      const accounts = await sessionManager.getSocialAccounts();
      setSocialAccounts(accounts);
    } catch (error) {
      console.error('소셜 계정 정보 로드 실패:', error);
    }
  };
  
  return (
    <div className="social-accounts">
      <h3>연동된 소셜 계정</h3>
      {socialAccounts.map(account => (
        <div key={account.provider} className="social-account">
          <span>{account.provider}</span>
          <span>{account.providerUsername}</span>
          <button onClick={() => unlinkAccount(account.provider)}>
            연동 해제
          </button>
        </div>
      ))}
    </div>
  );
};
```

## 🔒 보안 고려사항

### **JWT 토큰 보안**
- **로컬 스토리지**: 토큰을 안전하게 저장
- **만료 시간**: 24시간 후 자동 만료
- **자동 갱신**: 5분마다 세션 상태 확인
- **HTTPS**: 모든 API 통신은 HTTPS 사용

### **세션 보안**
- **자동 로그아웃**: 세션 만료 시 자동 로그아웃
- **CSRF 보호**: Spring Boot의 CSRF 토큰 사용
- **XSS 방지**: React의 기본 XSS 방지 기능 활용
- **세션 하이재킹 방지**: HttpOnly 쿠키 사용

### **권한 관리**
```javascript
// 역할 기반 접근 제어
const hasPermission = (requiredRole) => {
  const { user } = useSession();
  if (!user) return false;
  
  const roleHierarchy = {
    'CLIENT': 1,
    'CONSULTANT': 2,
    'ADMIN': 3,
    'SUPER_ADMIN': 4
  };
  
  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
};

// 사용 예시
{hasPermission('ADMIN') && <AdminPanel />}
```

## 🐛 문제 해결

### **일반적인 문제들**

#### **1. 세션 상태가 업데이트되지 않음**
```javascript
// SessionManager 리스너 등록 확인
useEffect(() => {
  const handleSessionChange = (newState) => {
    setSessionState(newState);
  };
  
  sessionManager.addListener(handleSessionChange);
  
  return () => {
    sessionManager.removeListener(handleSessionChange);
  };
}, []);
```

#### **2. 자동 로그아웃이 작동하지 않음**
```javascript
// 세션 만료 시간 확인
const checkSessionExpiry = () => {
  const expiry = storage.get('sessionExpiry');
  if (expiry && Date.now() > expiry) {
    clearSession();
    window.location.href = '/login';
  }
};

// 주기적으로 확인
setInterval(checkSessionExpiry, 60000); // 1분마다
```

#### **3. 소셜 로그인 후 세션이 설정되지 않음**
```javascript
// OAuth2 콜백 처리 확인
const checkOAuthCallback = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const signupRequired = urlParams.get('signup');
  
  if (signupRequired === 'required') {
    // 간편 회원가입 모달 표시
    setShowSocialSignupModal(true);
  }
};
```

### **디버깅 팁**
- **React DevTools**: 컴포넌트 상태 및 props 확인
- **Network 탭**: API 요청/응답 확인
- **Console 로그**: 세션 상태 변경 로그 확인
- **Local Storage**: 저장된 토큰 및 사용자 정보 확인

## 📚 참고 자료

### **React 관련**
- [React Hooks 공식 문서](https://react.dev/reference/react)
- [React Context API](https://react.dev/learn/passing-data-deeply-with-context)
- [React useEffect Hook](https://react.dev/reference/react/useEffect)

### **인증 및 보안**
- [JWT 토큰 가이드](https://jwt.io/introduction)
- [OAuth2 플로우](https://oauth.net/2/)
- [Web Security Best Practices](https://owasp.org/www-project-top-ten/)

### **Spring Boot 관련**
- [Spring Security](https://spring.io/projects/spring-security)
- [Spring Session](https://spring.io/projects/spring-session)
- [Spring Boot CORS](https://spring.io/guides/gs/rest-service-cors/)

---

**📅 마지막 업데이트**: 2024-12-19  
**👤 작성자**: MindGarden Team  
**📧 문의**: 이슈를 통해 연락해주세요

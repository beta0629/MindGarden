# MindGarden 모바일 세션 관리 중앙화 계획

## 1. 배경 및 현재 문제

- **플랫폼별 분산된 로직**: iOS/Android 대응을 `api/client.js`, `LoginScreen`, `socialLogin` 등 여러 파일에서 분기 처리하면서 중복과 불일치가 발생합니다.
- **재현 시나리오**: iOS 실제 기기에서 로그인 → 관리자 대시보드 진입 → `/api/schedules/today/statistics` 호출. 1~2회 요청 후 `401` 또는 `로그인이 필요합니다.` 응답 발생, 로그에선 `Cookie` 헤더 누락.
- **원인 분석**: (1) 로그인 흐름마다 `sessionId` 저장 위치가 다르고, 일부는 저장 누락. (2) Axios 요청마다 `withCredentials`/`Cookie` 설정이 일관되지 않아 iOS에서 쿠키가 빠짐. (3) 갱신/로그아웃 시 세션 정리가 통합돼 있지 않아 만료된 값이 남음.
- **저장 위치가 통일되지 않음**: AsyncStorage 키(`accessToken`, `refreshToken`, `sessionId`, `user`)를 각 컴포넌트가 직접 읽고 쓰면서 만료/로그아웃 시 정리 누락 위험이 존재.
- **토큰 갱신 흐름 단절**: Refresh Token 재발급 로직이 API 클라이언트에만 존재해, 다른 곳에서 재인증이 필요할 때 재사용이 어렵고 재사용 시 중복 구현이 필요.

## 2. 개선 목표

1. **SessionManager 단일화**로 토큰/세션/사용자 상태를 제어하고, 모든 모듈이 동일한 API로 접근하도록 함.
2. **플랫폼 차이 캡슐화**: iOS 쿠키 전달(`withCredentials`, `Cookie` 헤더), Android 기본 동작, 향후 웹뷰 대응까지 한 곳에서 제어.
3. **세션 수명 주기 관리**: 로그인 → 세션 유지 → 갱신 → 만료 → 로그아웃 과정을 중앙에서 추적 및 로깅.
4. **문서화 & 회귀 체크리스트** 확보로, 향후 기능 확장 시 참고 자료를 제공하고 회귀 위험을 줄임.

## 3. 아키텍처 개요

```text
┌──────────────────────────────┐
│   React Native Screens       │
│  (Login, AdminDashboard 등)  │
└────────────┬─────────────────┘
             │ Session API 호출
┌────────────▼─────────────────┐
│      SessionManager          │
│  - AsyncStorage I/O          │
│  - Cookie/JSESSIONID 관리    │
│  - 토큰 갱신 & 만료 처리     │
│  - 상태 변화 이벤트/로그     │
└────────────┬─────────────────┘
             │ config 전달 / retry 처리
┌────────────▼─────────────────┐
│        API Client           │
│  (Axios interceptors 등)    │
└────────────┬─────────────────┘
             │ HTTP 요청/응답
┌────────────▼─────────────────┐
│        백엔드 서버          │
└──────────────────────────────┘
```

## 4. SessionManager 책임 범위 (초안)

| 기능 | 설명 |
| --- | --- |
| `init()` | 앱 시작 시 AsyncStorage 키를 로딩하고 Axios/네트워크 계층과 초기 동기화 |
| `setSession({ accessToken, refreshToken, sessionId, user })` | 로그인/갱신 시 호출, 저장 및 in-memory 캐시 업데이트 |
| `getSession()` | 현재 토큰/세션 값을 반환, API 클라이언트가 intercept 시 사용 |
| `attachRequest(config)` | Axios 요청 전에 호출, `Authorization`, `Cookie`, `withCredentials` 설정 |
| `handleResponse(response)` | `Set-Cookie`, 응답 데이터 등에서 세션 변화를 감지해 저장 |
| `handleError(error)` | 401 응답 시 refresh 로직 호출, 실패 시 세션 파기 결정 |
| `clearSession({ reason })` | 로그아웃/만료/계정 전환 시 모든 저장소를 정리하고 이벤트 발송 |
| `subscribe(listener)` | 세션 상태 변화(로그인/로그아웃/리프레시)를 UI와 동기화 (선택) |

### 4.1 저장 구조 및 키

```ts
type SessionState = {
  accessToken: string | null;
  refreshToken: string | null;
  sessionId: string | null; // JSESSIONID
  user: User | null;
  updatedAt: number; // unix timestamp, 디버깅 용도
};

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  SESSION_ID: 'sessionId',
  USER: 'user',
  STATE: 'sessionState', // 선택: 직렬화된 전체 상태 백업
};
```

- **AsyncStorage** 는 단일 진실 원천으로 사용. in-memory 캐시는 앱 실행 중 빠른 access 용도로만 사용하며 `init()` 호출 시 동기화.
- `sessionState` 전체를 추가로 저장해 디버깅 시점 회수 및 빠른 복구에 활용 (선택).

### 4.2 API 시그니처 초안

```ts
class SessionManager {
  init(forceReload = false): Promise<SessionState>;
  getState(): SessionState;
  setSession(partial: Partial<SessionState>, options?: { persist?: boolean }): Promise<void>;
  clearSession(options?: { reason?: string; broadcast?: boolean }): Promise<void>;
  attachRequest(config: AxiosRequestConfig): AxiosRequestConfig;
  handleResponse(response: AxiosResponse): Promise<AxiosResponse>;
  handleError(error: AxiosError): Promise<any>;
  subscribe(listener: (state: SessionState) => void): () => void;
}
```

- `setSession`은 부분 업데이트를 허용하며, `persist=false` 옵션으로 일시적 변경 가능.
- `attachRequest` 는 항상 `config.withCredentials = true` 설정, `Cookie` 헤더 및 `Authorization` 헤더를 삽입.
- `handleResponse` 는 응답 헤더(`set-cookie`)와 body(`sessionId`) 둘 다 검사하여 세션 갱신.
- `handleError` 에서 401 발생 시 refresh 시도; 실패 또는 refresh 토큰 부재 시 `clearSession` 호출.

### 4.3 withCredentials 전략

- **Axios 전역**: `axios.defaults.withCredentials = true` + 인스턴스 옵션.
- **요청 인터셉터**: 모든 요청에서 `config.withCredentials = true` 강제. iOS에서도 쿠키가 자동으로 포함되지만, SafariViewController 경로 대비해 `Cookie` 헤더에 `JSESSIONID`를 명시적으로 병행.
- **응답 인터셉터**: 로그인, branch-login, social-login, sms-login, OAuth 콜백 등 세션이 생성/갱신될 수 있는 엔드포인트에서 `Set-Cookie` 감지.
- **Fallback**: 네이티브 fetch 사용 또는 외부 SDK 호출 시에도 SessionManager가 쿠키를 인젝션할 수 있도록 헬퍼 함수(`withSessionHeaders`) 준비.

## 5. 파일 및 모듈 영향 범위

| 분류 | 파일 | 변경 요약 |
| --- | --- | --- |
| 신규 | `mobile/src/services/SessionManager.js` | 세션/토큰 중앙 관리 모듈 (위 책임 범위 구현) |
| 수정 | `mobile/src/api/client.js` | Axios 인터셉터에서 SessionManager API만 호출, 중복 코드 제거 |
| 수정 | `mobile/src/screens/auth/LoginScreen.js` | AsyncStorage 직접 접근 → SessionManager 사용 |
| 수정 | `mobile/src/utils/socialLogin.js` | 소셜 로그인 성공 시 SessionManager에 위임 |
| 수정 | `mobile/src/contexts/SessionContext.js` | 세션 상태 조회 및 이벤트 연결 |
| 문서 | `docs/design-architecture/session-management-plan.md` (현재 문서) | 계획 및 가이드 |

## 6. 구현 단계 (Plan v1)

1. **SessionManager 설계 & 뼈대 구현**
   - in-memory 캐시 + AsyncStorage + 플랫폼별 헬퍼 구성
   - 로깅 옵션과 에러 핸들링 기본값 정의
2. **API 클라이언트 연동**
   - 요청/응답/에러 인터셉터에서 SessionManager 메서드 호출로 교체
   - Refresh token 재시도 로직을 SessionManager로 이동 (필요 시)
3. **로그인/로그아웃 흐름 정비**
   - LoginScreen, socialLogin, SessionContext 등에서 SessionManager 사용
   - 로그아웃 혹은 앱 초기화 시 `clearSession()` 호출
4. **자동화/QA**
   - iOS/Android에서 로그인 → 보호 API 호출 → 앱 종료/재실행 → 자동 로그인 유지 확인
   - 세션 만료/리프레시/로그아웃 시 예외 처리 검증

## 7. 테스트 체크리스트 (작성/수정 시 재사용)

- [ ] **iOS 이메일 로그인**: 앱 cold start → 로그인 → 관리자 대시보드 카드(통계 API) 정상 로드 (`Console`에 401 없음)
- [ ] **Android 이메일 로그인**: 동일 시나리오, `SessionManager` 로그에서 쿠키/토큰 정상 표기
- [ ] **재시작 복원**: 로그인 후 앱 강제 종료 → 재실행 → `SessionManager.getState()` 로 사용자/토큰 존재 확인 → 보호 API 호출 성공
- [ ] **Refresh 토큰 만료**: 백엔드에서 Refresh Token 무효 처리 후 보호 API 호출 → 자동 재로그인 실패 시 세션 클리어 및 로그인 화면 이동 확인
- [ ] **수동 로그아웃**: UI에서 로그아웃 → `SessionManager` 상태 초기화, `AsyncStorage`의 `fcm_token` 제외 세션 관련 키 제거, 로그인 화면으로 이동
- [ ] **소셜 로그인(iOS/Android)**: 카카오/네이버 로그인 → 사용자/세션 갱신, 로그아웃 시 SessionManager 클리어 및 SDK 로그아웃 정상 수행

## 8. 향후 확장 아이디어

- **웹뷰/데스크탑 공통화**: SessionManager를 플랫폼 독립 인터페이스로 확장해 다른 클라이언트에서도 재사용 가능.
- **보안 강화**: SecureStore(Expo) 또는 Keychain을 활용한 민감 정보 저장, 세션 타임아웃 타이머 도입.
- **Telemetry**: 로그인/갱신 실패 원인을 Sentry 등으로 전달해 운영 인사이트 강화.

---

> 문서 작성일: 2025-11-07 (by GPT-5 Codex)



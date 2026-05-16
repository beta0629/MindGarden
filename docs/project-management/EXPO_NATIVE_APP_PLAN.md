# Expo 네이티브 앱 기획서 (MindGarden)

> **작성일**: 2026-05-12  
> **작성자**: core-planner  
> **상태**: Phase 3-A~E 코딩 완료 → §11.1 게이트 검증 및 Phase 4/3-F/3-G 분배 대기  
> **기반 문서**: `CONSULTANT_CLIENT_APP_PLAN.md` (웹앱 기획서)

---

## 1. 목표

기존 웹 프론트엔드(React)로 구현된 상담사·내담자 모바일 퍼스트 웹앱을 **Expo (React Native)** 네이티브 앱으로 전환한다. 백엔드 REST API(`/api/v1/`)는 그대로 활용하며, 네이티브 앱 특화 UX(소셜 로그인 SDK, FCM 푸시, 오프라인 지원, 네이티브 애니메이션, 스토어 배포)를 제공한다.

### 1.1 왜 Expo인가

| 항목 | 이유 |
|------|------|
| **Managed Workflow** | 네이티브 코드 직접 관리 없이 Config Plugin으로 확장 가능 |
| **Dev Build + EAS** | 카카오·네이버 SDK 등 커스텀 네이티브 모듈 지원 |
| **OTA 업데이트** | 스토어 심사 없이 JS 번들 업데이트 (`expo-updates`) |
| **Expo Router v3** | 파일 기반 라우팅 + 자동 딥링크 (테넌트 URL에 유리) |
| **New Architecture** | SDK 53부터 기본 활성, React 19 + React Native 0.79 |
| **크로스 플랫폼** | iOS + Android 동시 개발, 코드 공유율 95%+ |

---

## 2. 기존 웹앱 기획서 대비 변경/추가 사항

### 2.1 플랫폼 전환으로 인한 변경

| # | 항목 | 웹앱 기획 | Expo 네이티브 변경 |
|---|------|-----------|-------------------|
| 1 | **스타일링** | CSS + `var(--mg-*)` 토큰 | React Native StyleSheet + JS 테마 상수. NativeWind v4로 CSS 변수 브리지 또는 Theme Provider |
| 2 | **네비게이션** | React Router DOM | **Expo Router v3** (파일 기반, 자동 딥링크, TypeScript 타입 안전) |
| 3 | **소셜 로그인** | OAuth2 웹 리다이렉트 | **네이티브 SDK 직접 호출** (`@react-native-seoul/kakao-login`, `@react-native-seoul/naver-login`) |
| 4 | **푸시 알림** | 웹 Push API + FCM | **expo-notifications** (iOS APNs + Android FCM 통합) |
| 5 | **저장소** | localStorage | **MMKV** (고성능, 동기) + AsyncStorage (호환성) |
| 6 | **애니메이션** | CSS transitions | **react-native-reanimated** + **react-native-gesture-handler** |
| 7 | **디자인 토큰** | CSS Custom Properties | JS 테마 객체 (`theme.ts`) → StyleSheet에서 참조 |
| 8 | **반응형** | CSS Media Queries | `useWindowDimensions` + breakpoint hook |
| 9 | **빌드/배포** | Webpack → Vercel/Nginx | **EAS Build** → App Store / Play Store |
| 10 | **OTA 업데이트** | 서버 배포 즉시 반영 | **expo-updates** — JS 번들 OTA, 네이티브 변경은 스토어 빌드 |
| 11 | **오프라인** | 없음 | **TanStack Query 캐시 + MMKV 영속화** — 핵심 데이터 오프라인 접근 |
| 12 | **미디어 재생** | HTML5 Audio/Video | **expo-audio** (SDK 52+ 안정화) — 명상 가이드용 |
| 13 | **카메라/QR** | 웹 MediaDevices | **expo-camera** — 테넌트 QR 스캔용 |
| 14 | **보안 저장** | 없음 (토큰은 localStorage) | **expo-secure-store** — 토큰·민감 데이터 암호화 저장 |
| 15 | **HTML 요소** | div, span, a, button | View, Text, Pressable, ScrollView |

### 2.2 기능 추가/강화

| # | 기능 | 웹앱 | Expo 네이티브 |
|---|------|------|-------------|
| 1 | **바이오메트릭 인증** | 없음 | expo-local-authentication (Face ID/지문) |
| 2 | **앱 아이콘/스플래시** | 브라우저 favicon | 네이티브 앱 아이콘 + expo-splash-screen (테넌트별 커스텀 가능) |
| 3 | **백그라운드 작업** | 없음 | expo-background-task (SDK 53) — 푸시 토큰 갱신, 캐시 정리 |
| 4 | **Edge-to-Edge** | 해당 없음 | Android 기본 활성 (SDK 53) — Safe Area 관리 필수 |
| 5 | **햅틱 피드백** | 없음 | expo-haptics — 터치 피드백 강화 |
| 6 | **캘린더 연동** | 없음 | expo-calendar — 상담 예약 시 기기 캘린더에 자동 추가 |
| 7 | **공유 기능** | Web Share API | expo-sharing / React Native Share — 상담 결과·콘텐츠 공유 |

### 2.3 제거/불필요 항목

| 항목 | 이유 |
|------|------|
| CSS 파일 (*.css) | React Native에서 미사용. StyleSheet 또는 NativeWind로 대체 |
| 데스크톱 사이드바 레이아웃 | 모바일 네이티브 앱 → 바텀탭 전용. 태블릿은 확장 레이아웃 별도 검토 |
| AdminCommonLayout 참조 (웹) | 웹 어드민은 `AdminCommonLayout`·데스크톱 IA 유지. **동일 Expo 앱**에 `app/(admin)/`·`app/(staff)/` 라우트 그룹 추가(§2.4). 네이티브 범위는 상담사·내담자 + 어드민·스태프 **모바일 MVP**로 한정 |
| react-router-dom | Expo Router로 완전 대체 |
| Webpack 설정 | Metro Bundler (Expo 기본) |

### 2.4 Admin Mobile MVP

> 웹 어드민·ERP를 대체하지 않는다. **단일 Expo 앱**에 어드민·스태프 모바일 라우트를 두고, 현장·이동 중 **조회·검수·알림 대응**에 필요한 화면만 MVP로 둔다.

| 구분 | 내용 |
|------|------|
| **MVP Top 8** | ① 홈 ② 커뮤니티 검수(ADMIN) ③ 알림·메시지 ④ 스케줄 라이트 ⑤ 상담일지 ⑥ 사용자 조회 ⑦ 마음날씨 관측 ⑧ 더보기 |
| **Phase 2** | 대시보드 위젯·고급 필터·일괄 처리, 스태프 전용 워크플로 — 상담사·내담자 Phase 3 이후 또는 병렬 검토 |
| **제외** | ERP 전체, 설정 편집, 인프라·시스템 모니터링(웹 전용 유지) |
| **분배** | IA·API 매핑 `explore` → 화면·탭·카피 `core-designer`(model: `gemini-3.1-pro`) → `app/(admin)/`·`(staff)/` 라우트·화면 `core-coder` · 완료 후 `core-tester` 게이트 |

---

## 3. 기술 스택·라이브러리 목록

### 3.1 코어 프레임워크

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| **expo** | ~53.0.0 | Expo SDK 코어 |
| **react** | 19.0.0 | React 코어 |
| **react-native** | 0.79.x | React Native 코어 |
| **typescript** | ~5.8.0 | 타입 안전 (웹앱 JS에서 TS로 전환) |

### 3.2 네비게이션

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| **expo-router** | ~4.x (SDK 53) | 파일 기반 라우팅, 딥링크 자동화, 타입 안전 |
| **@react-navigation/native** | ^7.x | Expo Router 내부 의존 |
| **@react-navigation/bottom-tabs** | ^7.x | 바텀 탭 네비게이터 (Expo Router tabs 레이아웃) |
| **react-native-screens** | SDK 53 번들 | 네이티브 화면 스택 |
| **react-native-safe-area-context** | SDK 53 번들 | Safe Area 관리 |

### 3.3 인증·소셜 로그인

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| **@react-native-seoul/kakao-login** | ^5.4.x | 카카오 로그인 (Config Plugin 포함) |
| **@react-native-seoul/naver-login** | ^4.2.x | 네이버 로그인 (Config Plugin 포함) |
| **expo-secure-store** | SDK 53 번들 | 토큰 암호화 저장 |
| **expo-local-authentication** | SDK 53 번들 | 바이오메트릭 인증 |

### 3.4 상태관리·데이터

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| **zustand** | ^5.x | 클라이언트 상태 (UI, 테넌트, 사용자 세션) |
| **@tanstack/react-query** | ^5.x | 서버 상태 (API 캐싱, 배경 갱신, 오프라인) |
| **react-native-mmkv** | ^3.x | 고성능 영속 저장소 (Zustand persist + Query 캐시) |
| **@react-native-async-storage/async-storage** | SDK 53 번들 | 폴백 저장소 |

### 3.5 푸시 알림

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| **expo-notifications** | SDK 53 번들 | 통합 푸시 알림 (APNs + FCM) |
| **expo-device** | SDK 53 번들 | 디바이스 정보 (푸시 토큰 등록 시) |
| **expo-constants** | SDK 53 번들 | 앱 메타데이터 |

### 3.6 UI·애니메이션

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| **react-native-reanimated** | ^3.17.x (SDK 53) | 고성능 네이티브 애니메이션 |
| **react-native-gesture-handler** | SDK 53 번들 | 스와이프·드래그 제스처 |
| **@gorhom/bottom-sheet** | ^5.x | 바텀시트 (모달 대체, 블러 배경) |
| **react-native-svg** | SDK 53 번들 | SVG 일러스트 렌더링 |
| **lucide-react-native** | ^latest | 아이콘 (웹앱 Lucide와 일관성 유지) |
| **expo-linear-gradient** | SDK 53 번들 | 그래디언트 배경 |
| **expo-blur** | SDK 53 번들 | Glassmorphism 헤더·모달 블러 |
| **expo-haptics** | SDK 53 번들 | 터치 햅틱 피드백 |
| **react-native-flash-list** | ^2.x | 고성능 리스트 (FlatList 대체) |
| **react-native-skia** | ^1.x | 감정 차트·통계 그래프 |

### 3.7 결제

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| **@tosspayments/widget-sdk-react-native** | ^1.5.x | 토스페이먼츠 결제 위젯 |
| **react-native-webview** | ^13.x | 결제 WebView (토스 SDK 의존) |

### 3.8 지도

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| **@react-native-kakao/core** | ^2.x | 카카오 SDK 코어 (Config Plugin) |
| **@react-native-kakao/map** | ^2.2.x | 카카오맵 (상담실 위치) |

### 3.9 미디어·콘텐츠

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| **expo-audio** | SDK 53 번들 | 명상 오디오 재생 |
| **expo-video** | SDK 53 번들 | 영상 콘텐츠 (필요 시) |
| **expo-image** | SDK 53 번들 | 고성능 이미지 로딩 (캐싱·placeholder) |

### 3.10 유틸리티

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| **expo-camera** | SDK 53 번들 | QR 스캔 (테넌트 식별) |
| **expo-calendar** | SDK 53 번들 | 기기 캘린더에 상담 일정 추가 |
| **expo-sharing** | SDK 53 번들 | 콘텐츠 공유 |
| **expo-updates** | SDK 53 번들 | OTA 업데이트 |
| **expo-splash-screen** | SDK 53 번들 | 스플래시 화면 |
| **expo-font** | SDK 53 번들 | Pretendard 폰트 로딩 |
| **date-fns** | ^4.x | 날짜 유틸리티 |

### 3.11 개발·빌드

| 도구 | 용도 |
|------|------|
| **EAS Build** | 클라우드 네이티브 빌드 (iOS/Android) |
| **EAS Submit** | App Store / Play Store 자동 제출 |
| **expo-dev-client** | 개발 빌드 (커스텀 네이티브 모듈 디버깅) |
| **eslint + prettier** | 코드 포맷팅 |
| **jest + @testing-library/react-native** | 단위·통합 테스트 |
| **maestro** | E2E UI 테스트 |

---

## 4. 프로젝트 구조

```
expo-app/                          # 새 Expo 프로젝트 (루트)
├── app/                           # Expo Router — 파일 기반 라우팅
│   ├── _layout.tsx                # 루트 레이아웃 (Provider 래핑)
│   ├── index.tsx                  # 앱 진입점 (테넌트 체크 → 라우팅)
│   ├── (auth)/                    # 인증 그룹
│   │   ├── _layout.tsx
│   │   ├── tenant-select.tsx      # 테넌트 선택/QR 스캔
│   │   ├── login.tsx              # 소셜 로그인 (카카오+네이버)
│   │   └── onboarding.tsx         # 첫 사용자 온보딩
│   ├── (consultant)/              # 상담사 탭 그룹
│   │   ├── _layout.tsx            # 바텀탭 레이아웃 (5탭)
│   │   ├── (home)/
│   │   │   └── index.tsx          # 대시보드
│   │   ├── (schedule)/
│   │   │   ├── index.tsx          # 스케줄 캘린더
│   │   │   └── [id].tsx           # 상담 상세
│   │   ├── (clients)/
│   │   │   ├── index.tsx          # 내담자 목록
│   │   │   └── [id].tsx           # 내담자 상세 프로필
│   │   ├── (records)/
│   │   │   ├── index.tsx          # 일지 목록
│   │   │   ├── create/[scheduleId].tsx  # 일지 작성
│   │   │   └── [id].tsx           # 일지 상세
│   │   └── (more)/
│   │       ├── index.tsx          # 더보기 메뉴
│   │       ├── availability.tsx   # 근무 가능 시간
│   │       ├── salary-settlement.tsx  # 급여 정산(관리자 산정·승인·지급 결과 조회 전용; 매출·수입 리포트 아님)
│   │       ├── income.tsx         # (정책) 수입 리포트 비노출 — 더보기로 리다이렉트
│   │       ├── community/         # 커뮤니티 (칼럼)
│   │       ├── notifications.tsx  # 알림 센터
│   │       ├── messages/          # 메시지
│   │       ├── profile.tsx        # 프로필
│   │       └── settings.tsx       # 설정
│   └── (client)/                  # 내담자 탭 그룹
│       ├── _layout.tsx            # 바텀탭 레이아웃 (5탭)
│       ├── (home)/
│       │   └── index.tsx          # 홈 피드
│       ├── (booking)/
│       │   ├── index.tsx          # 예약 — 상담사 선택
│       │   ├── time-select.tsx    # 시간 선택
│       │   ├── payment.tsx        # 결제
│       │   └── complete.tsx       # 예약 완료
│       ├── (sessions)/
│       │   ├── index.tsx          # 내 상담 (예약현황·이력)
│       │   ├── [id].tsx           # 상담 상세
│       │   └── review/[id].tsx    # 상담사 평가
│       ├── (wellness)/
│       │   ├── index.tsx          # 웰니스 메인
│       │   ├── mood-journal/      # 감정 일기
│       │   ├── self-assessment/   # 자가 심리검사
│       │   ├── meditation/        # 명상 가이드
│       │   └── psycho-education/  # 심리 교육
│       └── (more)/
│           ├── index.tsx          # 더보기 메뉴
│           ├── community/         # 커뮤니티 (후기)
│           ├── sessions-payment/  # 회기·결제
│           ├── messages/          # 메시지
│           ├── notifications.tsx  # 알림 센터
│           ├── profile.tsx        # 프로필
│           └── settings.tsx       # 설정
├── src/
│   ├── components/                # 공유 컴포넌트 (아토믹 디자인)
│   │   ├── atoms/                 # Button, Text, Icon, Badge, Chip, Avatar
│   │   ├── molecules/             # SearchBar, CardHeader, ListItem, ChipGroup
│   │   ├── organisms/             # ScheduleCard, ClientCard, WellnessCard, ChatBubble
│   │   └── templates/             # AppShell, TabLayout, ModalSheet
│   ├── theme/                     # 디자인 시스템 (JS)
│   │   ├── tokens.ts              # 색상·간격·둥근모서리·그림자 토큰
│   │   ├── typography.ts          # 타이포그래피 스케일
│   │   ├── client-theme.ts        # 내담자 테마
│   │   ├── consultant-theme.ts    # 상담사 테마
│   │   └── ThemeProvider.tsx       # 역할별 테마 공급자
│   ├── stores/                    # Zustand 상태 스토어
│   │   ├── useAuthStore.ts        # 인증·세션
│   │   ├── useTenantStore.ts      # 테넌트 상태
│   │   └── useAppStore.ts         # UI 상태 (테마, 모드)
│   ├── api/                       # API 레이어
│   │   ├── client.ts              # TenantAwareApiClient (Axios + interceptors)
│   │   ├── hooks/                 # TanStack Query 커스텀 훅
│   │   │   ├── useSchedules.ts
│   │   │   ├── useConsultations.ts
│   │   │   ├── useClients.ts
│   │   │   ├── usePayments.ts
│   │   │   └── ...
│   │   └── endpoints.ts           # API 엔드포인트 상수
│   ├── services/                  # 네이티브 서비스
│   │   ├── NotificationService.ts # 푸시 알림 등록·수신·라우팅
│   │   ├── AuthService.ts         # 소셜 로그인 SDK 래핑
│   │   └── CalendarService.ts     # 기기 캘린더 연동
│   ├── hooks/                     # 공용 커스텀 훅
│   │   ├── useBreakpoint.ts       # 반응형 브레이크포인트
│   │   ├── useAuth.ts             # 인증 상태
│   │   └── useOffline.ts          # 오프라인 감지
│   ├── utils/                     # 유틸리티
│   │   ├── safeDisplay.ts         # React child 안전 표시 (웹앱 정책 이관)
│   │   ├── dateUtils.ts           # 날짜 포매팅
│   │   └── tenantUtils.ts         # 테넌트 유틸리티
│   └── constants/                 # 상수
│       ├── pushScenarios.ts       # 12종 푸시 알림 시나리오 상수
│       └── assessmentQuestions.ts # 자가 심리검사 문항 (PHQ-9, GAD-7, PSS)
├── assets/                        # 정적 에셋
│   ├── fonts/                     # Pretendard 폰트
│   ├── images/                    # 일러스트·배경·로고
│   └── icons/                     # 커스텀 아이콘 (SVG)
├── app.config.ts                  # Expo 설정 (Config Plugins)
├── eas.json                       # EAS Build 설정
├── package.json
└── tsconfig.json
```

---

## 5. 테넌트 아키텍처 (Expo 네이티브)

### 5.1 테넌트 식별 플로우

```
앱 시작
  │
  ├── MMKV에 tenantCode 캐시 있음?
  │     ├── YES → 자동 적용 → 로그인 화면
  │     └── NO ──┐
  │              │
  ├── 딥링크로 진입? (mindgarden://tenant/{code})
  │     ├── YES → tenantCode 추출 → 캐시 → 로그인 화면
  │     └── NO ──┐
  │              │
  └── 테넌트 선택 화면 표시
        ├── 기관 코드 직접 입력
        └── QR 스캔 (expo-camera)
              → tenantCode 추출 → 캐시 → 로그인 화면
```

### 5.2 딥링크 스킴

Expo Router의 파일 기반 라우팅이 딥링크를 자동 생성하므로, 아래 패턴만 `app.config.ts`에 등록:

```typescript
// app.config.ts
export default {
  scheme: 'mindgarden',
  // Universal Links
  web: {
    bundler: 'metro',
  },
  plugins: [
    // 딥링크: mindgarden://tenant/{code}
    // 유니버설: https://app.mindgarden.co.kr/t/{code}
  ],
};
```

### 5.3 API 클라이언트 (Tenant-Aware)

```typescript
// src/api/client.ts — 개념 설계 (실제 구현은 core-coder)
// Axios 인스턴스 생성
// interceptor에서 자동으로:
//   - X-Tenant-Id 헤더 삽입 (useTenantStore에서 읽기)
//   - Authorization: Bearer 토큰 삽입 (useAuthStore에서 읽기)
//   - 401 → 토큰 리프레시 → 재시도
//   - 네트워크 에러 → 오프라인 큐
```

### 5.4 FCM 토큰 테넌트 등록

```
로그인 성공
  → expo-notifications: getExpoPushTokenAsync() 또는 getDevicePushTokenAsync()
  → POST /api/v1/mobile/push-token/register
    body: { userId, tenantId, token, platform: 'ios'|'android', deviceInfo }
  → 서버에서 (tenantId + userId + deviceToken) 매핑 저장
```

---

## 6. 디자인 시스템 (네이티브 전환)

### 6.1 디자인 토큰 → JS 테마 객체

기존 CSS Custom Properties(`var(--mg-*)`)를 JavaScript 테마 객체로 변환한다. 색상값·간격·그림자 등 모든 토큰은 `src/theme/tokens.ts`에서 단일 소스로 관리.

```typescript
// src/theme/tokens.ts — 개념 (실제 구현은 core-coder)
export const colors = {
  client: {
    primary: '#E07A5F',
    primaryLight: '#F2CC8F',
    primaryDark: '#C06A50',
    bgMain: '#FAF9F7',
    surface: '#FFFFFF',
  },
  consultant: {
    primary: '#3D5246',
    primaryLight: '#6B7F72',
    primaryDark: '#2A3A31',
    bgMain: '#FAF9F7',
    surface: '#F5F3EF',
  },
  common: {
    textMain: '#2C2C2C',
    textSecondary: '#5C6B61',
    border: '#D4CFC8',
    error: '#E57373',
    success: '#81C784',
  },
  gray: {
    900: '#2C2C2C',
    700: '#4A4A4A',
    500: '#7A7A7A',
    400: '#9E9E9E',
    300: '#D4CFC8',
    100: '#F0EDE8',
    50: '#FAF9F7',
  },
};
```

### 6.2 디자인 퀄리티 체크리스트 (네이티브 조정)

기존 25항목 체크리스트를 네이티브 환경에 맞게 조정:

| # | 항목 | React Native 구현 방식 |
|---|------|----------------------|
| 1 | 스켈레톤 로딩 | `react-native-skeleton-placeholder` 또는 커스텀 Reanimated |
| 2 | Empty State 일러스트 | `react-native-svg` + 커스텀 SVG 컴포넌트 |
| 3 | 카드 다단계 그림자 | `elevation` (Android) + `shadowOffset/Opacity/Radius` (iOS) |
| 4 | 모달 블러 배경 | `expo-blur` BlurView |
| 5 | 터치 피드백 | Pressable `android_ripple` + Reanimated scale + expo-haptics |
| 6 | 화면 전환 애니메이션 | Expo Router `animation` 속성 (slide/fade) |
| 7 | 리스트 stagger 진입 | Reanimated `FadeInDown.delay(index * 100)` |
| 8 | 스와이프 제스처 | Gesture Handler `Swipeable` 또는 커스텀 Gesture |
| 9 | 당겨서 새로고침 | `ScrollView.refreshControl` + 커스텀 인디케이터 |
| 10 | 키보드 회피 | `KeyboardAvoidingView` + `react-native-keyboard-aware-scroll-view` |
| 11 | 무한 스크롤 | FlashList `onEndReached` + TanStack Query `useInfiniteQuery` |
| 12 | 60-30-10 색상 | ThemeProvider에서 역할별 팔레트 주입, 린터로 하드코딩 검사 |
| 13 | 터치 타겟 44px | `hitSlop` 속성 활용, 디자인 리뷰에서 검증 |
| 14 | WCAG 접근성 | `accessibilityLabel`, `accessibilityRole`, `accessibilityState` |
| 15 | 폰트 시스템 | expo-font + Pretendard (iOS: SF Pro 폴백, Android: Pretendard) |

### 6.3 색상 거버넌스 (네이티브 적용)

기존 웹앱의 색상 거버넌스와 동일한 엄격도를 적용한다. **개발 단계에서도 예외 없이**, 화면·컴포넌트·훅 코드에 HEX·RGB 등 색상 리터럴을 두지 않는다.

**규범 문서(필수)**: [`docs/standards/EXPO_APP_HARDCODING_AND_COLORS.md`](../standards/EXPO_APP_HARDCODING_AND_COLORS.md)

요약:

- **허용 파일**: 색 HEX는 `expo-app/src/theme/tokens.ts`(SSOT)와, 카카오·네이버 등 **브랜드 고정색 전용** `expo-app/src/constants/oauthProviderBrand.ts` 등에만 둔다.
- **구현**: `theme.colors.*` 또는 `tokens` import; `app.config.ts`·WebView HTML도 동일하게 토큰·상수만 사용.
- **검증**: grep·린트·pre-commit·PR 단계에서 위 문서의 체크리스트를 따른다.

---

## 7. 기존 RN 앱 (`/mobile/`) 재활용 분석

> 분석 기준: `/mobile/` — React Native **0.82.1**, React **19.1.1**, TypeScript 5.8.3  
> 규모: 30개 스크린, 21개 컴포넌트, 14개 API 그룹, 7개 patch-package  
> **tenantId 사용: 전체 소스에서 0건 (완전한 싱글 테넌트 구조)**

### 7.1 재활용 가능 — 높음 (거의 그대로 복사 후 TS 전환)

| 항목 | 파일 | 재활용 방법 |
|------|------|-----------|
| API 엔드포인트 상수 | `src/api/endpoints.js` (14개 API 그룹, ~200줄) | → `src/api/endpoints.ts`로 TypeScript 이관. 경로 그대로 사용 |
| API 클라이언트 구조 | `src/api/client.js` (axios 인터셉터, 토큰 갱신) | → axios 인스턴스 + 인터셉터 패턴 재활용, X-Tenant-Id 헤더 추가 |
| 디자인 토큰/상수 | `src/constants/colors.js` (~120색), `typography.js`, `spacing.js`, `sizes.js`, `theme.js` | → `src/theme/tokens.ts`로 통합. 모바일 최적화 값 참고 |
| UI 텍스트 상수 | `src/constants/strings.js` (~540줄 한국어) | → 그대로 복사 후 TS 전환. i18n 기반 구조 유지 |
| 네비게이션 라우트 상수 | `src/constants/navigation.js` | → Expo Router 파일 기반이라 참고만 |
| 세션 검증 로직 | `src/utils/sessionValidation.js` | → 순수 JS 로직, 의존성 없음. 그대로 복사 |
| 결제 참조번호 생성 | `src/utils/paymentReference.js` | → 순수 JS 로직. 그대로 복사 |
| 상담사 색상 해시 | `src/utils/consultantColor.js` | → 순수 JS 로직. 그대로 복사 |
| 에러 핸들러 | `src/utils/errorHandler.js` | → 에러 분류/처리 패턴 재활용 |
| 환경 설정 구조 | `src/config/environments.js` (dev/staging/prod 3단계) | → `app.config.ts` + EAS Secrets로 이관. 구조 참고 |
| 매칭/결제 상수 | `src/constants/mapping.js`, `common.js` | → 비즈니스 상수 그대로 복사 |
| 알림 컨텍스트 | `src/contexts/NotificationContext.js` (30초 폴링) | → Zustand store + TanStack Query 폴링으로 포팅 |

### 7.2 재활용 가능 — 중간 (구조 재활용, 코드 수정 필요)

| 항목 | 파일 | 수정 사항 |
|------|------|-----------|
| 세션 관리 | `src/contexts/SessionContext.js` (useReducer) | useReducer 패턴 유지, AsyncStorage → expo-secure-store + MMKV 교체, tenantId 필드 추가 |
| 세션 매니저 | `src/services/SessionManager.js` (토큰/쿠키/401갱신) | 쿠키/토큰 관리 로직 핵심 유지, 스토리지 레이어만 교체 |
| 로그인 비즈니스 로직 | `src/screens/auth/LoginScreen.js` | 이메일/SMS/중복로그인 흐름 재활용, UI 전면 재구축 |
| 바텀 탭 구조 | `ClientTabNavigator.js` (5탭), `ConsultantTabNavigator.js` (7탭) | IA 참고. 상담사 7탭→5탭 축소 반영. Expo Router tabs로 전환 |
| 딥링크 설정 | `AppNavigator.js` (mindgarden://, OAuth2 콜백) | Expo Router 내장 딥링크로 전환. 스킴 `mindgarden://` 유지 |
| NavigationService | `src/navigation/NavigationService.js` (전역 ref) | Expo Router 사용 시 `router.push()` 등으로 대체 |

### 7.3 재활용 가능 — 낮음 (패턴만 참고, 전면 재구축)

| 항목 | 파일 | 이유 |
|------|------|------|
| FCM 푸시 서비스 | `src/services/NotificationService.js` (싱글톤) | `@react-native-firebase/messaging` → `expo-notifications`로 완전 교체. 토큰 등록·포그라운드/백그라운드 핸들링·라우팅 패턴만 참고 |
| 이미지 서비스 | `src/services/ImageService.js` (카메라/갤러리/크롭) | 네이티브 이미지 피커 3개 → `expo-image-picker` + `expo-image-manipulator` 대체 |
| 소셜 로그인 | `src/utils/socialLogin.js` (카카오/네이버 네이티브 SDK) | SDK 호출 패턴 변경. Expo Config Plugin 방식으로 재구현 |
| 모든 Screen UI | `src/screens/**/*.js` (30개) | 새 디자인 시스템에 맞게 전면 재구축. 비즈니스 로직만 참고 |

### 7.4 재구축 필요 (기존에 없는 것)

| 항목 | 이유 |
|------|------|
| **전체 테넌트 레이어** | 전체 소스에서 tenantId 0건. API·세션·FCM·소셜 로그인 모두 테넌트 레이어 신규 |
| **오프라인 지원** | 기존 앱에 없음 → TanStack Query + MMKV 영속화 신규 |
| **OTA 업데이트** | 기존 앱에 없음 → expo-updates 신규 |
| **감정 일기 / 자가 심리검사** | 기존 앱에 없는 기능 |
| **명상 가이드 / 심리 교육** | 기존 앱에 없는 기능 |
| **커뮤니티** | 기존 앱에 없는 기능 |

### 7.5 Expo 전환 시 호환 불가능한 부분

#### 네이티브 모듈 교체 필수

| 현재 패키지 | Expo 대체 | 난이도 |
|------------|-----------|--------|
| `@react-native-firebase/app` + `messaging` | `expo-notifications` | **높음** |
| `@react-native-seoul/kakao-login` 5.4.2 | Config Plugin으로 유지 (Expo Dev Build) 또는 `expo-auth-session` WebBrowser | **중간** |
| `@react-native-seoul/naver-login` 4.2.2 | Config Plugin으로 유지 (Expo Dev Build) 또는 `expo-auth-session` WebBrowser | **중간** |
| `react-native-image-crop-picker` | `expo-image-picker` + `expo-image-manipulator` | 중간 |
| `react-native-image-picker` | `expo-image-picker` | 낮음 |
| `react-native-image-resizer` | `expo-image-manipulator` | 낮음 |
| `react-native-permissions` | Expo 자체 권한 API | 중간 |

#### patch-package 7개 (5.4MB) — 가장 큰 리스크

| 패치 대상 | 크기 | Expo 전환 영향 |
|-----------|------|---------------|
| `react-native-screens` 4.18.0 | 2.3MB | **높음** — Expo SDK 번들 버전에서 패치 불필요 여부 확인 필수 |
| `react-native-gesture-handler` 2.29.0 | 1.6MB | **높음** — 동일 |
| `react-native-svg` 15.14.0 | 1.0MB | 중간 — Expo SDK 번들 버전 확인 |
| `react-native-reanimated` 3.19.3 | 42KB | 중간 — Expo SDK 53은 3.17.x 포함 |
| 이미지 관련 3개 | 356KB | 낮음 — Expo 대체 라이브러리 사용 |

> **전략**: Expo SDK 53 번들 버전에서 해당 패치가 여전히 필요한지 Phase 0에서 먼저 검증. 필요 없으면 patch-package 자체를 제거.

#### 환경 설정 내 하드코딩 비밀 키

`src/config/environments.js`에 네이버 `CLIENT_ID`, `CLIENT_SECRET`이 소스코드에 직접 하드코딩됨.
→ Expo 전환 시 `expo-constants` + `.env` + EAS Secrets로 이관 필수.

---

## 8. Phase별 실행 계획

### Phase 0: Expo 프로젝트 초기화 + 디자인 시스템(토큰/테마)

| 항목 | 값 |
|------|-----|
| **목표** | Expo SDK 53 프로젝트 생성, 디자인 토큰 JS 변환, 테마 Provider, 기본 폰트·아이콘 설정 |
| **산출물** | `expo-app/` 디렉토리, `app.config.ts`, `eas.json`, `src/theme/`, 기본 _layout.tsx |

#### Phase 0-A: Expo 프로젝트 스캐폴딩

| 항목 | 값 |
|------|-----|
| **담당** | `core-coder` |
| **목표** | `expo-app/` 디렉토리에 Expo SDK 53 프로젝트 초기화 |
| **적용 스킬** | `/core-solution-frontend`, `/core-solution-code-style` |

**전달 프롬프트**:
> MindGarden Expo 네이티브 앱 프로젝트를 초기화해주세요.
>
> **작업 내용**:
> 1. `/expo-app/` 디렉토리에 `npx create-expo-app@latest --template tabs` 실행
> 2. TypeScript 설정 (`tsconfig.json`)
> 3. `app.config.ts` 작성:
>    - `scheme: 'mindgarden'` (딥링크)
>    - Config Plugins: `@react-native-seoul/kakao-login`, `@react-native-seoul/naver-login`
>    - iOS/Android 최소 버전 설정
> 4. `eas.json` 작성 (development, preview, production 프로필)
> 5. 핵심 의존성 설치:
>    - zustand, @tanstack/react-query, react-native-mmkv
>    - react-native-reanimated, @gorhom/bottom-sheet
>    - expo-blur, expo-haptics, expo-linear-gradient
>    - lucide-react-native, react-native-svg
>    - react-native-flash-list, date-fns
>    - @react-native-seoul/kakao-login, @react-native-seoul/naver-login
> 6. ESLint + Prettier 설정
> 7. 기본 Expo Router 레이아웃 (`app/_layout.tsx`)
>
> **참조**: `docs/project-management/EXPO_NATIVE_APP_PLAN.md` §3 기술 스택, §4 프로젝트 구조
>
> **완료 조건**: `npx expo start` 로 Dev Server 정상 기동, 기본 탭 화면 표시

#### Phase 0-B: 디자인 토큰 JS 변환 + 테마 Provider

| 항목 | 값 |
|------|-----|
| **담당** | `core-coder` |
| **목표** | CSS 디자인 토큰을 JS 테마 객체로 변환, 역할별 Theme Provider 구현 |
| **적용 스킬** | `/core-solution-frontend`, `/core-solution-standardization` |
| **병렬** | Phase 0-A와 동시 진행 가능 (완료 후 머지) |

**전달 프롬프트**:
> MindGarden 디자인 토큰을 React Native 테마 시스템으로 변환해주세요.
>
> **작업 내용**:
> 1. `src/theme/tokens.ts` — 색상·간격·둥근모서리·그림자·타이포 토큰 정의
>    - 기존 CSS 토큰(`docs/design-system/v2/CONSULTANT_CLIENT_DESIGN_TOKENS.md`) 값을 그대로 JS 상수로 변환
>    - 내담자 8색 + 상담사 8색 + 공통 + 그레이 스케일
> 2. `src/theme/typography.ts` — 폰트 크기·굵기·줄간격 스케일
>    - Pretendard 폰트 로딩 (expo-font)
>    - iOS: SF Pro 폴백
> 3. `src/theme/client-theme.ts` / `consultant-theme.ts` — 역할별 테마 객체
> 4. `src/theme/ThemeProvider.tsx` — React Context 기반 테마 공급자
>    - `useTheme()` 훅 제공
>    - 사용자 역할에 따라 자동 테마 전환
> 5. `src/theme/shadows.ts` — 플랫폼별 그림자 (iOS shadowOffset vs Android elevation)
>
> **규칙**:
> - 하드코딩 색상 절대 금지 — 모든 스타일에서 테마 토큰 참조
> - 60-30-10 색상 법칙 적용 가능하도록 구조화
> - TypeScript strict 모드
>
> **참조**: `docs/design-system/v2/CONSULTANT_CLIENT_DESIGN_TOKENS.md`, `docs/project-management/CONSULTANT_CLIENT_APP_PLAN.md` §3.10 색상 거버넌스

---

### Phase 1: 인증(소셜 로그인) + 테넌트 + 네비게이션 셸

| 항목 | 값 |
|------|-----|
| **목표** | 카카오·네이버 소셜 로그인, 테넌트 식별·캐싱, 역할별 바텀탭 네비게이션 셸, FCM 토큰 등록 |
| **의존** | Phase 0 완료 |
| **산출물** | 로그인 화면, 테넌트 선택 화면, 상담사/내담자 탭 셸, 푸시 토큰 등록 |

#### Phase 1-A: 테넌트 + 인증

| 항목 | 값 |
|------|-----|
| **담당** | `core-coder` |
| **적용 스킬** | `/core-solution-multi-tenant`, `/core-solution-api`, `/core-solution-frontend` |

**전달 프롬프트**:
> 테넌트 인식 아키텍처 + 소셜 로그인을 구현해주세요.
>
> **구현 대상**:
> 1. **Zustand Stores**:
>    - `useTenantStore.ts` — tenantCode, tenantId, 캐시(MMKV)
>    - `useAuthStore.ts` — user, accessToken, refreshToken, isAuthenticated
> 2. **TenantAwareApiClient** (`src/api/client.ts`):
>    - Axios 인스턴스, X-Tenant-Id / Authorization 인터셉터
>    - 401 → 토큰 리프레시 → 재시도 로직
>    - 네트워크 에러 핸들링
> 3. **테넌트 선택 화면** (`app/(auth)/tenant-select.tsx`):
>    - 기관 코드 입력 필드
>    - QR 스캔 (expo-camera)
>    - MMKV 캐시 저장
> 4. **소셜 로그인 화면** (`app/(auth)/login.tsx`):
>    - 카카오 로그인 버튼 (노란색, `@react-native-seoul/kakao-login` SDK)
>    - 네이버 로그인 버튼 (초록색, `@react-native-seoul/naver-login` SDK)
>    - "다른 방법으로 로그인" 접힘 (ID/PW 폼)
>    - SDK 토큰 → 백엔드 `/api/auth/social-login` → JWT → SecureStore
> 5. **FCM 토큰 등록** (`src/services/NotificationService.ts`):
>    - expo-notifications 권한 요청
>    - 디바이스 토큰 획득
>    - POST `/api/v1/mobile/push-token/register` (userId, tenantId, token, platform)
>
> **딥링크**: Expo Router가 `mindgarden://tenant/{code}` 자동 라우팅
>
> **참조**: 기존 `/mobile/src/services/NotificationService.js` (FCM 패턴 참고, tenantId 추가), `EXPO_NATIVE_APP_PLAN.md` §5 테넌트 아키텍처

#### Phase 1-B: 네비게이션 셸

| 항목 | 값 |
|------|-----|
| **담당** | `core-coder` |
| **적용 스킬** | `/core-solution-frontend`, `/core-solution-atomic-design` |
| **병렬** | Phase 1-A와 동시 진행 가능 |

**전달 프롬프트**:
> Expo Router 기반 역할별 바텀탭 네비게이션 셸을 구현해주세요.
>
> **구현 대상**:
> 1. **루트 레이아웃** (`app/_layout.tsx`):
>    - QueryClientProvider, ThemeProvider, NotificationProvider 래핑
>    - 인증 상태 체크 → (auth) 또는 (consultant)/(client) 그룹 분기
> 2. **상담사 탭 레이아웃** (`app/(consultant)/_layout.tsx`):
>    - 5탭: 홈, 스케줄, 내담자, 일지, 더보기
>    - 아이콘: lucide-react-native (Home, Calendar, Users, FileText, MoreHorizontal)
>    - 활성 색상: `theme.consultant.primary` (#3D5246)
>    - 미읽음 배지 (알림 카운트)
> 3. **내담자 탭 레이아웃** (`app/(client)/_layout.tsx`):
>    - 5탭: 홈, 예약, 내 상담, 웰니스, 더보기
>    - 아이콘: lucide-react-native (Home, CalendarPlus, MessageCircle, Leaf, MoreHorizontal)
>    - 활성 색상: `theme.client.primary` (#E07A5F)
>    - 미읽음 배지
> 4. **AppTopBar 컴포넌트** (`src/components/templates/AppTopBar.tsx`):
>    - 좌: 로고 또는 뒤로가기
>    - 중: 페이지 제목
>    - 우: 알림 아이콘(배지) + 프로필 아바타
>    - 스크롤 시 Glassmorphism (expo-blur)
> 5. **화면 전환 애니메이션**: Expo Router `animation: 'slide_from_right'`
> 6. **Safe Area**: Edge-to-Edge 대응 (react-native-safe-area-context)
>
> **디자인 참조**: `docs/design-system/v2/CONSULTANT_CLIENT_APP_SHELL_SPEC.md`
> **색상 거버넌스**: 토큰만 사용, 하드코딩 금지

---

### Phase 2: 핵심 화면 구현

#### Phase 2-A: 상담사 핵심 화면 (P0)

| 항목 | 값 |
|------|-----|
| **담당** | `core-coder` |
| **목표** | 대시보드, 스케줄, 내담자 관리, 상담일지 |
| **적용 스킬** | `/core-solution-frontend`, `/core-solution-api`, `/core-solution-common-modules` |
| **의존** | Phase 1 완료 |
| **병렬** | Phase 2-B와 동시 진행 가능 |

**전달 프롬프트**:
> 상담사 핵심 화면 4개를 Expo Router + React Native로 구현해주세요.
>
> **구현 대상**:
> 1. **대시보드** (`app/(consultant)/(home)/index.tsx`):
>    - 인사 메시지 + 오늘 상담 건수
>    - 긴급 알림 영역 (미작성 일지, 에러 색상)
>    - 오늘의 스케줄 (ScheduleCard 리스트, FlashList)
>    - 빠른 액션 바 (일정추가, 근무설정, 급여 정산 조회(조건부))
>    - Pull-to-refresh, 스켈레톤 로딩
>    - API: `GET /api/v1/consultants/{id}/dashboard` 또는 조합
>
> 2. **스케줄 캘린더** (`app/(consultant)/(schedule)/index.tsx`):
>    - 주간/일간 뷰 토글
>    - 상담 카드 (시간·내담자·상태·액션 버튼)
>    - 상담 시작/완료 버튼
>    - 좌측 악센트 바로 상태 구분
>    - API: `GET /api/v1/schedules?consultantId={id}&date={date}`
>
> 3. **내담자 관리** (`app/(consultant)/(clients)/index.tsx`, `[id].tsx`):
>    - 카드형 목록 (아바타, 이름, 최근 상담일, 위험 배지)
>    - 검색·필터 (SearchBar)
>    - 상세: 탭(기본정보/상담이력/메모)
>    - API: `GET /api/v1/consultants/{id}/clients`
>
> 4. **상담일지** (`app/(consultant)/(records)/`):
>    - 작성 대기 목록 (미작성 상담 건)
>    - 작성 폼: 요약(공유) + 전문가 메모(비공개) + 태그(칩) + 다음 상담 제안
>    - 완료 목록 + 상세 보기
>    - API: `GET/POST /api/v1/consultation-records`
>
> **공통 규칙**:
> - TanStack Query 훅 사용 (useSchedules, useClients 등)
> - 모든 리스트: FlashList + 무한 스크롤 + 스켈레톤
> - Empty State: SVG 일러스트 + 안내 문구 + CTA
> - 터치 피드백: Pressable + expo-haptics
> - 색상: 상담사 테마 (`theme.consultant.*`), 하드코딩 금지
>
> **디자인 참조**: `docs/design-system/v2/CONSULTANT_CLIENT_SCREEN_WIREFRAMES.md` §1-2, `CONSULTANT_CLIENT_COMPONENTS_SPEC.md` §2-3

#### Phase 2-B: 내담자 핵심 화면 (P0)

| 항목 | 값 |
|------|-----|
| **담당** | `core-coder` |
| **목표** | 홈(피드), 예약 플로우, 내 상담, 웰니스 기본 |
| **적용 스킬** | `/core-solution-frontend`, `/core-solution-api`, `/core-solution-common-modules` |
| **의존** | Phase 1 완료 |
| **병렬** | Phase 2-A와 동시 진행 가능 |

**전달 프롬프트**:
> 내담자 핵심 화면을 Expo Router + React Native로 구현해주세요.
>
> **구현 대상**:
> 1. **홈(피드)** (`app/(client)/(home)/index.tsx`):
>    - 인사 메시지
>    - 다가오는 상담 카운트다운 카드 (ConsultationCard)
>    - "새로운 상담 예약하기" CTA 버튼 (풀 너비)
>    - 오늘의 웰니스 팁 (WellnessCard)
>    - 최근 활동 요약
>    - API: 조합 (스케줄 + 힐링콘텐츠 + 활동)
>
> 2. **예약 플로우** (`app/(client)/(booking)/`):
>    - 3스텝 프로세스 (Progress Bar 상단)
>    - Step 1: 상담사 선택 (카드형, 전문분야·평점·리뷰 수)
>    - Step 2: 시간 선택 (주간 캘린더 스와이프 + 가용 시간 Chip)
>    - Step 3: 결제/회기차감 → 토스페이먼츠 또는 보유 회기 차감
>    - 하단 고정 버튼 (Sticky Bottom)
>    - API: `GET /api/v1/consultants`, `GET /consultants/{id}/availability`, `POST /api/v1/consultations`
>
> 3. **내 상담** (`app/(client)/(sessions)/`):
>    - 탭: 예정/완료
>    - 상담 이력 타임라인
>    - 상담일지 열람 (상담사 공유분)
>    - 상담사 평가 (별점 + 태그 칩 + 한줄평)
>    - API: `GET /api/v1/schedules?userId={id}&userRole=CLIENT`, `POST /api/v1/ratings`
>
> 4. **웰니스 기본** (`app/(client)/(wellness)/index.tsx`):
>    - 감정 일기 진입 카드
>    - 자가 심리검사 진입 카드
>    - 명상 가이드 진입 카드
>    - 심리 교육 진입 카드
>    - 마음챙김 가이드 (기존 기능)
>    - 힐링 콘텐츠 카드 피드
>
> **공통 규칙**: Phase 2-A와 동일
> **디자인 참조**: `CONSULTANT_CLIENT_SCREEN_WIREFRAMES.md` §3-4, `CONSULTANT_CLIENT_COMPONENTS_SPEC.md` §4-6

---

### Phase 3: P1 기능 + 추가 콘텐츠

#### Phase 3-A: 메시지 + 알림 센터

| 항목 | 값 |
|------|-----|
| **담당** | `core-coder` |
| **목표** | 채팅형 메시지 UI, 알림 센터, 알림 설정 |
| **의존** | Phase 2 완료 |

**전달 프롬프트**:
> 메시지(채팅)와 알림 센터를 구현해주세요.
>
> 1. **대화 목록** — 최근 대화 리스트 (아바타, 이름, 마지막 메시지, 시간, 미읽음 배지)
> 2. **채팅 화면** — 버블형 UI, 읽음 표시, 시간 구분, 빠른 답장, 키보드 회피
> 3. **알림 센터** — 푸시 알림 리스트 (읽음/미읽음, 타입별 아이콘, 탭 시 해당 화면 이동)
> 4. **알림 설정** — 카테고리별 on/off (예약, 결제, 메시지, 웰니스, 시스템)
>
> API: `GET/POST /api/v1/consultation-messages`, `GET /api/v1/notifications`

#### Phase 3-B: 감정 일기 + 자가 심리검사

| 항목 | 값 |
|------|-----|
| **담당** | `core-coder` |
| **목표** | 감정 일기 전체 기능, 자가 심리검사 (PHQ-9, GAD-7, PSS) |
| **의존** | Phase 2-B 완료 |
| **병렬** | Phase 3-A와 동시 진행 가능 |

**전달 프롬프트**:
> 내담자 웰니스 핵심 기능 2개를 구현해주세요.
>
> 1. **감정 일기** (`app/(client)/(wellness)/mood-journal/`):
>    - 오늘의 기분 기록: 이모지 5단계 (😢😟😐🙂😊) + 감정 태그 칩 + 한줄 메모
>    - 감정 달력 (월간 이모지 뷰)
>    - 감정 추이 차트 (주간/월간, react-native-skia)
>    - 상담사 공유 설정 토글
>    - API: `CRUD /api/v1/mood-journals` (신규 API 필요 — 프론트 Mock 먼저)
>
> 2. **자가 심리검사** (`app/(client)/(wellness)/self-assessment/`):
>    - 검사 목록 카드 (PHQ-9 우울, GAD-7 불안, PSS 스트레스)
>    - 검사 실시: 문항별 4점 척도 Chip 선택
>    - 결과: 총점 + 해석 카드 + 심각도 색상
>    - "상담사에게 결과 공유" 토글
>    - 이전 검사 이력·추이 차트
>    - 문항 데이터: `src/constants/assessmentQuestions.ts`에 정적 저장 (PHQ-9, GAD-7은 퍼블릭 도메인)
>    - API: `CRUD /api/v1/self-assessments` (신규 API 필요 — 프론트 Mock 먼저)

#### Phase 3-C: 명상·심리교육·커뮤니티

| 항목 | 값 |
|------|-----|
| **담당** | `core-coder` |
| **목표** | 오디오 명상 가이드, 심리 교육 콘텐츠, 커뮤니티 |
| **의존** | Phase 2 완료 |
| **병렬** | Phase 3-A, 3-B와 동시 진행 가능 |

**전달 프롬프트**:
> 콘텐츠 기능 3개를 구현해주세요.
>
> 1. **오디오 명상 가이드** (`app/(client)/(wellness)/meditation/`):
>    - 카테고리별 목록 (호흡·마음챙김·수면·자연소리)
>    - 오디오 플레이어 (expo-audio) + 재생/일시정지/시간
>    - 미니 플레이어 (앱 내 바텀시트 위에 표시)
>    - 즐겨찾기 + 수련 이력 (총 시간·연속일)
>    - API: `GET /api/v1/meditations` (신규 — Mock 먼저)
>
> 2. **심리 교육 콘텐츠** (`app/(client)/(wellness)/psycho-education/`):
>    - 카테고리별 카드뉴스 목록
>    - 상세: 카드 스와이프 (페이지네이션)
>    - 북마크 + 읽기 완료 트래킹
>    - API: `GET /api/v1/psycho-education` (신규 — Mock 먼저)
>
> 3. **커뮤니티** (`app/(consultant)/(more)/community/`, `app/(client)/(more)/community/`):
>    - 내담자: 익명 후기·경험 공유
>    - 상담사: 칼럼/전문지식 작성
>    - 좋아요·댓글 (익명 선택)
>    - 관리자 검수 후 게시
>    - API: `CRUD /api/v1/community` (신규 — Mock 먼저)

#### Phase 3-D: 상담사 P1 기능

| 항목 | 값 |
|------|-----|
| **담당** | `core-coder` |
| **목표** | 근무 가능 시간 설정, **급여 정산(조건부)** — 관리자 산정 결과 조회(수입·매출 집계 리포트 제외) |
| **의존** | Phase 2-A 완료 |
| **병렬** | Phase 3-A~C와 동시 진행 가능 |

**전달 프롬프트**:
> 상담사 P1 기능 2개를 구현해주세요.
>
> 1. **근무 가능 시간** (`app/(consultant)/(more)/availability.tsx`):
>    - 주간 타임블록 설정 (시간 칩 선택)
>    - 휴가 등록 (달력에서 날짜 선택)
>    - API: `PUT /api/v1/consultants/{id}/availability`
>
> 2. **급여 정산(조건부)** (`app/(consultant)/(more)/income.tsx`):
>    - 테넌트 정책 시 **관리자가 산정한 급여·정산 결과 조회**만 (차트는 요약·기간별 조회 수준)
>    - **수입·매출·정산 원장 편집** 등 관리자 전용 기능은 앱 범위에서 제외
>    - API: 관리자·정산 도메인에서 노출하는 **읽기 전용** 계약(없으면 화면 비노출 또는 안내)

#### Phase 3-E: 내담자 결제·회기

| 항목 | 값 |
|------|-----|
| **담당** | `core-coder` |
| **목표** | 보유 회기 카드, 결제 내역, 회기 연장, 토스 결제 연동 |
| **의존** | Phase 2-B 완료 |
| **병렬** | Phase 3-A~D와 동시 진행 가능 |

**전달 프롬프트**:
> 내담자 결제·회기 관리를 구현해주세요.
>
> 1. **회기 관리** — 보유 회기 카드, 사용 이력, 회기 연장 요청
> 2. **결제 내역** — 결제 리스트 (날짜, 금액, 상태, 상세)
> 3. **토스페이먼츠 결제** — `@tosspayments/widget-sdk-react-native` 연동
>    - PaymentWidgetProvider, PaymentMethodWidget, AgreementWidget
>    - 결제 성공/실패 처리 + 서버 검증
> 4. **회기 소진 임박 시** 화면 내 알림 표시
>
> API: `GET /api/v1/payments`, `POST /api/v1/payments/create`, `GET /api/v1/admin/session-extensions`

---

### Phase 4: 푸시 알림 완성 + 오프라인 지원

| 항목 | 값 |
|------|-----|
| **담당** | `core-coder` |
| **목표** | 12종 푸시 시나리오 완성, 오프라인 지원, 백그라운드 작업 |
| **적용 스킬** | `/core-solution-frontend`, `/core-solution-multi-tenant` |
| **의존** | Phase 3 완료 |

> **기획 정합 (`CONSULTANT_CLIENT_APP_PLAN.md`)**  
> 웹앱 기획서의 **Phase 4**는 본 문서의 Phase 번호와 다르며, **「마음 날씨」AI 감정 분석·상담사 옵트인 데이터 브릿지**와 **「마음 정원」시각적 성장(게임화, 비경쟁)**을 뜻한다. Expo 반영은 **Phase 3-B(감정 일기)** 이후 **Phase 3-F·3-G**로 병렬 착수하거나, 푸시·오프라인 **Phase 4**와 병렬 배치할 수 있다. 착수 전 TODO는 `CONSULTANT_CLIENT_APP_PLAN.md` §8의 **`TODO — 「마음 날씨」`**, **`TODO — 「마음 정원」`**을 따른다.

**전달 프롬프트**:
> 푸시 알림과 오프라인 지원을 완성해주세요.
>
> 1. **푸시 알림 12종 시나리오** (§3.7 참조):
>    - 수신 시 라우팅 (알림 탭 → 해당 화면 딥링크)
>    - 포그라운드: 인앱 토스트 표시
>    - 백그라운드: OS 알림 트레이
>    - 알림 설정 반영 (카테고리별 on/off)
>    - `src/constants/pushScenarios.ts` 상수 정의
>
> 2. **오프라인 지원**:
>    - TanStack Query 캐시 → MMKV 영속화
>    - 네트워크 감지 (`@react-native-community/netinfo`)
>    - 오프라인 배너 표시 + 재연결 시 자동 동기화
>    - 핵심 데이터(스케줄, 내담자 목록) 오프라인 읽기 가능
>
> 3. **백그라운드 작업** (expo-background-task):
>    - FCM 토큰 주기적 갱신
>    - 캐시 정리

---

### Phase 5: 테스트 + 품질 검증

| 항목 | 값 |
|------|-----|
| **담당** | `core-tester` |
| **목표** | 단위·통합·E2E 테스트, 디자인 퀄리티 검증, 접근성 |
| **적용 스킬** | `/core-solution-testing` |
| **의존** | Phase 4 완료 |

**전달 프롬프트**:
> Expo 네이티브 앱의 전체 테스트를 수행해주세요.
>
> **단위 테스트** (Jest + @testing-library/react-native):
> - 모든 Zustand 스토어 (auth, tenant, app)
> - TenantAwareApiClient 인터셉터
> - 유틸리티 함수 (safeDisplay, dateUtils, tenantUtils)
> - 컴포넌트 렌더링 (atoms, molecules)
>
> **통합 테스트**:
> - 소셜 로그인 → 세션 저장 → API 호출 플로우
> - 테넌트 선택 → 캐시 → API 헤더 자동 삽입
> - 푸시 알림 수신 → 라우팅
>
> **E2E 테스트** (Maestro):
> 1. 상담사 로그인 → 대시보드 → 스케줄 확인 → 상담 시작/완료 → 일지 작성
> 2. 내담자 로그인 → 홈 → 예약 → 결제 → 확인
> 3. 내담자 → 감정 일기 기록 → 차트 확인
> 4. 메시지 전송·수신
> 5. 오프라인 → 온라인 동기화
> 6. (해당 기능 구현 시) **마음 날씨** — 짧은 메모 입력 → 키워드·요약 → 상담사 공유 옵트인 → 상담사 측 수신 UI
> 7. (해당 기능 구현 시) **마음 정원** — 상담 완료·과제 수행 후 정원 성장·상태 유지·비경쟁 UI
>
> **디자인 퀄리티 체크리스트** (25항목):
> - §6.2 전체 항목 검증
> - 색상 하드코딩 0건 (grep 검사)
> - 60-30-10 비율 육안 검증
>
> **접근성**:
> - 터치 타겟 44px+ 검증
> - accessibilityLabel 100% 커버리지
> - VoiceOver/TalkBack 기본 동작

---

### Phase 6: 스토어 배포 준비

| 항목 | 값 |
|------|-----|
| **담당** | `core-deployer` + `core-coder` |
| **목표** | EAS Submit으로 App Store / Play Store 제출 준비 |
| **의존** | Phase 5 완료 |

**작업 목록**:
1. 앱 아이콘·스플래시 에셋 준비
2. `eas.json` production 프로필 최종 설정
3. App Store Connect / Google Play Console 설정
4. 개인정보처리방침·이용약관 URL
5. 앱 스크린샷 (iPhone / Android 각 사이즈)
6. EAS Build → EAS Submit 파이프라인
7. 심사 대응 문서

---

## 9. 분배실행 요약 표

| Phase | 서브에이전트 | 목표 | 병렬 가능 | 의존 |
|-------|-------------|------|----------|------|
| **0-A** | `core-coder` | Expo 프로젝트 초기화 | ✅ 0-B와 동시 | - |
| **0-B** | `core-coder` | 디자인 토큰 JS 변환 + 테마 | ✅ 0-A와 동시 | - |
| **1-A** | `core-coder` | 테넌트 + 인증 (소셜 로그인) | ✅ 1-B와 동시 | Phase 0 |
| **1-B** | `core-coder` | 네비게이션 셸 (바텀탭) | ✅ 1-A와 동시 | Phase 0 |
| **2-A** | `core-coder` | 상담사 핵심 화면 (P0) | ✅ 2-B와 동시 | Phase 1 |
| **2-B** | `core-coder` | 내담자 핵심 화면 (P0) | ✅ 2-A와 동시 | Phase 1 |
| **3-A** | `core-coder` | 메시지 + 알림 센터 | ✅ 3-B~E와 동시 | Phase 2 |
| **3-B** | `core-coder` | 감정 일기 + 자가 심리검사 | ✅ 3-A,C~E와 동시 | Phase 2-B |
| **3-C** | `core-coder` | 명상·심리교육·커뮤니티 | ✅ 3-A,B,D,E와 동시 | Phase 2 |
| **3-D** | `core-coder` | 상담사 P1 (근무시간·급여 정산 조회(조건부)) | ✅ 3-A~C,E와 동시 | Phase 2-A |
| **3-E** | `core-coder` | 내담자 결제·회기 | ✅ 3-A~D와 동시 | Phase 2-B |
| **3-F** | `core-coder` | AI 「마음 날씨」감정 분석 + 상담사 옵트인 브릿지 (`CONSULTANT_CLIENT_APP_PLAN` Phase 4 정합) | ✅ 3-A~E·3-G·Phase 4와 병렬 가능 | Phase 3-B |
| **3-G** | `core-coder` | **마음 정원** 성장 시각화(게임화, 비경쟁) + 이벤트 연동 (`CONSULTANT_CLIENT_APP_PLAN` Phase 4 정합) | ✅ 3-A~F·Phase 4와 병렬 가능 | Phase 3 |
| **4** | `core-coder` | 푸시 알림 완성 + 오프라인 | - | Phase 3 |
| **5** | `core-tester` | 테스트 + 품질 검증 | - | Phase 4 |
| **6** | `core-deployer` + `core-coder` | 스토어 배포 준비 | - | Phase 5 |

### 디자인 리뷰 게이트

| 시점 | 리뷰 항목 | 담당 |
|------|-----------|------|
| Phase 0 완료 | 토큰·테마 값 정확성 | `core-designer` |
| Phase 1 완료 | 로그인 UI·탭 셸·전환 효과 | `core-designer` |
| Phase 2 완료 | 핵심 화면 비주얼·Empty State·카드 품질 | `core-designer` |
| Phase 3 완료 | 채팅 UI·플레이어·커뮤니티 폴리시 | `core-designer` |
| Phase 3-F 완료 | 마음 날씨 카드·동의 모달·프라이버시 카피 | `core-designer` |
| Phase 3-G 완료 | 정원 씬·성장 단계·온보딩·애니메이션 감소 옵션 | `core-designer` |
| Phase 5 | 전체 디자인 퀄리티 체크리스트 통과 | `core-tester` |

---

## 10. 리스크·제약

| # | 리스크 | 심각도 | 대응 |
|---|--------|--------|------|
| 1 | **Expo Config Plugin 호환성** | 높음 | 카카오·네이버 SDK의 Kotlin 2.0.21 지정 필요 (SDK 53). Dev Build 필수 테스트 |
| 2 | **네이티브 빌드 시간** | 중간 | EAS Build 클라우드 활용, 캐시 최적화 |
| 3 | **Reanimated 3 → 4 전환** | 낮음 | SDK 53은 3.17.x 사용. SDK 54에서 v4 자동 업그레이드. 하위 호환 API 사용 |
| 4 | **신규 백엔드 API** | 높음 | 감정일기·심리검사·명상·커뮤니티 API 신규 필요. Phase 3에서 프론트 Mock 선행, 백엔드 병렬 개발 |
| 5 | **테넌트 아키텍처 신규** | 높음 | 기존 앱에 없던 기능. 충분한 설계·테스트 필요 |
| 6 | **결제 SDK 심사** | 중간 | 토스페이먼츠 RN SDK WebView 기반. 스토어 심사 시 결제 가이드라인 준수 확인 |
| 7 | **오디오 콘텐츠 저작권** | 중간 | 번들·자사 CDN·라이선스 확보 음원만 사용. 외부 문서용 CDN 핫링크 금지(§10.1) |
| 8 | **자가 점검 도구(PHQ 등)·교육 카피** | 중간 | 원 도구 사용 조건·출처 준수. 앱 카피는 **참고용**이며 진단·의료행위를 대체하지 않음(§10.1) |
| 9 | **커뮤니티 관리** | 중간 | 자해/자살 키워드 자동 감지 + 관리자 검수 필수 |
| 10 | **iOS/Android 차이** | 중간 | Edge-to-Edge(Android), Safe Area(iOS), 그림자 렌더링 차이 → 플랫폼별 테스트 |
| 11 | **Expo Go 사용 불가** | 낮음 | 커스텀 네이티브 모듈(카카오·네이버) → Dev Build 필수. Expo Go에서 테스트 불가 |
| 12 | **기존 웹앱과 공존** | 낮음 | 별도 프로젝트(`expo-app/`). 웹앱에 영향 없음 |

### 10.1 웰니스 카피·저작권·의료 광고 표현 (`expo-app` 필수)

| 항목 | 규칙 |
|------|------|
| **금지 문구** | UI·푸시·알림·도움말에 **「치료」** 및 이에 준하는 **의료효과·완치·대체 진단**을 암시하는 표현을 넣지 않는다. (법적 의료광고·디지털치료 해당 여부는 별도 검토.) |
| **권장 표현** | 자가 점검·참고용·마음 돌봄·전문 **상담** 권유 등 비의료 중심 카피. 「검사」 단독 사용은 의료기관 검사와 혼동될 수 있어 **「자가 점검」** 등으로 완화한다. |
| **진단·의료행위 고지** | PHQ-9·GAD-7·PSS 등 결과 화면·목록 상단에 **「참고용이며 의학적 진단·의료행위·처방을 대체하지 않음」**을 노출한다. 구현 상수: `expo-app/src/constants/wellnessComplianceCopy.ts`. |
| **저작권** | 명상·교육·커뮤니티 **Mock 본문**은 운영 전 편집·감수·**표절 방지**·제3자 콘텐츠 라이선스를 확보한다. 오디오는 **자사 권리 또는 명시적 라이선스**만 배포·스트리밍한다. |
| **폰트·아이콘** | Pretendard 등 번들 폰트는 **SIL OFL 등 라이선스 파일**을 `assets/fonts/` 등에 유지한다. 아이콘 라이브러리(lucide 등)는 패키지 라이선스를 준수한다. |
| **문서·코드 동기화** | 본 절을 변경하면 `wellnessComplianceCopy.ts` 및 웰니스 화면 고지문과 함께 검수한다. |

---

## 11. 완료 기준·체크리스트

### Phase 0 (프로젝트 초기화 + 테마)
- [ ] `expo-app/` 프로젝트 생성, `npx expo start` 정상 기동
- [ ] TypeScript strict 모드 설정
- [ ] 핵심 의존성 설치 완료
- [ ] `src/theme/tokens.ts` — 전체 토큰 정의 (색상·간격·그림자·타이포)
- [ ] `ThemeProvider` — 역할별 테마 전환 동작
- [ ] Pretendard 폰트 로딩

### Phase 1 (인증 + 테넌트 + 셸)
- [ ] 카카오 로그인 → JWT 발급 → SecureStore 저장
- [ ] 네이버 로그인 → JWT 발급 → SecureStore 저장
- [ ] 테넌트 선택 화면 (코드 입력 + QR 스캔)
- [ ] TenantAwareApiClient — X-Tenant-Id 자동 삽입 확인
- [ ] FCM 토큰 등록 (tenantId 포함)
- [ ] 상담사 5탭 바텀 네비게이션 정상
- [ ] 내담자 5탭 바텀 네비게이션 정상
- [ ] AppTopBar (제목·알림·프로필) 렌더링
- [ ] Safe Area 정상 (iOS notch, Android Edge-to-Edge)

### Phase 2 (핵심 화면)
- [ ] 상담사: 대시보드·스케줄·내담자·일지 4화면 구현
- [ ] 내담자: 홈·예약·내상담·웰니스 4화면 구현
- [ ] 모든 화면 스켈레톤 로딩
- [ ] 모든 Empty State에 일러스트+CTA
- [ ] Pull-to-refresh 동작
- [ ] 색상 하드코딩 0건

### Phase 3 (P1 + 콘텐츠)
- [ ] 메시지 채팅형 UI (버블·읽음·키보드 회피)
- [ ] 알림 센터 + 설정 (카테고리별 on/off)
- [ ] 감정 일기 (이모지+태그+차트)
- [ ] 자가 심리검사 (PHQ-9, GAD-7, PSS)
- [ ] 오디오 명상 (플레이어 + 미니플레이어)
- [ ] 심리 교육 (카드뉴스)
- [ ] 커뮤니티 (게시판 + 칼럼)
- [ ] 근무 가능 시간 (상담사)
- [ ] 급여 정산 조회(조건부, 상담사)
- [ ] 결제·회기 관리 (내담자)

**core-tester 회귀(급여 정산)**  
- 상담사: `GET /api/v1/consultants/me/salary-calculations` — 본인만, 승인·지급 건만; 빈 목록 시 더보기 메뉴 미노출·빈 화면 안내 문구.  
- 관리자: `GET /api/v1/admin/salary/calculations/{id}` — `SALARY_MANAGE`(또는 ADMIN 자동 통과) 없으면 403; 상담사가 타인 ID로 호출 불가.

### Phase 4 (푸시 + 오프라인)
- [ ] 12종 푸시 시나리오 구현
- [ ] 오프라인 모드 기본 동작 (핵심 데이터 읽기)
- [ ] 네트워크 복구 시 자동 동기화

### Phase 3-F (마음 날씨 AI — `CONSULTANT_CLIENT_APP_PLAN` Phase 4 정합)

> 착수 전 상세 TODO는 `CONSULTANT_CLIENT_APP_PLAN.md` §8 `TODO — 「마음 날씨」(Phase 4 착수 전)` 참조.

- [ ] 짧은 일기·메모 → 감정 키워드·한 줄 요약(참고용 고지)
- [ ] 상담사 전달 옵트인·철회·감사 로그(테넌트 격리)
- [ ] 상담사 앱에서 수신 요약 표시(매칭된 내담자만)

### Phase 3-G (마음 정원 — `CONSULTANT_CLIENT_APP_PLAN` Phase 4 정합)

> 착수 전 상세 TODO는 `CONSULTANT_CLIENT_APP_PLAN.md` §8 `TODO — 「마음 정원」(Phase 4 착수 전)` 참조.

- [ ] 상담 완료·과제 등 **이벤트**와 성장치 연동(클라이언트 + 서버 권위 상태)
- [ ] 정원 화면(시각화)·비경쟁·주간 상한·미접속 페널티 없음
- [ ] (선택) 마음 날씨와 **장식 테마**만 느슨하게 연동

### Phase 5 (테스트)
- [ ] 단위 테스트 커버리지 80%+
- [ ] E2E 5개 시나리오 통과 + (구현 시) 마음 날씨·공유 + **마음 정원** 시나리오
- [ ] 디자인 퀄리티 체크리스트 25항목 통과
- [ ] 색상 하드코딩 grep 0건
- [ ] 접근성 기본 검증 (VoiceOver/TalkBack)

### Phase 6 (배포)
- [ ] EAS Build production 빌드 성공
- [ ] App Store Connect 제출 준비
- [ ] Google Play Console 제출 준비
- [ ] 개인정보처리방침·이용약관 URL

---

## 11.1 Expo Phase 3 완료 게이트 → Phase 3-F / 3-G 착수

> `expo-app/` 기준: **Phase 3-A~E**가 제품 관점에서 완료되었다고 보기 전에는 **3-F(마음 날씨)·3-G(마음 정원)** 구현 배치를 열지 않는다.

| 확인 | 내용 |
|------|------|
| **API** | 커뮤니티·심리교육 전용·명상 목록 등 **샘플/플레이스홀더**가 허용 범위인지 기획서와 일치하는지, 아니면 백엔드 연동 잔여인지 명시 |
| **화면** | `PlaceholderScreen`(프로필·설정)·예약 캘린더·환불 등 **TODO** 잔여를 Phase 3 잔여로 정리했는지 |
| **푸시** | `NotificationService`·토큰 API 계약 — Phase **4(푸시+오프라인)** 본 트랙과 역할 분담 명확화 |
| **검증** | `core-tester`로 §11 Phase 3 체크리스트 스모크 통과 후 **Phase 3 완료** 선언 |

**Phase 4(푸시+오프라인)** 및 **`CONSULTANT_CLIENT_APP_PLAN` Phase 4(마음 날씨·정원)** 착수 순서는 `CONSULTANT_CLIENT_APP_PLAN.md` §8 **「Phase 4 착수 준비 패키지」**와 본 문서 §12 실행 요청문을 따른다.

---

## 12. 실행 요청문

다음 순서로 서브에이전트를 호출해 주세요:

1. **Phase 0-A + 0-B 동시** → `core-coder` 2개 — Expo 프로젝트 초기화 + 디자인 토큰
2. Phase 0 완료 후 → **Phase 1-A + 1-B 동시** → `core-coder` 2개 — 테넌트·인증 + 네비게이션 셸
3. Phase 1 완료 후 → `core-designer` (model: `gemini-3.1-pro`) — Phase 1 디자인 리뷰
4. 리뷰 통과 후 → **Phase 2-A + 2-B 동시** → `core-coder` 2개 — 상담사·내담자 핵심 화면
5. Phase 2 완료 후 → `core-designer` — Phase 2 디자인 리뷰
6. 리뷰 통과 후 → **Phase 3-A ~ 3-E 병렬** → `core-coder` 5개 — P1 기능 + 추가 콘텐츠
6.5 (선택·`CONSULTANT_CLIENT_APP_PLAN` 웹 Phase 4 정합) → **Phase 3-F** → `core-coder` — AI 「마음 날씨」감정 분석 + 상담사 옵트인 브릿지. **Phase 3-B 이후** 착수 권장, **Phase 3-E·3-G·Phase 4(푸시)와 병렬** 가능
6.6 (선택·동일 정합) → **Phase 3-G** → `core-coder` — **마음 정원** 성장 시각화(비경쟁). **Phase 3** 내담자 흐름 안정 후 착수 권장, **3-F·Phase 4와 병렬** 가능
7. Phase 3 완료 후 → **Phase 4** → `core-coder` — 푸시 알림 완성 + 오프라인
8. Phase 4 완료 후 → **Phase 5** → `core-tester` — 테스트 + 품질 검증
9. Phase 5 통과 후 → **Phase 6** → `core-deployer` + `core-coder` — 스토어 배포

각 Phase 결과를 core-planner(기획)에게 보고하면, 기획이 검토 후 다음 Phase 진행 여부를 판단합니다.

---

## 13. 백엔드 API 신규 개발 필요 목록

> Phase 3에서 프론트엔드 Mock 선행 → 백엔드 병렬 개발

| API | 엔드포인트 (제안) | 주요 기능 | 필요 Phase |
|-----|-----------------|-----------|-----------|
| 감정 일기 | `/api/v1/mood-journals` | CRUD + 통계(주간/월간) + 상담사 공유 | 3-B |
| 자가 심리검사 | `/api/v1/self-assessments` | 검사 실시·결과 저장·이력·통계 | 3-B |
| 명상 콘텐츠 | `/api/v1/meditations` | 목록·카테고리·즐겨찾기·수련이력 | 3-C |
| 심리 교육 | `/api/v1/psycho-education` | 목록·상세·북마크·읽기완료 | 3-C |
| 힐링 콘텐츠 | `/api/v1/healing-contents` | 목록·타입(MEDITATION·ARTICLE 등)·썸네일·기본 정렬 | 3-C |
| 커뮤니티 | `/api/v1/community` | 게시글 CRUD·좋아요·댓글·신고·검수 | 3-C |
| 푸시 토큰 | `/api/v1/mobile/push-token/register` | tenantId 파라미터 추가 (기존 API 확장) | 1-A |
| 마음 날씨 / 감정 분석 | `/api/v1/...` (계약 TBD) | 텍스트·(선택) 음성 분석, 키워드·요약, 상담사 공유 동의·수신, 감사 로그 | 3-F |
| 마음 정원 / 성장 상태 | `/api/v1/...` (계약 TBD) | 내담자별 정원 단계·수집 요소·이벤트 로그, 테넌트 격리, 주간 상한 서버 검증 | 3-G |

### TODO — 백엔드 구현 (웰니스 심리 교육·힐링, Expo 연동)

> 앱은 위 API가 없을 때 **샘플·폴백**으로 동작한다. 운영·스테이징에서 실서버 목록을 쓰려면 아래를 **Spring 백엔드**에서 구현한다. (`core-coder` 백엔드 배치 시 본 절·`docs/standards/`·`/api/v1/` 표준 준수)

- [x] **`GET /api/v1/psycho-education`** — 구현됨: `PsychoEducationController` + `PsychoEducationServiceImpl`(시드, `TenantContextHolder` 필수). 응답은 `ApiResponse`의 `data`에 배열(`PsychoEducationArticleResponse`).
- [x] **`GET /api/v1/psycho-education/{id}`** — 구현됨: 동 컨트롤러 `GET /{id}`.
- [x] **`GET /api/v1/healing-contents`** — 구현됨: `HealingContentsController` + `HealingContentsCatalogServiceImpl`, 내담자·`tenantId` 검증, `SecurityConfig` 경로 등록.
- [ ] (선택) 북마크·읽기 완료 **서버 동기화**가 필요하면 전용 `POST`/`PUT` 계약을 기획서에 추가한 뒤 구현.
- [x] **웹 `/api/v1/healing` vs 앱 `/api/v1/healing-contents`** — MVP는 **병행**: 레거시 `HealingContentController` 유지, Expo 전용 목록은 `healing-contents`로 분리(컨트롤러 JavaDoc 참고). 향후 통일·프록시는 별도 아키 결정.

---

*본 문서는 `CONSULTANT_CLIENT_APP_PLAN.md` (웹앱 기획서) + 4개 디자인 스펙 문서를 기반으로 Expo 네이티브 앱 전환에 필요한 변경·추가 사항을 정리한 기획서입니다.*

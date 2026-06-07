# Apple T1 — Sign in with Apple (SIWA) 디자인 핸드오프

> **작성일**: 2026-06-05
> **대상 거절**: Apple App Store Submission ID `ce38fb9a-ced4-4957-b606-21618ff23518`, Guideline 4.8 (Login Services)
> **버전**: 1.0.6 / iOS build 9
> **트랙**: T1 (SIWA)
> **선행 문서**: `docs/project-management/APPLE_REJECTION_PLAN_A_ORCHESTRATION_2026_06_04.md` §7 T1
> **작성자**: 메인 어시스턴트 (core-designer 사용량 소진으로 대체 작성)

## 1. 사유 요약

Apple 4.8 은 제3자 로그인을 제공하는 앱이 다음 3가지 조건을 모두 만족하는 **동등한 대안**을 함께 제공해야 한다고 명시한다:

1. 수집 PII 가 **이름·이메일** 로 한정되어야 함
2. 사용자가 **이메일을 비공개 (private relay)** 로 유지할 수 있어야 함
3. **광고 목적 행동 데이터** 를 동의 없이 수집하지 않아야 함

마인드가든 현재 로그인은 **카카오·네이버** 만 제공. 둘 다 위 3가지 조건을 충족하지 않음 (생일·전화번호·CI 등 추가 PII, private relay 미지원). → **Sign in with Apple 정식 추가 필수**.

## 2. 결정 사항 (요약)

| 항목 | 결정 |
|---|---|
| 노출 플랫폼 | iOS 한정 (Android 미적용) |
| 라이브러리 | `expo-apple-authentication` (Expo 공식, SDK 53+ 호환) |
| 버튼 스타일 | **black** (라이트 테마 기본) / **white** (다크 테마) — 시스템 테마 자동 추종 |
| 라벨 | "Apple로 계속하기" (Apple 한국어 가이드 권장 표현) |
| 위치 | 카카오 → 네이버 → **Apple** (가장 아래) — 기존 사용자 카카오·네이버 우선 |
| Private Relay | 풀백엔드 정상 처리 — `@privaterelay.appleid.com` 도메인을 정식 이메일로 저장 |
| 휴대폰 필수 완화 | Apple 가입 한정 "휴대폰 (선택)" — 가입 후 마이페이지에서 추가 입력 유도 |
| 약관 동의 | 카카오·네이버와 동일 (서비스·개인정보·마케팅) |

## 3. 로그인 화면 시안

### 3.1 위치·순서

기존 로그인 화면 (`expo-app/app/(auth)/login.tsx:88-503`) 의 SNS 버튼 영역 (현재 카카오 333-345, 네이버 347-367) 아래에 Apple 버튼 추가.

```
┌─────────────────────────────────────┐
│ [이메일/휴대폰]                      │
│ [비밀번호]                           │
│ [로그인]                             │
│                                      │
│ ──── 또는 SNS 로 계속하기 ────       │
│                                      │
│ [💛 카카오로 계속하기]               │  ← 기존
│ [🟢 네이버로 계속하기]               │  ← 기존
│ [🍎 Apple로 계속하기]                │  ← 신규 (iOS 한정)
└─────────────────────────────────────┘
```

iOS 가 아닐 때는 Apple 버튼을 렌더하지 않음 (`Platform.OS === 'ios'` 가드).

### 3.2 버튼 스타일 (Apple HIG 준수)

| 속성 | 라이트 테마 | 다크 테마 |
|---|---|---|
| 배경색 | `#000000` (black) | `#FFFFFF` (white) |
| 텍스트색 | `#FFFFFF` | `#000000` |
| 테두리 | 없음 | `#000000` 1px (whiteOutline) |
| 아이콘 | Apple 로고 (`expo-apple-authentication` 내장) | 동일 |
| 라벨 | "Apple로 계속하기" | 동일 |
| 폰트 | SF Pro / Apple 시스템 — 라이브러리 기본 |
| 폰트 크기 | 17pt (iOS 표준) | 동일 |
| 폰트 웨이트 | 600 (Semibold) | 동일 |
| 높이 | **44pt 이상** (Apple HIG 최소) — 권장 **52pt** | 동일 |
| 모서리 라운드 | 8pt (다른 SNS 버튼과 일치) | 동일 |
| 좌우 여백 | 16pt (다른 SNS 버튼과 일치) | 동일 |
| 버튼 간 수직 간격 | 12pt | 동일 |
| 아이콘 ↔ 텍스트 간격 | 8pt (라이브러리 기본) | 동일 |

> **주의**: `expo-apple-authentication` 의 `<AppleAuthentication.AppleAuthenticationButton>` 컴포넌트를 그대로 사용 — Apple HIG 준수 자동. 직접 구현 금지.

### 3.3 로딩 상태

- 사용자가 Apple 버튼 탭 → Apple 시스템 시트 표시 → 인증 완료 후 로딩 인디케이터
- 로딩 중에는 모든 SNS 버튼 비활성화 (회색 처리)
- 카피: "로그인 중..." (기존 `LoginLoadingOverlay` 재사용)

### 3.4 접근성

- 최소 터치 영역: **44pt × 44pt** 보장
- 색 대비: black/white 4.5:1 이상 자동 충족
- VoiceOver 라벨: "Apple로 계속하기, 버튼" (라이브러리 자동 처리)
- 다크모드 동작 확인 필수

## 4. Apple 가입 분기 시안

### 4.1 첫 로그인 ↔ 재로그인 분기

Apple 정책: **첫 로그인** 시에만 `fullName`, `email` 을 제공하고, **이후** 호출은 `sub` (영구 사용자 ID) 만 반환. → **첫 로그인 시점에 이름·이메일을 반드시 캡처해서 저장** 해야 함.

```
[Apple 버튼 탭]
   │
   ▼
[Apple 시스템 시트 표시]
   │  ├─ 이메일 공개 / 비공개(Private Relay) 선택
   │  ├─ 이름 편집 가능
   │  └─ Touch ID / Face ID
   ▼
[identityToken + authorizationCode 수신]
   │
   ▼
[백엔드 /api/v1/oauth2/social-login (provider=APPLE)]
   │
   ├─ 신규 사용자 → requiresSignup: true
   │     ↓
   │  [social-signup 화면 (Apple 모드)]
   │     ├─ 이름 prefill (수정 가능)
   │     ├─ 이메일 prefill (Private Relay 도메인 그대로 표시)
   │     ├─ 휴대폰 선택 입력 (skip 가능) ★ 카카오·네이버와 차이
   │     ├─ 약관 동의 (필수 2 + 선택 1)
   │     └─ [가입 완료]
   │
   └─ 기존 사용자 → 로그인 성공 → 메인
```

### 4.2 Private Relay 이메일 처리

- Apple Private Relay 사용자는 `xxxxx@privaterelay.appleid.com` 형태의 익명 이메일 수신
- **백엔드는 이 이메일을 정식 이메일로 저장** (변경 불가)
- 마인드가든 → 사용자 발송 메일은 Apple 이 익명 이메일로 라우팅
- **사용자 안내**: 가입 폼 이메일 필드 우측에 작은 회색 헬퍼 텍스트
  - "Apple 비공개 이메일을 사용 중입니다. 마인드가든이 보내는 메일은 Apple 을 거쳐 본인의 실제 이메일로 전달됩니다."

### 4.3 휴대폰 필수 완화

기존 `expo-app/app/(auth)/social-signup.tsx:236-241, 351-363` 은 휴대폰 11자리 필수. Apple 가입 흐름에서는 **선택**.

- 라벨: "휴대폰 번호 (선택)"
- 플레이스홀더: "010-0000-0000"
- 헬퍼 텍스트: "휴대폰 번호를 입력하지 않으면 SMS 인증·알림톡을 받을 수 없습니다. 마이페이지에서 언제든 추가할 수 있습니다."
- 입력값이 비어 있어도 가입 진행 가능
- 마이페이지 (`expo-app/app/(client)/(more)/account/profile.tsx`) 에 "휴대폰 추가하기" 배너 노출 (휴대폰이 비어 있을 때만)

> **백엔드**: `users.phone` NOT NULL 제약이 있다면 nullable 로 마이그레이션 필요. (Coder 검증 항목)

### 4.4 가입 폼 분기 와이어 (요약)

| 필드 | 카카오/네이버 | Apple |
|---|---|---|
| 이름 | prefill, 수정 가능 | prefill, 수정 가능 |
| 이메일 | prefill, 읽기 전용 | prefill, 읽기 전용 (Private Relay 도메인 그대로) |
| 휴대폰 | **필수** 11자리 | **선택** (skip 가능) |
| 비밀번호 | 없음 (소셜) | 없음 (소셜) |
| 약관 동의 | 서비스·개인정보 필수 + 마케팅 선택 | 동일 |

## 5. 디자인 토큰

### 5.1 컬러

```typescript
// expo-app/src/constants/socialLoginTokens.ts (신규 또는 기존 토큰 확장)
export const APPLE_SIGNIN_TOKENS = {
  light: {
    background: '#000000',
    foreground: '#FFFFFF',
    border: 'transparent',
  },
  dark: {
    background: '#FFFFFF',
    foreground: '#000000',
    border: '#000000',
  },
} as const;
```

### 5.2 타이포

라이브러리(`AppleAuthenticationButton`)가 자동 처리. 별도 폰트 지정 금지.

### 5.3 간격·크기

- 버튼 높이: `52pt`
- 모서리 라운드: `8pt`
- 좌우 패딩: `16pt`
- 버튼 간 간격: `12pt`

이는 기존 카카오·네이버 버튼과 일치시키기 위한 값. 디자인 토큰화 권장.

## 6. 코더 핸드오프 메모 (T1-Coder)

### 6.1 라이브러리 설치

```bash
cd expo-app
npm install expo-apple-authentication
```

> Expo SDK 53 호환 버전 자동 설치. 별도 버전 핀 불필요.

### 6.2 `app.config.ts` 변경

```typescript
ios: {
  supportsTablet: false,
  bundleIdentifier: 'com.mindgarden.MindGardenMobile',  // 기존 값 유지
  usesAppleSignIn: true,  // ★ 추가
  // ... 기존 infoPlist 설정 유지
},
plugins: [
  // ... 기존 플러그인
  'expo-apple-authentication',  // ★ 추가 (위치는 expo-secure-store 근처 권장)
],
```

### 6.3 백엔드 API

기존 `/api/v1/oauth2/social-login` 재사용. provider 값으로 `APPLE` 추가.

요청 바디:
```json
{
  "provider": "APPLE",
  "identityToken": "<Apple identityToken>",
  "fullName": { "givenName": "...", "familyName": "..." },  // 첫 로그인만
  "email": "...@privaterelay.appleid.com"  // 첫 로그인만
}
```

응답: 기존 카카오·네이버와 동일 구조 (`requiresSignup: true` 또는 `accessToken`/`refreshToken` 포함).

> **백엔드 구현 항목 (T1-Coder 작업)**:
> - `AppleOAuth2ServiceImpl.java` 신규 (JWKS 검증, claim 파싱, Private Relay 처리)
> - `OAuth2Provider` enum 에 `APPLE` 추가
> - `users.phone` nullable 마이그레이션
> - `SocialUserInfo.normalizeData()` 가 Apple 케이스에서 phone null 허용 (기존 로직 그대로 OK)

### 6.4 SIWA 검증 (서버사이드)

- Apple JWKS endpoint: `https://appleid.apple.com/auth/keys`
- iss = `https://appleid.apple.com`, aud = bundleIdentifier
- iat/exp 검증, nonce 검증 (선택)

### 6.5 테스트 노트

- iOS 시뮬레이터에서 SIWA 동작 가능 (Apple ID 로그인 필요)
- 첫 로그인 → "이름 편집·이메일 비공개" 옵션 직접 테스트
- 같은 Apple ID 로 두 번째 로그인 시 fullName/email 이 안 오는 것 확인 → 백엔드 첫 로그인 데이터 영구 저장 검증

## 7. ASC 메타 변경

| 항목 | 변경 |
|---|---|
| App Privacy → Data Collected | "Identifiers — User ID" 추가 (Apple `sub`) — 광고 비목적 |
| App Privacy → Email | 기존 카카오·네이버 그대로 + Apple 추가 |
| Login Services 응답 | App Review 답신에 "Sign in with Apple 추가했습니다 (build 9). 4.8 의 모든 요구사항 충족: 이름·이메일만 수집, Private Relay 지원, 광고 행동 비수집" 명시 |

## 8. 완료 정의 (DoD)

- [ ] iOS 로그인 화면에 Apple 버튼 노출 (다크/라이트 양쪽 시안)
- [ ] Apple 첫 로그인 → 신규 가입 분기 정상 (이름·이메일 prefill, 휴대폰 선택)
- [ ] Apple 두 번째 로그인 → 기존 사용자 토큰 발급
- [ ] Private Relay 이메일로 메일 발송 정상 (사용자에게 도달)
- [ ] 휴대폰 미입력 사용자 마이페이지 추가 입력 가능
- [ ] Android 빌드에 Apple 버튼 미노출
- [ ] App Privacy 메타 업데이트 + Apple 답신 작성

## 9. 다음 단계

이 문서를 코더 (T1-Coder) 에게 전달:

```
@core-coder Apple T1 SIWA 구현. 핸드오프 문서: docs/project-management/2026-06-04/APPLE_T1_SIWA_DESIGN_HANDOFF.md

수정 대상:
- expo-app/package.json (expo-apple-authentication 추가)
- expo-app/app.config.ts (usesAppleSignIn, plugin)
- expo-app/app/(auth)/login.tsx (Apple 버튼)
- expo-app/app/(auth)/social-signup.tsx (휴대폰 선택 처리)
- expo-app/src/services/AuthService.ts (signInWithApple 메서드)
- src/main/java/.../OAuth2Provider enum (APPLE 추가)
- src/main/java/.../service/impl/AppleOAuth2ServiceImpl.java (신규)
- src/main/resources/db/migration/V20260605_xxx__make_users_phone_nullable.sql

완료 조건: §8 DoD 모두 체크 후 core-tester 검증 게이트.
```

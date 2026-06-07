# EAS 빌드 · 검증 가이드 — iOS 1.0.6 / build 9

> **작성일**: 2026-06-05
> **목표**: Apple App Store 거절 대응 빌드 (4.8 + 1.2 + 1.4.1)
> **버전**: 1.0.6 / iOS build 9
> **워크스페이스**: `expo-app/`

## 0. 빌드 정보 (확정)

| 항목 | 값 | 근거 |
|---|---|---|
| Expo SDK | 54.0.33 | `expo-app/package.json:51` |
| React Native | 0.81.5 | `package.json:77` |
| iOS Bundle ID | `com.mindgarden.MindGardenMobile` | `app.config.ts:199` |
| Apple Team ID | `65M2946S2L` | `eas.json:62` |
| ASC App ID | `6773278258` | `eas.json:61` |
| Apple ID (제출자) | `beta74@live.co.kr` | `eas.json:60` |
| EAS Project ID | `da41eca0-daad-4825-baf7-16cd3c71e6cd` | `eas.json:53` |
| 다음 version | `1.0.6` | 1.0.5 → 1.0.6 |
| 다음 buildNumber | `9` | 1.0.5(8) → 1.0.6(9), production 프로필 `autoIncrement: true` |

> **중요**: `eas.json` production 프로필이 `autoIncrement: true` 이므로 `app.config.ts` 의 `version` 만 1.0.6 으로 올리면 buildNumber 는 EAS 가 자동으로 9 로 증가시킨다.

## 1. 사전 점검 (D+1 코더 작업 시작 전)

### 1.1 워크스페이스 동기화

```bash
cd expo-app
git checkout develop && git pull origin develop
git checkout -b feature/apple-rejection-1.0.6
```

> 또는 트랙별 분리:
> - `feature/apple-1.0.6-t1-siwa`
> - `feature/apple-1.0.6-t2-ugc`
> - `feature/apple-1.0.6-t3-citation`
> 마지막에 `release/1.0.6` 으로 rebase·squash 통합.

### 1.2 Expo doctor

```bash
cd expo-app
npx expo-doctor
```

> SDK 54 호환성·plugin 충돌·버전 불일치 사전 점검. 경고 모두 해소.

### 1.3 EAS 인증

```bash
eas whoami
# 미인증이면
eas login
```

### 1.4 EAS 환경변수 (production 프로필)

```bash
eas env:list --environment production
```

확인할 키 (모두 `production` 환경에 존재해야 함):

| 키 | 비고 |
|---|---|
| `KAKAO_APP_KEY` | 운영 카카오 네이티브 앱 키 |
| `EXPO_PUBLIC_NAVER_CLIENT_ID` | 네이버 클라이언트 ID |
| `EXPO_PUBLIC_NAVER_CLIENT_SECRET` | 네이버 클라이언트 시크릿 |
| `NAVER_CLIENT_ID` | 동일값 (네이티브 플러그인용) |
| `NAVER_CLIENT_SECRET` | 동일값 |
| `EXPO_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY` | 토스 결제 |
| `EXPO_PUBLIC_TOSS_PAYMENT_SUCCESS_URL` | |
| `EXPO_PUBLIC_TOSS_PAYMENT_FAIL_URL` | |
| `GOOGLE_SERVICES_JSON` | iOS 빌드에는 불필요 |

> **SIWA 추가 환경변수 필요 없음** — `expo-apple-authentication` 은 디바이스의 Apple ID 기반이라 클라이언트 측 키가 필요 없다. iOS Bundle ID 자체가 ASC 의 SIWA Capability 등록 키 역할.

### 1.5 ASC Capability — Sign in with Apple

빌드 전 한 번만 (사용자 작업):

1. https://developer.apple.com/account/resources/identifiers/list
2. `com.mindgarden.MindGardenMobile` 클릭
3. **Capabilities** > **Sign In with Apple** 체크
4. **Save**
5. (선택) ASC > App > General > Bundle ID 와 Provisioning 갱신은 EAS 가 자동 처리

> 이 단계가 누락되면 첫 SIWA 인증에서 `ASAuthorizationErrorUnknown` 발생.

## 2. 빌드 명령

### 2.1 라이브러리 설치 후 (코더 작업 완료 후)

```bash
cd expo-app

# 의존성 검증
npm install
npx expo-doctor

# 코드 빌드 사전 검증
npm run lint
npx tsc --noEmit
npm run test:utils

# Metro 번들 검증 (CI 환경 모드)
npm run verify:bundle:ci
```

### 2.2 iOS Production 빌드 (1.0.6 / build 9)

```bash
cd expo-app
eas build --platform ios --profile production --message "1.0.6 build 9 — Apple rejection fix (4.8 SIWA, 1.2 UGC safeguards, 1.4.1 medical citations)"
```

진행 흐름:
1. EAS 가 `app.config.ts` 의 `version` 읽어 1.0.6 적용
2. `autoIncrement: true` 로 buildNumber 8 → 9 자동 증가
3. EAS Cloud 에서 iOS 빌드 (~15-25분)
4. 완료 후 .ipa 다운로드 링크 제공

### 2.3 빌드 로그 확인 포인트

빌드 로그에서 다음 키워드를 grep:

```
"카카오·네이버 소셜 로그인용 env 누락"  → 환경변수 누락
"naverMindGardenMobileApp"          → 네이버 URL Scheme
"applinks:"                         → Universal Links
"aps-environment"                   → APNs (expo-notifications)
"com.apple.developer.applesignin"   → SIWA entitlement (T1 작업 후)
```

> SIWA entitlement 가 빌드 로그에 안 나오면 ASC Capability 미등록 또는 `usesAppleSignIn: true` 미설정.

### 2.4 ASC 업로드

EAS Submit (자동):

```bash
cd expo-app
eas submit --platform ios --profile production --latest
```

> `eas.json` 의 submit.production.ios 가 `appleId`, `ascAppId`, `appleTeamId` 자동 처리.

또는 Transporter 수동 업로드 (대체):
1. `~/Downloads/MindGarden-1.0.6-9.ipa` 다운로드
2. Mac App Store → Transporter 앱 실행
3. Apple ID `beta74@live.co.kr` 로그인
4. ipa 드래그 앤 드롭
5. **Deliver** 클릭

### 2.5 빌드 처리 대기

ASC 업로드 후 Apple 측 처리 (~15-45분):
- ASC > My Apps > MindGarden > TestFlight > Builds
- Status: "Processing" → "Ready to Submit"

## 3. 검수 제출 (D+6)

### 3.1 ASC 메타 변경 (사용자 작업)

`docs/project-management/2026-06-04/APPLE_ASC_METADATA_CHANGES.md` 참조.

핵심:
- App Information → Age Rating: **17+/18+**
- App Information → Description: UGC 안전장치·Citation 명시 추가
- App Privacy → "Identifiers — User ID" 항목 추가 (Apple `sub`)

### 3.2 Submit for Review

1. ASC > My Apps > MindGarden > App Store
2. iOS App: **+** 버튼 → Version `1.0.6` 신규 생성
3. Build: 처리 완료된 build 9 선택
4. What's New: 한글
   ```
   • Sign in with Apple 추가
   • 커뮤니티 신고·차단·자삭 기능 추가
   • 18세 이상 이용 정책 적용
   • 자가검사·심리 교육 콘텐츠 출처 표시
   • 안정성 개선
   ```
5. App Review Information: 데모 계정 + 메모 그대로 유지
6. **Submit for Review**

### 3.3 Resolution Center 답신

1. ASC > Resolution Center > 이전 거절 ID `ce38fb9a` 메시지
2. **Reply** 클릭
3. `docs/project-management/2026-06-04/APPLE_REVIEW_REPLY_DRAFT.md` 의 **English Version** 본문 붙여넣기
4. **Send**

> 이 답신이 검수자에게 직접 도달 → 평균 대기 시간 단축.

## 4. 검증 시나리오 (D+5 Tester 게이트)

### 4.1 SIWA (T1)

| # | 시나리오 | 기대 결과 |
|---|---|---|
| T1-1 | 신규 사용자 SIWA 첫 로그인 | 가입 폼 진입, 이름·이메일 prefill |
| T1-2 | Hide My Email 선택 | `@privaterelay.appleid.com` 이메일로 가입 성공 |
| T1-3 | 휴대폰 미입력 가입 | 메인 진입 정상, 마이페이지 추가 배너 |
| T1-4 | 같은 Apple ID 두 번째 로그인 | 기존 계정 토큰 발급, 가입 폼 미진입 |
| T1-5 | Private Relay 사용자에게 발송한 알림톡·이메일 도달 | Apple 릴레이 통과 정상 |
| T1-6 | Android 빌드 SIWA 버튼 | 미노출 확인 |

### 4.2 UGC (T2)

| # | 시나리오 | 기대 결과 |
|---|---|---|
| T2-1 | 만 18세 가입 시도 | 차단 화면 |
| T2-2 | 만 19세 가입 | 정상 |
| T2-3 | 기존 사용자 (생년월일 NULL) | 1회 모달 → 입력 → 진입 |
| T2-4 | 게시물 케밥 → 신고 | 6사유 + 200자 모달, 제출 → 토스트 |
| T2-5 | 같은 게시물 중복 신고 | "이미 신고하신 게시물입니다" |
| T2-6 | 사용자 차단 | 피드에서 즉시 비노출 |
| T2-7 | 차단 목록 → 해제 | 피드에 즉시 재노출 |
| T2-8 | 본인 게시물 → 삭제 | 즉시 삭제 |
| T2-9 | 금칙어 게시 시도 | 차단 + 에러 메시지 |
| T2-10 | 어드민 신고 큐 SLA | 12h 노랑, 18h 빨강 |
| T2-11 | 어드민 액션 4종 | 삭제·정지·추방·기각 모두 동작 |
| T2-12 | 인앱 「고객센터·문의」 | 카드 3종 + 신고 폼 |

### 4.3 Citation (T3)

| # | 시나리오 | 기대 결과 |
|---|---|---|
| T3-1 | 심리 교육 카드 진입 | 하단 출처 섹션 노출 |
| T3-2 | 자가검사 PHQ-9 결과 | Kroenke 2001 인용 + DOI 링크 클릭 |
| T3-3 | 마음 날씨 결과 | "AI 생성·진단 아님" 배너, "분석 방식" 진입 |
| T3-4 | HealingCard | "AI 생성" 배지 + 출처 |
| T3-5 | 어드민 출처 입력 | 4필드 + 다중 추가/삭제 |
| T3-6 | 출처 외부 링크 | 인앱 브라우저 또는 외부 브라우저 |

## 5. 트러블슈팅

### 5.1 빌드 실패 — `expo-apple-authentication` 미설치

```
Error: Cannot find module 'expo-apple-authentication'
```

→ `cd expo-app && npm install expo-apple-authentication` 후 재빌드

### 5.2 빌드 실패 — Provisioning Profile

```
error: No matching profiles found
```

→ `eas credentials -p ios` 로 프로비저닝 갱신

### 5.3 SIWA 인증 실패 — `ASAuthorizationErrorUnknown`

→ ASC Capability "Sign In with Apple" 체크 누락
→ Apple Developer 페이지에서 체크 후 EAS 빌드 재실행

### 5.4 빌드 실패 — `pod install` 에러

→ Expo 54 + RN 0.81 호환 라이브러리 버전 사용 필수
→ `expo-apple-authentication` 의 SDK 54 호환 버전이 자동 설치되는지 확인:
```bash
npx expo install expo-apple-authentication
```

### 5.5 ASC 업로드 실패 — version 충돌

```
error: Version 1.0.6 already exists
```

→ ASC 에 1.0.6 가 이미 등록되어 있음. ASC > Version 1.0.6 삭제 후 재시도 또는 1.0.7 로 올림.

### 5.6 `autoIncrement` 가 작동 안 함

```
error: Build 8 already exists
```

→ ASC 에 동일 buildNumber 가 이미 처리됨. EAS 가 자동으로 9 → 10 으로 올림. 한 번 더 시도.

## 6. 롤백 (재거절 시)

거절 사유에 따라 분기:

- **빌드 자체가 reject** → develop 으로 다시 핫픽스 → 1.0.7 / build 10 재빌드
- **메타데이터 reject** (Description 등) → ASC 메타만 수정, 새 빌드 불필요
- **Resolution Center 추가 요구** → 답신 메시지 보강 + 영상 첨부

`feature/apple-rejection-1.0.6` 브랜치는 PR 머지 전까지 유지. 머지된 후 main 푸시·태그.

## 7. 운영 반영 (참고)

iOS 빌드만 변경되는 트랙 (T1) 은 백엔드 변경이 거의 없으므로 운영 반영 영향 적음.

T2 (UGC) 와 T3 (Citation) 은 백엔드 + DB 마이그레이션 포함 → 운영 반영 필수:
- `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md` 게이트 통과
- 하드코딩 검사 (CI/BI) 통과
- `core-deployer` 위임으로 main 머지·운영 배포

> ASC 는 운영 백엔드를 호출 → 운영 배포가 ASC 검수 시작 전에 완료되어야 함.

## 8. 다음 액션

1. **D+1**: 사용량 리셋 후 코더 트랙 위임 (T1·T2·T3)
2. **D+1~D+4**: 코더 구현 + PR
3. **D+5**: Tester 검증 (위 §4 시나리오)
4. **D+5**: ASC 메타 변경 (사용자)
5. **D+5**: 백엔드 운영 배포 (T2·T3 영향)
6. **D+6**: EAS iOS 빌드 (위 §2)
7. **D+6**: ASC 업로드 + 검수 제출 + Resolution Center 답신
8. **D+7~D+9**: Apple 응답 대기

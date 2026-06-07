# Apple App Store 거절 대응 — Plan A 오케스트레이션 (2026-06-04)

> **Submission**: ce38fb9a-ced4-4957-b606-21618ff23518 · iOS 1.0.5 / build 8 · Review Device: iPad Air 11" M3 · Review date: 2026-06-04
> **Plan**: A (전면 대응, 커뮤니티 유지) · 5~7 영업일 예상
> **목표 빌드**: 1.0.6 / buildNumber 9 (재제출용)

## 0. 거절 요약 + Plan A 결정

| Guideline | 사유 | 핵심 GAP |
|---|---|---|
| 4.8 Login Services | 카카오·네이버 외 (이름·이메일만 수집 + 이메일 비공개 + 광고 무수집) 동등 옵션 부재 | Sign in with Apple 정식 추가 + Apple 가입 경로 phone 필수 완화 |
| 1.2 User Generated Content | 익명 커뮤니티 안전장치 8개 중 6개 부재 | 18+ / EULA / 자동필터 / 신고UI / 차단 / 본인삭제 / 24h SLA / 인앱 연락처 |
| 1.4.1 Medical Citations | 의료/건강 콘텐츠 출처 미표기 | source 필드 + 어드민 폼 + 프론트 표시 |

**Plan A 결정 근거**: (a) 한국 사용자에게 커뮤니티는 가치 핵심, (b) 후기·1:1 메시지도 UGC 해석 여지가 있어 우회만으로는 잠재 재거절 리스크 잔존, (c) 안전장치는 어차피 운영 단계에서 필요한 자산이라 한 번에 정리.

## 1. 트랙 분해

### T1 — Sign in with Apple (4.8)
- 백엔드: `AppleOAuth2ServiceImpl` 의 client_secret JWT(ES256) 생성 + Apple ID 토큰 JWKS 검증 실구현, `OAuth2FactoryService` 에 빈 등록, `OAuth2Controller`/`SocialAuthServiceImpl` APPLE 분기 추가
- 프론트(expo-app): `expo-apple-authentication` 의존성 + `app.config.ts` plugin/`usesAppleSignIn`/entitlement, `login.tsx` Apple 버튼 (iOS 한정, HIG 준수), `AuthService.ts` `SocialAuthProvider` 에 APPLE + `loginWithApple()`
- 가입 정책: Apple 경로만 phone 필수 완화 (이름·이메일만 수집해도 가입 완료) → `social-signup.tsx` 분기 + `SocialSignupRequest`/`AuthController` validate 완화
- 운영/설정: `application-*.yml`, dev/prod env — `APPLE_CLIENT_ID`(Service ID), `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`(.p8) 주입
- Apple Developer Console: App ID 에 SIWA capability, Service ID, Key(.p8), Return URL, provisioning profile 재발급

### T2 — UGC 안전장치 (1.2) — 8개 항목
1. **18+ 연령 등급**: ASC 메타 17+/18+ 변경 + `app.config.ts` infoPlist 보강 + 가입 시 birthDate 필수화 + `CommunityService` 게시/댓글 진입 전 age >= 19 백엔드 게이트
2. **EULA 강화**: Apple 표준 EULA 채택 또는 자체 약관에 (a) objectionable content 무관용 (b) 24h 처리 (c) abusive user 추방 명시 + 가입 동의 단계
3. **자동 콘텐츠 필터**: 금칙어 사전(욕설/혐오/외설) 백엔드 검사 → `CommunityServiceImpl.createPost`/`addComment` 매칭 시 자동 차단/PENDING+flag
4. **신고 UI 와이어업**: 백엔드 `POST /api/v1/community/{postId}/reports` 이미 존재. Expo `community/[id].tsx` 신고 버튼+모달 + `useCreateCommunityReport` 훅 / 웹 `CommunityFeed.js:146-152` 토스트→API 호출 교체
5. **사용자 차단(Block)**: `community_user_blocks(tenantId, blocker_user_id, blocked_user_id)` 신규 테이블+엔티티+API+UI. 차단자 게시/댓글 비노출 필터
6. **본인 게시물 즉시 삭제**: 백엔드 DELETE 동작 ✅. Expo/웹 작성자 본인일 때 "삭제" 액션 노출
7. **24h SLA 큐**: `CommunityReport` 에 `status`(OPEN/UNDER_REVIEW/RESOLVED/REJECTED), `resolved_at`, `resolved_by` 컬럼 + 어드민 신고 처리 큐 화면 + `docs/standards/UGC_MODERATION_SLA.md` 운영 문서
8. **앱 내 연락처/신고 채널**: `(client)/(more)/index.tsx`, `MoreAccountSettings.tsx` 에 "고객센터·문의" 메뉴 + 인앱 신고 폼 또는 mailto/이메일/카톡 연동

### T3 — 의료 출처 (1.4.1)
- 엔티티: `PsychoEducationArticle`, `HealingContentCatalogItem`, `DailyHealingContent`, `SelfAssessmentTemplate` 에 `source_label`, `source_url`, `source_author`, `source_published_year` 추가
- DTO: `*UpsertRequest`, `*Response`, `*AdminItem` 에 동일 필드
- 어드민: `AdminContentMasterPage.js` `emptyPsychoForm`/`emptyHealingForm` + 입력 폼 + `buildPsychoPayload`/`buildHealingPayload` 매핑
- 프론트 표시: `psycho-education/[id].tsx` 카드뉴스 마지막 페이지 또는 하단 "출처" 섹션 / `meditation/[id].tsx` 트랙 메타 / `self-assessment/{take,result}` PHQ-9·GAD-7·PSS 원저작 인용 / `mind-weather/index.tsx` "AI 생성·진단 아님" 배너 + 모델 출처
- 표준 인용: PHQ-9 (Kroenke et al., 2001 / Pfizer license), GAD-7 (Spitzer et al., 2006), PSS (Cohen et al., 1983), WHO/APA 가이드라인, NVC

## 2. 트랙별 서브에이전트 매핑

| 트랙 | core-designer | core-coder | core-tester | core-publisher (선택) |
|---|---|---|---|---|
| T1 SIWA | Apple HIG 버튼 시안·플로우, 가입 분기 와이어 | 백엔드 ES256/JWKS + 프론트 expo-apple-authentication + Apple Console 핸드오프 | E2E·회귀 (Apple 가입/로그인/relay 이메일/탈퇴) | (해당 없음) |
| T2 UGC | 신고/차단/연락처 UX 시안, 신고 모달, 본인삭제 액션, 18+ 게이트 카피 | Block 신규 + 신고UI 와이어업 + 자동필터 + SLA 큐 + EULA + 18+ 검증 | 신고/차단 동작·SLA 카운트·필터 회귀 | 약관 마크업 |
| T3 의료 출처 | 출처 노출 위치·UX (카드 하단/상세 푸터/AI 배너) | 엔티티/DTO/Admin 폼/Wellness 표시 | 출처 입력→DB→노출 회귀 | (해당 없음) |

## 3. 의존성 그래프

```
[T1-Designer] ─┐
[T2-Designer] ─┤── (병렬, D+0.5~D+1)
[T3-Designer] ─┘
                │
                ▼
[T1-Coder]  [T2-Coder]  [T3-Coder]   (병렬, D+1~D+5)
   │            │            │
   ▼            ▼            ▼
[T1-Tester][T2-Tester][T3-Tester]    (병렬, D+5~D+6)
                │
                ▼
        [통합 빌드/제출]                (D+6~D+7)
```

## 4. D+0~D+7 일정

| Day | 활동 |
|---|---|
| D+0 (오늘) | 디자이너 3명 동시 위임, Apple Developer Console 설정 시작 |
| D+1 | 디자이너 시안 완료 → Coder 3명 동시 위임 시작 |
| D+2~D+4 | 트랙별 구현 진행, T2 가 가장 큼(2~3일) |
| D+5 | T1·T3 완료 → Tester 위임. T2 마무리 |
| D+6 | 전 트랙 회귀 통과 → 1.0.6 EAS iOS 빌드 (buildNumber 9) |
| D+7 | ASC 제출 + 어필 메시지 발송 |

## 5. 트랙별 Definition of Done

### T1 SIWA DoD
- [ ] iOS 시뮬·실기에서 Apple 버튼 → 가입/로그인 모두 성공
- [ ] Apple Private Relay 이메일 → 회원가입 정상 (휴대폰 미입력 가능)
- [ ] 백엔드 `AppleOAuth2ServiceImpl` JWKS 검증·sub/email/email_verified 추출 통합 테스트 통과
- [ ] `UserSocialAccount.provider="APPLE"` 저장·재로그인 정상
- [ ] 탈퇴/계정 삭제 시 Apple revoke 호출 (5.1.1(v) 지속)
- [ ] 하드코딩 게이트(§17) 통과

### T2 UGC DoD
- [ ] 게시/댓글 익명 게시 + 신고 → 어드민 큐에 노출 + 24h 내 처리 카운터
- [ ] 사용자 A 가 사용자 B 차단 → A 의 피드에서 B 의 게시·댓글 비노출
- [ ] 본인 게시물 삭제 즉시 피드 비노출
- [ ] 만 19세 미만 가입자 커뮤니티 글쓰기 차단
- [ ] EULA 동의 단계 + objectionable content 무관용 조항 노출
- [ ] 금칙어 매칭 시 게시 차단 또는 PENDING
- [ ] 인앱 "고객센터·문의" 메뉴에서 신고 채널 도달
- [ ] ASC 메타데이터 17+/18+ 등급 설정 완료

### T3 의료 출처 DoD
- [ ] 어드민에서 콘텐츠 출처 입력 가능
- [ ] 사용자 노출 화면에 출처 섹션 가시
- [ ] PHQ-9/GAD-7/PSS 원저작 인용 노출
- [ ] 마음 날씨에 "AI 생성·진단 아님" 정적 배너 + 모델 출처
- [ ] HealingCard `dangerouslySetInnerHTML` 영역에도 출처 표기

## 6. 운영 반영 게이트 (필수 인용)

위임 프롬프트마다 다음 문서 5~10줄 요약 + 경로를 첨부할 것:
- `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md` — 위임 순서, 직접 수정 금지, 테스터 게이트
- `docs/project-management/COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md` — React #130, safeDisplay, 표시 경계
- `docs/project-management/EXPO_APP_METRO_ALIAS_AND_MMKV_HANDOFF.md` §5 체크리스트 — Metro/MMKV 작업 시 완료조건
- `docs/project-management/ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md` §17 — 하드코딩 게이트 (운영 반영 전 검사·치환)
- `docs/project-management/SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md` §1.3 — 동일 하드코딩 정책
- `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md` — 운영 반영 전 게이트

## 7. 서브에이전트 위임 프롬프트 초안 (복사하여 즉시 사용)

각 프롬프트는 메인 어시스턴트가 Task 도구로 띄울 때 그대로 복사해 사용합니다. **모든 위임 프롬프트는 코드 직접 수정·DB 마이그레이션 금지 정책을 반드시 명시하지는 않으며**, core-coder 트랙은 실제 구현을 수행합니다(트랙 정책: designer는 시안만, coder는 구현, tester는 검증).

### T1-Designer (core-designer)
> Apple App Store 4.8 거절 대응. iOS 한정 Sign in with Apple 추가를 위한 UX/디자인 시안만 작성. 코드 수정 금지. 산출물: (a) 로그인 화면 Apple 버튼 위치/색/라벨 (Apple HIG 준수: black/white/whiteOutline, "Apple로 계속하기" 한국어 라벨), (b) Apple 가입 분기 — Apple 은 첫 로그인에만 이름/이메일 제공·이메일 private relay 가능 → 휴대폰 필수 완화, (c) 가입 폼 분기 와이어, (d) 디자인 토큰·스타일 핸드오프. 참고 인벤토리: `expo-app/app/(auth)/login.tsx:88-503`, `social-signup.tsx:194-451`. 출력 파일: `docs/project-management/2026-06-04/APPLE_T1_SIWA_DESIGN_HANDOFF.md`.

### T1-Coder (core-coder)
> Apple App Store 4.8 거절 대응. T1-Designer 산출물(`docs/project-management/2026-06-04/APPLE_T1_SIWA_DESIGN_HANDOFF.md`) 기반으로 Sign in with Apple 정식 구현. 작업 범위: (1) 백엔드 `AppleOAuth2ServiceImpl` 의 client_secret JWT(ES256) 생성 + Apple ID 토큰 JWKS 검증·sub/email/email_verified 추출 실구현 (`src/main/java/com/coresolution/consultation/service/impl/AppleOAuth2ServiceImpl.java:1-178` 더미 교체), (2) `OAuth2FactoryService.java:29-53` 에 Apple 빈 등록 + `getServicesStatus()` `isAppleSupported` 노출, (3) `OAuth2Controller`/`SocialAuthServiceImpl`/`AbstractOAuth2Service` "APPLE" 분기 추가, (4) `entity/UserSocialAccount.java:69` 주석 갱신, (5) Apple 가입 경로만 `RegisterRequest`/`SocialSignupRequest`/`AuthController.java:329-369` phone 필수 완화, (6) `expo-app/package.json` `expo-apple-authentication` 추가, (7) `app.config.ts` plugin/`usesAppleSignIn`/entitlement, (8) `login.tsx` iOS 한정 Apple 버튼 + `handleAppleLogin`, (9) `AuthService.ts` `SocialAuthProvider` 에 `'APPLE'` + `loginWithApple()`, (10) `social-signup.tsx` APPLE 분기 (휴대폰 선택). 운영 변수: `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` 핸드오프 문서로 별도 정리. 필수 참조: `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md`, `docs/project-management/EXPO_APP_METRO_ALIAS_AND_MMKV_HANDOFF.md` §5, `ADMIN_LNB ... §17` 하드코딩 게이트, 표시 경계 문서. 완료 조건: T1 DoD 8개 모두 충족.

### T1-Tester (core-tester)
> T1 SIWA 회귀·E2E 검증. (a) `AppleOAuth2ServiceImplJwksVerifyTest` — Apple JWK Set 모킹·sub 추출 단위, (b) `OAuth2ControllerSocialLoginAppleSignupTest` — Apple `requiresSignup` 분기, (c) `OAuth2ControllerSocialLoginAppleLoginTest` — 기존 사용자 재로그인 path, (d) Expo Detox/E2E — Apple 버튼 → 가입 → 메인 진입, (e) Apple Private Relay 이메일 → 회원가입 통과, (f) 탈퇴 시 Apple revoke 호출. iOS 시뮬레이터 환경 변수 필요. 회귀: 카카오·네이버 가입 영향 없음.

### T2-Designer (core-designer)
> Apple App Store 1.2 거절 대응. UGC 안전장치 8개의 UX 시안. 코드 수정 금지. 산출물: (a) 게시 상세 더보기 메뉴(신고/차단/본인삭제), (b) 신고 모달 (사유 5~6종 + 상세 메모 + 제출), (c) 차단 확인 모달 + 차단 목록 화면, (d) 18+ 가입 게이트 카피 + 만 19세 미만 진입 차단 화면, (e) EULA 동의 단계 (가입 시 별도 체크 + 무관용/24h/추방 명시), (f) 어드민 신고 처리 큐 (PENDING/UNDER_REVIEW/RESOLVED/REJECTED 상태별 카드 + SLA 타이머), (g) "고객센터·문의" 메뉴 위치(`(client)/(more)/index.tsx`, `MoreAccountSettings.tsx`) + 인앱 신고 폼. 참고 인벤토리: 위 §T2 GAP 표. 출력 파일: `docs/project-management/2026-06-04/APPLE_T2_UGC_DESIGN_HANDOFF.md`.

### T2-Coder (core-coder)
> Apple App Store 1.2 거절 대응. T2-Designer 산출물 기반 UGC 안전장치 8종 구현. 작업 범위: (1) **사용자 차단** — `community_user_blocks` 마이그레이션 + `UserBlock` 엔티티 + `UserBlockRepository`/`Service` + `POST/DELETE /api/v1/users/{id}/block` + Expo/웹 UI + 피드/댓글 쿼리에 차단 필터; (2) **신고 UI 와이어업** — Expo `community/[id].tsx` 신고 모달 + `expo-app/src/services/communityApi.ts:122-127` `createRemoteCommunityReport` 호출, 웹 `CommunityFeed.js:146-152` 토스트→`StandardizedApi.post` 교체; (3) **본인 게시물 삭제 UI** — Expo/웹에 작성자 본인 액션; (4) **18+ 게이트** — `RegisterRequest`/`SocialSignupRequest` birthDate 필수 + age >= 19 검증 + `CommunityServiceImpl.createPost`/`addComment` 게이트; (5) **EULA** — `terms.json` 무관용/24h/추방 조항 추가 + 가입 동의 체크 단계; (6) **자동 콘텐츠 필터** — `BadWordsFilter` 신설 (사전 + 정규식) → `CommunityServiceImpl` 매칭 시 자동 REJECTED 또는 PENDING+flag (게시·댓글 양쪽); (7) **24h SLA** — `CommunityReport` 에 `status`, `resolved_at`, `resolved_by`, `priority` 컬럼 + 어드민 신고 큐 컨트롤러/서비스/페이지; (8) **인앱 연락처** — `(client)/(more)/index.tsx` "고객센터·문의" 메뉴 + 신고 폼 또는 mailto/카톡 연동. 추가 정책 문서: `docs/standards/UGC_MODERATION_SLA.md` 신설. 필수 참조: 표시 경계 문서·하드코딩 게이트·EXPO METRO §5. 완료 조건: T2 DoD 8개.

### T2-Tester (core-tester)
> T2 UGC 회귀·E2E. (a) `CommunityReportSlaServiceTest` — 24h 카운트, (b) `UserBlockServiceTest` + `CommunityFeedQueryBlockFilterTest` — 차단 사용자 비노출, (c) `CommunityServiceImplBadWordsFilterTest` — 금칙어 자동 차단, (d) `RegisterRequestAge18GateTest` — 19세 미만 거절, (e) Expo/웹 E2E — 신고→어드민 큐→처리, (f) 본인 게시물 삭제 즉시 비노출, (g) 어드민 신고 큐 SLA 타이머. 회귀: 기존 게시·댓글·승인 워크플로 영향 없음.

### T3-Designer (core-designer)
> Apple 1.4.1 의료 출처 표기 UX. 코드 수정 금지. 산출물: (a) 콘텐츠 카드/상세 하단 "출처" 섹션 (라벨·저자·연도·외부 링크), (b) 자가검사 결과 화면의 PHQ-9/GAD-7/PSS 원저작 인용 위치, (c) 마음 날씨 "AI 생성·진단 아님" 정적 배너 + 모델/방법론 링크, (d) HealingCard 의 출처+AI 생성 표시, (e) 어드민 콘텐츠 입력 폼 출처 4필드 위치. 참고 인벤토리: 위 §T3 GAP. 출력 파일: `docs/project-management/2026-06-04/APPLE_T3_CITATION_DESIGN_HANDOFF.md`.

### T3-Coder (core-coder)
> Apple 1.4.1 의료 출처 구현. T3-Designer 산출물 기반. 작업 범위: (1) 엔티티 — `PsychoEducationArticle`, `HealingContentCatalogItem`, `DailyHealingContent`, `SelfAssessmentTemplate` 에 `source_label`, `source_url`, `source_author`, `source_published_year` 추가 + Flyway 마이그레이션; (2) DTO — `*UpsertRequest`, `*Response`, `*AdminItem` 동기화; (3) 어드민 — `AdminContentMasterPage.js:76-98, 181-238, 623-886` `emptyPsychoForm`/`emptyHealingForm` + 입력 폼 + `buildPsychoPayload`/`buildHealingPayload`; (4) Expo Wellness — `psycho-education/[id].tsx`, `meditation/[id].tsx`, `self-assessment/{take/[type],result/[id]}.tsx`, `mind-weather/index.tsx` 출처 섹션·AI 배너; (5) 웹 — `wellness/PsychoEducation.js`, `MeditationGuide.js`, `common/HealingCard.js` 출처 표시; (6) 자가검사 표준 인용 (PHQ-9 Kroenke 2001 / Pfizer license, GAD-7 Spitzer 2006, PSS Cohen 1983) seed 데이터 — `psychoEducationData.ts`/`meditationData.ts`/`assessmentQuestions.ts` 폴백 데이터에도 source 필드 추가. 필수 참조: 하드코딩 게이트·표시 경계. 완료 조건: T3 DoD 5개.

### T3-Tester (core-tester)
> T3 회귀. (a) 어드민에서 출처 입력→DB→사용자 노출 E2E, (b) 출처 미입력 시 면책만 노출하는 안전 폴백, (c) `PsychAiServiceImpl` LLM 출력 가드 회귀 (`FORBIDDEN_PATTERNS`), (d) HealingCard `dangerouslySetInnerHTML` + 출처 영역 XSS 방어, (e) 자가검사 결과 페이지 PHQ-9/GAD-7/PSS 원저작 링크 노출. 회귀: 기존 콘텐츠 마스터 입력 흐름 영향 없음.

## 8. iOS 빌드·ASC 제출·어필 메시지

### 8-1. EAS 빌드 (1.0.6 / buildNumber 9)
\`\`\`bash
cd expo-app
# version bump
node -e "let p=require('./app.config.ts');" 2>/dev/null # 또는 app.config.ts 의 version, ios.buildNumber 직접 수정 (1.0.6 / 9)
eas build -p ios --profile production --non-interactive 2>&1 | tee /tmp/eas-ios-1.0.6.log
# 빌드 완료 후
eas submit -p ios --latest --non-interactive
\`\`\`
> ASC 메타데이터: 연령 등급 17+/18+, 데모 계정(staff/client/consultant) 비번 갱신 확인, "What's new" 에 변경 요약 (SIWA 추가, UGC 안전장치 보강, 의료 콘텐츠 출처 표기) 입력.

### 8-2. ASC 어필 메시지 (영문 초안, App Review Reply)

\`\`\`
Hello App Review Team,

Thank you for your detailed feedback on submission ce38fb9a-ced4-4957-b606-21618ff23518.
We have addressed all three guideline issues in build 1.0.6 (build 9) and are resubmitting today.

Guideline 4.8 — Login Services
We have added Sign in with Apple as an equivalent login option, available on the
login screen for iOS users. The Apple sign-up flow only collects the user's name
and email (with full support for Apple's Private Relay), and we do not require
phone number for Apple-based registration. Existing Kakao and Naver options
remain available. We do not use any advertising or tracking SDKs (no AdMob, no
Facebook Audience Network, no AppsFlyer/Branch, no Firebase Analytics). The
Google Services file referenced in app.config.ts is used solely for FCM push
notifications.

Guideline 1.2 — User Generated Content
We have implemented the following safeguards for community posts and comments:
1. Age rating updated to 17+/18+ in App Store Connect.
2. Updated EULA with explicit zero-tolerance for objectionable content,
   24-hour content removal commitment, and abusive-user ejection. Acceptance
   is required during sign-up.
3. Automated bad-words filter applied at post and comment creation.
4. Report flow is now wired end-to-end (UI button on every post/comment →
   admin moderation queue with SLA tracker).
5. User block: any user can block another user; blocked users' posts and
   comments are filtered from the blocker's feed immediately.
6. Self-delete: authors can immediately remove their own posts and comments.
7. Admin moderation queue tracks status (OPEN/UNDER_REVIEW/RESOLVED/REJECTED)
   with a 24-hour SLA timer; admins remove offending content and eject
   abusive users within the SLA.
8. In-app contact channel: a "Help & Contact" entry has been added to the
   client and consultant menus, with a built-in report form and direct
   email/messaging fallback.

Guideline 1.4.1 — Medical Information Citations
We have added source citations to all health-related content in the app:
- Psychoeducation articles, meditation guides, and healing cards now display
  source labels, authors, publication years, and external links.
- The self-assessment results screen cites the original instruments
  (PHQ-9: Kroenke et al., 2001 / Pfizer license; GAD-7: Spitzer et al., 2006;
  PSS: Cohen et al., 1983) with links to authoritative sources.
- AI-generated content (Mind Weather) shows a persistent "AI generated, not
  a medical diagnosis" banner with a link describing the model and methodology.

We appreciate your time and look forward to the review.

Sincerely,
MindGarden Team
\`\`\`

## 9. 리스크·롤백

| 리스크 | 완화 |
|---|---|
| Apple Console 설정 누락 | T1-Coder 위임에 Apple Developer Console 체크리스트 포함 (Service ID/Key/Return URL/Profile) |
| ES256 client_secret JWT 만료 | 6개월 자동 갱신 cron + 만료 모니터링 알림 |
| Private Relay 이메일 가입자 추후 변경 | Apple 정책 변경 모니터링 + 이메일 변경 hook |
| 차단 기능 멀티테넌트 격리 누락 | tenantId 컬럼·인덱스 + `MultiTenantTest` 추가 |
| 금칙어 사전 한국어 누락 | 초기 사전 + 사용자 신고 기반 점진 확장 운영 정책 |
| 18+ 게이트로 기존 사용자 잠김 | 마이그레이션 시 기존 사용자 birthDate 미입력자 grace period (다음 가입 갱신 시 입력 강제) |
| 1.0.6 빌드 또 다른 사유 거절 | TestFlight 내부 베타로 24h 운영 후 제출 권장 |

롤백: 1.0.6 거절 시 1.0.5 가 살아 있는 것이 아니므로(이미 거절), 1.0.7 cycle 로 즉시 보강. 백엔드 변경은 Phase별 Flyway 마이그레이션 + feature flag(`COMMUNITY_BLOCK_ENABLED`, `SIWA_ENABLED`)로 토글 가능하도록 핸드오프 권장.

## 10. 후속 백로그 (1.0.6 이후)

- **P1-1** `app.config.ts` iOS `LSApplicationQueriesSchemes` 명시 등록
- **P2-1** `SocialAuthServiceImpl.createUserFromSocial` `User.builder()` nickname 필드 추가
- 회귀 테스트: `OAuth2ControllerSocialLoginSignupNullSafeTest`, `AuthControllerConfirmDuplicateLoginTokenResponseTest`
- AI 모더레이션 (OpenAI Moderation API) 점진 도입 — 1.0.7~1.0.8
- 신고 사유에 "Sexual content"/"Child safety" 카테고리 추가 — 1.0.7
- Apple 표준 EULA 채택 vs 자체 EULA 유지 법무 결정

---

> **다음 액션 (메인 어시스턴트가 즉시 실행 가능)**
> 1. T1-Designer + T2-Designer + T3-Designer **3개 동시 위임** (병렬, gemini-3.1-pro 모델 권장)
> 2. 사용자에게 Apple Developer Console 작업 가이드 별도 안내
> 3. 디자이너 산출물 도착 후 T1/T2/T3 Coder 위임

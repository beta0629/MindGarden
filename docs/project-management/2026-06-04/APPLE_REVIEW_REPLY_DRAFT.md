# Apple App Review 답신 초안 — Submission ce38fb9a (1.0.6 / build 9)

> **작성일**: 2026-06-05
> **대상**: Apple App Review Team
> **빌드**: 1.0.6 / iOS build 9 (재제출 예정)
> **이전 거절 ID**: ce38fb9a-ced4-4957-b606-21618ff23518 (2026-06-04)
> **거절 가이드라인**: 4.8, 1.2, 1.4.1
> **선행 문서**: APPLE_REJECTION_PLAN_A_ORCHESTRATION_2026_06_04.md

본 문서는 ASC Resolution Center 회신용 메시지 영문/한글 초안. 빌드 1.0.6 / build 9 업로드 완료 후 ASC 에서 "Reply" 클릭하여 아래 영문 메시지를 그대로 또는 일부 보정해 사용한다.

---

## English Version (Primary — paste this into ASC)

Hello App Review Team,

Thank you for your feedback on submission `ce38fb9a-ced4-4957-b606-21618ff23518` (version 1.0 build 5). We have addressed all three issues in build 9 (version 1.0.6). Details below.

### Guideline 4.8 — Login Services (Sign in with Apple)

We have added **Sign in with Apple** as an equivalent login option on iOS. It is implemented using the official `expo-apple-authentication` library and meets all 4.8 requirements:

1. **Limited data collection** — We only collect the user's name and email address provided by Apple at the time of first authentication. No additional PII is requested.
2. **Email privacy** — We fully support Apple's Hide My Email feature. Users who choose to keep their email private receive all our service emails through Apple's private relay (`@privaterelay.appleid.com`), which we store as their primary email without modification.
3. **No advertising tracking** — We do not collect user interactions for advertising purposes. We have no advertising SDK, no behavioral tracking, no IDFA usage.

To make Sign in with Apple a true equivalent option, we have also relaxed our previous requirement that all signups include a phone number. Apple-based signups can now skip the phone field, while users may add a phone number later from the Profile screen if they wish to receive SMS notifications.

The Apple sign-in button appears on the login screen below the existing Kakao and Naver buttons, on iOS only, following Apple HIG (system-tinted button, "Apple로 계속하기" label, dynamic light/dark variants).

### Guideline 1.2 — User Generated Content

The app's community feature allows anonymous posts. We have implemented all eight precautions you outlined:

1. **18+ age rating** — Updated the App Store age rating to 17+/18+ in App Information. Signup now requires date of birth, and users under 19 (Korean age) are blocked from creating an account. Existing users without a recorded birth date are prompted to provide one before they can access the community.
2. **EULA with no-tolerance terms** — Updated our Terms of Service (Article 7) to make it explicit that abusive, hateful, sexually explicit, defamatory, copyright-infringing, or self-harm-inciting content is not tolerated; that violations will be acted upon within 24 hours; and that repeat or malicious violators are permanently ejected. Users must accept this updated EULA at signup.
3. **Content filtering** — A keyword-based filter screens posts and comments at submission time. Posts that match prohibited terms are blocked client-side with a localized error message before they reach the server.
4. **Flagging mechanism** — Every post and comment carries a "Report" action accessible from the kebab menu. Users select one of six reasons (spam, abuse, sexual content, misinformation, copyright, other) and may add an optional 200-character note.
5. **User blocking** — Users can block any other user from the same kebab menu. Blocked users' posts and comments are filtered out of the blocker's feed. A "Blocked Users" screen under My Page lets users view and undo blocks at any time.
6. **Self-deletion** — The kebab menu on the user's own posts and comments includes a "Delete" action that removes the content immediately.
7. **24-hour moderation SLA** — Reports enter an admin queue with a visible 24-hour SLA timer (yellow at 12h, red at 18h). Admin actions include "Delete content," "Suspend user (7 days)," "Ban user (permanent)," and "Dismiss." We have published our internal SLA at `docs/standards/UGC_MODERATION_SLA.md`.
8. **In-app contact** — A new "Customer Support / Report" menu under My Page provides direct channels: a general-inquiry email, an in-app abuse-report form (with screenshot attachment), and an FAQ link. The same form is reachable from any community post.

### Guideline 1.4.1 — Medical Information Citations

All wellness content that references medical or psychological information now includes citations to peer-reviewed or authoritative sources, displayed prominently below the content body:

- **Self-assessment results (PHQ-9, GAD-7, PSS)** — Each result screen now cites the original validation paper:
  - PHQ-9: Kroenke K, Spitzer RL, Williams JBW. *J Gen Intern Med* 2001;16(9):606-613.
  - GAD-7: Spitzer RL, Kroenke K, Williams JBW, Löwe B. *Arch Intern Med* 2006;166(10):1092-1097.
  - PSS: Cohen S, Kamarck T, Mermelstein R. *J Health Soc Behav* 1983;24(4):385-396.
  Each citation includes a DOI link.
- **Psycho-education articles** — Each article now displays a "Sources" section with the source title, author/organization, year, and external link (e.g., WHO mhGAP, APA Clinical Practice Guidelines).
- **Meditation guides** — Same source-display pattern, citing peer-reviewed mindfulness research.
- **Mind Weather (AI-generated emotional analysis)** — A prominent banner now states "AI-generated, not a medical diagnosis" with a "How this analysis works" link explaining the model used (GPT-4o), input data, output limitations, and the WHO/APA guidelines that inform the prompt.
- **Daily Healing Card (AI-generated)** — Each card displays an "AI-generated" badge and links to its source where applicable.

The admin content management page now includes a four-field source input (label, URL, author, year) with the ability to add multiple sources per content item. Administrators must enter at least one source for new content; legacy items have been backfilled.

The disclaimer at the top of every wellness screen ("This is not a medical diagnosis. For clinical evaluation, consult a licensed mental health professional.") remains in place and is now reinforced by the inline citations.

---

We appreciate your guidance and would be happy to provide additional information or screencasts demonstrating any of these flows. Please let us know if you need anything else.

Best regards,
MindGarden Team
Core Solution Co., Ltd.

---

## 한글 버전 (사용자 검토용 — 그대로 영문 사용 권장)

안녕하세요 App Review Team,

`ce38fb9a-ced4-4957-b606-21618ff23518` (1.0 build 5) 거절에 대한 회신입니다. 지적하신 3가지 항목 모두 build 9 (1.0.6) 에서 대응했습니다.

### 4.8 — 로그인 서비스 (Sign in with Apple)

iOS 한정으로 **Sign in with Apple** 을 동등 옵션으로 추가했습니다. `expo-apple-authentication` 공식 라이브러리 사용. 4.8 의 모든 요구사항 충족:

1. **PII 수집 최소화** — 첫 인증 시점에 Apple 이 제공하는 이름·이메일만 수집. 그 외 추가 PII 없음.
2. **이메일 비공개** — Hide My Email 완전 지원. Private Relay 이메일(`@privaterelay.appleid.com`)을 정식 이메일로 그대로 저장. 모든 서비스 메일은 Apple 의 릴레이를 통해 사용자 실제 이메일로 전달됨.
3. **광고 추적 없음** — 광고 목적 행동 데이터 수집 안 함. 광고 SDK 없음. 행동 추적 없음. IDFA 사용 안 함.

Sign in with Apple 을 진정한 동등 옵션으로 만들기 위해 기존 "휴대폰 번호 필수" 요건을 Apple 가입 흐름에 한해 완화했습니다. Apple 가입 사용자는 휴대폰 입력을 건너뛸 수 있으며, 이후 마이페이지에서 추가 가능합니다.

Apple 버튼은 iOS 로그인 화면의 카카오·네이버 버튼 아래에 노출되며 Apple HIG 를 준수 (시스템 색상, "Apple로 계속하기" 라벨, 라이트/다크 자동 전환).

### 1.2 — 사용자 생성 콘텐츠

지적하신 8가지 안전장치 모두 구현:

1. **연령 등급 18+** — App Store 연령 등급 17+/18+로 갱신. 가입 시 생년월일 입력 필수, 만 19세 미만 차단. 기존 사용자 중 생년월일 미입력자는 입력 후에만 커뮤니티 진입 가능.
2. **무관용 EULA** — 이용약관 7조 강화: 모욕·혐오·음란·명예훼손·저작권 침해·자해 조장 콘텐츠 무관용, 신고 접수 시 24시간 내 처리, 반복·악의적 위반자 영구 추방. 가입 시 동의 단계.
3. **콘텐츠 필터링** — 게시·댓글 제출 시점에 금칙어 사전으로 자동 검사. 매칭 시 클라이언트에서 차단.
4. **신고 메커니즘** — 모든 게시·댓글에 케밥 메뉴로 "신고" 노출. 6가지 사유(스팸/욕설/음란/허위/저작권/기타) + 선택 메모 200자.
5. **사용자 차단** — 동일 케밥 메뉴에서 차단 가능. 차단된 사용자의 게시·댓글은 차단자 피드에서 비노출. 마이페이지의 "차단 목록" 화면에서 해제 가능.
6. **본인 게시물 즉시 삭제** — 작성자 본인의 케밥 메뉴에 "삭제" 액션 노출. 즉시 삭제.
7. **24시간 SLA** — 신고는 어드민 큐에 적재되며 24h 카운트다운 (12h 노랑, 18h 빨강). 어드민 액션: 콘텐츠 삭제 / 7일 정지 / 영구 추방 / 기각. 내부 SLA 표준은 `docs/standards/UGC_MODERATION_SLA.md`.
8. **앱내 연락처** — 마이페이지에 "고객센터·문의" 메뉴 신설. 일반 문의 이메일·앱내 신고 폼(스크린샷 첨부 가능)·FAQ 링크.

### 1.4.1 — 의료 정보 출처

모든 wellness 콘텐츠에 출처 인용 추가:

- **자가검사 결과 (PHQ-9/GAD-7/PSS)** — 결과 화면에 원전 인용 + DOI 링크
  - PHQ-9: Kroenke et al., 2001
  - GAD-7: Spitzer et al., 2006
  - PSS: Cohen et al., 1983
- **심리 교육 / 명상 가이드** — 각 콘텐츠 하단에 "출처" 섹션 (제목·저자·연도·외부 링크)
- **마음 날씨 (AI 분석)** — "AI 생성·진단 아님" 배너 + "분석 방식 자세히" 화면 (사용 모델: GPT-4o, 입력 데이터, 한계, WHO/APA 가이드라인 출처)
- **오늘의 힐링 (AI)** — 카드마다 "AI 생성" 배지 + 출처 링크 (있을 시)

어드민 콘텐츠 입력 폼에 출처 4필드 (label/url/author/year) 추가. 다중 출처 추가 가능. 신규 콘텐츠는 1개 이상 출처 필수.

기존 면책("의학적 진단이 아닙니다, 자세한 진단은 전문가와 상담하세요") 도 모든 wellness 화면 상단에 그대로 유지.

---

추가 정보나 화면 녹화가 필요하시면 알려주세요.

감사합니다.
MindGarden Team
주식회사 코어솔루션

---

## 사용 가이드 (사용자용)

1. 빌드 1.0.6 / build 9 가 ASC 에 업로드 + 검수 제출 완료된 후 사용
2. ASC > My Apps > MindGarden > App Store > Version > **Resolution Center** 에서 "Reply" 클릭
3. 위 **English Version** 본문(`### 다음 단계 시작` 위까지) 그대로 붙여넣기
4. 필요 시 일부 문장 다듬기 (예: 회사명 변경, 답신 시각 표기 등)
5. 첨부 옵션 — 영상 스크린캐스트 (선택, 없어도 OK)
   - SIWA 첫 로그인 → 가입 → 메인 진입 (15초)
   - 커뮤니티 신고·차단·자삭 (30초)
   - 자가검사 결과 출처 인용 (10초)
6. 제출 후 평균 24~48시간 내 회신 (또는 통과 처리)

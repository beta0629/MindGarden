# ASC 메타데이터 변경 가이드 — 1.0.6 / build 9

> **작성일**: 2026-06-05
> **대상**: App Store Connect 메타데이터 (사용자 직접 수정)
> **빌드**: 1.0.6 / iOS build 9

이 문서의 모든 변경은 **사용자가 ASC 웹에서 직접 수정** 한다. 코드/빌드 변경 없음.

ASC 진입: https://appstoreconnect.apple.com → My Apps → MindGarden

## 1. App Information (앱 정보)

ASC > **App Information**

### 1.1 Localized App Information

#### 한국어 (ko)
| 필드 | 변경 후 |
|---|---|
| Name | `마인드가든` (그대로) |
| Subtitle | `마음 돌봄을 위한 라이프스타일 앱` (또는 기존 유지) |
| Privacy Policy URL | https://app.core-solution.co.kr/legal/privacy (또는 기존) — UGC 정책 추가 반영 필수 |

#### English (en-US)
| 필드 | 변경 후 |
|---|---|
| Name | `MindGarden` |
| Subtitle | `Lifestyle app for mindful self-care` |
| Privacy Policy URL | 동일 |

### 1.2 General Information

| 필드 | 변경 후 | 비고 |
|---|---|---|
| Bundle ID | `com.mindgarden.MindGardenMobile` | 그대로 |
| Primary Category | **Lifestyle** (이미 변경됨) | Health & Fitness 아님 |
| Secondary Category | (선택) Productivity | |
| Content Rights | "Does Not Use Third-Party Content" | 그대로 |

## 2. Age Rating (연령 등급)

ASC > **App Information** > Age Rating > **Edit**

### 2.1 변경 사유

Apple 1.2 — UGC 익명 게시 가능 앱은 18+ 연령 등급 필수.

### 2.2 카테고리별 응답 변경

기존 응답을 다음으로 갱신:

| 카테고리 | 응답 |
|---|---|
| Cartoon or Fantasy Violence | None |
| Realistic Violence | None |
| Sexual Content or Nudity | None |
| Profanity or Crude Humor | None |
| Mature/Suggestive Themes | **Infrequent/Mild** |
| Horror/Fear Themes | None |
| Medical/Treatment Information | **Infrequent/Mild** (의료 가이드 포함) |
| Alcohol, Tobacco, Drug Use | None |
| Simulated Gambling | None |
| **Unrestricted Web Access** | **No** |
| Gambling | No |
| **Contests** | No |
| **User Generated Content** | **Yes** ★ 추가 |

> **User Generated Content = Yes** 가 핵심. Yes 로 두면 자동으로 17+ 또는 18+로 등급 조정됨.

### 2.3 결과 확인

저장 후 Age Rating 자동 계산 → **17+** (Apple 시스템 표기) 또는 **18+** (한국 등급).

→ 한국 표기는 17+ 도 18+ 로 표시됨. App Review 답신에 "Updated to 17+/18+" 명시.

## 3. App Privacy (앱 개인정보)

ASC > **App Privacy** > **Edit**

### 3.1 추가할 데이터 유형

기존 항목 유지 + 다음 추가:

| 카테고리 | 데이터 유형 | 사용 목적 | 사용자와 연결 | 추적 용도 |
|---|---|---|---|---|
| **Identifiers** | User ID | App Functionality (Apple `sub`) | Yes | No |
| Contact Info | Email Address (이미 있음) | App Functionality | Yes | No |

### 3.2 Privacy Choices (개인정보 선택)

> Apple `sub` 는 광고 추적 비목적 — "Used for Tracking: No" 명시.

### 3.3 Privacy Policy 페이지 갱신 (별도 작업)

`https://app.core-solution.co.kr/legal/privacy` 또는 동등 페이지에 다음 섹션 추가/갱신:

#### 추가 섹션 1 — Apple `sub` 처리

```
□ Apple 로그인 시 수집되는 식별자

마인드가든은 Sign in with Apple 사용자에게 Apple 이 발급하는
영구 사용자 식별자 (sub) 를 수집·저장합니다.

- 수집 목적: 동일 사용자 식별 (재로그인 시 동일 계정 매칭)
- 보관 기간: 회원 탈퇴 시까지
- 광고·마케팅 목적 사용: 없음
- 제3자 공유: 없음
```

#### 추가 섹션 2 — Apple Private Relay

```
□ Apple 비공개 이메일 (Hide My Email)

Apple 로그인 사용자가 비공개 이메일을 선택하면
@privaterelay.appleid.com 도메인의 익명 이메일이 발급됩니다.
마인드가든은 이 이메일을 정식 이메일로 저장하며,
모든 서비스 메일은 Apple 의 릴레이를 통해 사용자의 실제
이메일로 전달됩니다. 마인드가든은 사용자의 실제 이메일을
알 수 없습니다.
```

#### 추가 섹션 3 — UGC 정책 + SLA

```
□ 커뮤니티 콘텐츠 정책

마인드가든 커뮤니티는 사용자가 익명으로 게시할 수 있으며,
다음 안전장치를 운영합니다:

1. 만 19세 이상만 가입·이용 가능
2. 욕설·혐오·음란·자해 조장 콘텐츠 무관용 (즉시 삭제·이용 정지)
3. 신고 접수 시 24시간 내 처리
4. 사용자 차단·신고·본인 게시물 삭제 기능 제공
5. 반복·악의적 위반자 영구 추방
6. 형사 처벌 대상 위반은 수사기관 신고

상세 절차: docs/standards/UGC_MODERATION_SLA.md
문의: contact@coresolution.co.kr
```

#### 추가 섹션 4 — AI 생성 콘텐츠

```
□ AI 분석·생성 콘텐츠 안내

마인드가든의 「마음 날씨」 등 일부 화면은 AI (OpenAI GPT-4o) 를
사용하여 사용자가 입력한 데이터(감정 일기, 자가검사 결과)를
분석·해석합니다. 이는 의학적 진단이 아니며, 정신건강 전문가의
진료를 대체할 수 없습니다. 자세한 분석 방식은 앱 내 「분석 방식」
화면을 참조하세요.

마인드가든은 AI 분석을 위해 사용자 입력 데이터를 OpenAI 에
일시적으로 전송하나, OpenAI 의 모델 학습에는 사용되지 않습니다
(OpenAI Enterprise API 정책 적용).
```

## 4. App Description (한국어 + 영문)

ASC > **App Store** > Version 1.0.6 (또는 기존 1.0) > **Description**

### 4.1 한국어 (ko)

기존 Description 에 다음 단락 추가:

```
[추가 단락 — Description 끝부분에 삽입]

▮ 안전한 커뮤니티
- 만 19세 이상 회원 전용
- 신고·차단·본인 삭제 기능
- 24시간 내 신고 처리 (어드민 큐·SLA 운영)
- 무관용 정책 (욕설·혐오·음란 콘텐츠 즉시 삭제)
- 앱 내 「고객센터·문의」 항상 접근 가능

▮ 의학적 정보 출처
- 자가검사 (PHQ-9, GAD-7, PSS) 모두 학술 원전 인용
- 심리 교육·명상 가이드는 WHO·APA 가이드라인 출처 명시
- AI 분석은 사용 모델·한계 투명 공개
- 본 앱의 콘텐츠는 의학적 진단이 아님
```

### 4.2 English (en-US)

```
[Add to end of existing Description]

▮ Safe Community
- 18+ members only
- Report, block, and self-delete on every post
- 24-hour moderation SLA with admin review queue
- Zero tolerance for abuse, hate, or sexual content
- In-app "Customer Support" always accessible

▮ Medical Information with Citations
- Self-assessments (PHQ-9, GAD-7, PSS) cite original validation papers
- Psycho-education and meditation guides reference WHO/APA guidelines
- AI analysis discloses model used (GPT-4o), input data, and limitations
- Not a substitute for professional medical advice
```

## 5. What's New (1.0.6 변경 사항)

ASC > Version 1.0.6 > **What's New in This Version**

### 5.1 한국어

```
• Sign in with Apple 추가
• 커뮤니티 신고·차단·자삭 기능 추가
• 18세 이상 이용 정책 적용
• 자가검사·심리 교육 콘텐츠 출처 표시
• 「고객센터·문의」 메뉴 신설
• 안정성 개선
```

### 5.2 English

```
• Sign in with Apple added
• Community report, block, and self-delete added
• 18+ age policy
• Citations for self-assessments and wellness content
• New "Customer Support" menu
• Stability improvements
```

## 6. App Review Information

ASC > Version 1.0.6 > **App Review Information**

### 6.1 Sign-In Information (데모 계정)

기존 데모 계정 그대로 유지. 단, **Apple 로그인 데모를 위한 Apple ID 추가**:

| 필드 | 값 |
|---|---|
| Demo Account — Username (CLIENT) | (기존 값) |
| Demo Account — Password | (기존 값) |
| Apple Sign-In Demo | 검수자가 자신의 Apple ID 로 새 가입 가능 (별도 데모 Apple ID 불필요) |

### 6.2 Notes (검수자에게 메모)

```
This build (1.0.6 / build 9) addresses the previous rejection
ce38fb9a-ced4-4957-b606-21618ff23518 (Guidelines 4.8, 1.2, 1.4.1).

Sign in with Apple:
- Available on the login screen below Kakao/Naver buttons (iOS only).
- First Apple sign-in routes to a signup form (name and email pre-filled
  from Apple, phone number is OPTIONAL).
- Hide My Email is fully supported.

Community / UGC:
- New post reporting, user blocking, self-deletion all accessible from
  the kebab menu (⋯) on each post and comment.
- Customer Support menu under My Page → "고객센터·문의" provides
  in-app abuse reporting form.
- Admin moderation queue runs at our internal admin console (not
  reviewable by Apple, but documented in App Review reply).

Medical Citations:
- Every wellness card has a "Sources" section at the bottom.
- Self-assessment results show the original validation paper for
  PHQ-9, GAD-7, PSS with DOI links.
- Mind Weather (AI) shows a prominent "AI generated, not a medical
  diagnosis" banner with a "How this works" link.

Detailed reply available in Resolution Center.
```

### 6.3 Contact Information

기존 연락처 유지.

## 7. Localized Information (한국어/영어 별도 갱신)

| 위치 | 변경 |
|---|---|
| ASC > Version 1.0.6 > **Promotional Text** | 기존 유지 (선택) |
| ASC > Version 1.0.6 > **Keywords** | 기존 + `mindfulness, mental health, journaling, meditation, self-care` 보강 (선택) |
| ASC > Version 1.0.6 > **Support URL** | 기존 유지 |
| ASC > Version 1.0.6 > **Marketing URL** | 기존 유지 |

## 8. Screenshots

기존 스크린샷 유지. 단:
- 18+ 정책 반영 → 미성년 사용자 등장 스크린샷이 있으면 교체 (없으면 무시)
- SIWA 버튼 추가된 로그인 화면 스크린샷으로 1장 교체 (선택, 의무 아님)

## 9. 작업 순서 (사용자 권장 흐름)

1. (Day D+5 백엔드 운영 배포 후 - 또는 직전)
2. **App Information** > Age Rating Edit → UGC=Yes 저장
3. **App Privacy** > Identifiers — User ID 추가 + Privacy Policy URL 갱신
4. Privacy Policy 페이지 (별도 사이트) 의 4개 섹션 추가 (위 §3.3)
5. **Description** (한/영) 끝에 안전 커뮤니티 + 의학적 정보 단락 추가
6. **+ Version 1.0.6** 신규 생성
7. **What's New** 입력 (한/영)
8. **App Review Information** > Notes 입력 (위 §6.2)
9. (D+6 EAS 빌드 처리 완료 후)
10. **Build** 슬롯에 build 9 선택
11. **Submit for Review**
12. **Resolution Center** > 이전 거절 메시지에 답신 (`APPLE_REVIEW_REPLY_DRAFT.md`)

## 10. 주의

- ASC 메타 변경 후 **저장만 해도 새 검수가 시작되는 항목** 은 거의 없다 (Privacy 등 일부 제외). 그래도 빌드 9 제출 직전에 모두 저장.
- 1.0.5 (build 5/8) 가 이미 reject 된 상태이므로, 1.0.6 신규 버전 슬롯이 **활성** 인지 ASC 에서 확인.
- Privacy Policy URL 변경은 즉시 발효 → 변경 전에 페이지 내용 갱신 완료.

# Plan A 종합 마일스톤 · 체크리스트 — Apple 거절 1.0.6 / build 9

> **작성일**: 2026-06-05
> **이전 거절**: ASC Submission ID `ce38fb9a-ced4-4957-b606-21618ff23518` (2026-06-04)
> **거절 가이드라인**: 4.8 (Login Services), 1.2 (UGC), 1.4.1 (Medical Citations)
> **선행 문서**:
> - `docs/project-management/APPLE_REJECTION_PLAN_A_ORCHESTRATION_2026_06_04.md` — 작업 분해
> - `docs/project-management/2026-06-04/APPLE_T1_SIWA_DESIGN_HANDOFF.md`
> - `docs/project-management/2026-06-04/APPLE_T2_UGC_DESIGN_HANDOFF.md`
> - `docs/project-management/2026-06-04/APPLE_T3_CITATION_DESIGN_HANDOFF.md`
> - `docs/project-management/2026-06-04/APPLE_REVIEW_REPLY_DRAFT.md`

## 0. 한 줄 요약

| 항목 | 값 |
|---|---|
| 목표 빌드 | iOS 1.0.6 / build 9 |
| 예상 일정 | D+5 ~ D+7 (디자인 D+0 완료 → 구현 D+1~D+5 → 테스트 D+5~D+6 → 빌드·제출 D+6~D+7) |
| 주요 위험 | Apple JWKS 검증 / Private Relay 처리 / 18+ 게이트 기존 사용자 grace period |
| 검수 회신 평균 | 1~3 영업일 (재제출 시 첫 거절보다 빠름) |

## 1. 마일스톤 일정

| 일정 | 트랙 | 작업 | 담당 | 산출물 |
|---|---|---|---|---|
| **D+0** (2026-06-04) | 모두 | 인벤토리 + 거절 분석 | 메인 + explore | ✅ 인벤토리 §1~§3 완료 |
| **D+0** (2026-06-04) | 모두 | Plan A 오케스트레이션 문서 | 메인 (planner 사용량 소진) | ✅ `APPLE_REJECTION_PLAN_A_ORCHESTRATION_2026_06_04.md` |
| **D+0** (2026-06-05) | T1·T2·T3 | 디자인 핸드오프 3건 | 메인 (designer 사용량 소진) | ✅ T1·T2·T3 핸드오프 |
| **D+0** (2026-06-05) | 메타 | App Review 답신 초안 | 메인 | ✅ `APPLE_REVIEW_REPLY_DRAFT.md` |
| **D+1** (2026-06-05) | T1·T2·T3 | Coder 트랙 시작 (사용량 리셋 후) | core-coder × 3 | 코드 변경 |
| **D+2~D+4** | T1·T2·T3 | 구현 | core-coder × 3 | PR 3건 |
| **D+4** | 모두 | EAS 환경 변수 점검 + 1.0.6/build 9 사전 준비 | 메인 | 변수 표 |
| **D+5** | T1·T2·T3 | Tester 검증 게이트 | core-tester × 3 | 테스트 리포트 |
| **D+5** | 메타 | ASC 메타 변경 (Age 18+, Description, App Privacy) | 사용자 + 메인 가이드 | ASC 메타 갱신 |
| **D+6** | 빌드 | EAS iOS build 9 | 사용자 + EAS | IPA 업로드 |
| **D+6** | 제출 | ASC 검수 제출 + 답신 메시지 | 사용자 | 검수 진행 |
| **D+7~D+9** | 회신 | Apple 응답 대기 | — | 통과 또는 재거절 |

## 2. 트랙별 진행 체크리스트

### 2.1 T1 — Sign in with Apple (4.8)

#### 디자인 (D+0 완료) ✅
- [x] 핸드오프 문서: `docs/project-management/2026-06-04/APPLE_T1_SIWA_DESIGN_HANDOFF.md`
- [x] Apple HIG 준수 버튼 (black/white, 라벨, 위치, 크기)
- [x] Private Relay 이메일 처리 정책
- [x] 휴대폰 선택 완화 정책

#### 구현 (D+1~D+4)
- [ ] `expo-app/package.json` — `expo-apple-authentication` 추가
- [ ] `expo-app/app.config.ts` — `usesAppleSignIn: true` + plugin
- [ ] `expo-app/app/(auth)/login.tsx` — Apple 버튼 (Platform.OS === 'ios' 가드)
- [ ] `expo-app/src/services/AuthService.ts` — `signInWithApple()` 메서드
- [ ] `expo-app/app/(auth)/social-signup.tsx` — Apple 흐름에서 phone 선택
- [ ] `src/main/java/.../OAuth2Provider.java` — `APPLE` 추가
- [ ] `src/main/java/.../service/impl/AppleOAuth2ServiceImpl.java` — JWKS 검증 신규
- [ ] `src/main/java/.../OAuth2Controller.java` — Apple provider 분기
- [ ] `src/main/resources/db/migration/V20260605_xxx__make_users_phone_nullable.sql`
- [ ] 마이페이지 휴대폰 추가 배너 (`account/profile.tsx`)

#### 테스트 (D+5)
- [ ] iOS 시뮬레이터 + 실기 SIWA 첫 로그인 / 두 번째 로그인
- [ ] Private Relay 이메일 사용자 메일 발송 도달 (스토어 검수 시 데모 계정용)
- [ ] 휴대폰 미입력 가입 → 메인 진입 정상
- [ ] 마이페이지에서 휴대폰 추가 가능
- [ ] Android 빌드에 Apple 버튼 미노출

### 2.2 T2 — UGC 안전장치 (1.2)

#### 디자인 (D+0 완료) ✅
- [x] 핸드오프 문서: `docs/project-management/2026-06-04/APPLE_T2_UGC_DESIGN_HANDOFF.md`
- [x] 8개 안전장치 시안 모두 정의
- [x] EULA 7조 무관용 카피
- [x] 어드민 신고 큐 SLA 디자인

#### 구현 (D+1~D+5)

**Frontend (Expo)**
- [ ] `expo-app/app/(client)/(more)/community/[id].tsx` — 케밥 메뉴 (본인/타인 분기)
- [ ] `expo-app/src/components/molecules/CommunityReportModal.tsx` (신규) — 6사유 모달
- [ ] `expo-app/src/components/molecules/CommunityBlockModal.tsx` (신규) — 차단 확인
- [ ] `expo-app/app/(client)/(more)/blocked-users/index.tsx` (신규) — 차단 목록
- [ ] `expo-app/app/(client)/(more)/support/index.tsx` (신규) — 고객센터·문의
- [ ] `expo-app/app/(client)/(more)/support/report.tsx` (신규) — 인앱 신고 폼
- [ ] `expo-app/app/(client)/(more)/index.tsx` — 메뉴 추가 (차단·고객센터)
- [ ] `expo-app/app/(auth)/signup.tsx` — 생년월일 필수
- [ ] `expo-app/app/(auth)/social-signup.tsx` — 생년월일 prefill·필수
- [ ] `expo-app/app/(client)/_layout.tsx` 또는 적정 위치 — birthDate 미입력자 grace 모달

**Frontend (Web)**
- [ ] `frontend/src/components/community/CommunityFeed.js` — 케밥, 신고 API, 차단
- [ ] `frontend/src/components/admin/AdminCommunityReports.js` (신규) — 어드민 신고 큐
- [ ] `frontend/src/locales/ko/terms.json` — 제7조 강화 (무관용·24h·추방)
- [ ] `frontend/src/components/client/MoreAccountSettings.tsx` — 차단·고객센터 메뉴

**Backend**
- [ ] `src/main/java/.../entity/CommunityReport.java` — `status`, `resolved_at`, `resolved_by_admin_id`, `resolution_action`, `reason` enum 6 추가
- [ ] `src/main/java/.../entity/CommunityUserBlock.java` (신규)
- [ ] `src/main/java/.../service/impl/CommunityServiceImpl.java` — 금칙어 필터, 차단 필터, 18+ 게이트
- [ ] `src/main/java/.../service/impl/CommunityReportServiceImpl.java` (신규 또는 확장) — 어드민 처리
- [ ] `src/main/java/.../controller/CommunityController.java` — 차단 엔드포인트, 신고 사유 enum 확장
- [ ] `src/main/java/.../controller/AdminCommunityController.java` (신규) — 신고 큐 API
- [ ] `src/main/resources/db/migration/V20260605_xxx__community_safeguards.sql` — `community_user_blocks`, `community_reports.status`/`resolved_at`/`resolved_by`/`action`, `users.birth_date` 검증
- [ ] `src/main/resources/community/banned-words.txt` (신규) — 금칙어 사전
- [ ] `docs/standards/UGC_MODERATION_SLA.md` (신규) — 24h SLA·처리 절차

#### 테스트 (D+5)
- [ ] 케밥 메뉴 본인/타인 분기 정상
- [ ] 신고 모달 6사유 + 200자 제한
- [ ] 중복 신고 차단
- [ ] 차단 단방향 동작 (A→B 차단 시 A 피드에서 B 비노출, B 피드는 그대로)
- [ ] 차단 해제 후 즉시 피드 재노출
- [ ] 만 19세 미만 가입 차단
- [ ] 기존 사용자 grace period 모달
- [ ] 금칙어 자동 차단
- [ ] 어드민 큐 SLA 타이머 (12h/18h 색상 변화)
- [ ] 처리 액션 4종 정상 (삭제·정지·추방·기각)
- [ ] 인앱 「고객센터」 메뉴 + 신고 폼

### 2.3 T3 — 의료 출처 (1.4.1)

#### 디자인 (D+0 완료) ✅
- [x] 핸드오프 문서: `docs/project-management/2026-06-04/APPLE_T3_CITATION_DESIGN_HANDOFF.md`
- [x] 출처 4필드 (label/url/author/year)
- [x] 자가검사 원전 상수
- [x] AI 생성 배너·배지

#### 구현 (D+1~D+4)

**Frontend (Expo)**
- [ ] `expo-app/src/constants/assessmentCitations.ts` (신규) — PHQ-9/GAD-7/PSS 원전
- [ ] `expo-app/src/constants/psychoEducationData.ts` — sources 필드 추가
- [ ] `expo-app/src/constants/meditationData.ts` — sources 추가
- [ ] `expo-app/src/components/molecules/CitationBlock.tsx` (신규) — 공용 출처 컴포넌트
- [ ] `expo-app/src/components/molecules/AiContentBadge.tsx` (신규) — AI 생성 배지
- [ ] `expo-app/app/(client)/(wellness)/psycho-education/[id].tsx` — 출처 섹션
- [ ] `expo-app/app/(client)/(wellness)/meditation/[id].tsx` — 출처 섹션
- [ ] `expo-app/app/(client)/(wellness)/mind-weather/index.tsx` — AI 배너
- [ ] `expo-app/app/(client)/(wellness)/mind-weather/methodology.tsx` (신규) — 분석 방식
- [ ] `expo-app/app/(client)/(wellness)/self-assessment/result/[id].tsx` — 원전 인용

**Frontend (Web)**
- [ ] `frontend/src/components/common/HealingCard.js` — AI 배지 + 출처
- [ ] `frontend/src/components/admin/AdminContentMasterPage.js` — 출처 입력 카드 (4필드·다중)

**Backend**
- [ ] `src/main/java/.../dto/SourceCitation.java` (신규 record)
- [ ] `src/main/java/.../entity/PsychoEducationArticle.java` — `sources JSON`
- [ ] `src/main/java/.../entity/HealingContentCatalogItem.java` — `sources JSON`
- [ ] `src/main/java/.../entity/DailyHealingContent.java` — `sources JSON`
- [ ] DTO 확장 — `*UpsertRequest`, `*Response` (Expo·웹 어드민·웹 클라이언트 양쪽)
- [ ] `src/main/resources/db/migration/V20260605_xxx__add_content_sources.sql`

#### 테스트 (D+5)
- [ ] 콘텐츠 카드/상세 출처 섹션 표시 (출처 있을 때만)
- [ ] 자가검사 결과 PHQ-9/GAD-7/PSS 인용 + DOI 링크 작동
- [ ] 마음 날씨 AI 배너 + methodology 화면
- [ ] HealingCard AI 배지 + 출처
- [ ] 어드민 폼 4필드 + 다중 추가/삭제
- [ ] 외부 링크 인앱 브라우저 정상

### 2.4 메타 (ASC + Privacy Policy)

- [ ] ASC App Store > App Information > Age Rating → **18+** (사용자 작업)
- [ ] ASC App Privacy → "Identifiers — User ID" 추가 (Apple `sub`, 광고 비목적)
- [ ] ASC Description (영문) — UGC 안전장치 + Citation 명시 추가
- [ ] Privacy Policy URL — UGC 정책·SLA·신고 절차 추가 (사용자 작업)
- [ ] App Review Reply 메시지 (`APPLE_REVIEW_REPLY_DRAFT.md`) 검토·제출

### 2.5 빌드 + 제출

- [ ] `expo-app/app.config.ts` — `version: "1.0.6"`, `ios.buildNumber: "9"`
- [ ] `eas build --platform ios --profile production` 성공
- [ ] EAS Submit 또는 Transporter 로 ASC 업로드
- [ ] 빌드 처리 완료 (~30분) 대기
- [ ] ASC > Submit for Review
- [ ] Resolution Center > Reply > 답신 메시지 붙여넣기

## 3. 위험 · 완화

| 위험 | 영향 | 완화 |
|---|---|---|
| Apple JWKS 검증 실수 | 4.8 재거절 | 기존 OAuth2 패턴 재사용, JWKS 캐싱 동일 적용 |
| Private Relay 메일 발송 실패 | 4.8 재거절 (사용자 메일 도달 X) | SES/카카오톡 알림톡 모두 Apple Relay 통과 검증 |
| 18+ 게이트 기존 사용자 락아웃 | 사용자 이탈 | grace 모달로 1회 입력만 받기, 이탈률 모니터링 |
| 어드민 신고 큐 미처리 | 1.2 재거절 (24h SLA 미준수) | 18h 슬랙·이메일 알림, 어드민 당직 |
| 금칙어 false positive | UX 저해 | 1차 50~100단어 보수적 시작, 신고 빈도로 보강 |
| EAS 빌드 환경변수 누락 | 빌드 실패 | §4 EAS 환경변수 점검 표 |
| App Store Connect 처리 지연 | 일정 D+9 초과 | 빌드 처리 완료 후 즉시 제출 |
| 사용량 한도 초과 (서브에이전트) | 위임 실패 | 일자별 1트랙씩 분산, 메인 직접 작성 백업 (이미 발생) |

## 4. EAS 환경변수 점검 (구현 시작 전)

| 키 | 필요 여부 | 비고 |
|---|---|---|
| `KAKAO_NATIVE_APP_KEY` | 기존 ✅ | 그대로 |
| `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET` | 기존 ✅ | 그대로 |
| `APPLE_TEAM_ID` | 신규 (선택) | App Store Connect API 자동 빌드용 |
| `APPLE_BUNDLE_ID` | 기존 ✅ | `com.coresolution.mindgarden` 확인 |
| `GOOGLE_SERVICES_JSON` | 기존 ✅ | iOS 빌드에는 불필요 |
| `SUPABASE_URL` / 등 | 기존 ✅ | |

> SIWA 자체는 `expo-apple-authentication` 만 있으면 클라이언트 측 환경변수 불필요. Apple 인증은 디바이스의 Apple ID 기반.

## 5. 다음 액션 (시간 순)

1. **사용량 리셋 후** core-coder 트랙 위임 3건 (T1·T2·T3 병렬 또는 순차)
2. 코더 작업 진행 중 사용자는 ASC 메타 변경 (Age Rating 18+, Description) 시작
3. Tester 검증 → 1.0.6/build 9 EAS iOS 빌드 → ASC 업로드 → 답신 제출

## 6. 참조 문서 인덱스

| 주제 | 문서 |
|---|---|
| 거절 분석·작업 분해 | `docs/project-management/APPLE_REJECTION_PLAN_A_ORCHESTRATION_2026_06_04.md` |
| T1 SIWA 디자인 | `docs/project-management/2026-06-04/APPLE_T1_SIWA_DESIGN_HANDOFF.md` |
| T2 UGC 디자인 | `docs/project-management/2026-06-04/APPLE_T2_UGC_DESIGN_HANDOFF.md` |
| T3 Citation 디자인 | `docs/project-management/2026-06-04/APPLE_T3_CITATION_DESIGN_HANDOFF.md` |
| App Review 답신 | `docs/project-management/2026-06-04/APPLE_REVIEW_REPLY_DRAFT.md` |
| 본 마일스톤 | (이 문서) `docs/project-management/2026-06-04/APPLE_PLAN_A_MILESTONE_CHECKLIST.md` |
| 위임 룰 | `.cursor/rules/mindgarden-subagents.mdc` + `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md` |
| 표시 경계 | `docs/project-management/COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md` |
| 운영 반영 게이트 | `docs/project-management/SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md` §1.3, `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md` |

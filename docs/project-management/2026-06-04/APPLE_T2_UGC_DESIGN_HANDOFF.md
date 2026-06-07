# Apple T2 — UGC 안전장치 디자인 핸드오프

> **작성일**: 2026-06-05
> **대상 거절**: Apple App Store Submission ID `ce38fb9a-ced4-4957-b606-21618ff23518`, Guideline 1.2 (Safety — User Generated Content)
> **버전**: 1.0.6 / iOS build 9
> **트랙**: T2 (UGC Safeguards)
> **선행 문서**: `docs/project-management/APPLE_REJECTION_PLAN_A_ORCHESTRATION_2026_06_04.md` §7 T2
> **작성자**: 메인 어시스턴트 (core-designer 사용량 소진으로 대체 작성)

## 1. 사유 요약

Apple 1.2 — UGC 가능 앱은 다음 8가지 안전장치를 모두 갖춰야 한다:

| # | 요건 | 마인드가든 현황 |
|---|---|---|
| 1 | **18+ 연령 등급** | ❌ 없음 |
| 2 | **EULA + 무관용·24h·추방 조항** | △ `terms.json:54-64` 1줄만 |
| 3 | **콘텐츠 자동 필터** | ❌ |
| 4 | **신고(flag) 메커니즘** | △ 백엔드 ✅, UI ❌ (웹 토스트만) |
| 5 | **사용자 차단(block)** | ❌ |
| 6 | **본인 게시물 즉시 삭제** | △ 백엔드 ✅, UI ❌ |
| 7 | **24h SLA + 어드민 큐** | ❌ |
| 8 | **앱내 연락처/신고 채널** | ❌ |

UGC 노출 화면: `expo-app/app/(client)/(more)/community/{index,create,[id]}.tsx`, `frontend/src/components/community/CommunityFeed.js`, `CommunityController.java`.

## 2. 결정 사항 (요약)

| 항목 | 결정 |
|---|---|
| 자동 필터 | **금칙어 사전** 수준에서 시작 (LLM 모더레이션은 차후) |
| 18+ 게이트 | ASC 메타 + 가입 시 birthDate 필수 + 백엔드 `community_*` 게이트 |
| EULA | **Apple 표준 EULA 링크** 채택 + `terms.json` 의 7조 무관용 조항 강화 |
| 차단 (Block) | **단방향** — A 가 B 차단 시 A 의 피드에서 B 비노출 |
| 신고 처리 | 어드민 큐 신설, 24h SLA 카운트다운, 18h 경과 시 빨강 강조 |
| 인앱 연락처 | `(client)/(more)` 메뉴에 "고객센터·문의" 신설 |
| 댓글 | 이번 트랙에서 **신고·차단·자삭만** 적용 (사전 검수는 별도 트랙) |

## 3. 게시물 상세 더보기 메뉴 (Expo + 웹)

### 3.1 위치·아이콘

```
┌─────────────────────────────────────┐
│ 익명123  · 3시간 전          [⋯]    │  ← 더보기 (케밥)
│ ──────────────────────────────────  │
│ (게시 제목)                          │
│                                      │
│ (게시 본문)                          │
│ ──────────────────────────────────  │
│ ❤️ 12  💬 5                          │
└─────────────────────────────────────┘
```

- 아이콘: `⋯` (Ionicons `ellipsis-horizontal`) 또는 케밥 (`ellipsis-vertical`)
- 위치: 게시 카드 우상단 (작성자 메타 라인 끝)
- 크기: 24pt × 24pt 터치 영역 44pt 이상 보장

### 3.2 메뉴 항목 (본인/타인 분기)

**본인 게시물**:
```
┌──────────────────┐
│ 수정             │
│ 삭제             │
│ ──────────────── │
│ 취소             │
└──────────────────┘
```

**타인 게시물**:
```
┌──────────────────┐
│ 신고하기         │
│ 사용자 차단      │
│ ──────────────── │
│ 취소             │
└──────────────────┘
```

> `UnifiedModal` 또는 ActionSheet 기반. 디자인 시스템 모달 표준 준수.

### 3.3 댓글 더보기

같은 패턴의 케밥 메뉴를 댓글에도 적용:
- 본인: 삭제 (수정은 차후)
- 타인: 신고 / 차단

## 4. 신고 모달

### 4.1 화면 구성

```
┌───────────────────────────────────┐
│ ✕                  신고하기        │
├───────────────────────────────────┤
│ 어떤 점이 문제인가요?              │
│                                    │
│ ○ 스팸·광고                       │
│ ○ 욕설·폭력적 언어                │
│ ○ 음란·외설적 콘텐츠              │
│ ○ 허위 정보                       │
│ ○ 저작권 침해                     │
│ ○ 기타                            │
│                                    │
│ 상세 설명 (선택, 200자)            │
│ ┌─────────────────────────────┐    │
│ │                              │    │
│ └─────────────────────────────┘    │
│                                    │
│        [취소]   [신고 제출]        │
└───────────────────────────────────┘
```

### 4.2 동작

- 사유 미선택 시 "신고 제출" 비활성화
- 제출 → API 호출 → 토스트: **"신고가 접수되었습니다. 24시간 내 처리됩니다."**
- 같은 게시물 중복 신고 시 차단: "이미 신고하신 게시물입니다."
- 신고 사유는 어드민 큐에서 분류 표시용

### 4.3 백엔드 매핑

기존 `CommunityController.java:238-251` `POST /api/v1/community/posts/{postId}/report` 재사용. 요청 DTO:
```json
{
  "reason": "ABUSIVE_LANGUAGE",  // SPAM | ABUSIVE_LANGUAGE | OBSCENE | MISINFORMATION | COPYRIGHT | OTHER
  "detail": "..."  // 선택, 200자
}
```

> 신규 사유 enum 6개 — 기존 enum 확장 필요 (Coder 검증).

## 5. 사용자 차단 UI

### 5.1 차단 확인 모달

```
┌───────────────────────────────────┐
│        익명123 사용자를            │
│       차단하시겠습니까?            │
│                                    │
│ • 이 사용자의 게시글과 댓글이      │
│   보이지 않습니다.                 │
│ • 마이페이지 > 차단 목록에서       │
│   언제든지 해제할 수 있습니다.     │
│                                    │
│        [취소]   [차단하기]         │
└───────────────────────────────────┘
```

### 5.2 차단 목록 화면 (신규)

`expo-app/app/(client)/(more)/blocked-users/index.tsx`:

```
┌───────────────────────────────────┐
│ ← 차단 목록                        │
├───────────────────────────────────┤
│ 익명123        2026-06-05  [해제]  │
│ 익명456        2026-06-04  [해제]  │
│ 익명789        2026-05-30  [해제]  │
│                                    │
│ (목록 비어 있을 때)                │
│ 차단한 사용자가 없습니다.          │
└───────────────────────────────────┘
```

- `(client)/(more)/index.tsx` 메뉴에 "차단 목록" 항목 추가
- 해제 시 즉시 목록에서 제거 + 토스트 "차단을 해제했습니다."

### 5.3 차단 효과 (단방향)

- A 가 B 를 차단 → **A 의 피드에서 B 의 게시·댓글 비노출**
- B 의 피드는 그대로 (B 는 차단 사실 모름)
- 차단된 사용자는 어드민이 별도 처리하지 않음 (개인적 차단)

### 5.4 백엔드 신규 (Coder 작업)

- `community_user_blocks (id, blocker_user_id, blocked_user_id, created_at, tenant_id)` 테이블
- `POST /api/v1/community/blocks` (차단)
- `DELETE /api/v1/community/blocks/{blockedUserId}` (해제)
- `GET /api/v1/community/blocks` (목록)
- `CommunityServiceImpl.findFeed*` 에서 blockedUserIds 제외 필터

## 6. 18+ 가입 게이트

### 6.1 가입 화면 변경

기존 가입 화면 (`expo-app/app/(auth)/signup.tsx`, `social-signup.tsx`) 에 **생년월일** 필수 추가.

```
[이름]
[이메일]
[휴대폰]
[생년월일]  ★ 신규 (YYYY-MM-DD 또는 DatePicker)
[비밀번호]
[약관 동의]
[가입]
```

- 만 19세 미만 (KR 기준) 자동 계산 → **차단 화면**:

```
┌───────────────────────────────────┐
│            🚫                      │
│                                    │
│  마인드가든은 만 19세 이상만       │
│  이용 가능합니다.                   │
│                                    │
│  더 안전한 마음 돌봄을 위해         │
│  성인 인증을 진행하고 있습니다.     │
│                                    │
│        [확인]                      │
└───────────────────────────────────┘
```

- 카피 톤: 정중·공감, 거부 사유는 짧게 1줄

### 6.2 기존 사용자 (생년월일 미입력) Grace Period

- 기존 사용자 중 birthDate NULL 인 계정에 한해 **앱 진입 시 1회 모달**:
  - "마인드가든 이용을 위해 생년월일 확인이 필요합니다. 한 번만 입력해주세요."
  - 입력 후 미성년자면 위 차단 화면 노출 + 계정 동결
  - 미입력 상태로는 커뮤니티 진입 차단

### 6.3 ASC 메타 변경

| 항목 | 변경 |
|---|---|
| Age Rating | **17+** → **18+** (Apple 가이드 1.2 명시) |
| Content Descriptors | "Infrequent/Mild Mature/Suggestive Themes" → 필요 시 |

## 7. EULA 동의 단계 강화

### 7.1 약관 페이지 변경

`frontend/src/locales/ko/terms.json:54-64` 7조 (현재 1줄) 를 다음으로 강화:

```
제7조 (금지 행위 및 무관용 정책)

1. 회원은 다음 행위를 일절 해서는 안 됩니다:
   - 음란·외설·폭력·차별·혐오·자해 조장 콘텐츠 게시
   - 타인 비방·괴롭힘·명예훼손
   - 스팸·광고·허위정보 유포
   - 저작권·초상권·개인정보 침해

2. 회사는 위반 신고 접수 시 24시간 이내 처리합니다.
   - 위반 콘텐츠 즉시 삭제
   - 반복·악의적 위반자 영구 추방
   - 형사 처벌 대상 위반은 수사기관 신고

3. 본 정책에 동의하지 않으면 서비스를 이용할 수 없습니다.
```

### 7.2 Apple 표준 EULA 링크 옵션

`legal-webview.tsx` 또는 약관 동의 영역에 **Apple 표준 EULA** 링크 추가 (선택):

> "Apple 앱스토어 표준 약관"
> https://www.apple.com/legal/internet-services/itunes/dev/stdeula/

- 마인드가든 약관 + Apple 표준 EULA 양쪽 동의 흐름 가능
- 이번 트랙에서는 **마인드가든 약관 강화** 만 필수, Apple 링크는 선택

### 7.3 가입 동의 UI

```
☐ (필수) 서비스 이용약관 동의 — 무관용 정책 포함  [전문 보기]
☐ (필수) 개인정보 처리방침 동의                  [전문 보기]
☐ (선택) 마케팅 정보 수신 동의
```

## 8. 어드민 신고 처리 큐

### 8.1 메뉴 위치

`frontend/src/components/admin/` 내 신규: `(admin)/(content)/community-reports` 또는 `AdminContentReports.js`.

기존 어드민 사이드바 메뉴 → "콘텐츠 관리" 그룹에 "커뮤니티 신고" 추가.

### 8.2 큐 구성

```
┌─────────────────────────────────────────────────────────┐
│  커뮤니티 신고 처리                                      │
│  [전체] [OPEN] [UNDER_REVIEW] [RESOLVED] [REJECTED]     │
├─────────────────────────────────────────────────────────┤
│  ⏰ 18h 31m  남음  | OPEN                                │
│  사유: 욕설·폭력 | 신고자: 익명123 | 대상: 게시 #4521    │
│  내용 미리보기: "..."                                    │
│  [상세 보기]  [콘텐츠 삭제]  [사용자 일시정지]  [기각]   │
├─────────────────────────────────────────────────────────┤
│  ⏰ 22h 14m 남음 ⚠️  | UNDER_REVIEW                      │
│  사유: 음란·외설 | 담당자: 관리자A                       │
│  ...                                                     │
└─────────────────────────────────────────────────────────┘
```

### 8.3 SLA 타이머

| 경과 시간 | 상태 표시 |
|---|---|
| 0 ~ 12h | 회색 |
| 12 ~ 18h | 노랑 |
| 18 ~ 24h | 빨강 + ⚠️ |
| 24h 초과 | 빨강 깜빡 + 알림 |

타이머는 신고 접수 시각 기준으로 매 분마다 갱신.

### 8.4 처리 액션

| 액션 | 효과 |
|---|---|
| **콘텐츠 삭제** | 게시·댓글 즉시 삭제, 신고 RESOLVED, 알림 발송 (작성자에게 사유) |
| **사용자 일시정지** | 7일 정지, 신고 RESOLVED |
| **사용자 영구 추방** | account 잠금, 신고 RESOLVED |
| **신고 기각** | 신고 REJECTED, 신고자에게 알림 (선택) |

### 8.5 백엔드 변경 (Coder 작업)

- `community_reports` 에 `status (OPEN/UNDER_REVIEW/RESOLVED/REJECTED)`, `resolved_at`, `resolved_by_admin_id`, `resolution_action` 컬럼 추가
- `GET /api/v1/admin/community/reports` 큐 조회 API
- `PATCH /api/v1/admin/community/reports/{id}` 처리 API
- `docs/standards/UGC_MODERATION_SLA.md` 신규 문서 작성

## 9. 인앱 「고객센터·문의」 메뉴

### 9.1 위치

`expo-app/app/(client)/(more)/index.tsx` 의 메뉴 목록에 추가:

```
☁️  마음 돌봄
👤  내 정보
🚫  차단 목록           ★ 신규
📬  고객센터·문의       ★ 신규
📜  약관 및 정책
🔒  로그아웃
```

웹: `frontend/src/components/client/MoreAccountSettings.tsx` 동일 위치에 추가.

### 9.2 진입 화면 (신규)

`(client)/(more)/support/index.tsx`:

```
┌───────────────────────────────────┐
│  고객센터·문의                     │
├───────────────────────────────────┤
│  📩  일반 문의                     │
│      이용·결제 문의는 이메일로    │
│      contact@coresolution.co.kr   │
│                                    │
│  🚨  부적절한 콘텐츠 신고          │
│      커뮤니티 위반·악성 사용자    │
│      [신고 접수하기]               │
│                                    │
│  ❓  자주 묻는 질문 (FAQ)          │
│      [FAQ 바로가기]                │
└───────────────────────────────────┘
```

### 9.3 인앱 신고 폼 (`/support/report`)

```
[ 신고 카테고리 ]
○ 부적절한 게시물·댓글
○ 악성 사용자
○ 결제·환불
○ 기타

[ 상세 설명 ]
┌─────────────────────────────────┐
│                                  │
│                                  │
└─────────────────────────────────┘

[ 첨부 (스크린샷 최대 3장) ]
[+]

[ 제출 ]
```

제출 → 백엔드 저장 + 어드민 알림 + 사용자에게 접수 토스트.

## 10. 댓글 시스템 (이번 트랙 범위 — 안전장치만)

`community_comments` 에 다음 추가 (Coder 작업):
- 본인 댓글 삭제 UI 노출
- 신고 메커니즘 동일 적용
- 차단 사용자 댓글 비노출 필터

> 사전 검수는 이번 트랙 범위 외 (별도 트랙으로 분리).

## 11. 자동 콘텐츠 필터 (금칙어 사전)

### 11.1 적용 위치

`CommunityServiceImpl.createPost`, `addComment` 호출 직전에 금칙어 검사.

### 11.2 사전 구성 (Coder 작업)

`src/main/resources/community/banned-words.txt` (신규):
```
# 욕설
새끼
씨발
...

# 음란
...

# 폭력·자해
...
```

### 11.3 동작

- 매칭 시 게시 차단 + 사용자에게 토스트: "부적절한 표현이 포함되어 있습니다. 수정 후 다시 시도해주세요."
- 단순 문자열 매칭 (Aho-Corasick 또는 정규식)
- 1차 버전은 한국어 대표 욕설·음란 어휘 50~100개 정도

## 12. 디자인 토큰

### 12.1 위험·경고 컬러

| 토큰 | 값 | 용도 |
|---|---|---|
| `--color-danger-50` | `#FEF2F2` | 신고 카드 배경 (강조) |
| `--color-danger-500` | `#EF4444` | SLA 18h+ 빨강, 차단 액션 |
| `--color-warning-500` | `#F59E0B` | SLA 12~18h 노랑 |
| `--color-neutral-500` | `#6B7280` | SLA 0~12h 회색 |

### 12.2 타이포

- 신고 사유 라디오 라벨: 16pt regular
- SLA 타이머: 14pt SemiBold (mono)
- 어드민 큐 카드 제목: 16pt SemiBold

### 12.3 아이콘

- 신고: `flag` (Ionicons)
- 차단: `ban-outline`
- 자삭: `trash-outline`
- 고객센터: `headset-outline`

## 13. ASC 메타 변경 정리

| 항목 | 변경 |
|---|---|
| Age Rating | 18+ |
| Description (영문) | "User-generated content with full safeguards: report, block, mute, 24h moderation" 명시 |
| Privacy Policy URL | UGC 정책·신고 처리 SLA 추가 |
| App Review 답신 | 8개 안전장치 모두 갖췄음을 항목별로 답변 |

## 14. iOS·Android·웹 적용 범위

| 항목 | iOS | Android | 웹 |
|---|---|---|---|
| 18+ 게이트 | ✅ | ✅ | ✅ |
| EULA 강화 | ✅ | ✅ | ✅ |
| 자동 필터 | ✅ (백엔드) | ✅ | ✅ |
| 신고 모달 | ✅ | ✅ | ✅ |
| 차단 UI | ✅ | ✅ | ✅ |
| 본인 자삭 UI | ✅ | ✅ | ✅ |
| 어드민 큐 | — | — | ✅ (웹 어드민) |
| 인앱 연락처 | ✅ | ✅ | ✅ |

## 15. 완료 정의 (DoD)

- [ ] 게시·댓글 케밥 메뉴 (본인/타인 분기) Expo + 웹 양쪽 동작
- [ ] 신고 모달 6사유 + 상세 + 중복 차단
- [ ] 사용자 차단 단방향 작동, 차단 목록 화면, 해제 가능
- [ ] 가입 시 생년월일 필수, 만 19세 미만 차단
- [ ] 기존 사용자 grace period 모달
- [ ] 약관 7조 무관용·24h·추방 강화
- [ ] 어드민 신고 큐 4상태 + SLA 타이머 + 4액션
- [ ] 인앱 「고객센터·문의」 메뉴 + 신고 폼
- [ ] 금칙어 자동 필터 동작
- [ ] ASC Age Rating 18+ 변경 + App Review 답신

## 16. 다음 단계

```
@core-coder Apple T2 UGC 안전장치 구현. 핸드오프 문서: docs/project-management/2026-06-04/APPLE_T2_UGC_DESIGN_HANDOFF.md

수정 대상:
- expo-app/app/(client)/(more)/community/{index,[id]}.tsx (케밥, 신고, 차단)
- expo-app/app/(client)/(more)/blocked-users/index.tsx (신규)
- expo-app/app/(client)/(more)/support/{index,report}.tsx (신규)
- expo-app/app/(client)/(more)/index.tsx (메뉴 추가)
- expo-app/app/(auth)/signup.tsx, social-signup.tsx (생년월일 필수)
- frontend/src/components/community/CommunityFeed.js (케밥, 신고 API 연동)
- frontend/src/components/admin/AdminCommunityReports.js (신규 어드민 큐)
- frontend/src/locales/ko/terms.json (제7조 강화)
- src/main/java/.../entity/CommunityReport.java (status, resolved_at, resolved_by, action)
- src/main/java/.../entity/CommunityUserBlock.java (신규)
- src/main/java/.../service/impl/CommunityServiceImpl.java (필터·차단·금칙어)
- src/main/resources/db/migration/V20260605_xxx__community_safeguards.sql
- src/main/resources/community/banned-words.txt (신규)
- docs/standards/UGC_MODERATION_SLA.md (신규)

완료 조건: §15 DoD 모두 체크 후 core-tester 검증.
```

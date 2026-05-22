# 감정일기 공유 푸시 + 상담사 inbox — 테스트 플랜

**작성일**: 2026-05-21 · **갱신**: 2026-05-22 (core-planner 사후 정합 — C-1·C-2 commit `a3051dfd1` 정착 반영)  
**작성자**: core-tester  
**상태**: **자동 게이트 PASS** · **CI green** (gh run `26199540365` · sha `a3051dfd1` · 32m22s · `success`) — **human §8.5 PENDING** (잔여 1건)  
**SSOT 기획**: [`2026-05-21/MOOD_JOURNAL_CONSULTANT_INBOX_ORCHESTRATION.md`](./2026-05-21/MOOD_JOURNAL_CONSULTANT_INBOX_ORCHESTRATION.md) §0·§8  
**표준**: [`docs/standards/TESTING_STANDARD.md`](../standards/TESTING_STANDARD.md)

> **게이트**: §3 자동 **PASS** + CI green ✅ — human UAT(§6.2)·상용화 착수 가능. 커밋 `0ab910309` / `bc3eb002e` / `a3051dfd1` (C-1·C-2) 반영 검증 완료.

---

## 1. 범위·검증 대상

| # | 대상 | 완료 기준 (요약) | 스냅샷 (2026-05-21 게이트) |
|---|------|------------------|---------------------------|
| **V1** | `mood_journal_shared` 푸시 | **상담사(CONSULTANT)만** 수신; `sharedWithConsultant` **false→true 1회**만 발송; **매칭된 담당 상담사** 검증 후 fanout | ✅ `MoodJournalServiceImplSharePushTest` 3/3 · `MobilePushDispatchServiceImplTest.dispatchMoodJournalShared_fanoutConsultant` |
| **V2** | `GET /api/v1/mood-journals/inbox` | 상담사 세션·테넌트 일치; 공유 ON 일기 목록 JSON 계약 (`clientId`·`clientName`·`date`·`memo`/마스킹 등) | ✅ `MoodJournalControllerInboxIntegrationTest` 3/3 |
| **V3** | Expo 푸시 탭 → `mood-journal-inbox` | `data.type=mood_journal_shared` → `/(consultant)/(more)/mood-journal-inbox` | ✅ `pushNavigation.test.ts` — `mood journal shared consultant` 케이스 |
| **V4** | mind-weather inbox **회귀** | `GET /api/v1/mind-weather/inbox`·`mind_weather_shared` 푸시·`mind-weather-inbox` 화면 **기존 동작 유지** | ✅ `MindWeatherControllerInboxIntegrationTest` 3/3 (동일 Maven 배치) |

### 1.1 코더 완료 조건 (테스트 착수 게이트)

- [x] `MobilePushCanonicalTypes.MOOD_JOURNAL_SHARED` 및 `dispatchMoodJournalShared` 구현
- [x] `MoodJournalServiceImpl` upsert/update 시 **false→true** 전환 시에만 푸시
- [x] `GET /api/v1/mood-journals/inbox` — **상담사 전용**
- [x] Expo: `pushScenarios` 시나리오 + `app/(consultant)/(more)/mood-journal-inbox.tsx` + `endpoints.ts` `INBOX`
- [x] 신규 통합 테스트: `MoodJournalControllerInboxIntegrationTest`
- [x] 단위: `MobilePushDispatchServiceImplTest`에 `mood_journal_shared` 케이스
- [x] Expo `_layout.tsx`에 `mood-journal-inbox` **Stack.Screen** 명시 등록 — **DONE** (`expo-app/app/(consultant)/(more)/_layout.tsx:7` · commit `a3051dfd1`)

---

## 2. 시나리오 매트릭스

### 2.1 푸시 — `mood_journal_shared`

| ID | Given | When | Then | 계층 |
|----|-------|------|------|------|
| **P-1** | CLIENT·CONSULTANT **매칭됨**, 일기 `sharedWithConsultant=false` | POST/PUT 일기, `sharedWithConsultant=true` | CONSULTANT 1명에게 `type=mood_journal_shared` 푸시 **1회**; `data`에 `tenantId`·일기 식별자(`journalDate` 또는 `entryId`) | Java 단위 + 통합 |
| **P-2** | 동일 일기, 이미 `sharedWithConsultant=true` | memo/tags만 수정, 공유 ON 유지 | 푸시 **미발송** (멱등) | Java 단위 |
| **P-3** | 공유 ON 일기 | `sharedWithConsultant=false`로 저장 | 푸시 **미발송**; inbox에서 제거(또는 미노출) | Java + API |
| **P-4** | **매칭 없음** 또는 타 상담사 | 공유 ON 저장 | **403** (또는 합의된 4xx); 푸시 **0** | Java 통합 |
| **P-5** | CLIENT 계정 | — | 푸시 **수신 없음** | 수동 E2E |
| **P-6** | CONSULTANT, `wellness` 카테고리 OFF | P-1 재현 | 푸시 스킵(앱 설정) — 서버는 발송 시도 가능 | 수동 |
| **P-7** | `EXPO_ACCESS_TOKEN` 미설정 | P-1 | 서버 로그 스킵; inbox API는 **200** | Java 단위(기존 패턴) |

### 2.2 API — `GET /api/v1/mood-journals/inbox`

| ID | Given | When | Then |
|----|-------|------|------|
| **I-1** | CONSULTANT, 매칭 CLIENT의 공유 ON 일기 1건 | GET inbox | `200`, `$.success=true`, `data[0]`에 `clientId`·`clientName`·`date`·`sharedWithConsultant=true` |
| **I-2** | 공유 OFF 일기만 존재 | GET inbox | `data` **빈 배열** 또는 해당 일기 **미포함** |
| **I-3** | 세션 없음 / CLIENT 역할 | GET inbox | **403** |
| **I-4** | 테넌트 A 상담사 | 테넌트 B 일기 | **격리** — cross-tenant 0건 |
| **I-5** | 비매칭 CLIENT 공유 일기 | GET inbox | **0건** (다른 상담사 inbox에 노출 금지) |

### 2.3 Expo — 네비게이션·UI

| ID | Given | When | Then |
|----|-------|------|------|
| **E-1** | CONSULTANT, `mood_journal_shared` 푸시 수신 | 알림 탭 | `router.push('/(consultant)/(more)/mood-journal-inbox')` (또는 쿼리 `date`/`clientId`) |
| **E-2** | inbox 화면 | 목록 로드 | API 우선; 오프라인 시 Empty/Error — React **#130 0건** |
| **E-3** | 더보기 메뉴 | 「감정 일기 수신함」(또는 handoff 라벨) | `mood-journal-inbox` 진입 |

### 2.4 mind-weather inbox 회귀 (V4)

| ID | 검증 | Then |
|----|------|------|
| **R-1** | `GET /api/v1/mind-weather/inbox` | 기존 `MindWeatherControllerInboxIntegrationTest` **3케이스 PASS** |
| **R-2** | 마음날씨 share → `mind_weather_shared` | `/(consultant)/(more)/mind-weather-inbox` 라우팅 **유지** |
| **R-3** | 감정일기 공유와 **독립** | mind-weather 카드 공유가 mood-journal inbox에 **섞이지 않음** (역도 동일) |

---

## 3. 자동 테스트 게이트

### 3.1 Java

```bash
mvn -q -Dtest=MoodJournalControllerInboxIntegrationTest,MoodJournalServiceImplSharePushTest,MobilePushDispatchServiceImplTest test
```

| 테스트 | 역할 | 판정 | 실행 기록 |
|--------|------|:----:|-----------|
| `MoodJournalControllerInboxIntegrationTest` | V2 inbox JSON·403 | **PASS** | 2026-05-21 — 3/3 (403·clientId/clientName/date JSON) |
| `MoodJournalServiceImplSharePushTest` | V1 false→true·멱등·OFF | **PASS** | 2026-05-21 — 3/3 |
| `MobilePushDispatchServiceImplTest` — `dispatchMoodJournalShared_fanoutConsultant` | V1 fanout·data | **PASS** | 2026-05-21 — 전체 스위트 green (mood_journal 케이스 포함) |
| `MindWeatherControllerInboxIntegrationTest` | V4 회귀 | **PASS** | 2026-05-21 — 3/3 (동일 배치·선택 실행) |

**환경 메모**: 최초 동일 명령(09:51)은 `Could not resolve placeholder 'SMS_API_KEY'`로 통합 3건 **ERROR**. `application-test.yml`에 placeholder 존재·재실행(09:54) **PASS**. **C-2 정착**: `application-test.yml:98-102` SMS placeholder 4건 (`SMS_API_KEY`/`SMS_API_SECRET`/`SMS_SENDER_NUMBER`/`SMS_TEST_MODE`) + 주석 1건 (commit `a3051dfd1`) → CI gh run `26199540365` **green** 확인 완료.

### 3.2 Expo (Jest)

```bash
cd expo-app && npm run test:utils -- --testPathPattern="pushNavigation|pushScenarios|notificationServiceNavigate"
```

| 테스트 | 역할 | 판정 | 실행 기록 |
|--------|------|:----:|-----------|
| `pushNavigation.test.ts` — `mood_journal_shared` | V3 라우트 | **PASS** | 2026-05-21 — `mood journal shared consultant` → `/(consultant)/(more)/mood-journal-inbox` |
| `pushScenarios.test.ts` | 시나리오·`SCENARIO_BY_TYPE` | **PASS** | 2026-05-21 — 스위트 green |
| `notificationServiceNavigate.test.ts` | V3 탭 네비(회귀) | **PASS** | 2026-05-21 — 전용 `mood_journal` describe 없음 · `PUSH_SCENARIOS` 회귀 |
| **합계** | 3 suites | **PASS** | 2026-05-21 — **30/30** (7.4s) |

### 3.3 Expo 전체 utils (배치 touch 시)

```bash
cd expo-app && npm run test:utils
```

| 항목 | 판정 | 실행 기록 |
|------|:----:|-----------|
| 전체 `test:utils` | **NOT RUN** | 본 게이트는 §3.2 최소 패턴만 실행 |

---

## 4. 수동·푸시 E2E (dev)

**선행**: [`PAYMENT_SCHEDULE_NOTIFICATION_PUSH_UAT_REPORT.md`](./PAYMENT_SCHEDULE_NOTIFICATION_PUSH_UAT_REPORT.md) §1 P-2~P-4 — CLIENT/CONSULTANT Expo `push-token/register`, `EXPO_ACCESS_TOKEN`, 카테고리 **`wellness` ON**.

| 단계 | 조작 | 기대 | Pass |
|------|------|------|:----:|
| M-1 | CLIENT: 감정일기 작성, **상담사 공유 ON** 저장 | CONSULTANT 기기 푸시 1건, `type=mood_journal_shared` | ☐ |
| M-2 | CONSULTANT: 푸시 탭 | `mood-journal-inbox` 화면, 해당 일기 1행 | ☐ |
| M-3 | CLIENT: 동일 일기 재저장(공유 ON 유지) | 푸시 **추가 없음** | ☐ |
| M-4 | CLIENT: 공유 OFF | CONSULTANT inbox에서 **사라짐** | ☐ |
| M-5 | CONSULTANT: 마음날씨 share (기존) | `mind-weather-inbox`만; mood-journal inbox **변화 없음** | ☐ |

**판정**: **NOT RUN** (human §6.2 — 실기기·토큰)

---

## 5. 종합 판정

| 구분 | 판정 | 비고 |
|------|:----:|------|
| **기능 V1~V3 (자동)** | **PASS** | Java 19 tests 0 failures · Expo 30/30 |
| **회귀 V4** | **PASS** | `MindWeatherControllerInboxIntegrationTest` 3/3 |
| **Expo 라우트 Stack** | **PASS** | `_layout.tsx:7` `<Stack.Screen name="mood-journal-inbox" options={{ headerShown: false }} />` ✅ (`a3051dfd1`) |
| **표시 경계 (리뷰)** | **PASS** | `mood-journal-inbox.tsx` — `toDisplayString`·`toSafeNumber`(`safeDisplay`) 사용 |
| **CI 코드 품질 검사** | **PASS** | gh run `26199540365` (sha `a3051dfd1` · 32m22s · `success`) |
| **수동 M-1~M-5** | **NOT RUN** | human §6.2 (잔여) |
| **배치 완료 보고** | **조건부** | 자동 게이트·CI green ✅ · human §6.2 Pass 후 CLOSED |

---

## 6. core-tester 게이트 — 결과·human §8.5

### 6.1 실행 결과 표 (2026-05-21)

| 항목 | 명령·대상 | 판정 | BLOCKED 해제 |
|------|-----------|:----:|:------------:|
| Inbox API 통합 | `MoodJournalControllerInboxIntegrationTest` | **PASS** | ✅ (클래스 존재·3케이스) |
| Share push 단위 | `MoodJournalServiceImplSharePushTest` | **PASS** | ✅ |
| Push dispatch 단위 | `MobilePushDispatchServiceImplTest` (`mood_journal_shared`) | **PASS** | ✅ |
| mind-weather 회귀 | `MindWeatherControllerInboxIntegrationTest` | **PASS** | ✅ (env 재실행 green) |
| Expo V3 | `test:utils` — pushNavigation·pushScenarios·notificationServiceNavigate | **PASS** | ✅ |
| Expo Stack 등록 | `_layout.tsx:7` Stack.Screen 등록 | **PASS** | ✅ (`a3051dfd1` core-coder DONE) |
| Human 푸시 E2E | §4 M-1~M-5 | **NOT RUN** | human |

**실행 명령 (기록)**:

```bash
mvn -q -Dtest=MoodJournalControllerInboxIntegrationTest,MoodJournalServiceImplSharePushTest,MobilePushDispatchServiceImplTest test
cd expo-app && npm run test:utils -- --testPathPattern="pushNavigation|pushScenarios|notificationServiceNavigate"
```

### 6.2 human §8.5 스모크 — QA 3줄 (`mood_journal_shared`)

**대상**: 매칭 **CLIENT** + **CONSULTANT** 실기기 · dev · `push-token/register`·`EXPO_ACCESS_TOKEN`·`wellness` ON 선행.

1. **CLIENT** — 감정일기 작성 → **상담사 공유 ON**(false→true) 저장 → CONSULTANT OS 푸시 **1건** (`type=mood_journal_shared`).
2. **CONSULTANT** — 푸시 탭 → `/(consultant)/(more)/mood-journal-inbox` · 수신함 **1건** · React #130·콘솔 크리티컬 **0건**.
3. **CLIENT** — 동일 일기 **공유 ON 유지** 재저장 → 푸시 **0**; **마음 날씨 수신함** 1회 회귀(M-5) — mood-journal·mind-weather **혼선 없음**.

**판정**: human 기록 전 — 자동 게이트만 **PASS**.

### 6.3 게이트 원칙 (변경 없음)

1. **코드 변경 배치는 `core-tester` 자동·수동 게이트 PASS 없이 완료 보고 금지** ([`CORE_PLANNER_DELEGATION_ORDER.md`](./CORE_PLANNER_DELEGATION_ORDER.md)).
2. **자동**: §6.1 표 전항 **PASS** (Stack 등록은 coder 후 재점검).
3. **수동**: §6.2 3줄 Pass 후 B-PUSH·B-INBOX human **CLOSED**.

---

## 7. core-coder 위임 목록

| # | 항목 | 사유 |
|---|------|------|
| C-1 | `expo-app/app/(consultant)/(more)/_layout.tsx` — `<Stack.Screen name="mood-journal-inbox" … />` 추가 | 파일 라우트만 존재·Stack에 `session-kpi`만 명시 — handoff·애니메이션 일관성 |
| C-2 | 통합 테스트 `SMS_API_KEY` placeholder — `application-test.yml` → `sms.auth.api-key` 바인딩 또는 CI env 문서화 | 최초 Maven 실행 ApplicationContext 실패 재현 가능 |

---

## 8. 참조

| 문서·코드 | 용도 |
|-----------|------|
| [`MOOD_JOURNAL_CONSULTANT_INBOX_ORCHESTRATION.md`](./2026-05-21/MOOD_JOURNAL_CONSULTANT_INBOX_ORCHESTRATION.md) | MW-1~5·분배 |
| [`PAYMENT_SCHEDULE_NOTIFICATION_PUSH_UAT_REPORT.md`](./PAYMENT_SCHEDULE_NOTIFICATION_PUSH_UAT_REPORT.md) | 푸시 UAT·`mood_journal_shared` 행 |
| `MindWeatherControllerInboxIntegrationTest` | inbox 회귀 선례 |
| `MobilePushDispatchServiceImpl.dispatchMoodJournalShared` | 푸시 fanout |
| `expo-app/src/constants/pushScenarios.ts` | `MOOD_JOURNAL_SHARED_SCENARIO` |
| [`COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md`](./COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md) | `safeDisplay`·React #130 |

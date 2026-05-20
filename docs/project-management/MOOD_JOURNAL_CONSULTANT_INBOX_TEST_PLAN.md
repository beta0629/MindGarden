# 감정일기 공유 푸시 + 상담사 inbox — 테스트 플랜

**작성일**: 2026-05-21  
**작성자**: core-tester  
**상태**: **내일 재검증 (2026-05-22)** — 구현은 develop에 push됨 · 본 문서 §1 표는 **코더 완료 전** 스냅샷(구식 ❌) → **내일 §3 명령 재실행 후 PASS/FAIL 갱신**  
**SSOT 기획**: [`2026-05-21/MOOD_JOURNAL_CONSULTANT_INBOX_ORCHESTRATION.md`](./2026-05-21/MOOD_JOURNAL_CONSULTANT_INBOX_ORCHESTRATION.md) §0 **내일 할 일**  
**표준**: [`docs/standards/TESTING_STANDARD.md`](../standards/TESTING_STANDARD.md)

> **내일 반드시**: §3 Maven + §4 Expo `test:utils` + §6 human 푸시 E2E 3줄 — 테스터 게이트 미통과 시 상용화·human UAT 착수 금지.

---

## 1. 범위·검증 대상

| # | 대상 | 완료 기준 (요약) | 현재 코드 스냅샷 (2026-05-21) |
|---|------|------------------|-------------------------------|
| **V1** | `mood_journal_shared` 푸시 | **상담사(CONSULTANT)만** 수신; `sharedWithConsultant` **false→true 1회**만 발송; **매칭된 담당 상담사** 검증 후 fanout | ⏳ **내일** §3 재검증 (코더: 구현·단위 테스트 PASS 보고) |
| **V2** | `GET /api/v1/mood-journals/inbox` | 상담사 세션·테넌트 일치; 공유 ON 일기 목록 JSON 계약 (`clientId`·`clientName`·`date`·`memo`/마스킹 등) | ⏳ **내일** `MoodJournalControllerInboxIntegrationTest` |
| **V3** | Expo 푸시 탭 → `mood-journal-inbox` | `data.type=mood_journal_shared` → `/(consultant)/(more)/mood-journal-inbox` | ⏳ **내일** `pushNavigation.test.ts` |
| **V4** | mind-weather inbox **회귀** | `GET /api/v1/mind-weather/inbox`·`mind_weather_shared` 푸시·`mind-weather-inbox` 화면 **기존 동작 유지** | ✅ 기존 자산 존재 — 본 배치 후 **회귀 게이트** |

### 1.1 코더 완료 조건 (테스트 착수 게이트)

- [ ] `MobilePushCanonicalTypes.MOOD_JOURNAL_SHARED` (= `"mood_journal_shared"`) 및 `dispatchMoodJournalShared` (또는 동등) 구현
- [ ] `MoodJournalServiceImpl` upsert/update 시 **false→true** 전환 시에만 푸시; 매칭 실패 시 403/4xx
- [ ] `GET /api/v1/mood-journals/inbox` — **상담사 전용**
- [ ] Expo: `pushScenarios` 시나리오 + `app/(consultant)/(more)/mood-journal-inbox.tsx` + `endpoints.ts` `INBOX`
- [ ] 신규 통합 테스트: `MoodJournalControllerInboxIntegrationTest` (또는 동등)
- [ ] 단위: `MobilePushDispatchServiceImplTest`에 `mood_journal_shared` 케이스

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

> **현재**: 코더 미완 → 아래 **신규 행 전부 BLOCKED**. 코더 완료 후 동일 명령 재실행·표 갱신.

### 3.1 Java

```bash
# 신규 + 회귀 (코더 완료 후)
mvn -q -Dtest=MoodJournalControllerInboxIntegrationTest,MindWeatherControllerInboxIntegrationTest,MobilePushDispatchServiceImplTest test
```

| 테스트 | 역할 | 판정 | 실행 기록 |
|--------|------|:----:|-----------|
| `MoodJournalControllerInboxIntegrationTest` *(신규)* | V2 inbox JSON·403 | **BLOCKED** | 코더 WIP — 클래스 **미존재** |
| `MindWeatherControllerInboxIntegrationTest` | V4 회귀 | **FAIL (env)** | 2026-05-21 — ApplicationContext: `SMS_API_KEY` placeholder 미해결 (3 errors) |
| `MobilePushDispatchServiceImplTest` — `mood_journal_shared` | V1 fanout·data | **BLOCKED** | 코더 WIP — 케이스 **미부착** |

### 3.2 Expo (Jest)

```bash
cd expo-app && npm run test:utils -- --testPathPattern="pushNavigation|notificationServiceNavigate"
```

| 테스트 | 역할 | 판정 | 실행 기록 |
|--------|------|:----:|-----------|
| `pushNavigation.test.ts` — `mood_journal_shared` | V3 라우트 | **BLOCKED** | 코더 WIP — 시나리오 **미부착** |
| `notificationServiceNavigate.test.ts` — consultant mood journal inbox | V3 탭 네비 | **BLOCKED** | 코더 WIP |
| `pushNavigation`·`notificationServiceNavigate` **기존 26 tests** | 회귀 | **PASS** | 2026-05-21 — 2 suites, 26/26 |

### 3.3 Expo 전체 utils (배치 touch 시)

```bash
cd expo-app && npm run test:utils
```

| 항목 | 판정 | 실행 기록 |
|------|:----:|-----------|
| 전체 `test:utils` | **NOT RUN** | 코더 완료 후 실행 |

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

**판정**: **NOT RUN / BLOCKED** (코더 WIP + dev 실기기·토큰 미확인)

---

## 5. 종합 판정

| 구분 | 판정 | 비고 |
|------|:----:|------|
| **기능 V1~V3** | **BLOCKED** | `mood_journal_shared`·`/mood-journals/inbox`·`mood-journal-inbox` **코드 미부착** |
| **회귀 V4** | **PENDING** | mind-weather 자산 존재; 통합 테스트는 **로컬 env FAIL** — 코더 완료 후 재실행 |
| **Expo Jest (기존)** | **PASS** | pushNavigation·notificationServiceNavigate 26/26 |
| **배치 완료 보고** | **불가** | [`CORE_PLANNER_DELEGATION_ORDER.md`](./CORE_PLANNER_DELEGATION_ORDER.md) — 코더 + 테스터 게이트 후 |

---

## 6. core-tester 게이트 — 푸시 E2E (3줄)

1. **코드 변경이 있는 본 배치는 `core-tester` 자동·수동 게이트 PASS 없이 완료로 보고하지 않는다** ([`CORE_PLANNER_DELEGATION_ORDER.md`](./CORE_PLANNER_DELEGATION_ORDER.md)).
2. **자동**: `MoodJournalControllerInboxIntegrationTest` + `MindWeatherControllerInboxIntegrationTest` + `MobilePushDispatchServiceImplTest`(`mood_journal_shared`) **PASS**; Expo `pushNavigation`·`notificationServiceNavigate`에 **`mood_journal_shared` → `/(consultant)/(more)/mood-journal-inbox`** 케이스 **PASS**.
3. **수동**: dev CLIENT 일기 **공유 ON(false→true)** → CONSULTANT 푸시 1회·탭 시 **mood-journal-inbox** 1건 표시; **공유 ON 유지 재저장 시 푸시 0**; **mind-weather-inbox** 회귀 1회; React #130·콘솔 크리티컬 **0건**.

---

## 7. 참조

| 문서·코드 | 용도 |
|-----------|------|
| [`MOOD_JOURNAL_CONSULTANT_INBOX_ORCHESTRATION.md`](./2026-05-21/MOOD_JOURNAL_CONSULTANT_INBOX_ORCHESTRATION.md) | MW-1~5·분배 |
| [`PAYMENT_SCHEDULE_NOTIFICATION_PUSH_UAT_REPORT.md`](./PAYMENT_SCHEDULE_NOTIFICATION_PUSH_UAT_REPORT.md) | 푸시 UAT·`mood_journal_shared` 행 |
| `MindWeatherControllerInboxIntegrationTest` | inbox 회귀 선례 |
| `MobilePushDispatchServiceImpl.dispatchMindWeatherShared` | 푸시 fanout 패턴 참고 |
| `expo-app/src/constants/pushScenarios.ts` | `MIND_WEATHER_SHARED_SCENARIO` 대칭 추가 예정 |

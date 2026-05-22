# 상담사 Expo 모바일 홈 컨텐츠 강화 — 기획·오케스트레이션

| 항목 | 내용 |
|------|------|
| 작성일 | 2026-05-22 |
| 작성 | core-planner |
| 범위 | `expo-app/app/(consultant)/(home)/index.tsx` 및 홈 전용·공유 컴포넌트·훅 |
| 제외 | 내담자 홈, 웹 어드민, 백엔드 스키마 변경(필요 시 별도 Phase) |
| SSOT 참조 | `docs/design-system/v2/CONSULTANT_CLIENT_SCREEN_WIREFRAMES.md` §1, `frontend/.../ConsultantDashboardV2.js` |
| 화면설계서(후속) | `docs/design-system/SCREEN_SPEC_CONSULTANT_MOBILE_HOME.md` (Phase 2 산출) |

---

## 1. 문제·목표

### 문제

상담사 Expo 홈(`expo-app/app/(consultant)/(home)/index.tsx`)은 인사·날짜, 조건부 미작성 일지 배너, 오늘 스케줄 FlashList, 빠른 액션 2개(오늘 스케줄·근무 설정)만 제공한다. 와이어 §1과 웹 `ConsultantDashboardV2` 대비 **요약 KPI·다음 상담·메시지/알림·긴급 내담자·확장 빠른 액션**이 빠져 있어, 상담사가 앱을 열었을 때 “오늘 무엇을 해야 하는지”를 한 화면에서 파악하기 어렵고 **단조로운 인상**을 준다. 더보기 탭에는 급여 정산·회기 KPI·마음날씨 수신함 등 기능이 이미 있으나 홈에서 재노출되지 않는다.

### 목표

와이어 §1 및 웹 V2의 **정보 밀도·우선순위**를 모바일에 맞게 재구성하여, 상담사가 홈 진입 **3초 이내**에 (1) 오늘 일정 규모, (2) 즉시 처리할 알림(미작성 일지·미읽음), (3) 가장 가까운 상담, (4) 자주 쓰는 단축 동작을 파악할 수 있게 한다. **기존 API·훅·컴ponent 우선 재사용**, 일지 모바일 정책(`consultantRecordMobilePolicy`) 준수, 멀티테넌트·하드코oding 금지를 전제로 한다.

---

## 2. 벤치마크 — 웹 V2 vs Expo 현재 vs 와이어 (갭)

| 영역 | 웹 `ConsultantDashboardV2` | Expo 현재 | 와이어 §1 | 갭·비고 |
|------|---------------------------|-----------|-----------|---------|
| 상단 크롬 | AdminCommonLayout + ContentHeader + QuickActionBar(헤더) | SafeAreaView만, **AppTopBar 없음** | 로고·알림·프로필 Top Bar | 알림 진입·브랜드 일관성 부재 (내담자 홈은 `AppTopBar` 사용) |
| 인사·요약 | subtitle에 오늘 일정·알림·내담 현황 | 이름 + 날짜만 | **「오늘 N건의 상담이 예정」** | 요약 문구 미구현 (`todayCount`는 훅에 있으나 UI 미사용) |
| KPI 스트립 | 4칸: 오늘 상담·신규 내담·안읽은 메시지·평균 평점 | 없음 | (와이어에 KPI 행 없음, 웹 수준 권장) | 모바일 KPI 2~4칸 수평 스크롤 후보 |
| 긴급 알림 | `IncompleteRecordsAlert` + 긴급 내담자 섹션 | 미작성 일지만 | 미작성 일지 배너 | **긴급 내담자** 미노출 |
| 다음 상담 | `NextConsultationCard` (오늘/내일 준비) | 없음 | (스케줄 카드에 액션 포함) | **다음 1건 강조 카드** 부재 |
| 오늘 스케줄 | 최근 일정(오늘·어제) 최대 5건 | 오늘만 FlashList 전체 | 카드 + 액션 버튼 | 구현됨. 와이어 대비 액션은 `ScheduleCard`+`consultantScheduleCardUi`로 충족 |
| 다가오는 상담 | 7일 upcoming 목록 | 없음 | — | P1: 홈 스냅샷 또는 스케줄 탭 링크 |
| 메시지·알림 | KPI + 시스템 알림 3건 | 없음 | Top Bar 🔔 | `useUnreadMessageCount`·`useUnreadCount` 미연동 |
| 마음날씨 | (웹 홈 미노출, 앱 더보기만) | 더보기만 | — | P2: 수신함 미읽/최근 1건 스냅샷 |
| 회기 KPI | (웹 홈 미노출) | `session-kpi` 더보기 | — | P2: 이번 달 완료 회기 1수치 |
| 급여 정산 | (웹 홈 미노출) | `salary-settlement` 더보기 | **빠른 액션 조건부** | P1: 미정산/최근 지급 1건 요약 + CTA |
| 빠른 액션 | 4개: 일지 작성·일정·내담자·메시지 | 2개: 오늘 스케줄·근무 설정 | 3개: **일정 추가·근무·급여(조건부)** | **일정 추가·메시지·일지·급여** 갭 |
| 주간 추이 차트 | `weeklyStats` 막대 | 없음 | — | 모바일 홈 **제외**(Could·별도 화면) |
| Pull-to-refresh | 수동 fetch | dashboard + pending만 | — | KPI·메시지 등 추가 시 invalidate 확장 필요 |

---

## 3. 홈 IA 제안 (섹션 순서·우선순위)

### 3.1 사용자 관점 (§0.4 — 디자이너 전달용)

| 항목 | 내용 |
|------|------|
| **사용성** | 상담사는 **출근·상담 전·상담 사이**에 홈을 연다. 1순위: 오늘 몇 건·다음 상담 시각. 2순위: 미작성 일지·미읽음 메시지 처리. 3순위: 일정 추가·근무 설정·급여 확인. 스크롤 깊이는 **2~3 화면 분량** 이내 권장. |
| **정보 노출** | **COMPLETED 일지**는 홈·목록 어디서도 열람 CTA 금지. 미작성(DRAFT/미완료 세션)만 배너·CTA. 내담자 PII는 기존 `ScheduleCard` 수준(이름·회기 유형). 급여는 **본인 정산 요약**만. |
| **레이아웃** | 상→하: **TopBar → 인사+요약 → (알림 스택) → KPI 스트립 → 다음 상담 카드 → 오늘 스케줄 → (스냅샷 행) → 빠른 액션**. 카드형·가로 스크롤 KPI는 내담자 홈(`StatCard`) 패턴 정렬. |

### 3.2 섹션 목록 (Must / Should / Could × P0 / P1 / P2)

| 순서 | 섹션 | MoSCoW | 우선순위 | 설명 |
|------|------|--------|----------|------|
| 0 | **AppTopBar** (알림·프로필/더보기) | Must | **P0** | 내담자 홈과 동일 패턴. `useUnreadCount` 배지 |
| 1 | **인사 + 오늘 N건 요약** | Must | **P0** | `useConsultantDashboard().todayCount` 또는 스케줄 length. 와이어 문구 상수화(`consultantHomeCopy`) |
| 2 | **긴급 알림 스택** | Must | **P0** | (a) 미작성 일지 배너 — 기존 유지·개선 (b) P1: 긴급 내담자 1줄 요약 |
| 3 | **KPI 스트립** (가로 ScrollView) | Should | **P0~P1** | P0: 오늘 상담·미읽음 메시지. P1: 신규 내담·평균 평점(데이터 있을 때만) |
| 4 | **다음 상담 카드** | Should | **P1** | 오늘/내일 첫 미완료 스케줄 또는 `upcoming-preparation` API. Countdown·CTA(일지/상세) |
| 5 | **미작성 일지** (배너와 중복 시 통합) | Must | **P0** | count>0일 때만. COMPLETED 열람 CTA **금지** |
| 6 | **오늘의 스케줄** | Must | **P0** | 기존 FlashList 유지. 제목+건수+「전체 보기」 |
| 7 | **활동 스냅샷 행** | Could | **P1~P2** | 메시지 최근 1스레드 / 마음날씨 수신 1건 / 이번 달 회기 KPI — **2칸 이하** |
| 8 | **빠른 액션** | Must | **P0~P1** | P0: 일정 추가·근무 설정. P1: 메시지·일지 작성·**급여 정산(조건부)** |
| 9 | 주간 추이·커뮤니티 | Could | **P2** | 홈 제외, 더보기 유지 |

### 3.3 Phase별 구현 묶음 (권장)

| Phase | 포함 섹션 | 목표 |
|-------|-----------|------|
| **MVP (P0)** | 0,1,2a,5,6,8(일정 추가·근무) | 와이어 §1 **핵심 갭** 해소 |
| **P1** | 3,4,2b,8 확장,7(메시지·급여) | 웹 V2와 **인지적 패리티** |
| **P2** | 7(마음날씨·회기 KPI), KPI 평점 | 풍부함·차별화 |

---

## 4. 역할별 정보 노출 (상담사 CONSULTANT)

| 정보 | 홈 노출 | 비고 |
|------|---------|------|
| 오늘·다가오는 스케줄(시간·내담자명·유형·상태) | ✅ | 기존 `ScheduleCard` |
| 미작성/DRAFT 일지 건수·작성 CTA | ✅ | `usePendingRecords`, `isConsultantRecordVisibleOnMobile` |
| **COMPLETED 일지** 목록·상세·「지난 일지 보기」 | ❌ | `consultantRecordMobilePolicy` — 데스크톱 전용 |
| 안읽은 **상담 메시지** 건수·최근 스레드 미리보기 | ✅ (P1) | 본인-내담자 스레드만 |
| **시스템 알림** unread 배지 | ✅ | `useUnreadCount` |
| 긴급/고위험 내담자 이름·사유 요약 | ✅ (P1) | 웹 `UrgentClientsSection` 수준. 상세는 내담자 탭 |
| 신규 내담자 수·평균 평점 | ✅ (P1, KPI) | 테넌트·API 실패 시 숨김/「-」 |
| **급여 정산** 기간·상태·금액 요약 | ✅ (조건부) | 승인/지급 데이터 있을 때만 CTA |
| 마음날씨 수신함 카드 내용 | ✅ (P2) | 공유 동의된 카드만. 전문가 메모 등 비공개 필드 **금지** |
| ERP·관리자 전용 통계 | ❌ | |
| 타 상담사·타 테넌트 데이터 | ❌ | tenantId·userId 스코프 필수 |

---

## 5. API·데이터 매핑

### 5.1 DB-first 관점

홈 강화는 **신규 테이블 없이** 기존 스케줄·일지·메시지·알림·정산·마음날씨 API를 **집계·스냅샷**하는 UI 레이어 작업이 원칙이다. 웹 V2가 이미 호출하는 대시보드 Phase1 엔드포인트는 백엔드 SSOT로 간주하고 Expo `endpoints.ts`에 **상수 추가만**으로 연동 가능한지 explore Phase에서 확인한다.

### 5.2 매핑 표

| UI 데이터 | Expo 기존 훅/유틸 | 백엔드 엔드포인트 (웹 SSOT) | 재사용 | 신규 필요 |
|-----------|-------------------|----------------------------|--------|-----------|
| 오늘 스케줄 목록 | `useConsultantDashboard` → `fetchConsultantSchedulesForDate` | `GET /api/v1/schedules/date/{ymd}?userId&userRole=CONSULTANT` | ✅ | 훅 확장만 (주간 count 등) |
| 오늘 N건 | `todayCount` in dashboard query | 위와 동일 | ✅ | UI·copy |
| 미작성 일지 | `usePendingRecords` | `GET` consultation-records entities by consultant + 필터 | ✅ | 웹 `incomplete-records` API와 **정합성 검증** 필요 (explore) |
| 상담사 통계(KPI) | **없음** | `GET /api/v1/schedules/today/statistics` (`DASHBOARD_API.CONSULTANT_STATS`) | ⚠️ | `useConsultantHomeStats` 훅 **신규** (상수·normalize) |
| 안읽은 메시지 | `useUnreadMessageCount` | `GET /api/v1/consultation-messages/unread-count` | ✅ | 홈 wiring |
| 시스템 알림 unread | `useUnreadCount` | `GET /api/v1/system-notifications/unread-count` | ✅ | TopBar wiring |
| 다음 상담 준비 | **없음** | `GET /api/v1/schedules/consultants/{id}/upcoming-preparation` | ⚠️ | 훅 **신규** 또는 클라이언트 파생(오늘 스케줄 첫 건) |
| 다가오는 7일 | **없음** | `GET /api/v1/schedules/upcoming` | ⚠️ | P1 훅 |
| 긴급 내담자 | **없음** | `GET .../high-priority-clients` | ⚠️ | P1 훅 |
| 평균 평점 | **없음** | `GET /api/v1/ratings/consultant/{id}/stats` | ⚠️ | P1, endpoints 추가 |
| 급여 정산 스냅샷 | `useConsultantSalarySettlements` | `GET /api/v1/consultants/me/salary-calculations` | ✅ | 홈용 selector(최근 1건·미확인) |
| 회기 KPI | `useConsultantSessionStatistics` | `GET /api/v1/consultants/me/session-statistics` | ✅ | P2 홈 1수치 |
| 마음날씨 수신함 | `useConsultantMindWeatherInbox` | `GET /api/v1/mind-weather/inbox` | ✅ | P2 스냅샷 |
| 메시지 스레드 목록 | `useConsultantConversations` 등 | `GET .../consultant/{id}` | ✅ | P1 최근 1건 |

### 5.3 훅·파일 배치 (코더 가이드 — 경계만)

| 계층 | 경로 |
|------|------|
| 화면 | `expo-app/app/(consultant)/(home)/index.tsx` |
| copy 상수 | `expo-app/src/constants/consultantHomeCopy.ts` (신규, `clientHomeCopy` 대칭) |
| KPI·요약 유틸 | `expo-app/src/utils/consultantHomeKpi.ts` (신규, `clientHomeKpi` 패턴) |
| API 상수 | `expo-app/src/api/endpoints.ts` — 웹 `frontend/src/constants/api.js` DASHBOARD/RATING 정렬 |
| 훅 | `useSchedules.ts` 확장 또는 `useConsultantHome.ts` (집계 훅) |
| 컴ponent | `StatCard`, `QuickActionBar`, `ScheduleCard` 재사용 우선 |

---

## 6. 리스크·제약

| 리스크 | 완화 |
|--------|------|
| `useConsultantDashboard`가 통계 API 미호출·`pendingRecordCount: 0` 고정 | explore에서 웹·Expo pending 정의 비교; 홈 stats 훅 분리 |
| 홈 API 병렬 호출 증가 → 초기 로딩 체감 | KPI는 staleTime 공유·스켈레ton strip; React Query `enabled`·병렬 제한 |
| COMPLETED 일지 CTA 실수 | 코드 리뷰·`consultantRecordMobilePolicy` 테스트 게이트 |
| 하드coding copy·색상 | `consultantHomeCopy`·`theme.colors`·constants only |
| Metro alias/MMKV | 코더 Phase: `EXPO_APP_METRO_ALIAS_AND_MMKV_HANDOFF.md` §5 |
| tenantId 없음 | 내담자/웹과 동일 — 배ner·빈 KPI, API skip |

---

## 7. 분배실행표

> **호출 주체**: 부모 에이전트. 의존성 없는 Phase는 **병렬** 가능.  
> 디자인 Task는 **`model: "gemini-3.1-pro"`** 권장.

| Phase | subagent | 병렬 | 전달 프롬프트 요약 |
|-------|----------|------|-------------------|
| **1-A** | `explore` | ✅ 1-B와 병렬 | **API·훅 인벤토리**: `expo-app/src/api/hooks/*`, `endpoints.ts`, 웹 `ConsultantDashboardV2.js`·`frontend/src/constants/api.js`의 DASHBOARD/RATING 경로 대조. 산출: (1) Expo 미연동 엔드포인트 목록 (2) `usePendingRecords` vs `CONSULTANT_INCOMPLETE_RECORDS` 데이터 차이 (3) 홈 P0/P1에 필요한 훅 신규/확장 목록 (4) tenantId·역할 쿼리 패턴 표. **코드 수정 없음.** |
| **1-B** | `core-component-manager` | ✅ 1-A와 병렬 | **컴ponent 배치**: `expo-app/app/(consultant)/(home)/`, `src/components/{atoms,molecules,organisms}`, 내담자 홈·웹 V2 대비 **재사용 vs 홈 전용** (`ConsultantNextSessionCard`, `ConsultantHomeKpiStrip` 등) 제안서. 중복 `StatCard`·`QuickActionBar` 정리. **코드 수정 없음.** |
| **2** | `core-designer` | 1-A·1-B **완료 후** | **`model: gemini-3.1-pro`**. 입력: 본 기획서 §3~§4, `CONSULTANT_CLIENT_SCREEN_WIREFRAMES.md` §1, explore·component-manager 산출. **화면설계서** `docs/design-system/SCREEN_SPEC_CONSULTANT_MOBILE_HOME.md`: P0/P1 레이아웃, TopBar·KPI strip·다음 상담·알림 스택·빠른 액션 3~5개, 토큰(`expo-app/src/theme`), 내담자 홈 시각 정렬, 접근성·스켈레ton·empty. **코드 없음.** |
| **3** | `core-coder` | 2 **완료 후** | **P0→P1 구현**: `index.tsx` 리팩터, `consultantHomeCopy.ts`, `consultantHomeKpi.ts`, endpoints·훅, `AppTopBar`·KPI·요약·빠른 액션 확장. 정책: `consultantRecordMobilePolicy`, `/core-solution-api`, `EXPO_APP_METRO_ALIAS_AND_MMKV_HANDOFF.md` §5. 하드coding 게이트: `PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`. **스코프: consultant home only.** |
| **4** | `core-tester` | 3 **완료 후** | 단위: `consultantHomeKpi`, pending 정합, copy. 정책: `consultantRecordMobilePolicy.test.ts` 확장. 통합: 홈 훅 mock. **실기기 UAT 체크리스트 §8 실행.** |

### Phase 1-A explore — 프롬프트 초안 (전문)

```
MindGarden expo-app 상담사 홈 API·훅 인벤토리.
참조: docs/project-management/CONSULTANT_MOBILE_HOME_CONTENT_ENHANCEMENT_ORCHESTRATION.md,
frontend/src/components/dashboard-v2/consultant/ConsultantDashboardV2.js,
frontend/src/constants/api.js (DASHBOARD_API, RATING_API),
expo-app/src/api/hooks/, expo-app/src/api/endpoints.ts.
산출: 마크다운 표 — (엔드포인트, 웹 사용 여부, Expo 훅, 갭, P0/P1/P2).
usePendingRecords 구현과 CONSULTANT_INCOMPLETE_RECORDS 응답 스키마 비교.
코드 수정 금지.
```

### Phase 1-B core-component-manager — 프롬프트 초안

```
상담사 Expo 홈 컴ponent 배치 제안.
SSOT: expo-app/app/(consultant)/(home)/index.tsx,
비교: expo-app/app/(client)/(home)/index.tsx,
frontend/.../ConsultantDashboardV2.js (NextConsultationCard, ContentKpiRow, QuickActionBar).
제안: Organism 후보, 기존 StatCard/ScheduleCard/QuickActionBar/AppTopBar 재사용 여부, 신규 컴ponent명·경로.
중복 제거·적재적소만, 코드 수정 없음.
```

### Phase 2 core-designer — 프롬프트 초안

```
model: gemini-3.1-pro
상담사 모바일 홈 화면설계. 기획: docs/project-management/CONSULTANT_MOBILE_HOME_CONTENT_ENHANCEMENT_ORCHESTRATION.md §3~4.
와이어: docs/design-system/v2/CONSULTANT_CLIENT_SCREEN_WIREFRAMES.md §1.
explore·component-manager 산출물 첨부.
산출: docs/design-system/SCREEN_SPEC_CONSULTANT_MOBILE_HOME.md (P0/P1, 사용성·정보노출·레이아웃, 토큰, 스켈레ton, a11y).
내담자 홈 AppTopBar·StatCard 톤 정렬. COMPLETED 일지 CTA 금지 명시.
코드/CSS 작성 없음.
```

### Phase 3 core-coder — 프롬프트 초안

```
상담사 Expo 홈 P0(+가능 시 P1) 구현.
설계: docs/design-system/SCREEN_SPEC_CONSULTANT_MOBILE_HOME.md.
화면: expo-app/app/(consultant)/(home)/index.tsx.
신규: consultantHomeCopy.ts, consultantHomeKpi.ts, 필요 훅·endpoints.
재사용: AppTopBar, StatCard, QuickActionBar, ScheduleCard, usePendingRecords, useUnreadMessageCount, useUnreadCount.
정책: consultantRecordMobilePolicy — COMPLETED 일지 홈 CTA 금지.
스킬: core-solution-api, core-solution-frontend, EXPO_APP_METRO_ALIAS_AND_MMKV_HANDOFF.md §5.
운영 게이트 하드coding 금지.
완료: tsc, verify:bundle:ci(해당 앱), 신규 유닛 테스트.
```

### Phase 4 core-tester — 프롬프트 초안

```
상담사 홈 강화 검증.
대상: consultantHomeKpi, consultantHomeCopy wiring, consultantRecordMobilePolicy(홈 CTA 없음).
기획 UAT §8 체크리스트 기준 실기기 시나리오 문서화·가능한 자동화.
스킬: core-solution-testing.
코드 구현은 실패 시 core-coder 위임 목록만.
```

---

## 8. 완료 기준·UAT 체크리스트 (상담사 실기기 5~8항)

### 완료 기준 (Definition of Done)

- [ ] P0 섹션(§3.3 MVP)이 `SCREEN_SPEC` 및 와이어 §1과 시각·동선 일치
- [ ] 모든 API 호출에 tenant·user 스코프; `endpoints.ts` 상수화
- [ ] COMPLETED 일지 홈·목록 CTA 없음 (정책 테스트 통과)
- [ ] Pull-to-refresh가 홈 주요 쿼리 invalidate
- [ ] `npm run verify:bundle:ci` (expo-app) 통과
- [ ] 신규 copy·KPI 유틸 유닛 테스트 존재

### UAT (상담사 계정·실기기)

1. **요약**: 로그인 후 홈에서 「오늘 N건의 상담」(또는 0건 문구)가 인사 아래 표시된다.
2. **미작성 일지**: 미작성 건이 있으면 배너 표시 → 탭 시 일지 탭(미완료만)으로 이동. COMPLETED만 있는 경우 배너 없음.
3. **오늘 스케줄**: 카드 탭·액션(입장/일지 등)이 기존과 동일하게 동작한다.
4. **빠른 액션**: 「일정 추가」→ 스케줄 탭, 「근무 설정」→ availability. (P1) 급여·메시지 링크 정상.
5. **알림 TopBar**: 시스템 알림 unread 시 배지 → 알림 화면 이동.
6. **(P1) KPI**: 미읽음 메시지 수가 KPI에 반영되고 0/오류 시 깨지지 않는다.
7. **(P1) 다음 상담**: 오늘 일정이 있으면 다음 1건 강조 카드에 시각·내담자명 표시.
8. **오프라인/에러**: API 실패 시 스켈레ton→empty 또는 부분 렌더; 앱 크래시 없음.

---

## 9. 저장·연계 문서

| 문서 | 경로 |
|------|------|
| **본 오케스트레이션 (이 문서)** | `docs/project-management/CONSULTANT_MOBILE_HOME_CONTENT_ENHANCEMENT_ORCHESTRATION.md` |
| **통합 Master** | [`MOBILE_ROLE_HOME_CONTENT_ENHANCEMENT_MASTER_ORCHESTRATION.md`](./MOBILE_ROLE_HOME_CONTENT_ENHANCEMENT_MASTER_ORCHESTRATION.md) |
| 화면설계서 (Phase 2) | `docs/design-system/SCREEN_SPEC_CONSULTANT_MOBILE_HOME.md` |
| 와이어 SSOT | `docs/design-system/v2/CONSULTANT_CLIENT_SCREEN_WIREFRAMES.md` |
| 일지 모바일 정책 | `expo-app/src/utils/consultantRecordMobilePolicy.ts` |
| 위임 순서 | `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md` |
| Expo Metro | `docs/project-management/EXPO_APP_METRO_ALIAS_AND_MMKV_HANDOFF.md` |

---

## 10. 실행 요청 (부모 에이전트용)

1. **병렬**: Phase **1-A** (`explore`) + **1-B** (`core-component-manager`)
2. **순차**: Phase **2** (`core-designer`, `model: gemini-3.1-pro`) → **3** (`core-coder`) → **4** (`core-tester`)
3. 각 Phase 완료 보고를 core-planner에 반환 후 사용자 검수

*문서 버전: 1.0 | 코드·커밋 없음 (기획 전용)*

# 어드민·스태프 Expo 모바일 홈 컨텐츠 강화 — 기획·오케스트레이션

| 항목 | 내용 |
|------|------|
| 작성일 | 2026-05-22 |
| 작성 | core-planner |
| 범위 | `expo-app/app/(admin)/(home)/index.tsx` 및 홈 전용·공유 컴포넌트·훅 |
| 제외 | 내담자·상담사 홈(별도 문서), 웹 어드민 전체 대체, ERP·설정·인프라 모니터링 네이티브화 |
| SSOT 참조 | `frontend/src/components/dashboard-v2/AdminDashboardV2.js`, `ADMIN_MOBILE_MVP_*`, `ADMIN_MOBILE_COMMERCIALIZATION_*` |
| 통합 마스터 | [`MOBILE_ROLE_HOME_CONTENT_ENHANCEMENT_MASTER_ORCHESTRATION.md`](./MOBILE_ROLE_HOME_CONTENT_ENHANCEMENT_MASTER_ORCHESTRATION.md) |
| 화면설계서(후속) | `docs/design-system/SCREEN_SPEC_ADMIN_MOBILE_HOME.md` (Phase 2 산출) |

---

## 1. 문제·목표

### 문제

어드민·스태프 Expo 홈(`expo-app/app/(admin)/(home)/index.tsx`)은 인사·날짜·테넌트 라벨, StatCard 2개(읽지 않은 알림·오늘 일정 건수), 스케줄 라이트 링크 1개, 탭 바로가기 4개(메시지·운영·더보기·알림 설정)만 제공한다. **AppTopBar 없음**, 오늘 일정 **목록 미리보기 없음**, 운영 탭·검수 탭·메시지 탭에 이미 있는 **매칭·결제 대기·커뮤니티 검수·마음날씨·사용자 관리**가 홈에 재노출되지 않아, 관리자가 앱을 열었을 때 “오늘 무엇을 처리해야 하는지”를 한 화면에서 파악하기 어렵고 **단조로운 인상**을 준다.

웹 `AdminDashboardV2`는 KPI 행·5단계 파이프라인·수동 매칭 큐·입금 대기·스케줄 대기·통합 데이터 등 **고밀도 운영 요약**을 제공하나, 모바일 MVP는 「조회·검수·알림·운영 탭 진입」에 고정되어 있다(`ADMIN_MOBILE_COMMERCIALIZATION_ORCHESTRATION.md` §2 비목표: 웹 어드민 대체 금지).

### 목표

웹 V2의 **우선순위·운영 큐 개념**을 모바일 라이트 IA에 맞게 재구성하여, ADMIN/STAFF가 홈 진입 **3초 이내**에 (1) 오늘 일정 규모·다음 일정 스냅샷, (2) 즉시 처리할 큐(매칭·결제·검수·메시지·알림), (3) 자주 쓰는 운영 단축 동작을 파악할 수 있게 한다. **기존 API·훅·컴ponent 우선 재사용**, 멀티테넌트·역할(ADMIN vs STAFF)·`counseling_enabled` 겸직 분기 준수, 하드코딩 금지를 전제로 한다. **미작성 일지 배너는 상담사 전용** — 어드민 홈에 넣지 않는다.

---

## 2. 벤치마크 — 웹 AdminDashboardV2 vs Expo admin home vs 어드민 MVP 범위

| 영역 | 웹 `AdminDashboardV2` | Expo admin home (현재) | 어드민 MVP·상용화 범위 | 갭·비고 |
|------|----------------------|------------------------|------------------------|---------|
| 상단 크롬 | ContentHeader + 헤더 아이콘(일정·알림) | SafeAreaView만, **AppTopBar 없음** | MVP: 홈·탭 셸 | 내담자·운영 서브화면은 `AppTopBar` 사용 — 홈만 불일치 |
| 인사·요약 | subtitle 「오늘의 주요 지표와 현황」 | 이름 + 날짜 + 테넌트 | MVP | **「오늘 N건 일정·M건 처리 대기」** 요약 문구 없음 |
| KPI 스트립 | ContentKpiRow: 총 사용자·오늘 예약·완료율 등 | StatCard 2개(알림·일정 건수) | MVP: 홈 StatCard 2개 | **메시지·대기 매핑·검수·마음날씨** KPI 미노출 |
| 운영 파이프라인 | AdminMetricsVisualization(매칭·입금·스케줄 대기) | 없음 | Phase 2: 매칭·결제·일정 등록 | P0: **건수만 KPI/배너**로 압축, 전체 파이프라인 차트는 제외 |
| 수동 매칭 큐 | `ManualMatchingQueue` | 운영→스케줄 허브 mappings 탭 | Phase 2 매칭 | P1: 대기 N건 + CTA |
| 입금·결제 대기 | `DepositPendingList` + pending-deposit API | 스케줄 허브·웹 브릿지 | Phase 2 결제 승인 | P1: 건수 KPI + `Linking` 브릿지 |
| 오늘 일정 | 통합 일정·최근 일정 위젯 | **건수만** + Pressable 링크 | MVP: 스케줄 라이트 | **1~3건 카드 미리보기** 없음 (`useAdminTodaySchedules` data 미사용) |
| 커뮤니티 검수 | (LNB·별도 화면) | 검수 **탭**(ADMIN만) | MVP BW-4 | 홈 미노출 — P1 KPI |
| 마음날씨 관측 | (웹 대시보드 일부) | 운영 허브(ADMIN only) | MVP Phase 2 | P1 KPI 또는 스냅샷(ADMIN) |
| 메시지 | KPI + 알림 | 메시지 **탭** | MVP | 홈 미읽음·최근 1건 없음 |
| 빠른 액션 | LNB·헤더·관리 카드 그리드 | 탭 4개(메시지·운영·더보기·알림) | MVP: 탭 허브 | **일정 등록·매칭·사용자 관리** 운영 CTA 부재 |
| 웹 전용 기능 | ERP·설정·통계·FullCalendar | `Linking` + `ADMIN_MOBILE_WEB_ROUTES` | 상용화 패턴 확립 | 조건부 「웹에서 열기」CTA만 |
| Pull-to-refresh | 수동 fetch | unread + today schedules | MVP | 큐·KPI 추가 시 invalidate 확장 |
| ADMIN vs STAFF | 권한·LNB | 검수 탭·마음날씨·매칭 조회 분기 | MVP SSOT | 홈에도 동일 게이트 반영 필요 |

---

## 3. 홈 IA 제안 (섹션 순서·우선순위)

### 3.1 사용자 관점 (§0.4 — 디자이너 전달용)

| 항목 | 내용 |
|------|------|
| **사용성** | ADMIN/STAFF는 **출근·현장·이동 중**에 홈을 연다. 1순위: 오늘 일정 몇 건·가장 가까운 일정. 2순위: 처리 대기(매칭·결제·검수·미읽음). 3순위: 일정 등록·매칭·사용자 조회·메시지. 스크롤 깊이 **2~3 화면 분량** 이내. |
| **정보 노출** | 테넌트 스코프 데이터만. STAFF: 검수·마음날씨·스태프 create **숨김**. 매칭·결제: `canViewMappingsOnMobile`·JWT 권한 없으면 KPI/CTA 숨김. PII는 스케줄 카드·사용자명 수준. ERP·통계·설정은 **웹 브릿지**만. |
| **레이아웃** | 상→하: **TopBar → 인사+운영 요약 → (긴급/대기 배너) → KPI 스트립 → 오늘 일정 미리보기 → (스냅샷 행) → 빠른 액션**. 내담자·상담사 홈과 `StatCard`·`QuickActionBar` 톤 정렬. |

### 3.2 섹션 목록 (Must / Should / Could × P0 / P1 / P2)

| 순서 | 섹션 | MoSCoW | 우선순위 | 설명 |
|------|------|--------|----------|------|
| 0 | **AppTopBar** (알림·프로필/더보기) | Must | **P0** | `useUnreadCount` 배지. 타이틀 `ADMIN_MOBILE_HOME_COPY.TITLE` |
| 1 | **인사 + 오늘 운영 요약** | Must | **P0** | 「오늘 일정 N건」+ (P1) 「처리 대기 M건」. `adminHomeCopy` 상수화 |
| 2 | **대기·긴급 배너 스택** | Should | **P1** | 입금/결제 대기·수동 매칭·검수 대기 — count>0일 때만. **미작성 일지 배너 금지** |
| 3 | **KPI 스트립** (가로 ScrollView) | Must | **P0~P1** | P0: 오늘 일정·읽지 않은 알림. P1: 미읽음 메시지·대기 매핑·검수 대기(ADMIN)·마음날씨(ADMIN) |
| 4 | **오늘 일정 카드 미리보기** | Must | **P0** | `useAdminTodaySchedules` 상위 1~3건. 「전체 보기」→ 스케줄 라이트 |
| 5 | **운영 스냅샷 행** | Could | **P1~P2** | 최근 운영 메시지 1건 / 검수 대기 1건 / 마음날씨 요약 1수치 — **2칸 이하** |
| 6 | **빠른 액션** | Must | **P0~P1** | P0: 일정 등록·스케줄 라이트·메시지. P1: 매칭·사용자 관리·(조건부) 웹 통합 일정 |
| 7 | ERP·통계·설정 | Won't (홈) | — | 웹 `Linking` only |
| 8 | 주간 차트·통합 데이터 랭킹 | Could | **P2** | 홈 제외 |

### 3.3 Phase별 구현 묶음 (권장)

| Phase | 포함 섹션 | 목표 |
|-------|-----------|------|
| **MVP (P0)** | 0,1,3(일정·알림),4,6(일정 등록·스케줄·메시지) | 홈 **정보 밀도 2배** — 미리보기·TopBar·운영 CTA |
| **P1** | 2,3 확장,5,6(매칭·사용자·웹 브릿지) | 웹 V2 **큐 인지적 패리티**(건수·CTA 수준) |
| **P2** | 5(마음날씨·통계 1수치), KPI 세분화 | 풍부함·ADMIN 전용 차별화 |

---

## 4. 역할별 정보 노출 (ADMIN vs STAFF, counseling_enabled 겸직)

| 정보 | ADMIN | STAFF | counseling_enabled ADMIN | 비고 |
|------|-------|-------|--------------------------|------|
| 오늘 테넌트 일정·미리보기 | ✅ | ✅ | ✅ (본인 consultantId 일정만 — API `userRole` SSOT) | `adminRole.ts` · `useAdminSchedules` |
| 읽지 않은 **시스템 알림** | ✅ | ✅ | ✅ | `useUnreadCount` |
| **운영 메시지** 미읽음·목록 | ✅ | ✅ (권한 있을 때) | ✅ | 메시지 탭 API; 403 시 KPI 숨김 |
| **매칭** 목록·대기 KPI | ✅ | ✅ (`canViewMappingsOnMobile`) | ✅ | JWT mapping 권한 없으면 숨김 |
| **결제·입금 대기** KPI·배너 | ✅ | ✅ (매칭 권한 동일) | ✅ | 웹 pending-deposit API explore 확인 |
| **커뮤니티 검수** 대기 KPI·스냅샷 | ✅ | ❌ | ✅ | `isAdminRole` · 검수 탭과 동일 |
| **마음날씨 관측** KPI·스냅샷 | ✅ | ❌ | ✅ | `useAdminMindWeatherObservability` |
| **사용자 관리** CTA | ✅ | ✅ (create 범위 제한) | ✅ | 스태프 create는 ADMIN only |
| **스태프 계정 생성** | ✅ | ❌ | ✅ | 빠른 액션·홈 배너 **비노출** |
| ERP·통계·시스템 설정 | 웹 브릿지만 | 동일 | 동일 | `ADMIN_MOBILE_WEB_ROUTES` |
| **미작성 상담 일지** 배너 | ❌ | ❌ | ❌ | **상담사 홈 전용** — 어드민 홈 금지 |
| 타 테넌트·타 역할 데이터 | ❌ | ❌ | ❌ | tenantId·JWT 필수 |

---

## 5. API·훅 매핑

### 5.1 DB-first 관점

홈 강화는 **신규 테이블 없이** 기존 스케줄·매칭·메시지·알림·검수·마음날씨 API를 **집계·스냅샷**하는 UI 레이어 작업이 원칙이다. 웹 `AdminDashboardV2`가 호출하는 admin statistics·pending-deposit 등은 explore Phase에서 Expo `endpoints.ts`·`ADMIN_MOBILE_API`와 **정합성**을 확인한다.

### 5.2 매핑 표

| UI 데이터 | Expo 기존 훅/유틸 | 백엔드·웹 SSOT | 재사용 | 신규/확장 |
|-----------|-------------------|----------------|--------|-----------|
| 오늘 일정 목록·건수 | `useAdminTodaySchedules` | `SCHEDULE_API` + admin `userRole` | ✅ | 홈에서 **목록 slice(1~3)** wiring |
| 읽지 않은 시스템 알림 | `useUnreadCount` | system-notifications unread | ✅ | TopBar·KPI |
| 홈 대시보드 집계 | `useAdminMobileDashboard` | — | ⚠️ | **확장**: 아래 훅 통합·refetchAll |
| 매칭 목록·대기 건수 | `useAdminMappings` + normalize filter | `ADMIN_MOBILE_API.MAPPINGS` | ✅ | `adminHomeKpi.ts` selector (PENDING 등) |
| 입금·결제 대기 | **없음**(홈) | 웹 `API_ADMIN_MAPPINGS_PENDING_DEPOSIT` | ⚠️ | explore → endpoints·훅 **신규** (P1) |
| 운영 메시지 미읽음 | `useMessages` / admin messages API | `consultation-messages/all?view=admin_ops` | ⚠️ | 홈용 unread count 파싱 (P1) |
| 커뮤니티 검수 대기 | `useAdminCommunityModerationQueue` | `ADMIN_COMMUNITY_API.MODERATION_QUEUE` | ✅ | count만 (ADMIN, P1) |
| 마음날씨 요약 | `useAdminMindWeatherSummary` 등 | `ADMIN_MOBILE_API.MIND_WEATHER_*` | ✅ | P1 1수치 (ADMIN) |
| 웹 통합 일정·매칭 관리 | `buildAdminWebUrl`, `openAdminWebMappingPayment` | `ADMIN_MOBILE_WEB_ROUTES` | ✅ | 조건부 Linking CTA |
| 사용자·통계 KPI | **없음** | 웹 dashboard stats APIs | ⚠️ | P2 — 홈 제외 또는 1수치만 |

### 5.3 `useAdminMobileDashboard` 확장 vs 신규

| 방안 | 내용 | 권장 |
|------|------|------|
| **A. 기존 훅 확장** | `useAdminMobileDashboard`에 schedules **배열**·pending counts·loading flags·`refetchAll` 통합 | **P0 권장** — 홈 SSOT 단일 |
| **B. `useAdminHome` 신규** | 집계 전용 훅, dashboard는 deprecated | P1 이상 API 폭증 시 |
| **C. `adminHomeKpi.ts` 유틸** | 훅 raw data → KPI 숫자·배너 visible (상담사 `clientHomeKpi` 대칭) | **P0 병행** |

**파일 배치 (코더 가이드 — 경계만)**

| 계층 | 경로 |
|------|------|
| 화면 | `expo-app/app/(admin)/(home)/index.tsx` |
| copy | `expo-app/src/constants/adminHomeCopy.ts` (신규, `ADMIN_MOBILE_HOME_COPY` 이전·확장) |
| KPI 유틸 | `expo-app/src/utils/adminHomeKpi.ts` (신규) |
| 훅 | `expo-app/src/api/hooks/useAdminDashboard.ts` 확장 |
| 스케줄 카드 | `ScheduleCard` 또는 admin 전용 thin wrapper (explore) |
| 컴ponent | `StatCard`, `QuickActionBar`, `AppTopBar` 재사용 |

---

## 6. 리스크·제약

| 리스크 | 완화 |
|--------|------|
| 홈 API 병렬 호출 증가 | KPI `staleTime` 공유·스켈레ton strip·`enabled` 역할 게이트 |
| STAFF 403 on mappings/messages | `canViewMappingsOnMobile`·403 시 KPI 숨김 (카드 깨짐 금지) |
| 웹 pending-deposit API Expo 미연동 | explore Phase 1-A에서 endpoints 대조 후 P1 |
| `counseling_enabled` ADMIN 일정 범위 | `useAdminSchedules` 기존 JWT role SSOT 유지 |
| 하드coding copy·색상 | `adminHomeCopy`·`theme.colors`·`adminTheme` |
| Metro alias/MMKV | 코더: `EXPO_APP_METRO_ALIAS_AND_MMKV_HANDOFF.md` §5 |
| tenantId 없음 | `useAdminApiQueryReady` — empty·skip |
| 상담사 일지 배너 혼입 | UAT·코드 리뷰에서 **어드민 홈 금지** 명시 |
| 웹 기능 네이티브 복제 유혹 | `ADMIN_MOBILE_COMMERCIALIZATION` §2 비목표 준수 |

---

## 7. 분배실행표

> **호출 주체**: 부모 에이전트. 의존성 없는 Phase는 **병렬** 가능.  
> 디자인 Task는 **`model: "gemini-3.1-pro"`** 권장.

| Phase | subagent | 병렬 | 전달 프롬프트 요약 |
|-------|----------|------|-------------------|
| **1-A** | `explore` | ✅ 1-B·1-C와 병렬 | **API·훅 인벤토리**: `useAdminDashboard`, `useAdminSchedules`, `useAdminMappings`, `useAdminCommunityModeration`, `useAdminMindWeather*`, `endpoints.ts`, 웹 `AdminDashboardV2.js` pending-deposit·stats 경로. 산출: (1) 홈 P0/P1 엔드포인트 표 (2) STAFF 403·매핑 권한 매트릭스 (3) `useAdminMobileDashboard` 확장 필드 목록 (4) 스케줄 미리보기 재사용 컴ponent 후보. **코드 수정 없음.** |
| **1-B** | `core-component-manager` | ✅ 1-A·1-C와 병렬 | **컴ponent 배치**: admin home vs client/consultant home vs 웹 B0KlA. `AdminHomeKpiStrip`, `AdminTodaySchedulePreview`, `AdminOpsBannerStack` 등 Organism 후보. `StatCard`·`QuickActionBar`·`AppTopBar` 재사용. **코드 수정 없음.** |
| **1-C** | `generalPurpose` | ✅ 1-A·1-B와 병렬 | **문서 링크**: `CONSULTANT_MOBILE_HOME_CONTENT_ENHANCEMENT_ORCHESTRATION.md` §9에 Master 문서 링크 1줄 추가. 스킬: `/core-solution-documentation`. **해당 1줄만.** |
| **2** | `core-designer` | 1-A·1-B **완료 후** | **`model: gemini-3.1-pro`**. 입력: 본 기획서 §3~§4, explore·component-manager 산출, `ADMIN_MOBILE_COMMERCIALIZATION_DESIGN_HANDOFF`. **화면설계서** `docs/design-system/SCREEN_SPEC_ADMIN_MOBILE_HOME.md`: P0/P1, TopBar·KPI·일정 미리보기·배너·빠른 액션, ADMIN/STAFF 변형, 토큰(`adminTheme`), 스켈레ton·empty·403 숨김. **코드 없음.** |
| **3** | `core-coder` | 2 **완료 후** | **P0→P1 구현**: admin home `index.tsx`, `adminHomeCopy.ts`, `adminHomeKpi.ts`, `useAdminMobileDashboard` 확장, AppTopBar·KPI·일정 미리보기·빠른 액션. 정책: `/core-solution-api`, `EXPO_APP_METRO_ALIAS_AND_MMKV_HANDOFF.md` §5, `PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`. **스코프: admin home only.** 상담사 일지 배너 **금지**. |
| **4** | `core-tester` | 3 **완료 후** | 단위: `adminHomeKpi`, copy, STAFF/ADMIN 게이트. 통합: dashboard 훅 mock. **UAT §8** ADMIN·STAFF 각 1회. |

### Phase 1-A explore — 프롬프트 초안

```
MindGarden expo-app 어드민 홈 API·훅 인벤토리.
참조: docs/project-management/ADMIN_MOBILE_HOME_CONTENT_ENHANCEMENT_ORCHESTRATION.md,
frontend/src/components/dashboard-v2/AdminDashboardV2.js,
expo-app/src/api/hooks/useAdmin*.ts, expo-app/src/api/endpoints.ts,
expo-app/src/utils/adminRole.ts.
산출: 마크다운 표 — (UI 데이터, Expo 훅, 엔드포인트, 웹 사용, P0/P1/P2, STAFF 노출).
pending-deposit·dashboard stats 웹 전용 API Expo 연동 가능 여부.
코드 수정 금지.
```

### Phase 2 core-designer — 프롬프트 초안

```
model: gemini-3.1-pro
어드민·스태프 모바일 홈 화면설계.
기획: docs/project-management/ADMIN_MOBILE_HOME_CONTENT_ENHANCEMENT_ORCHESTRATION.md §3~4.
벤치: frontend AdminDashboardV2 B0KlA, expo client home AppTopBar·StatCard.
explore·component-manager 산출 첨부.
산출: docs/design-system/SCREEN_SPEC_ADMIN_MOBILE_HOME.md (P0/P1, ADMIN vs STAFF, 미작성 일지 배너 금지).
코드/CSS 작성 없음.
```

---

## 8. 완료 기준·UAT 체크리스트 (어드민·스태프 실기기 8항)

### 완료 기준 (Definition of Done)

- [ ] P0 섹션(§3.3 MVP)이 `SCREEN_SPEC_ADMIN_MOBILE_HOME`과 시각·동선 일치
- [ ] 모든 API 호출 tenant·역할 스코프; `endpoints.ts` 상수화
- [ ] **미작성 일지 배너 없음** (상담사 전용)
- [ ] STAFF: 검수·마음날씨 KPI/CTA 없음; 403 API는 empty·숨김
- [ ] Pull-to-refresh가 홈 주요 쿼리 invalidate
- [ ] `npm run verify:bundle:ci` (expo-app) 통과
- [ ] `adminHomeKpi`·copy 유닛 테스트 존재

### UAT

1. **요약**: ADMIN 로그인 후 홈에서 「오늘 N건 일정」 요약이 인사 아래 표시된다.
2. **일정 미리보기**: 오늘 일정 1건 이상일 때 카드 1~3건 표시 → 탭 시 스케줄 라이트 상세와 일치.
3. **TopBar 알림**: 시스템 알림 unread 시 배지 → 알림 설정/관련 화면 이동.
4. **빠른 액션 P0**: 「일정 등록」→ create, 「스케줄」→ schedule index, 「메시지」→ messages 탭.
5. **STAFF 회귀**: STAFF 계정 — 검수 탭·검수 KPI 없음; 운영·홈 크래시 없음.
6. **(P1) 매칭 KPI**: 매칭 권한 있는 계정에서 대기 건수 표시; 없으면 KPI 숨김.
7. **(P1) ADMIN 검수**: 검수 대기>0 시 KPI 또는 배너 → 검수 탭 이동.
8. **오프라인/에러**: API 실패 시 스켈레ton→empty; 부분 렌더; 앱 크래시 없음.

---

## 9. 저장·연계 문서

| 문서 | 경로 |
|------|------|
| **본 오케스트레이션** | `docs/project-management/ADMIN_MOBILE_HOME_CONTENT_ENHANCEMENT_ORCHESTRATION.md` |
| **통합 마스터** | `docs/project-management/MOBILE_ROLE_HOME_CONTENT_ENHANCEMENT_MASTER_ORCHESTRATION.md` |
| 화면설계서 (Phase 2) | `docs/design-system/SCREEN_SPEC_ADMIN_MOBILE_HOME.md` |
| 어드민 MVP | `docs/project-management/ADMIN_MOBILE_MVP_*` |
| 상용화·웹 브릿지 | `docs/project-management/ADMIN_MOBILE_COMMERCIALIZATION_*` |
| 위임 순서 | `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md` |

---

## 10. 실행 요청 (부모 에이전트용)

1. **병렬**: Phase **1-A** + **1-B** + **1-C**
2. **순차**: Phase **2** (`core-designer`, `model: gemini-3.1-pro`) → **3** (`core-coder`) → **4** (`core-tester`)
3. 상담사 홈 Phase와 **P0 병렬 가능** — Master 문서 §4 참조
4. 각 Phase 완료 보고를 core-planner에 반환 후 사용자 검수

*문서 버전: 1.0 | 코드·커밋 없음 (기획 전용)*

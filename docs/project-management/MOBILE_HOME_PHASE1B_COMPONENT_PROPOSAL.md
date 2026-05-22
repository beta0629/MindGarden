# 모바일 홈 Phase 1-B — 컴포넌트 배치·중복 제안

| 항목 | 내용 |
|------|------|
| 작성일 | 2026-05-22 |
| 작성 | core-component-manager |
| SSOT | [`MOBILE_ROLE_HOME_CONTENT_ENHANCEMENT_MASTER_ORCHESTRATION.md`](./MOBILE_ROLE_HOME_CONTENT_ENHANCEMENT_MASTER_ORCHESTRATION.md) §4, [`CONSULTANT_MOBILE_HOME_CONTENT_ENHANCEMENT_ORCHESTRATION.md`](./CONSULTANT_MOBILE_HOME_CONTENT_ENHANCEMENT_ORCHESTRATION.md) §3, [`ADMIN_MOBILE_HOME_CONTENT_ENHANCEMENT_ORCHESTRATION.md`](./ADMIN_MOBILE_HOME_CONTENT_ENHANCEMENT_ORCHESTRATION.md) §3 |
| 범위 | 상담사·어드민·스태프 Expo 홈 컴ponent 재사용·신규 Organism 후보·중복 정리 |
| 제외 | 코드 수정, 디자인 시안, 테스트 구현 |
| 벤치마크 | `expo-app/app/(client)/(home)/index.tsx` (패턴 참조) |

---

## 1. 현황 요약

| 역할 | 화면 | AppTopBar | KPI | 배너 | 스케줄 목록 | 빠른 액션 |
|------|------|-----------|-----|------|-------------|-----------|
| **내담자** (벤치) | `(client)/(home)/index.tsx` | ✅ | 가로 ScrollView + `atoms/StatCard` ×3 | — | `ConsultationCard` + `CountdownTimer` | 없음 |
| **상담사** | `(consultant)/(home)/index.tsx` | ❌ | 없음 | 인라인 미작성 일지 `Pressable` | `ScheduleCard` + FlashList (전체) | `QuickActionBar` ×2 |
| **어드민** | `(admin)/(home)/index.tsx` | ❌ | `flexDirection: 'row'` + `atoms/StatCard` ×2 | 없음 | Pressable 링크만 (목록 미사용) | `QuickActionBar` ×4 (탭 허브) |

공통 갭: 상담사·어드민 홈 모두 **AppTopBar 미적용**, KPI 레이아웃이 내담자 홈과 **불일치**(어드민은 2칸 고정 row, 상담사는 KPI 없음).

---

## 2. 역할별 홈 섹션 → 컴ponent 매핑

> **범례**: 재사용 = 기존 파일 그대로 wiring / 후보 = P0~P1 신규 추출·Organism / 금지 = Master §3 교차 배치 금지

### 2.1 상담사 (CONSULTANT)

| 순서 | 섹션 (ORCH §3.2) | 우선순위 | 기존 재사용 | 신규 Organism·Molecule 후보 | 배치 경로 제안 |
|------|------------------|----------|-------------|----------------------------|----------------|
| 0 | AppTopBar (알림·프로필) | P0 | `app-chrome/AppTopBar` + `useUnreadCount` | — | `components/app-chrome/` (기존) |
| 1 | 인사 + 「오늘 N건」 요약 | P0 | `Text` + `useConsultantDashboard().todayCount` | `MobileHomeGreetingBlock` (선택, 3역할 공통 후보) | P0: 화면 인라인 / follow-up: `organisms/mobile-home/` |
| 2a | 미작성 일지 배너 | P0 | 인라인 `Pressable` + `AlertTriangle` (현재) | **`ConsultantPendingRecordsBanner`** (Molecule) | `components/molecules/` |
| 2b | 긴급 내담자 1줄 | P1 | — | **`ConsultantUrgentClientBanner`** (Molecule) | `components/molecules/` |
| 3 | KPI 스트립 | P0~P1 | `atoms/StatCard`, `SkeletonLoader`, 가로 `ScrollView` (client home 패턴) | **`ConsultantHomeKpiStrip`** (Organism, P0는 화면 인라인 가능) | P0: `(consultant)/(home)/index.tsx` / follow-up: `organisms/mobile-home/ConsultantHomeKpiStrip.tsx` |
| 4 | 다음 상담 카드 | P1 | `CountdownTimer` (atom/molecule), `Schedule` 타입 | **`ConsultantNextSessionCard`** (Organism) — client `ConsultationCard`와 **별도** (상담사 액션·일지 CTA) | `components/organisms/mobile-home/` |
| 5 | 오늘 스케줄 목록 | P0 | `ScheduleCard`, `EmptyState`, `SkeletonCard`, FlashList, `consultantScheduleCardUi` | **`MobileHomeSectionHeader`** (선택: 제목+건수+「전체 보기」) | `ScheduleCard` → `molecules/` (기존) |
| 7 | 활동 스냅샷 행 | P1~P2 | — | **`ConsultantHomeSnapshotRow`** (Organism, 2칸 이하) | `organisms/mobile-home/` |
| 8 | 빠른 액션 | P0~P1 | `QuickActionBar` | — | `molecules/QuickActionBar` (기존) |

**상담사 KPI 스트립 P0 항목 (StatCard props만):**

| KPI | 데이터 | onPress 목적지 |
|-----|--------|----------------|
| 오늘 상담 | `todayCount` / schedules.length | `/(consultant)/(schedule)/` |
| 미읽음 메시지 | `useUnreadMessageCount` (P0 wiring 또는 P1) | 메시지 탭 |

**상담사 빠른 액션 P0 확장 (QuickActionBar actions 배열):**

| 액션 | 아이콘 후보 | 라우트 |
|------|-------------|--------|
| 일정 추가 | `CalendarPlus` | `/(consultant)/(schedule)/` |
| 근무 설정 | `Clock` | `/(consultant)/(more)/availability` |
| (P1) 메시지 | `MessageSquare` | consultant messages |
| (P1) 일지 작성 | `FileEdit` | `/(consultant)/(records)/` |
| (P1) 급여 정산 | `Wallet` | `/(consultant)/(more)/salary-settlement` (조건부) |

### 2.2 어드민·스태프 (ADMIN/STAFF)

| 순서 | 섹션 (ORCH §3.2) | 우선순위 | 기존 재사용 | 신규 Organism·Molecule 후보 | 배치 경로 제안 |
|------|------------------|----------|-------------|----------------------------|----------------|
| 0 | AppTopBar | P0 | `app-chrome/AppTopBar` + `useUnreadCount` | — | `components/app-chrome/` |
| 1 | 인사 + 운영 요약 | P0 | `Text` + `toDisplayString`, `ADMIN_MOBILE_HOME_COPY` | `adminHomeCopy.ts` (상수, 컴ponent 아님) + 선택 `MobileHomeGreetingBlock` | `constants/adminHomeCopy.ts` |
| 2 | 대기·긴급 배너 스택 | P1 | — | **`AdminOpsBannerStack`** (Organism): 매칭·입금·검수 각 Molecule | `organisms/mobile-home/AdminOpsBannerStack.tsx` |
| 3 | KPI 스트립 | P0~P1 | `atoms/StatCard` (`showAccentBar`), `SkeletonLoader` | **`AdminHomeKpiStrip`** (Organism) — **현재 2칸 row → 가로 ScrollView로 client 정렬** | P0: 화면 인라인 / follow-up: `organisms/mobile-home/` |
| 4 | 오늘 일정 미리보기 | P0 | `ScheduleCard` (read-only, **action 없음**), `EmptyState`, FlashList — **스케줄 허브와 동일 props 패턴** | **`AdminTodaySchedulePreview`** (Organism: 헤더+slice(1~3)+「전체 보기」) | `organisms/mobile-home/AdminTodaySchedulePreview.tsx` |
| 5 | 운영 스냅샷 행 | P1~P2 | — | **`AdminHomeSnapshotRow`** | `organisms/mobile-home/` |
| 6 | 빠른 액션 | P0~P1 | `QuickActionBar` | — | `molecules/QuickActionBar` — **탭 허브 4개 → 운영 CTA로 교체** |
| — | 스케줄 라이트 링크 Pressable | P0 **제거·대체** | 현재 단독 Pressable | `AdminTodaySchedulePreview` 「전체 보기」로 **흡수** | 홈 index에서 삭제 |

**어드민 KPI (역할 게이트 반영):**

| KPI | ADMIN | STAFF | P |
|-----|-------|-------|---|
| 오늘 일정 | ✅ | ✅ | P0 |
| 읽지 않은 알림 | ✅ | ✅ | P0 |
| 미읽음 메시지 | ✅ | ✅ (403 시 숨김) | P1 |
| 대기 매핑 | ✅ | ✅ (`canViewMappingsOnMobile`) | P1 |
| 검수 대기 | ✅ | ❌ | P1 |
| 마음날씨 | ✅ | ❌ | P1 |

**어드민 ScheduleCard read-only 규칙:** `expo-app/app/(admin)/(operation)/schedule/index.tsx`와 동일 — `actionLabel`/`onActionPress` **미전달**, `clientName`에 `내담자 · 상담사` 병기.

**어드민 빠른 액션 P0 (QuickActionBar 교체안):**

| 액션 | 라우트 |
|------|--------|
| 일정 등록 | `/(admin)/(operation)/schedule/create` |
| 스케줄 | `/(admin)/(operation)/schedule` |
| 메시지 | `/(admin)/(messages)` |
| (P1) 매칭 | `/(admin)/(operation)/schedule?tab=mappings` |
| (P1) 사용자 관리 | `/(admin)/(operation)/user-management` |

---

## 3. 공통 추출 후보 및 P0 블로커 여부

| 후보 | 계층 | 설명 | P0 블로커 | 권장 타이밍 |
|------|------|------|-----------|-------------|
| **`MobileHomeKpiStrip`** | Organism | 가로 `ScrollView` + `StatCard[]` + 로딩 `SkeletonLoader` + `gap`/`minWidth` — client home L235~265 패턴 추상화 | **아니오** | P0: 각 역할 홈 index **인라인 복제** 허용. 양 역할 P0 완료 후 diff 30%+ 중복 시 follow-up (Master §4) |
| **`MobileHomeGreetingBlock`** | Molecule | `accessibilityRole="header"` 인사 + 날짜 + (선택) 요약 1줄 | **아니오** | P1 또는 follow-up — 역할별 copy·테넌트 라벨 차이 |
| **`MobileHomeSectionHeader`** | Molecule | 섹션 제목 + `(N건)` + optional 「전체 보기」 Pressable | **아니오** | P0 인라인 가능 |
| **`MobileHomeAlertBanner`** | Molecule | error tint 배경 + icon + message + chevron — 상담사 미작성 일지·어드민 ops 배너 공통 shell | **아니오** | P1 `AdminOpsBannerStack`과 함께 검토 |
| **`consultantHomeCopy` / `adminHomeCopy`** | constants | `clientHomeCopy.ts` 대칭 | **예 (간접)** | P0 코더 **필수** — 하드coding 게이트 |
| **`consultantHomeKpi.ts` / `adminHomeKpi.ts`** | utils | KPI 숫자·visible·onPress route selector | **예 (간접)** | P0 코더 **필수** |

**결론:** `MobileHomeKpiStrip` 등 UI Organism 공통화는 **P0 블로커가 아님**. P0는 기존 atom/molecule 조합 + 역할별 copy/kpi utils + 화면 wiring으로 충분. 공통 Organism 추출은 **core-coder P0 완료 후** component-manager + coder follow-up Phase.

---

## 4. 중복·통합 제안

### 4.1 StatCard — 3역할 (중복 **있음**, 통합 필요)

| 경로 | 계층 | 사용처 | 특징 |
|------|------|--------|------|
| **`components/atoms/StatCard.tsx`** | Atom ✅ SSOT | client home, admin home, client meditation | `onPress`, `showAccentBar`, `unit`, `icon` ReactNode, KPI 가로 스크롤 |
| **`components/molecules/StatCard.tsx`** | Molecule (레거시) | consultant `session-kpi.tsx` only | `LucideIcon` 타입, `FadeInDown`, flex:1 그리드, onPress 없음 |

**제안:**

1. **홈·KPI 신규 wiring은 반드시 `atoms/StatCard`** — 상담사·어드민 P0 포함.
2. **`molecules/StatCard`는 follow-up에서 deprecate** — `session-kpi.tsx`를 atoms API로 마이그레이션 후 molecules 파일 삭제 (P0 스코프 **외**, 단일 PR).
3. **import 통일 규칙**: `@/components/atoms/StatCard` only. molecules 경로 **신규 사용 금지**.

**3역할 KPI 레이아웃 통일:**

| 역할 | 현재 | P0 목표 |
|------|------|---------|
| Client | 가로 ScrollView, minWidth 110 | 유지 (벤치) |
| Consultant | 없음 | client와 동일 ScrollView 패턴 |
| Admin | 2칸 `flex:1` row | **ScrollView로 전환** (P1 KPI 추가 대비) |

### 4.2 QuickActionBar — 3역할 (중복 **없음**, 설정만 분기)

| 역할 | 현재 actions | 이슈 | 제안 |
|------|--------------|------|------|
| Consultant | 2 (스케줄·근무) | ORCH P0 「일정 추가」 누락 | actions 배열 확장만 — **컴ponent 변경 불필요** |
| Admin | 4 (메시지·운영·더보기·알림) | 탭 중복·운영 CTA 부재 | P0에서 **일정 등록·스케줄·메시지**로 교체 |
| Client | 미사용 | — | 변경 없음 |

**제안:** `QuickActionBar` molecule **유지**. 역할별 차이는 **actions prop + copy constants**로만 분기. 5개 초과 시 designer와 `justifyContent`/`minWidth` overflow 검토 (현재 `space-around`).

### 4.3 ScheduleCard vs ConsultationCard (역할 분리 유지)

| 컴ponent | 역할 | 통합 |
|----------|------|------|
| `ConsultationCard` | Client (내담자 시점, Avatar·상담사명) | **통합 금지** |
| `ScheduleCard` | Consultant + Admin (운영·상담사 시점, 액션·footerHint) | Admin 홈·허브 **재사용** |

Admin 홈 미리보기는 **신규 카드 만들지 않고** `ScheduleCard` read-only wiring.

### 4.4 AppTopBar 알림 배지 (client home 인라인 vs 공통화)

Client home은 `AppTopBar` `rightAction`에 **인라인** notification dot 구현 (L84~98). Consultant·Admin P0도 **동일 패턴 복제** 허용.

Follow-up (선택): `AppTopBarNotificationAction` molecule — **P0 블로커 아님**.

### 4.5 미작성 일지 배너 (상담사 전용)

현재 consultant home **인라인 40줄** (`alertBanner` StyleSheet). **`ConsultantPendingRecordsBanner`** Molecule 추출 권장 — 어드민 재사용 **금지** (§5).

---

## 5. 배치 금지 (교차 역할)

Master §3 「역할별 배너 정책」 및 ORCH §4 준수.

| UX 요소 | 상담사 홈 | 어드민·스태프 홈 |
|---------|-----------|------------------|
| **미작성 일지 배너** | ✅ `ConsultantPendingRecordsBanner` | ❌ **절대 금지** — `usePendingRecords`·consultant records 라우트 wiring 금지 |
| **매칭·결제·입금 대기 배너/KPI** | ❌ **금지** | ✅ P1 `AdminOpsBannerStack` |
| **커뮤니티 검수 대기** | ❌ **금지** | ✅ ADMIN only |
| **긴급 내담자 배너** | ✅ P1 | ❌ **금지** |
| **ERP·통계·FullCalendar** | ❌ | ❌ (웹 `Linking` only) |

**코더·테스터 검증:** 어드민 `(admin)/(home)/index.tsx`에 `usePendingRecords`, `AlertTriangle`+「미작성 일지」copy, `/(consultant)/(records)` import **0건** 유지.

---

## 6. 신규 디렉터리·파일 배치 (코더 가이드)

```
expo-app/src/
├── components/
│   ├── app-chrome/AppTopBar.tsx          # 기존 — 홈 P0
│   ├── atoms/StatCard.tsx                # KPI SSOT
│   ├── atoms/EmptyState.tsx
│   ├── atoms/SkeletonLoader.tsx
│   ├── molecules/QuickActionBar.tsx
│   ├── molecules/ScheduleCard.tsx
│   ├── molecules/ConsultantPendingRecordsBanner.tsx   # P0 권장 (신규)
│   └── organisms/mobile-home/            # 신규 패키지 (P1·follow-up)
│       ├── AdminTodaySchedulePreview.tsx # P0
│       ├── ConsultantNextSessionCard.tsx # P1
│       ├── AdminOpsBannerStack.tsx       # P1
│       ├── MobileHomeKpiStrip.tsx        # follow-up (P0 블로커 아님)
│       └── index.ts                      # barrel (선택)
├── constants/
│   ├── consultantHomeCopy.ts             # P0 신규
│   └── adminHomeCopy.ts                  # P0 (ADMIN_MOBILE_HOME_COPY 이전·확장)
└── utils/
    ├── consultantHomeKpi.ts              # P0 신규
    └── adminHomeKpi.ts                   # P0 신규
```

**아토믹 계층 정합:**

| 계층 | 홈 관련 |
|------|---------|
| Atom | StatCard, EmptyState, SkeletonLoader, Badge (ScheduleCard 내부) |
| Molecule | QuickActionBar, ScheduleCard, ConsultantPendingRecordsBanner, CountdownTimer |
| Organism | AdminTodaySchedulePreview, *HomeKpiStrip, *BannerStack, *NextSessionCard |
| Page | `(consultant|admin)/(home)/index.tsx` — ScrollView·RefreshControl·섹션 조립만 |

웹 `ContentHeader` / `ContentKpiRow` Organism **이식 금지** — copy row + StatCard strip으로 경량화 (Master §4).

---

## 7. core-designer · core-coder 전달 체크리스트 (5항)

Phase 2 designer · Phase 3 coder 프롬프트에 **아래 5항을 그대로 포함**할 것.

1. **벤치마크 고정:** 시각·spacing SSOT는 **`(client)/(home)/index.tsx`** — `AppTopBar` 높이 52, KPI 가로 ScrollView + `atoms/StatCard` minWidth ~110, `theme.spacing`/`borderRadius.xl`. 어드민 `statsRow` 2칸 flex 레이아웃은 **폐기**하고 client 패턴으로 정렬.

2. **StatCard 단일 SSOT:** 모든 홈 KPI는 `@/components/atoms/StatCard` (`showAccentBar`, `onPress`). `molecules/StatCard` 참조 금지. Admin·Consultant KPI 2~4칸은 **가로 스크롤** 스펙으로 SCREEN_SPEC에 명시.

3. **교차 배치 금지 명문화:** SCREEN_SPEC에 「어드민: 미작성 일지 배너 없음」「상담사: 매칭·검수·입금 큐 없음」을 **레이아웃 와이어 주석**으로 기재. Designer 산출물 UAT 교차 검증 항목과 1:1 연결.

4. **ScheduleCard 이중 모드:** Consultant = `consultantScheduleCardUi` 액션·footerHint **유지**. Admin home preview = schedule hub와 동일 **read-only** (action props 없음, `내담자 · 상담사` 라벨). ConsultationCard와 **합치지 않음**.

5. **P0 스코프 vs follow-up 분리:** P0 coder는 **`MobileHomeKpiStrip` Organism 추출 없이** 화면 index + `*HomeCopy.ts` + `*HomeKpi.ts` + 기존 molecule 조합으로 완료. 공통 strip·`molecules/StatCard` 제거·`ConsultantPendingRecordsBanner` 추출은 **선택(P0 권장)이나 P0 실패 사유 아님**. `endpoints.ts`·`StatCard` atom 수정은 **양 역할 PR 충돌 주의**(Master §5).

---

## 8. Phase 연계

| Phase | 담당 | 본 문서 활용 |
|-------|------|--------------|
| 1-A | explore | API·훅 ↔ §2 KPI 데이터 열 정합 |
| **1-B** | **component-manager** | **본 문서** |
| 2 | core-designer | §2 표 + §5 금지 + §7 체크리스트 → SCREEN_SPEC |
| 3 | core-coder | §6 경로 + §4 StatCard SSOT + §7 체크리스트 |
| 4 | core-tester | §5 교차 금지 UAT + §2 역할 게이트 |
| 7 (optional) | component-manager + coder | §3 `MobileHomeKpiStrip` follow-up |

---

## 9. 연계 문서

| 문서 | 경로 |
|------|------|
| 통합 Master | `docs/project-management/MOBILE_ROLE_HOME_CONTENT_ENHANCEMENT_MASTER_ORCHESTRATION.md` |
| 상담사 ORCH | `docs/project-management/CONSULTANT_MOBILE_HOME_CONTENT_ENHANCEMENT_ORCHESTRATION.md` |
| 어드민 ORCH | `docs/project-management/ADMIN_MOBILE_HOME_CONTENT_ENHANCEMENT_ORCHESTRATION.md` |
| 내담자 홈 copy 벤치 | `expo-app/src/constants/clientHomeCopy.ts` |
| 일지 모바일 정책 | `expo-app/src/utils/consultantRecordMobilePolicy.ts` |
| 아토믹 디자인 | `.cursor/skills/core-solution-atomic-design/SKILL.md` |

---

*문서 버전: 1.0 | 코드 수정 없음 (제안·배치 전용)*

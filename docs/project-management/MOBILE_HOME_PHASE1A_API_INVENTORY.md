# 모바일 홈 Phase 1-A — API·훅 인벤토리

| 항목 | 내용 |
|------|------|
| 작성일 | 2026-05-22 |
| 작성 | explore (Phase 1-A) |
| 범위 | Expo 상담사·어드민·스태프 홈 |
| SSOT | `MOBILE_ROLE_HOME_CONTENT_ENHANCEMENT_MASTER_ORCHESTRATION.md` |

---

## 1. 상담사 — 핵심 갭

| 영역 | 현재 Expo | 웹 V2 | P0/P1 |
|------|-----------|-------|-------|
| 오늘 N건·통계 | `todayCount` = 목록 length, **UI 미사용** | `CONSULTANT_STATS` | P0 표시, P1 stats API |
| AppTopBar·알림 | 없음 | unread | P0 `useUnreadCount` |
| 미작성 일지 | `usePendingRecords` (엔티티 API) | `incomplete-records` | P0 유지, P1 웹 SSOT 정합 |
| KPI·다음 상담·긴급 내담자 | 없음 | Phase1 7종 | P1 |
| 평점·upcoming·메시지 홈 | 훅/상수 일부만 (더보기) | 연동됨 | P1 wiring |

**Expo `endpoints.ts`**: 웹 `DASHBOARD_API` Phase1·통계·upcoming **상수 묶음 추가 필요** (P0~P1).

**권장**: 홈 집계에 `useApiQueryReady({ requireUserId: true })` SSOT (내담자 홈과 동일).

---

## 2. 어드민·스태프 — 핵심 갭

| 영역 | 현재 Expo | 웹 V2 | P0/P1 |
|------|-----------|-------|-------|
| 오늘 일정 | **건수만** StatCard, `Schedule[]` 미사용 | 테넌트 일정 | **P0 미리보기 1~3건** |
| AppTopBar | 없음 | — | P0 |
| 운영 요약 문구 | 없음 | 큐 개념 | P0 |
| 입금·결제 대기 | 없음 | `pending-deposit` | P1 API+훅 |
| 매칭·검수·마음날씨 | 탭만 (`useAdminMappings` 등) | KPI | P1 selector |
| 메시지 unread (운영) | 탭 인라인 | all API | P1 파싱 유틸 |

**`useAdminMobileDashboard` P0 확장**: `todaySchedules` slice(0,3), `refetchAll` 확장, `adminHomeKpi.ts` (client 대칭).

**STAFF**: `pending-deposit`·검수·마음날씨 KPI **숨김** (403/역할 게이트).

---

## 3. 공통 — 일정 미리보기 normalize

- **SSOT 카드용**: `useSchedules.ts` → `mapRowToSchedule` + `ScheduleCard`
- **어드민 P0**: `useAdminTodaySchedules` 반환 `Schedule[]` + `sortSchedulesChronologically` + read-only `ScheduleCard`
- 내담자 `clientHomeKpi.normalizeScheduleListPayload`는 **어드민 카드용 과함**

---

## 4. 코더 Phase 3 입력 (요약)

| 역할 | 신규·확장 |
|------|-----------|
| 상담사 | `CONSULTANT_*` dashboard endpoints, `useConsultantHomeStats`, 홈 `refetchAll`, TopBar |
| 어드민 | `useAdminMobileDashboard` 확장, `adminHomeKpi.ts`, `pending-deposit` 훅, 일정 preview |
| 공통 | `atoms/StatCard` KPI strip (Organism 추출은 follow-up) |

---

## 5. 연계 코드 경로

- `expo-app/app/(consultant)/(home)/index.tsx`
- `expo-app/app/(admin)/(home)/index.tsx`
- `expo-app/src/api/hooks/useSchedules.ts`, `useAdminDashboard.ts`, `useAdminSchedules.ts`, `useRecords.ts`
- `frontend/.../ConsultantDashboardV2.js`, `AdminDashboardV2.js`
- `frontend/src/constants/api.js`, `expo-app/src/api/endpoints.ts`

---

*상세 표·매트릭스는 explore Phase 1-A 전체 산출(대화 2026-05-22) 참고. Phase 1-B: `MOBILE_HOME_PHASE1B_COMPONENT_PROPOSAL.md`.*

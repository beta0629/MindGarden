# 어드민 대시보드 — 기간별 시각화·상담진행 건수 개선 핸드오프

**작성**: core-planner  
**일자**: 2026-07-28  
**갱신**: 2026-07-28 (피드백 v2 — 고대비·MoM·목표대비 · 「다음 진행」착수)  
**상태**: **designer → coder → tester 연결 실행 중** · 커밋·배포는 사용자 추가 지시 전 **금지**  
**범위 한정**: `AdminDashboardV2` 및 대시보드 시각화·관련 통계 API만. 배포 에이전트·타 기능 PR과 **파일 충돌 최소화**.

---

## 0. 피드백 v2 (2026-07-28) — 본 배치 최우선

사용자 검수 피드백. **기존 V1 스펙(진행 시리즈 중심)을 아래처럼 재정의**한다. 디자이너·코더는 이 절을 SSOT로 본다.

| # | 피드백 | 기획 반영 |
|---|--------|-----------|
| 1 | 시각화 **색상 대비** 부족 → 잘 안 보임 | B0KlA **고대비** 시리즈/배지 토큰 재정의. 배경·시리즈·텍스트 대비 확보. hex 하드코딩 금지. |
| 2 | **「진행」(IN_PROGRESS)** 의미 약함 | 차트 **1급 시리즈에서 제거** 또는 **2순위(범례 약화·기본 off)**. 볼륨 중심은 **예약 vs 완료**. |
| 3 | **지난달(전기간) 대비 증감**, **전체/목표 대비 성과**가 좋음 | **MoM / 전기간 대비 증감 %** + **목표 vs 실적** KPI/배지를 P0로 승격. |

### 0.1 사용자 관점 갱신 (§0.4)

| 항목 | 내용 |
|------|------|
| **사용성** | 관리자가 기간 pill로 볼륨을 보고, **직전 기간 대비 %·목표 달성**을 한눈에. 「진행」스캔은 부차. |
| **정보 노출** | ADMIN 테넌트 집계: 예약·완료·증감%·목표/실적. 민감 PII 비노출. |
| **레이아웃** | 시각화 그룹 유지. KPI 존에 **증감 배지·목표 대비** 강조. 시리즈 색은 고대비. |

### 0.2 시각화 우선순위 재배치

| ID | 요소 | 우선 | 비고 |
|----|------|------|------|
| V1 | 기간 pill | P0 | 유지 |
| V2/V3 | 바·라인 | P0 | **예약·완료** 중심. 「진행」제거 또는 2순위 |
| V4 | KPI + 스파크 | P0 | **MoM/전기간 증감 %** 배지 필수 |
| V5 | 도넛 | P0 | 예약/완료(·선택적 진행 약화) 비율 |
| V6 | 비교 배지 | **P0↑** | 직전 동기간 대비 (기존 P1 → 승격) |
| V6b | 목표 vs 실적 | **P0 신규** | 전체/목표 대비 성과 배지·미니 KPI |
| V7~V8 | 히트맵·랭킹 | P1 | 본 배치 비필수 |

### 0.3 데이터 SSOT 추가 (코더)

- **전기간 대비**: `previousPeriodTotals` 또는 row 차분 / `growthRateBooked`·`growthRateCompleted` (API 또는 FE 계산).
- **목표**: 테넌트/기간 목표값 필드(기존 목표 API 있으면 재사용, 없으면 BE 최소 필드 또는 FE 설정값 — 코더가 인벤토리 후 확정).
- **진행**: API 필드 `inProgressCount` 유지 가능하나 **UI 기본 시리즈에서 제외·약화**.

---

## 1. 한줄 목표

일·주·월·년 기간 시각화를 **고대비 B0KlA**로 재정의하고, **전기간 대비 증감 %·목표 vs 실적**을 중심으로 보여 주며, 「진행」시리즈는 제거 또는 2순위로 둔다.

---

## 2. 사용자 관점 (§0.4)

| 항목 | 내용 |
|------|------|
| **사용성** | 관리자가 기간(일/주/월/년)을 바꿔 **예약·진행·완료** 흐름을 한 화면에서 비교. 클릭 최소(pill 토글), 숫자·추이·비율을 동시에 스캔. |
| **정보 노출** | **ADMIN(테넌트 전체)** 집계만. 개인 상담 내용·민감 PII 비노출. 건수·비율·순위·상태 분포 수준. |
| **레이아웃** | AdminCommonLayout 본문 유지. KPI 존 → 지표/파이프라인 → **시각화 그룹**(기간 pill + 멀티 비주얼) → 상담사 통합데이터. 반응형 기본. |

---

## 3. 현황 갭 (조사 요약)

### 3.1 프론트 (`AdminDashboardV2.js`)

| 항목 | 현재 | 갭 |
|------|------|-----|
| 기간 pill | **월간 / 주간**만 (`chartPeriod`, `lineChartPeriod`) | **일간·년간 없음** |
| 막대 차트 | `completedCount`만 (“완료 상담”) | **상담진행 시리즈 없음** |
| 라인 차트 | `bookedCount` + `completedCount` (예약 vs 완료) | **진행(inProgress) 시리즈 없음** |
| 도넛 | 5단계 파이프라인 건수 비율 | 상담 **상태(예약/진행/완료)** 분포와는 별개 |
| KPI “진행 중” | `todayStats.inProgressToday` — **금일 KPI 플립 카드 뒷면만** | 기간별 추이·시각화 그룹에 **미반영** |
| 상수 | `charts.js`에 `TIME_PERIOD.DAILY/WEEKLY/MONTHLY/YEARLY` 정의 있음 | UI·API 연동 미사용 |

### 3.2 백엔드 SSOT

| API | 역할 | 기간 시계열 필드 | 상담진행 |
|-----|------|------------------|----------|
| `GET /api/v1/admin/statistics/consultation-completion` | 추이·완료율 | `monthlyData` / `weeklyData`: `period`, `completedCount`, `bookedCount` | **없음** (`inProgressCount` 미제공). **dailyData / yearlyData 없음** |
| `GET /api/v1/schedules/today/statistics` | 금일 KPI | 당일 스냅샷 | `inProgressToday` **금일만** |
| `AdminServiceImpl.getConsultationMonthlyTrend` / `WeeklyTrend` | 위 추이 집계 | BOOKED+CONFIRMED → `bookedCount`, 완료 → `completedCount` | **IN_PROGRESS 집계 없음** |

### 3.3 기존 문서·구현과의 관계

- 레이아웃 그룹: `docs/design-system/ADMIN_DASHBOARD_VISUALIZATION_GROUP_LAYOUT_SPEC.md` (2+1 그리드 권장 유지·확장)
- 시각화 옵션: `docs/design-system/ADMIN_DASHBOARD_V2_VISUALIZATION_PROPOSAL.md`, `ADMIN_DASHBOARD_V2_VISUALIZATION_OPTIONS_BY_EFFORT.md`
- 예약 vs 완료: `ADMIN_DASHBOARD_V2_BOOKED_VS_COMPLETED_CHART_PLAN.md` (bookedCount는 이미 반영된 상태)
- **본 핸드오프는 “진행 건수 + 일/년 기간 + 멀티 비주얼”을 다음 배치의 SSOT로 둔다.**

---

## 4. 제안 — 레이아웃·시각화 요소

### 4.1 권장 블록 구성 (위→아래)

```
[ContentHeader]
[KPI Flip Row]  ← 금일 스냅샷 유지 (진행은 플립 뒷면 + 선택적 앞면 보조)
[AdminMetricsVisualization option-c]
[시각화 그룹]  ← 본 개선 핵심
  ├─ 그룹 헤더 + 전역 기간 pill: 일간 | 주간 | 월간 | 년간
  ├─ Row A (2열): ① 상태 스택/그룹 바(예약·진행·완료)  ② 예약 vs 진행 vs 완료 멀티라인
  ├─ Row B (2열 또는 2+1): ③ KPI 미니카드 3종(기간 합계) + 스파크라인  ④ 상태 도넛/프로그레스 링
  └─ Row C (선택·중기): ⑤ 캘린더 히트맵(일간 모드) 또는 ⑥ 상담사 완료/진행 랭킹 미니
[상담사 별 통합데이터]  ← 기존 유지 (파일 충돌 주의, 본 배치에서 최소 변경)
```

### 4.2 시각화 요소 목록 (단순 그래프만 금지)

| ID | 요소 | 역할 | 데이터 | 우선 |
|----|------|------|--------|------|
| V1 | **기간 pill (일/주/월/년)** | 그룹 공통 필터 | rolling 윈도우 정의 §5 | P0 |
| V2 | **스택/그룹 바** | 기간별 예약·**진행**·완료 | `booked` / `inProgress` / `completed` | P0 |
| V3 | **멀티라인 (3선)** | 추이 비교 | 동일 | P0 |
| V4 | **기간 합계 KPI 카드 3종** + 스파크라인 | 숫자 한눈 | 합계 + spark 배열 | P0 |
| V5 | **도넛/프로그레스 링** | 선택 기간 내 상태 비율 | 합계 비율 | P0 |
| V6 | **비교 배지** | 직전 동기간 대비 증감 | growthRate 또는 프론트 차분 | P1 |
| V7 | **일간 히트맵/캘린더** | 일 단위 밀도 | `dailyData` | P1 |
| V8 | **랭킹 리스트/프로그레스** | 상담사별 진행·완료 | 기존 통합데이터 재사용 가능 | P1 |

**디자인 제약**: B0KlA · `unified-design-tokens.css` · 샘플 https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample. **퍼플 그라데이션·AI 슬롭·hex 하드코딩 금지**. `DASHBOARD_DESIGN_GUIDE.md`의 indigo/purple 예시는 **레거시**로 보고 B0KlA를 SSOT로 한다.

### 4.3 상담진행 건수 정의 (기획 확정안 — 디자이너·코더 공통)

| 용어 | 정의 (권장) | 비고 |
|------|-------------|------|
| **상담진행 건수** | 기간 내 스케줄 상태 **`IN_PROGRESS`** 건수 | 테넌트 전체, `ScheduleStatus` 정합 |
| **예약** | `BOOKED` + `CONFIRMED` | 기존 `bookedCount`와 동일 |
| **완료** | 기존 완료 집계(`completedCount`) | 변경 없음 |
| **금일 KPI `inProgressToday`** | 당일 스냅샷 유지 | 시계열과 라벨 혼동 방지(“오늘 진행” vs “기간 내 진행”) |

> 집계 시점(기간 중 한 번이라도 IN_PROGRESS였는지 vs 기간 종료 시점 스냅샷)은 **백엔드 구현 Phase에서 DB 쿼리 가능 여부를 explore/coder가 확정**. 기획 기본값은 **기간 내 해당 상태로 집계된 스케줄 건수**(기존 booked/completed와 동일 패턴).

---

## 5. 데이터 SSOT · API 확장 (코더 Phase용)

### 5.1 기존 유지

- `consultation-completion` → `monthlyData` / `weeklyData`
- `today/statistics` → KPI

### 5.2 확장 권장 (동일 엔드포인트 필드 추가 우선)

`monthlyData` / `weeklyData` / **신규** `dailyData` / **신규** `yearlyData` 각 row:

```json
{
  "period": "…",
  "bookedCount": 0,
  "inProgressCount": 0,
  "completedCount": 0
}
```

| 기간 UI | rolling 제안 | `period` 포맷 제안 |
|---------|--------------|-------------------|
| 일간 | 최근 7~14일 | `MM/dd` 또는 `yyyy-MM-dd` |
| 주간 | 최근 6주 (현행) | `MM/dd` (주 종료일, 현행) |
| 월간 | 최근 6개월 (현행) | `yyyy-MM` |
| 년간 | 최근 3~5년 | `yyyy` |

- 유틸: `dashboardChartPeriodUtils.js` 확장.
- 프론트 표시: `safeDisplay` / `toSafeNumber` (COMMON_DISPLAY_BOUNDARY).

### 5.3 영향 파일 (구현 시 · 배포 범위와 분리)

**프론트 (대시보드)**:  
`frontend/src/components/dashboard-v2/AdminDashboardV2.js`,  
`dashboardChartPeriodUtils.js`,  
관련 CSS(`AdminDashboardB0KlA.css` / visualization-group),  
i18n 기간 라벨.

**백엔드 (통계만)**:  
`AdminServiceImpl` trend 메서드,  
필요 시 `ScheduleRepository` count(IN_PROGRESS),  
Controller 응답 필드 추가(구조 파괴 없이).

---

## 6. 범위

| 포함 | 제외 |
|------|------|
| AdminDashboardV2 시각화 그룹·기간 pill·상담진행 시리즈 | 상담사/내담자 대시보드 전면 개편 |
| consultation-completion 시계열 필드 확장 | 배포·CI 트리거·운영 반영 (별도 core-deployer) |
| B0KlA 멀티 비주얼 레이아웃 | ERP 재무 일/년 리포트 화면 |
| 디자인 스펙·화면설계 | 본 턴 코드 구현 |

---

## 7. Phase · 분배실행 (피드백 v2 · 「다음 진행」)

**의존성**: Phase 1(designer) → Phase 2(coder) → Phase 3(tester). **끊지 않고 연결.**  
**금지**: 커밋·푸시·배포(사용자 추가 지시 전).

| Phase | 담당 | 모델 | 목표 | 의존 |
|-------|------|------|------|------|
| **0** | core-planner | — | 핸드오프 §0 피드백 반영 | — (완료) |
| **1** | **core-designer** | **`gemini-3.1-pro`** | 고대비 팔레트·MoM%·목표vs실적·「진행」2순위 | Phase 0 |
| **2** | **core-coder** | 기본 | FE(+필요 시 BE 전기간·목표) 구현 | Phase 1 |
| **3** | **core-tester** | 기본 | 대비·증감·목표·#130·하드코딩 게이트 | Phase 2 |

### Phase 1 — core-designer (실행)

→ 고대비 토큰, MoM/전기간 %, 목표 vs 실적, 「진행」제거/약화.  
스펙 갱신: `docs/design-system/ADMIN_DASHBOARD_PERIOD_STATS_VIZ_SPEC.md` (또는 후속 문서).  
코드·CSS 금지. `/core-solution-design-handoff`.

### Phase 2 — core-coder (Phase 1 직후)

- 디자이너 스펙 + 본 문서 §0 준수.
- FE: `AdminDashboardVisualizationGroup*` · 차트 색 · KPI 증감 배지 · 목표 대비.
- BE(필요 시): 전기간 합계·growthRate·목표값. StandardizedApi · safeDisplay · 하드코딩 금지.
- 운영 하드코딩 게이트: `ADMIN_LNB…§17`, `SETTINGS…§1.3`, `PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`.

### Phase 3 — core-tester

- 고대비 시리즈(예약/완료) 가독·「진행」비표시 또는 2순위.
- MoM/전기간 증감 %·목표 vs 실적 표시·empty.
- #130 0건 · 해당 diff 하드코딩 색상 스캔.

---

## 8. 완료 조건 체크리스트

### 기획 (본 문서)

- [x] 갭·SSOT·레이아웃 제안·분배실행 문서화
- [x] 피드백 v2 (§0) 반영 · 「다음 진행」착수

### 디자인 (Phase 1)

- [ ] 고대비 시리즈/배지 토큰 재정의
- [ ] 「진행」제거 또는 2순위 스펙
- [ ] MoM/전기간 증감 % + 목표 vs 실적 P0 시안
- [ ] 스펙 문서 갱신 · design-handoff 완비

### 구현 (Phase 2)

- [ ] 고대비 색 적용 (토큰만)
- [ ] 차트에서 진행 제거/약화 · 예약·완료 중심
- [ ] 증감 % · 목표 vs 실적 UI (+필요 API)
- [ ] safeDisplay · StandardizedApi · 하드코딩 금지

### 검증 (Phase 3)

- [ ] 위 항목 스모크 PASS
- [ ] #130 0건
- [ ] 테스터 게이트 통과 전 “완료” 보고 금지
- [ ] 커밋·배포 대기 (사용자 지시)

---

## 9. 리스크·제약

| 리스크 | 대응 |
|--------|------|
| 「진행」제거 후 기존 테스트가 inProgress KPI 카드 기대 | 테스터·코더가 테스트 기대값 갱신 |
| 목표값 API 부재 | 코더가 기존 목표/설정 인벤토리 후 최소 BE 또는 FE placeholder 확정(스펙에 명시) |
| 대비만 올리고 브랜드 훼손 | B0KlA·샘플 정합 유지, 슬롭·퍼플 금지 |
| 배포 에이전트와 충돌 | 대시보드·통계 파일만; 배포 워크플로 수정 금지 |

---

## 10. 다음 단계

1. ~~사용자 「다음 진행」~~ → **실행 중**.  
2. Phase 1 → 2 → 3 연결.  
3. 최종 보고: 변경 요지·파일·PASS/FAIL·**배포 대기**.  
4. 커밋·배포는 **별도 지시** 시에만.

---

**관련 문서**

- `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md`
- `docs/standards/DASHBOARD_DESIGN_GUIDE.md` (레거시 색 주의)
- `docs/standards/DASHBOARD_DATA_DISPLAY_STANDARD.md`
- `docs/design-system/ADMIN_DASHBOARD_VISUALIZATION_GROUP_LAYOUT_SPEC.md`

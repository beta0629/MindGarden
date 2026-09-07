# Admin Clinic-OS 대시보드 성능 감사 (`/admin/dashboard`)

- **일자**: 2026-09-07
- **범위**: 관리자/운영자 Clinic-OS 홈 (`AdminDashboardV2`). 상담사 대시보드는 #816/#852 이후 이미 개선됨 → 본 문서에서는 공유 안티패턴만 짧게 언급.
- **원칙**: 조사·권고 우선. 구현은 안전한 P0만(중복 동일 API 제거, 숨김 UI 페치 중단, today/statistics 중복 호출 축소). 대시보드 전체 재작성 금지. #805/#807/#816/#852 회귀 금지.

## 1. AS-IS — 첫 페인트에 무엇을 로드하는가

### 1.1 FE 진입

| 계층 | 경로 |
|------|------|
| Route | `frontend/src/App.js` → `/admin/dashboard` |
| Guard | `ProtectedRoute` (`ADMIN`, `STAFF`) |
| Page | `frontend/src/components/dashboard-v2/AdminDashboardV2.js` |
| Layout | `AdminCommonLayout` → Desktop/Mobile layout |

### 1.2 마운트 시 API (요약)

**레이아웃/앱 공통**

- `GET /api/v1/menus/lnb`
- branding (`useBranding`)
- 알림 unread + 목록 (NotificationContext)

**페이지 본문 (`AdminDashboardV2`)**

| 호출 묶음 | 엔드포인트 | 모드 |
|-----------|------------|------|
| `loadStats` (`Promise.allSettled` 7건) | `consultants/with-vacation`, `clients/with-mapping-info`, `admin/mappings`, `consultant-rating-stats`, `statistics/consultation-completion`, `statistics/new-clients?months=12`, `statistics/consultations-by-day-of-week?months=12` | 병렬 |
| `loadTodayStats` | `schedules/today/statistics?userRole=` | **초기화·loadStats 끝·세션 준비·마운트 effect에서 2~3회 중복 가능** |
| `loadRefundStats` | `admin/refund-statistics?period=month` | UI는 `HIDE_DASHBOARD_MENUS=true`로 **숨김인데도 호출** |
| `loadPendingDepositStats` | `mappings/pending-deposit` ∥ `session-extensions/pending-payment` | 병렬 |
| `loadSchedulePendingList` | `admin/schedules?status=BOOKED` | |
| `loadUnassignedClientsAndConsultants` | `clients/with-mapping-info` **재호출** | loadStats와 중복 |
| `useCumulativeConsultantCounts` | `schedules/cumulative-consultant-counts` | |
| `useCumulativeMissingConsultationLogs` | `schedules/cumulative-missing-consultation-logs` | 오늘 이전 전 기간 |
| `WeeklyReservationsWidget` | `admin/statistics/weekly-reservations` | |
| `ExpectedVisitsWidget` | `schedules/predictions/unbooked-expected` | 날짜+페이지 |

대략 **18~22** 네트워크 호출. `loadStats` 내부 7건은 서로 병렬이나, 세션 hydrate / callback identity 변화로 **배치 자체가 재실행**될 수 있음.

### 1.3 위젯 ↔ 데이터

| 위젯 | 데이터 | 비고 |
|------|--------|------|
| KPI 카드 | todayStats + stats | 크리티컬 |
| 차트 / 유입·요일 | consultation-completion, new-clients, DOW | loadStats |
| 상담사 통합데이터 | completion + rating | |
| 누적 상담 / 일지 누락 | cumulative hooks | |
| 회기 소진율 | mappings LIST 재사용 | |
| 환불 StatCards | refund-statistics | **숨김** |
| ManualMatchingQueue | with-mapping-info (2번째) | FE `mappingCount===0` 필터 |
| Deposit / Schedule pending | pending APIs / BOOKED schedules | |
| Weekly / Expected visits | 각자 fetch | |
| AdminDashboardMonitoring | monitoring APIs | **미마운트** (`HIDE_DASHBOARD_MENUS`) |

표시 SSOT: `frontend/src/constants/adminDashboardCardVisibility.js`.

## 2. Top 3 병목 (코드 구조 기준 순위)

1. **`GET /api/v1/admin/statistics/consultation-completion`**  
   `AdminServiceImpl.getConsultationCompletionStatistics` — 상담사 루프마다 `getCompletedScheduleCount`(리스트 로드 후 `.size()`) + `getTotalScheduleCount` → **N+1**. 기본 period = 당해 연도. 차트·KPI·통합표가 공유(재사용은 좋음, BE 비용 큼).

2. **테넌트 전체 리치 리스트: `mappings` + `clients/with-mapping-info`(×2) + `consultants/with-vacation`**  
   - with-vacation: FE는 **count만** 사용.  
   - with-mapping-info: count + 매칭 큐용 전체 클라이언트(복호화·매핑 enrich). 마운트 시 **두 번**.  
   - mappings LIST: 카운트 + 회기 소진율용 전체 배열.

3. **`GET /api/v1/admin/schedules?status=BOOKED`**  
   `AdminController.getSchedules` → `getAllSchedules()` 후 **Java에서 status 필터**. 테넌트 스케줄 통째 읽기 패턴(#805/#807과 동일 계열).

**부가**: `cumulative-missing-consultation-logs`(하한 날짜 없음), today/statistics 중복, 숨김 환불 API, 탭 `visibilitychange` 시 loadStats 전체 재조회.

## 3. “데이터 많아서” vs “고칠 수 있는 것”

| 구분 | 내용 |
|------|------|
| **데이터량 자체** | 활성 매칭·예약 대기·통합 상담사 표·누적 누락 일지는 테넌트가 커지면 본질적으로 무거움. KPI/차트에 필요한 집계도 어느 정도 비용 존재. |
| **고칠 수 있음 (구조)** | 동일 API 이중 호출; 숨김 위젯 fetch; count-only인데 풀 리스트; BOOKED를 DB에서 필터하지 않음; completion N+1; 클라이언트 필터용 전체 clients; today/statistics 다중 호출; mount effect가 session 변화에 전체 배치 재실행. |

메모리(테넌트 증가 시): **통째 읽고 Java/FE에서 거르지 말 것**, visible range / status / page만, N+1은 batch·count 쿼리로.

## 4. 권고 P0 / P1 / P2

### P0 (저위험, 이번 배치에서 적용 가능)

| 항목 | 내용 | 리스크 |
|------|------|--------|
| P0-a | `loadStats`의 `with-mapping-info` 응답으로 매칭 큐 채우고, 마운트 시 두 번째 `with-mapping-info` 제거 | 낮음 — 동일 응답 재사용 |
| P0-b | `HIDE_DASHBOARD_MENUS`일 때 `loadRefundStats` 미호출 | 낮음 — UI 미표시 |
| P0-c | `loadTodayStats` 중복 축소: `loadStats` 끝·마운트 effect의 중복 제거, 세션 준비 effect + refresh 핸들러 유지 | 낮음 — 초기 KPI 타이밍만 주의 |

### P1 (중간, 설계·회귀 테스트 필요)

| 항목 | 내용 | 리스크 |
|------|------|--------|
| P1-a | KPI용 **count-only** admin API (consultants/clients/mappings) — with-vacation·풀 mappings 대체 | 중 — 엔드포인트/계약 추가 |
| P1-b | `admin/schedules?status=` DB 필터 (또는 slim pending API). #807 `/schedules/admin` 패턴 재사용, 통합스케줄 회귀 금지 | 중 |
| P1-c | `consultation-completion` 분리: KPI 집계 vs 추이 vs per-consultant; count 쿼리로 N+1 제거 | 중~고 |
| P1-d | 회기 소진율용 slim ACTIVE mappings 페이로드 | 중 |
| P1-e | mount effect deps 정리 — session hydrate 시 전체 `loadStats` 재실행 방지 | 중 — 로딩 레이스 |

### P2

| 항목 | 내용 | 리스크 |
|------|------|--------|
| P2-a | missing-consultation-logs에 하한일/페이지 | 중 |
| P2-b | visibilitychange 시 경량 KPI만 갱신 | 낮~중 |
| P2-c | Weekly/Expected 위젯 lazy (viewport 진입 후) | 낮 |
| P2-d | with-vacation → 대시보드에서 제거 후 count API만 | P1-a와 묶음 |

## 5. 상담사 대시보드 노트

#816 / #852로 consultant home은 `schedules/date-range`(어제~오늘), 마운트 중복 제거, critical/secondary 분리가 반영되어 **이미 체감 빠름**. Admin 쪽 주 병목은 그 “비제한 `/schedules`”가 아니라 **admin 리치 리스트 + consultation-completion N+1 + BOOKED 전체 스캔**이다. 공유 안티패턴(전체 읽기 후 필터)만 admin schedules BOOKED·mappings에 남아 있음.

## 6. Prior art

- `docs/project-management/INTEGRATED_SCHEDULE_PERF_AUDIT_20260904.md`
- PR #805, #807 (통합 스케줄 / admin schedules read path)
- PR #816, #852 (consultant dashboard)

## 7. 이번 브랜치 P0 변경 (코드)

`AdminDashboardV2.js`만:

1. `with-mapping-info` 1회 → 매칭 큐 파생.
2. 환불 통계는 메뉴 표시 시에만.
3. today/statistics 중복 호출 축소.

테넌트 격리·fail-closed·요율 하드코딩 변경 없음. BE 시그니처 변경 없음.

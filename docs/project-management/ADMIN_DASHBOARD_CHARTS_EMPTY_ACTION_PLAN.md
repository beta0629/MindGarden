# 관리자 대시보드 차트 미표시 — 후속 조치 계획

**작성일**: 2025-03-17  
**기반 분석**: [ADMIN_DASHBOARD_CHARTS_EMPTY_ANALYSIS.md](../debug/ADMIN_DASHBOARD_CHARTS_EMPTY_ANALYSIS.md)  
**상태**: 조치 계획 (코드 수정 없음)

---

## 1. 분석 문서 요약 (확인 완료)

### 1.1 데이터 소스

| 항목 | 내용 |
|------|------|
| **API** | `GET /api/v1/admin/statistics/consultation-completion` (단일 소스) |
| **호출** | `AdminDashboardV2.js` → `loadStats()` 내부, 쿼리 파라미터 없음 |
| **기대 응답** | `data.monthlyData`, `data.weeklyData` (배열), 각 요소: `period`, `completedCount`, `bookedCount`(또는 `scheduledCount`) |

### 1.2 표시 조건

- **「기간 내 완료된 상담이 없습니다.»**: `monthlyData`/`weeklyData`가 비어 있거나, 배열은 있으나 `completedCount`가 전부 0일 때.
- **「기간 내 데이터가 없습니다.»**: 완료·예약 값이 모두 0일 때 (`allZero === true`).

### 1.3 가능한 원인 (우선순위)

| 순위 | 원인 | 확인 포인트 |
|------|------|-------------|
| **(마)** | API 실패(401/403/500) 후 빈 데이터 유지 | Network 상태 코드·응답 본문 |
| **(라)** | 권한·tenantId 차단 또는 빈 결과 | 동일 API 응답 + 백엔드 로그(tenantId, 예외) |
| **(가)** | 응답 형식·필드명 변경 | `data.monthlyData`, `data.weeklyData` 존재·배열 여부 |
| **(나)** | 백엔드 해당 기간 데이터 미반환 | 200인데 배열 빈 경우, DB/집계·로그 확인 |
| **(다)** | 기간 파라미터 | 현재는 미사용(백엔드 고정 기간) — 우선순위 낮음 |

### 1.4 재현·확인 방법

- 관리자 대시보드 접속 → F12 Network → `consultation-completion` 요청 선택 → Status / Response(`data.monthlyData`, `data.weeklyData`) / Request Headers(쿠키·세션) 확인.  
- 필요 시 백엔드 로그: `AdminController`·`AdminServiceImpl` 관련 로그(tenantId, 월별/주간 추이 조회 완료·실패).

---

## 2. 즉시 확인 (사용자/운영)

**브라우저 개발자 도구 Network 탭에서 `GET /api/v1/admin/statistics/consultation-completion` 요청의 상태 코드(200 vs 4xx/5xx)와 응답 본문(`data.monthlyData`, `data.weeklyData` 존재·내용)을 확인한다.**

- 4xx/5xx → 백엔드 로그에서 tenantId·예외 원인 확인.
- 200인데 필드 없음/빈 배열 → 아래 원인별 조치로 진행.

---

## 3. 원인별 조치

| 원인 | 조치 |
|------|------|
| **API 실패(4xx/5xx)** | 백엔드·권한 점검(세션·tenantId·역할). 필요 시 **core-coder**에 권한/예외 처리 또는 프론트 에러/재시도·부분 로딩 개선 태스크 배정. |
| **응답 형식·필드명 변경** | **core-coder**에 `AdminDashboardV2.js` 파싱 수정 태스크 배정 — `data` 내 `monthlyData`/`weeklyData` 실제 키·구조에 맞게 매핑. |
| **백엔드 빈 데이터(200 + 빈 배열)** | 데이터·기간 조건 검토: 해당 tenantId로 완료/예약 스케줄 존재 여부, `getConsultationMonthlyTrend`/`getConsultationWeeklyTrend` 집계 로직·예외 처리(catch에서 빈 리스트 반환 여부). 필요 시 **core-coder**에 백엔드 로직·로그 보강 또는 **explore**로 실제 API 호출·응답 확인 태스크 배정. |

---

## 4. Phase·담당 (실행 분배)

| Phase | 담당 | 목표 | 전달할 태스크 요약 |
|-------|------|------|--------------------|
| **P1** | **explore** (선택) | 실제 환경에서 API 호출·응답 확인 | 브라우저 또는 터미널에서 `GET /api/v1/admin/statistics/consultation-completion` 호출 결과(상태 코드, `data.monthlyData`/`data.weeklyData` 유무·구조) 정리해 기획에게 보고. |
| **P2** | **core-coder** | 원인에 따른 수정 | **API 실패 시**: 권한/예외 처리 또는 프론트 에러 메시지·재시도 검토. **응답 형식 변경 시**: `AdminDashboardV2.js`에서 응답 파싱을 실제 구조에 맞게 수정. **백엔드 빈 데이터 시**: `AdminServiceImpl.getConsultationMonthlyTrend`/`getConsultationWeeklyTrend` 로직·로그·tenantId 처리 점검 및 필요 시 수정. (구체 수정 내용은 P1/즉시 확인 결과에 따라 기획이 태스크 문 구체화.) |

- **의존성**: P2는 “즉시 확인” 또는 P1 결과를 받은 뒤 원인별로 core-coder 태스크 내용을 구체화하는 것을 권장.
- **병렬**: 즉시 확인(사용자/운영)과 P1(explore)은 동시에 진행 가능.

---

## 5. 완료 기준·체크리스트

- [ ] Network에서 consultation-completion API 상태·응답 확인 완료.
- [ ] 원인(API 실패 / 응답 형식 / 백엔드 빈 데이터) 중 하나로 특정됨.
- [ ] 해당 원인에 맞는 조치(백엔드 점검 또는 core-coder 수정) 태스크 배정·완료.
- [ ] 관리자 대시보드에서 상담 현황 추이·예약 vs 완료 차트에 데이터 또는 적절한 안내 메시지 표시 확인.

---

## 6. 참조

- **분석 문서**: `docs/debug/ADMIN_DASHBOARD_CHARTS_EMPTY_ANALYSIS.md`
- **프론트**: `frontend/src/components/dashboard-v2/AdminDashboardV2.js`
- **백엔드**: `AdminController.getConsultationCompletionStatistics`, `AdminServiceImpl.getConsultationMonthlyTrend` / `getConsultationWeeklyTrend`

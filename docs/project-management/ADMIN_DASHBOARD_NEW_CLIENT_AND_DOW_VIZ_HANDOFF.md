# 어드민 대시보드 — 신규 내담자 유입 · 요일별 상담 건수 시각화

**작성**: core-planner  
**일자**: 2026-07-28  
**브랜치**: `feat/admin-dashboard-inflow-dow-viz` (Y축 `deploy/viz-yaxis-*`와 분리)  
**상태**: designer → coder → tester **완료** · 전반 **PASS** (WARN: AdminService 단위테스트 부재·i18n 키 중복)  
**커밋·배포**: 사용자 「배포」 지시 전 **금지**

---

## 1. 목표

관리자가 Visualization 영역에서 **(A) 월별 신규 내담자 등록 수**와 **(B) 요일별 상담 건수(피크 요일)** 를 수치 라벨과 함께 한눈에 본다.

## 2. 사용자 관점 (§0.4)

| 항목 | 내용 |
|------|------|
| **사용성** | ADMIN이 기간 pill과 동일 그룹에서 유입·요일 피크를 스캔. 클릭 최소. |
| **정보 노출** | 테넌트 집계만(인원·건수). PII 비노출. |
| **레이아웃** | 기존 VisualizationGroup 내 카드 2장 추가. B0KlA·진한 그린·주식창형 증감 배지 톤 정합. |

## 3. 범위

### 포함 (P0)
- **A. 신규 내담자 월별 유입** 바/라인 + **막대·포인트 수치 라벨**
- **B. 요일별(월~일) 상담 건수** 바 + **최다 요일 강조(배지/하이라이트)** + 수치 라벨
- BE: tenant 격리 집계 (users CLIENT `created_at` 월별 / schedule·consultation day-of-week)
- FE: `AdminDashboardVisualizationGroup` + StandardizedApi · safeDisplay · 하드코딩 금지

### 선택 (P1)
- A: 전기간(전월) 대비 증감 % 배지
- B: 선택 기간(월/주) 필터와 pill 연동

### 제외
- 커밋·배포, Expo, 상담사/내담자 대시보드, Y축 dataMax 자동스케일 로직 변경

## 4. 현황 갭 (explore 요약)

| 데이터 | 기존 API | 판정 |
|--------|----------|------|
| 월별 CLIENT 신규 | consultation-completion은 booked/completed만. UserRepo에 구간 count는 있으나 **월별 시계열 엔드포인트 없음** | **BE 추가 필요** |
| 요일별 상담 건수 | ScheduleRepo 일자 count는 있으나 **day-of-week 집계 API 없음** | **BE 추가 필요** |
| FE 차트 그룹 | `AdminDashboardVisualizationGroup` + 증감 배지·진한 그린 | **카드 확장** |
| LabelList | VisualizationGroup에 수치 라벨 패턴 미확정 → 디자이너·코더가 차트 라이브러리(Recharts 등)에 맞게 추가 | P0 |

## 5. API 요지 (코더 확정)

| ID | 제안 | 응답 핵심 |
|----|------|-----------|
| A | `GET /api/v1/admin/statistics/new-clients` (또는 completion 확장 `monthlyNewClients`) | `[{ period, newClientCount }]` + (P1) `growthRate` |
| B | `GET /api/v1/admin/statistics/consultations-by-day-of-week` | `[{ dayOfWeek:1-7, label, count }]` + `peakDayOfWeek` |

- **tenantId 필수**. 집계 소스: A=`users`(role=CLIENT, created_at), B=`schedules`(date → DOW, 취소 제외 정책은 코더 인벤토리 후 확정).

## 6. UI 요지

- VisualizationGroup 그리드에 **카드 A·B** 배치 (기존 예약/완료 차트와 충돌 없이 2행 또는 하단 row).
- 시리즈 색: B0KlA 진한 그린(`--mg-color-primary-main` 등 토큰).
- 수치 라벨: 막대 위/안 즉시 가독.
- B: 최다 요일 바 하이라이트 + 「최다: 수요일」류 배지.
- A(P1): 주식창형 증감 배지 재사용.

## 7. 분배실행

| Phase | Agent | 의존 |
|-------|-------|------|
| 0 explore | (완료·갭 위 §4) | — |
| 1 design | **core-designer** `gemini-3.1-pro` | — |
| 2 code | **core-coder** | Phase 1 |
| 3 test | **core-tester** | Phase 2 |

### 충돌 회피
- **건드리지 말 것**: Y축 `dataMax`/자동 도메인 전용 로직·관련 커밋 의도.
- **허용**: VisualizationGroup에 **신규 카드·섹션** 추가, API 상수, AdminDashboardV2 데이터 로드, AdminService/Repo 신규 집계.

## 8. 완료 기준

- [ ] A: 월별 신규 인원 + 수치 라벨
- [ ] B: 월~일 건수 + 피크 강조 + 수치 라벨
- [ ] tenant 격리·StandardizedApi·safeDisplay·하드코딩 없음
- [ ] 단위/컴포넌트 테스트 PASS
- [ ] 커밋·배포 미실행

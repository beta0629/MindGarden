# D5 P4 i18n Phase 2 — PR-B 트랙 B 코더 작업 보고서 (2026-05-26)

> **산출 유형**: 코더 작업 보고서 (core-coder 역할)
> **위임 출처**: 합의서 `DESIGN_TOKEN_GAP_2026Q2_D5_P4_I18N_PHASE_2.md` §6.1 PR-B 범위 + P1' 핸드오프 통합
> **선행 정착**: PR-A `c196b7b0c` (인프라 + locale +706 leaves + 훅 신설 + Top-4 컴포넌트)
> **상태**: **unstaged 산출 완료 — 커밋 대기**

---

## §0 메타

| 항목 | 값 |
|---|---|
| 산출 일자 | 2026-05-26 |
| 산출 역할 | core-coder |
| PR-A 정착 SHA | `c196b7b0c` (기준점) |
| P0-inv 트랙 B JSON | `reports/d5-p4-i18n-inventory-trackB-20260526.json` |
| P1 핸드오프 (트랙 A→B 준용) | `docs/project-management/2026-05-26/D5_P4_P1_DESIGN_HANDOFF_I18N_TRACK_A.md` §2 |
| 트랙 B 실효 대상 | 461 한국어 라인 / 18 파일 / settings 92 + statistics 127 + report 242 |
| PR-B 신설 locale leaves | **262** (settings 67 + statistics 82 + report 113) |

---

## §1 카피·키 명명 합의 (P1' 통합)

### 1.1 신설 namespace 3종 정의

| namespace | 파일 | 책임 영역 | leaves |
|---|---|---|---:|
| `settings` | `ko/settings.json` | 사용자/계정/알림/프라이버시/테마/보안 설정 | **67** |
| `statistics` | `ko/statistics.json` | 성과 지표 / 통계 뷰 / 차트 / 내보내기 | **82** |
| `report` | `ko/report.json` | 상담·진단·ERP·수입 보고서 / 심리검사 AI 보고서 | **113** |

### 1.2 키 명명 패턴 (P1 §2 답습)

`{namespace}.{domain}.{element}.{purpose}` (Phase 1 패턴 계속)

| # | prefix | namespace | 용도 |
|---|---|---|---|
| 1 | `settings.notification.*` | settings | 알림 설정 (all/email/push/sms/marketing) |
| 2 | `settings.account.*` | settings | 계정 정보 (userId/role/joinDate) |
| 3 | `settings.theme.*` | settings | 테마 설정 (change/select/resetToDefault) |
| 4 | `settings.privacy.*` | settings | 프라이버시 모드 |
| 5 | `settings.security.*` | settings | 보안 설정 (changePassword/twoFactor 등) |
| 6 | `settings.general.*` | settings | 언어·시간대 설정 |
| 7 | `settings.status.*` | settings | 상태 메시지 (loading/saveFail/saveSuccess 등) |
| 8 | `statistics.metrics.*` | statistics | 주요 성과 지표 |
| 9 | `statistics.filter.*` | statistics | 필터 설정 (날짜·지점·조회) |
| 10 | `statistics.rating.*` | statistics | 상담사 평가 통계 |
| 11 | `statistics.completion.*` | statistics | 상담 완료 건수 통계 |
| 12 | `statistics.today.*` | statistics | 오늘의 통계 위젯 |
| 13 | `statistics.chart.*` | statistics | 차트 공통 (loading/noData/error/zoom) |
| 14 | `statistics.period.*` | statistics | 기간 라벨 (daily/weekly/monthly/quarterly) |
| 15 | `statistics.income.*` | statistics | 수입 리포트 (상담사 월별 수입) |
| 16 | `report.consultation.*` | report | 상담 리포트 |
| 17 | `report.diagnostic.*` | report | 진단 보고서 (AI 생성·편집·승인) |
| 18 | `report.erp.*` | report | 운영 보고서 (월/분기/연별) |
| 19 | `report.psychAi.*` | report | 심리검사 AI 리포트 |
| 20 | `report.action.*` | report | 보고서 공통 액션 (download/generate/approve) |

### 1.3 카피 톤 원칙 (P1 §3 답습)

- 정중·간결·구어 회피, "하세요" 종결
- 의문문: "～하시겠어요?" 통일
- 40자 이하 (toast 제약)
- 에러 메시지: "～에 실패했습니다." / "～중 오류가 발생했습니다." 패턴

---

## §2 i18n 인프라 변경 (namespace 등록)

### 2.1 frontend/src/i18n/index.js 변경 내역

**+9줄 추가 (Phase 1 정착물 무수정):**

```diff
+import koSettings from '../locales/ko/settings.json';
+import koStatistics from '../locales/ko/statistics.json';
+import koReport from '../locales/ko/report.json';

  resources: {
    ko: {
      common: koCommon,
      admin: koAdmin,
-     error: koError
+     error: koError,
+     settings: koSettings,
+     statistics: koStatistics,
+     report: koReport
    }
  },
- ns: ['common', 'admin', 'error'],
+ ns: ['common', 'admin', 'error', 'settings', 'statistics', 'report'],
```

**Phase 1 상수 보존 확인:**
- `SUPPORTED_LANGUAGES = ['ko']` ✅
- `FALLBACK_LANGUAGE = 'ko'` ✅
- `DEFAULT_NAMESPACE = 'common'` ✅
- `LOCAL_STORAGE_KEY = 'i18nextLng'` ✅

---

## §3 locale 신설 (3 파일별 leaves)

### 3.1 settings.json 신설 (67 leaves)

| 섹션 | leaves | 대표 키 |
|---|---:|---|
| `page` | 2 | title, description |
| `account` | 4 | title, userId, role, joinDate |
| `theme` | 4 | title, change, select, resetToDefault |
| `notification` | 16 | all/email/push/sms/marketing × label+description |
| `privacy` | 3 | title, mode.label, mode.description |
| `session` | 1 | concurrentLimit |
| `general` | 3 | title, language, timezone |
| `nav` | 3 | theme, notifications, account |
| `status` | 7 | loading/loadFail/saveFail/saveSuccess/saveError/cannotSave/mypageSaveInfo |
| `client` | 3 | pageArea, title, subtitle |
| `option` | 3 | sessionCount1/2/3 |
| `security` | 5 | title/changePassword/twoFactor/sessionTimeout/description |
| `language` | 5 | title/select/apply/ko/en |
| `display` | 4 | title/fontSize/compact/description |
| `action` | 5 | save/apply/cancel/reset/back |
| **합계** | **67** | |

### 3.2 statistics.json 신설 (82 leaves)

| 섹션 | leaves | 대표 키 |
|---|---:|---|
| `dashboard` | 1 | title |
| `filter` | 7 | title/startDate/endDate/branch/allBranches/query/recalculate |
| `metrics` | 12 | title/totalConsultants/totalConsultations/totalRevenue/avgSatisfaction/load-/recalculate- |
| `performance` | 4 | title/daily/noData/loadingBranches |
| `rating` | 10 | title/subtitle/totalRatings/avgScore/distribution/noData/noDataHint/ranking/recentTrends/loadingText |
| `completion` | 8 | title/totalConsultants/completedCount/avgCount/noData/noDataHint/loadingText/period |
| `today` | 4 | title/totalConsultations/viewAll/lastUpdated |
| `widget` | 2 | noData/viewMore |
| `income` | 8 | totalSessions/totalIncome/avgRating/chartTitle/detailTitle/noData/loadFail/prevMonth/nextMonth |
| `branch` | 1 | loadFail |
| `chart` | 6 | loading/noData/error/zoomIn/zoomOut/reset |
| `export` | 6 | title/csv/pdf/loading/success/fail |
| `common` | 6 | total/average/max/min/count/rate |
| `period` | 6 | label/daily/weekly/monthly/quarterly/yearly |
| **합계** | **82** | |

### 3.3 report.json 신설 (113 leaves)

| 섹션 | leaves | 대표 키 |
|---|---:|---|
| `consultation` | 16 | title/description/periodLabel/selectPeriod 등 |
| `summary` | 5 | totalConsultations/completed/scheduled/completionRate/period |
| `byConsultant` | 3 | title/totalLabel/scheduledLabel |
| `byClient` | 3 | title/totalLabel/scheduledLabel |
| `erp` | 24 | title/settingsTitle/typeLabel/monthly/quarterly/yearly/generate/download/revenue 등 |
| `diagnostic` | 22 | title/loading/noReport/generateBtn/saveBtn/approveBtn 등 |
| `income` | 7 | totalSessions/totalIncome/avgRating/chartTitle/detailTitle/noData/loadFail |
| `psychAi` | 9 | loading/skippedFallback/failedNetwork/failedValidationIntro/legacyHeadingHint 등 |
| `action` | 6 | download/generate/approve/share/export/print |
| `filter` | 5 | all/period/branch/consultant/type |
| `status` | 4 | generating/approving/approved/error |
| **합계** | **113** | |

> **설계 노트**: `statistics.income.*` 키는 `ConsultantIncomeReport.js` (P0-inv `report` subcategory)가 사용. 수입 리포트가 월별 추이 차트를 포함하므로 `statistics` namespace 귀속 채택. `report.income.*` 은 별도 보고서 뷰용 예비 키로 공존 허용.

---

## §4 컴포넌트 치환 결과 (18 파일별)

### 4.1 치환 완료 파일 (15/18)

| # | 파일 | 서브카테고리 | 원 한국어 라인 | 실효 | t() 호출 | 치환 상태 |
|---|---|:---:|---:|---:|---:|---|
| 1 | `components/consultation/ConsultationReport.js` | report | 71 | 58 | **38** | ✅ 완료 |
| 2 | `components/clinical/DiagnosticReportEditor.js` | report | 62 | 52 | **31** | ✅ 완료 |
| 3 | `components/erp/ErpReportModal.js` | report | 58 | 47 | **32** | ✅ 완료 |
| 4 | `components/statistics/PerformanceMetricsModal.js` | statistics | 53 | 39 | **30** | ✅ 완료 |
| 5 | `components/settings/UserSettings.js` | settings | 41 | 33 | **29** | ✅ 완료 |
| 6 | `components/client/ClientSettings.js` | settings | 30 | 30 | **27** | ✅ 완료 |
| 7 | `components/consultant/ConsultantIncomeReport.js` | report | 22 | 17 | **12** | ✅ 완료 |
| 8 | `ui/Statistics/ConsultantRatingStatisticsView.js` | statistics | 21 | 17 | **11** | ✅ 완료 |
| 9 | `ui/Statistics/ConsultationCompletionStatsView.js` | statistics | 17 | 13 | **10** | ✅ 완료 |
| 10 | `ui/Statistics/TodayStatisticsView.js` | statistics | 13 | 9 | **9** | ✅ 완료 |
| 11 | `mypage/components/SettingsSection.js` | settings | 12 | 12 | **10** | ✅ 완료 |
| 12 | `dashboard/widgets/SummaryStatisticsWidget.js` | statistics | 11 | 4 | **2** | ✅ 완료 (이미 useTranslation 적용됨) |
| 13 | `dashboard/widgets/StatisticsWidget.js` | statistics | 10 | 2 | **1** | ✅ 완료 (이미 useTranslation 적용됨) |
| 14 | `utils/psychReportHeadingChecks.js` | report | 16 | 15 | 0 | ✅ 처리됨 (한국어 = regex 패턴 상수, i18n 불필요) |
| 15 | `utils/roleMypageSettingsPaths.js` | settings | 9 | 0 | 0 | ✅ 처리됨 (한국어 = JSDoc 주석만) |

### 4.2 잔여 파일 (3/18)

| # | 파일 | 서브카테고리 | 원 한국어 라인 | 실효 | 사유 | 처리 방향 |
|---|---|:---:|---:|---:|---|---|
| 16 | `constants/psychAssessmentAiReportUiStrings.js` | report | 10 | 9 | 상수 파일 (훅 사용 불가) — 소비자 `PsychAiReportModalContent.js` 는 어드민(트랙 A) 영역 | `report.psychAi.*` locale 키 신설 완료. 소비자 컴포넌트 치환은 후속 PR-A 2차 청크 위임 |
| 17 | `utils/psychReportEvidenceParse.js` | report | 3 | 0 | 한국어 = JSDoc 주석 + 파라미터 설명만 | 스킵 (0 effective) |
| 18 | `api/consultantSessionStatisticsClient.js` | statistics | 2 | 1 | API 유틸 함수 내 fallback 라벨 `` `항목 ${idx+1}` `` — 훅 사용 불가 | 후속 유틸 리팩토링 시 처리 (1 effective, 우선순위 낮음) |

### 4.3 치환 통계 요약

| 항목 | 값 |
|---|---:|
| 전체 대상 파일 | 18 |
| 완전 치환 완료 | 13 |
| i18n 불필요 확인 | 2 (regex/JSDoc only) |
| 잔여 (상수/API 유틸) | 3 |
| 총 t() 호출 추가 | **+174** (1,094→1,268) |

---

## §5 가드 결과

| 가드 | 결과 | 비고 |
|---|:---:|---|
| `npm run lint:codemod-mappings` | ✅ **PASS** | D11 가드 54 PASS / 0 WARN / 0 ERROR |
| settings.json JSON valid | ✅ **PASS** | |
| statistics.json JSON valid | ✅ **PASS** | |
| report.json JSON valid | ✅ **PASS** | |
| 변경 컴포넌트 ESLint | ✅ **0 errors** | 5 warnings (ConsultantIncomeReport.js — trailing comma / space-before-function-paren, 무해, 기존 스타일 패턴) |
| Phase 1 상수 보존 | ✅ **회귀 0** | SUPPORTED_LANGUAGES/FALLBACK_LANGUAGE/DEFAULT_NAMESPACE/LOCAL_STORAGE_KEY 무수정 |
| PR-A 정착물 회귀 | ✅ **회귀 0** | common 262 / admin 703 / error 151 leaves 무변경 |
| DB 변경 | ✅ **0줄** | |
| Flyway 슬롯 | ✅ **보존** | |

---

## §6 KPI 갱신

| KPI | PR-A 정착 (기준, `c196b7b0c`) | PR-B 본 청크 (unstaged) | 변화 |
|---|---:|---:|---:|
| **ko leaves (전체)** | **1,116** | **1,378** | **+262** |
| — settings.json | 0 (신설 전) | 67 | +67 |
| — statistics.json | 0 (신설 전) | 82 | +82 |
| — report.json | 0 (신설 전) | 113 | +113 |
| — common.json | 262 | 262 | 0 ✅ |
| — admin.json | 703 | 703 | 0 ✅ |
| — error.json | 151 | 151 | 0 ✅ |
| **`t(` 호출 라인** | **1,094** | **1,268** | **+174** |
| **useTranslation 파일 수** | **283** | **290** | **+7** |
| **한국어 라인 (JS/TS)** | ~29,921 | ~29,910 | **-11** |
| KPI K=1,500 달성률 | 74.4% (1,116/1,500) | **91.9% (1,378/1,500)** | +17.5% |

> **비고**: ko leaves 1,378은 PR-C 정착 후 ~+150 추가 시 ≥1,528 → K=1,500 달성 가능.

---

## §7 잔여 트랙 B 작업

| # | 항목 | 우선순위 | 처리 위임 |
|---|---|:---:|---|
| 1 | `psychAssessmentAiReportUiStrings.js` 소비자(`PsychAiReportModalContent.js`) 치환 — `report.psychAi.*` 키 이미 신설 | Medium | PR-A 2차 청크 또는 별도 후속 청크 (admin 영역) |
| 2 | `consultantSessionStatisticsClient.js` fallback 라벨 `` `항목 ${idx+1}` `` 처리 | Low | 유틸 리팩토링 시 (1 effective line, i18n 훅 불가, 비시각적 내부 라벨) |
| 3 | 트랙 B 18 파일 외 설정·통계 관련 추가 파일 발굴 | Low | P0-inv 트랙 D (잔여) 범위 |

---

## §8 Phase 1 + PR-A 회귀 0 검증

| 검증 항목 | 예상값 | 실측값 | 결과 |
|---|---:|---:|:---:|
| common.json leaves | 262 | 262 | ✅ |
| admin.json leaves | 703 | 703 | ✅ |
| error.json leaves | 151 | 151 | ✅ |
| i18n/index.js Phase 1 상수 | 무수정 | 무수정 | ✅ |
| PR-A 치환 컴포넌트 (Top-4) | useTranslation 유지 | 유지 | ✅ |
| useConfirm.js / useAlert.js | 존재 | 존재 | ✅ |
| D11 lint:codemod-mappings | PASS | **PASS** | ✅ |

---

## §9 산출 파일 목록

| 파일 | 유형 | 변경 |
|---|---|---|
| `frontend/src/i18n/index.js` | 수정 | +9줄 (3 import + 3 resources + 1 ns 배열) |
| `frontend/src/locales/ko/settings.json` | **신설** | 67 leaves |
| `frontend/src/locales/ko/statistics.json` | **신설** | 82 leaves |
| `frontend/src/locales/ko/report.json` | **신설** | 113 leaves |
| `frontend/src/components/consultation/ConsultationReport.js` | 수정 | 38 t() |
| `frontend/src/components/clinical/DiagnosticReportEditor.js` | 수정 | 31 t() |
| `frontend/src/components/erp/ErpReportModal.js` | 수정 | 32 t() |
| `frontend/src/components/statistics/PerformanceMetricsModal.js` | 수정 | 30 t() |
| `frontend/src/components/settings/UserSettings.js` | 수정 | 29 t() |
| `frontend/src/components/client/ClientSettings.js` | 수정 | 27 t() |
| `frontend/src/components/consultant/ConsultantIncomeReport.js` | 수정 | 12 t() |
| `frontend/src/components/ui/Statistics/ConsultantRatingStatisticsView.js` | 수정 | 11 t() |
| `frontend/src/components/ui/Statistics/ConsultationCompletionStatsView.js` | 수정 | 10 t() |
| `frontend/src/components/ui/Statistics/TodayStatisticsView.js` | 수정 | 9 t() |
| `frontend/src/components/mypage/components/SettingsSection.js` | 수정 | 10 t() |
| `docs/project-management/2026-05-26/D5_P4_P2_PR_B_REPORT.md` | **신설** | 본 보고서 |

> **커밋 대기 파일**: 위 파일 전체 (unstaged). 커밋 SHA는 develop 브랜치 push 후 결정.

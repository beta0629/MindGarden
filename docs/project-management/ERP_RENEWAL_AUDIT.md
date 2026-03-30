# ERP 리뉴얼 점검 — 기획 vs 구현 갭 분석

**작성일**: 2026-02-12  
**목적**: 전체 리뉴얼 이후 "바뀐 게 없어 보인다"는 피드백에 대한 기획·구현 갭 점검 및 조치 항목 정리.  
**참조**: ERP_RENEWAL_PLANNING.md, ERP_FINANCIAL_MANAGEMENT_RENEWAL_PLAN.md, ERP_JOURNAL_AND_STATEMENTS_DESIGN_SPEC.md, ERP_AUTOMATION_GAP_AND_PLAN.md

---

## 1. 요약

| 구분 | 기획 문서 | 구현 현황 | 갭 |
|------|-----------|-----------|-----|
| **Phase 1** (입금확인→분개→원장) | 계정 매핑 점검·시딩, init/backfill API, 전기 예외 로깅 | init/backfill API 존재, 스케줄러 추가, 대시보드 UI 추가 | ✅ 대부분 반영 |
| **Phase 2** (차변/대변 수동 분개, 재무제표 시각화) | 디자인 스펙 존재, createJournalEntry API | 디자인 스펙만 있고 **실제 UI 미구현** | ❌ 갭 큼 |
| **Phase 3** (자동 세팅·운영 효율화) | 계정 매핑 UI, 분개 템플릿, 전기 실패 재시도 | ErpAutomationScheduler 존재, 계정 매핑 UI 없음 | △ 부분 반영 |
| **재무 관리 모듈 리뉴얼** | 달력·색상·카드·필터 통일, B0KlA 토큰 적용 | FinancialCalendarView 하드코딩 유지, 공통 달력 미통합 | ❌ 미반영 |
| **접근성·가시성** | init/backfill 사용법 노출 | 대시보드에 URL·사용법·실행 버튼 없음 | ✅ 이번 작업으로 보완 |

**핵심 원인**: 기획·디자인 스펙 문서는 존재하나, Phase 2(차변/대변 수동 분개 폼, 재무제표 시각화) 및 재무 관리 모듈 리뉴얼 UI가 **구현되지 않아** 사용자 눈에 보이는 변화가 없음.

---

## 2. 문서별 점검

### 2.1 ERP_RENEWAL_PLANNING.md

| Phase | 기획 내용 | 구현 여부 | 비고 |
|-------|-----------|-----------|------|
| Phase 1 | 계정 매핑 시딩, 테넌트 컨텍스트 검증, 전기 예외 로깅 | ✅ init-tenant-erp API, ensureErpAccountMappingForTenant | backfill API, 스케줄러(00:08) 추가 |
| Phase 1 | 입금확인→분개→원장 흐름 | ✅ createJournalEntryFromTransaction 자동 호출 | |
| Phase 2 | 차변/대변 수동 분개 폼 | ❌ 미구현 | ERP_JOURNAL_AND_STATEMENTS_DESIGN_SPEC 스펙만 존재 |
| Phase 2 | 재무제표 탭·카드·테이블·차트 | △ IntegratedFinanceDashboard에 탭 있음 | 시각화 품질·토큰 통일 미확인 |
| Phase 3 | 계정 매핑 UI/API(ERP 설정) | ❌ 미구현 | |
| Phase 3 | 전기 실패 재시도/알림 | △ 로깅만 | |

### 2.2 ERP_FINANCIAL_MANAGEMENT_RENEWAL_PLAN.md

| 항목 | 기획 내용 | 구현 여부 |
|------|-----------|-----------|
| 달력 통일 | 재무 달력 ↔ 공통 mg-calendar 구조·토큰 통일 | ❌ FinancialCalendarView 별도 마크업 유지 |
| 색상 통일 | 하드코딩 제거, var(--mg-*) 토큰 사용 | ❌ #495057, #dee2e6, #e3f2fd 등 하드코딩 존재 |
| 카드 정리 | erp-stat-card 등 정리, B0KlA·토큰 적용 | △ ErpDashboard는 B0KlA 적용, 일부 레거시 유지 |
| 필터 단순화 | 기간·거래 유형·카테고리 중심 | △ 미점검 |

### 2.3 ERP_JOURNAL_AND_STATEMENTS_DESIGN_SPEC.md

| 산출물 | 상태 |
|--------|------|
| 분개 입력 폼 레이아웃 스펙 | ✅ 문서화 완료 |
| 차변/대변 테이블·합계·균형 표시 | ❌ UI 미구현 |
| 재무제표 시각화 블록 | △ IntegratedFinanceDashboard 탭 존재, 스펙 준수 여부 미점검 |

### 2.4 ERP_AUTOMATION_GAP_AND_PLAN.md

| 작업 | 권장 주기 | 구현 여부 |
|------|-----------|-----------|
| init + backfill | - | ✅ 2026-02-12 추가: 매일 00:08 |
| 일/주/월 마감, 재무제표, 정산 등 | 문서 대로 cron 정의 | ✅ ErpAutomationScheduler 구현됨 |
| 원장 동기화 | 00:30 | △ 스텁(로그만), 실 로직 미구현 |

---

## 3. 이번 작업으로 반영된 내용 (2026-02-12)

1. **ErpDashboard** (`/erp/dashboard`)
   - 섹션 "ERP 회계 초기화·동기화" 추가
   - URL 노출: `POST /api/v1/erp/accounting/init-tenant-erp`, `POST /api/v1/erp/accounting/backfill-journal-entries`
   - 사용 방법 명시 (init 먼저 → backfill)
   - 실행 버튼으로 API 호출 가능
   - 자동 동기화 안내 (매일 00:08)

2. **ErpAutomationScheduler**
   - `scheduleErpInitAndBackfill()` 추가 (cron: `0 8 0 * * *`)
   - 테넌트별 ensureErpAccountMappingForTenant + backfillJournalEntriesFromIncomeTransactions 실행

---

## 4. 코어 기획 재점검 — 우선 조치 항목

### P0 (즉시)

- [x] 대시보드에 init/backfill URL·사용법·실행 버튼 추가 → **완료**
- [x] 주기적 init·백필 스케줄러 추가 → **완료**

### P1 (Phase 2 핵심 — 사용자 눈에 보이는 변화)

| 번호 | 항목 | 산출물 | 예상 공수 |
|------|------|--------|-----------|
| 1 | **차변/대변 수동 분개 입력 폼** | ERP_JOURNAL_AND_STATEMENTS_DESIGN_SPEC 기반 UI | 3~5일 |
| 2 | **재무제표 시각화 개선** | 대차대조표/손익계산서/현금흐름표 카드·테이블·차트 B0KlA 적용 | 2~3일 |
| 3 | **재무 달력·색상 통일** | FinancialCalendarView → mg-calendar 구조·토큰 통일 | 2~3일 |

### P2 (Phase 3·운영)

| 번호 | 항목 |
|------|------|
| 4 | 계정 매핑 관리 UI (ERP 설정 메뉴) |
| 5 | 원장 동기화 실제 로직 (현재 스텁) |
| 6 | 전기 실패 재시도·알림 |

### P3 (선택)

| 번호 | 항목 |
|------|------|
| 7 | 분개 템플릿, 반복 분개 |
| 8 | 카드·필터 추가 정리 |

---

## 5. 권장 실행 순서

1. **core-planner**: P1 항목 우선순위 확정 및 Phase 2 스프린트 계획
2. **core-designer**: 차변/대변 분개 폼 최신 스펙 검토·보완 (필요 시)
3. **core-publisher**: 분개 폼 HTML 마크업 (ERP_JOURNAL_ENTRY_FORM_MARKUP.md 참조)
4. **core-coder**: 분개 폼·재무제표 시각화·재무 달력 순으로 구현

---

## 6. 참고 링크

- ERP 대시보드: https://mindgarden.dev.core-solution.co.kr/erp/dashboard
- 통합 재무: https://mindgarden.dev.core-solution.co.kr/admin/erp/financial
- 어드민 대시보드 샘플: https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample

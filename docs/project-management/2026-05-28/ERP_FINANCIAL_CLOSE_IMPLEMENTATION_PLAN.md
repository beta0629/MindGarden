# ERP P0-2 ErpFinancialCloseServiceImpl 결산 실구현 합의서

**문서 위치**: `docs/project-management/2026-05-28/ERP_FINANCIAL_CLOSE_IMPLEMENTATION_PLAN.md`  
**브랜치**: `docs/erp-financial-close-plan`  
**작성**: core-planner (오케스트레이션 전용)  
**버전**: v0.1 (Q10 default 안 결재 요청)  
**작성일**: 2026-05-28  
**상태**: **사용자 결재 대기 (Phase 1)**

---

## 0. 본 문서의 위치

본 문서는 사용자가 위임한 **ERP P0 3건 + P1 3건** 중 **PR-B (P0-2)** 에 해당하는 `ErpFinancialCloseServiceImpl` 결산 실구현의 **합의서(Phase 1)** 다. 분량·정책 결정(스키마·재오픈 권한·dry-run 기간·스냅샷 vs 라이브 등)이 운영 데이터 무결성에 직결되므로, **코더 위임 전** Q1~Q10 결재를 받기 위해 작성한다.

본 문서는 **기획 합의서**이며, 실제 마이그레이션 SQL·Java 코드·테스트 코드는 **결재 후** 분배실행 표(§4)에 따라 각 서브에이전트가 작성한다.

---

## §1. 현황 + 위험 평가

### 1.1 현황

| 항목 | 현 상태 | 근거 |
|------|---------|------|
| `ErpFinancialCloseServiceImpl.performDailyClose` | `log.debug` 스텁만 존재 (실 구현 0) | `src/main/java/com/coresolution/consultation/service/impl/ErpFinancialCloseServiceImpl.java:22-24` |
| `performWeeklyClose` / `performMonthlyClose` | 동일 스텁 | `:27-33` |
| `financial_period` 테이블 | **부재** (스키마 자체 없음) | `db/migration/V20260606_*.sql` 조회 결과 없음 |
| 마감 후 거래 수정·삭제 차단 가드 | **부재** | `FinancialTransactionServiceImpl.updateTransaction:173` / `deleteTransaction:216` 어디에도 기간 닫힘 검사 없음 |
| 자동 호출 인프라 | **정상 작동** (`ErpAutomationScheduler` cron) — 단 호출 대상이 스텁 | `scheduler/ErpAutomationScheduler.java:78,172,88` |
| 부가세 (`tax_amount`) | 거래 생성 시 `TaxCalculationUtil` 가 처리, 다만 운영 데이터의 약 38% 가 빈값 (별도 PR-A 영역, 본 PR 에서는 마감 가드만 추가) | 별도 디버거 보고 |

### 1.2 위험 평가

| 위험 | 영향 | 발생 빈도 | 등급 |
|------|------|-----------|------|
| **R1** 마감 후 거래 수정·삭제 → 과거 KPI(매출·이익) 변동 | 재무 신뢰도 손상, 회계 감사 적합성 상실 | 운영 중 수시 발생 가능 | **HIGH** |
| **R2** 부가세 누락(38%)이 마감 시 누적 → 부가세 신고 오차 | 부가세 신고 차이, 세무 리스크 | 마감 시점에만 노출 | **HIGH** |
| **R3** 마감 SQL 합산이 트랜잭션 라이브 테이블 대용량 풀스캔 | 자정 시점 운영 트래픽과 충돌, slow query | 매일 1회 | **MEDIUM** |
| **R4** 재오픈 정책 부재 → 마감 후 정당한 수정(예: 환불 사후 처리) 막힘 | 운영팀 우회 요청 다발 | 월 1~2건 예상 | **MEDIUM** |
| **R5** 신규 가드 도입 시 기존 거래 수정 API 회귀 | 어드민 거래 수정 화면 500 에러 | 배포 직후 | **MEDIUM** |
| **R6** Blue/Green cutover 중 마감 진행 → race condition | 마감 row 중복/누락 | cutover 시점 한정 | **LOW** |

### 1.3 본 PR 의 범위 (Scope)

**포함**: 일/월 마감 실구현, `financial_period` 스키마 신설, 마감 가드(거래 수정·삭제 차단), 재오픈 정책, dry-run 토글, 마감 시 부가세 누적 검증, 단위·통합 테스트.

**제외**: 부가세 누락(38%) 백필(별도 PR-A 영역), 어드민 결산 관리 UI 풀 구현(설계만 옵션, 본 PR 은 백엔드 SSOT 우선), 재무제표 BS/IS/CF 알고리즘 자체 재작성(스냅샷 통합만 수행).

---

## §2. Q1 ~ Q10 결재 변수 + default 안

각 항목에 대해 **default 안** 을 제시한다. 사용자가 수용하면 Q10 일괄 결재로 Phase 2~5 진행, 변경 사항이 있으면 해당 Q 만 수정 후 재결재.

| Q | 결정 변수 | default 안 | 사용자 결재 |
|---|-----------|------------|------------|
| **Q1** | 마감 단위 자동화 범위 | **일 마감 + 월 마감 자동화** (주 마감은 한국 회계 관행상 보편적이지 않음 → `performWeeklyClose` 는 메서드 시그니처/스케줄러만 유지하고 내부에서 dry-run 로그만 수행, 추후 별도 결재 시 활성화) | ☐ |
| **Q2** | 마감 시점 cron | **운영 트래픽 회피 위해 02:00~03:00 KST 이동** — 일 마감 `0 0 2 * * *`, 월 마감 `0 30 2 1 * *`. 기존 `0 10 0 * * *` 은 일별 통계 갱신과 너무 가까워 운영 중 동시 트랜잭션 가능 | ☐ |
| **Q3** | 마감 후 거래 수정 차단 강도 | **강제 차단** 을 기본으로, **HQ_ADMIN(본사) + ADMIN(지점)** 역할만 재오픈 후 수정 가능. 일반 ADMIN/STAFF 는 차단 메시지만 노출 | ☐ |
| **Q4** | `financial_period` 스키마 | 사용자 위임문 §1 의 컬럼 + 인덱스를 **그대로 채택**. tenant_id 는 멀티테넌트 격리 표준에 따라 NOT NULL + UNIQUE 키에 포함. `version` 컬럼으로 낙관적 락 | ☐ |
| **Q5** | 마감 결과 ↔ 재무제표 관계 | **스냅샷 통합** — `financial_period` 의 `total_income`/`total_expense`/`net_amount` 를 `FinancialStatementService` 가 우선 참조, 닫히지 않은 기간만 라이브 합산. 닫힌 기간 KPI 의 불변성 확보 | ☐ |
| **Q6** | 재오픈(REOPEN) 정책 | **HQ_ADMIN 만 허용 + 사유 필수(최소 20자) + audit 기록**. 재오픈 시 `status='REOPENED'`, `reopened_at`/`reopened_by`/`reopen_reason` 채움. 재오픈 후 다시 마감 시 새 row 가 아닌 기존 row UPDATE | ☐ |
| **Q7** | dry-run 토글 | **`mindgarden.scheduler.financial-close.dry-run=true`(기본 true)** 로 운영 배포 후 **1주(=7회 일 마감)** 검증, 합산 결과·실행 시간·예외 분석 후 `false` 전환. 토글은 환경별(application-prod.yml) 별도 관리 | ☐ |
| **Q8** | 부가세 자동 분리 가드 | 마감 시 `tax_amount` 합 ≠ `10% × (INCOME 합 − 환불 합)` 인 경우 **마감 차단(ERROR) + 알림 발송**. dry-run 기간 동안 차이가 누적되면 PR-A(부가세 백필)와 연동 결재 | ☐ |
| **Q9** | 마감 실패 시 retry/rollback | **retry 3회 (간격 30초)** + 최종 실패 시 `financial_period.status=OPEN` 유지(절대 부분 CLOSED 금지) + ERROR 알림 + audit. 트랜잭션 단위는 테넌트별 마감 1건 | ☐ |
| **Q10** | **일괄 결재** | **위 Q1~Q9 default 안 일괄 수용** — Phase 2~5 자동 진행. 변경 시 해당 Q 만 수정 후 재결재 | ☐ |

---

## §3. 마이그레이션 plan (core-coder 위임용 — 실제 SQL 은 코더가 작성)

> 본 합의서는 **파일 경로·마이그 책임·idempotency 원칙** 만 합의한다. 실제 DDL/DML SQL 은 코더가 `/core-solution-database-first` 스킬 + `docs/standards/DATABASE_MIGRATION_STANDARD.md` 를 적용해 작성한다.

| 파일명 | 책임 | 회귀 보호 |
|--------|------|-----------|
| `src/main/resources/db/migration/V20260606_011__create_financial_period.sql` | `financial_period` 테이블 신설 (Q4 스키마) + UNIQUE `(tenant_id, period_type, period_start)` + 인덱스 `(tenant_id, status)`, `(tenant_id, period_end)` | `CREATE TABLE IF NOT EXISTS` + idempotent. 기존 데이터 영향 0. |
| `src/main/resources/db/migration/V20260606_012__seed_financial_period_init.sql` | 운영 시작일(테넌트별 `financial_transactions.MIN(transaction_date)`) 부터 D-1 까지 `period_type='DAY'` 인 OPEN row 백필. 월 row 는 별도 `period_type='MONTH'` 로 같은 기간 백필 | `INSERT ... WHERE NOT EXISTS`. 멀티테넌트 격리(`tenant_id` 기준). dry-run 기간 동안 OPEN 유지되므로 부작용 0. |

**작성 책임**: core-coder. 본 합의서는 위 2개 파일의 **존재·목적·idempotent 원칙** 만 합의하고, 컬럼 정의·인덱스 정의·시드 쿼리는 코더 위임문에 넘겨 `/core-solution-database-first` 스킬과 함께 작성하게 한다.

---

## §4. Java 구현 plan (core-coder 위임용 — 실제 코드는 코더가 작성)

> 본 합의서는 **클래스·메서드·의존성·SSOT** 만 합의한다. 실제 구현 로직은 코더가 작성한다.

### 4.1 신규/수정 클래스 (책임 SSOT)

| 클래스 | 책임 | 위임 대상 |
|--------|------|-----------|
| `entity/FinancialPeriod` (신규) | `financial_period` 테이블 매핑 엔티티. `@Version` 낙관적 락 | core-coder |
| `repository/FinancialPeriodRepository` (신규) | 기간 조회/저장. `findByTenantIdAndPeriodTypeAndPeriodStart`, `findOpenByTenantIdAndDateRange` | core-coder |
| `service/erp/FinancialPeriodService` (신규 인터페이스) | `isPeriodClosed(tenantId, date, type)`, `closePeriod(...)`, `reopenPeriod(...)`, `getPeriodStatus(...)` | core-coder |
| `service/impl/FinancialPeriodServiceImpl` (신규) | 위 인터페이스 구현. dry-run 토글 적용, 부가세 가드(Q8) 호출, audit 기록 | core-coder |
| `service/impl/ErpFinancialCloseServiceImpl` (기존 스텁 → 실구현) | `performDailyClose`/`performMonthlyClose` 에서 `FinancialPeriodService.closePeriod` 호출. `performWeeklyClose` 는 Q1 default 시 dry-run 로그만 | core-coder |
| `service/impl/FinancialTransactionServiceImpl` (수정) | `updateTransaction`(line 173) / `deleteTransaction`(line 216) 진입부에서 `FinancialPeriodService.isPeriodClosed(거래일자)` 가드 호출 → 닫힌 기간이면 `PeriodClosedException` throw (HQ_ADMIN 재오픈 후 수정 가능) | core-coder |
| `service/impl/FinancialStatementServiceImpl` (수정) | BS/IS/CF 생성 시, 닫힌 기간은 `financial_period` 의 스냅샷(`total_income`/`total_expense`/`net_amount`) 사용 (Q5) | core-coder |
| `exception/PeriodClosedException` (신규) | 4xx 응답 + 재오픈 안내 메시지 | core-coder |
| `scheduler/ErpAutomationScheduler` (수정) | cron 표현식을 Q2 default(02:00 KST)로 변경. dry-run 토글 yaml 키 신설 (`mindgarden.scheduler.financial-close.dry-run`) | core-coder |

### 4.2 dry-run 토글 (Q7)

- yaml 키: `mindgarden.scheduler.financial-close.dry-run` (default `true`)
- 토글 `true` 시: `FinancialPeriodServiceImpl.closePeriod` 가 합산만 수행하고 INFO 로그 출력, **row 미삽입**
- 토글 `false` 시: 정상 마감 (row 삽입 + status=CLOSED)
- 환경별 적용: `application-prod.yml` 만 명시적으로 `true` 시작, 1주 검증 후 `false` 전환

### 4.3 부가세 가드 (Q8) — core-coder 위임

`FinancialPeriodServiceImpl.closePeriod` 내 마감 직전 검증:
- `tax_amount_sum` vs `expected_tax = 10% × (income_sum − refund_sum)` 비교
- 차이 발생 시 `TaxIntegrityException` throw → 마감 차단, 알림 발송 (별도 알림 채널 사용)

---

## §5. 분배실행 (역할별 위임 표)

> **기획(core-planner) 은 직접 구현하지 않는다.** 아래 Phase 2~5 는 부모 에이전트가 각 서브에이전트에게 분배 호출하고, 결과를 기획에 보고 → 기획이 사용자에게 최종 보고.

| Phase | 시점 | 담당 서브에이전트 | 적용 스킬 | 의뢰 요지 (전달 프롬프트 요약) |
|-------|------|-------------------|-----------|--------------------------------|
| **Phase 1** | **현재** | 사용자 | — | Q10 default 안 결재. 변경 시 해당 Q 수정 후 재결재. |
| **Phase 2** (선택, 병렬) | Phase 1 직후 | **core-designer** | `/core-solution-atomic-design`, B0KlA, AdminCommonLayout | 어드민 결산 관리 UI/UX 화면설계 (목록: 기간별 마감 상태 카드/표, 액션: 수동 마감/재오픈 모달, 재오픈 사유 필수 입력, audit 로그 뷰어). model=gemini-3.1-pro 권장. 산출: `docs/design-system/SCREEN_SPEC_FINANCIAL_PERIOD.md`. **본 Phase 는 Q10 결재 + 사용자가 UI 도 함께 진행 요청 시에만 실행** |
| **Phase 3** | Phase 1 결재 후 (Phase 2 와 병렬 가능) | **core-coder** | `/core-solution-database-first`, `/core-solution-backend`, `/core-solution-multi-tenant`, `/core-solution-erp` | (a) §3 마이그 2건 작성 (b) §4.1 클래스 신설/수정 (c) §4.2 dry-run 토글 (d) §4.3 부가세 가드 (e) 단위 테스트(`FinancialPeriodServiceImplTest`, `ErpFinancialCloseServiceImplTest`, `FinancialTransactionServiceImpl` 의 가드 회귀 테스트). 워크트리: 본 `docs/erp-financial-close-plan` 브랜치 종료 후 새 `feature/erp-financial-close-impl` 브랜치 |
| **Phase 4** | Phase 3 완료 후 | **core-tester** | `/core-solution-testing` | §6 테스트 매트릭스 T1~T7 실행 + 회귀 매트릭스(어드민 거래 수정 화면, 부가세 거래 검증). dry-run=true 로 1주 시뮬레이션 (서버 시간 조작 가능 시) |
| **Phase 5** | Phase 4 회귀 통과 후 | **core-deployer** | `/core-solution-deployment` | (a) dry-run=true 로 운영 배포 (b) 1주 모니터링 (Slack/이메일 알림 누적) (c) 차이 0 확인 시 dry-run=false 전환 (d) Blue/Green cutover 시 마감 진행 중인 경우 cutover 지연 (race 가드) |

### 분배실행 호출 순서

```
사용자 Q10 결재
   │
   ├── (옵션) Phase 2: core-designer  ┐
   └── Phase 3: core-coder            ├── 결과 → core-planner → 사용자 중간 보고
                                       ┘
                                       │
                                Phase 4: core-tester → 결과 → core-planner
                                       │
                                Phase 5: core-deployer → 1주 모니터링 → dry-run off
                                       │
                                       └── 최종 보고: core-planner → 사용자
```

---

## §6. 테스트 매트릭스 (core-tester 위임용)

> **테스트 시나리오만 합의**. 실제 테스트 코드는 core-tester / core-coder 가 작성.

| ID | 시나리오 | 입력 | 기대 결과 | 검증 책임 |
|----|----------|------|-----------|-----------|
| **T1** | 일 마감 정상 | tenantA, 2026-05-27, INCOME 80만원 매칭 + 환불 30만원 | `financial_period` row insert, status=CLOSED, `net_amount=500,000` | core-tester (단위+통합) |
| **T2** | 마감 후 거래 수정 차단 | T1 직후 동일 거래 PATCH 시도 (일반 ADMIN) | `PeriodClosedException` (4xx), 재오픈 안내 메시지 | core-tester (통합) |
| **T3** | HQ_ADMIN 재오픈 → 수정 | T2 직후 HQ_ADMIN 이 사유(20자+) 입력 후 재오픈, 거래 수정 | `status=REOPENED`, `reopen_reason` 저장, audit 기록 1건, 수정 성공 | core-tester (통합) |
| **T4** | 주/월 마감 일 마감 누적 일관성 | 5월 모든 일 마감 후 5월 월 마감 | 월 `net_amount` = 일별 `net_amount` 합 (오차 0원) | core-tester (통합) |
| **T5** | 부가세 누적 가드 | INCOME 100만 + tax_amount=8만 (정답 10만 대비 −2만) | `TaxIntegrityException` 마감 차단 + 알림 발송 | core-tester (단위) |
| **T6** | dry-run=true | dry-run=true 설정 후 일 마감 실행 | `financial_period` row 미삽입, INFO 로그 "[DRY-RUN] would-close ..." | core-tester (단위) |
| **T7** | 재무제표 스냅샷 vs 라이브 | 마감된 4월 + 미마감 5월 → BS/IS/CF 호출 | 4월 부분은 `financial_period` 스냅샷, 5월 부분은 라이브 합산, 합계 일관 | core-tester (통합) |
| **T8 (회귀)** | 어드민 거래 수정 화면 회귀 | 마감되지 않은 기간 거래 수정 | 가드 통과, 정상 200 | core-tester (회귀) |
| **T9 (회귀)** | 멀티테넌트 격리 | tenantA 마감 ≠ tenantB 마감 | tenantA 마감 후 tenantB 거래 수정 정상 | core-tester (회귀) |

---

## §7. 운영 영향 평가

### 7.1 마이그레이션 영향

- `V20260606_011` (테이블 신설): **운영 영향 0** (신규 테이블, IF NOT EXISTS)
- `V20260606_012` (시드 백필): 테넌트별 일 단위 row × 운영 시작일 ~ D-1. 예: 1년 운영 + 5 테넌트 → 약 1,825 rows. **운영 영향 < 1초**

### 7.2 마감 실행 영향

- 일 마감 SQL: `SELECT SUM(amount) ... FROM financial_transactions WHERE tenant_id=? AND transaction_date=? GROUP BY transaction_type` → 인덱스 `(tenant_id, transaction_date)` 활용 가정 시 **< 1초/테넌트**
- 전체 마감 시간(5 테넌트 가정): **< 5초** (실측 권고)
- 실행 시간대: **02:00~02:30 KST** (운영 트래픽 < 1%, blue/green cutover 시간대와 분리)

### 7.3 Blue/Green cutover 안전성

- 마감 진행 중 cutover 발생 시 race 가드: `FinancialPeriodServiceImpl.closePeriod` 진입 시 `application-name + instance-id` 분산 락(Redis/DB 행 락 중 택1) 또는 `closing → CLOSED` 2-phase 전환으로 동시 실행 방지
- 락 정책은 코더 위임 시 `/core-solution-deployment` + 분산락 스킬 검토 후 결정 (본 합의서 범위 밖, Phase 3 코더가 보고)

### 7.4 dry-run 1주 검증 기준

- 매일 dry-run 마감 후 다음 지표 수집:
  - 실행 시간 (테넌트별)
  - 합산 결과 (income/expense/net)
  - 부가세 가드 차이 (Q8) — 0 이어야 함
  - 예외 발생 건수
- 7일 누적 차이 0 + 예외 0 → dry-run=false 전환 결재
- 차이 발생 시 → PR-A (부가세 백필) 연동 결재 후 재시도

---

## §8. 산출물 체크리스트 (기획 SSOT)

본 합의서가 갖추어야 할 항목 — 자체 검증:

- [x] 현황 + 위험 평가 (§1)
- [x] Q1~Q10 결재 변수 + default 안 (§2)
- [x] 마이그 plan (파일 경로·idempotent 원칙) (§3)
- [x] Java 구현 plan (클래스·메서드 SSOT 만, 코드 자체 없음) (§4)
- [x] 분배실행 표 (Phase 1~5, 서브에이전트·스킬·의뢰 요지) (§5)
- [x] 테스트 매트릭스 T1~T9 (§6)
- [x] 운영 영향 평가 (§7)
- [x] **기획자가 직접 코드/SQL 작성하지 않고 의뢰만 분배** (core-planner 역할 준수)

---

## §9. 사용자 결재 요청 (Q10)

다음을 **일괄 수용** 하시면 Phase 2~5 자동 진행:

> **Q1** 일/월 마감 자동화 (주 마감 dry-run only)  
> **Q2** cron 02:00~02:30 KST 이동  
> **Q3** 강제 차단 + HQ_ADMIN/ADMIN 재오픈 권한  
> **Q4** `financial_period` 스키마 (위임문 § 그대로 채택)  
> **Q5** 스냅샷 통합 (`FinancialStatementService` 닫힌 기간 스냅샷 우선)  
> **Q6** 재오픈 HQ_ADMIN + 사유 20자 + audit  
> **Q7** dry-run=true 운영 1주 검증 후 false 전환  
> **Q8** 부가세 누적 차이 시 마감 차단 + 알림  
> **Q9** retry 3회(30초 간격) + 실패 시 OPEN 유지 + ERROR 알림  

**변경 사항이 있으면** 해당 Q 번호와 변경안만 회신 → 합의서 v0.2 갱신 후 재결재.

**일괄 수용 시 진행 흐름**:

1. (옵션) Phase 2 — core-designer 어드민 결산 관리 UI 화면설계  
2. Phase 3 — core-coder 마이그+Java 구현 + 단위 테스트  
3. Phase 4 — core-tester T1~T9 + 회귀  
4. Phase 5 — core-deployer dry-run 1주 → false 전환  

각 Phase 결과는 core-planner 에게 보고 → 기획이 사용자에게 최종 보고.

---

## 부록 A. 본 PR-B 의 PR-A 와의 관계

- **PR-A (부가세 누락 38% 백필)**: 별도 트랙. 본 PR-B 의 §2 Q8 가드가 dry-run 기간 동안 차이를 노출 → PR-A 결재 트리거.
- 본 PR-B 가 먼저 운영에 들어가도 dry-run=true 로 차이만 감지하므로 PR-A 와 독립적으로 진행 가능.

## 부록 B. 참조 문서·코드

- `src/main/java/com/coresolution/consultation/service/impl/ErpFinancialCloseServiceImpl.java` (현 스텁)
- `src/main/java/com/coresolution/consultation/scheduler/ErpAutomationScheduler.java` (현 cron)
- `src/main/java/com/coresolution/consultation/service/impl/FinancialTransactionServiceImpl.java:173,216` (가드 추가 대상)
- `docs/standards/DATABASE_MIGRATION_STANDARD.md` (코더 위임 시 필수 적용)
- `/core-solution-database-first` 스킬
- `/core-solution-erp` 스킬
- `/core-solution-multi-tenant` 스킬

---

**문서 끝. Q10 결재 회신 대기.**

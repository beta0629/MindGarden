# 급여 확정 후 늦은 상담일지 → 재계산/추가정산 배치 계획서

**브랜치**: `cursor/salary-late-notes-adjustment-14be`  
**PR base**: `develop` only (main 금지, merge 금지)  
**작성**: core-planner  
**일자**: 2026-08-29  
**상태**: Phase 1 착수 (BE coder ∥ designer)

---

## 1. 제목·목표

급여 확정 이후 늦게 COMPLETED된 회기(상담일지 후작성 포함)를 **다음 달로 넘기지 않고**,  
미지급이면 **PRIMARY 제자리 UPDATE(재계산)**, 지급완료면 **ADJUSTMENT INSERT(추가정산)** 로 처리한다.

운영자(`/erp/salary`)가 확정 전 경고·확정 후 “다시 계산 / 빠진 회기 추가 정산” 경로를 한 화면에서 수행한다.

---

## 2. 범위

### 포함
- Flyway: `calculation_kind`, `parent_calculation_id`, PRIMARY unique, 기존행 PRIMARY 백필
- Confirm SP duplicate 검사 → **PRIMARY only** (수식 본문·FLOOR/tax **변경 금지**)
- 신규 SP: Recalc(unpaid), Adjustment(paid), Pre-confirm warning (조회)
- Java: `PlSqlSalaryManagementService(Impl)` + `SalaryManagementController` + Entity/DTO
- FE: `SalaryManagement.js` 경고·버튼·추가정산 라벨 (Clinic-OS)
- 숫자 통합/단위 테스트 (expected vs actual won)
- Approve/Pay가 ADJUSTMENT id에서도 status flip + erp_sync_logs만 동작 (FT INSERT 없음)

### 제외
- `CalculateSalaryPreview_standardized.sql` 수식 변경 (병렬 bc-137bc7a0)
- `ProcessIntegratedSalaryCalculation` 수식 본문·30000 레거시 fallback 수정 (duplicate COUNT만)
- 두 번째 전체월 confirm / 다음 달 이월
- special_support_monthly_payouts 재지급
- `integrated_salary_erp_system.sql`, `salary_management_procedures.sql` 배포 경로 사용
- `SalaryManagementServiceImpl.calculateSalary` UnsupportedOperationException 제거

---

## 3. Locked policy (발명 금지)

| # | 규칙 |
|---|------|
| 1 | CALCULATED/APPROVED(미지급): 기존 PRIMARY **제자리 UPDATE**. 2nd PRIMARY INSERT 금지 |
| 2 | PAID: paid PRIMARY 불변. **ADJUSTMENT**만 INSERT — 새 COMPLETED delta만. 동일 요율·세무·같은 달 |
| 3 | 늦은 회기 다음 달 이월 금지 |
| 4 | 두 번째 전체월 confirm 금지 |
| 5 | special_support: lifetime 1/mapping. Recalc/Adjust는 SS payout INSERT/재지급 금지 |
| 6 | Approve/pay는 financial_transactions INSERT 안 함 |
| 7 | Fail closed: FREELANCE_BASE_RATE 없으면 거절. **새 코드 silent 30000 fallback 금지** |
| 8 | Recalc 시 APPROVED → CALCULATED (재승인 필요) |

---

## 4. 사용자 관점 (디자이너 전달용)

### 사용성
- **누가**: 운영자/관리자 (`SALARY_MANAGE`)
- **목적**: 확정 전 “미완료·일지 미작성”을 인지하고, 확정 후 늦게 완료된 회기를 같은 달에서 재계산/추가정산
- **흐름**: 기간 선택 → (경고 배너) → 확정 → 목록에서 PRIMARY/추가정산 확인 → 미지급이면 “다시 계산”, 지급완료면 “빠진 회기 추가 정산”
- **자주 쓰는 동작**: 경고 확인, 다시 계산, 추가 정산 버튼을 목록 카드/행 액션에 전면 배치

### 정보 노출
- 노출: 미완료 회기 n, 일지 미작성 n, 확정 후 추가 완료 n, 추가정산 행 라벨·금액(1,234원)
- 역할: SALARY_MANAGE 보유자만. 상담사/내담자 화면 비대상
- 비노출: special_support 재지급 UI, FT/ERP 상세, 세무 내부 계산식 상세(요약 세액만)

### 레이아웃
- 화면: `/erp/salary` (`SalaryManagement.js`), AdminCommonLayout children 유지
- 상단/필터: 기존 기간·상담사 필터 유지
- 확정 전: 경고 문구 블록 (n>0일 때만)
- 확정 후 PRIMARY 행: 추가 완료 n + 상태별 CTA
- ADJUSTMENT 행: “추가 정산” 배지 + 금액
- Clinic-OS: slate `#0F172A`, dusty teal MGButton `#0E5F5A`, 4 type steps, Pencil/B0KlA accent bar 금지, page-custom hex 금지(지정 색·토큰만)

---

## 5. Schema SSOT

| 항목 | 내용 |
|------|------|
| `calculation_kind` | VARCHAR/ENUM: `PRIMARY` \| `ADJUSTMENT`. 기존행 → PRIMARY |
| `parent_calculation_id` | ADJUSTMENT → 해당 월 PRIMARY id (NULL on PRIMARY) |
| Unique | 비삭제 PRIMARY 1건 per `(tenant_id, consultant_id, calculation_period)` |
| ADJUSTMENT | 동일 triple 다건 허용 |
| Flyway | **`V20260829_003`** 또는 **`V20260830_001`**부터. `V20260829_001/002`(#681) **편집·사용 금지** |
| tip | 현재 tip `V20260828_003` |

---

## 6. 의존성·순서

```
explore(완료) → Phase1a core-coder(BE: Flyway+SP+Java) ∥ Phase1b core-designer(FE 스펙)
             → Phase2 core-coder(FE)
             → Phase3 core-tester(숫자+FE build)
             → 기획 취합 보고 → (메인) PR→develop
```

Database-first: Flyway → SP → Java Entity/Repo/Service → API → FE.

---

## 7. Phase 목록 · 분배실행표

| Phase | 담당 | 병렬 | 목표 | 적용 스킬 |
|-------|------|------|------|-----------|
| 1a | **core-coder** | ∥ 1b | Flyway + Confirm duplicate PRIMARY-only + Recalc/Adjust/Warning SP+deploy + Java API + 숫자 테스트 골격 | `/core-solution-database-first`, `/core-solution-backend`, `/core-solution-api`, `/core-solution-multi-tenant`, `/core-solution-code-style` |
| 1b | **core-designer** (`model: gemini-3.1-pro` 권장) | ∥ 1a | Clinic-OS FE 스펙 문서 (코드 없음) | `/core-solution-design-handoff`, `/core-solution-atomic-design` |
| 2 | **core-coder** | 1a·1b 후 | SalaryManagement FE + constants + (가능 시) moneyCockpit TODO/포함 | `/core-solution-frontend`, `/core-solution-common-modules`, `/core-solution-encapsulation-modularization` |
| 3 | **core-tester** | 2 후 | 숫자 expected vs actual won + FE `no-unneeded-ternary`/build | `/core-solution-testing` |

### 하드코딩 게이트 (코더·테스터 공통 인용)
- `docs/project-management/ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md` **§17**
- `docs/project-management/SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md` **§1.3**
- `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`
- page-custom hex 금지 (Clinic-OS 지정 slate/teal 또는 토큰만)

---

## 8. 리스크·제약

| 리스크 | 완화 |
|--------|------|
| 병렬 Preview FLOOR/tax PR과 충돌 | Preview·Confirm **수식 본문 미수정**. duplicate COUNT만 PRIMARY-only |
| DB UNIQUE 기존 중복 PRIMARY | 마이그레이션 전 중복 점검·정리 또는 실패 메시지. UNIQUE는 비삭제 PRIMARY만 |
| Confirm SP 레거시 30000 fallback | **건드리지 않음**. 신규 Recalc/Adjust만 fail-closed |
| Approve/Pay가 월 1행 가정 | id 기준 status flip인지 확인·필요 시 확장. FT INSERT 추가 금지 |
| moneyCockpit unpaid ADJUSTMENT | 싸면 포함, 충돌 시 TODO만 PR |
| SYSTEM_USER | SP는 standardized + deployment deploy twin (+ 가능 시 Flyway embed). Flyway만 DROP/CREATE 의존 금지 |
| Quarantine SQL | 배포 경로에 넣지 말 것 |

---

## 9. 완료 기준·체크리스트

### BE
- [ ] `calculation_kind`/`parent_calculation_id` + PRIMARY unique Flyway 적용
- [ ] Confirm duplicate = PRIMARY only (수식 본문 무변경)
- [ ] Recalc: unpaid PRIMARY UPDATE, tax replace, SS 무터치, APPROVED→CALCULATED, same id
- [ ] Adjust: PAID PRIMARY만, delta>0, ADJUSTMENT INSERT, tax on adjustment only, SS=0
- [ ] Warning API: hard-block 없음
- [ ] FREELANCE_BASE_RATE 없으면 새 SP/경로 거절
- [ ] Approve/Pay: ADJUSTMENT id 동작, FT 미작성
- [ ] 테스트 1–4 숫자 통과

### FE
- [ ] 확정 전 경고, 확정 후 CTA, 추가 정산 라벨/금액
- [ ] Clinic-OS 시각 (slate/teal, 4 type steps, no accent bar, no page-custom hex)
- [ ] `no-unneeded-ternary` 없음 / CRA build:ci 통과

---

## 10. 실행 요청 (부모 에이전트)

**다음 순서로 Task를 호출하라.** Phase 1a·1b는 **동시(병렬)** 호출.

1. Task `core-coder` — 아래 §11.1 프롬프트 전문
2. Task `core-designer` — 아래 §11.2 프롬프트 전문 (`model: "gemini-3.1-pro"` 가능 시)
3. 1a·1b 완료 보고 → 기획이 Phase 2 `core-coder` FE 프롬프트(§11.3) 확정 후 호출
4. Phase 3 `core-tester` (§11.4)
5. 결과를 기획에게 반환 → 기획이 사용자 최종 보고

---

## 11. 서브에이전트 전달 프롬프트

### 11.1 Phase 1a — core-coder (스키마 + SP + Java)

```
역할: core-coder. 브랜치 cursor/salary-late-notes-adjustment-14be 에서만 작업.
PR base develop. main/merge 금지. 논리 단위 커밋·푸시.

과제: 급여 늦은 회기 Recalc/Adjustment — DB→SP→Java (FE 금지, 이 Phase).

## Locked policy (발명 금지)
1. CALCULATED/APPROVED: PRIMARY 제자리 UPDATE. 2nd PRIMARY INSERT 금지.
2. PAID: PRIMARY 불변, ADJUSTMENT INSERT (새 COMPLETED delta만). 같은 요율·세무·같은 달.
3. 다음 달 이월 금지. 4. 2nd 전체월 confirm 금지.
5. special_support_monthly_payouts INSERT/재지급 금지 (Recalc/Adjust).
6. Approve/pay: financial_transactions INSERT 금지.
7. 새 코드 FREELANCE_BASE_RATE 없으면 거절. silent 30000 fallback 금지.
8. Recalc 시 APPROVED→CALCULATED.

## Database-first 순서
1) Flyway 2) SP(+deploy twin) 3) Entity/Service/Controller 4) 테스트

## Flyway
- 파일: V20260829_003__salary_calculation_kind_and_parent.sql 권장
  (V20260829_001/002는 #681 예약 — 편집·사용 금지. tip=V20260828_003)
- calculation_kind VARCHAR NOT NULL DEFAULT 'PRIMARY' (또는 ENUM)
- parent_calculation_id BIGINT NULL (FK → salary_calculations.id, ADJUSTMENT만)
- 기존 행 PRIMARY 백필
- Unique: 비삭제 PRIMARY 1건 per (tenant_id, consultant_id, calculation_period)
  (부분 유니크: generated column / 조건부 유니크 패턴은 기존 마이그레이션 관례 따를 것)
- docs/standards/DATABASE_MIGRATION_STANDARD.md, DATABASE_SCHEMA_STANDARD.md, 멀티테넌트 tenant_id

## Confirm SP (수식 본문 금지)
- ProcessIntegratedSalaryCalculation_standardized.sql
  + deployment/ProcessIntegratedSalaryCalculation_deploy.sql
- duplicate COUNT(*) → calculation_kind='PRIMARY' (또는 kind IS NULL을 PRIMARY로 취급 후 NOT NULL 후)만 카운트
- 수식·FLOOR·tax·30000 fallback·SS INSERT 블록 **한 줄도 바꾸지 말 것**
- CalculateSalaryPreview_standardized.sql **수정 금지**

## New SPs (ProcessIntegrated 2회 호출 금지)
표준: database/schema/procedures_standardized/*.sql
배포 twin: database/schema/procedures_standardized/deployment/*_deploy.sql
가능하면 Flyway embed 추가. SYSTEM_USER 이슈로 Flyway-only DROP/CREATE 의존 금지.
Quarantine(integrated_salary_erp_system.sql, salary_management_procedures.sql) 사용 금지.

### RecalcUnpaidSalaryCalculation (이름 관례에 맞게)
- IN: calculation_id (또는 consultant+period→PRIMARY 1건), tenant_id, triggered_by
- Refuse: PAID / ADJUSTMENT / deleted / 없음
- period window = 저장된 period_start/end
- COMPLETED recount = schedules.status='COMPLETED' AND date BETWEEN period (consultation_records 조인 안 함)
- 수식: confirm SSOT 복사(ProcessIntegrated earnings/tax 규칙). Preview Java overwrite 복사 금지.
- FREELANCE_BASE_RATE 없으면 거절 (30000 fallback 금지)
- UPDATE 같은 salary_calculations id; salary_tax_calculations 해당 id 교체
- special_support 무터치
- status=CALCULATED (APPROVED였어도)
- OUT: success, message, calculation_id, completed, gross, net, tax

### InsertSalaryAdjustmentForLateSessions
- IN: paid PRIMARY calculation_id, tenant_id, triggered_by
- Refuse: not PAID or not PRIMARY
- delta = current COMPLETED − (PRIMARY.completed_consultations + SUM non-deleted ADJUSTMENT.completed for parent)
- delta<=0 → 거절 메시지 "추가 완료 회기가 없습니다"
- FREELANCE: gross=delta×current grade rate; tax on adjustment taxable only (3.3%; +10% VAT if is_business_registered). No local 10% on freelance.
- REGULAR: only delta hours×hourly_rate if hours increased; no base_salary again; unsafe면 refuse
- INSERT ADJUSTMENT: same YYYY-MM/period, completed=delta, CALCULATED, parent set, kind=ADJUSTMENT, bonus/SS=0
- tax lines for adjustment id only
- OUT: new calculation_id + amounts

### GetSalaryPreConfirmWarning (또는 동등 조회 SP/쿼리)
- consultant + period → n not COMPLETED, n missing 상담일지(consultation_records.consultation_id≈schedules.id), n COMPLETED now vs stored if PRIMARY exists
- confirm hard-block 금지 (API는 정보만)

## Approve / Pay
- ApproveSalaryWithErpSync_*, ProcessSalaryPaymentWithErpSync_*
- ADJUSTMENT id에서도 status flip + erp_sync_logs만. 월 1행 가정이면 확장.
- financial_transactions INSERT 추가하지 말 것.

## Java
- Entity SalaryCalculation: calculationKind, parentCalculationId (+ enum)
- PlSqlSalaryManagementService + Impl: recalc / createAdjustment / preConfirmWarning
- SalaryManagementController: POST/GET endpoints, permission SALARY_MANAGE
- SalaryManagementServiceImpl.calculateSalary UnsupportedOperationException **유지**
- StandardizedApi 경로 /api/v1/admin/salary/... 관례 준수
- 스킬: /core-solution-backend, /core-solution-api, /core-solution-multi-tenant, /core-solution-code-style
- 표준: docs/standards/BACKEND_CODING_STANDARD.md, API_DESIGN_STANDARD.md (있으면)

## Tests (이 Phase에서 가능한 한 숫자 assert)
대상: SalaryManagementControllerIntegrationTest, PlSqlSalaryManagementServiceImplSpecialSupportBranchTest (확장 또는 신규)
1) Confirm 2×30000=60000; +1 COMPLETED; Recalc → completed=3, earnings=90000, same id, no 2nd primary, no new SS payout
2) PAID 후 +1; Adjust → new ADJUSTMENT, completed=1, earnings=30000, tax on 30000, parent set, primary unchanged; 2nd adjust no sessions refuses
3) adjustment 존재 후에도 2nd PRIMARY confirm refuses
4) Recalc on PAID refuses; Adjust on CALCULATED refuses

## 하드코딩 게이트 인용
- ADMIN_LNB §17, SETTINGS §1.3, PRE_PRODUCTION_GO_LIVE_CHECKLIST
- 새 코드 page-custom hex / silent 30000 금지

## 완료 조건
- 위 DB/SP/Java/테스트 커밋·푸시
- FE 파일 이 Phase에서 수정하지 말 것
- 변경 파일 목록 + 테스트 결과(expected vs actual)를 보고
```

### 11.2 Phase 1b — core-designer (FE 스펙만)

```
역할: core-designer. 코드 작성 금지. 스펙 문서만.
권장 model: gemini-3.1-pro
산출물: docs/design-system/SCREEN_SPEC_SALARY_LATE_NOTES_ADJUSTMENT.md
스킬: /core-solution-design-handoff, /core-solution-atomic-design

화면: /erp/salary — frontend/src/components/erp/SalaryManagement.js
레이아웃: AdminCommonLayout children 유지. 본문만 보강.

## 사용성
운영자(SALARY_MANAGE)가 확정 전 미완료/일지미작성을 보고, 확정 후 늦은 COMPLETED를
미지급→다시 계산 / 지급완료→빠진 회기 추가 정산으로 처리.

## 정보 노출
- 확정 전: "이 기간에 완료 아닌 회기 n건" / "일지 미작성 n건" (n>0만)
- 확정 후: current COMPLETED > stored(primary+adj) 이면 "확정 후 추가 완료 회기 n건"
  - Not paid: 버튼 "다시 계산"
  - Paid: 버튼 "빠진 회기 추가 정산"
- 목록 ADJUSTMENT 행: 라벨 "추가 정산", 금액 "1,234원" 형식
- special_support/FT 내부 비노출

## 레이아웃(배치)
1) 필터/기간 영역 아래 또는 확정 CTA 직전: 경고 배너
2) 월 목록 PRIMARY 행 액션 슬롯: 상태별 CTA
3) ADJUSTMENT 행: 배지+금액, 승인/지급은 기존 플로우와 동일하게 id 단위

## Visual SSOT (Clinic-OS) — Pencil/B0KlA accent bar 사용 금지
- Text slate #0F172A
- MGButton dusty teal #0E5F5A
- 4 type steps
- page-custom hex 금지 (위 지정색 또는 unified-design-tokens만)
- 한국어 짧은 명사구
- 반응형: 모바일에서 경고·CTA 스택

## 산출 필수
- 블록/컴포넌트(Atoms~Organisms) 목록
- 상태별 UI 매트릭스 (미리보기/확정전/CALCULATED/APPROVED/PAID + ADJUSTMENT)
- 토큰·색 변수 매핑표
- 코더 체크리스트 (no-unneeded-ternary 주의 문구 포함)
- 코드/CSS 패치 금지
```

### 11.3 Phase 2 — core-coder (FE) — 1a·1b 완료 후 호출

```
역할: core-coder. FE만 (BE는 이미 머지된 브랜치 상태 전제).
브랜치: cursor/salary-late-notes-adjustment-14be

입력:
- docs/design-system/SCREEN_SPEC_SALARY_LATE_NOTES_ADJUSTMENT.md (designer 산출)
- BE API: recalc / adjustment / pre-confirm-warning (1a에서 확정된 경로)

수정 대상:
- frontend/src/components/erp/SalaryManagement.js (+ 필요 시 CSS는 토큰/지정색만)
- frontend/src/constants/salaryConstants.js (엔드포인트·카피)
- moneyCockpitData.js sumPendingSalaryNet: unpaid ADJUSTMENT 포함이 싸면 포함, 충돌 시 TODO 주석만

규칙:
- Clinic-OS 스펙 준수. page-custom hex 금지.
- no-unneeded-ternary 회피 (CRA build:ci)
- StandardizedApi 사용 (/core-solution-api, /core-solution-frontend)
- 공통 모듈: MGButton, AdminCommonLayout, ContentHeader 등 우선 (/core-solution-common-modules)
- 하드코딩 게이트: ADMIN_LNB §17, SETTINGS §1.3, PRE_PRODUCTION checklist

완료: 커밋·푸시, 변경 파일·수동 확인 포인트 보고
```

### 11.4 Phase 3 — core-tester

```
역할: core-tester. 브랜치 cursor/salary-late-notes-adjustment-14be 검증.

필수 시나리오 (expected vs actual won 숫자):
1) Confirm 2 sessions × 30000 = 60000; +1 COMPLETED; Recalc → completed=3, earnings=90000, same id, no 2nd PRIMARY, no new SS payout
2) Same then PAID +1; Adjust → new ADJUSTMENT id, completed=1, earnings=30000, tax on 30000, parent set, primary unchanged; 2nd adjust no sessions refuses
3) 2nd PRIMARY confirm still refuses after adjustment exists
4) Recalc on PAID refuses; Adjust on CALCULATED refuses
5) FE build: no no-unneeded-ternary / build:ci 관련 lint

스킬: /core-solution-testing
보고: PASS/FAIL 표 + 로그 요약. 실패 시 재현·파일 포인터만 (수정은 core-coder 재위임).
```

---

## 12. 인벤토리 (explore 확정)

| 영역 | 경로 |
|------|------|
| Confirm SSOT | `database/schema/procedures_standardized/ProcessIntegratedSalaryCalculation_standardized.sql` + deploy twin; `PlSqlSalaryManagementServiceImpl.java` |
| Preview SSOT | `CalculateSalaryPreview_standardized.sql` — **이 PR 수식 변경 금지** |
| Approve/Pay | `ApproveSalaryWithErpSync_standardized.sql`, `ProcessSalaryPaymentWithErpSync_standardized.sql` (+ deploy) |
| Entity/API | `SalaryCalculation.java`, `SalaryManagementController.java`, `PlSqlSalaryManagementService*.java` |
| FE | `frontend/src/components/erp/SalaryManagement.js`, `salaryConstants.js`, `moneyCockpitData.js` |
| Tests | `SalaryManagementControllerIntegrationTest.java`, `PlSqlSalaryManagementServiceImplSpecialSupportBranchTest.java` |
| 일지 | `consultation_records.consultation_id` ≈ `schedules.id` |
| Quarantine | `integrated_salary_erp_system.sql`, `salary_management_procedures.sql` |

---

## 13. 최종 보고 템플릿 (배치 완료 시 기획이 채움)

- Cause → SSOT → Tests
- 변경 파일 목록
- 잔여 리스크 / 병렬 Preview PR 주의
- PR: base `develop` only

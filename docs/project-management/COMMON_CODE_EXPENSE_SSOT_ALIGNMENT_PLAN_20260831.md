# 공통코드 ↔ 비용 카테고리 SSOT 정합 배치 계획서

**브랜치**: `cursor/common-code-expense-ssot-0237` (base: develop)  
**주관**: core-planner  
**구현**: core-coder만 · **검증**: core-tester만  
**작성일**: 2026-08-31

---

## 1. 제목·목표

공통코드 테이블(`common_codes`)을 비용(EXPENSE_*) 카테고리/서브의 **단일 SSOT**로 통일하고, 등록 UX 최소화(자동 codeValue)·삭제 경로 정합(목록 키 = 삭제 타깃)·시드/SP/Java calc가 동일 트리를 쓰도록 한다. display-only alias 맵으로 “고친 척” 금지.

---

## 2. 범위

### 포함

| 영역 | 내용 |
|------|------|
| Read/Write/Delete 스코프 | EXPENSE_CATEGORY / EXPENSE_SUBCATEGORY(및 동계열 finance 그룹)에서 **테넌트 행이 있으면 tenant-only**; hybrid 동시 노출 제거 |
| 시드 | Onboarding Java 시드 ↔ CopyDefaultTenantCodes SP whitelist ↔ core bootstrap 역할 정리 |
| Java/SP calc | `FINANCIAL_*` leftover → `EXPENSE_*` SSOT; 카테고리명/코드 매직·한글 리터럴 fallback 제거 |
| 등록 UX | codeValue 자동생성(PACKAGE 패턴 확장); 최소 필드(루트: 표시이름 / 자식: parent+표시이름) |
| 삭제 | 목록에 보이는 행 id/스코프 = DELETE 타깃; 「존재하지 않는 코드」 금지 |
| FE | QuickExpenseForm 등 하드코딩 칩/코드 제거; display-only merge 맵 금지 |
| 마이그레이션 | 필요 시 Flyway: 미시드 테넌트 EXPENSE_* 백필, SP whitelist, leftover write 경로 정리. **기존 장부 금액 리맵 금지**; write 값만 SSOT로 migrate |

### 제외 (건드리지 말 것)

- 원천세 / salary formula / polarity / Clinic-OS restyle
- main 머지
- 기존 장부 저장 코드 값의 금액성 재계산

---

## 3. 설계 방향 (채택)

**테넌트 스코프 = 운영 SSOT**

1. 테넌트에 `EXPENSE_*`(및 동일 정책 finance 그룹) 행이 있으면 **그것으로만** list/read/write/delete.
2. core(`tenant_id IS NULL`)는 부트스트랩·폴백 시드 원천일 뿐, **hybrid로 동시 노출한 뒤 tenant DELETE 하면 안 됨**.
3. 미시드 테넌트는 onboarding / `CopyDefaultTenantCodes` / Flyway로 **테넌트 행을 채운 뒤** core 폴백 노출을 제거(또는 “테넌트 0건일 때만 core 읽기 전용 폴백, 쓰기는 테넌트 생성”으로 단일화 — 코더가 근거 남기고 선택).
4. `FINANCIAL_CATEGORY` / `FINANCIAL_SUBCATEGORY` leftover write는 `EXPENSE_*`로 이관 또는 제거.
5. 코드 자동생성: `ConsultationPackageCodeConstants` + `generateCodeValue` 패턴을 그룹별 prefix 상수로 확장. 이름 하드코딩 리스트 금지.

---

## 4. 파일 단위 수정 대상 (예상)

### Backend — read/write/delete 스코프

| 파일 | 작업 |
|------|------|
| `CommonCodeRepository.java` | hybrid `findCodesByGroupWithFallback` 사용처 정리; tenant-first 전용 조회 또는 “tenant 존재 시 tenant-only” 쿼리/서비스 로직 |
| `CommonCodeServiceImpl.java` | `getCodesByGroupWithFallback` / `getActiveCodesByGroup` / ERP financial 경로가 동일 스코프 사용 |
| `TenantCommonCodeServiceImpl.java` | 자동 codeValue를 EXPENSE_* 등으로 확장; delete가 목록과 동일 키; 미사용=성공, 사용중=실제 사유 |
| `TenantCommonCodeController.java` / `CommonCodeController.java` | API 스코프 문서·동작 정합 |
| `ErpController.java` (`/common-codes/financial`) | EXPENSE_* 조회가 테넌트 SSOT와 동일 |

### Backend — 시드·상수

| 파일 | 작업 |
|------|------|
| `FinancialCommonCodeInitializer.java` | core 시드 유지하되 “운영 list에 hybrid 동시노출”과 충돌하지 않게 역할 명시 |
| `TenantOnboardingSalaryAndFinancialSeedDefinitions.java` | 테넌트 시드 트리 = SSOT |
| `OnboardingServiceImpl.java` (`insertDefaultTenantCommonCodes`) | 동일 트리 시드 |
| `OnboardingConstants.java` | 필요 시 그룹/상수 |
| `FinancialCommonCodeSeedStrings.java` | 표시 문자열 상수 유지·재사용 |
| `CommonCodeSubcategoryParents.java` | EXPENSE/INCOME parent 매핑 유지·검증 |
| `ConsultationPackageCodeConstants.java` 또는 신규 `TenantCommonCodeAutoValueConstants` | 그룹별 prefix 맵 (이름 리스트 금지) |

### Backend — calc leftover

| 파일 | 작업 |
|------|------|
| `FinancialTransactionServiceImpl.java` | `FINANCIAL_CATEGORY`/`FINANCIAL_SUBCATEGORY` 및 한글 리터럴 `getSafeCodeName` → `EXPENSE_*` SSOT |
| `FinancialTransactionConstants.java` | SSOT 코드값과 시드 정렬; 레거시 remap은 write→SSOT만, display-only 확장 금지 |

### DB / SP / Flyway

| 파일 | 작업 |
|------|------|
| `copy_default_tenant_codes.sql` + 최신 Flyway SP 재생성 | whitelist에 `EXPENSE_CATEGORY`,`EXPENSE_SUBCATEGORY`(및 정합에 필요한 finance 그룹) 추가 |
| 신규 Flyway (예: `V20260831_*`) | (1) SP 갱신 (2) 테넌트 EXPENSE_* 미시드 백필(core→tenant copy, 중복 스킵) (3) 필요 시 leftover 그룹 비활성/메타데이터 정리. **financial_transactions 금액 리맵 금지**; category 코드 정규화가 필요하면 기존 V20260829 패턴처럼 **write값→SSOT 코드**만 |

### Frontend

| 파일 | 작업 |
|------|------|
| `tenantCodeConstants.js` | `HYBRID_READ_WITH_CORE_FALLBACK_GROUPS`에서 EXPENSE_* 제거(또는 tenant-only read); `TENANT_WRITE_ISOLATED`와 list 경로 일치; FINANCIAL_* leftover 정리 |
| `commonCodeApi.js` | list/delete/create 동일 스코프 |
| `CommonCodeManagement.js` / `CommonCodeForm.js` | 자동코드 UX; 최소 필드; 한국어 카피 유지 |
| `commonCodeParentGroups.js` | parent filter 정합 |
| `QuickExpenseForm.js` | `MANAGEMENT_FEE` 등 하드코딩 제거 → API/SSOT 코드 |
| `financialTransactionCategoryPicker.js` (+ constants) | **표시 전용 merge로 버그 은폐 금지**; API SSOT 옵션만 |
| `moneyCockpitData.js` 등 | 매직 카테고리 코드 제거·상수/API 의존 |

### Tests (코더가 추가·수정, 테스터가 실행 게이트)

| 파일 | 검증 |
|------|------|
| `OnboardingDefaultTenantCommonCodesSeedTest.java` | 시드에 EXPENSE_* |
| `TenantCommonCodeServiceImplTest.java` / `CommonCodeServiceImplTest.java` | parent filter, 자동코드, delete 키 |
| `FinancialTransactionConstantsTest.java` | SSOT remap |
| FE jest: form/parent/picker | 최소필드·하드코딩 없음 |

---

## 5. 마이그레이션 여부

| 항목 | 필요 | 비고 |
|------|------|------|
| CopyDefaultTenantCodes whitelist | **예** | EXPENSE_* 추가 |
| 기존 테넌트 EXPENSE_* 백필 | **예** (미시드 테넌트) | core 복사, 이미 있으면 skip |
| financial_transactions 금액 | **아니오** | 금지 |
| category 코드 문자열 정규화 | 조건부 | 기존 SSOT 마이그레이션과 충돌 없이 write값만; 금액 미변경 |
| FINANCIAL_* 메타/시드 정리 | 조건부 | leftover write 제거 후 메타 정리 |

---

## 6. Phase · 분배실행

| Phase | 담당 | 병렬 | 목표 |
|-------|------|------|------|
| 0 | core-planner | — | 본 계획서·위임 프롬프트 (완료) |
| 1 | **core-coder** | 단독 | SSOT 정합·시드·SP·자동코드·삭제·FE 하드코딩 제거 구현 |
| 2 | **core-tester** | Phase1 후 | 단위/통합: parent filter, 등록 노출, delete=list 키, 시드, 리터럴 부재 |
| 3 | core-planner | Phase2 후 | 최종 보고(증상/SSOT/변경/SP·init/migration/검증/리스크) |

### Phase 1 완료 조건 (코더)

1. 등록 → 부모 아래 자식 노출 (parent filter)
2. 삭제: 목록 행 = 삭제 타깃; 「코드가 없다」 금지
3. 테넌트 시드 = 동일 EXPENSE_* 트리; SP whitelist 포함
4. SP/Java calc가 EXPENSE_* SSOT; preview≠confirm 분기 금지; FINANCIAL_* leftover write 제거
5. codeValue 자동생성 + 최소 필드 UX
6. backend/calc/QuickExpense 등 카테고리 매직 스트링 금지
7. display-only alias로 해결하지 않음
8. 원천세/salary/polarity/Clinic-OS 미변경
9. 하드코딩 게이트 문서 §17 / §1.3 준수

### Phase 2 완료 조건 (테스터)

- parent filter / 신규 등록 노출 / delete list·write 동일키 / 시드 / 서비스·SP 카테고리 리터럴 없음 — 증빙(로그·테스트 결과) 첨부

---

## 7. 리스크·제약

| 리스크 | 완화 |
|--------|------|
| hybrid 제거 후 미시드 테넌트 빈 드롭다운 | Flyway 백필 + onboarding/SP 정합을 같은 PR에 |
| 기존 장부 category 문자열 | 금액 리맵 금지; 필요 시 코드값만 SSOT migrate |
| FINANCIAL_* 잔존 참조 | 전수 grep 후 calc/write만 이관; UI 탭 leftover는 TENANT_WRITE에서 정리 |
| PACKAGE 자동생성 확장 충돌 | 그룹별 prefix 상수; 기존 PACKAGE 동작 회귀 테스트 |

---

## 8. 참조 (코더·테스터 프롬프트에 인용)

- `docs/standards/BACKEND_CODING_STANDARD.md`, `FRONTEND_DEVELOPMENT_STANDARD.md`, `API_CALL_STANDARD.md`, `COMMON_MODULES_USAGE_GUIDE.md`
- `CommonCodeSubcategoryParents`, `tenantCodeConstants`, `FinancialTransactionConstants`, `TenantOnboardingSalaryAndFinancialSeedDefinitions`
- 하드코딩 게이트: `docs/project-management/ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md` §17  
  `docs/project-management/SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md` §1.3  
  `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`
- `/core-solution-backend`, `/core-solution-frontend`, `/core-solution-multi-tenant`, `/core-solution-database-first`, `/core-solution-encapsulation-modularization`

---

## 9. 실행 요청

부모 에이전트는 **즉시 Phase 1 `core-coder` Task**를 호출하고, 완료 후 **Phase 2 `core-tester`**를 호출한 뒤 결과를 core-planner에 회신한다.

# 급여관리 기산일 초기화·프로필 모달 빈 화면 수정 계획

**작성일**: 2025-03-17  
**담당**: core-planner (기획·분배·위임문만, 코드 수정 없음)  
**참조**: docs/debug/SALARY_CONFIG_AND_PROFILE_MODAL_DEBUG.md

---

## 1. 제목·목표

- **제목**: 급여 기산일 설정 재진입 시 초기화 현상 및 프로필 작성 모달 빈 화면 수정
- **목표**: (1) 설정 조회 API 응답을 프론트 state 키에 매핑해 기산일·지급일 등이 재진입 시 유지되게 하고, (2) 프로필 모달에서 상담사 grade 포함·async 처리 정리로 빈 화면 및 Promise 예외를 제거한다.

---

## 2. 범위

| 구분 | 내용 |
|------|------|
| **포함** | SalaryConfigModal 기산일 매핑, SalaryManagement 상담사 평탄화 grade 추가, SalaryProfileFormModal 등급·기본급 async/state 정리 |
| **제외** | 백엔드 API 스펙 변경(방안 A 기준), 급여관리 외 다른 화면 |
| **영향** | 급여관리 화면 — 기산일 설정 모달, 상담사 목록, 프로필 작성 모달 |

---

## 3. 의존성·순서

- **선행**: 없음. 디버그 문서의 수정 제안·체크리스트가 확정된 상태.
- **Phase 간**: Phase 1(기산일)과 Phase 2(프로필 모달)은 **서로 다른 파일**이므로 동시 진행 가능. 단, 한 명의 core-coder가 수행할 경우 Phase 1 → Phase 2 순으로 진행해도 됨.

---

## 4. Phase 목록 및 분배실행

| Phase | 담당 | 목표 | 호출 시 전달할 태스크 설명 초안 |
|-------|------|------|--------------------------------|
| **Phase 1** | **core-coder** | 기산일 설정 재진입 시 저장값 유지 | 아래 “Phase 1: core-coder 위임문” 참조 |
| **Phase 2** | **core-coder** | 프로필 모달 열 때 상담사·등급·기본급 정상 표시, Promise 예외 제거 | 아래 “Phase 2: core-coder 위임문” 참조 |

- Phase 1·2는 **동시 호출 가능**(파일 겹침 없음). 한 번에 core-coder 한 명에게 “Phase 1 + Phase 2 모두 수행”으로 위임해도 됨.

---

## 5. core-coder 위임문 (실행 분배용)

아래 내용을 **core-coder 호출 시 전달할 태스크 설명**으로 사용한다. 참조 문서: `docs/debug/SALARY_CONFIG_AND_PROFILE_MODAL_DEBUG.md`.

---

### Phase 1: 기산일 설정 — API 응답 → 폼 state 매핑

**수정할 파일**

- `frontend/src/components/erp/SalaryConfigModal.js`

**할 일 (2~5줄)**

1. `loadCurrentConfigs` 내부에서 `GET /api/v1/admin/salary/configs` 응답 `data.data`를 **폼 state 키로 매핑**한 뒤 `setConfigs` 호출.
2. 매핑 규칙: `SALARY_BASE_DATE` → `monthlyBaseDay`, `SALARY_PAYMENT_DAY` → `paymentDay`, `SALARY_CUTOFF_DAY` → `cutoffDay`, `SALARY_BATCH_CYCLE` → `batchCycle`, `SALARY_CALCULATION_METHOD` 등 → `calculationMethod`. 숫자/문자열 타입은 기존 폼과 동일하게 유지.
3. 매핑되지 않은 키는 기존 `useState` 초기값과 동일하게 유지(예: `LAST_DAY`, 5, `MONTHLY`, `CONSULTATION_COUNT`).

**완료 기준**

- 모달 열 때 조회 응답의 각 코드값이 해당 폼 필드(월급여 기산일, 지급일, 마감일, 배치 주기, 계산 방식)에 반영됨.
- 저장 후 모달을 닫았다가 다시 열어도 직전에 저장한 값이 그대로 표시됨.

**참조**

- 디버그 문서 “문제 1” 수정 제안 방안 A, 체크리스트.

---

### Phase 2: 프로필 모달 — grade 포함 및 async 정리

**수정할 파일**

- `frontend/src/components/erp/SalaryManagement.js`
- `frontend/src/components/erp/SalaryProfileFormModal.js`

**할 일 (2~5줄)**

1. **SalaryManagement.js**  
   `loadConsultants` 내부에서 상담사 목록을 평탄화할 때 **`grade: c.grade`** 를 포함한다. (API는 이미 grade를 내려주므로 평탄화 단계에서만 추가.)

2. **SalaryProfileFormModal.js**  
   - **등급·기본급**: `getGradeBaseSalary`, `convertGradeToKorean` 등 async 함수를 **렌더/동기 경로에서 제거**. state + useEffect로 비동기 로드 후, 렌더에서는 해당 state(예: `gradeKoreanName`, `gradeBaseSalary`)만 참조.
   - **initializeFormData**: `getGradeBaseSalary` 사용 시 **async/await**로 처리해 `baseSalary`에 **숫자만** 넣기. 또는 `gradeTableData` 로드 후 해당 등급 기본급을 동기적으로 설정.
   - JSX에서 `getGradeBaseSalary(...).toLocaleString()` 제거 → `formData.baseSalary`(숫자) 또는 미리 계산한 state를 toLocaleString.
   - JSX에서 `convertGradeToKorean(consultant.grade)` 제거 → 미리 로드한 state(한글명) 표시.

**완료 기준**

- 급여관리에서 상담사 선택 후 프로필 작성 모달을 열면 상담사 이름·등급·기본 급여 등이 정상 표시됨.
- 콘솔에 Promise/TypeError 없이 모달이 열림.
- 등급 변경 시 기본 급여·옵션 금액이 기대대로 바뀜.

**참조**

- 디버그 문서 “문제 2” 수정 제안 1)·2), 체크리스트.

---

## 6. 리스크·제약

- 기산일 쪽은 **프론트 매핑만** 추가하므로 백엔드·다른 클라이언트 영향 없음.
- 프로필 모달은 `gradeTableData`·등급 옵션 로드 시점에 따라 useEffect 의존성 배열을 정확히 두어 무한 루프를 피할 것.

---

## 7. 단계별 완료 기준·체크리스트

| Phase | 완료 기준 | 체크리스트 |
|-------|-----------|------------|
| Phase 1 | 기산일 설정 모달 재진입 시 저장값 유지 | 디버그 문서 “문제 1” 체크리스트 2항목 |
| Phase 2 | 프로필 모달 정상 표시·콘솔 에러 없음 | 디버그 문서 “문제 2” 체크리스트 3항목 |

---

## 8. 실행 요청문 (분배실행)

**다음 순서로 서브에이전트를 호출해 주세요.**

1. **core-coder** 1회 호출  
   - **전달 내용**:  
     - “위 문서의 **Phase 1**과 **Phase 2**를 모두 수행해 주세요.  
     - 수정 파일: `SalaryConfigModal.js`, `SalaryManagement.js`, `SalaryProfileFormModal.js`.  
     - 상세 할 일·완료 기준은 본 문서 §5 Phase 1·Phase 2 위임문과 `docs/debug/SALARY_CONFIG_AND_PROFILE_MODAL_DEBUG.md`를 참조하세요.  
     - 적용 스킬: `/core-solution-frontend`, `/core-solution-code-style`.”
   - **병렬**: Phase 1·2를 다른 코더에게 나누어 줄 경우, Phase 1만 전달 / Phase 2만 전달로 각각 호출 가능.

2. 구현 완료 후 **체크리스트**(§7) 기준으로 동작 확인하고, 결과를 기획에게 보고.

---

**문서 끝**

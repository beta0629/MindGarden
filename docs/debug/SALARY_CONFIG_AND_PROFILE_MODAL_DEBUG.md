# 급여관리 기산일 초기화·프로필 모달 빈 화면 디버그 분석

**작성일**: 2025-03-17  
**담당**: core-debugger (분석·제안만, 코드 수정 없음)

---

## 문제 1: 급여 기산일을 설정해도 다시 들어가면 초기화됨

### 증상

- 급여 기산일(월급여 기산일·지급일·마감일 등)을 설정하고 저장한 뒤, 모달을 닫았다가 다시 열면 이전에 저장한 값이 아닌 초기값(또는 빈 값)으로 보인다.

### 추적 경로

| 구간 | 파일·메서드 | 내용 |
|------|-------------|------|
| 프론트 로드 | `SalaryConfigModal.js` | `isOpen` 시 `loadCurrentConfigs()` → `GET /api/v1/admin/salary/configs` 호출 |
| 프론트 state | 동일 | 응답에서 `data.success && setConfigs(data.data)` 로 **전체 교체**. 폼 state 키: `monthlyBaseDay`, `paymentDay`, `cutoffDay`, `batchCycle`, `calculationMethod` |
| 백엔드 조회 | `SalaryManagementController.getSalaryConfigs()` | `commonCodeService.getActiveCodesByGroup("SALARY_CONFIG")` → `codeValue` 기준으로 Map 구성 |
| 백엔드 응답 구조 | `CommonCodeServiceImpl.getActiveCodesByGroup` | 각 코드마다 `codeValue`, `codeLabel`, `codeDescription` 포함. Controller에서 `configs.put(codeValue, codeDesc != null ? codeDesc : codeLabel)` 로 **키 = codeValue** (예: `SALARY_BASE_DATE`, `SALARY_PAYMENT_DAY`) |

### 근본 원인

- **API 응답 키와 프론트 폼 state 키 불일치**
  - 백엔드: 응답 `data` = `{ SALARY_BASE_DATE: "25", SALARY_PAYMENT_DAY: "5", SALARY_CUTOFF_DAY: "LAST_DAY", SALARY_BATCH_CYCLE: "MONTHLY", ... }` (codeValue가 키, 실제 저장값이 value).
  - 프론트: `setConfigs(data.data)` 로 위 객체를 그대로 state에 넣으면, state는 `monthlyBaseDay`/`paymentDay`/`cutoffDay` 등이 **존재하지 않는** 구조가 됨.
  - 폼/프리뷰는 `configs.monthlyBaseDay`, `configs.paymentDay` 등을 참조하므로 `undefined` → 초기 state 기본값만 남거나, BadgeSelect에 value가 없어 “선택 안 됨”처럼 보이거나 초기화된 것처럼 보임.
- 저장 시에는 프론트가 `configs.monthlyBaseDay` 등을 사용해 `configType: 'SALARY_BASE_DATE'`, `configValue: configs.monthlyBaseDay` 형태로 보내므로, **저장은 정상**이고 **조회 후 매핑만 빠진 상태**로 보는 것이 맞음.

### 재현 절차

1. 급여관리 화면에서 “급여 기산일 설정” 모달 열기.
2. 월급여 기산일(예: 25일), 지급일·마감일 등 변경 후 저장.
3. 모달 닫기.
4. 다시 “급여 기산일 설정” 모달 열기.
5. **확인**: 방금 저장한 값이 아니라 말일/기본값 등으로 보이거나 비어 있음.

### 수정 제안

- **방안 A (권장): 프론트에서 응답 → 폼 키 매핑**
  - **파일**: `frontend/src/components/erp/SalaryConfigModal.js`
  - **위치**: `loadCurrentConfigs` 내부, `setConfigs(data.data)` 호출 전.
  - **내용**: API 응답 `data.data`를 폼 state 키로 매핑한 뒤 `setConfigs` 호출.
    - 예: `SALARY_BASE_DATE` → `monthlyBaseDay`, `SALARY_PAYMENT_DAY` → `paymentDay`(숫자로 변환), `SALARY_CUTOFF_DAY` → `cutoffDay`, `SALARY_BATCH_CYCLE` → `batchCycle`, `SALARY_CALCULATION_METHOD` 등 → `calculationMethod`.
  - 기본값: 매핑되지 않은 키는 기존 `useState` 초기값과 동일하게 유지(예: `LAST_DAY`, 5, `MONTHLY`, `CONSULTATION_COUNT`).
- **방안 B: 백엔드 응답 구조 변경**
  - **파일**: `src/main/java/.../controller/SalaryManagementController.java` `getSalaryConfigs`
  - **내용**: 반환 Map의 키를 프론트와 맞추어 `monthlyBaseDay`, `paymentDay`, `cutoffDay`, `batchCycle`, `calculationMethod` 등으로 내려주기. (다른 클라이언트가 같은 API를 쓰면 호환성 고려 필요.)

**체크리스트 (수정 후)**

- [ ] 모달 열 때 `GET /api/v1/admin/salary/configs` 응답의 각 코드값이 해당 폼 필드(월급여 기산일, 지급일, 마감일, 배치 주기, 계산 방식)에 반영되는지 확인.
- [ ] 저장 후 모달을 닫았다가 다시 열어도 직전에 저장한 값이 그대로 표시되는지 확인.

---

## 문제 2: 프로필 작성 시 상담사 클릭하면 빈 화면만 노출

### 증상

- 급여관리에서 상담사를 선택해 “프로필 작성” 등으로 진입 시, 모달이 뜨지만 내용이 거의 비어 있거나 빈 화면만 보이고, 콘솔에 Promise/타입 관련 에러가 날 수 있음.

### 추적 경로

| 구간 | 파일·메서드 | 내용 |
|------|-------------|------|
| 상담사 목록 | `SalaryManagement.js` `loadConsultants` | `getAllConsultantsWithStats()` 결과를 `item.consultant` 기준으로 평탄화. 반환 객체에 `id`, `name`, `email`, `phone`, `role`, `isActive`, `branchCode`, `specialty`, … 포함하지만 **`grade` 필드는 포함하지 않음**. |
| 백엔드 | `ConsultantStatsServiceImpl` 등 | 상담사 with-stats API에서는 `consultantMap.put("grade", consultant.getGrade())` 로 **grade를 내려줌**. 즉 API에는 grade 존재. |
| 프로필 모달 초기화 | `SalaryProfileFormModal.js` `initializeFormData` | `consultant.grade`, `getGradeBaseSalary(consultant.grade)`, `getGradeOptions(consultant.grade)` 사용. `getGradeBaseSalary`는 **async**인데 **await 없이** 호출 → 반환값이 Promise. `baseSalary`에 Promise가 들어감. |
| 프로필 모달 렌더 | 동일 | `convertGradeToKorean(consultant.grade)` → async 함수를 동기처럼 JSX에서 사용 → Promise가 문자열 위치에 렌더되거나 예외 유발. `getGradeBaseSalary(formData.grade \|\| consultant.grade).toLocaleString()` → **Promise에 .toLocaleString() 호출** → 런타임 예외(예: "Promise.prototype.toLocaleString is not a function" 유사) → React 에러 경계 또는 빈 화면. |

### 근본 원인

1. **상담사 객체에 `grade` 누락**  
   `SalaryManagement.js`의 `loadConsultants` 평탄화 시 `grade`를 복사하지 않아, 모달에 전달되는 `consultant.grade`가 `undefined`.
2. **async 함수를 동기/렌더에서 사용**  
   - `initializeFormData`에서 `getGradeBaseSalary(consultant.grade)`를 await 없이 써서 `formData.baseSalary`가 Promise로 설정됨.  
   - JSX에서 `getGradeBaseSalary(...).toLocaleString()` 호출 → Promise에 `.toLocaleString()`을 붙여 예외 발생.  
   - `convertGradeToKorean(consultant.grade)`도 async인데 JSX에서 동기처럼 사용되어 Promise가 노출되거나 렌더 오류 가능.

위 조합으로 인해 모달이 열리자마자 예외가 나면서 **빈 화면만 보이는 현상**이 발생한 것으로 판단됨.

### 재현 절차

1. 급여관리 화면에서 상담사 목록이 로드된 뒤, 특정 상담사를 선택하여 “프로필 작성”(또는 급여 프로필 생성) 모달을 연다.
2. **확인**: 모달이 뜨지만 폼 내용이 비어 있거나, 화면이 비어 있고 브라우저 콘솔에 Promise/TypeError 관련 에러가 있다.

### 수정 제안

- **1) 평탄화 시 `grade` 포함**
  - **파일**: `frontend/src/components/erp/SalaryManagement.js`
  - **위치**: `loadConsultants` 내부, `raw.map` 안에서 `return { ... }` 하는 객체.
  - **내용**: `c.grade`를 그대로 넘기도록 `grade: c.grade` 추가. (API가 이미 grade를 주므로, 평탄화 단계에서만 추가하면 됨.)

- **2) 프로필 모달에서 async 처리 정리**
  - **파일**: `frontend/src/components/erp/SalaryProfileFormModal.js`
  - **방향 (택일 또는 병행)**  
    - **2-1) 등급·기본급을 state + useEffect로 로드**  
      - `consultant`/`isOpen` 변경 시 `getGradeBaseSalary`, `convertGradeToKorean`을 async로 호출하고, 결과를 state에 저장.  
      - 렌더에서는 해당 state만 참조 (예: `gradeKoreanName`, `gradeBaseSalary`).  
    - **2-2) 동기 fallback 사용**  
      - 등급 한글명: 이미 있는 `getGradeKoreanName`이 동기 버전이 있다면 그쪽 사용, 없으면 위 2-1처럼 state로 로드.  
      - 기본급: `gradeTableData`에서 해당 등급의 `baseSalary`를 찾아 쓰는 등, 모달 내에서 동기적으로 계산 가능한 값은 Promise 없이 설정.
  - **구체 수정 포인트**  
    - `initializeFormData`: `getGradeBaseSalary`를 호출할 경우 **async/await**로 처리하고, 얻은 숫자를 `setFormData`의 `baseSalary`에 넣기. 또는 `gradeTableData` 로드 후 해당 등급의 기본급을 동기적으로 넣기.  
    - JSX에서 `getGradeBaseSalary(...).toLocaleString()` 제거. 대신 `formData.baseSalary`(숫자)를 toLocaleString 하거나, 2-1처럼 미리 계산해 둔 state를 표시.  
    - JSX에서 `convertGradeToKorean(consultant.grade)` 호출 제거. 2-1처럼 state에 한글명을 넣어 두고 그 state를 표시.

**체크리스트 (수정 후)**

- [ ] 급여관리에서 상담사 선택 후 프로필 작성 모달을 열면, 상담사 이름·등급·기본 급여 등이 정상 표시되는지 확인.
- [ ] 콘솔에 Promise/TypeError 없이 모달이 열리는지 확인.
- [ ] 등급 변경 시 기본 급여·옵션 금액이 기대대로 바뀌는지 확인.

---

## 기획 위임용 요약

- **기산일 초기화 (문제 1)**  
  **원인**: 설정 조회 API는 `SALARY_BASE_DATE` 등 codeValue 키로 값을 내려주는데, 프론트는 `monthlyBaseDay` 등 다른 키로 state를 쓰고 있어, `setConfigs(data.data)` 후에도 폼 필드에 값이 매핑되지 않음.  
  **core-coder 위임 시 할 일**: (1) `SalaryConfigModal.js`의 `loadCurrentConfigs`에서 API 응답을 `monthlyBaseDay`/`paymentDay`/`cutoffDay`/`batchCycle`/`calculationMethod` 등으로 매핑한 뒤 `setConfigs` 호출. (2) 매핑되지 않은 항목은 기존 초기값 유지. (3) 저장 후 모달 재진입 시 저장한 값이 그대로 보이는지 확인.

- **프로필 모달 빈 화면 (문제 2)**  
  **원인**: (1) 상담사 목록 평탄화 시 `grade`를 넣지 않아 `consultant.grade`가 undefined. (2) `getGradeBaseSalary`를 await 없이 쓰고, JSX에서 그 반환값(Promise)에 `.toLocaleString()`을 호출해 예외 발생. (3) `convertGradeToKorean`도 async인데 JSX에서 동기처럼 사용됨.  
  **core-coder 위임 시 할 일**: (1) `SalaryManagement.js`의 `loadConsultants` 평탄화 객체에 `grade: c.grade` 추가. (2) `SalaryProfileFormModal.js`에서 등급 한글명·기본급을 state+useEffect로 비동기 로드하거나, `gradeTableData` 등으로 동기 계산해 Promise를 렌더 경로에서 제거. (3) `initializeFormData`에서 `getGradeBaseSalary` 사용 시 async/await 적용해 `baseSalary`에 숫자만 넣기. (4) 상담사 선택 후 프로필 모달 열었을 때 정상 표시 및 콘솔 에러 없음 확인.

**구현 계획·core-coder 위임문**: `docs/project-management/SALARY_CONFIG_PROFILE_FIX_PLAN.md` 참조.

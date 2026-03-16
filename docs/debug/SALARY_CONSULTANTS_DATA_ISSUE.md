# 급여 관리 페이지 상담사 데이터 미수신 — 원인 분석 및 수정 제안

**작성**: core-debugger  
**대상**: 어드민 LNB "운영·재무" → "급여 관리" (`/erp/salary`)  
**관련**: SalaryManagement, ConsultantProfileModal, `/api/v1/admin/salary/*`, tenantId

---

## 1. 증상 정리

"상담사 데이터를 못 받아온다"는 보고는 아래와 같이 해석 가능합니다.

| 가능한 증상 | 기술적 의미 |
|------------|-------------|
| **목록이 항상 비어 있음** | API는 200 + 본문으로 상담사 배열을 주는데, 프론트가 응답 구조를 잘못 해석해 `response.success` / `response.data`를 기대하고 있어 실제로 받은 **배열**을 버리고 `[]`로 세팅하는 경우. (아래 원인 1과 일치.) |
| **500 에러** | 백엔드에서 `TenantContextHolder.getRequiredTenantId()` 시 tenantId 미설정으로 `IllegalStateException` 발생 → 500 반환. |
| **무한 로딩** | API가 401/404 등으로 null을 반환하거나 예외로 빠지지 않고, 로딩만 끝나지 않는 경로가 있는 경우 (현재 코드만 보면 우선은 목록 비어 있음/500 쪽이 더 유력). |
| **특정 API만 실패** | `GET /api/v1/admin/salary/consultants` 또는 동일 페이지의 `profiles`, `calculation-period` 등이 같은 응답 래퍼 해석 문제로 빈 데이터 처리되는 경우. |

**추정**: 가장 유력한 것은 **프론트엔드의 응답 처리 불일치**로, API는 정상 200 + 데이터를 주는데 **목록이 비어 보이는 경우**입니다. 그 다음으로 **tenantId 미설정 시 500** 가능성을 함께 점검하는 것이 좋습니다.

---

## 2. 확인 포인트

### 2.1 프론트엔드

- **상담사 목록 로딩 지점**
  - 파일: `frontend/src/components/erp/SalaryManagement.js`
  - 함수: `loadConsultants()` (라인 79~102)
  - 호출: `apiGet('/api/v1/admin/salary/consultants')` — 쿼리 파라미터 없음, tenantId는 세션/서버 측 컨텍스트에 의존.

- **응답 처리**
  - `frontend/src/utils/ajax.js`의 `apiGet`은 서버가 `{ success: true, data: T }` 형태로 주면 **`T`(data)만 반환**합니다 (라인 252~254).
  - 백엔드 `GET /consultants`는 `Map.of("success", true, "data", consultants, "message", ...)` 를 반환하므로, **apiGet의 반환값은 상담사 배열**입니다.
  - **§6 현재 코드 상태**: `SalaryManagement.js`의 `loadConsultants`(라인 91~96)에는 이미 **`Array.isArray(response)` 분기**가 있어, apiGet이 배열을 반환하면 `setConsultants(response)`로 정상 처리됩니다. 과거에는 `response.success`/`response.data`만 기대해 빈 목록이 되는 버그가 있었으나, 현재는 배열 우선 분기로 대부분 해소된 상태입니다. 다만 다른 빌드/캐시·다른 API(profiles, calculation-period 등)에서 동일 패턴 미적용 시 빈 목록 가능.

- **동일 패턴**
  - `loadSalaryProfiles()` (라인 109~126): 동일하게 `Array.isArray(response)` 분기 있음 → unwrap된 배열이면 정상.
  - `loadCalculationPeriod()` (라인 65~76): unwrap된 객체(`response.periodStart`/`periodEnd`)와 `response.data` 둘 다 처리.
  - `loadSalaryCalculations`, `loadTaxStatistics`, `executeSalaryCalculation` 등도 배열/객체 분기 있음. **ConsultantProfileModal.js** 등 다른 파일은 §4 체크리스트대로 unwrap 전제로 점검 권장.

- **에러 핸들링**
  - catch에서 `showNotification('상담사 목록을 불러오는데 실패했습니다.', 'error')` 호출 (라인 95~98).
  - 500이 나오면 사용자는 “실패” 알림을 보게 되고, 200인데 빈 목록이면 알림 없이 **빈 화면**만 보게 됨 (위 응답 처리 버그와 일치).

### 2.2 백엔드

- **상담사 조회 API**
  - 컨트롤러: `SalaryManagementController.getConsultants()`  
    - 경로: `GET /api/v1/admin/salary/consultants`  
    - 파일: `src/main/java/com/coresolution/consultation/controller/SalaryManagementController.java` (라인 148~179)
  - 동작: `SessionUtils.getCurrentUser(session)` 조회 후, **currentUser != null && currentUser.getTenantId() != null**일 때만 `TenantContextHolder.setTenantId(currentUser.getTenantId())` 설정. 그 다음 currentUser == null이면 400 반환, 아니면 `getConsultantsForSalary()` 호출.
  - **500 발생 경로**: currentUser는 있으나 **currentUser.getTenantId()가 null**인 경우, Controller는 TenantContextHolder를 설정하지 않고 그대로 `getConsultantsForSalary()`를 호출 → `SalaryManagementServiceImpl.getConsultantsForSalary()` 내부 `TenantContextHolder.getRequiredTenantId()`에서 **IllegalStateException("Tenant ID is not set in current context")** 발생 → catch에서 500 반환.

- **서비스**
  - `SalaryManagementServiceImpl.getConsultantsForSalary()` (라인 86~100):
    - `TenantContextHolder.getRequiredTenantId()` 사용.
    - tenantId가 null/empty면 `IllegalStateException("Tenant ID is not set in current context")` → 500.
  - 조회: `userRepository.findByTenantId(tenantId)` 후 스트림으로 `UserRole.isConsultant()` 및 `isActive == true` 필터.

- **로그**
  - 정상 시: `"👥 급여용 상담사 목록 조회: tenantId={}"` (라인 88).
  - 예외 시: `"상담사 목록 조회 오류"` + 스택트레이스 (라인 163).

### 2.3 멀티테넌트(tenantId)

- **설정 경로**
  - `SessionBasedAuthenticationFilter` (config 패키지): 세션에서 사용자 조회 후 `TenantContextHolder.setTenantId(user.getTenantId())` 실행 (라인 182, 266, 305 등).
  - `/api/v1/admin/salary/*` 요청은 동일 필터 체인을 타므로, **로그인된 사용자의 tenantId가 세션·DB에 있으면** 컨텍스트에 설정됨.

- **잠재 이슈**
  - `user.getTenantId()`가 null/empty인 사용자: 필터는 `setTenantId`를 호출하지 않음(라인 181~182, 304~307). Controller도 tenantId가 null이면 설정하지 않고 서비스를 호출하므로, **이때 getRequiredTenantId()에서 예외 → 500**.
  - 세션에 currentUser가 없으면 Controller에서 400 반환(500 아님). 따라서 **500은 “currentUser는 있는데 tenantId가 null인 경우”에 한함**.

---

## 3. 재현 절차

1. 관리자(운영·재무 권한) 계정으로 로그인.
2. LNB에서 "운영·재무" → "급여 관리" 선택 (라우트 `/erp/salary`).
3. **확인**:
   - 상담사 목록/급여 프로필 목록이 비어 있는지,
   - 브라우저 개발자 도구 Network 탭에서 `GET /api/v1/admin/salary/consultants` (및 `profiles`) 응답이 200이고 body에 `{ success: true, data: [ ... ] }` 형태로 데이터가 있는지,
   - 콘솔에 "상담사 목록 로드 실패" 등 에러 로그가 있는지.
4. **500 발생 시 서버 로그 확인** (shell 서브에이전트 또는 로컬 로그):
   - 검색 문구: `Tenant ID is not set in current context`, `IllegalStateException`, `상담사 목록 조회 오류`
   - 스택트레이스에서 `TenantContextHolder.getRequiredTenantId`, `SalaryManagementServiceImpl.getConsultantsForSalary` 확인 시 → tenantId 미설정으로 인한 500으로 판단.
   - 실행 예: `tail -n 300 build/logs/application.log | grep -A 5 "Tenant ID is not set"` 또는 `journalctl -u <서비스명> -n 200 --no-pager`

**재현이 어렵다면**: "관리자 권한으로 /erp/salary 접속 후 상담사 목록·급여 프로필 목록이 비어 있는지 확인" 수준으로 전제하고, 위 Network/콘솔/서버 로그로 원인 구분.

---

## 4. 수정 제안 (core-coder 전달용)

### 4.1 원인 요약

- **주요 원인**: `ajax.js`의 `apiGet`이 `{ success, data }` 응답일 때 **`data`만 반환**하는데, `SalaryManagement.js`는 **전체 객체(`response.success`, `response.data`)를 기대**하고 있어, 성공 응답이 와도 상담사/프로필을 빈 배열로 덮어씀.
- **부가 원인(500)**: 로그인 사용자의 **tenantId가 null**인 경우, Controller는 TenantContextHolder를 설정하지 않고 서비스를 호출 → `getRequiredTenantId()`에서 `IllegalStateException` → 500. (Controller에서 tenantId가 null이면 서비스 호출 전 400 반환으로 500 방지 가능.)

### 4.2 수정 대상 파일·위치

| 구분 | 파일 | 위치 | 할 일 |
|------|------|------|--------|
| **프론트 (필수)** | `frontend/src/components/erp/SalaryManagement.js` | `loadConsultants` (79~102) | `apiGet`이 이미 **배열**을 반환하므로, `Array.isArray(response)`이면 `setConsultants(response)`, 아니면 `setConsultants(response?.data ?? [])` 등으로 분기. `response.success`만 보지 말 것. |
| **프론트 (필수)** | 동일 | `loadSalaryProfiles` (105~127) | 동일하게, 반환값이 이미 프로필 배열이면 그대로 `setSalaryProfiles(response)` 처리. |
| **프론트 (필수)** | 동일 | `loadCalculationPeriod` (59~77) | 반환값이 이미 `{ periodStart, periodEnd }` 객체이면 `response?.periodStart`, `response?.periodEnd` 사용. |
| **프론트 (필수)** | 동일 | `executeSalaryCalculation`, `loadSalaryCalculations`, `loadTaxStatistics` 등 | 다른 `apiGet`/`apiPost` 호출부도 동일 원칙: **apiGet/apiPost가 이미 unwrap한 값**을 기준으로 분기 (객체면 `response.xxx`, 배열이면 `response` 자체 사용). |
| **프론트 (선택)** | `frontend/src/components/erp/ConsultantProfileModal.js` | `loadSalaryProfile` 등 (44~46, 100, 120, 155, 218) | `apiGet`/`apiPost` 반환값이 이미 unwrap된 형태이면 `response.success`/`response.data` 대신 `response` 자체가 프로필/옵션/등급 객체인지 확인하고 분기. |
| **백엔드 (권장)** | `SalaryManagementController.java` | `getConsultants` (148~179) | **currentUser != null && currentUser.getTenantId() == null**인 경우 서비스 호출 전에 400 반환 (예: "테넌트 정보가 없습니다. 관리자에게 문의하세요."). 이미 tenantId가 있을 때만 `TenantContextHolder.setTenantId` 설정하는 코드는 있음. |

### 4.3 할 일 목록 (체크리스트)

- [ ] **SalaryManagement.js**  
  - `loadConsultants`: apiGet 반환값이 배열인 경우 그대로 `setConsultants(response)`, 그 외는 `response?.data` 또는 빈 배열 처리.  
  - `loadSalaryProfiles`: 동일하게 unwrap된 배열 기준으로 `setSalaryProfiles` 설정.  
  - `loadCalculationPeriod`: unwrap된 객체 기준으로 `periodStart`/`periodEnd` 설정.  
  - 같은 파일 내 다른 apiGet/apiPost 사용처도 unwrap 전제로 분기 통일.
- [ ] **ConsultantProfileModal.js**  
  - 급여 프로필/옵션타입/등급/코드 조회 후 `response.success`/`response.data` 대신 실제 반환 구조(이미 unwrap된 객체/배열)에 맞게 처리.
- [ ] **(권장) SalaryManagementController**  
  - `getConsultants`에서 currentUser != null이지만 **currentUser.getTenantId() == null**이면 `getConsultantsForSalary()` 호출 전에 400 반환하여 500 방지. (이미 tenantId가 있을 때 설정하는 코드는 적용됨.)
- [ ] **검증**  
  - 관리자로 `/erp/salary` 접속 후 상담사 목록·급여 프로필 목록이 채워지는지 확인.  
  - Network에서 `GET /api/v1/admin/salary/consultants`, `GET /api/v1/admin/salary/profiles` 200 응답 시 화면에 반영되는지 확인.  
  - (500 재현 환경이 있다면) tenantId 설정 보완 후 500이 사라지는지 확인.

---

## 5. core-coder용 태스크 설명 초안

> 급여 관리 페이지에서 상담사/급여 프로필 데이터가 안 나오는 문제를 수정해 주세요.  
> 원인: `frontend/src/utils/ajax.js`의 `apiGet`이 서버의 `{ success, data }` 응답에서 **`data`만 반환**하는데, `SalaryManagement.js`는 `response.success`/`response.data`를 기대해 성공 응답도 빈 배열로 처리하고 있습니다.  
> **요청 사항:**  
> 1. `SalaryManagement.js`의 `loadConsultants`, `loadSalaryProfiles`, `loadCalculationPeriod` 및 동일 파일 내 다른 apiGet/apiPost 호출부를, **apiGet/apiPost가 이미 unwrap한 반환값**을 전제로 수정 (배열이면 그대로 setState, 객체면 해당 필드 사용).  
> 2. (선택) `ConsultantProfileModal.js`의 급여 프로필·옵션타입·등급·코드 조회 처리도 같은 원칙으로 수정.  
> 3. (권장) `SalaryManagementController.getConsultants()`에서 currentUser는 있으나 **currentUser.getTenantId()가 null**인 경우, 서비스 호출 전에 400 반환(예: "테넌트 정보가 없습니다.")하여 getRequiredTenantId() 예외로 인한 500 방지.  
> 상세 위치와 체크리스트는 `docs/debug/SALARY_CONSULTANTS_DATA_ISSUE.md`를 참고해 주세요.

---

## 6. 현재 코드 상태 및 500/빈 목록 검증 요약

- **프론트 (SalaryManagement.js)**  
  - `loadConsultants`, `loadSalaryProfiles`: **이미 `Array.isArray(response)` 분기**로 apiGet이 반환한 배열을 그대로 setState함. 문서 §2.1의 "response.success만 기대해 빈 목록"은 수정 전 상태 기준이며, 현재는 배열 우선 처리로 대부분 해소됨.  
  - `loadCalculationPeriod`: unwrap된 객체(`response.periodStart`/`periodEnd`)와 `response.data` 둘 다 처리.  
  - 500 발생 시: `ajax.js`의 `handleError`가 예외를 던지므로 catch에서 "상담사 목록을 불러오는데 실패했습니다." 알림 표시.

- **백엔드 (SalaryManagementController.getConsultants)**  
  - **이미** currentUser != null && getTenantId() != null일 때 `TenantContextHolder.setTenantId` 설정함.  
  - **500이 나는 경우**: currentUser는 있으나 **getTenantId()가 null**인 사용자일 때만 발생. 이때 Controller는 컨텍스트를 설정하지 않고 서비스를 호출 → `getConsultantsForSalary()` → `getRequiredTenantId()`에서 `IllegalStateException` → 500.  
  - **권장 수정**: getConsultants()에서 currentUser != null && **currentUser.getTenantId() == null**이면 서비스 호출 전에 400 + 메시지 반환.

- **목록이 비어 있는데 500이 아닌 경우**  
  - Network에서 `GET /api/v1/admin/salary/consultants`가 200이고 body에 `{ success: true, data: [ ... ] }`가 있으면, apiGet은 **배열만** 반환하므로 현재 코드의 `Array.isArray(response)` 분기로 정상 처리되어야 함.  
  - 여전히 빈 목록이면: 빌드/캐시 미반영, 또는 **다른 API**(profiles, calculation-period 등)에서 동일 unwrap 분기 미적용 가능성 점검. ConsultantProfileModal 등 다른 컴포넌트도 §4 체크리스트대로 확인.

---

**참조**:  
- `docs/standards/ERROR_HANDLING_STANDARD.md`, `LOGGING_STANDARD.md`  
- `docs/standards/API_CALL_STANDARD.md`, `API_INTEGRATION_STANDARD.md`  
- `frontend/src/utils/ajax.js` (apiGet unwrap 동작 252~258라인)  
- `frontend/src/utils/standardizedApi.js` (다른 페이지와의 사용 방식 비교 시)

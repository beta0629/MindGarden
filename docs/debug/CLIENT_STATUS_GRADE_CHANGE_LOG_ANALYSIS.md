# 내담자 상태 변경·등급 변경 — 로그 기반 오류 분석

**목적**: 개발 서버(beta0629.cafe24.com)에서 수집한 로그를 바탕으로, **내담자 상태 변경**과 **등급 변경** 기능의 서버 측 오류 여부를 분석하고, 추가 확인 항목 및 재현·로그 수집 방법을 제안한다.

**분석 일자**: 2026-03-17  
**분석 주체**: core-debugger  
**코드 수정**: 없음 (분석·체크리스트·제안만 문서화)

---

## 1. 로그 수집 결과 요약 (코어 쉘 전달 내용)

### 1.1 접속·검색 범위

| 항목 | 내용 |
|------|------|
| 서버 | root@beta0629.cafe24.com (mindgarden-dev 서비스) |
| 검색 범위 | journalctl 최근 800~1000줄, `/var/www/mindgarden-dev/logs/error.log` 최근 300줄 |
| 검색 키워드 | updateClient, registerClient, ClientRegistration, clients/, status, isActive, grade, 등급, Exception, Error, ERROR, WARN, 500, 400 |

### 1.2 내담자 상태 변경 / 등급 변경 관련

- **오류 로그: 없음**
- `updateClient`, `registerClient`, `ClientRegistration`, 상태(isActive/ACTIVE/INACTIVE), 등급(grade) 관련 **Exception / Error / 500 / 400 로그는 검색되지 않음**
- 정상 로그만 존재: `/api/v1/admin/clients/with-mapping-info`, `with-stats`, 공통코드 USER_GRADE, CONSULTANT_GRADE 정상 조회

### 1.3 그 외 검색된 로그 (내담자/등급과 무관)

| 유형 | 내용 |
|------|------|
| WARN – XssFilter | User-Agent에 포함된 `/` 문자 XSS 필터 로그 (실제 오류 아님) |
| WARN – DynamicPermissionServiceImpl | API_ACCESS_ALL 등 권한 코드가 DB에 없음 |
| ERROR – SalaryScheduleServiceImpl | CommonCode SALARY_BASE_DATE(MONTHLY_BASE_DAY, CUTOFF_DAY) 없음으로 인한 급여 스케줄 조회 오류 |

---

## 2. 디버거 해석

### 2.1 “로그에 오류가 없다”의 의미

- **서버가 해당 기능 호출 시 예외를 던지지 않았다**는 의미로 해석할 수 있음.
- 즉, **내담자 상태 변경·등급 변경**을 수행하는 **PUT /api/v1/admin/clients/{id}** 호출이 있었다면, 그 요청이 **500/400/예외 로그 없이 처리되었을 가능성이 높음**.

### 2.2 코드 경로 확인 (현재 코드베이스 기준)

| 구분 | 엔드포인트 | Controller | Service | 비고 |
|------|------------|------------|---------|------|
| 내담자 수정 | PUT /api/v1/admin/clients/{id} | AdminController.updateClient | AdminServiceImpl.updateClient | 요청 DTO: ClientRegistrationRequest |

- **ClientRegistrationRequest**: `status`, `grade` 필드 존재. (`docs/debug/CLIENT_EDIT_STATUS_NOT_UPDATING_ANALYSIS.md` 작성 당시와 달리, 현재는 DTO에 `status` 포함됨.)
- **AdminServiceImpl.updateClient**:
  - `request.getGrade()` → `clientUser.setGrade(...)` 반영 (null/empty 처리 포함).
  - `request.getStatus()` → `clientUser.setIsActive("ACTIVE".equalsIgnoreCase(...))` 반영.
- **AdminController.updateClient**: 진입 시 `log.info("🔧 내담자 정보 수정: ID={}", id);` 로그 출력. 예외 시에는 스택트레이스·ERROR 등이 남을 수 있음.

따라서 **현재 코드 기준으로는** 내담자 수정 시 **상태·등급이 서버에서 DB까지 반영되는 로직이 구현되어 있음**. 로그에 해당 경로의 Exception/500/400이 없다면, **서버 측에서는 오류 없이 동작했다고 보는 것이 타당**함.

### 2.3 정리된 의견

1. **로그만으로 볼 때**: 내담자 상태 변경·등급 변경과 직접 연관된 **서버 오류(예외/500/400)는 관찰되지 않았고**, 해당 기능의 **서버 측 정상 처리 가능성**이 높다.
2. **단정 불가 부분**:  
   - 수집 구간 동안 **PUT /api/v1/admin/clients/{id} 가 실제로 호출되었는지**는 로그 검색 키워드에 “내담자 정보 수정”(한글) 또는 “clients”가 포함되지 않으면 확인이 어려울 수 있음.  
   - **프론트엔드**에서 payload 누락(status/grade 미전송), 응답 미처리, UI 미반영 등으로 “동작 안 한다”고 느낄 수 있음.  
   - **목록/상세 API**가 비활성 내담자 제외 또는 status 하드코딩을 사용하면, “저장은 됐는데 화면에 안 보인다” 현상이 있을 수 있음(과거 `CLIENT_EDIT_STATUS_NOT_UPDATING_ANALYSIS.md` 이슈와 유사).

---

## 3. 추가 확인 제안

로그에 오류가 없다고 “문제 없음”으로 단정하기 어려운 경우를 대비한 **추가 확인 항목**과 **재현·로그 수집 방법**을 제안한다.

### 3.1 서버 로그로 호출 여부 확인

- **목적**: 내담자 수정 API가 실제로 호출되었는지 확인.
- **방법**:  
  - 애플리케이션 로그에서 **`내담자 정보 수정`** 또는 **`🔧 내담자 정보 수정`** 문자열 검색.  
  - access 로그가 있다면 **PUT** **`/api/v1/admin/clients/`** 및 응답 코드(200/400/500) 확인.
- **shell 서브에이전트 요청 예시**  
  - `journalctl -u mindgarden-dev -n 500 --no-pager | grep -E "내담자 정보 수정|clients"`  
  - `grep -E "PUT.*admin/clients|내담자 정보 수정" /var/www/mindgarden-dev/logs/*.log | tail -100`

### 3.2 API 직접 호출로 동작 검증

- **목적**: 상태·등급 변경이 DB까지 반영되는지 검증.
- **방법**:  
  1. 관리자 계정으로 로그인 후 쿠키/세션 또는 Bearer 토큰 확보.  
  2. `PUT /api/v1/admin/clients/{내담자ID}` 로 요청 body에 `status`, `grade` 포함하여 호출.  
  3. 응답이 200이고 메시지가 성공인지 확인.  
  4. 동일 내담자에 대해 `GET /api/v1/admin/clients/with-mapping-info` 또는 상세 API로 **status/isActive, grade** 값이 변경되었는지 확인.  
  5. 필요 시 DB에서 해당 `users` 행의 `is_active`, `grade` 컬럼 직접 확인.
- **payload 예시** (필수 필드만):  
  `{ "email": "기존이메일@example.com", "name": "기존이름", "status": "INACTIVE", "grade": "USER_GRADE_SOME" }`  
  (실제 테스트 시에는 기존 내담자와 일치하는 필수 필드 포함.)

### 3.3 프론트엔드 확인

- **목적**: UI에서 저장 시 status/grade가 실제로 전송·반영되는지 확인.
- **확인 항목**  
  - 내담자 정보 수정 모달/폼에서 **저장 시** `StandardizedApi`(또는 동일 규격)로 **PUT /api/v1/admin/clients/{id}** 호출 시 **request body에 `status`, `grade`가 포함되는지** (브라우저 개발자 도구 Network 탭).  
  - 응답이 200일 때 목록/상세를 다시 불러오는 API가 호출되는지, 그 응답의 해당 내담자 **status/isActive, grade**가 갱신된 값인지.

### 3.4 목록 API의 status/isActive 반영

- **목적**: 과거 이슈(비활성 제외, status 하드코딩)가 해소되었는지 확인.
- **확인**:  
  - `ClientStatsServiceImpl.getAllClientsWithStatsByTenant`(또는 내담자 목록 제공 서비스)에서 **조회 조건**(isActive=true만 조회하는지, 전체/필터 지원하는지).  
  - **convertClientToMap**(또는 동일 역할 메서드)에서 **status/isActive**를 **실제 User 엔티티 값**으로 채우는지, 아니면 여전히 하드코딩인지.  
  - 이 부분은 `docs/debug/CLIENT_EDIT_STATUS_NOT_UPDATING_ANALYSIS.md` 및 `docs/planning/CLIENT_CONSULTANT_STATUS_UPDATE_PLAN.md`의 수정 제안이 반영되었는지와 연관됨.

---

## 4. 체크리스트 (검증 시 확인할 항목)

다음 항목을 확인하면 “내담자 상태 변경·등급 변경” 기능의 서버·클라이언트 동작을 정리할 수 있다.

- [ ] 서버 로그에서 `내담자 정보 수정` 또는 PUT `/api/v1/admin/clients/` 호출 및 200 응답 확인.
- [ ] PUT /api/v1/admin/clients/{id} 호출 시 request body에 `status`, `grade` 포함 여부 확인.
- [ ] 동일 내담자에 대해 수정 후 조회 API/DB에서 `is_active`, `grade` 값 변경 여부 확인.
- [ ] 내담자 목록 API가 비활성 포함 여부·필터 정책과 일치하는지, 반환 `status`/`isActive`가 DB와 일치하는지 확인.
- [ ] 프론트에서 저장 후 목록/상세 재조회 및 UI에 변경된 상태·등급이 반영되는지 확인.

---

## 5. 참조 문서

| 문서 | 설명 |
|------|------|
| [CLIENT_EDIT_STATUS_NOT_UPDATING_ANALYSIS.md](./CLIENT_EDIT_STATUS_NOT_UPDATING_ANALYSIS.md) | 내담자 상태 미반영 원인 분석(과거). DTO/updateClient/목록 API 수정 제안. 현재 코드는 status 반영 로직 포함. |
| [CLIENT_CONSULTANT_STATUS_UPDATE_PLAN.md](../planning/CLIENT_CONSULTANT_STATUS_UPDATE_PLAN.md) | 내담자·상담사 상태값 수정 반영 기획·태스크·체크리스트. |
| [LOGGING_STANDARD.md](../standards/LOGGING_STANDARD.md) | 로그 레벨·포맷 규칙. |
| [ERROR_HANDLING_STANDARD.md](../standards/ERROR_HANDLING_STANDARD.md) | 예외 처리·로깅 패턴. |

---

## 6. 요약

- **로그 해석**: 수집된 로그 상으로 **내담자 상태 변경·등급 변경** 관련 **서버 오류(예외/500/400)는 없음**. 현재 코드에서도 `updateClient`가 `status`→`isActive`, `grade`→`grade`를 반영하므로, **서버가 오류 없이 동작했다고 보는 것이 타당**함.
- **한계**: 로그만으로는 “해당 API가 실제로 호출되었는지”와 “프론트/목록 API까지 포함한 end-to-end 동작”을 단정할 수 없음.
- **권장**: 위 **추가 확인 항목**과 **체크리스트**로, 서버 로그 검색 → API 직접 호출 → 프론트 payload/재조회 → 목록 API 반환값 순으로 검증하면, 기능 오류 여부를 명확히 정리할 수 있음.

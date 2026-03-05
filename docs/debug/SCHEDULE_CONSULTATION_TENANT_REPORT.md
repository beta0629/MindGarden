# 스케줄·상담 내역 미노출 및 테넌트 조회 검토 보고서

**검토 일자**: 2025-03-05  
**검토 범위**: 어제 상담 내역 미노출 원인, 테넌트 기반 조회 여부

---

## 1. 어제 상담 내역이 안 나오는 원인

### 1.1 프론트엔드: API 호출 위치 및 날짜 제한

| 위치 | API | 날짜 파라미터/필터 | 비고 |
|------|-----|-------------------|------|
| **UnifiedScheduleComponent.js** | `GET /api/v1/schedules/consultant/{userId}` (상담사) / `GET /api/v1/schedules/admin` (관리자) | **없음** | `loadSchedules()`에서 `startDate`/`endDate` 미전달. 백엔드는 기간 제한 없이 전체 스케줄 반환. |
| **ConsultantDashboardV2.js** | `StandardizedApi.get(DASHBOARD_API.CONSULTANT_SCHEDULES)` → `GET /api/v1/schedules?userId=…&userRole=CONSULTANT` | **있음 (오늘만)** | **원인 후보 1** (아래 상세). |
| **ConsultationLogModal.js** | `GET /api/v1/schedules/consultation-records?consultantId=…&consultationId=…` | 없음 | 상담일지 목록은 날짜 제한 없음. |

**ConsultantDashboardV2.js (100~106라인) — “오늘만” 필터:**

```javascript
}).filter(schedule => {
  if (!schedule.startTime) return false;
  const scheduleDate = new Date(schedule.startTime);
  if (isNaN(scheduleDate.getTime())) return false;
  scheduleDate.setHours(0, 0, 0, 0);
  return scheduleDate.getTime() === today.getTime();
})
```

- API는 **전체** 스케줄을 준 뒤, 프론트에서 **당일(`today`)과 같은 날**만 남김.
- 따라서 **상담사 대시보드의 “오늘 일정” 영역에는 어제 데이터가 설계상 표시되지 않음.**

**결론 (프론트):**

- **스케줄 캘린더(UnifiedScheduleComponent)**: 날짜 제한 없음. 어제가 안 보인다면 데이터 자체가 안 오는 문제(예: 테넌트)일 가능성 큼.
- **상담사 대시보드(ConsultantDashboardV2)**: “오늘 일정”은 **의도적으로 오늘만** 표시. 어제 상담을 보고 싶다면 이 필터가 원인.

---

### 1.2 백엔드: 스케줄/상담 목록 API의 날짜 조건

| API (ScheduleController) | 날짜 조건 | 비고 |
|--------------------------|-----------|------|
| `GET /api/v1/schedules` (권한별) | 없음 | `findSchedulesWithNamesByUserRole` → 기간 없이 tenantId + 역할 기준 전체 조회. |
| `GET /api/v1/schedules/consultant/{consultantId}` | 선택적 | `startDate`/`endDate` 쿼리 있으면 `findSchedulesByUserRoleAndDateBetween` 호출, 없으면 전체. |
| `GET /api/v1/schedules/admin` | 선택적 | `startDate`/`endDate` 쿼리 있으면 메모리 필터, 없으면 전체. |
| `GET /api/v1/schedules/consultation-records` | 없음 | consultationId 또는 consultantId 기준, 최근 10건 등. 날짜로 “어제 제외”하는 조건 없음. |

- **스케줄 목록/상담일지 목록 API에는 “오늘만” 또는 “어제 제외” 같은 날짜 제한이 없음.**  
- 따라서 **백엔드가 어제 데이터를 짤라서 안 주는 구조는 아님.**

---

### 1.3 타임존(UTC vs Asia/Seoul)

- **백엔드**: `LocalDate`/`LocalTime` 사용. DB/서버 기본 타임존에 따름. 요청에 날짜를 안 넘기면 서버 기준 “오늘”만 쓰는 로직은 없음.
- **ConsultantDashboardV2**: `today = new Date()`로 브라우저 로컬 “오늘” 사용. `schedule.startTime`은 `YYYY-MM-DDTHH:mm:ss` 형태로 조합되어, `new Date(...)` 시 로컬로 해석될 수 있음.  
  - “오늘만” 필터 자체는 **로컬 날짜 기준**이라, 타임존 때문에 “어제”가 잘못 잘리는 직접적인 증거는 없음.  
  - 다만 `schedule.date`가 UTC 날짜로 오면(예: 전날 23:00 KST가 다음날 00:00 UTC), 브라우저에서 그날을 “어제”로 볼 수 있음. 이 경우 **데이터는 오지만 “오늘” 필터에 걸려서 대시보드에서만 안 보일 수 있음.**

**정리:**  
- “어제 상담이 아예 안 보인다”가 **캘린더**라면 → 테넌트/데이터 미수급 가능성.  
- **대시보드 “오늘 일정”**이라면 → **오늘만 보여주는 프론트 필터가 원인.**

---

## 2. 테넌트 기반 조회 여부

### 2.1 백엔드: tenantId 반영 여부

- **ScheduleServiceImpl**
  - `findSchedulesByUserRole`: `TenantContextHolder.getTenantId()` 사용.  
    - **tenantId == null 이면 빈 리스트 반환** (771~774라인).
  - `findByConsultantId`, `findAll`, `findSchedulesByUserRoleAndDate`, `findSchedulesByUserRoleAndDateBetween` 등은 모두 `TenantContextHolder.getRequiredTenantId()` 또는 `getTenantId()` 후 `scheduleRepository.findByTenantId*` 호출.
- **ScheduleRepository**
  - 상담사/관리자/내담자별 조회는 `findByTenantIdAndConsultantId`, `findByTenantId`, `findByTenantIdAndDateBetween` 등 **tenantId 포함 메서드**만 사용.  
  - `findByConsultantId`(tenantId 없음) 등은 `@Deprecated`로 표시되어 있고, 서비스에서는 사용하지 않음.
- **ConsultationRecordServiceImpl**
  - `getConsultationRecordsByConsultationId`, `getRecentConsultationRecords` 등 모두 `TenantContextHolder.getRequiredTenantId()` 후 `findByTenantIdAnd*` 호출.

**결론:**  
스케줄·상담일지 조회는 **모두 TenantContext의 tenantId로 제한**됨. **tenantId가 없으면** (필터에서 설정 실패 시) **스케줄은 빈 목록**, 상담일지는 `getRequiredTenantId()`에서 예외 가능.

---

### 2.2 테넌트 컨텍스트 설정 (TenantContextFilter)

- **우선순위**: ① 세션 User.tenantId → ② 세션 `tenantId` / `SessionConstants.TENANT_ID` → ③ **HTTP 헤더 `X-Tenant-Id`** → ④ Host 서브도메인 → ⑤ `X-Tenant-Subdomain` 등.
- **tenantId가 없으면** 400 응답 + `TENANT_ID_REQUIRED` (공개 API 제외).  
→ **스케줄/상담 API는 공개가 아니므로, tenantId 없으면 400이 나오거나 이후 서비스에서 빈 리스트/예외.**

---

### 2.3 프론트엔드: 테넌트 헤더·URL

- **UnifiedScheduleComponent**: `apiGet` 사용 (`frontend/src/utils/ajax.js`).  
  - `getDefaultApiHeaders()`로 헤더 설정 → `apiHeaders.js`에서 **`X-Tenant-Id` 추가** (tenantId 있을 때).
- **ConsultantDashboardV2**: `StandardizedApi.get` 사용 → `getDefaultApiHeadersAsync`로 **`X-Tenant-Id` 포함**.
- **ConsultationLogModal**: `apiGet` 사용 → 동일하게 `getDefaultApiHeaders()` 사용.

**정리:**  
스케줄/상담 관련 호출은 모두 **공통 ajax/StandardizedApi 경로**를 타며, **X-Tenant-Id**를 넣는 구조.  
다만 `getDefaultApiHeaders()`는 **동기**이고, tenantId는 세션/로컬스토리지/User에서 오므로, **로그인 직후 또는 세션 만료 직후**에는 tenantId가 아직 없어 헤더가 비어 있을 수 있음. 그 경우 백엔드에서 tenantId 없음 → **빈 스케줄 목록 또는 400**으로 이어질 수 있음.

---

## 3. 원인 요약 및 수정 제안

### 3.1 “어제 상담 내역이 안 나온다”에 대한 정리

| 현상 | 가능 원인 | 확인/수정 제안 |
|------|-----------|-----------------|
| **상담사 대시보드**에서 어제가 안 보임 | **오늘만** 보여주는 프론트 필터 (ConsultantDashboardV2.js 100~106라인) | “오늘 일정”을 “최근 N일” 또는 “선택한 날짜”로 확장하거나, “어제” 블록을 별도 표시. |
| **스케줄 캘린더**에서 어제가 안 보임 | ① tenantId 미설정 → 백엔드가 빈 리스트 반환 ② API 실패/에러 | ① Network 탭에서 스케줄 API 요청에 `X-Tenant-Id` 있는지, 400/500 여부 확인. ② 백엔드 로그에서 `tenantId가 설정되지 않았습니다` 여부 확인. |
| **상담일지**에서 어제가 안 보임 | 상담일지 API는 날짜 제한 없음. tenantId 또는 권한/파라미터 이슈 가능 | 동일하게 tenantId 헤더·응답 코드 확인. |

### 3.2 수정 제안 (core-coder용)

1. **ConsultantDashboardV2.js (100~106라인)**  
   - **현재**: `scheduleDate.getTime() === today.getTime()` 으로 **오늘만** 표시.  
   - **제안**:  
     - “오늘 일정”만 유지할지, “최근 7일” 또는 “선택한 날짜”까지 보이게 할지 요구사항에 맞게 변경.  
     - 어제 포함이 필요하면: 위 필터를 제거하거나, `today`와 `yesterday` 두 날짜를 포함하거나, `startDate`/`endDate`를 API에 넘겨서 백엔드에서 기간 조회하도록 변경.

2. **UnifiedScheduleComponent.js**  
   - **현재**: `/api/v1/schedules/consultant/{userId}` 또는 `/api/v1/schedules/admin` 호출 시 **날짜 파라미터 없음** (전체 조회).  
   - **제안**:  
     - 캘린더 뷰 범위(현재 달 ±1달 등)에 맞춰 `startDate`/`endDate`를 쿼리로 넘기면, 백엔드 `findSchedulesByUserRoleAndDateBetween` 사용 가능. (선택 사항, 성능/데이터 양 고려.)

3. **테넌트 안정화**  
   - **프론트**: 스케줄/상담 API 호출 전에 `getDefaultApiHeaders()` / `getDefaultApiHeadersAsync()` 시점에 tenantId가 이미 들어와 있는지 확인. 필요하면 세션 갱신 후 재시도.  
   - **백엔드**: 이미 tenantId 필수 처리됨. 로그에 `tenantId가 설정되지 않았습니다`가 찍히면, 필터 단에서 세션/헤더로 tenantId가 안 들어오는 경우임 → 프론트 로그인/세션/헤더 설정 점검.

---

## 4. 체크리스트 (수정 후 확인용)

- [ ] 상담사 대시보드: “오늘 일정” 외에 “어제” 또는 “최근 N일” 노출이 필요하면, ConsultantDashboardV2.js 날짜 필터 수정 후 해당 기간 데이터가 보이는지 확인.
- [ ] 스케줄 캘린더: 같은 테넌트·같은 사용자로 어제 날짜에 등록된 스케줄이 DB에 있을 때, 캘린더에 표시되는지 확인.
- [ ] 브라우저 Network: 스케줄/상담 API 요청에 `X-Tenant-Id` 헤더가 있고, 200 응답에 `schedules` 등 데이터가 포함되는지 확인.
- [ ] 백엔드 로그: 해당 API 호출 시 `tenantId가 설정되지 않았습니다` 또는 400 `TENANT_ID_REQUIRED`가 없음을 확인.

---

**문서 작성**: core-debugger (분석·제안만 수행, 코드 수정은 core-coder 위임)

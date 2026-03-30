# 상담 이력 탭 — 데이터 출처 및 표시 내용

**대상:** 어드민 내담자 관리 > "상담 이력 관리" 탭  
**목적:** 어떤 데이터가 나와야 하는지, 왜 안 나올 수 있는지 정리

---

## 1. 나오는 데이터가 무엇인가? → **상담일지(ConsultationRecord)**

상담 이력 탭에 나오는 데이터는 **상담 예약(Consultation)** 이 아니라 **상담일지(ConsultationRecord)** 입니다.

| 구분 | 설명 |
|------|------|
| **상담(Consultation)** | 예약·일정 단위 (언제, 누가, 몇 시에 상담하는지) |
| **상담일지(ConsultationRecord)** | 회기별로 상담사가 작성하는 **기록** (세션 날짜, 회기 번호, 관찰/평가 등) |

- API: `GET /api/v1/admin/consultations`
- 백엔드: `AdminController.getConsultations()` → `ConsultationRecordService.getConsultationRecords()` → **`consultation_records`** 테이블 조회
- 프론트: `ClientComprehensiveManagement.loadConsultations()` → `setConsultations(response)` → `ClientConsultationTab`에 `consultations` props로 전달

즉, **“상담 이력” = 상담일지 목록**이고, 상담사가 세션 후 작성한 기록이 있어야 카드가 채워집니다.

---

## 2. 화면에 실제로 나오는 필드 (상담일지 1건당)

API가 내려주는 항목 중 UI에서 쓰는 것만 정리하면 아래와 같습니다.

| API 필드 | 화면 표시 |
|----------|-----------|
| `id` | 카드 제목 "상담 #id" |
| `sessionDate` | 세션 날짜 |
| `sessionNumber` | 세션 번호 |
| `sessionDurationMinutes` | 상담 시간(분) |
| `progressScore` | 진행 점수 |
| `consultantObservations` | 상담 내용(상담사 관찰사항) |
| `isSessionCompleted` | 상태 배지 "완료" / "진행중" |
| `clientId` | 내담자별 그룹핑 키 (내담자 목록의 `client.id`와 매칭) |

상담일지 엔티티에는 그 외에도 아래 항목들이 있지만, 현재 탭 UI에서는 추가로 표시하지 않습니다.

- `clientCondition`, `mainIssues`, `interventionMethods`, `clientResponse`
- `nextSessionPlan`, `homeworkAssigned`, `riskAssessment`, `consultantAssessment` 등

---

## 3. 데이터가 안 나올 수 있는 이유

### 3.1 백엔드에서 빈 배열을 주는 경우

1. **테넌트 미설정**  
   - `GET /api/v1/admin/consultations` 호출 시 `consultantId`, `clientId` 둘 다 없으면, 서비스는 **현재 테넌트** 기준으로 상담일지를 조회합니다.  
   - 이때 `TenantContextHolder.getTenantId()`가 **null/비어 있으면** `Page.empty()`를 반환해 **빈 배열**이 나갑니다.  
   - 로그인한 관리자 계정의 `User.tenantId`가 없거나, 세션/필터에서 테넌트를 안 넣어주면 이런 상황이 됩니다.

2. **DB에 상담일지가 없음**  
   - `consultation_records` 테이블에 해당 테넌트(`tenant_id`)로 **한 건도 없거나**, 모두 `is_deleted = true`이면 역시 빈 배열입니다.  
   - 상담 **예약**만 있고, 상담사가 **상담일지를 한 번도 작성하지 않았으면** 0건이 정상입니다.

### 3.2 프론트에서 그룹핑이 안 맞는 경우

- 상담 이력은 **`consultation.clientId`** 로 그룹핑하고, 화면에는 **`clients` 목록의 `client.id`** 단위로 “N건의 상담 이력”을 냅니다.  
- 따라서 **상담일지의 `clientId`** 와 **내담자 목록의 `client.id`** 가 같은 식별 체계여야 합니다.  
  - 내담자 목록: `getAllClientsWithStats()` → `/api/v1/admin/clients/with-stats` → `item.client.id`  
  - 상담일지: `consultation_records.client_id` (내담자 **User.id** 로 저장된다고 가정)  
- 두 API가 서로 다른 ID 체계(예: User.id vs 다른 테이블 PK)를 쓰면, 같은 사람인데도 “0건”으로 나올 수 있습니다.

---

## 4. 확인 방법 (디버깅)

1. **브라우저 개발자 도구**
   - Network에서 `GET /api/v1/admin/consultations` 응답 확인.
   - `response.data`(또는 apiGet이 이미 풀어서 주면 그 배열)가 `[]` 인지, 실제 상담일지 배열인지 확인.

2. **백엔드 로그**
   - `ConsultationRecordServiceImpl.getConsultationRecords` 로그:  
     `tenantId`가 null이면 “둘 다 null일 때” 분기에서 `findByTenantIdAndIsDeletedFalseOrderBySessionDateDesc`를 타지 않고 `Page.empty()`가 나갑니다.
   - `AdminController.getConsultations` 로그:  
     “상담 이력 조회 완료 - 조회된 건수: N” 에서 N이 0인지 확인.

3. **DB**
   - `consultation_records` 에서  
     `tenant_id = (관리자 테넌트)`, `is_deleted = false` 인 행이 있는지 확인.

---

## 5. 요약

| 질문 | 답 |
|------|----|
| 상담 이력 탭에 나오는 건 뭔가요? | **상담일지(ConsultationRecord)** 입니다. 상담 예약이 아니라 “회기별 상담 기록”입니다. |
| 어떤 내용이 나오나요? | 세션 날짜, 회기 번호, 상담 시간, 진행 점수, 상담사 관찰사항, 완료/진행중 상태 등. |
| 왜 데이터가 안 나올 수 있나요? | (1) 테넌트가 설정되지 않아 백엔드가 빈 목록을 반환하거나, (2) DB에 상담일지가 없거나, (3) `clientId`와 내담자 목록 `client.id` 체계가 달라서 그룹핑이 안 맞을 수 있습니다. |

이 문서는 **데이터 출처와 표시 내용**만 정의합니다. 레이아웃/UI 스펙은 `CLIENT_CONSULTATION_TAB_LAYOUT_SPEC.md` 를 참고하면 됩니다.

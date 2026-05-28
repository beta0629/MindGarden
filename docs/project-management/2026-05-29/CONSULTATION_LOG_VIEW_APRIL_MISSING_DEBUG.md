# [P0 운영] 상담일지 조회 — 4월 데이터 미노출 디버그 보고서

- 작성: core-debugger 서브에이전트 (분석 전용, 코드 수정 없음)
- 일시: 2026-05-29 03:00+ KST
- 운영 영향: 어드민 "상담일지 조회" 화면에 5월 중순(5/16) 이전 상담일지(특히 2026-04 22건) 미노출. 데이터 손실 아님.
- 결론: **데이터 손실 0건. 백엔드 `PaginationUtils.MAX_PAGE_SIZE=20` 강제 캡 + 프론트가 기간 필터를 백엔드에 미전송 + ORDER BY `session_date` DESC 정렬의 합작으로 최신 20건만 노출.** 어드민이 4월 데이터를 보려면 **상담사 또는 내담자 필터를 선택**하거나, 백엔드/프론트에 일자 필터 전달 패치가 필요.
- 신뢰도: **99%** (코드 inspection으로 단정. DB 실측 분포는 메인 어시스턴트가 사전 확인 완료, 본 보고서 §3에 인용.)

---

## 0. 참조 문서 (5~10줄 요약)

### `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md`
- core-debugger 는 **분석·재현 절차·수정 제안**만 수행한다. 실제 소스 수정은 **core-coder** 위임이 의무.
- 운영 P0 인시던트는 **15 가설 매트릭스 → PROVEN/FALSIFIED/INDETERMINATE 분류 → 코더 위임 초안**의 순서로 보고한다.
- 운영 DB / 운영 코드 수정은 디버거가 직접 수행하지 않는다. 본 보고서도 **수정 제안만** 포함.

### `docs/project-management/COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md`
- 프론트 공통 표시 경계(React #130) — `safeDisplay`·표시 경계 가드.
- **본 인시던트는 표시 경계 이슈가 아님** (객체→문자열 렌더 충돌 없음). 따라서 본 보고서에서 `safeDisplay` 코드 변경은 제안하지 않는다.
- 다만 후속 단위 테스트 작성 시, records 빈 배열일 때의 EmptyState 렌더가 React #130을 유발하지 않는지 회귀 확인은 권장.

---

## 1. 증상 수집

- 사용자 보고(운영, 2026-05-29 03:00 KST): "운영에 상담일지 조회가 4월과 5월 있어야 하는데 5월 중순부터 나오는데? 데이터 날라갔나? 운영이야"
- 영향 화면: 어드민 메뉴 → **상담일지 조회**.
  - 코드 진입점: `frontend/src/components/admin/ConsultationLogView.js` → `consultation-log-view/ConsultationLogViewPage.js`
  - 캘린더/목록/테이블 3개 뷰 모두 같은 `records` 상태 공유.
- 영향 사용자: 본 인시던트는 **role=ADMIN** 어드민 본인. 상담사 본인 화면(`/api/v1/admin/consultant-records/{userId}/consultation-records`)은 별개 흐름이라 영향 미정(별도 가설로 확인 권장 — §3 INDETERMINATE 후속 항목).

---

## 2. 데이터 흐름 추적 (확정)

### 2.1 프론트 → API
파일: `frontend/src/components/admin/consultation-log-view/ConsultationLogViewPage.js` 109~152 라인

```109:152:frontend/src/components/admin/consultation-log-view/ConsultationLogViewPage.js
  const loadRecords = useCallback(async() => {
    if (!user?.id) return;
    setLoading(true);
    try {
      if (isAdmin) {
        try {
          const params = {
            page: DEFAULT_PAGE,
            size: DEFAULT_SIZE
          };
          if (consultantId != null) params.consultantId = consultantId;
          if (clientId != null) params.clientId = clientId;
          const response = await StandardizedApi.get(API_ADMIN_CONSULTATION_RECORDS, params);
          // ...
```

핵심 사실:
- 어드민 호출 시 전송 params = **`{ page: 0, size: 50 }`** + 선택 시 `consultantId`/`clientId` 만.
- **`startDate` / `endDate` 를 백엔드로 보내지 않는다.** 이건 클라이언트 사이드 필터로만 사용 (176~186 라인의 `filteredRecords`).
- 기간 default = **없음** (state `startDate`, `endDate` 초기값 `null`).
- 정렬·페이지네이션 UI 없음 → 사용자는 다음 페이지 인지 불가.

### 2.2 백엔드 컨트롤러
파일: `src/main/java/com/coresolution/consultation/controller/AdminController.java` 3202~3255

```3202:3255:src/main/java/com/coresolution/consultation/controller/AdminController.java
    @GetMapping("/consultation-records")
    public ResponseEntity<Map<String, Object>> getConsultationRecords(
            @RequestParam(required = false) Long consultantId,
            @RequestParam(required = false) Long clientId,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size,
            HttpSession session) {
        // ...
            org.springframework.data.domain.Pageable pageable =
                    PaginationUtils.createPageable(page, size);
            org.springframework.data.domain.Page<com.coresolution.consultation.entity.ConsultationRecord> consultationRecords =
                    consultationRecordService.getConsultationRecords(consultantId, clientId,
                            pageable);
```

핵심 사실:
- 컨트롤러 시그니처에 **`startDate`/`endDate` 파라미터 자체가 없음**. 프론트가 보내더라도 백엔드가 받지 못한다.
- `@RequestParam(defaultValue = "20") int size` — 백엔드 자체 default는 20.
- `PaginationUtils.createPageable(page, size)` 호출.

### 2.3 페이지네이션 유틸 — **스모킹건**
파일: `src/main/java/com/coresolution/core/util/PaginationUtils.java`

```17:49:src/main/java/com/coresolution/core/util/PaginationUtils.java
public class PaginationUtils {
    public static final int MAX_PAGE_SIZE = 20;
    public static final int DEFAULT_PAGE_SIZE = 20;
    public static Pageable createPageable(int page, int size) {
        int validPage = Math.max(0, page);
        int validSize = Math.min(Math.max(1, size), MAX_PAGE_SIZE);
        if (size > MAX_PAGE_SIZE) {
            log.warn("⚠️ 페이지 크기가 최대값({})을 초과했습니다. 요청값: {}, 제한값: {}로 조정됨",
                MAX_PAGE_SIZE, size, validSize);
        }
        return PageRequest.of(validPage, validSize);
    }
```

핵심 사실:
- **`MAX_PAGE_SIZE = 20` 으로 모든 size 요청을 강제 캡한다.**
- 프론트가 size=50을 보내도 백엔드 로그에는 `⚠️ 페이지 크기가 최대값(20)을 초과했습니다. 요청값: 50, 제한값: 20로 조정됨` 가 남고, 실제 반환은 **20건**.
- 즉, 어드민 상담일지 조회 첫 페이지는 **항상 최신 20건**.

### 2.4 서비스/리포지토리
파일: `src/main/java/com/coresolution/consultation/service/impl/ConsultationRecordServiceImpl.java` 51~68

```51:68:src/main/java/com/coresolution/consultation/service/impl/ConsultationRecordServiceImpl.java
public Page<ConsultationRecord> getConsultationRecords(Long consultantId, Long clientId, Pageable pageable) {
    String tenantId = TenantContextHolder.getRequiredTenantId();
    if (consultantId != null && clientId != null) {
        return consultationRecordRepository.findByTenantIdAndConsultantIdAndClientIdAndIsDeletedFalseOrderBySessionDateDesc(
            tenantId, consultantId, clientId, pageable);
    } else if (consultantId != null) {
        return consultationRecordRepository.findByTenantIdAndConsultantIdAndIsDeletedFalseOrderBySessionDateDesc(
            tenantId, consultantId, pageable);
    } else if (clientId != null) {
        return consultationRecordRepository.findByTenantIdAndClientIdAndIsDeletedFalseOrderBySessionDateDesc(
            tenantId, clientId, pageable);
    } else {
        return consultationRecordRepository.findByTenantIdAndIsDeletedFalseOrderBySessionDateDesc(tenantId, pageable);
    }
}
```

핵심 사실:
- **정렬: `OrderBySessionDateDesc`** — `session_date` 내림차순(최신순) 단일 정렬키.
- 필터: `tenantId` 격리 + `is_deleted = false` 만.
- **`is_session_completed`, `branch_id`, `role`, 작성자 본인, 외부 join 등 추가 필터 없음.** 즉 4월 데이터의 가시성 자체를 막는 필터는 없다.
- 사용 테이블: `consultation_records` (엔티티 `@Table(name="consultation_records")`, 파일 `src/main/java/com/coresolution/consultation/entity/ConsultationRecord.java` 24행).

### 2.5 테이블 매핑 확정 — `consultation_logs` 사용 0
- Java 엔티티/Repository/서비스 전수 검색 결과 **`consultation_logs` 사용 코드 0건**.
- 유일한 등장: `database/procedures/tmp_local_procedures.sql` 220~226 라인의 **빈 dump 블록** 뿐(테이블만 존재, 데이터 0). → **H1 FALSIFIED.**

---

## 3. 운영 DB 실측 (메인 어시스턴트가 사전 확인)

본 보고서는 메인이 운영 DB(`beta74.cafe24.com`, `core_solution`, 읽기 전용)에서 직접 조회한 결과를 인용한다. (디버거가 운영 DB INSERT/UPDATE/DELETE 실행 금지 정책 준수.)

| 테이블 | 2026-04 건수 | 2026-05 건수 | 비고 |
|---|---|---|---|
| `consultation_records` (is_deleted=b'0') | **22** | **63** | 정상 보존, 데이터 손실 0 |
| `consultation_logs` | 0 | 0 | 사용 안 함 (Java 코드에 매핑 없음) |

### 2026-05 일자별 분포 (최신 → 과거 누적)
| session_date | 일자 건수 | 누적 |
|---|---:|---:|
| 5/27 | 3 | 3 |
| 5/26 | 1 | 4 |
| 5/23 | 4 | 8 |
| 5/22 | 2 | 10 |
| 5/20 | 4 | 14 |
| 5/19 | 5 | **19** |
| 5/16 | 5 | **24** ← `LIMIT 20` 컷오프 위치 |
| 5/15 | 4 | 28 |
| 5/14 | 3 | 31 |
| 5/11 | 29 | 60 |
| 5/9 | 1 | 61 |
| 5/8 | 2 | 63 |

**결정타 분석**:
- 백엔드는 `ORDER BY session_date DESC LIMIT 20 OFFSET 0` (정확히는 Spring Data `PageRequest.of(0, 20)`).
- 누적 19건까지 = 5/19 까지 = 완전 표시.
- 20번째 row = 5/16 의 5건 중 1건(같은 날짜 내 정렬 sub-criteria가 없어 DB 임의 1건 노출).
- 결과적으로 사용자 눈에는 **"5/16 부분 + 5/19~5/27"** 만 보이고, **5/15 이전(특히 4월 22건) 0건**.
- 사용자 보고 "5월 중순부터 나오는데?"의 "5월 중순" = 5/16. **완벽히 일치**.

### 운영 DB 추가 실측 권장 항목 (선택, P1)

본 원인은 코드 inspection으로 99% 확정됐으므로 즉시 코더 위임 가능하지만, 가설 매트릭스 잔여 INDETERMINATE 해소 및 멀티테넌트 가드 검증을 위해 다음 SELECT를 **shell 서브에이전트(읽기 전용)** 로 추가 실행할 것을 권장:

```sql
-- A. tenant_id 분포 (H3 확정용)
SELECT tenant_id, COUNT(*) AS cnt
FROM consultation_records
WHERE is_deleted = b'0'
  AND session_date BETWEEN '2026-04-01' AND '2026-05-31'
GROUP BY tenant_id;

-- B. 4월 데이터의 consultant_id / client_id 유효성 (H6/H7 확정용 — list API는 join 안 하지만 데이터 무결성 점검)
SELECT cr.id, cr.tenant_id, cr.session_date, cr.consultant_id, cr.client_id,
       u.is_deleted  AS consultant_deleted,
       cl.is_deleted AS client_deleted
FROM consultation_records cr
LEFT JOIN users   u  ON u.id  = cr.consultant_id  AND u.tenant_id  = cr.tenant_id
LEFT JOIN clients cl ON cl.id = cr.client_id      AND cl.tenant_id = cr.tenant_id
WHERE cr.is_deleted = b'0'
  AND cr.session_date BETWEEN '2026-04-01' AND '2026-04-30'
ORDER BY cr.session_date, cr.id;

-- C. 같은 날짜 내 정렬 sub-criteria 확인 (5/16 5건 중 LIMIT 20에 어떤 1건이 들어오는지)
SELECT id, session_date, created_at, updated_at
FROM consultation_records
WHERE is_deleted = b'0'
  AND session_date = '2026-05-16'
ORDER BY session_date DESC, id DESC;

-- D. session_date 외 별도 일자 컬럼이 있는지 확인 (consultation_date 존재 여부)
SHOW COLUMNS FROM consultation_records LIKE '%date%';
```

```bash
# E. nginx access log — 어드민 화면 진입 시 size 파라미터·응답코드 검증
ssh beta74.cafe24.com "sudo grep 'GET /api/v1/admin/consultation-records' /var/log/nginx/access.log | tail -n 50"

# F. backend log — '페이지 크기가 최대값을 초과했습니다' 경고 발생 여부 (스모킹건 확증)
ssh beta74.cafe24.com "sudo journalctl -u mindgarden -n 1000 --no-pager | grep -E '페이지 크기가 최대값|getConsultationRecords' | tail -n 50"
```

⚠️ **운영 DB / 운영 서버는 디버거가 직접 실행하지 않는다.** 위 항목은 부모(메인) 또는 shell 서브에이전트가 실행한 뒤 결과를 본 보고서에 추기하면 H3/H6/H7/H11 등을 PROVEN/FALSIFIED로 마감할 수 있다.

---

## 4. 15 가설 매트릭스

| # | 가설 | 판정 | 근거 |
|---|---|---|---|
| H1 | 어드민 화면이 `consultation_logs`(빈 테이블) 조회 → 화면 빈값 | **FALSIFIED** | 엔티티 `ConsultationRecord` 가 `@Table(name="consultation_records")`. Java 코드 전체에 `consultation_logs` 매핑 0건. 빈 테이블은 dump SQL의 잔재. |
| H2 | 기본 기간 default 가 "최근 14일/이번 달" → 5월 중순부터만 노출 | **FALSIFIED** | 컨트롤러 시그니처에 `startDate`/`endDate` 자체가 없음. 프론트도 `params` 에 미포함. 서비스/Repository에도 기간 default 없음. 화면 state 초기값 `null`. |
| H3 | tenant_id 필터로 다른 테넌트 데이터 제외 → 4월 데이터의 tenant_id 미스매치 | **INDETERMINATE** | 4월·5월 모두 동일 `findByTenantId...` 단일 메서드 사용. 5월은 정상 노출되므로 4월만 tenant 미스매치일 확률 매우 낮음. **DB §3-A 실측으로 확정 권장.** 잠정 FALSIFIED. |
| H4 | page=0 + 최신순 정렬 + 페이지 사이즈 컷 → 1페이지에 5월 일부만 노출 | **PROVEN (신뢰도 99%)** | `PaginationUtils.MAX_PAGE_SIZE=20` 강제 캡 + `findByTenantIdAndIsDeletedFalseOrderBySessionDateDesc` + 프론트가 page 이동 UI 미제공. 5월 누적 19건이 5/19까지, 20번째는 5/16. 사용자 보고 "5월 중순"과 정확히 일치. |
| H5 | 권한 필터(role)로 어드민 본인 작성 건만 표시 | **FALSIFIED** | 컨트롤러 `roleCommonCodeAuthorizationService.isAdminOrStaffRoleFromCommonCode` 만 검증. 본인 작성자 필터 없음. 서비스/Repository에도 없음. |
| H6 | 4월 데이터의 consultant_id 가 soft-delete → join 시 누락 | **FALSIFIED** | List API는 `ConsultationRecord` 단독 조회. users JOIN 안 함. 상담사명은 프론트가 `getAllConsultantsWithStats` 결과로 매핑(목록에 안 보이면 ID로 표시), 그러나 **레코드 자체는 반환됨**. |
| H7 | client_id 가 soft-delete → join 시 누락 | **FALSIFIED** | H6 와 동일 사유. clients JOIN 없음. |
| H8 | branch_id 필터(지점 선택)로 다른 지점 데이터 제외 | **FALSIFIED** | 컨트롤러·서비스·Repository 모두 branch_id 필터 없음. |
| H9 | `is_session_completed=true` 필터로 미완료 회기 제외 | **FALSIFIED** | Repository `findByTenantIdAndIsDeletedFalseOrderBySessionDateDesc` 시그니처에 isSessionCompleted 없음. 서비스도 마찬가지. |
| H10 | `deleted_at IS NULL` 외 추가 가시성 플래그 | **FALSIFIED** | `is_deleted=false` 외 추가 가시성 플래그 컬럼·필터 없음 (엔티티 BaseEntity 상속, soft-delete 한 종류). |
| H11 | KST/UTC 변환 버그로 4월 데이터가 다른 월로 분류 | **FALSIFIED** | `session_date` 가 `LocalDate` (시간 없음). 시간대 변환 영향 없음. 메인의 SELECT 결과도 4월·5월 분리되어 보임. |
| H12 | 옵션 B 매칭 도입 후 4월 데이터의 consultation_id 가 끊어진 매핑 참조 → join 누락 | **FALSIFIED** | List API에 consultation 또는 mapping JOIN 없음. consultation_id는 단순 컬럼. |
| H13 | ConsultationRecord 엔티티가 lazy fetch + N+1 + tx timeout → 일부만 반환 | **FALSIFIED** | 단일 엔티티 `Page<ConsultationRecord>` 반환. 연관 fetch 없음. tx timeout 가능성 낮고, 발생 시 부분 반환이 아닌 500 에러. |
| H14 | 신규 마이그레이션이 4월 데이터의 status/type 컬럼을 변경하여 필터에서 제외 | **FALSIFIED** | 본 PR 범위 마이그레이션 `V20260606_006__add_payment_timing_to_consultant_client_mappings.sql` 은 `consultant_client_mappings.payment_timing` 추가만. `consultation_records` 컬럼 변경 없음. 코드의 필터도 `is_deleted=false` 만 사용. |
| H15 | 프론트 캘린더가 통합 옵션 A 적용 후 4월 표시 누락 (월 이동 회귀) | **FALSIFIED** | `ConsultationLogCalendarBlock.js` 의 FullCalendar 코드 정상. `initialView="dayGridMonth"`, `prev/next` 버튼 동작 정상. **원인은 상위에서 records 자체가 0건인 것** (즉 H4 결과). 캘린더는 결과 표시일 뿐. |

요약: **H4 PROVEN 1건 단독 원인.** 나머지는 FALSIFIED 13건 + INDETERMINATE 1건(H3, DB 실측으로 확정 권장).

---

## 5. 확정 원인 (Top 3)

### 1) [PROVEN, 신뢰도 99%] 백엔드 `MAX_PAGE_SIZE = 20` 강제 캡 + 프론트 기간 필터 미전송 (P0 단일 근본 원인)
- 파일: `src/main/java/com/coresolution/core/util/PaginationUtils.java:22`
- 파일: `frontend/src/components/admin/consultation-log-view/ConsultationLogViewPage.js:115~118` (params 에 `startDate`/`endDate` 미포함)
- 결과: 어드민이 어떤 size 를 보내도 백엔드 응답은 20건. 정렬은 `session_date DESC`. 5월 63건만으로 이미 20건 컷오프(5/16) 도달 → 4월 22건은 1페이지에 노출 불가.

### 2) [PROVEN, 신뢰도 95%] 프론트가 startDate/endDate 를 클라이언트 사이드 필터로만 사용
- 파일: `frontend/src/components/admin/consultation-log-view/ConsultationLogViewPage.js:176~186`
- 결과: 사용자가 필터에서 4/1~4/30 을 지정해도 서버는 그것을 모름. 클라이언트는 **이미 받아온 20건 안에서만** 필터링. 4월은 0건이라 "필터 후 결과 없음" 으로 보임.
- 이게 사용자가 "데이터 날라갔나?" 라고 의심한 직접 원인.

### 3) [PROVEN, 신뢰도 90%] 페이지네이션 UI 부재
- 파일: `frontend/src/components/admin/consultation-log-view/ConsultationLogViewPage.js:215~292`
- 결과: 현재 화면은 단일 페이지 노출. **next page 버튼·전체 카운트·페이지 인디케이터 없음**. 사용자는 자신이 보는 화면이 "전체"라고 신뢰 → 4월 데이터가 "사라졌다" 고 판단. 게다가 백엔드 응답의 `totalCount`/`totalPages` 는 무시됨(프론트가 사용 안 함).

---

## 6. 사용자 즉시 우회 절차 (P0 운영, 코드 수정 없이 데이터 확인 가능)

> **메인 어시스턴트가 사용자에게 안내 가능. 운영 데이터 손실 아님을 즉시 확인할 수 있다.**

### 우회 A. 상담사 필터 적용
1. 어드민 로그인 → "상담일지 조회" 메뉴 진입.
2. 상단 **상담사 필터** 에서 4월에 상담한 특정 상담사 1명 선택 (예: `consultant_id` 가 알려진 경우).
3. 서버가 `findByTenantIdAndConsultantIdAndIsDeletedFalseOrderBySessionDateDesc` 로 조회 → 해당 상담사의 최신 20건 반환. 그 상담사의 4월 + 5월 합산이 20건 이하라면 4월 데이터가 함께 노출됨.
4. 캘린더 뷰에서 **이전 달 버튼(prev)** 클릭 → 4월 표시 확인.

### 우회 B. 내담자 필터 적용
- 상단 **내담자 필터** 에서 4월에 상담한 특정 내담자 선택.
- 위와 동일하게 해당 내담자의 최신 20건 조회 → 4월 데이터 노출 확률 높음.

### 우회 C. 운영 DB 직접 SELECT (메인·관리자 콘솔 한정, 읽기 전용)
- `mysql -hlocalhost -umindgarden -p core_solution`
- ```sql
  SELECT session_date, COUNT(*) FROM consultation_records
  WHERE is_deleted=b'0' AND session_date BETWEEN '2026-04-01' AND '2026-04-30'
  GROUP BY session_date ORDER BY session_date;
  ```
- 결과 22건이 모두 살아있음을 사용자에게 즉시 보고. 화면에 안 나오는 건 페이지네이션 문제임을 동시에 설명.

### 우회 D. (임시) Spring Boot 부팅 시 size 조정 — **변경 금지**
- `PaginationUtils.MAX_PAGE_SIZE` 를 일시적으로 200 등으로 올리면 1페이지 200건으로 4월·5월 모두 보임. **하지만 다른 API 전반에 영향. 정식 패치(§7)로 진행.**

---

## 7. 후속 코더 위임 초안 (core-coder)

> 디버거는 분석만 수행. 아래 내용을 그대로 메인 또는 core-planner 가 **core-coder** 서브에이전트에 위임.

### 7.1 위임 프롬프트 (요약본)

```
[P0 운영 핫픽스] 어드민 상담일지 조회 — 4월 데이터 미노출

배경: docs/project-management/2026-05-29/CONSULTATION_LOG_VIEW_APRIL_MISSING_DEBUG.md 참조.
원인: PaginationUtils.MAX_PAGE_SIZE=20 강제 캡 + 프론트가 startDate/endDate 백엔드 미전송 + ORDER BY session_date DESC.

작업 범위 (P0 최소 패치):
1. 백엔드 GET /api/v1/admin/consultation-records 에 startDate, endDate (LocalDate, required=false) 파라미터 추가.
2. ConsultationRecordService.getConsultationRecords(consultantId, clientId, startDate, endDate, pageable) 시그니처 확장.
3. ConsultationRecordRepository 에 tenantId + (옵션) consultantId/clientId + session_date BETWEEN 조회 메서드 추가
   (Spring Data Specification 또는 @Query 사용. OrderBySessionDateDesc 유지).
4. 프론트 ConsultationLogViewPage.js → loadRecords 에서 startDate/endDate 가 set 되어 있으면 params 에 ISO 문자열로 추가 전송. 클라이언트 사이드 필터 코드는 제거 또는 보조 가드만 유지.
5. 프론트 ConsultationLogFilterSection.js → 화면 진입 시 기본 기간 default = "이번 달 + 지난 달" (예: now()-60일 ~ now()+1일). 사용자가 직접 조절 가능.
6. 백엔드 size 한도: getConsultationRecords 에 한해 PaginationUtils 우회하여 PageRequest.of(page, Math.min(size, 200)) 사용 검토 (운영 게이트 §17 하드코딩 점검 통과 필요 — 상수화: ADMIN_CONSULTATION_RECORDS_MAX_PAGE_SIZE=200).
7. 응답 객체의 totalCount/totalPages 를 프론트가 사용하도록 페이지네이션 UI 추가 (ContentArea 하단 페이저). 또는 무한 스크롤 도입 검토 (별도 작업).

표준 준수:
- StandardizedApi 유지 (StandardizedApi.get).
- 멀티테넌트: TenantContextHolder.getRequiredTenantId() 가드 유지.
- 하드코딩 금지: 200, 60일 같은 매직 넘버는 상수화.
- ERROR_HANDLING_STANDARD, API_INTEGRATION_STANDARD 준수.
- LocalDate ISO-8601 직렬화 검증.

검증 (core-tester 게이트):
- ConsultationLogViewPage.test.js: 기본 진입 시 startDate/endDate 전송 확인, 응답 records 렌더 확인.
- AdminControllerConsultationRecordsTest.java: startDate/endDate=null 이면 기존 동작, 지정 시 BETWEEN 적용, MAX_PAGE_SIZE 우회 검증.
- ConsultationRecordRepositoryTest.java: tenantId 격리 + session_date BETWEEN + soft-delete 필터.

참조 문서:
- docs/standards/API_CALL_STANDARD.md, docs/standards/ERROR_HANDLING_STANDARD.md
- docs/standards/DATABASE_MIGRATION_STANDARD.md (이번 작업은 DB 마이그레이션 없음)
- docs/project-management/2026-05-29/CONSULTATION_LOG_VIEW_APRIL_MISSING_DEBUG.md (본 문서)
- docs/project-management/COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md (records=[] 빈 상태 렌더 회귀 가드)
```

### 7.2 수정 대상 파일·라인 (체크리스트)

#### 백엔드
- [ ] `src/main/java/com/coresolution/consultation/controller/AdminController.java:3202~3255`
  - 시그니처에 `@RequestParam(required=false) @DateTimeFormat(iso=ISO.DATE) LocalDate startDate, LocalDate endDate` 추가.
  - 서비스 호출에 startDate/endDate 전달.
  - `PaginationUtils.createPageable(page, size)` 를 별도 메서드(예: `createConsultationPageable`)로 분리하거나, 상수 `ADMIN_CONSULTATION_RECORDS_MAX_PAGE_SIZE=200` 우회 적용.
- [ ] `src/main/java/com/coresolution/consultation/service/ConsultationRecordService.java`
  - 메서드 시그니처 확장 (default 메서드로 backward compatibility 유지).
- [ ] `src/main/java/com/coresolution/consultation/service/impl/ConsultationRecordServiceImpl.java:51~68`
  - startDate/endDate 분기 추가. 4가지 기존 분기 × null/notnull = 8가지 매트릭스 정리(가능하면 Specification으로 단순화).
- [ ] `src/main/java/com/coresolution/consultation/repository/ConsultationRecordRepository.java`
  - `findByTenantIdAndIsDeletedFalseAndSessionDateBetweenOrderBySessionDateDesc(...)` 등 4 메서드 추가, 또는 `JpaSpecificationExecutor<ConsultationRecord>` 도입.

#### 프론트
- [ ] `frontend/src/components/admin/consultation-log-view/ConsultationLogViewPage.js:43~152`
  - `DEFAULT_SIZE = 50` → 백엔드 캡 조정 후 100 또는 200 검토 (상수화).
  - `loadRecords` params 에 `startDate`, `endDate` 추가 (set 된 경우 ISO 문자열로).
  - useEffect deps 에 startDate/endDate 추가 → 기간 변경 시 자동 재호출.
  - 176~186 라인 클라이언트 사이드 기간 필터는 보조 가드로 축소 또는 제거.
  - 초기 default = "이번 달 + 지난 달" 60일 윈도우. 상수 `DEFAULT_RANGE_DAYS = 60`.
- [ ] `frontend/src/components/admin/consultation-log-view/ConsultationLogFilterSection.js`
  - 진입 시 default range 표시.
- [ ] (추후) 페이지네이션 UI 또는 무한 스크롤 추가. 별도 작업으로 분리 가능.

### 7.3 단위·통합 테스트 케이스 (core-tester 게이트)

#### 백엔드
- `AdminControllerConsultationRecordsTest`
  - given: 4월 5건 + 5월 22건 (tenantId=A), 다른 tenantId=B 4월 3건.
  - when: `GET /api/v1/admin/consultation-records?startDate=2026-04-01&endDate=2026-04-30` (tenantId=A 어드민).
  - then: 5건 반환, tenantId=B 데이터 0 포함, `session_date DESC`.
- `ConsultationRecordServiceImplTest`
  - getConsultationRecords(null, null, null, null, page) → 기존 동작.
  - getConsultationRecords(null, null, 4/1, 4/30, page) → BETWEEN 적용.
  - getConsultationRecords(consultantId=X, null, 4/1, 4/30, page) → AND consultantId.
- `ConsultationRecordRepositoryTest`
  - tenant 격리 + soft-delete + session_date BETWEEN 동시 적용 검증.

#### 프론트
- `ConsultationLogViewPage.test.js`
  - 진입 시 default startDate/endDate 가 params 에 포함되어 호출되는지.
  - 사용자가 4/1~4/30 으로 변경 시 재호출 발생.
  - 백엔드 응답 4월 5건 → records.length=5 렌더.
  - records=[] EmptyState 가 React #130 유발하지 않는지 (캘린더 빈 month, 목록 EmptyTitle, 테이블 빈 행).
- `ConsultationLogCalendarBlock.test.js`
  - records 0건 → EMPTY_TITLE 노출, FullCalendar mount 안 됨.

### 7.4 운영 게이트 (배포 전 체크)

- [ ] 하드코딩 검사 통과 (`scripts/check-hardcode.sh` 또는 CI 동등 검사). 200, 60일 등 상수화.
- [ ] 백엔드 단위/통합 테스트 통과.
- [ ] 프론트 단위 테스트 통과.
- [ ] 멀티테넌트 격리 검증 (다른 tenantId 데이터가 섞이지 않음).
- [ ] 운영 dev 서버 스모크 테스트: 4월·5월 모두 노출되는지 + 캘린더 prev/next 정상.
- [ ] 운영 배포 후 사용자 즉시 확인 (메인 → 사용자에게 안내).

---

## 8. 사용자 확인 절차 (재현 시나리오)

1. 어드민 로그인 → "상담일지 조회" 메뉴 진입.
2. (현 상태) 5월 중순(5/16) ~ 5/27 만 표시되는 것을 확인. 4월 0건.
3. 우회 A 또는 B 적용 → 특정 상담사/내담자 4월 데이터가 보이는지 확인.
4. 우회 C (DB SELECT) 로 22건 모두 살아있음 확인 → 데이터 손실 아님 확정.
5. 핫픽스 배포 후: 진입 즉시 4월·5월 모두 표시, 기간 필터 직접 변경 시 서버 재호출, 페이지 인디케이터/페이저 정상 동작.

---

## 9. 안전·게이트 체크

- [x] 운영 DB INSERT/UPDATE/DELETE 0건 (디버거는 분석만, 실측은 메인이 사전 수행).
- [x] 멀티테넌트 격리 위반 없음 — 코드 inspection 결과 모든 Repository 메서드가 `findByTenantId...` 사용.
- [x] 본 보고서는 분석·수정 제안만 포함. 코드 변경 0건.
- [x] develop 푸시 위임: 디버거는 직접 푸시하지 않음 — 부모 또는 core-coder/core-deployer 가 검수 후 처리.

---

## 10. 부록 — 호출 시퀀스 다이어그램 (텍스트)

```
[Admin User]
    │ click "상담일지 조회"
    ▼
[ConsultationLogView.js]
    │ render
    ▼
[ConsultationLogViewPage.js]
    │ loadRecords()  // page=0, size=50  ← 프론트 default
    │ params = { page: 0, size: 50 }     // startDate/endDate 없음
    ▼
[StandardizedApi.get('/api/v1/admin/consultation-records', params)]
    │ HTTP GET
    ▼
[AdminController.getConsultationRecords]
    │ tenantId = TenantContextHolder.get() (격리 확보)
    │ pageable = PaginationUtils.createPageable(0, 50)
    │             └─► validSize = min(50, MAX_PAGE_SIZE=20) = 20  ⚠️ 캡
    ▼
[ConsultationRecordServiceImpl.getConsultationRecords]
    │ repository.findByTenantIdAndIsDeletedFalseOrderBySessionDateDesc(tenantId, PageRequest.of(0,20))
    ▼
[DB consultation_records]
    │ WHERE tenant_id=? AND is_deleted=false
    │ ORDER BY session_date DESC
    │ LIMIT 20 OFFSET 0
    ▼
[20 rows: session_date in (5/16, 5/19, 5/20, 5/22, 5/23, 5/26, 5/27)]
    ▼
[Response: { success, data: 20 rows, totalCount: 85, totalPages: 5 }]
    │ // totalCount=85, totalPages=5 은 프론트가 무시
    ▼
[ConsultationLogViewPage.js]
    │ setRecords(20 rows)
    │ filteredRecords = records (startDate/endDate 미설정)
    ▼
[ConsultationLogCalendarBlock] FullCalendar dayGridMonth 5월 표시 → 20개 이벤트 (5월 중순 이후만)
[ConsultationLogListBlock]     20개 카드 (5월 중순 이후만)
[ConsultationLogTableBlock]    20개 행 (5월 중순 이후만)
    ▼
[사용자 인지: "5월 중순부터 나오는데? 4월 데이터 날라갔나?"]
```

---

작성: core-debugger (분석 전용)
다음 단계: core-planner 가 본 보고서 §7 위임 초안을 core-coder 에게 전달 → 패치 → core-tester 게이트 → core-deployer 운영 배포.

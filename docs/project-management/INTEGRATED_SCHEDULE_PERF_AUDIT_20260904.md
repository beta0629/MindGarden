# 통합 스케줄 성능 감사 보고서 (READ-ONLY)

## 1) 제목/개요

본 문서는 `/admin/integrated-schedule` 화면의 초기 로드, Side Peek, 월별 보조 데이터 로드 경로를 기준으로 프론트엔드와 백엔드의 읽기 성능 병목을 점검한 감사 보고서다. 목적은 현재 구현이 데이터 증가에 따라 어디서 급격히 악화되는지 식별하고, 리팩터 설계가 아니라도 바로 착수 가능한 저위험 개선과 별도 설계 결정이 필요한 개선을 분리해 제시하는 데 있다.

핵심 결론은 단순하다. 현재 가장 큰 비용은 단일 느린 쿼리 하나가 아니라, `tenant` 범위 전체를 넓게 읽은 뒤 Java 필터링, 응답 enrich, 프론트의 대량 client-side filter/sort가 연쇄적으로 겹치는 구조다. 특히 통합 스케줄 프론트는 `ScheduleController`가 지원하는 `startDate/endDate` 범위를 사용하지 않고 매번 테넌트 전체 스케줄을 읽으며, 이후 응답 변환에서 행별 사용자 조회와 lifetime count 조회가 추가되어 사실상 `1 + 3N~5N` 수준의 쿼리 팽창 위험을 만든다. `frontend/src/components/admin/mapping-management/IntegratedMatchingSchedule.js`의 초기 로드/필터링과 `frontend/src/components/schedule/UnifiedScheduleComponent.js`, `src/main/java/com/coresolution/consultation/controller/ScheduleController.java`를 종합하면 이 방향이 가장 우선순위가 높다.

---

## 2) 조사 범위와 읽기 경로 요약

### 조사 범위

- 프론트 진입점
  - `frontend/src/components/admin/mapping-management/IntegratedMatchingSchedule.js`
  - `frontend/src/components/schedule/UnifiedScheduleComponent.js`
  - `frontend/src/components/admin/mapping-management/integrated-schedule/molecules/MappingScheduleSidePeekContent.js`
  - `frontend/src/hooks/useMonthlyConsultantCounts.js`
  - `frontend/src/hooks/useMissingConsultationLogs.js`
- 백엔드 컨트롤러/서비스/리포지토리
  - `AdminController`, `SessionExtensionController`, `ScheduleController`
  - `AdminServiceImpl`, `ConsultantStatsServiceImpl`, `SessionExtensionServiceImpl`, `ScheduleServiceImpl`
  - `ConsultantClientMappingRepository`, `ScheduleRepository`, `SessionExtensionRequestRepository`
- 엔티티/인덱스/마이그레이션
  - `ConsultantClientMapping`, `Schedule`, `SessionExtensionRequest`, `ConsultationRecord`, `User`
  - `V60__add_composite_indexes_for_performance.sql`

### 읽기 경로 요약

1. `/admin/integrated-schedule` 최초 마운트 시 `loadMappings()`가 `/api/v1/admin/mappings`와 `/api/v1/admin/session-extensions/pending-payment`를 병렬 호출하고, 최초 `useEffect`에서 즉시 실행된다. `IntegratedMatchingSchedule.js` L522-L559.
2. 같은 화면에서 내담자 필터 옵션은 `/api/v1/admin/clients/with-mapping-info`를 별도 1회 호출한다. `IntegratedMatchingSchedule.js` L256-L290.
3. 월별 상담사 완료 건수와 상담일지 누락 목록은 각각 `useMonthlyConsultantCounts`, `useMissingConsultationLogs` 훅을 통해 월별 API를 호출한다. `IntegratedMatchingSchedule.js` L230-L234, `useMonthlyConsultantCounts.js` L24-L25, L77-L117, `useMissingConsultationLogs.js` L24-L28, L91-L137.
4. `UnifiedScheduleComponent`는 초기 로드에서 스케줄, 공통코드, 상담사 목록을 병렬 로드한다. 스케줄은 `/api/v1/schedules/admin`, 상담사 목록은 `/api/v1/admin/consultants/with-vacation?date=...`다. `UnifiedScheduleComponent.js` L403-L445, L477-L499, L816-L840.
5. Side Peek는 열릴 때마다 `/api/v1/admin/consultants/with-stats`를 다시 읽는다. `MappingScheduleSidePeekContent.js` L68-L93.

---

## 3) 페이지 로드시 호출되는 백엔드 read endpoint 목록

### 통합 스케줄 페이지(`/admin/integrated-schedule`) 초기 로드

| 순서 | 프론트 호출 위치 | 엔드포인트 | 목적 | 비고 |
|---|---|---|---|---|
| 1 | `loadMappings()` | `GET /api/v1/admin/mappings` | 좌측 매칭 목록 전체 로드 | `Promise.all` 병렬 호출의 1축. `IntegratedMatchingSchedule.js` L522-L545 |
| 2 | `loadMappings()` | `GET /api/v1/admin/session-extensions/pending-payment` | 매칭 목록에 pending payment 회기추가 요청 attach | 실패 허용(`catch(() => null)`). `IntegratedMatchingSchedule.js` L522-L545 |
| 3 | 내담자 필터 옵션 | `GET /api/v1/admin/clients/with-mapping-info` | 상단 client multi-filter 옵션 구성 | 옵션용인데 백엔드가 전체 clients + 전체 mappings를 훑는다. `IntegratedMatchingSchedule.js` L256-L290 |
| 4 | 월별 완료 건수 훅 | `GET /api/v1/schedules/monthly-consultant-counts?year=...&month=...` | 상담사별 완료 배지 | tenant/month 캐시. `IntegratedMatchingSchedule.js` L230-L234, `useMonthlyConsultantCounts.js` L77-L117 |
| 5 | 월별 누락 일지 훅 | `GET /api/v1/schedules/monthly-missing-consultation-logs?year=...&month=...` | 범례의 상담일지 미작성 표시 | tenant/month 캐시. `IntegratedMatchingSchedule.js` L230-L234, `useMissingConsultationLogs.js` L91-L137 |
| 6 | 캘린더 데이터 | `GET /api/v1/schedules/admin[?consultantId=...]&_t=...` | 캘린더 일정 전체 로드 | 최초 로드와 refetch 시마다 timestamp cache-buster 부착. `UnifiedScheduleComponent.js` L477-L499 |
| 7 | 상태 코드 | `GET /api/v1/common-codes?codeGroup=SCHEDULE_STATUS` | 범례/상태명 변환 | 스케줄과 병렬. `UnifiedScheduleComponent.js` L354-L400, L816-L840, `CommonCodeController.findAll` |
| 8 | 상담사 목록 | `GET /api/v1/admin/consultants/with-vacation?date=YYYY-MM-DD` | 상단 consultant select + 휴가 정보 | 관리자/스태프에서만 로드. `UnifiedScheduleComponent.js` L403-L445, L816-L840 |

### Side Peek 및 후속 읽기

| 트리거 | 엔드포인트 | 목적 | 비고 |
|---|---|---|---|
| Side Peek open | `GET /api/v1/admin/consultants/with-stats` | in-place 상담사 변경 select 옵션 로드 | `mapping.id` 변경마다 재호출, 캐시 없음. `MappingScheduleSidePeekContent.js` L68-L93 |
| 캘린더 새로고침/저장 후 | `GET /api/v1/schedules/admin[?consultantId=...]&_t=...` | 일정 재동기화 | `_t`가 항상 달라 네트워크/브라우저 캐시 재사용 불가. `UnifiedScheduleComponent.js` L493-L495, L809-L813 |

### 관련 프론트 전달 포인트

- `IntegratedMatchingSchedule`는 `UnifiedScheduleComponent`에 `showClientFilter`, `clients`, `selectedClientIds`, `consultantCounts`, `missingConsultationLogs`를 전달해 초기 로드 보조 데이터가 모두 한 화면에 합쳐지도록 구성한다. `IntegratedMatchingSchedule.js` L1142-L1160.
- 매칭 목록 자체도 로드 후 화면 안에서 다시 `viewFilter`, `statusFilter`, 정렬을 모두 client-side로 수행한다. `IntegratedMatchingSchedule.js` L580-L613.

---

## 4) ranked findings (최악부터)

### Finding 1. 캘린더가 날짜 범위를 주지 않아 테넌트 전체 스케줄을 매번 읽고, 응답 변환에서 `1 + 3N~5N` 쿼리 팽창 위험이 중첩된다

- 심각도/우선순위: `P0 / Critical`
- 근거 파일:라인
  - 프론트는 관리자 경로에서 `/api/v1/schedules/admin`에 `consultantId`만 선택적으로 붙이고 `startDate/endDate`는 보내지 않는다. `frontend/src/components/schedule/UnifiedScheduleComponent.js` L477-L485.
  - 모든 스케줄 fetch에 `_t=${timestamp}` cache-buster를 붙인다. `frontend/src/components/schedule/UnifiedScheduleComponent.js` L493-L495.
  - 초기 로드/재로드는 스케줄 + 코드 + 상담사 목록 병렬이다. `frontend/src/components/schedule/UnifiedScheduleComponent.js` L816-L840.
  - 백엔드 `/admin` 엔드포인트는 `startDate/endDate/status` 파라미터를 받을 수 있지만 미지정 시 `scheduleService.findAll()` 또는 `findByConsultantId()`로 간다. `src/main/java/com/coresolution/consultation/controller/ScheduleController.java` L1445-L1550.
  - `findAll()`은 tenant-wide full fetch로, `findByConsultantId()`도 tenant+consultant 전체 fetch다. `src/main/java/com/coresolution/consultation/service/impl/ScheduleServiceImpl.java` L573-L576, L1318-L1323.
  - 기본 repository도 `findByTenantId` 전체 조회다. `src/main/java/com/coresolution/consultation/repository/ScheduleRepository.java` L451-L456.
  - 응답 변환 `convertToScheduleResponse()`는 행마다 `userRepository.findByTenantIdAndId()`를 상담사/내담자 각각 호출하고, `scheduleRepository.countSequenceUpToSchedule()`를 추가 호출한다. 매핑 lookup miss 시 `findByTenantIdAndId` 또는 `(consultantId, clientId)` 역산 조회가 더 붙을 수 있다. `src/main/java/com/coresolution/consultation/controller/ScheduleController.java` L2079-L2222, 특히 L2133-L2152, L2158-L2160, L2201-L2217. `src/main/java/com/coresolution/consultation/repository/ConsultantClientMappingRepository.java` L190-L203.
- 왜 데이터 증가에 따라 악화되는지
  - 스케줄 행 수를 `N`이라 두면, 현재 구조는 `N`개 전체를 읽은 뒤 컨트롤러에서 상태/날짜를 Java stream으로 다시 필터링한다.
  - 이후 각 행마다 상담사 조회 1회, 내담자 조회 1회, lifetime count 1회가 기본으로 붙어 `3N`이 생기고, 매핑 역산 fallback이 필요한 행은 추가 조회까지 발생한다.
  - 데이터가 늘수록 payload 자체가 커지고, DB round-trip 수와 직렬화 비용이 동시에 증가한다.
- 구체적 fix
  1. 통합 스케줄 프론트가 현재 가시 범위 기준 `startDate/endDate`를 항상 전달하도록 read 계약을 고정한다.
  2. `ScheduleController.getSchedulesForAdmin()`에서 현재의 Java 후필터를 제거하고 repository 레벨 날짜 범위 쿼리로 내린다.
  3. `convertToScheduleResponse()`용 사용자 정보는 `tenantId + userIds IN (...)` 배치 조회로 미리 맵을 만들고, lifetime count는 화면에 꼭 필요하면 범위/배치 집계로 대체한다.
  4. 매핑 문맥은 이미 `findActiveOrExhaustedByTenantId()`가 있으므로 lookup miss fallback 경로를 줄이도록 response builder 입력을 앞단에서 정규화한다. `ConsultantClientMappingRepository.java` L190-L193.
- rough expected impact
  - 쿼리 수: 대략 `1 + 3N~5N` 위험 구간에서 `소수의 범위 쿼리 + 배치 조회`로 축소.
  - payload: 테넌트 전체 스케줄 수백 KB~수 MB 가능 구간에서 월/가시범위 기준 수십~수백 KB 수준으로 감소 가능.
  - CPU: 컨트롤러의 Java stream 후필터 및 행별 enrich 비용 대폭 감소.

### Finding 2. `/api/v1/admin/clients/with-mapping-info`가 전체 clients + 전체 mappings를 읽고, 각 client마다 mappings 전체를 다시 훑는 `O(C*M)` Java 처리다

- 심각도/우선순위: `P0 / High`
- 근거 파일:라인
  - 프론트는 client filter options 용도로 이 API를 초기 로드 시 1회 호출한다. `frontend/src/components/admin/mapping-management/IntegratedMatchingSchedule.js` L256-L290.
  - 서비스는 `findByRole(tenantId, CLIENT)`로 client 전체를 읽고, `findAllWithDetailsByTenantId(tenantId)`로 mapping 전체를 읽는다. `src/main/java/com/coresolution/consultation/service/impl/AdminServiceImpl.java` L2625-L2638.
  - 이후 각 client 루프 안에서 `allMappings.stream().filter(mapping -> mapping.getClient().getId().equals(user.getId()))`를 다시 수행한다. `src/main/java/com/coresolution/consultation/service/impl/AdminServiceImpl.java` L2642-L2706.
  - 컨트롤러는 결과를 그대로 `clients` 목록으로 반환한다. `src/main/java/com/coresolution/consultation/controller/AdminController.java` L460-L499.
- 왜 데이터 증가에 따라 악화되는지
  - client 수를 `C`, mapping 수를 `M`이라 두면, 현재 구현은 사실상 모든 client마다 모든 mapping을 한 번 더 본다.
  - 필터 옵션 UI는 실제로는 `id/name/phone/email` 정도만 필요하지만, 서버는 내담자별 매핑 서브리스트와 각종 집계를 전부 계산한다.
  - 고객과 매칭이 늘어날수록 응답 생성 CPU가 `O(C*M)`에 가까워지고, 옵션 로드가 첫 화면 TTI를 직접 압박한다.
- 구체적 fix
  1. 옵션 전용 read endpoint를 분리해 `active/visible clients`의 최소 필드만 반환한다.
  2. 기존 endpoint를 유지해야 한다면 repository에서 `clientId -> mapping summary`를 한 번에 group aggregate 하거나, 적어도 `allMappings`를 먼저 `clientId` 기준 map으로 전처리해 Java 중첩 탐색을 제거한다.
  3. 통합 스케줄에서 정말 활성/표시 대상 client만 필요하면 status 조건을 명시한 slim query로 축소한다.
- rough expected impact
  - CPU: `O(C*M)` 제거, `O(C + M)` 또는 집계 쿼리 기반 `O(result)`로 개선.
  - payload: 필터 옵션 응답을 현재의 내담자+매핑 복합 구조에서 최소 옵션 배열로 축소 가능.
  - 초기 화면 체감: 상단 filter chip 렌더까지의 지연 감소.

### Finding 3. 매칭 목록 `/api/v1/admin/mappings` 자체가 전체 매칭 fetch 후 다층 enrich를 수행하고, 프론트는 그 결과를 다시 대량 client-side filter/sort 한다

- 심각도/우선순위: `P1 / High`
- 근거 파일:라인
  - `loadMappings()`는 통합 스케줄 최초 마운트 시 바로 실행된다. `frontend/src/components/admin/mapping-management/IntegratedMatchingSchedule.js` L522-L559.
  - 프론트는 로드된 `mappings`를 `viewFilter`, `statusFilter`, 정렬 기준으로 메모이제이션 없이 연속 filter/sort 한다. `frontend/src/components/admin/mapping-management/IntegratedMatchingSchedule.js` L580-L613.
  - 백엔드는 `adminService.getAllMappings()`로 tenant 전체 매핑을 읽고, 이어서 점유 스케줄 key, 스케줄 존재 여부, 다음 상담일, SMS 상태, 차량번호를 추가로 조회한 뒤 매핑별 data map을 구성한다. `src/main/java/com/coresolution/consultation/controller/AdminController.java` L1041-L1173.
  - `AdminServiceImpl.getAllMappings()`는 `findAllWithDetailsByTenantId()` 전체 fetch를 사용한다. `src/main/java/com/coresolution/consultation/service/impl/AdminServiceImpl.java` L2743-L2755. `src/main/java/com/coresolution/consultation/repository/ConsultantClientMappingRepository.java` L51-L57.
  - 상태별 특화 경로 중 일부는 fetch-join/조건 query가 이미 있으나, pending/exhausted 류는 여전히 `findByTenantId().stream().filter(...)`를 사용한다. `AdminServiceImpl.java` L1868-L1894, L1936-L1946, 대비 `getActiveMappings()` L1922-L1930.
- 왜 데이터 증가에 따라 악화되는지
  - 매핑 수가 증가하면 백엔드에서 먼저 tenant 전체 매핑을 hydrate하고, 추가 enrich용 부가 조회의 입력 집합도 커진다.
  - 이어서 프론트가 같은 큰 배열을 다시 filter/sort하므로 서버/클라이언트 모두 같은 데이터량을 반복 처리한다.
  - 사용자 기준으로는 “좌측 목록만 보고 싶다”는 요구인데 실제로는 부가 필드까지 전부 계산한 큰 payload를 먼저 받는다.
- 구체적 fix
  1. `/admin/mappings`를 목적별로 분리한다. 예: sidebar list용 slim DTO, detail/peek용 expanded DTO.
  2. `status/view`는 서버 쿼리 조건으로 내려 최소한 `PENDING_PAYMENT`, `ongoing`, `remainingSessions > 0` 같은 대표 필터를 지원한다.
  3. 이미 존재하는 `findActiveMappingsWithDetailsByTenantId()`와 `findDirtyPendingPaymentMappings(Pageable)` 같은 특화 query를 목록 use case에 맞게 재사용한다. `ConsultantClientMappingRepository.java` L244-L250.
- rough expected impact
  - payload: 매칭 목록 응답 수백 건 기준 불필요 필드 제거로 크기 감소.
  - CPU: 서버 side enrich 범위 축소 + 프론트 filter/sort 비용 감소.
  - 확장성: 목록/상세 use case 분리로 캐시 전략과 페이징 전략을 독립 적용 가능.

### Finding 4. Side Peek 상담사 옵션과 consultant option 로더가 상담사 루프 기반 추가 쿼리를 유발한다

- 심각도/우선순위: `P1 / Medium-High`
- 근거 파일:라인
  - Side Peek open 때마다 `/api/v1/admin/consultants/with-stats`를 다시 호출한다. `frontend/src/components/admin/mapping-management/integrated-schedule/molecules/MappingScheduleSidePeekContent.js` L68-L93.
  - `UnifiedScheduleComponent`의 메인 consultant 목록도 `/api/v1/admin/consultants/with-vacation?date=...`를 초기 로드마다 읽는다. `frontend/src/components/schedule/UnifiedScheduleComponent.js` L403-L445, L816-L840.
  - `ConsultantStatsServiceImpl.getAllConsultantsWithStatsByTenant()`는 consultant 목록을 읽은 뒤 consultant별 `calculateCurrentClients()`와 `calculateConsultantStats()`를 호출한다. `src/main/java/com/coresolution/consultation/service/impl/ConsultantStatsServiceImpl.java` L98-L130, L135-L189.
  - `AdminServiceImpl.getAllConsultantsWithVacationInfo()`도 consultant 루프 안에서 `mappingRepository.countByConsultantIdAndStatusIn()`와 `consultantRatingService.getConsultantRatingStats()`를 호출한다. `src/main/java/com/coresolution/consultation/service/impl/AdminServiceImpl.java` L2301-L2425, 특히 L2351-L2377.
  - `AdminController`는 각각 `/consultants/with-stats`, `/consultants/with-vacation` 엔드포인트로 노출한다. `src/main/java/com/coresolution/consultation/controller/AdminController.java` L154-L208, L356-L390.
- 왜 데이터 증가에 따라 악화되는지
  - 상담사 수를 `K`라 두면, 현재 구조는 목록 1회 + consultant별 통계/카운트/평점 조회가 이어지는 형태다.
  - 테넌트의 상담사 수가 늘거나 Side Peek open 빈도가 늘수록 같은 전체 목록 계산이 반복된다.
  - 특히 Side Peek는 단일 매핑 편집용 UI인데 매번 전체 consultant stats를 다시 읽는 점이 비효율적이다.
- 구체적 fix
  1. Side Peek는 최소 옵션 endpoint 또는 부모 캐시 재사용으로 바꾼다.
  2. `with-stats`, `with-vacation` 모두 consultant별 count/rating을 batch aggregate로 묶고, 루프 내부 service 호출을 제거한다.
  3. 단기적으로는 프론트 메모리 캐시 또는 React Query/SWR 류 캐시를 붙여 mapping 전환 시 재사용한다.
- rough expected impact
  - 쿼리 수: `1 + K` 또는 그 이상에서 `1~소수` 집계 쿼리로 축소.
  - 체감: Side Peek open latency 감소, 초기 상단 consultant selector 준비 시간 감소.
  - 서버 CPU: consultant loop 내 서비스 호출 제거.

### Finding 5. session extension pending-payment read는 fetch join은 맞지만 현재 predicate에 맞는 composite index 부재 가능성이 크다

- 심각도/우선순위: `P1 / Medium`
- 근거 파일:라인
  - 통합 스케줄 초기 로드가 `/api/v1/admin/session-extensions/pending-payment`를 매번 병렬 호출한다. `frontend/src/components/admin/mapping-management/IntegratedMatchingSchedule.js` L522-L545.
  - 컨트롤러는 해당 목록을 그대로 읽는다. `src/main/java/com/coresolution/consultation/controller/SessionExtensionController.java` L249-L267.
  - 서비스는 `TenantContextHolder.getRequiredTenantId()` 후 `findPendingPaymentRequests(tenantId)`를 호출한다. `src/main/java/com/coresolution/consultation/service/impl/SessionExtensionServiceImpl.java` L262-L266.
  - repository query는 `WHERE ser.tenantId = :tenantId AND ser.status = 'PENDING' ORDER BY ser.createdAt ASC`다. `src/main/java/com/coresolution/consultation/repository/SessionExtensionRequestRepository.java` L127-L137.
  - 엔티티 `SessionExtensionRequest`에는 `@Table` indexes 선언이 없다. `src/main/java/com/coresolution/consultation/entity/SessionExtensionRequest.java` L36-L60.
  - `V60`은 schedules/users/mappings composite만 추가했고 `session_extension_requests` 대상은 없다. `src/main/resources/db/migration/V60__add_composite_indexes_for_performance.sql` L42-L82.
- 왜 데이터 증가에 따라 악화되는지
  - pending request가 누적되거나 동일 tenant 내 history가 커질수록 `tenant_id + status + created_at` 정렬/검색 비용이 상승한다.
  - 현재는 매핑 로드와 병렬이라 겉으로 티가 덜 나지만, 전체 화면 TTI에는 그대로 포함된다.
- 구체적 fix
  1. `session_extension_requests (tenant_id, status, created_at)` composite index 추가를 우선 검토한다.
  2. 화면에서 실제로 최신 일부만 필요하다면 limit/paging 도입을 함께 검토한다.
- rough expected impact
  - DB scan 범위 감소.
  - 초기 병렬 로드의 tail latency 완화.

### Finding 6. 월별 counts/missing-logs API는 상대적으로 건강하지만, missing logs의 `NOT EXISTS` 보조 경로는 composite index가 더 필요하다

- 심각도/우선순위: `P2 / Medium`
- 근거 파일:라인
  - 프론트 훅은 tenant/month 캐시 키를 사용해 같은 월 재호출을 막는다. `frontend/src/hooks/useMonthlyConsultantCounts.js` L24-L25, L77-L117. `frontend/src/hooks/useMissingConsultationLogs.js` L24-L28, L91-L137.
  - `ScheduleServiceImpl.getMonthlyConsultantCompletedCounts()`는 date range aggregate 후 active consultant batch와 missing user batch를 합친다. `src/main/java/com/coresolution/consultation/service/impl/ScheduleServiceImpl.java` L3392-L3477.
  - `ScheduleServiceImpl.getMonthlyMissingConsultationLogs()`도 range query + distinct consultant batch fetch를 사용한다. `src/main/java/com/coresolution/consultation/service/impl/ScheduleServiceImpl.java` L3603-L3786.
  - repository의 completed count query는 `tenant + status + date range` aggregate 구조다. `src/main/java/com/coresolution/consultation/repository/ScheduleRepository.java` L620-L639.
  - missing log query는 `Schedule` range predicate + `ConsultationRecord`의 `NOT EXISTS`를 사용한다. `src/main/java/com/coresolution/consultation/repository/ScheduleRepository.java` L672-L790.
  - `ConsultationRecord` 엔티티는 단일 컬럼 인덱스만 있고, `tenant_id + consultation_id` 또는 `tenant_id + consultant_id + client_id + session_date` 수준의 복합 인덱스가 없다. `src/main/java/com/coresolution/consultation/entity/ConsultationRecord.java` L24-L30. `V60`에도 현재 predicate와 정확히 맞는 composite 추가가 없다. `V60__add_composite_indexes_for_performance.sql` L60-L82.
- 왜 데이터 증가에 따라 악화되는지
  - 이 경로는 전체 fetch 후 Java 재가공보다 훨씬 낫지만, `NOT EXISTS` 서브쿼리가 커지는 상담일지 테이블에서 보조 인덱스가 부족하면 월말/누적 데이터에서 급격히 느려질 수 있다.
  - 특히 레거시 호환 분기 `consultantId + clientId + sessionDate`는 단일 컬럼 인덱스 조합만으로는 최적화가 제한된다.
- 구체적 fix
  1. `consultation_records (tenant_id, consultation_id, is_deleted)` 혹은 최소 `tenant_id, consultation_id` composite 추가.
  2. 레거시 호환 분기를 유지해야 한다면 `consultation_records (tenant_id, consultant_id, client_id, session_date, is_deleted)` 검토.
  3. 이 API들은 현재 구조를 크게 흔들지 말고 인덱스와 실행계획 점검 위주로 접근한다.
- rough expected impact
  - 현재의 건강한 구조를 유지한 채 월말/대규모 tenant에서 tail latency 억제.
  - 쿼리 수 변화보다 단일 쿼리 실행시간 안정화 효과가 큼.

### Finding 7. Side Peek write 응답의 entity return은 현재 읽기 감사 범위 밖이지만 lazy proxy 증상과 결합될 수 있어 read 캐시 설계 시 주의가 필요하다

- 심각도/우선순위: `P3 / Design note`
- 근거 파일:라인
  - Side Peek 저장은 `PUT /api/v1/admin/mappings/{id}`를 직접 호출한다. `frontend/src/components/admin/mapping-management/integrated-schedule/molecules/MappingScheduleSidePeekContent.js` L111-L128.
  - 컨트롤러는 `ConsultantClientMapping` entity를 그대로 반환한다. `src/main/java/com/coresolution/consultation/controller/AdminController.java` L2146-L2157.
  - 서비스는 `savedMapping.getConsultant()/getClient()`만 initialize한 후 entity를 반환한다. `src/main/java/com/coresolution/consultation/service/impl/AdminServiceImpl.java` L3164-L3267.
  - `User.userSocialAccounts`는 LAZY `OneToMany`다. `src/main/java/com/coresolution/consultation/entity/User.java` L313-L317.
- 왜 데이터 증가에 따라 악화되는지
  - 이 항목은 주 성능 병목이라기보다 응답 직렬화 경계가 엔티티에 남아 있을 때 lazy 연쇄 접근이 우발적으로 발생할 수 있다는 주의사항이다.
  - Side Peek 읽기 캐시나 옵션 재사용을 설계할 때 write 응답까지 같은 DTO 계층으로 정리하지 않으면 예외/직렬화 비용 변동이 생길 수 있다.
- 구체적 fix
  - write 응답도 entity return 대신 화면에 필요한 DTO로 제한한다.
- rough expected impact
  - 직접적인 초기 로드 개선보다 예외/직렬화 tail risk 감소.

---

## 5) safe to do now, low risk

1. 통합 스케줄 프론트가 `/api/v1/schedules/admin` 호출 시 현재 월 또는 가시 범위의 `startDate/endDate`를 항상 보내도록 바꾼다. 백엔드 엔드포인트는 이미 파라미터를 지원한다. `ScheduleController.java` L1445-L1550.
2. `_t` cache-buster를 제거하거나, 최소한 범위/필터 키가 바뀔 때만 부여한다. 현재는 같은 조회도 항상 재다운로드한다. `UnifiedScheduleComponent.js` L493-L495.
3. Side Peek의 `/consultants/with-stats`를 화면 세션 메모리 캐시로 재사용한다. API 계약을 바꾸지 않고도 즉시 적용 가능한 저위험 개선이다. `MappingScheduleSidePeekContent.js` L68-L93.
4. `session_extension_requests (tenant_id, status, created_at)` composite index를 추가한다. 읽기 계약 변경 없이 DB 레벨 개선이다. `SessionExtensionRequestRepository.java` L127-L137, `SessionExtensionRequest.java` L36-L60.
5. `consultation_records`에 missing logs predicate용 composite index를 추가한다. counts/missing-logs API 구조는 이미 비교적 건강하므로 인덱스 보강이 안전하다. `ScheduleRepository.java` L672-L790, `ConsultationRecord.java` L24-L30.
6. `/clients/with-mapping-info` 내부에서라도 `allMappings`를 `clientId`별 map으로 한 번만 그룹핑해 중첩 탐색을 제거한다. 외부 계약을 유지하면서 서버 CPU를 낮출 수 있다. `AdminServiceImpl.java` L2637-L2706.

---

## 6) needs design decision

1. 통합 스케줄 캘린더의 서버 계약을 “월/가시범위 기반 read”로 고정할지, 아니면 “전체 로드 후 클라이언트 탐색”을 유지할지 결정이 필요하다. 현재 병목의 중심이다. `UnifiedScheduleComponent.js` L477-L499, `ScheduleController.java` L1445-L1550.
2. `/api/v1/admin/mappings`를 sidebar slim DTO와 detail/peek DTO로 분리할지 결정이 필요하다. 현재는 목록과 상세의 관심사가 한 응답에 섞여 있다. `AdminController.java` L1041-L1173.
3. `/clients/with-mapping-info`를 옵션 전용 endpoint로 대체할지, 기존 종합 endpoint를 재설계할지 결정이 필요하다. 필터 옵션만 필요한 화면과 통합 내담자 조회 용도가 충돌하고 있다. `IntegratedMatchingSchedule.js` L256-L290, `AdminController.java` L460-L499.
4. 상담사 옵션/통계 로더를 “stats 포함 전체 목록”으로 유지할지, “옵션용 최소 목록 + 필요 시 상세 통계”로 분리할지 결정이 필요하다. Side Peek와 메인 캘린더의 요구가 다르다. `MappingScheduleSidePeekContent.js` L68-L93, `AdminController.java` L154-L208, L356-L390.
5. `convertToScheduleResponse()`가 책임지는 enrichment 범위를 어디까지 둘지 결정이 필요하다. 현재는 표시명, 연락처, 차량번호, 매핑 문맥, lifetime count가 한 메서드에 몰려 있어 read path 확장이 어렵다. `ScheduleController.java` L2079-L2222.

---

## 7) endpoint inventory 표 (controller -> service -> repository -> 반환)

| 엔드포인트 | Controller | Service | Repository / Query | 반환/특징 |
|---|---|---|---|---|
| `GET /api/v1/admin/mappings` | `AdminController.getAllMappings()` `L1010-L1180` | `AdminServiceImpl.getAllMappings()` `L2743-L2755` + controller enrich `L1041-L1173` | `ConsultantClientMappingRepository.findAllWithDetailsByTenantId()` `L51-L57`; 추가로 schedule/client 조회 다수 | `mappings[]` 전체 목록 + 점유/다음상담/SMS/차량번호 enrich |
| `GET /api/v1/admin/session-extensions/pending-payment` | `SessionExtensionController.getPendingPaymentRequests()` `L260-L267` | `SessionExtensionServiceImpl.getPendingPaymentRequests()` `L262-L266` | `SessionExtensionRequestRepository.findPendingPaymentRequests()` `L127-L137` | `requests[]`, fetch join 있음 |
| `GET /api/v1/admin/clients/with-mapping-info` | `AdminController.getAllClientsWithMappingInfo()` `L460-L499` | `AdminServiceImpl.getAllClientsWithMappingInfo()` `L2625-L2738` | `userRepository.findByRole(...)` + `findAllWithDetailsByTenantId()` `L51-L57` | `clients[]` + client별 mappings/집계 |
| `GET /api/v1/schedules/monthly-consultant-counts` | `ScheduleController.getMonthlyConsultantCompletedCounts()` `L156-L165` | `ScheduleServiceImpl.getMonthlyConsultantCompletedCounts()` `L3392-L3477` | `ScheduleRepository.countCompletedSchedulesByConsultantInDateRange()` `L620-L639` + `userRepository.findByTenantIdAndIdIn...` batch | `counts[]`, 상대적으로 건강 |
| `GET /api/v1/schedules/monthly-missing-consultation-logs` | `ScheduleController.getMonthlyMissingConsultationLogs()` `L215-L224` | `ScheduleServiceImpl.getMonthlyMissingConsultationLogs()` `L3603-L3786` | `ScheduleRepository.findMissingConsultationLogScheduleRowsInDateRange()` `L672-L743` + 사용자 batch fetch | `items[]`, range + batch 패턴 |
| `GET /api/v1/schedules/admin` | `ScheduleController.getSchedulesForAdmin()` `L1445-L1550` | `ScheduleServiceImpl.findAll()` `L573-L576` 또는 `findByConsultantId()` `L1318-L1323` | `ScheduleRepository.findByTenantId()` `L451-L456` 또는 consultant 전체 조회; controller에서 stream 후필터 | `schedules[]`; 현재 최대 병목 후보 |
| `GET /api/v1/admin/consultants/with-vacation?date=...` | `AdminController.getAllConsultantsWithVacationInfo()` `L356-L390` | `AdminServiceImpl.getAllConsultantsWithVacationInfo()` `L2301-L2425` | consultant 목록 + 루프 내 매핑 count/rating 호출 | `consultants[]`; loop 비용 큼 |
| `GET /api/v1/admin/consultants/with-stats` | `AdminController.getAllConsultantsWithStats()` `L154-L208` | `ConsultantStatsServiceImpl.getAllConsultantsWithStatsByTenant()` `L98-L130` | consultant 목록 + consultant별 `calculateCurrentClients/calculateConsultantStats` | `consultants[]`; Side Peek에서 반복 호출 |
| `GET /api/v1/common-codes?codeGroup=SCHEDULE_STATUS` | `CommonCodeController.findAll(codeGroup)` `L250-L290` | `CommonCodeServiceImpl.findAll(codeGroup)` `L870-L888` → `getCodesByGroupWithCurrentTenant(codeGroup)` `L610-L620` | `CommonCodeRepository.countByTenantIdAndCodeGroupAndIsDeletedFalse()` `L220-L240` 후 `findTenantCodesByGroup()` `L180-L190` 또는 `findCodesByGroupWithFallback()` `L270-L280` / `findCoreCodesByGroup()` `L140-L150` | `CommonCodeListResponse` (`codes[]`, `totalCount`, `activeCount`, `inactiveCount`) |

---

## 8) 인덱스 필요 vs 실제 존재 비교 표

| 대상 테이블 | 현재 주요 predicate / 정렬 | 필요 인덱스(권장) | 실제 존재 근거 | 판정 |
|---|---|---|---|---|
| `schedules` | `tenant_id + status + date range` (`monthly counts`, `missing logs`) | `(tenant_id, status, date)` | V60에 `idx_schedules_tenant_status_date` 존재. `V60__add_composite_indexes_for_performance.sql` L42-L47 | 대체로 충족 |
| `schedules` | `tenant_id + consultant_id + date` | `(tenant_id, consultant_id, date)` | V60에 `idx_schedules_tenant_consultant_date` 존재. `V60...sql` L42-L47 | 충족 |
| `schedules` | `tenant_id + mapping_id` | `(tenant_id, mapping_id)` | 엔티티 annotation 존재. `Schedule.java` L25-L30 | 부분 충족 |
| `schedules` | tenant-wide full fetch (`findByTenantId`) | 인덱스보다 범위 축소가 우선 | `findByTenantId` 자체가 전체 조회. `ScheduleRepository.java` L451-L456 | 구조 문제 |
| `consultant_client_mappings` | `tenant_id + status` | `(tenant_id, status)` | V60에 `idx_mapping_tenant_status` 존재. `V60...sql` L78-L82 | 충족 |
| `consultant_client_mappings` | `tenant_id + consultant_id + status` | `(tenant_id, consultant_id, status)` | V60에 존재. `V60...sql` L78-L82 | 충족 |
| `consultant_client_mappings` | `tenant_id + client_id + status` | `(tenant_id, client_id, status)` | V60에 존재. `V60...sql` L78-L82 | 충족 |
| `consultant_client_mappings` | `tenant_id + consultant_id + client_id + created_at DESC` (매핑 역산/최신 선택) | `(tenant_id, consultant_id, client_id, created_at)` | 엔티티는 단일 컬럼 위주, V60에도 없음. `ConsultantClientMapping.java` L31-L38, `ConsultantClientMappingRepository.java` L198-L203 | 부족 |
| `session_extension_requests` | `tenant_id + status + created_at ASC` | `(tenant_id, status, created_at)` | 엔티티 index 없음, V60 추가 없음. `SessionExtensionRequest.java` L36-L60, `V60...sql` L42-L82 | 부족 |
| `consultation_records` | `tenant_id + consultation_id + is_deleted` | `(tenant_id, consultation_id, is_deleted)` | 엔티티는 `consultation_id` 단일만 존재, V60는 created_at 계열만 추가. `ConsultationRecord.java` L24-L30, `V60...sql` L60-L63 | 부족 |
| `consultation_records` | `tenant_id + consultant_id + client_id + session_date + is_deleted` | 해당 composite | 엔티티 단일 컬럼만, V60에도 부재. `ConsultationRecord.java` L24-L30, `ScheduleRepository.java` L720-L733, `L772-L785` | 부족 |
| `users` | `tenant_id + role` / `tenant_id + role + active` | 이미 존재 | V60에 `idx_users_tenant_role`, `idx_users_tenant_role_active` 존재. `V60...sql` L68-L71 | 충족 |

---

## 부록 A. 페이지 차원의 핵심 관찰 메모

- `IntegratedMatchingSchedule`는 최초 로드에서 매칭 목록, pending payment 회기추가 요청, 내담자 필터 옵션, 월별 상담사 배지, 월별 누락 일지, 캘린더 전체 일정을 짧은 시간 안에 거의 동시에 준비한다. `IntegratedMatchingSchedule.js` L230-L234, L256-L290, L522-L559, L1142-L1160. `UnifiedScheduleComponent.js` L816-L840.
- 이 중 월별 counts/missing-logs는 캐시/범위 쿼리 덕분에 상대적으로 안전하다. 반대로 `/admin/mappings`, `/clients/with-mapping-info`, `/schedules/admin`, `/consultants/with-stats`, `/consultants/with-vacation`은 전체 목록 성격과 loop enrich가 겹쳐 데이터 증가에 민감하다.
- 따라서 우선순위는 “건강한 월별 훅 손보기”가 아니라 “전체 fetch 후 후처리하는 read path 축소”에 두는 것이 맞다.

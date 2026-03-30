# 코어 디버거 분석 결과

## 1. 원인 정리

### 한 줄 원인

`ScheduleRepository.countByStatusAndDateBetween`의 JPQL에서 `s.status = :status`로 **엔티티의 enum 필드(ScheduleStatus)**와 비교하는데, 메서드 시그니처는 **String**을 받고 있어, JPA가 바인딩 시점에 String을 ScheduleStatus로 변환하지 못해 `InvalidDataAccessApiUsageException`이 발생함.

### 영향 받는 메서드·파일

| 파일 | 메서드 | 역할 |
|------|--------|------|
| `src/main/java/com/coresolution/consultation/repository/ScheduleRepository.java` | `countByStatusAndDateBetween(tenantId, status, startDate, endDate)` | JPQL에서 `s.status = :status` 사용, 파라미터 타입만 String |
| `src/main/java/com/coresolution/consultation/service/impl/AdminServiceImpl.java` | `getConsultationMonthlyTrend` (4432행 근처) | 위 Repository를 `ScheduleStatus.BOOKED.name()`, `CONFIRMED.name()`으로 호출 |
| `src/main/java/com/coresolution/consultation/service/impl/AdminServiceImpl.java` | `getConsultationWeeklyTrend` (4468행 근처) | 동일 호출 |
| `src/main/java/com/coresolution/consultation/service/impl/AdminServiceImpl.java` | `getCompletionRateForMonth` (4499행 근처) | `ScheduleStatus.COMPLETED.name()`으로 호출 |

- **엔드포인트**: `GET /api/v1/admin/statistics/consultation-completion`
- **결과**: 예외 → catch에서 빈 `ArrayList` 반환 → 프론트 `monthlyData`/`weeklyData` 빈 배열 → 차트 "기간 내 데이터가 없습니다" 표시

---

## 2. 수정 제안 (core-coder용)

### 권장 방향

- **Repository 시그니처를 `ScheduleStatus`로 통일**하고, **호출하는 쪽에서는 `ScheduleStatus.BOOKED.name()` 대신 `ScheduleStatus.BOOKED`(enum)를 넘기도록 변경**하는 것을 권장합니다.
- 이유: `Schedule.status`가 이미 `ScheduleStatus` 타입이므로 JPQL 바인딩 타입과 일치시키는 것이 타입 안전하고, 동일 Repository의 `countByStatusAndDateBetweenAndConsultantId` 등도 이미 `ScheduleStatus`를 사용하고 있어 일관성 있음.

### 수정 대상 파일·메서드 목록

1. **ScheduleRepository.java**
   - `countByStatusAndDateBetween(String tenantId, String status, ...)`  
     → `countByStatusAndDateBetween(String tenantId, ScheduleStatus status, ...)` 로 변경.
   - (선택) `countByStatusAndDateBetweenDeprecated(String status, ...)`  
     → 동일하게 `ScheduleStatus status`로 변경. 사용처가 있다면 호출부도 enum으로 수정.

2. **AdminServiceImpl.java**
   - `getConsultationMonthlyTrend`  
     - `countByStatusAndDateBetween(tenantId, ScheduleStatus.BOOKED.name(), ...)`  
       → `countByStatusAndDateBetween(tenantId, ScheduleStatus.BOOKED, ...)`
     - `countByStatusAndDateBetween(tenantId, ScheduleStatus.CONFIRMED.name(), ...)`  
       → `countByStatusAndDateBetween(tenantId, ScheduleStatus.CONFIRMED, ...)`
   - `getConsultationWeeklyTrend`  
     - 위와 동일하게 `BOOKED.name()`/`CONFIRMED.name()` → `ScheduleStatus.BOOKED` / `ScheduleStatus.CONFIRMED`
   - `getCompletionRateForMonth`  
     - `countByStatusAndDateBetween(tenantId, ScheduleStatus.COMPLETED.name(), ...)`  
       → `countByStatusAndDateBetween(tenantId, ScheduleStatus.COMPLETED, ...)`

3. **ScheduleServiceImpl.java** (동일 Repository 메서드를 사용하는 모든 호출)
   - `countByStatusAndDateBetween(tenantId, ScheduleStatus.BOOKED.name(), ...)` 등  
     → `ScheduleStatus.BOOKED.name()` → `ScheduleStatus.BOOKED` 로 변경.
   - 해당 메서드가 사용되는 라인: 928, 930, 932, 1016, 1024, 1033, 1035 등 (문서 상으로는 `.name()` 사용처 전부).

**주의**: `countByStatusAndDateGreaterThanEqual`, `countByStatusAndDateLessThanEqual`, `countByStatus` 등도 JPQL에서 `s.status = :status`를 쓰면 동일 이슈가 있을 수 있으므로, 같은 방식으로 **파라미터를 `ScheduleStatus`로 바꾸고 호출부에서 enum 전달**하도록 정리하는 것을 권장합니다.

---

## 3. 체크리스트 (배포 후 검증)

- [ ] `GET /api/v1/admin/statistics/consultation-completion` 호출 시 **HTTP 200** 응답 확인.
- [ ] 응답 JSON에서 `monthlyData` / `weeklyData` 배열 길이 **> 0** (데이터 존재 시) 확인.
- [ ] 관리자 대시보드(또는 해당 차트 화면)에서 **상담 완료/예약 추이 차트**가 "기간 내 데이터가 없습니다"가 아닌 **실제 차트**로 표시되는지 확인.
- [ ] (선택) `ScheduleServiceImpl`에서 동일 Repository를 쓰는 다른 통계/조회 경로가 있다면, 해당 화면·API도 한 번씩 호출해 예외 없이 동작하는지 확인.

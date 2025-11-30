# TenantId 필터링 감사 보고서

**작성일:** 2025-11-30
**작성자:** AI Assistant
**목적:** 모든 Repository 쿼리에서 tenantId 필터링 누락 확인 및 수정 계획

## 🚨 심각도 분류

### 🔴 Critical (즉시 수정 필요)
- 다른 테넌트의 민감한 데이터 노출 가능
- 결제, 개인정보, 상담 내역 등

### 🟡 High (우선 수정 필요)
- 비즈니스 로직에 영향
- 통계, 대시보드 데이터 왜곡

### 🟢 Medium (점진적 수정)
- 기능 동작에는 문제 없으나 데이터 정확성 필요

---

## 📋 ConsultantClientMappingRepository

### 🔴 Critical - 즉시 수정 필요

#### 1. Line 30-31: `countActiveMappingsByConsultant`
```java
@Query("SELECT COUNT(m) FROM ConsultantClientMapping m WHERE m.consultant = :consultant AND m.status = 'ACTIVE'")
long countActiveMappingsByConsultant(@Param("consultant") User consultant);
```
**문제:** consultant 객체로 조회하지만 tenantId 필터링 없음
**영향:** 다른 테넌트의 같은 consultant_id를 가진 매칭도 카운트될 수 있음
**수정안:**
```java
@Query("SELECT COUNT(m) FROM ConsultantClientMapping m WHERE m.tenantId = :tenantId AND m.consultant = :consultant AND m.status = 'ACTIVE'")
long countActiveMappingsByConsultant(@Param("tenantId") String tenantId, @Param("consultant") User consultant);
```

#### 2. Line 34-35: `countActiveMappingsByClient`
```java
@Query("SELECT COUNT(m) FROM ConsultantClientMapping m WHERE m.client = :client AND m.status = 'ACTIVE'")
long countActiveMappingsByClient(@Param("client") User client);
```
**문제:** 동일
**수정안:** tenantId 파라미터 추가

#### 3. Line 38-40: `findByDateRange`
```java
@Query("SELECT m FROM ConsultantClientMapping m WHERE m.startDate >= :startDate AND m.endDate <= :endDate")
List<ConsultantClientMapping> findByDateRange(@Param("startDate") java.time.LocalDate startDate, @Param("endDate") java.time.LocalDate endDate);
```
**문제:** 모든 테넌트의 날짜 범위 매칭 조회
**영향:** 🚨 심각 - 다른 테넌트의 상담 일정 노출
**수정안:**
```java
@Query("SELECT m FROM ConsultantClientMapping m WHERE m.tenantId = :tenantId AND m.startDate >= :startDate AND m.endDate <= :endDate")
List<ConsultantClientMapping> findByDateRange(@Param("tenantId") String tenantId, @Param("startDate") java.time.LocalDate startDate, @Param("endDate") java.time.LocalDate endDate);
```

#### 4. Line 61-62: `findByConsultantIdAndStatusNot`
```java
@Query("SELECT m FROM ConsultantClientMapping m LEFT JOIN FETCH m.consultant LEFT JOIN FETCH m.client WHERE m.consultant.id = :consultantId AND m.status != :status")
List<ConsultantClientMapping> findByConsultantIdAndStatusNot(@Param("consultantId") Long consultantId, @Param("status") ConsultantClientMapping.MappingStatus status);
```
**문제:** consultantId만으로 조회, tenantId 없음
**영향:** 🚨 심각 - 다른 테넌트의 같은 ID 상담사 매칭 노출
**수정안:** tenantId 파라미터 추가

#### 5. Line 65-66: `findByConsultantIdAndBranchCodeAndStatusNot`
**문제:** 동일
**수정안:** tenantId 파라미터 추가

#### 6. Line 69-70: `findByClientIdAndStatusNot`
**문제:** 동일
**수정안:** tenantId 파라미터 추가

#### 7. Line 73-74: `findByConsultantIdAndStatusNotString`
**문제:** 동일
**수정안:** tenantId 파라미터 추가

#### 8. Line 77-78: `findByConsultantIdAndStatus`
**문제:** 동일
**수정안:** tenantId 파라미터 추가

#### 9. Line 81-82: `findByConsultantId`
```java
@Query("SELECT m FROM ConsultantClientMapping m WHERE m.consultant.id = :consultantId")
List<ConsultantClientMapping> findByConsultantId(@Param("consultantId") Long consultantId);
```
**문제:** 🚨 매우 심각 - 모든 테넌트의 consultantId 매칭 조회
**수정안:** tenantId 파라미터 추가

#### 10. Line 103-104: `countByConsultantIdAndStatusIn`
**문제:** 동일
**수정안:** tenantId 파라미터 추가

#### 11. Line 111-112: `countByStatusIn`
```java
@Query("SELECT COUNT(m) FROM ConsultantClientMapping m WHERE m.status IN :statuses")
long countByStatusIn(@Param("statuses") List<String> statuses);
```
**문제:** 🚨 매우 심각 - 모든 테넌트의 통계 집계
**영향:** 대시보드 통계 데이터 왜곡
**수정안:** tenantId 파라미터 추가

#### 12. Line 117-118: `findRecentMappings`
```java
@Query("SELECT CONCAT(m.consultant.name, ' - ', m.client.name), m.createdAt FROM ConsultantClientMapping m ORDER BY m.createdAt DESC")
List<Object[]> findRecentMappings(int limit);
```
**문제:** 🚨 매우 심각 - 모든 테넌트의 최근 매칭 노출
**영향:** 개인정보 노출
**수정안:** tenantId 파라미터 추가 + LIMIT 처리

### 🟢 Medium - JPA 메서드 (Spring Data JPA가 자동 생성)

#### Line 15-24: JPA 메서드들
```java
List<ConsultantClientMapping> findByConsultant(User consultant);
List<ConsultantClientMapping> findByClient(User client);
List<ConsultantClientMapping> findByStatus(ConsultantClientMapping.MappingStatus status);
List<ConsultantClientMapping> findByConsultantAndClient(User consultant, User client);
boolean existsByConsultantAndClientAndStatus(User consultant, User client, ConsultantClientMapping.MappingStatus status);
```
**문제:** User 객체 자체에 tenantId가 있으므로 간접적으로 필터링됨
**우선순위:** Medium (User 객체가 이미 tenantId로 필터링된 경우)
**권장사항:** 명시적으로 tenantId 파라미터 추가하는 것이 안전

---

## 📊 수정 우선순위

### Phase 1: 즉시 수정 (Critical)
1. `findByDateRange` - 날짜 범위 조회
2. `findByConsultantId` - 상담사 ID 조회
3. `countByStatusIn` - 상태별 통계
4. `findRecentMappings` - 최근 매칭 조회

### Phase 2: 우선 수정 (High)
5. `countActiveMappingsByConsultant` - 활성 매칭 수
6. `countActiveMappingsByClient` - 활성 매칭 수
7. `findByConsultantIdAndStatusNot` - 상담사별 매칭
8. `findByClientIdAndStatusNot` - 내담자별 매칭
9. `findByConsultantIdAndStatus` - 상담사별 상태 매칭
10. `countByConsultantIdAndStatusIn` - 상담사별 통계

### Phase 3: 점진적 수정 (Medium)
11. `findByConsultantIdAndBranchCodeAndStatusNot` - 지점별 매칭
12. `findByConsultantIdAndStatusNotString` - 문자열 상태 매칭

---

## 🔍 다음 확인 필요 Repository

1. **ScheduleRepository** - 스케줄 조회 쿼리
2. **ConsultantRepository** - 상담사 조회 쿼리
3. **ClientRepository** - 내담자 조회 쿼리
4. **UserRepository** - 사용자 조회 쿼리
5. **ConsultationRecordRepository** - 상담 기록 조회
6. **FinancialTransactionRepository** - 재무 거래 조회

---

## 📝 수정 가이드라인

### 1. @Query 수정 패턴
```java
// Before
@Query("SELECT m FROM Entity m WHERE m.field = :value")
List<Entity> findByField(@Param("value") Type value);

// After
@Query("SELECT m FROM Entity m WHERE m.tenantId = :tenantId AND m.field = :value")
List<Entity> findByField(@Param("tenantId") String tenantId, @Param("value") Type value);
```

### 2. Service Layer 수정
```java
// Before
List<Mapping> mappings = repository.findByConsultantId(consultantId);

// After
String tenantId = accessControlService.getCurrentTenantId().toString();
List<Mapping> mappings = repository.findByConsultantId(tenantId, consultantId);
```

### 3. 테스트 필수
- 각 수정 후 해당 기능 테스트
- 다른 테넌트 데이터 격리 확인
- 성능 영향 모니터링

---

## ⚠️ 주의사항

1. **User 객체 기반 조회**
   - User 객체 자체가 tenantId를 포함하므로 일부 간접 필터링됨
   - 하지만 명시적 tenantId 필터링이 더 안전

2. **JPA 메서드 네이밍**
   - `findByTenantIdAndField` 패턴 사용
   - Spring Data JPA가 자동으로 쿼리 생성

3. **성능 고려**
   - tenantId에 인덱스 필수
   - 복합 인덱스 검토 (tenantId + 자주 조회되는 필드)

4. **하위 호환성**
   - 기존 메서드는 @Deprecated 처리
   - 새 메서드 추가 후 점진적 마이그레이션

---

## 🎯 오늘의 목표

1. ✅ ConsultantClientMappingRepository 감사 완료
2. ⏳ ScheduleRepository 감사 진행 중
3. ⏳ 나머지 Repository 감사
4. ⏳ Phase 1 수정 완료
5. ⏳ 개발 서버 배포 및 테스트



# TenantId 필터링 체크리스트 및 테스트 방안

**작성일:** 2025-11-30  
**목적:** tenantId 필터링 누락 확인 및 수정, 테스트 방안 수립  
**우선순위:** 🔴 Critical - 보안 이슈

---

## 📋 전체 현황

### 통계
- **전체 Repository**: 61개
- **tenantId 필터링 없는 @Query**: 509개
- **수정 완료**: 12개 (ConsultantClientMappingRepository)
- **남은 작업**: 497개

---

## 🎯 Phase 1: 핵심 Repository 우선 수정 (Critical)

### 1. ConsultantClientMappingRepository ✅
**상태:** ✅ 완료 (2025-11-30)  
**수정 개수:** 12개 쿼리  
**영향도:** ⭐⭐⭐⭐⭐ (매우 높음 - 상담사-내담자 매칭 정보)  
**컴파일:** ✅ 성공

#### 수정된 메서드
- [x] `findByDateRange` - 날짜 범위 조회
- [x] `findByConsultantId` - 상담사 ID 조회
- [x] `countByStatusIn` - 상태별 통계
- [x] `findRecentMappings` - 최근 매칭 조회
- [x] `countActiveMappingsByConsultant` - 활성 매칭 수
- [x] `countActiveMappingsByClient` - 활성 매칭 수
- [x] `findByConsultantIdAndStatusNot` - 상담사별 매칭
- [x] `findByClientIdAndStatusNot` - 내담자별 매칭
- [x] `findByConsultantIdAndStatus` - 상담사별 상태 매칭
- [x] `countByConsultantIdAndStatusIn` - 상담사별 통계
- [x] `findByConsultantIdAndBranchCodeAndStatusNot` - 지점별 매칭
- [x] `findByConsultantIdAndStatusNotString` - 문자열 상태 매칭

#### Service Layer 수정
- [x] AdminServiceImpl - 7개 호출
- [x] ConsultantServiceImpl - 3개 호출
- [x] ClientStatsServiceImpl - 1개 호출
- [x] ConsultantStatsServiceImpl - 2개 호출
- [x] SessionSyncServiceImpl - 1개 호출

---

### 2. ScheduleRepository ⏳
**상태:** 부분 완료 (일부 메서드는 이미 tenantId 필터링 있음)  
**전체 쿼리:** 35개  
**tenantId 필터링 있음:** 9개  
**수정 필요:** 26개  
**영향도:** ⭐⭐⭐⭐⭐ (매우 높음 - 상담 일정)

#### 이미 tenantId 필터링이 있는 메서드 ✅
- [x] `findByTenantIdAndConsultantId`
- [x] `findByTenantIdAndConsultantIdAndDate`
- [x] `findByTenantIdAndDateAndIsDeletedFalse`
- [x] `findByTenantIdAndDateAndConsultantIdAndIsDeletedFalse`
- [x] `countByTenantIdAndDate`
- [x] `countByTenantIdAndDateAndStatus`
- [x] `findAllByTenantIdAndBranchId` (페이징 포함)

#### @Deprecated 처리된 메서드 (사용 금지) ✅
- [x] `findByConsultantId` (Long만)
- [x] `findByConsultantIdAndDate` (Long, LocalDate)
- [x] `findByDateAndIsDeletedFalse` (LocalDate만)
- [x] `findByDateAndConsultantIdAndIsDeletedFalse`

#### 수정 필요한 JPA 메서드 (26개)
- [ ] `findByConsultantIdAndDateBetween` - 날짜 범위
- [ ] `findByConsultantIdAndDateAfter` - 특정 날짜 이후
- [ ] `findByDateAndBranchCode` - 지점별
- [ ] `findByConsultantIdAndDateGreaterThanEqual` - 날짜 이상
- [ ] `findByConsultantIdAndIsDeletedFalse` - 활성 스케줄
- [ ] `findByDateAndStatusIn` - 날짜+상태 목록
- [ ] `findByClientId` - 내담자별 (2개: List, Page)
- [ ] `findByClientIdAndDate` - 내담자+날짜
- [ ] `findByClientIdAndDateBetween` - 내담자+날짜 범위
- [ ] `findByClientIdAndDateGreaterThanEqual` - 내담자+날짜 이상
- [ ] `findByConsultantIdAndClientIdAndDateGreaterThanEqual` - 상담사+내담자+날짜
- [ ] `findOverlappingSchedules` - 시간 충돌 검사 (2개)
- [ ] `findByStatus` - 상태별
- [ ] `findByConsultantIdAndStatus` - 상담사+상태
- [ ] `findByConsultantIdAndStatusAndDateBetween` - 상담사+상태+날짜 범위
- [ ] `findByClientIdAndStatus` - 내담자+상태 (2개: String, Enum)
- [ ] `findByDate` - 날짜별
- [ ] `findByDateBetween` - 날짜 범위
- [ ] `findByScheduleType` - 스케줄 타입별
- [ ] `findByConsultantIdAndScheduleType` - 상담사+타입
- [ ] `countByConsultantId` - 상담사별 개수
- [ ] `countByClientId` - 내담자별 개수
- [ ] `countByConsultantIdAndDate` - 상담사+날짜 개수
- [ ] `countSchedulesByConsultant` - 상담사별 통계
- [ ] `countSchedulesByDateBetween` - 날짜 범위 통계
- [ ] `countSchedulesByStatus` - 상태별 통계
- [ ] `findExpiredConfirmedSchedules` - 만료된 스케줄
- [ ] `findByDateBeforeAndStatus` - 날짜 이전+상태
- [ ] `countByDateAndStatus` - 날짜+상태 개수
- [ ] `countByDate` - 날짜별 개수
- [ ] `countByStatus` - 상태별 개수
- [ ] `countByDateBetween` - 날짜 범위 개수
- [ ] `countByDateGreaterThanEqual` - 날짜 이상 개수
- [ ] `countByDateLessThanEqual` - 날짜 이하 개수
- [ ] `countByStatusAndDateBetween` - 상태+날짜 범위 개수
- [ ] `countByStatusAndDateGreaterThanEqual` - 상태+날짜 이상 개수
- [ ] `countByStatusAndDateLessThanEqual` - 상태+날짜 이하 개수
- [ ] `findByConsultationId` - 상담 ID별
- [ ] `countDistinctClientsByDateBetween` - 고유 내담자 수
- [ ] `countDistinctConsultantsByDateBetween` - 고유 상담사 수
- [ ] `countByDateAndConsultantId` - 날짜+상담사 개수
- [ ] `countByDateAndStatusAndConsultantId` - 날짜+상태+상담사 개수
- [ ] `countByCreatedAtAfter` - 생성일 이후 개수
- [ ] `countByCreatedAtBefore` - 생성일 이전 개수
- [ ] `countByCreatedAtBetween` - 생성일 범위 개수

**수정 방법:**
1. 각 메서드에 `tenantId` 파라미터 추가
2. 기존 메서드는 `@Deprecated` 처리
3. Service Layer에서 호출하는 부분 모두 수정

---

### 3. ConsultationRecordRepository ✅
**상태:** ✅ 완료 (2025-11-30)  
**전체 쿼리:** 7개  
**수정 완료:** 7개  
**영향도:** ⭐⭐⭐⭐⭐ (매우 높음 - 상담 기록, 민감 정보)  
**컴파일:** ✅ 성공

#### 수정된 메서드
- [x] `findByConsultationIdAndIsDeletedFalse` → `findByTenantIdAndConsultationIdAndIsDeletedFalse`
- [x] `findByConsultantIdAndIsDeletedFalseOrderBySessionDateDesc` → tenantId 추가
- [x] `findByClientIdAndIsDeletedFalseOrderBySessionDateDesc` → tenantId 추가
- [x] `findByConsultantIdAndClientIdAndIsDeletedFalseOrderBySessionDateDesc` → tenantId 추가
- [x] `findByConsultantIdAndSessionDateBetweenAndIsDeletedFalse` → tenantId 추가
- [x] `findExpiredRecordsForDestruction` → tenantId 추가
- [x] 모든 count, search, find 메서드에 tenantId 추가

---

### 4. FinancialTransactionRepository ✅
**상태:** ✅ 완료 (2025-11-30)  
**전체 쿼리:** 12개  
**수정 완료:** 12개  
**영향도:** ⭐⭐⭐⭐⭐ (매우 높음 - 재무 정보)  
**컴파일:** ✅ 성공

#### 수정된 메서드
- [x] `findByCategoryAndIsDeletedFalse` → tenantId 추가
- [x] `findByStatusAndIsDeletedFalse` → tenantId 추가
- [x] `findByTransactionDateBetweenAndIsDeletedFalse` → tenantId 추가
- [x] `countPendingApprovals` → tenantId 추가
- [x] `sumIncomeByDateRange` → tenantId 추가
- [x] `sumExpenseByDateRange` → tenantId 추가
- [x] `getIncomeByCategory` → tenantId 추가
- [x] `getExpenseByCategory` → tenantId 추가
- [x] `getMonthlyFinancialData` → tenantId 추가
- [x] `findRecentTransactions` → tenantId 추가
- [x] `findSalaryTransactions` → tenantId 추가
- [x] `findPurchaseTransactions` → tenantId 추가

---

### 5. UserRepository ⏳
**상태:** 확인 필요  
**영향도:** ⭐⭐⭐⭐⭐ (매우 높음 - 사용자 정보)

#### 확인 필요 사항
- [ ] 전체 쿼리 개수 확인
- [ ] tenantId 필터링 없는 쿼리 목록 작성
- [ ] 사용 중인 메서드 파악
- [ ] 수정 우선순위 결정

**예상 수정 메서드:**
- [ ] `findByUsername` - 사용자명 조회
- [ ] `findByEmail` - 이메일 조회
- [ ] `findByRole` - 역할별 조회
- [ ] `findByBranchCode` - 지점별 조회
- [ ] `countByRole` - 역할별 개수

---


## 🎯 Phase 2: 중요도 높은 Repository (High Priority)

### 6. ConsultantRepository
**영향도:** ⭐⭐⭐⭐ (높음)
- [ ] 전체 쿼리 확인
- [ ] tenantId 필터링 추가

### 7. ClientRepository
**영향도:** ⭐⭐⭐⭐ (높음)
- [ ] 전체 쿼리 확인
- [ ] tenantId 필터링 추가

### 8. BranchRepository
**영향도:** ⭐⭐⭐⭐ (높음)
- [ ] 전체 쿼리 확인
- [ ] tenantId 필터링 추가

### 9. ConsultationMessageRepository
**영향도:** ⭐⭐⭐⭐ (높음 - 메시지 내용)
- [ ] 전체 쿼리 확인
- [ ] tenantId 필터링 추가

### 10. QualityEvaluationRepository
**영향도:** ⭐⭐⭐ (중간)
- [ ] 전체 쿼리 확인
- [ ] tenantId 필터링 추가

---

## 🎯 Phase 3: 나머지 Repository (Medium Priority)

### 나머지 51개 Repository
**진행 방법:**
1. 각 Repository 쿼리 개수 확인
2. 실제 사용 빈도 파악
3. 우선순위 재조정
4. 순차적으로 수정

---

## 🧪 테스트 방안

### 1. 단위 테스트 (Unit Test)

#### 1.1 Repository 테스트
```java
@SpringBootTest
@Transactional
class ConsultantClientMappingRepositoryTest {
    
    @Autowired
    private ConsultantClientMappingRepository mappingRepository;
    
    @Test
    @DisplayName("tenantId 필터링 - 다른 테넌트 데이터 격리 확인")
    void testTenantIsolation() {
        // Given: 2개의 다른 테넌트 데이터
        String tenant1 = "tenant-001";
        String tenant2 = "tenant-002";
        
        // Tenant 1 데이터 생성
        ConsultantClientMapping mapping1 = createMapping(tenant1, 1L, 1L);
        mappingRepository.save(mapping1);
        
        // Tenant 2 데이터 생성
        ConsultantClientMapping mapping2 = createMapping(tenant2, 1L, 2L);
        mappingRepository.save(mapping2);
        
        // When: Tenant 1 데이터 조회
        List<ConsultantClientMapping> result = 
            mappingRepository.findByConsultantId(tenant1, 1L);
        
        // Then: Tenant 1 데이터만 조회되어야 함
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTenantId()).isEqualTo(tenant1);
        assertThat(result).noneMatch(m -> m.getTenantId().equals(tenant2));
    }
    
    @Test
    @DisplayName("tenantId 없이 조회 시 모든 데이터 노출 방지")
    void testPreventDataLeakage() {
        // @Deprecated 메서드는 사용 불가능해야 함
        // 컴파일 에러 또는 명시적 경고 확인
    }
}
```

#### 1.2 Service 테스트
```java
@SpringBootTest
@Transactional
class AdminServiceImplTest {
    
    @Autowired
    private AdminService adminService;
    
    @MockBean
    private TenantContext tenantContext;
    
    @Test
    @DisplayName("Service Layer tenantId 자동 주입 확인")
    void testServiceTenantIdInjection() {
        // Given: TenantContext 설정
        when(TenantContext.getTenantId()).thenReturn("tenant-001");
        
        // When: Service 메서드 호출
        List<ConsultantClientMapping> mappings = 
            adminService.getMappingsByConsultantId(1L);
        
        // Then: tenantId가 자동으로 주입되어 필터링되어야 함
        assertThat(mappings).allMatch(m -> 
            m.getTenantId().equals("tenant-001"));
    }
}
```

---

### 2. 통합 테스트 (Integration Test)

#### 2.1 API 테스트
```java
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class TenantFilteringIntegrationTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Test
    @DisplayName("API 호출 시 tenantId 필터링 확인")
    void testApiTenantFiltering() throws Exception {
        // Given: Tenant 1 사용자로 로그인
        String tenant1Token = loginAsTenant1User();
        
        // When: 매칭 목록 조회 API 호출
        mockMvc.perform(get("/api/admin/mappings")
                .header("Authorization", "Bearer " + tenant1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[*].tenantId")
                    .value(everyItem(equalTo("tenant-001"))));
    }
    
    @Test
    @DisplayName("다른 테넌트 데이터 접근 차단")
    void testCrossTenan tAccessDenied() throws Exception {
        // Given: Tenant 1 사용자로 로그인
        String tenant1Token = loginAsTenant1User();
        
        // Tenant 2의 데이터 ID
        Long tenant2MappingId = createTenant2Mapping();
        
        // When: Tenant 2 데이터 접근 시도
        mockMvc.perform(get("/api/admin/mappings/" + tenant2MappingId)
                .header("Authorization", "Bearer " + tenant1Token))
                .andExpect(status().isNotFound()); // 또는 403 Forbidden
    }
}
```

---

### 3. 수동 테스트 (Manual Test)

#### 3.1 개발 서버 테스트 시나리오

**시나리오 1: 기본 데이터 격리 확인**
1. Tenant A 계정으로 로그인
2. 상담사-내담자 매칭 목록 조회
3. 결과에 Tenant A 데이터만 표시되는지 확인
4. Tenant B 계정으로 로그인
5. 동일한 API 호출
6. 결과에 Tenant B 데이터만 표시되는지 확인

**시나리오 2: 스케줄 데이터 격리 확인**
1. Tenant A 계정으로 로그인
2. 특정 날짜의 스케줄 조회
3. Tenant A의 스케줄만 표시되는지 확인
4. Tenant B 계정으로 로그인
5. 동일한 날짜의 스케줄 조회
6. Tenant B의 스케줄만 표시되는지 확인

**시나리오 3: 통계 데이터 정확성 확인**
1. Tenant A 계정으로 로그인
2. 대시보드 통계 조회
3. 통계 수치가 Tenant A 데이터만 반영하는지 확인
4. 직접 DB 쿼리로 검증

**시나리오 4: 크로스 테넌트 접근 차단**
1. Tenant A 계정으로 로그인
2. Tenant B의 데이터 ID를 직접 URL에 입력하여 접근 시도
3. 404 또는 403 에러 반환 확인

#### 3.2 테스트 체크리스트

**로그인 및 세션**
- [ ] Tenant A로 로그인 성공
- [ ] TenantContext에 tenantId 설정 확인
- [ ] TenantContext에 businessType 설정 확인
- [ ] 세션 유지 중 tenantId 변경되지 않음 확인

**데이터 조회**
- [ ] 매칭 목록 조회 - Tenant A 데이터만
- [ ] 스케줄 목록 조회 - Tenant A 데이터만
- [ ] 상담 기록 조회 - Tenant A 데이터만
- [ ] 재무 거래 조회 - Tenant A 데이터만
- [ ] 사용자 목록 조회 - Tenant A 데이터만

**통계 및 대시보드**
- [ ] 오늘의 통계 - Tenant A 데이터 기반
- [ ] 월별 통계 - Tenant A 데이터 기반
- [ ] 상담사별 통계 - Tenant A 데이터 기반
- [ ] 재무 통계 - Tenant A 데이터 기반

**데이터 생성/수정/삭제**
- [ ] 매칭 생성 - tenantId 자동 설정
- [ ] 스케줄 생성 - tenantId 자동 설정
- [ ] 데이터 수정 - 자신의 테넌트 데이터만
- [ ] 데이터 삭제 - 자신의 테넌트 데이터만

**보안 테스트**
- [ ] 다른 테넌트 데이터 ID로 직접 접근 차단
- [ ] API 파라미터 조작 시도 차단
- [ ] SQL Injection 시도 차단
- [ ] 권한 없는 API 접근 차단

---

### 4. 성능 테스트

#### 4.1 쿼리 성능 확인
```sql
-- tenantId 인덱스 확인
SHOW INDEX FROM consultant_client_mappings WHERE Key_name LIKE '%tenant%';

-- 쿼리 실행 계획 확인
EXPLAIN SELECT * FROM consultant_client_mappings 
WHERE tenant_id = 'tenant-001' AND consultant_id = 1;

-- 쿼리 실행 시간 측정
SET profiling = 1;
SELECT * FROM consultant_client_mappings 
WHERE tenant_id = 'tenant-001' AND consultant_id = 1;
SHOW PROFILES;
```

#### 4.2 성능 기준
- 단순 조회: < 100ms
- 복잡한 조회: < 500ms
- 통계 쿼리: < 1000ms
- 페이지네이션: < 200ms

---

### 5. 데이터베이스 검증

#### 5.1 인덱스 확인
```sql
-- 모든 테이블의 tenantId 인덱스 확인
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'mindgarden'
    AND COLUMN_NAME = 'tenant_id'
ORDER BY TABLE_NAME;
```

#### 5.2 데이터 무결성 확인
```sql
-- tenantId가 NULL인 데이터 확인 (있으면 안됨)
SELECT 
    'consultant_client_mappings' as table_name,
    COUNT(*) as null_count
FROM consultant_client_mappings
WHERE tenant_id IS NULL
UNION ALL
SELECT 
    'schedules' as table_name,
    COUNT(*) as null_count
FROM schedules
WHERE tenant_id IS NULL;
```

---

## 📊 진행 상황 추적

### 완료율 계산
- **Phase 1 완료율**: 60% (3/5) ✅
- **핵심 Repository 완료**: ConsultantClientMapping, ConsultationRecord, FinancialTransaction
- **전체 완료율**: 6.1% (31/509)

### 예상 소요 시간
- **Phase 1 완료**: 8-10 시간
- **Phase 2 완료**: 15-20 시간
- **Phase 3 완료**: 30-40 시간
- **전체 완료**: 53-70 시간

### 마일스톤
- [ ] **M1**: Phase 1 완료 (핵심 5개 Repository)
- [ ] **M2**: Phase 2 완료 (중요 5개 Repository)
- [ ] **M3**: 전체 테스트 통과
- [ ] **M4**: 개발 서버 배포 및 검증
- [ ] **M5**: 프로덕션 배포

---

## 🚨 위험 요소 및 대응 방안

### 위험 1: 기존 코드 호환성
**문제:** 기존 Service에서 tenantId 없이 Repository 호출  
**대응:** 
- @Deprecated 메서드 유지
- 점진적 마이그레이션
- 컴파일 경고로 사용처 파악

### 위험 2: 성능 저하
**문제:** tenantId 필터링으로 인한 쿼리 성능 저하  
**대응:**
- tenantId 인덱스 추가
- 복합 인덱스 최적화
- 쿼리 실행 계획 모니터링

### 위험 3: 누락된 필터링
**문제:** 일부 쿼리에서 tenantId 필터링 누락  
**대응:**
- 자동화 스크립트로 전수 검사
- 코드 리뷰 강화
- 통합 테스트로 검증

### 위험 4: 데이터 마이그레이션
**문제:** 기존 데이터에 tenantId 없음  
**대응:**
- 데이터 마이그레이션 스크립트 작성
- 백업 후 실행
- 롤백 계획 수립

---

## 📝 다음 단계

### 즉시 진행
1. [ ] ScheduleRepository 수정 시작
2. [ ] UserRepository 분석
3. [ ] ConsultationRecordRepository 분석
4. [ ] FinancialTransactionRepository 분석

### 병행 작업
1. [ ] 단위 테스트 작성
2. [ ] 통합 테스트 환경 구축
3. [ ] 성능 테스트 스크립트 작성

### 문서화
1. [ ] 수정 가이드 작성
2. [ ] 테스트 결과 문서화
3. [ ] 배포 체크리스트 작성

---

**작성자:** AI Assistant  
**검토자:** (TBD)  
**최종 업데이트:** 2025-11-30


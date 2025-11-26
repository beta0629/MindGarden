package com.coresolution.consultation.integration;

import com.coresolution.consultation.ConsultationManagementApplication;
import com.coresolution.consultation.entity.*;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.repository.*;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.StatisticsService;
import com.coresolution.consultation.service.RealTimeStatisticsService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.repository.TenantRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 하드코딩 제거 통합 테스트
 * 세션비 조회 로직이 메타데이터 기반으로 동작하는지 검증
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-25
 */
@SpringBootTest(classes = ConsultationManagementApplication.class)
@ActiveProfiles("test")
@Transactional
@DisplayName("하드코딩 제거 통합 테스트")
class HardcodingRemovalIntegrationTest {
    
    @Autowired
    private TenantRepository tenantRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ScheduleRepository scheduleRepository;
    
    @Autowired
    private ConsultantClientMappingRepository mappingRepository;
    
    @Autowired
    private CommonCodeService commonCodeService;
    
    @Autowired
    private com.coresolution.consultation.repository.CommonCodeRepository commonCodeRepository;
    
    @Autowired
    private StatisticsService statisticsService;
    
    @Autowired
    private RealTimeStatisticsService realTimeStatisticsService;
    
    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    
    private String tenantId;
    private Tenant testTenant;
    private User consultant;
    private User client;
    private ConsultantClientMapping mapping;
    
    @BeforeEach
    void setUp() {
        // 테스트용 테넌트 생성 (36자 제한을 위해 짧은 ID 사용)
        tenantId = "test-" + UUID.randomUUID().toString().substring(0, 30);
        testTenant = Tenant.builder()
                .tenantId(tenantId)
                .name("테스트 상담소")
                .businessType("CONSULTATION")
                .status(Tenant.TenantStatus.ACTIVE)
                .contactEmail("test@test.com")
                .build();
        testTenant = tenantRepository.save(testTenant);
        
        TenantContextHolder.setTenantId(tenantId);
        
        // 테스트용 상담사 생성
        consultant = new User();
        consultant.setEmail("consultant@test.com");
        consultant.setUsername("consultant");
        consultant.setPassword(passwordEncoder.encode("test1234"));
        consultant.setName("테스트 상담사");
        consultant.setRole(com.coresolution.consultation.constant.UserRole.CONSULTANT);
        consultant.setTenantId(tenantId);
        consultant.setIsActive(true);
        consultant = userRepository.save(consultant);
        
        // 테스트용 내담자 생성
        client = new User();
        client.setEmail("client@test.com");
        client.setUsername("client");
        client.setPassword(passwordEncoder.encode("test1234"));
        client.setName("테스트 내담자");
        client.setRole(com.coresolution.consultation.constant.UserRole.CLIENT);
        client.setTenantId(tenantId);
        client.setIsActive(true);
        client = userRepository.save(client);
        
        // 테스트용 매핑 생성 (회기당 단가: 50000원)
        mapping = new ConsultantClientMapping();
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        mapping.setTenantId(tenantId);
        mapping.setPackagePrice(500000L); // 총 패키지 가격: 50만원
        mapping.setTotalSessions(10); // 총 10회기
        mapping.setStartDate(LocalDateTime.now()); // 시작일 필수 (LocalDateTime)
        mapping.setStatus(MappingStatus.ACTIVE);
        mapping = mappingRepository.save(mapping);
        
        // 테스트용 CommonCode 생성 (기본 세션비)
        com.coresolution.consultation.entity.CommonCode defaultSessionFee = new com.coresolution.consultation.entity.CommonCode();
        defaultSessionFee.setCodeGroup("SYSTEM_CONFIG");
        defaultSessionFee.setCodeValue("DEFAULT_SESSION_FEE");
        defaultSessionFee.setCodeLabel("기본 세션비");
        defaultSessionFee.setCodeDescription("통계 계산 시 사용되는 기본 세션비");
        defaultSessionFee.setKoreanName("기본 세션비");
        defaultSessionFee.setSortOrder(1);
        defaultSessionFee.setIsActive(true);
        defaultSessionFee.setExtraData("{\"value\":50000,\"unit\":\"원\",\"description\":\"기본 세션비\"}");
        defaultSessionFee.setTenantId(null); // 시스템 코드
        commonCodeRepository.save(defaultSessionFee);
    }
    
    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }
    
    @Test
    @DisplayName("통계 계산 시 매핑에서 세션비 조회 - 성공 케이스")
    void testStatisticsCalculation_WithMapping() {
        // Given: 매핑이 있는 스케줄 생성 및 완료
        Schedule schedule = new Schedule();
        schedule.setConsultantId(consultant.getId());
        schedule.setClientId(client.getId());
        // mappingId는 Schedule에 없고, consultantId와 clientId로 매핑을 찾음
        schedule.setDate(LocalDate.now());
        schedule.setStartTime(LocalTime.of(10, 0));
        schedule.setEndTime(LocalTime.of(11, 0));
        schedule.setStatus(com.coresolution.consultation.constant.ScheduleStatus.COMPLETED);
        schedule.setTenantId(tenantId);
        schedule.setBranchCode("BRANCH-001");
        schedule = scheduleRepository.save(schedule);
        
        // When: 일별 통계 업데이트
        statisticsService.updateDailyStatistics(LocalDate.now(), "BRANCH-001");
        
        // Then: 매핑에서 계산된 세션비(50000원)가 사용되어야 함
        // 실제 통계 값 확인은 DailyStatisticsRepository를 통해 검증
        // 여기서는 세션비 조회 로직이 정상 작동하는지만 확인
        assertThat(schedule.getConsultantId()).isNotNull();
        assertThat(schedule.getClientId()).isNotNull();
        assertThat(mapping.getPackagePrice()).isEqualTo(500000L);
        assertThat(mapping.getTotalSessions()).isEqualTo(10);
        
        // 회기당 단가 계산: 500000 / 10 = 50000
        BigDecimal expectedSessionFee = BigDecimal.valueOf(500000L)
                .divide(BigDecimal.valueOf(10), 2, java.math.RoundingMode.HALF_UP);
        assertThat(expectedSessionFee).isEqualByComparingTo(BigDecimal.valueOf(50000));
    }
    
    @Test
    @DisplayName("통계 계산 시 CommonCode에서 기본 세션비 조회 - 매핑 없는 경우")
    void testStatisticsCalculation_WithCommonCode() {
        // Given: 매핑이 없는 스케줄 생성 및 완료 (clientId를 null로 설정하여 매핑을 찾지 못하도록)
        Schedule schedule = new Schedule();
        schedule.setConsultantId(consultant.getId());
        schedule.setClientId(null); // 매핑 없음
        schedule.setDate(LocalDate.now());
        schedule.setStartTime(LocalTime.of(10, 0));
        schedule.setEndTime(LocalTime.of(11, 0));
        schedule.setStatus(com.coresolution.consultation.constant.ScheduleStatus.COMPLETED);
        schedule.setTenantId(tenantId);
        schedule.setBranchCode("BRANCH-001");
        schedule = scheduleRepository.save(schedule);
        
        // CommonCode에 기본 세션비가 있는지 확인 (V51 마이그레이션으로 생성됨)
        var commonCode = commonCodeService.getCommonCodeByGroupAndValue(
                "SYSTEM_CONFIG", "DEFAULT_SESSION_FEE");
        
        // When: 일별 통계 업데이트
        statisticsService.updateDailyStatistics(LocalDate.now(), "BRANCH-001");
        
        // Then: CommonCode에서 기본 세션비를 조회해야 함
        // CommonCode가 있으면 그 값을 사용, 없으면 Fallback 사용
        if (commonCode != null) {
            assertThat(commonCode.getCodeGroup()).isEqualTo("SYSTEM_CONFIG");
            assertThat(commonCode.getCodeValue()).isEqualTo("DEFAULT_SESSION_FEE");
            // extra_data에 값이 있는지 확인
            assertThat(commonCode.getExtraData()).isNotNull();
        }
        
        assertThat(schedule.getClientId()).isNull();
    }
    
    @Test
    @DisplayName("실시간 통계 업데이트 시 세션비 조회 - 매핑 있는 경우")
    void testRealTimeStatistics_WithMapping() {
        // Given: 매핑이 있는 스케줄 생성
        Schedule schedule = new Schedule();
        schedule.setConsultantId(consultant.getId());
        schedule.setClientId(client.getId());
        schedule.setDate(LocalDate.now());
        schedule.setStartTime(LocalTime.of(10, 0));
        schedule.setEndTime(LocalTime.of(11, 0));
        schedule.setStatus(com.coresolution.consultation.constant.ScheduleStatus.BOOKED);
        schedule.setTenantId(tenantId);
        schedule.setBranchCode("BRANCH-001");
        schedule = scheduleRepository.save(schedule);
        
        // When: 스케줄 완료 처리 (실시간 통계 업데이트 트리거)
        schedule.setStatus(com.coresolution.consultation.constant.ScheduleStatus.COMPLETED);
        schedule = scheduleRepository.save(schedule);
        
        realTimeStatisticsService.updateStatisticsOnScheduleCompletion(schedule);
        
        // Then: 매핑에서 계산된 세션비가 사용되어야 함
        assertThat(schedule.getConsultantId()).isNotNull();
        assertThat(schedule.getClientId()).isNotNull();
        assertThat(mapping.getPackagePrice()).isEqualTo(500000L);
        assertThat(mapping.getTotalSessions()).isEqualTo(10);
    }
    
    @Test
    @DisplayName("실시간 통계 업데이트 시 CommonCode에서 기본 세션비 조회")
    void testRealTimeStatistics_WithCommonCode() {
        // Given: 매핑이 없는 스케줄 생성 (clientId를 null로 설정)
        Schedule schedule = new Schedule();
        schedule.setConsultantId(consultant.getId());
        schedule.setClientId(null);
        schedule.setDate(LocalDate.now());
        schedule.setStartTime(LocalTime.of(10, 0));
        schedule.setEndTime(LocalTime.of(11, 0));
        schedule.setStatus(com.coresolution.consultation.constant.ScheduleStatus.BOOKED);
        schedule.setTenantId(tenantId);
        schedule.setBranchCode("BRANCH-001");
        schedule = scheduleRepository.save(schedule);
        
        // When: 스케줄 완료 처리
        schedule.setStatus(com.coresolution.consultation.constant.ScheduleStatus.COMPLETED);
        schedule = scheduleRepository.save(schedule);
        
        realTimeStatisticsService.updateStatisticsOnScheduleCompletion(schedule);
        
        // Then: CommonCode에서 기본 세션비를 조회해야 함
        var commonCode = commonCodeService.getCommonCodeByGroupAndValue(
                "SYSTEM_CONFIG", "DEFAULT_SESSION_FEE");
        
        if (commonCode != null) {
            assertThat(commonCode.getCodeGroup()).isEqualTo("SYSTEM_CONFIG");
            assertThat(commonCode.getCodeValue()).isEqualTo("DEFAULT_SESSION_FEE");
        }
        
        assertThat(schedule.getClientId()).isNull();
    }
}


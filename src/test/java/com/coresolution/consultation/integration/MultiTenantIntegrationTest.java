package com.coresolution.consultation.integration;

import com.coresolution.consultation.ConsultationManagementApplication;
import com.coresolution.consultation.entity.Consultant;
import com.coresolution.consultation.entity.Consultation;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.repository.ConsultantRepository;
import com.coresolution.consultation.repository.ConsultationRepository;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.service.ConsultantService;
import com.coresolution.consultation.service.ConsultationService;
import com.coresolution.consultation.service.PaymentService;
import com.coresolution.consultation.service.ScheduleService;
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
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * 멀티테넌트 통합 테스트
 * Phase 1 Week 2 Day 5: 멀티테넌트 시나리오 및 데이터 격리 검증
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-18
 */
@SpringBootTest(classes = ConsultationManagementApplication.class)
@ActiveProfiles("test")
@Transactional
@DisplayName("멀티테넌트 통합 테스트")
class MultiTenantIntegrationTest {
    
    @Autowired
    private TenantRepository tenantRepository;
    
    @Autowired
    private ConsultationService consultationService;
    
    @Autowired
    private ConsultationRepository consultationRepository;
    
    @Autowired
    private ConsultantService consultantService;
    
    @Autowired
    private ConsultantRepository consultantRepository;
    
    @Autowired
    private ScheduleService scheduleService;
    
    @Autowired
    private ScheduleRepository scheduleRepository;
    
    @Autowired
    private PaymentService paymentService;
    
    @Autowired
    private PaymentRepository paymentRepository;
    
    private String tenantId1;
    private String tenantId2;
    private Tenant tenant1;
    private Tenant tenant2;
    
    @BeforeEach
    void setUp() {
        // 테스트용 테넌트 1 생성
        tenantId1 = "tenant-" + UUID.randomUUID().toString();
        tenant1 = Tenant.builder()
                .tenantId(tenantId1)
                .name("테스트 테넌트 1")
                .businessType("CONSULTATION")
                .status(Tenant.TenantStatus.ACTIVE)
                .contactEmail("tenant1@test.com")
                .build();
        tenant1 = tenantRepository.save(tenant1);
        
        // 테스트용 테넌트 2 생성
        tenantId2 = "tenant-" + UUID.randomUUID().toString();
        tenant2 = Tenant.builder()
                .tenantId(tenantId2)
                .name("테스트 테넌트 2")
                .businessType("CONSULTATION")
                .status(Tenant.TenantStatus.ACTIVE)
                .contactEmail("tenant2@test.com")
                .build();
        tenant2 = tenantRepository.save(tenant2);
    }
    
    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }
    
    // ============================================
    // 테스트 1: 멀티테넌트 시나리오 - 데이터 생성 및 조회
    // ============================================
    
    @Test
    @DisplayName("멀티테넌트 시나리오 - 여러 테넌트가 동시에 데이터 생성 및 조회")
    void testMultiTenantScenario_ConcurrentDataCreation() {
        // Given: 테넌트 1 컨텍스트 설정
        TenantContextHolder.setTenantId(tenantId1);
        
        // When: 테넌트 1의 상담사 생성
        Consultant consultant1 = new Consultant();
        consultant1.setName("테넌트1 상담사");
        consultant1.setSpecialty("심리상담");
        consultant1.setYearsOfExperience(5);
        // averageRating은 addRating 메서드로 설정하거나 테스트에서는 생략
        consultant1.setIsActive(true);
        consultant1 = consultantService.save(consultant1);
        
        // When: 테넌트 1의 상담 생성
        Consultation consultation1 = new Consultation();
        consultation1.setConsultantId(consultant1.getId());
        consultation1.setClientId(1L);
        consultation1.setConsultationDate(LocalDate.now());
        consultation1.setStatus("SCHEDULED");
        consultation1.setStartTime(LocalTime.of(10, 0));
        consultation1.setEndTime(LocalTime.of(11, 0));
        consultation1.setTitle("테넌트1 상담");
        consultation1 = consultationService.save(consultation1);
        
        // Then: 테넌트 1의 데이터만 조회되어야 함
        List<Consultant> consultants1 = consultantService.findAllActive();
        assertThat(consultants1).hasSize(1);
        assertThat(consultants1.get(0).getId()).isEqualTo(consultant1.getId());
        assertThat(consultants1.get(0).getTenantId()).isEqualTo(tenantId1);
        
        List<Consultation> consultations1 = consultationService.findAllActive();
        assertThat(consultations1).hasSize(1);
        assertThat(consultations1.get(0).getId()).isEqualTo(consultation1.getId());
        assertThat(consultations1.get(0).getTenantId()).isEqualTo(tenantId1);
        
        // Given: 테넌트 2 컨텍스트로 변경
        TenantContextHolder.setTenantId(tenantId2);
        
        // When: 테넌트 2의 상담사 생성
        Consultant consultant2 = new Consultant();
        consultant2.setName("테넌트2 상담사");
        consultant2.setSpecialty("진로상담");
        consultant2.setYearsOfExperience(3);
        // averageRating은 addRating 메서드로 설정하거나 테스트에서는 생략
        consultant2.setIsActive(true);
        consultant2 = consultantService.save(consultant2);
        
        // When: 테넌트 2의 상담 생성
        Consultation consultation2 = new Consultation();
        consultation2.setConsultantId(consultant2.getId());
        consultation2.setClientId(2L);
        consultation2.setConsultationDate(LocalDate.now());
        consultation2.setStatus("SCHEDULED");
        consultation2.setStartTime(LocalTime.of(14, 0));
        consultation2.setEndTime(LocalTime.of(15, 0));
        consultation2.setTitle("테넌트2 상담");
        consultation2 = consultationService.save(consultation2);
        
        // Then: 테넌트 2의 데이터만 조회되어야 함
        List<Consultant> consultants2 = consultantService.findAllActive();
        assertThat(consultants2).hasSize(1);
        assertThat(consultants2.get(0).getId()).isEqualTo(consultant2.getId());
        assertThat(consultants2.get(0).getTenantId()).isEqualTo(tenantId2);
        
        List<Consultation> consultations2 = consultationService.findAllActive();
        assertThat(consultations2).hasSize(1);
        assertThat(consultations2.get(0).getId()).isEqualTo(consultation2.getId());
        assertThat(consultations2.get(0).getTenantId()).isEqualTo(tenantId2);
        
        // Then: 테넌트 1의 데이터는 조회되지 않아야 함
        final Long consultant1Id = consultant1.getId();
        final Long consultation1Id = consultation1.getId();
        assertThat(consultants2.stream()
                .anyMatch(c -> c.getId().equals(consultant1Id))).isFalse();
        assertThat(consultations2.stream()
                .anyMatch(c -> c.getId().equals(consultation1Id))).isFalse();
    }
    
    // ============================================
    // 테스트 2: 테넌트 간 데이터 격리 검증 - Consultation
    // ============================================
    
    @Test
    @DisplayName("테넌트 간 데이터 격리 - ConsultationService")
    void testTenantDataIsolation_ConsultationService() {
        // Given: 테넌트 1에 상담 생성
        TenantContextHolder.setTenantId(tenantId1);
        Consultation consultation1 = new Consultation();
        consultation1.setConsultantId(1L);
        consultation1.setClientId(1L);
        consultation1.setConsultationDate(LocalDate.now());
        consultation1.setStatus("SCHEDULED");
        consultation1.setStartTime(LocalTime.of(10, 0));
        consultation1.setEndTime(LocalTime.of(11, 0));
        consultation1.setTitle("테스트 상담");
        consultation1 = consultationService.save(consultation1);
        Long consultation1Id = consultation1.getId();
        
        // When: 테넌트 2 컨텍스트로 변경
        TenantContextHolder.setTenantId(tenantId2);
        
        // Then: 테넌트 1의 상담이 조회되지 않아야 함
        List<Consultation> consultations2 = consultationService.findAllActive();
        assertThat(consultations2.stream()
                .anyMatch(c -> c.getId().equals(consultation1Id))).isFalse();
        
        // Then: 테넌트 1의 상담을 직접 조회하려고 하면 접근 제어 오류 발생
        TenantContextHolder.setTenantId(tenantId2);
        assertThatThrownBy(() -> {
            consultationService.findById(consultation1Id);
        }).isInstanceOf(Exception.class);
    }
    
    // ============================================
    // 테스트 3: 테넌트 간 데이터 격리 검증 - Consultant
    // ============================================
    
    @Test
    @DisplayName("테넌트 간 데이터 격리 - ConsultantService")
    void testTenantDataIsolation_ConsultantService() {
        // Given: 테넌트 1에 상담사 생성
        TenantContextHolder.setTenantId(tenantId1);
        Consultant consultant1 = new Consultant();
        consultant1.setName("테넌트1 상담사");
        consultant1.setSpecialty("심리상담");
        consultant1.setYearsOfExperience(5);
        // averageRating은 addRating 메서드로 설정하거나 테스트에서는 생략
        consultant1.setIsActive(true);
        consultant1 = consultantService.save(consultant1);
        Long consultant1Id = consultant1.getId();
        
        // When: 테넌트 2 컨텍스트로 변경
        TenantContextHolder.setTenantId(tenantId2);
        
        // Then: 테넌트 1의 상담사가 조회되지 않아야 함
        List<Consultant> consultants2 = consultantService.findAllActive();
        assertThat(consultants2.stream()
                .anyMatch(c -> c.getId().equals(consultant1Id))).isFalse();
        
        // Then: 테넌트 1의 상담사를 수정하려고 하면 접근 제어 오류 발생
        final Consultant consultant1Final = consultant1;
        assertThatThrownBy(() -> {
            Consultant updateData = new Consultant();
            updateData.setName("수정된 이름");
            consultant1Final.setName("수정된 이름");
            consultantService.update(consultant1Final);
        }).isInstanceOf(Exception.class);
    }
    
    // ============================================
    // 테스트 4: 테넌트 간 데이터 격리 검증 - Schedule
    // ============================================
    
    @Test
    @DisplayName("테넌트 간 데이터 격리 - ScheduleService")
    void testTenantDataIsolation_ScheduleService() {
        // Given: 테넌트 1에 스케줄 생성
        TenantContextHolder.setTenantId(tenantId1);
        Schedule schedule1 = new Schedule();
        schedule1.setConsultantId(1L);
        schedule1.setClientId(1L);
        schedule1.setDate(LocalDate.now());
        schedule1.setStartTime(LocalTime.of(10, 0));
        schedule1.setEndTime(LocalTime.of(11, 0));
        schedule1.setTitle("테넌트1 스케줄");
        schedule1 = scheduleService.createSchedule(schedule1);
        Long schedule1Id = schedule1.getId();
        
        // When: 테넌트 2 컨텍스트로 변경
        TenantContextHolder.setTenantId(tenantId2);
        
        // Then: 테넌트 1의 스케줄이 조회되지 않아야 함
        List<Schedule> schedules2 = scheduleService.findAll();
        assertThat(schedules2.stream()
                .anyMatch(s -> s.getId().equals(schedule1Id))).isFalse();
        
        // Then: 테넌트 1의 스케줄을 삭제하려고 하면 접근 제어 오류 발생
        assertThatThrownBy(() -> {
            scheduleService.deleteSchedule(schedule1Id);
        }).isInstanceOf(Exception.class);
    }
    
    // ============================================
    // 테스트 5: 테넌트 간 데이터 격리 검증 - Payment
    // ============================================
    
    @Test
    @DisplayName("테넌트 간 데이터 격리 - PaymentService")
    void testTenantDataIsolation_PaymentService() {
        // Given: 테넌트 1에 결제 생성
        TenantContextHolder.setTenantId(tenantId1);
        
        // Payment는 PaymentRequest를 통해 생성되므로, 직접 엔티티 생성 대신
        // Repository를 통해 테스트 데이터 생성
        Payment payment1 = Payment.builder()
                .paymentId("payment-" + UUID.randomUUID().toString())
                .orderId("order-1")
                .amount(new BigDecimal("10000"))
                .status(Payment.PaymentStatus.PENDING)
                .method(Payment.PaymentMethod.CARD)
                .provider(Payment.PaymentProvider.TOSS)
                .payerId(1L)
                .recipientId(2L)
                .branchId(1L)
                .description("테넌트1 결제")
                .expiresAt(LocalDateTime.now().plusHours(1))
                .build();
        payment1.setTenantId(tenantId1);
        payment1 = paymentRepository.save(payment1);
        String payment1Id = payment1.getPaymentId();
        
        // When: 테넌트 2 컨텍스트로 변경
        TenantContextHolder.setTenantId(tenantId2);
        
        // Then: 테넌트 1의 결제가 조회되지 않아야 함
        List<Payment> payments2 = paymentService.getAllPayments();
        assertThat(payments2.stream()
                .anyMatch(p -> p.getPaymentId().equals(payment1Id))).isFalse();
        
        // Then: 테넌트 1의 결제를 조회하려고 하면 찾을 수 없음
        assertThatThrownBy(() -> {
            paymentService.getPayment(payment1Id);
        }).isInstanceOf(RuntimeException.class)
                .hasMessageContaining("결제를 찾을 수 없습니다");
    }
    
    // ============================================
    // 테스트 6: Repository 레벨 데이터 격리 검증
    // ============================================
    
    @Test
    @DisplayName("Repository 레벨 데이터 격리 검증")
    void testRepositoryLevelDataIsolation() {
        // Given: 테넌트 1에 데이터 생성
        TenantContextHolder.setTenantId(tenantId1);
        Consultant consultant1 = new Consultant();
        consultant1.setName("테넌트1 상담사");
        consultant1.setSpecialty("심리상담");
        consultant1.setYearsOfExperience(5);
        // averageRating은 addRating 메서드로 설정하거나 테스트에서는 생략
        consultant1.setIsActive(true);
        consultant1 = consultantRepository.save(consultant1);
        
        Consultation consultation1 = new Consultation();
        consultation1.setConsultantId(consultant1.getId());
        consultation1.setClientId(1L);
        consultation1.setConsultationDate(LocalDate.now());
        consultation1.setStatus("SCHEDULED");
        consultation1.setStartTime(LocalTime.of(10, 0));
        consultation1.setEndTime(LocalTime.of(11, 0));
        consultation1.setTitle("테스트 상담");
        consultation1 = consultationRepository.save(consultation1);
        
        // When: 테넌트 2 컨텍스트로 변경
        TenantContextHolder.setTenantId(tenantId2);
        
        // Then: BaseRepository의 테넌트 필터링 메서드가 올바르게 동작
        List<Consultant> consultants2 = consultantRepository.findAllActiveByCurrentTenant();
        assertThat(consultants2).isEmpty();
        
        List<Consultation> consultations2 = consultationRepository.findAllActiveByCurrentTenant();
        assertThat(consultations2).isEmpty();
        
        // Then: 직접 조회 시에도 테넌트 필터링 적용
        assertThat(consultantRepository.findActiveByIdAndCurrentTenant(consultant1.getId()))
                .isEmpty();
        assertThat(consultationRepository.findActiveByIdAndCurrentTenant(consultation1.getId()))
                .isEmpty();
    }
    
    // ============================================
    // 테스트 7: 테넌트 컨텍스트 전환 시나리오
    // ============================================
    
    @Test
    @DisplayName("테넌트 컨텍스트 전환 시나리오")
    void testTenantContextSwitching() {
        // Given: 테넌트 1에 데이터 생성
        TenantContextHolder.setTenantId(tenantId1);
        Consultant consultant1 = new Consultant();
        consultant1.setName("테넌트1 상담사");
        consultant1.setSpecialty("심리상담");
        consultant1.setYearsOfExperience(5);
        // averageRating은 addRating 메서드로 설정하거나 테스트에서는 생략
        consultant1.setIsActive(true);
        consultant1 = consultantService.save(consultant1);
        
        // When: 테넌트 2로 전환 후 데이터 생성
        TenantContextHolder.setTenantId(tenantId2);
        Consultant consultant2 = new Consultant();
        consultant2.setName("테넌트2 상담사");
        consultant2.setSpecialty("진로상담");
        consultant2.setYearsOfExperience(3);
        // averageRating은 addRating 메서드로 설정하거나 테스트에서는 생략
        consultant2.setIsActive(true);
        consultant2 = consultantService.save(consultant2);
        
        // Then: 각 테넌트는 자신의 데이터만 조회
        TenantContextHolder.setTenantId(tenantId1);
        List<Consultant> consultants1 = consultantService.findAllActive();
        assertThat(consultants1).hasSize(1);
        assertThat(consultants1.get(0).getId()).isEqualTo(consultant1.getId());
        
        TenantContextHolder.setTenantId(tenantId2);
        List<Consultant> consultants2 = consultantService.findAllActive();
        assertThat(consultants2).hasSize(1);
        assertThat(consultants2.get(0).getId()).isEqualTo(consultant2.getId());
    }
    
    // ============================================
    // 테스트 8: tenant_id 자동 설정 검증
    // ============================================
    
    @Test
    @DisplayName("엔티티 생성 시 tenant_id 자동 설정 검증")
    void testTenantIdAutoSetting() {
        // Given: 테넌트 1 컨텍스트 설정
        TenantContextHolder.setTenantId(tenantId1);
        
        // When: tenant_id를 설정하지 않고 엔티티 생성
        Consultant consultant = new Consultant();
        consultant.setName("자동 설정 테스트");
        consultant.setSpecialty("심리상담");
        consultant.setYearsOfExperience(5);
        // averageRating은 addRating 메서드로 설정하거나 테스트에서는 생략
        consultant.setIsActive(true);
        // tenant_id는 null로 설정하지 않음
        
        consultant = consultantService.save(consultant);
        
        // Then: tenant_id가 자동으로 설정되어야 함
        assertThat(consultant.getTenantId()).isEqualTo(tenantId1);
        
        // When: DB에서 다시 조회
        Consultant found = consultantRepository.findById(consultant.getId()).orElse(null);
        assertThat(found).isNotNull();
        assertThat(found.getTenantId()).isEqualTo(tenantId1);
    }
}


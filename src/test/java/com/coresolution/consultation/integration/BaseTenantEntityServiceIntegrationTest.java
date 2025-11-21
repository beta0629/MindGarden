package com.coresolution.consultation.integration;

import com.coresolution.consultation.ConsultationManagementApplication;
import com.coresolution.consultation.entity.*;
import com.coresolution.consultation.repository.*;
import com.coresolution.consultation.service.*;
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
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * BaseTenantEntityService 패턴 통합 테스트
 * Phase 2 Week 2 Day 5: 리팩토링된 서비스들의 BaseTenantEntityService 패턴 동작 검증
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@SpringBootTest(classes = ConsultationManagementApplication.class)
@ActiveProfiles("test")
@Transactional
@DisplayName("BaseTenantEntityService 패턴 통합 테스트")
class BaseTenantEntityServiceIntegrationTest {
    
    @Autowired
    private TenantRepository tenantRepository;
    
    @Autowired
    private ConsultationService consultationService;
    
    @Autowired
    private ClientService clientService;
    
    @Autowired
    private ConsultantService consultantService;
    
    @Autowired
    private PaymentService paymentService;
    
    @Autowired
    private ScheduleService scheduleService;
    
    @Autowired
    private ConsultationMessageService consultationMessageService;
    
    @Autowired
    private AlertService alertService;
    
    @Autowired
    private BranchService branchService;
    
    @Autowired
    private ConsultationRepository consultationRepository;
    
    @Autowired
    private ClientRepository clientRepository;
    
    @Autowired
    private ConsultantRepository consultantRepository;
    
    @Autowired
    private PaymentRepository paymentRepository;
    
    @Autowired
    private ScheduleRepository scheduleRepository;
    
    @Autowired
    private ConsultationMessageRepository consultationMessageRepository;
    
    @Autowired
    private AlertRepository alertRepository;
    
    @Autowired
    private BranchRepository branchRepository;
    
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
    
    // ==================== ConsultationService 테스트 ====================
    
    @Test
    @DisplayName("ConsultationService - BaseTenantEntityService create 메서드 동작 검증")
    void testConsultationServiceCreate() {
        // Given
        TenantContextHolder.setTenantId(tenantId1);
        
        Consultation consultation = new Consultation();
        consultation.setClientId(1L);
        consultation.setConsultantId(1L);
        consultation.setStatus("REQUESTED");
        consultation.setConsultationDate(LocalDate.now());
        consultation.setStartTime(LocalTime.now());
        consultation.setEndTime(LocalTime.now().plusHours(1));
        
        // When
        Consultation saved = consultationService.save(consultation);
        
        // Then
        assertThat(saved).isNotNull();
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getTenantId()).isEqualTo(tenantId1);
        assertThat(saved.getStatus()).isEqualTo("REQUESTED");
    }
    
    @Test
    @DisplayName("ConsultationService - BaseTenantEntityService findAllByTenant 메서드 동작 검증")
    void testConsultationServiceFindAllByTenant() {
        // Given
        TenantContextHolder.setTenantId(tenantId1);
        
        Consultation consultation1 = new Consultation();
        consultation1.setClientId(1L);
        consultation1.setConsultantId(1L);
        consultation1.setStatus("REQUESTED");
        consultation1.setConsultationDate(LocalDate.now());
        consultation1.setStartTime(LocalTime.now());
        consultation1.setEndTime(LocalTime.now().plusHours(1));
        consultationService.save(consultation1);
        
        TenantContextHolder.setTenantId(tenantId2);
        Consultation consultation2 = new Consultation();
        consultation2.setClientId(2L);
        consultation2.setConsultantId(2L);
        consultation2.setStatus("REQUESTED");
        consultation2.setConsultationDate(LocalDate.now());
        consultation2.setStartTime(LocalTime.now());
        consultation2.setEndTime(LocalTime.now().plusHours(1));
        consultationService.save(consultation2);
        
        // When
        TenantContextHolder.setTenantId(tenantId1);
        List<Consultation> consultations = consultationService.findAllActive();
        
        // Then
        assertThat(consultations).hasSize(1);
        assertThat(consultations.get(0).getTenantId()).isEqualTo(tenantId1);
    }
    
    // ==================== ClientService 테스트 ====================
    
    @Test
    @DisplayName("ClientService - BaseTenantEntityService create 메서드 동작 검증")
    void testClientServiceCreate() {
        // Given
        TenantContextHolder.setTenantId(tenantId1);
        
        Client client = new Client();
        client.setName("테스트 클라이언트");
        client.setEmail("client@test.com");
        client.setPhone("010-1234-5678");
        
        // When
        Client saved = clientService.save(client);
        
        // Then
        assertThat(saved).isNotNull();
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getTenantId()).isEqualTo(tenantId1);
        assertThat(saved.getName()).isEqualTo("테스트 클라이언트");
    }
    
    @Test
    @DisplayName("ClientService - BaseTenantEntityService findAllByTenant 메서드 동작 검증")
    void testClientServiceFindAllByTenant() {
        // Given
        TenantContextHolder.setTenantId(tenantId1);
        
        Client client1 = new Client();
        client1.setName("클라이언트 1");
        client1.setEmail("client1@test.com");
        client1.setPhone("010-1111-1111");
        clientService.save(client1);
        
        TenantContextHolder.setTenantId(tenantId2);
        Client client2 = new Client();
        client2.setName("클라이언트 2");
        client2.setEmail("client2@test.com");
        client2.setPhone("010-2222-2222");
        clientService.save(client2);
        
        // When
        TenantContextHolder.setTenantId(tenantId1);
        List<Client> clients = clientService.findAllActive();
        
        // Then
        assertThat(clients).hasSize(1);
        assertThat(clients.get(0).getTenantId()).isEqualTo(tenantId1);
        assertThat(clients.get(0).getName()).isEqualTo("클라이언트 1");
    }
    
    // ==================== ConsultantService 테스트 ====================
    
    @Test
    @DisplayName("ConsultantService - BaseTenantEntityService create 메서드 동작 검증")
    void testConsultantServiceCreate() {
        // Given
        TenantContextHolder.setTenantId(tenantId1);
        
        Consultant consultant = new Consultant();
        consultant.setName("테스트 상담사");
        consultant.setEmail("consultant@test.com");
        consultant.setPhone("010-1234-5678");
        
        // When
        Consultant saved = consultantService.save(consultant);
        
        // Then
        assertThat(saved).isNotNull();
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getTenantId()).isEqualTo(tenantId1);
        assertThat(saved.getName()).isEqualTo("테스트 상담사");
    }
    
    // ==================== PaymentService 테스트 ====================
    
    @Test
    @DisplayName("PaymentService - BaseTenantEntityService create 메서드 동작 검증")
    void testPaymentServiceCreate() {
        // Given
        TenantContextHolder.setTenantId(tenantId1);
        
        com.coresolution.consultation.dto.PaymentRequest request = 
            new com.coresolution.consultation.dto.PaymentRequest();
        request.setOrderId("ORDER-001");
        request.setAmount(new BigDecimal("10000"));
        request.setMethod("CARD");
        request.setProvider("TOSS");
        request.setPayerId(1L);
        request.setRecipientId(2L);
        request.setBranchId(null);
        request.setDescription("테스트 결제");
        request.setTimeoutMinutes(30);
        
        // When
        com.coresolution.consultation.dto.PaymentResponse response = 
            paymentService.createPayment(request);
        
        // Then
        assertThat(response).isNotNull();
        assertThat(response.getPaymentId()).isNotNull();
        
        // Payment 엔티티 확인
        Optional<Payment> paymentOpt = paymentRepository.findByPaymentIdAndIsDeletedFalse(
            response.getPaymentId());
        assertThat(paymentOpt).isPresent();
        Payment payment = paymentOpt.get();
        assertThat(payment.getTenantId()).isEqualTo(tenantId1);
    }
    
    // ==================== ScheduleService 테스트 ====================
    
    @Test
    @DisplayName("ScheduleService - BaseTenantEntityService create 메서드 동작 검증")
    void testScheduleServiceCreate() {
        // Given
        TenantContextHolder.setTenantId(tenantId1);
        
        Schedule schedule = new Schedule();
        schedule.setConsultantId(1L);
        schedule.setClientId(1L);
        schedule.setDate(LocalDate.now());
        schedule.setStartTime(LocalTime.now());
        schedule.setEndTime(LocalTime.now().plusHours(1));
        schedule.setTitle("테스트 스케줄");
        schedule.setStatus(com.coresolution.consultation.constant.ScheduleStatus.BOOKED);
        
        // When
        Schedule saved = scheduleService.createSchedule(schedule);
        
        // Then
        assertThat(saved).isNotNull();
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getTenantId()).isEqualTo(tenantId1);
        assertThat(saved.getTitle()).isEqualTo("테스트 스케줄");
    }
    
    @Test
    @DisplayName("ScheduleService - BaseTenantEntityService findAllByTenant 메서드 동작 검증")
    void testScheduleServiceFindAllByTenant() {
        // Given
        TenantContextHolder.setTenantId(tenantId1);
        
        Schedule schedule1 = new Schedule();
        schedule1.setConsultantId(1L);
        schedule1.setClientId(1L);
        schedule1.setDate(LocalDate.now());
        schedule1.setStartTime(LocalTime.now());
        schedule1.setEndTime(LocalTime.now().plusHours(1));
        schedule1.setTitle("스케줄 1");
        schedule1.setStatus(com.coresolution.consultation.constant.ScheduleStatus.BOOKED);
        scheduleService.createSchedule(schedule1);
        
        TenantContextHolder.setTenantId(tenantId2);
        Schedule schedule2 = new Schedule();
        schedule2.setConsultantId(2L);
        schedule2.setClientId(2L);
        schedule2.setDate(LocalDate.now());
        schedule2.setStartTime(LocalTime.now());
        schedule2.setEndTime(LocalTime.now().plusHours(1));
        schedule2.setTitle("스케줄 2");
        schedule2.setStatus(com.coresolution.consultation.constant.ScheduleStatus.BOOKED);
        scheduleService.createSchedule(schedule2);
        
        // When
        TenantContextHolder.setTenantId(tenantId1);
        List<Schedule> schedules = scheduleService.findAll();
        
        // Then
        assertThat(schedules).hasSize(1);
        assertThat(schedules.get(0).getTenantId()).isEqualTo(tenantId1);
        assertThat(schedules.get(0).getTitle()).isEqualTo("스케줄 1");
    }
    
    // ==================== ConsultationMessageService 테스트 ====================
    
    @Test
    @DisplayName("ConsultationMessageService - BaseTenantEntityService create 메서드 동작 검증")
    void testConsultationMessageServiceCreate() {
        // Given
        TenantContextHolder.setTenantId(tenantId1);
        
        // When
        ConsultationMessage message = consultationMessageService.sendMessage(
            1L, // consultantId
            1L, // clientId
            null, // consultationId
            "CONSULTANT", // senderType
            "테스트 메시지", // title
            "메시지 내용", // content
            "GENERAL", // messageType
            false, // isImportant
            false  // isUrgent
        );
        
        // Then
        assertThat(message).isNotNull();
        assertThat(message.getId()).isNotNull();
        assertThat(message.getTenantId()).isEqualTo(tenantId1);
        assertThat(message.getTitle()).isEqualTo("테스트 메시지");
    }
    
    // ==================== AlertService 테스트 ====================
    
    @Test
    @DisplayName("AlertService - BaseTenantEntityService create 메서드 동작 검증")
    void testAlertServiceCreate() {
        // Given
        TenantContextHolder.setTenantId(tenantId1);
        
        Alert alert = new Alert();
        alert.setUserId(1L);
        alert.setType("CONSULTATION");
        alert.setPriority("NORMAL");
        alert.setStatus("UNREAD");
        alert.setTitle("테스트 알림");
        alert.setContent("알림 내용");
        
        // When
        Alert saved = alertService.save(alert);
        
        // Then
        assertThat(saved).isNotNull();
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getTenantId()).isEqualTo(tenantId1);
        assertThat(saved.getTitle()).isEqualTo("테스트 알림");
    }
    
    @Test
    @DisplayName("AlertService - BaseTenantEntityService findAllByTenant 메서드 동작 검증")
    void testAlertServiceFindAllByTenant() {
        // Given
        TenantContextHolder.setTenantId(tenantId1);
        
        Alert alert1 = new Alert();
        alert1.setUserId(1L);
        alert1.setType("CONSULTATION");
        alert1.setPriority("NORMAL");
        alert1.setStatus("UNREAD");
        alert1.setTitle("알림 1");
        alert1.setContent("내용 1");
        alertService.save(alert1);
        
        TenantContextHolder.setTenantId(tenantId2);
        Alert alert2 = new Alert();
        alert2.setUserId(2L);
        alert2.setType("CONSULTATION");
        alert2.setPriority("NORMAL");
        alert2.setStatus("UNREAD");
        alert2.setTitle("알림 2");
        alert2.setContent("내용 2");
        alertService.save(alert2);
        
        // When
        TenantContextHolder.setTenantId(tenantId1);
        List<Alert> alerts = alertService.findAllActive();
        
        // Then
        assertThat(alerts).hasSize(1);
        assertThat(alerts.get(0).getTenantId()).isEqualTo(tenantId1);
        assertThat(alerts.get(0).getTitle()).isEqualTo("알림 1");
    }
    
    // ==================== BranchService 테스트 ====================
    
    @Test
    @DisplayName("BranchService - BaseTenantEntityService create 메서드 동작 검증")
    void testBranchServiceCreate() {
        // Given
        TenantContextHolder.setTenantId(tenantId1);
        
        com.coresolution.consultation.dto.BranchCreateRequest request = 
            new com.coresolution.consultation.dto.BranchCreateRequest();
        request.setBranchCode("BRANCH-001");
        request.setBranchName("테스트 지점");
        request.setBranchType(Branch.BranchType.MAIN);
        request.setAddress("서울시 강남구");
        request.setPhoneNumber("02-1234-5678");
        
        // When
        com.coresolution.consultation.dto.BranchResponse response = 
            branchService.createBranch(request);
        
        // Then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isNotNull();
        assertThat(response.getBranchName()).isEqualTo("테스트 지점");
        
        // Branch 엔티티 확인
        Optional<Branch> branchOpt = branchRepository.findById(response.getId());
        assertThat(branchOpt).isPresent();
        Branch branch = branchOpt.get();
        assertThat(branch.getTenantId()).isEqualTo(tenantId1);
    }
    
    // ==================== 통합 테스트: 여러 서비스 동시 사용 ====================
    
    @Test
    @DisplayName("여러 서비스 동시 사용 - 테넌트 필터링 검증")
    void testMultipleServicesTenantFiltering() {
        // Given - Tenant 1에 데이터 생성
        TenantContextHolder.setTenantId(tenantId1);
        
        Client client1 = new Client();
        client1.setName("클라이언트 1");
        client1.setEmail("client1@test.com");
        client1.setPhone("010-1111-1111");
        client1 = clientService.save(client1);
        
        Consultant consultant1 = new Consultant();
        consultant1.setName("상담사 1");
        consultant1.setEmail("consultant1@test.com");
        consultant1.setPhone("010-2222-2222");
        consultant1 = consultantService.save(consultant1);
        
        // Given - Tenant 2에 데이터 생성
        TenantContextHolder.setTenantId(tenantId2);
        
        Client client2 = new Client();
        client2.setName("클라이언트 2");
        client2.setEmail("client2@test.com");
        client2.setPhone("010-3333-3333");
        client2 = clientService.save(client2);
        
        Consultant consultant2 = new Consultant();
        consultant2.setName("상담사 2");
        consultant2.setEmail("consultant2@test.com");
        consultant2.setPhone("010-4444-4444");
        consultant2 = consultantService.save(consultant2);
        
        // When - Tenant 1로 전환하여 조회
        TenantContextHolder.setTenantId(tenantId1);
        List<Client> clients = clientService.findAllActive();
        List<Consultant> consultants = consultantService.findAllActive();
        
        // Then - Tenant 1의 데이터만 조회되어야 함
        assertThat(clients).hasSize(1);
        assertThat(clients.get(0).getTenantId()).isEqualTo(tenantId1);
        assertThat(clients.get(0).getName()).isEqualTo("클라이언트 1");
        
        assertThat(consultants).hasSize(1);
        assertThat(consultants.get(0).getTenantId()).isEqualTo(tenantId1);
        assertThat(consultants.get(0).getName()).isEqualTo("상담사 1");
    }
    
    // ==================== 성능 테스트 ====================
    
    @Test
    @DisplayName("BaseTenantEntityService 패턴 성능 테스트")
    void testBaseTenantEntityServicePerformance() {
        // Given
        TenantContextHolder.setTenantId(tenantId1);
        
        long startTime = System.currentTimeMillis();
        
        // When - 여러 엔티티 생성
        for (int i = 0; i < 10; i++) {
            Client client = new Client();
            client.setName("클라이언트 " + i);
            client.setEmail("client" + i + "@test.com");
            client.setPhone("010-0000-000" + i);
            clientService.save(client);
        }
        
        long endTime = System.currentTimeMillis();
        long duration = endTime - startTime;
        
        // Then - 성능이 합리적인 범위 내에 있는지 확인 (10개 생성이 5초 이내)
        assertThat(duration).isLessThan(5000);
        
        // 데이터 확인
        List<Client> clients = clientService.findAllActive();
        assertThat(clients).hasSize(10);
    }
}


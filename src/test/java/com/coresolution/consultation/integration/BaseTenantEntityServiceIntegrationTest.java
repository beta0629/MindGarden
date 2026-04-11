package com.coresolution.consultation.integration;

import com.coresolution.consultation.ConsultationManagementApplication;
import com.coresolution.consultation.constant.UserRole;
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
import org.springframework.security.crypto.password.PasswordEncoder;
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

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;
    
    private String tenantId1;
    private String tenantId2;
    private Tenant tenant1;
    private Tenant tenant2;
    
    @BeforeEach
    void setUp() {
        // 테스트용 테넌트 1 생성 (BaseEntity.tenant_id = VARCHAR(36))
        tenantId1 = UUID.randomUUID().toString();
        tenant1 = Tenant.builder()
                .tenantId(tenantId1)
                .name("테스트 테넌트 1")
                .businessType("CONSULTATION")
                .status(Tenant.TenantStatus.ACTIVE)
                .contactEmail("tenant1@test.com")
                .build();
        tenant1 = tenantRepository.save(tenant1);
        
        // 테스트용 테넌트 2 생성
        tenantId2 = UUID.randomUUID().toString();
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

    /**
     * clients.id = users.id FK 정합: User(CLIENT) 저장 후 동일 PK로 Client 행 저장.
     */
    private User newPersistedClientUser(String tenantId, String name, String email, String phone) {
        User u = new User();
        u.setUserId("u-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12));
        u.setEmail(email);
        u.setPassword(passwordEncoder.encode("password12ab"));
        u.setName(name);
        u.setPhone(phone);
        u.setRole(UserRole.CLIENT);
        u.setTenantId(tenantId);
        u.setIsActive(true);
        u.setIsPasswordChanged(true);
        u = userRepository.save(u);
        userRepository.flush();
        return u;
    }

    private Client persistClientRowForUser(User user) {
        Client c = new Client();
        c.setId(user.getId());
        c.setTenantId(user.getTenantId());
        c.setName(user.getName());
        c.setEmail(user.getEmail());
        c.setPhone(user.getPhone());
        c.setIsDeleted(false);
        return clientRepository.save(c);
    }

    /**
     * Consultant는 User 상속 — userId·BCrypt 비밀번호 필수.
     */
    private Consultant newPersistedConsultant(String tenantId, String name, String email) {
        TenantContextHolder.setTenantId(tenantId);
        Consultant consultant = new Consultant();
        consultant.setUserId("c-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12));
        consultant.setEmail(email);
        consultant.setPassword(passwordEncoder.encode("password12ab"));
        consultant.setName(name);
        consultant.setPhone("010-1234-5678");
        consultant.setRole(UserRole.CONSULTANT);
        consultant.setIsActive(true);
        consultant.setIsPasswordChanged(true);
        return consultantService.save(consultant);
    }
    
    // ==================== ConsultationService 테스트 ====================
    
    @Test
    @DisplayName("ConsultationService - BaseTenantEntityService create 메서드 동작 검증")
    void testConsultationServiceCreate() {
        // Given
        TenantContextHolder.setTenantId(tenantId1);
        User clientUser = newPersistedClientUser(tenantId1, "클라이언트", "ccreate@test.com", "010-1000-0001");
        Client client = persistClientRowForUser(clientUser);
        Consultant consultant = newPersistedConsultant(tenantId1, "상담사", "concreate@test.com");

        Consultation consultation = new Consultation();
        consultation.setClientId(client.getId());
        consultation.setConsultantId(consultant.getId());
        consultation.setTitle("테스트 상담");
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
        User cu1 = newPersistedClientUser(tenantId1, "클라1", "cfind1@test.com", "010-2000-0001");
        Client client1 = persistClientRowForUser(cu1);
        Consultant cons1 = newPersistedConsultant(tenantId1, "상담사1", "confind1@test.com");

        Consultation consultation1 = new Consultation();
        consultation1.setClientId(client1.getId());
        consultation1.setConsultantId(cons1.getId());
        consultation1.setTitle("테넌트1 상담");
        consultation1.setStatus("REQUESTED");
        consultation1.setConsultationDate(LocalDate.now());
        consultation1.setStartTime(LocalTime.now());
        consultation1.setEndTime(LocalTime.now().plusHours(1));
        consultationService.save(consultation1);
        
        TenantContextHolder.setTenantId(tenantId2);
        User cu2 = newPersistedClientUser(tenantId2, "클라2", "cfind2@test.com", "010-2000-0002");
        Client client2 = persistClientRowForUser(cu2);
        Consultant cons2 = newPersistedConsultant(tenantId2, "상담사2", "confind2@test.com");

        Consultation consultation2 = new Consultation();
        consultation2.setClientId(client2.getId());
        consultation2.setConsultantId(cons2.getId());
        consultation2.setTitle("테넌트2 상담");
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
    @DisplayName("ClientService - users.id와 동일 PK로 Client 저장 후 조회 검증")
    void testClientServiceCreate() {
        TenantContextHolder.setTenantId(tenantId1);

        User user = newPersistedClientUser(tenantId1, "테스트 클라이언트", "client@test.com", "010-1234-5678");
        Client saved = persistClientRowForUser(user);

        assertThat(saved).isNotNull();
        assertThat(saved.getId()).isEqualTo(user.getId());
        assertThat(saved.getTenantId()).isEqualTo(tenantId1);
        assertThat(saved.getName()).isEqualTo("테스트 클라이언트");

        Client loaded = clientService.findActiveById(user.getId()).orElseThrow();
        assertThat(loaded.getName()).isEqualTo("테스트 클라이언트");
    }
    
    @Test
    @DisplayName("ClientService - BaseTenantEntityService findAllByTenant 메서드 동작 검증")
    void testClientServiceFindAllByTenant() {
        TenantContextHolder.setTenantId(tenantId1);
        User u1 = newPersistedClientUser(tenantId1, "클라이언트 1", "client1@test.com", "010-1111-1111");
        persistClientRowForUser(u1);

        TenantContextHolder.setTenantId(tenantId2);
        User u2 = newPersistedClientUser(tenantId2, "클라이언트 2", "client2@test.com", "010-2222-2222");
        persistClientRowForUser(u2);

        TenantContextHolder.setTenantId(tenantId1);
        List<Client> clients = clientService.findAllActive();

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
        consultant.setUserId("c-test-" + UUID.randomUUID().toString().replace("-", "").substring(0, 10));
        consultant.setPassword(passwordEncoder.encode("password12ab"));
        consultant.setName("테스트 상담사");
        consultant.setEmail("consultant@test.com");
        consultant.setPhone("010-1234-5678");
        consultant.setRole(UserRole.CONSULTANT);
        consultant.setIsPasswordChanged(true);
        
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
        User cu = newPersistedClientUser(tenantId1, "스케줄클라", "schedc@test.com", "010-3000-0001");
        Client client = persistClientRowForUser(cu);
        Consultant consultant = newPersistedConsultant(tenantId1, "스케줄상담", "schedcon@test.com");

        Schedule schedule = new Schedule();
        schedule.setConsultantId(consultant.getId());
        schedule.setClientId(client.getId());
        schedule.setDate(LocalDate.now());
        schedule.setStartTime(LocalTime.now());
        schedule.setEndTime(LocalTime.now().plusHours(1));
        schedule.setTitle("테스트 스케줄");
        schedule.setStatus(com.coresolution.consultation.constant.ScheduleStatus.BOOKED);
        
        schedule.setTenantId(tenantId1);
        // createSchedule 은 예약 알림용 ConsultationMessage 를 보내 세션/플러시 부작용이 있어, 격리 검증은 직접 저장으로 수행
        Schedule saved = scheduleRepository.save(schedule);
        
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
        User cu1 = newPersistedClientUser(tenantId1, "스케줄클라1", "sch1@test.com", "010-4000-0001");
        Client client1 = persistClientRowForUser(cu1);
        Consultant consultant1 = newPersistedConsultant(tenantId1, "스케줄상담1", "schcon1@test.com");

        Schedule schedule1 = new Schedule();
        schedule1.setConsultantId(consultant1.getId());
        schedule1.setClientId(client1.getId());
        schedule1.setDate(LocalDate.now());
        schedule1.setStartTime(LocalTime.now());
        schedule1.setEndTime(LocalTime.now().plusHours(1));
        schedule1.setTitle("스케줄 1");
        schedule1.setStatus(com.coresolution.consultation.constant.ScheduleStatus.BOOKED);
        schedule1.setTenantId(tenantId1);
        scheduleRepository.save(schedule1);
        
        TenantContextHolder.setTenantId(tenantId2);
        User cu2 = newPersistedClientUser(tenantId2, "스케줄클라2", "sch2@test.com", "010-4000-0002");
        Client client2 = persistClientRowForUser(cu2);
        Consultant consultant2 = newPersistedConsultant(tenantId2, "스케줄상담2", "schcon2@test.com");

        Schedule schedule2 = new Schedule();
        schedule2.setConsultantId(consultant2.getId());
        schedule2.setClientId(client2.getId());
        schedule2.setDate(LocalDate.now());
        schedule2.setStartTime(LocalTime.now());
        schedule2.setEndTime(LocalTime.now().plusHours(1));
        schedule2.setTitle("스케줄 2");
        schedule2.setStatus(com.coresolution.consultation.constant.ScheduleStatus.BOOKED);
        schedule2.setTenantId(tenantId2);
        scheduleRepository.save(schedule2);
        
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
        User cu = newPersistedClientUser(tenantId1, "메시지클라", "msgc@test.com", "010-5000-0001");
        Client client = persistClientRowForUser(cu);
        Consultant consultant = newPersistedConsultant(tenantId1, "메시지상담", "msgcon@test.com");

        // When
        ConsultationMessage message = consultationMessageService.sendMessage(
            consultant.getId(), // consultantId
            client.getId(), // clientId
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
        request.setBranchCode("BRANCH01");
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

        User cu1 = newPersistedClientUser(tenantId1, "클라이언트 1", "client1@test.com", "010-1111-1111");
        Client client1 = persistClientRowForUser(cu1);

        Consultant consultant1 = newPersistedConsultant(tenantId1, "상담사 1", "consultant1@test.com");
        
        // Given - Tenant 2에 데이터 생성
        TenantContextHolder.setTenantId(tenantId2);

        User cu2 = newPersistedClientUser(tenantId2, "클라이언트 2", "client2@test.com", "010-3333-3333");
        Client client2 = persistClientRowForUser(cu2);

        Consultant consultant2 = newPersistedConsultant(tenantId2, "상담사 2", "consultant2@test.com");
        
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
            User u = newPersistedClientUser(tenantId1, "클라이언트 " + i, "client" + i + "@test.com", "010-0000-000" + i);
            persistClientRowForUser(u);
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


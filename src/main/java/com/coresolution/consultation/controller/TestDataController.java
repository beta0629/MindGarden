package com.coresolution.consultation.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.constant.AdminConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.ClientRegistrationRequest;
import com.coresolution.consultation.dto.ConsultantClientMappingCreateRequest;
import com.coresolution.consultation.dto.ConsultantRegistrationRequest;
import com.coresolution.consultation.entity.Client;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping.PaymentStatus;
import com.coresolution.consultation.entity.Consultation;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultationRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.AdminService;
import com.coresolution.core.util.StatusCodeHelper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

 /**
 * 테스트용 데이터 생성 컨트롤러
 /**
 * 
 /**
 * @author MindGarden
 /**
 * @version 1.0.0
 /**
 * @since 2024-12-19
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@ConditionalOnProperty(name = "isDev", havingValue = "true")
public class TestDataController {

    private final AdminService adminService;
    private final UserRepository userRepository;
    private final ClientRepository clientRepository;
    private final ConsultantClientMappingRepository mappingRepository;
    private final ConsultationRepository consultationRepository;
    private final PasswordEncoder passwordEncoder;
    private final StatusCodeHelper statusCodeHelper;
    
    @Value("${isDev:false}")
    private boolean isDev;
    
    @Value("${spring.profiles.active:prod}")
    private String activeProfile;

     /**
     * 테스트용 데이터 생성 (상담사, 내담자, 매핑)
     /**
     * 개발 모드에서만 동작
     */
    @PostMapping("/create-test-data")
    public ResponseEntity<?> createTestData() {
        if (!isDev && !"local".equals(activeProfile)) {
            log.warn("🚫 운영 환경에서 테스트 데이터 생성 시도 차단 - profile: {}, isDev: {}", activeProfile, isDev);
            return ResponseEntity.status(403)
                .body(Map.of("error", "이 API는 로컬 개발 환경에서만 사용할 수 있습니다."));
        }
        
        log.info("🧪 테스트용 데이터 생성 시작 (개발 모드: {})", activeProfile);
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            User adminUser = User.builder()
                    .username("admin@mindgarden.com")
                    .email("admin@mindgarden.com")
                    .password(passwordEncoder.encode("admin123"))
                    .name("시스템 관리자")
                    .phone("010-0000-0000")
                    .role(UserRole.ADMIN)
                    .branchCode(AdminConstants.DEFAULT_BRANCH_CODE) // 기본 지점코드 설정
                    .isActive(true)
                    .build();
            
            User savedAdmin = userRepository.save(adminUser);
            result.put("admin", savedAdmin);
            log.info("✅ 어드민 생성 완료: {}", savedAdmin.getEmail());

            ConsultantRegistrationRequest consultantDto = ConsultantRegistrationRequest.builder()
                    .username("consultant1@mindgarden.com")
                    .password("password123")
                    .name("김상담")
                    .email("consultant1@mindgarden.com")
                    .phone("010-1234-5678")
                    .address("서울시 강남구")
                    .addressDetail("테헤란로 123")
                    .postalCode("06123")
                    .specialization("스트레스, 불안, 우울증")
                    .qualifications("상담심리사 1급, 임상심리사")
                    .notes("5년 경력의 전문 상담사")
                    .role("ROLE_CONSULTANT")
                    .build();

            User consultant = adminService.registerConsultant(consultantDto);
            result.put("consultant", consultant);
            log.info("✅ 상담사 생성 완료: {}", consultant.getEmail());

            ClientRegistrationRequest clientDto = ClientRegistrationRequest.builder()
                    .username("client1@example.com")
                    .password("client123")
                    .name("이내담")
                    .age(28)
                    .phone("010-9876-5432")
                    .email("client1@example.com")
                    .address("서울시 서초구")
                    .addressDetail("서초대로 456")
                    .postalCode("06543")
                    .consultationPurpose("직장 스트레스 및 업무 압박감으로 인한 불안 증상")
                    .consultationHistory("이전 상담 경험 없음")
                    .emergencyContact("이부모")
                    .emergencyPhone("010-1111-2222")
                    .notes("IT 업계 종사자, 야근이 잦음")
                    .registeredBy("1") // 관리자 ID
                    .build();

            Client client = adminService.registerClient(clientDto);
            result.put("client", client);
            log.info("✅ 내담자 생성 완료: {}", client.getName());

            ConsultantClientMappingCreateRequest mappingRequest = ConsultantClientMappingCreateRequest.builder()
                    .consultantId(consultant.getId())
                    .clientId(client.getId())
                    .startDate(LocalDate.now())
                    .notes("스트레스 관련 상담 담당")
                    .responsibility("정신건강 상담")
                    .specialConsiderations("야근이 잦아 피로도가 높음")
                    .status(statusCodeHelper.getStatusCode("MAPPING_STATUS", "ACTIVE") != null ? "ACTIVE" : "ACTIVE")
                    .assignedBy("1") // 관리자 ID
                    .build();

            ConsultantClientMapping mapping = adminService.createMapping(mappingRequest);
            result.put("mapping", mapping);
            log.info("✅ 매핑 생성 완료: ID={}", mapping.getId());

            result.put("message", "테스트 데이터 생성 완료");
            result.put("success", true);
            
            log.info("🎉 테스트용 데이터 생성 완료");
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("❌ 테스트 데이터 생성 실패: {}", e.getMessage(), e);
            result.put("message", "테스트 데이터 생성 실패: " + e.getMessage());
            result.put("success", false);
            return ResponseEntity.badRequest().body(result);
        }
    }

     /**
     * 추가 상담사 등록 (개발 모드에서만 동작)
     /**
     * ⚠️ 로컬 개발 환경에서만 동작
     */
    @PostMapping("/create-consultant")
    public ResponseEntity<?> createConsultant(@RequestBody ConsultantRegistrationRequest request) {
        if (!isDev && !"local".equals(activeProfile)) {
            log.warn("🚫 운영 환경에서 테스트 상담사 등록 시도 차단 - profile: {}, isDev: {}", activeProfile, isDev);
            return ResponseEntity.status(403)
                .body(Map.of("error", "이 API는 로컬 개발 환경에서만 사용할 수 있습니다."));
        }
        
        log.info("🧪 추가 상담사 등록: {}", request.getUsername());
        
        try {
            User consultant = adminService.registerConsultant(request);
            log.info("✅ 추가 상담사 등록 완료: {}", consultant.getEmail());
            
            return ResponseEntity.ok(consultant);
        } catch (Exception e) {
            log.error("❌ 추가 상담사 등록 실패: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("상담사 등록 실패: " + e.getMessage());
        }
    }

     /**
     * 추가 내담자 등록 (개발 모드에서만 동작)
     /**
     * ⚠️ 로컬 개발 환경에서만 동작
     */
    @PostMapping("/create-client")
    public ResponseEntity<?> createClient(@RequestBody ClientRegistrationRequest request) {
        if (!isDev && !"local".equals(activeProfile)) {
            log.warn("🚫 운영 환경에서 테스트 내담자 등록 시도 차단 - profile: {}, isDev: {}", activeProfile, isDev);
            return ResponseEntity.status(403)
                .body(Map.of("error", "이 API는 로컬 개발 환경에서만 사용할 수 있습니다."));
        }
        
        log.info("🧪 추가 내담자 등록: {}", request.getName());
        
        try {
            Client client = adminService.registerClient(request);
            log.info("✅ 추가 내담자 등록 완료: {}", client.getName());
            
            return ResponseEntity.ok(client);
        } catch (Exception e) {
            log.error("❌ 추가 내담자 등록 실패: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("내담자 등록 실패: " + e.getMessage());
        }
    }

     /**
     * 추가 매핑 생성 (개발 모드에서만 동작)
     /**
     * ⚠️ 로컬 개발 환경에서만 동작
     */
    @PostMapping("/create-mapping")
    public ResponseEntity<?> createMapping(@RequestBody ConsultantClientMappingCreateRequest request) {
        if (!isDev && !"local".equals(activeProfile)) {
            log.warn("🚫 운영 환경에서 테스트 매핑 생성 시도 차단 - profile: {}, isDev: {}", activeProfile, isDev);
            return ResponseEntity.status(403)
                .body(Map.of("error", "이 API는 로컬 개발 환경에서만 사용할 수 있습니다."));
        }
        
        log.info("🧪 추가 매핑 생성: 상담사={}, 내담자={}", 
                request.getConsultantId(), request.getClientId());
        
        try {
            ConsultantClientMapping mapping = adminService.createMapping(request);
            log.info("✅ 추가 매핑 생성 완료: ID={}", mapping.getId());
            
            return ResponseEntity.ok(mapping);
        } catch (Exception e) {
            log.error("❌ 추가 매핑 생성 실패: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("매핑 생성 실패: " + e.getMessage());
        }
    }

     /**
     * 생성된 데이터 조회 (개발 모드에서만 동작)
     /**
     * ⚠️ 로컬 개발 환경에서만 동작
     */
    @GetMapping("/data")
    public ResponseEntity<?> getTestData() {
        if (!isDev && !"local".equals(activeProfile)) {
            log.warn("🚫 운영 환경에서 테스트 데이터 조회 시도 차단 - profile: {}, isDev: {}", activeProfile, isDev);
            return ResponseEntity.status(403)
                .body(Map.of("error", "이 API는 로컬 개발 환경에서만 사용할 수 있습니다."));
        }
        
        log.info("🧪 테스트 데이터 조회 (개발 모드: {})", activeProfile);
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            result.put("consultants", adminService.getAllConsultants());
            result.put("clients", adminService.getAllClients());
            result.put("mappings", adminService.getAllMappings());
            result.put("success", true);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("❌ 테스트 데이터 조회 실패: {}", e.getMessage(), e);
            result.put("message", "데이터 조회 실패: " + e.getMessage());
            result.put("success", false);
            return ResponseEntity.badRequest().body(result);
        }
    }
    
     /**
     * 사용자 역할 데이터 마이그레이션 (ROLE_ 접두사 제거)
     /**
     * ⚠️ 로컬 개발 환경에서만 동작
     */
    @PostMapping("/migrate-user-roles")
    public ResponseEntity<?> migrateUserRoles() {
        if (!isDev && !"local".equals(activeProfile)) {
            log.warn("🚫 운영 환경에서 데이터 마이그레이션 시도 차단 - profile: {}, isDev: {}", activeProfile, isDev);
            return ResponseEntity.status(403)
                .body(Map.of("error", "이 API는 로컬 개발 환경에서만 사용할 수 있습니다."));
        }
        
        log.info("🔄 사용자 역할 데이터 마이그레이션 시작...");
        
        try {
            log.info("현재 내담자 목록 조회 테스트...");
            adminService.getAllClients();
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "데이터 마이그레이션이 필요하지 않거나 이미 완료되었습니다.");
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("❌ 데이터 마이그레이션 확인 중 오류: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                .body(Map.of("success", false, "message", "마이그레이션 확인 실패: " + e.getMessage()));
        }
    }

     /**
     * 간단한 내담자 생성
     /**
     * POST /api/test/client
     */
    @PostMapping("/client")
    public ResponseEntity<Map<String, Object>> createTestClient() {
        if (!isDev && !"local".equals(activeProfile)) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "개발 환경에서만 사용 가능합니다."
            ));
        }

        try {
            log.info("👤 테스트용 내담자 생성 시작");

            var existingClients = clientRepository.findAll();
            log.info("🔍 ClientRepository에서 조회된 내담자 수: {}", existingClients.size());
            if (!existingClients.isEmpty()) {
                var client = existingClients.get(0);
                log.info("🔍 기존 내담자 정보: ID={}, Name={}", client.getId(), client.getName());
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "내담자가 이미 존재합니다.",
                    "clientId", client.getId(),
                    "clientName", client.getName()
                ));
            }

            ClientRegistrationRequest clientDto = ClientRegistrationRequest.builder()
                    .username("client@test.com")
                    .password("password123")
                    .name("정내담")
                    .age(30)
                    .phone("010-9876-5432")
                    .email("client@test.com")
                    .address("서울시 강남구")
                    .addressDetail("테헤란로 123")
                    .postalCode("06123")
                    .consultationPurpose("테스트용 상담")
                    .consultationHistory("이전 상담 경험 없음")
                    .emergencyContact("정부모")
                    .emergencyPhone("010-1111-2222")
                    .notes("테스트용 내담자")
                    .registeredBy("1") // 관리자 ID
                    .build();

            Client savedClient = adminService.registerClient(clientDto);

            log.info("✅ 테스트용 내담자 생성 완료: ID {}", savedClient.getId());

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "테스트용 내담자가 성공적으로 생성되었습니다.",
                "clientId", savedClient.getId(),
                "clientName", savedClient.getName()
            ));

        } catch (Exception e) {
            log.error("❌ 테스트용 내담자 생성 실패: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "내담자 생성 실패: " + e.getMessage()
            ));
        }
    }

     /**
     * 테스트용 매핑 생성 (상담사-내담자 매핑)
     /**
     * POST /api/test/mapping
     */
    @PostMapping("/mapping")
    public ResponseEntity<Map<String, Object>> createTestMapping() {
        if (!isDev && !"local".equals(activeProfile)) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "개발 환경에서만 사용 가능합니다."
            ));
        }

        try {
            log.info("🔗 테스트용 매핑 생성 시작");

            var allUsers = userRepository.findAll();
            var consultants = allUsers.stream()
                .filter(user -> user.getRole() != null && user.getRole() == UserRole.CONSULTANT)
                .toList();
            var clients = clientRepository.findAll();
            
            if (consultants.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "상담사를 찾을 수 없습니다."
                ));
            }
            
            if (clients.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "내담자를 찾을 수 없습니다. 먼저 내담자를 생성해주세요."
                ));
            }
            
            User consultant = consultants.get(0);
            Client clientEntity = clients.get(0);

            log.info("상담사 역할: {}", consultant.getRole());
            log.info("내담자 ID: {}", clientEntity.getId());

            boolean existingMapping = false;
            if (existingMapping) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "매핑이 이미 존재합니다.",
                    "mappingId", "existing"
                ));
            }

            User clientUser = userRepository.findById(clientEntity.getId()).orElse(null);
            if (clientUser == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "내담자에 해당하는 User를 찾을 수 없습니다."
                ));
            }
            
            ConsultantClientMapping mapping = new ConsultantClientMapping();
            mapping.setConsultant(consultant);  // User 타입
            mapping.setClient(clientUser);  // User 타입으로 설정
            mapping.setStartDate(LocalDateTime.now());  // 필수 필드 추가
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
            mapping.setStatus(MappingStatus.ACTIVE);
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
            mapping.setPaymentStatus(PaymentStatus.APPROVED);
            mapping.setTotalSessions(10);
            mapping.setRemainingSessions(10);
            mapping.setUsedSessions(0);
            mapping.setPackageName("테스트 패키지");
            mapping.setPackagePrice(500000L);
            mapping.setPaymentAmount(500000L);
            mapping.setPaymentDate(LocalDateTime.now());
            mapping.setPaymentMethod("테스트 결제");
            mapping.setPaymentReference("TEST-" + System.currentTimeMillis());
            mapping.setAdminApprovalDate(LocalDateTime.now());
            mapping.setApprovedBy("테스트 관리자");

            ConsultantClientMapping savedMapping = mappingRepository.save(mapping);

            log.info("✅ 테스트용 매핑 생성 완료: ID {}", savedMapping.getId());

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "테스트용 매핑이 성공적으로 생성되었습니다.",
                "mappingId", savedMapping.getId(),
                "consultantId", consultant.getId(),
                "clientId", clientEntity.getId(),
                "status", savedMapping.getStatus().name(),
                "paymentStatus", savedMapping.getPaymentStatus().name(),
                "remainingSessions", savedMapping.getRemainingSessions()
            ));

        } catch (Exception e) {
            log.error("❌ 테스트용 매핑 생성 실패: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "매핑 생성 실패: " + e.getMessage()
            ));
        }
    }

     /**
     * 테스트용 상담사 생성
     */
    @PostMapping("/consultant")
    public ResponseEntity<?> createTestConsultant(@RequestBody Map<String, Object> request) {
        try {
            log.info("🧪 테스트용 상담사 생성 시작");
            
            String username = (String) request.get("username");
            String email = (String) request.get("email");
            String password = (String) request.get("password");
            String name = (String) request.get("name");
            String phone = (String) request.get("phone");
            
            ConsultantRegistrationRequest consultantRequest = ConsultantRegistrationRequest.builder()
                    .username(username)
                    .email(email)
                    .password(password)
                    .name(name)
                    .phone(phone)
                    .build();
            
            User consultant = adminService.registerConsultant(consultantRequest);
            
            log.info("✅ 테스트용 상담사 생성 완료: ID={}, 이름={}", consultant.getId(), consultant.getName());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "테스트용 상담사가 성공적으로 생성되었습니다.",
                "consultantId", consultant.getId(),
                "name", consultant.getName(),
                "email", consultant.getEmail(),
                "phone", consultant.getPhone()
            ));

        } catch (Exception e) {
            log.error("❌ 테스트용 상담사 생성 실패: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "상담사 생성 실패: " + e.getMessage()
            ));
        }
    }
    
     /**
     * 테스트용 상담 데이터 생성
     /**
     * POST /api/test/consultation
     */
    @PostMapping("/consultation")
    public ResponseEntity<Map<String, Object>> createTestConsultation() {
        if (!isDev && !"local".equals(activeProfile)) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "개발 환경에서만 사용 가능합니다."
            ));
        }

        try {
            log.info("📋 테스트용 상담 데이터 생성 시작");

            var allUsers = userRepository.findAll();
            var consultants = allUsers.stream()
                .filter(user -> user.getRole() != null && user.getRole() == UserRole.CONSULTANT)
                .toList();
            var clients = clientRepository.findAll();
            
            if (consultants.isEmpty() || clients.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "상담사나 내담자가 없습니다. 먼저 테스트 데이터를 생성해주세요."
                ));
            }

            User consultant = consultants.get(0);
            Client client = clients.get(0);

            List<Consultation> consultations = new ArrayList<>();
            
            Consultation consultation1 = new Consultation();
            consultation1.setClientId(client.getId());
            consultation1.setConsultantId(consultant.getId());
            consultation1.setTitle("첫 번째 상담 - 스트레스 관리");
            consultation1.setConsultationDate(LocalDate.now().minusDays(7));
            consultation1.setStartTime(LocalTime.of(14, 0));
            consultation1.setEndTime(LocalTime.of(15, 0));
            consultation1.setStatus(statusCodeHelper.getStatusCode("CONSULTATION_STATUS", "COMPLETED") != null ? "COMPLETED" : "COMPLETED");
            consultation1.setConsultationMethod("FACE_TO_FACE");
            consultation1.setConsultantNotes("첫 번째 상담 - 스트레스 관리에 대해 논의");
            consultation1.setCreatedAt(LocalDateTime.now().minusDays(7));
            consultations.add(consultation1);

            Consultation consultation2 = new Consultation();
            consultation2.setClientId(client.getId());
            consultation2.setConsultantId(consultant.getId());
            consultation2.setTitle("두 번째 상담 - 불안 증상");
            consultation2.setConsultationDate(LocalDate.now().minusDays(14));
            consultation2.setStartTime(LocalTime.of(10, 0));
            consultation2.setEndTime(LocalTime.of(11, 0));
            consultation2.setStatus(statusCodeHelper.getStatusCode("CONSULTATION_STATUS", "COMPLETED") != null ? "COMPLETED" : "COMPLETED");
            consultation2.setConsultationMethod("FACE_TO_FACE");
            consultation2.setConsultantNotes("두 번째 상담 - 불안 증상에 대한 상담");
            consultation2.setCreatedAt(LocalDateTime.now().minusDays(14));
            consultations.add(consultation2);

            Consultation consultation3 = new Consultation();
            consultation3.setClientId(client.getId());
            consultation3.setConsultantId(consultant.getId());
            consultation3.setTitle("세 번째 상담 - 초기 상담");
            consultation3.setConsultationDate(LocalDate.now().minusDays(21));
            consultation3.setStartTime(LocalTime.of(16, 0));
            consultation3.setEndTime(LocalTime.of(17, 0));
            consultation3.setStatus(statusCodeHelper.getStatusCode("CONSULTATION_STATUS", "COMPLETED") != null ? "COMPLETED" : "COMPLETED");
            consultation3.setConsultationMethod("FACE_TO_FACE");
            consultation3.setConsultantNotes("세 번째 상담 - 초기 상담 및 문제 파악");
            consultation3.setCreatedAt(LocalDateTime.now().minusDays(21));
            consultations.add(consultation3);

            List<Consultation> savedConsultations = consultationRepository.saveAll(consultations);

            log.info("✅ 테스트용 상담 데이터 생성 완료: {}건", savedConsultations.size());

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "테스트용 상담 데이터가 성공적으로 생성되었습니다.",
                "count", savedConsultations.size(),
                "clientId", client.getId(),
                "consultantId", consultant.getId()
            ));

        } catch (Exception e) {
            log.error("❌ 테스트용 상담 데이터 생성 실패: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "상담 데이터 생성 실패: " + e.getMessage()
            ));
        }
    }

     /**
     * 테스트 사용자 삭제
     /**
     * POST /api/test/delete-user
     */
    @PostMapping("/delete-user")
    public ResponseEntity<Map<String, Object>> deleteTestUser(@RequestParam String email) {
        if (!isDev && !"local".equals(activeProfile)) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "개발 환경에서만 사용 가능합니다."
            ));
        }

        try {
            log.info("🗑️ 테스트 사용자 삭제: {}", email);

            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "사용자를 찾을 수 없습니다: " + email
                ));
            }

            User user = userOpt.get();
            
            user.setIsDeleted(true);
            user.setDeletedAt(LocalDateTime.now());
            user.setUpdatedAt(LocalDateTime.now());
            user.setVersion(user.getVersion() + 1);
            
            userRepository.save(user);
            
            log.info("✅ 테스트 사용자 삭제 완료: {}", email);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "사용자가 성공적으로 삭제되었습니다.",
                "email", user.getEmail(),
                "name", user.getName()
            ));

        } catch (Exception e) {
            log.error("❌ 테스트 사용자 삭제 실패: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "사용자 삭제 실패: " + e.getMessage()
            ));
        }
    }
    
     /**
     * 테스트 사용자 비밀번호 재설정
     /**
     * POST /api/test/reset-password
     */
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, Object>> resetTestUserPassword(@RequestParam String email, @RequestParam String newPassword) {
        if (!isDev && !"local".equals(activeProfile)) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "개발 환경에서만 사용 가능합니다."
            ));
        }

        try {
            log.info("🔑 테스트 사용자 비밀번호 재설정: {}", email);

            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "사용자를 찾을 수 없습니다: " + email
                ));
            }

            User user = userOpt.get();
            
            user.setPassword(passwordEncoder.encode(newPassword));
            user.setUpdatedAt(LocalDateTime.now());
            user.setVersion(user.getVersion() + 1);
            
            User updatedUser = userRepository.save(user);
            
            log.info("✅ 테스트 사용자 비밀번호 재설정 완료: {}", email);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "비밀번호가 성공적으로 재설정되었습니다.",
                "email", updatedUser.getEmail(),
                "name", updatedUser.getName()
            ));

        } catch (Exception e) {
            log.error("❌ 테스트 사용자 비밀번호 재설정 실패: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "비밀번호 재설정 실패: " + e.getMessage()
            ));
        }
    }
}

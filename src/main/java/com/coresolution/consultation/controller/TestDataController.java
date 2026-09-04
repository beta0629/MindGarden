package com.coresolution.consultation.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
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
import com.coresolution.consultation.util.EmailLogMasking;
import com.coresolution.core.security.PasswordService;
import com.coresolution.core.util.StatusCodeHelper;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 로컬 전용 테스트 데이터 생성 컨트롤러.
 *
 * <p>빈 등록은 {@code local} 프로필에서만 수행되며, 모든 엔드포인트는
 * {@link Environment#acceptsProfiles(String...)} 로 한 번 더 fail-closed 가드한다.
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@Profile("local")
public class TestDataController {

    private static final String LOCAL_PROFILE = "local";
    private static final String FORBIDDEN_MESSAGE = "이 API는 로컬 개발 환경에서만 사용할 수 있습니다.";
    private static final String EMAIL_EXISTS_MESSAGE = "이미 존재하는 이메일입니다. 비밀번호는 변경되지 않습니다.";

    /** 시드 계정 이메일 (create-test-data) */
    private static final String SEED_ADMIN_EMAIL = "admin@mindgarden.com";
    private static final String SEED_CONSULTANT_EMAIL = "consultant1@mindgarden.com";
    private static final String SEED_CLIENT_EMAIL = "client1@example.com";
    private static final String SEED_SIMPLE_CLIENT_EMAIL = "client@test.com";

    private static final String SEED_ADMIN_PASSWORD = "admin123";
    private static final String SEED_CONSULTANT_PASSWORD = "password123";
    private static final String SEED_CLIENT_PASSWORD = "client123";

    private final AdminService adminService;
    private final UserRepository userRepository;
    private final ClientRepository clientRepository;
    private final ConsultantClientMappingRepository mappingRepository;
    private final ConsultationRepository consultationRepository;
    private final PasswordService passwordService;
    private final StatusCodeHelper statusCodeHelper;
    private final Environment environment;

    /**
     * local 프로필이 아니면 403 본문을 반환한다. 통과 시 null.
     *
     * @return 403 ResponseEntity 또는 null
     */
    private ResponseEntity<Map<String, Object>> forbidUnlessLocal() {
        if (!environment.acceptsProfiles(LOCAL_PROFILE)) {
            log.warn("🚫 non-local profile에서 테스트 API 차단");
            return ResponseEntity.status(403)
                    .body(Map.of("error", FORBIDDEN_MESSAGE));
        }
        return null;
    }

    /**
     * 이메일로 기존 사용자가 있으면 첫 번째를 반환한다 (비밀번호 변경 없음).
     *
     * @param email 조회 이메일
     * @return 기존 사용자 Optional
     */
    private Optional<User> findExistingUserByEmail(String email) {
        List<User> users = userRepository.findAllByEmail(email);
        if (users == null || users.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(users.get(0));
    }

    /**
     * 테스트용 데이터 생성 (상담사, 내담자, 매핑).
     * 기존 seed 이메일이 있으면 재사용하며 비밀번호를 덮어쓰지 않는다.
     *
     * @return 생성/재사용 결과
     */
    @PostMapping("/create-test-data")
    public ResponseEntity<?> createTestData() {
        ResponseEntity<Map<String, Object>> forbidden = forbidUnlessLocal();
        if (forbidden != null) {
            return forbidden;
        }

        log.info("🧪 테스트용 데이터 생성 시작 (local 전용)");

        Map<String, Object> result = new HashMap<>();

        try {
            User admin = resolveOrCreateAdmin(result);
            User consultant = resolveOrCreateConsultant(result);
            Client client = resolveOrCreateClient(result);

            if (consultant == null || client == null) {
                result.put("message", "상담사 또는 내담자를 확보하지 못해 매핑을 건너뜁니다.");
                result.put("success", false);
                return ResponseEntity.badRequest().body(result);
            }

            ConsultantClientMappingCreateRequest mappingRequest = ConsultantClientMappingCreateRequest.builder()
                    .consultantId(consultant.getId())
                    .clientId(client.getId())
                    .startDate(LocalDate.now())
                    .notes("스트레스 관련 상담 담당")
                    .responsibility("정신건강 상담")
                    .specialConsiderations("야근이 잦아 피로도가 높음")
                    .status(statusCodeHelper.getStatusCode("MAPPING_STATUS", "ACTIVE") != null ? "ACTIVE" : "ACTIVE")
                    .assignedBy("1")
                    .build();

            ConsultantClientMapping mapping = adminService.createMapping(mappingRequest);
            result.put("mapping", mapping);
            log.info("✅ 매핑 생성 완료: ID={}", mapping.getId());

            result.put("message", "테스트 데이터 생성 완료");
            result.put("success", true);
            result.put("admin", admin);

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
     * 관리자 seed: 존재 시 재사용(비밀번호 미변경), 없을 때만 생성.
     *
     * @param result 응답 누적 맵
     * @return 관리자 User
     */
    private User resolveOrCreateAdmin(Map<String, Object> result) {
        Optional<User> existing = findExistingUserByEmail(SEED_ADMIN_EMAIL);
        if (existing.isPresent()) {
            User admin = existing.get();
            result.put("adminReused", true);
            log.info("✅ 기존 어드민 재사용 (비밀번호 미변경): {}", EmailLogMasking.maskForLog(admin.getEmail()));
            return admin;
        }

        User adminUser = User.builder()
                .userId(SEED_ADMIN_EMAIL)
                .email(SEED_ADMIN_EMAIL)
                .password(passwordService.encodeSecret(SEED_ADMIN_PASSWORD))
                .name("시스템 관리자")
                .phone("010-0000-0000")
                .role(UserRole.ADMIN)
                .branchCode(null)
                .isActive(true)
                .build();

        User savedAdmin = userRepository.save(adminUser);
        result.put("adminReused", false);
        log.info("✅ 어드민 생성 완료: {}", EmailLogMasking.maskForLog(savedAdmin.getEmail()));
        return savedAdmin;
    }

    /**
     * 상담사 seed: 존재 시 재사용(비밀번호 미변경), 없을 때만 등록.
     *
     * @param result 응답 누적 맵
     * @return 상담사 User
     */
    private User resolveOrCreateConsultant(Map<String, Object> result) {
        Optional<User> existing = findExistingUserByEmail(SEED_CONSULTANT_EMAIL);
        if (existing.isPresent()) {
            User consultant = existing.get();
            result.put("consultant", consultant);
            result.put("consultantReused", true);
            log.info("✅ 기존 상담사 재사용 (비밀번호 미변경): {}", EmailLogMasking.maskForLog(consultant.getEmail()));
            return consultant;
        }

        ConsultantRegistrationRequest consultantDto = ConsultantRegistrationRequest.builder()
                .userId(SEED_CONSULTANT_EMAIL)
                .password(SEED_CONSULTANT_PASSWORD)
                .name("김상담")
                .email(SEED_CONSULTANT_EMAIL)
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
        result.put("consultantReused", false);
        log.info("✅ 상담사 생성 완료: {}", EmailLogMasking.maskForLog(consultant.getEmail()));
        return consultant;
    }

    /**
     * 내담자 seed: User/Client 존재 시 재사용(비밀번호 미변경), 없을 때만 등록.
     *
     * @param result 응답 누적 맵
     * @return 내담자 Client (확보 실패 시 null)
     */
    private Client resolveOrCreateClient(Map<String, Object> result) {
        Optional<Client> existingClient = clientRepository.findByEmailAndIsDeletedFalse(SEED_CLIENT_EMAIL);
        if (existingClient.isPresent()) {
            Client client = existingClient.get();
            result.put("client", client);
            result.put("clientReused", true);
            log.info("✅ 기존 내담자 재사용 (비밀번호 미변경): {}", client.getName());
            return client;
        }

        Optional<User> existingUser = findExistingUserByEmail(SEED_CLIENT_EMAIL);
        if (existingUser.isPresent()) {
            result.put("clientReused", true);
            result.put("clientUserExistsWithoutClient", true);
            log.warn("⚠️ 내담자 이메일의 User는 있으나 Client 엔티티 없음 — 등록/비밀번호 변경 skip: {}",
                    EmailLogMasking.maskForLog(SEED_CLIENT_EMAIL));
            return null;
        }

        ClientRegistrationRequest clientDto = ClientRegistrationRequest.builder()
                .userId(SEED_CLIENT_EMAIL)
                .password(SEED_CLIENT_PASSWORD)
                .name("이내담")
                .age(28)
                .phone("010-9876-5432")
                .email(SEED_CLIENT_EMAIL)
                .address("서울시 서초구")
                .addressDetail("서초대로 456")
                .postalCode("06543")
                .consultationPurpose("직장 스트레스 및 업무 압박감으로 인한 불안 증상")
                .consultationHistory("이전 상담 경험 없음")
                .emergencyContact("이부모")
                .emergencyPhone("010-1111-2222")
                .notes("IT 업계 종사자, 야근이 잦음")
                .registeredBy("1")
                .build();

        Client client = adminService.registerClient(clientDto);
        result.put("client", client);
        result.put("clientReused", false);
        log.info("✅ 내담자 생성 완료: {}", client.getName());
        return client;
    }

    /**
     * 추가 상담사 등록 (local 전용). 이메일 존재 시 409 — 비밀번호 덮어쓰기 금지.
     *
     * @param request 상담사 등록 요청
     * @return 등록 결과
     */
    @PostMapping("/create-consultant")
    public ResponseEntity<?> createConsultant(@RequestBody ConsultantRegistrationRequest request) {
        ResponseEntity<Map<String, Object>> forbidden = forbidUnlessLocal();
        if (forbidden != null) {
            return forbidden;
        }

        log.info("🧪 추가 상담사 등록: {}", request.getUserId());

        try {
            if (request.getEmail() != null && findExistingUserByEmail(request.getEmail()).isPresent()) {
                return ResponseEntity.status(409).body(Map.of("error", EMAIL_EXISTS_MESSAGE));
            }
            User consultant = adminService.registerConsultant(request);
            log.info("✅ 추가 상담사 등록 완료: {}", EmailLogMasking.maskForLog(consultant.getEmail()));
            return ResponseEntity.ok(consultant);
        } catch (Exception e) {
            log.error("❌ 추가 상담사 등록 실패: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("상담사 등록 실패: " + e.getMessage());
        }
    }

    /**
     * 추가 내담자 등록 (local 전용). 이메일 존재 시 409 — 비밀번호 덮어쓰기 금지.
     *
     * @param request 내담자 등록 요청
     * @return 등록 결과
     */
    @PostMapping("/create-client")
    public ResponseEntity<?> createClient(@RequestBody ClientRegistrationRequest request) {
        ResponseEntity<Map<String, Object>> forbidden = forbidUnlessLocal();
        if (forbidden != null) {
            return forbidden;
        }

        log.info("🧪 추가 내담자 등록: {}", request.getName());

        try {
            if (request.getEmail() != null && findExistingUserByEmail(request.getEmail()).isPresent()) {
                return ResponseEntity.status(409).body(Map.of("error", EMAIL_EXISTS_MESSAGE));
            }
            Client client = adminService.registerClient(request);
            log.info("✅ 추가 내담자 등록 완료: {}", client.getName());
            return ResponseEntity.ok(client);
        } catch (Exception e) {
            log.error("❌ 추가 내담자 등록 실패: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("내담자 등록 실패: " + e.getMessage());
        }
    }

    /**
     * 추가 매핑 생성 (local 전용).
     *
     * @param request 매핑 생성 요청
     * @return 생성 결과
     */
    @PostMapping("/create-mapping")
    public ResponseEntity<?> createMapping(@RequestBody ConsultantClientMappingCreateRequest request) {
        ResponseEntity<Map<String, Object>> forbidden = forbidUnlessLocal();
        if (forbidden != null) {
            return forbidden;
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
     * 생성된 데이터 조회 (local 전용).
     *
     * @return 상담사/내담자/매핑 목록
     */
    @GetMapping("/data")
    public ResponseEntity<?> getTestData() {
        ResponseEntity<Map<String, Object>> forbidden = forbidUnlessLocal();
        if (forbidden != null) {
            return forbidden;
        }

        log.info("🧪 테스트 데이터 조회 (local 전용)");

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
     * 사용자 역할 데이터 마이그레이션 확인 (local 전용).
     *
     * @return 마이그레이션 확인 결과
     */
    @PostMapping("/migrate-user-roles")
    public ResponseEntity<?> migrateUserRoles() {
        ResponseEntity<Map<String, Object>> forbidden = forbidUnlessLocal();
        if (forbidden != null) {
            return forbidden;
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
     * 간단한 내담자 생성 (local 전용).
     *
     * @return 생성/재사용 결과
     */
    @PostMapping("/client")
    public ResponseEntity<Map<String, Object>> createTestClient() {
        ResponseEntity<Map<String, Object>> forbidden = forbidUnlessLocal();
        if (forbidden != null) {
            return forbidden;
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

            if (findExistingUserByEmail(SEED_SIMPLE_CLIENT_EMAIL).isPresent()) {
                return ResponseEntity.status(409).body(Map.of(
                        "success", false,
                        "error", EMAIL_EXISTS_MESSAGE
                ));
            }

            ClientRegistrationRequest clientDto = ClientRegistrationRequest.builder()
                    .userId(SEED_SIMPLE_CLIENT_EMAIL)
                    .password(SEED_CONSULTANT_PASSWORD)
                    .name("정내담")
                    .age(30)
                    .phone("010-9876-5432")
                    .email(SEED_SIMPLE_CLIENT_EMAIL)
                    .address("서울시 강남구")
                    .addressDetail("테헤란로 123")
                    .postalCode("06123")
                    .consultationPurpose("테스트용 상담")
                    .consultationHistory("이전 상담 경험 없음")
                    .emergencyContact("정부모")
                    .emergencyPhone("010-1111-2222")
                    .notes("테스트용 내담자")
                    .registeredBy("1")
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
     * 테스트용 매핑 생성 (local 전용).
     *
     * @return 생성 결과
     */
    @PostMapping("/mapping")
    public ResponseEntity<Map<String, Object>> createTestMapping() {
        ResponseEntity<Map<String, Object>> forbidden = forbidUnlessLocal();
        if (forbidden != null) {
            return forbidden;
        }

        try {
            log.info("🔗 테스트용 매핑 생성 시작");

            var allUsers = userRepository.findAll();
            var consultants = allUsers.stream()
                    .filter(user -> user.getRole() != null && user.getRole().isProfessionalProvider())
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

            String tenantId = consultant.getTenantId() != null ? consultant.getTenantId() : clientEntity.getTenantId();
            if (tenantId == null || tenantId.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "테넌트 ID를 확인할 수 없습니다."
                ));
            }
            User clientUser = userRepository.findByTenantIdAndId(tenantId, clientEntity.getId()).orElse(null);
            if (clientUser == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "내담자에 해당하는 User를 찾을 수 없습니다."
                ));
            }

            ConsultantClientMapping mapping = new ConsultantClientMapping();
            mapping.setConsultant(consultant);
            mapping.setClient(clientUser);
            mapping.setStartDate(LocalDateTime.now());
            mapping.setStatus(MappingStatus.ACTIVE);
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
     * 테스트용 상담사 생성 (local 전용). 이메일 존재 시 409.
     *
     * @param request 요청 맵
     * @return 생성 결과
     */
    @PostMapping("/consultant")
    public ResponseEntity<?> createTestConsultant(@RequestBody Map<String, Object> request) {
        ResponseEntity<Map<String, Object>> forbidden = forbidUnlessLocal();
        if (forbidden != null) {
            return forbidden;
        }

        try {
            log.info("🧪 테스트용 상담사 생성 시작");

            String userId = (String) request.get("userId");
            String email = (String) request.get("email");
            String password = (String) request.get("password");
            String name = (String) request.get("name");
            String phone = (String) request.get("phone");

            if (email != null && findExistingUserByEmail(email).isPresent()) {
                return ResponseEntity.status(409).body(Map.of(
                        "success", false,
                        "error", EMAIL_EXISTS_MESSAGE
                ));
            }

            ConsultantRegistrationRequest consultantRequest = ConsultantRegistrationRequest.builder()
                    .userId(userId)
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
     * 테스트용 상담 데이터 생성 (local 전용).
     *
     * @return 생성 결과
     */
    @PostMapping("/consultation")
    public ResponseEntity<Map<String, Object>> createTestConsultation() {
        ResponseEntity<Map<String, Object>> forbidden = forbidUnlessLocal();
        if (forbidden != null) {
            return forbidden;
        }

        try {
            log.info("📋 테스트용 상담 데이터 생성 시작");

            var allUsers = userRepository.findAll();
            var consultants = allUsers.stream()
                    .filter(user -> user.getRole() != null && user.getRole().isProfessionalProvider())
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
            consultation1.setStatus(statusCodeHelper.getStatusCode("CONSULTATION_STATUS", "COMPLETED") != null
                    ? "COMPLETED" : "COMPLETED");
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
            consultation2.setStatus(statusCodeHelper.getStatusCode("CONSULTATION_STATUS", "COMPLETED") != null
                    ? "COMPLETED" : "COMPLETED");
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
            consultation3.setStatus(statusCodeHelper.getStatusCode("CONSULTATION_STATUS", "COMPLETED") != null
                    ? "COMPLETED" : "COMPLETED");
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
}

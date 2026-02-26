package com.coresolution.consultation.controller;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import jakarta.validation.Valid;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.ClientRegistrationRequest;
import com.coresolution.consultation.dto.ConsultantClientMappingCreateRequest;
import com.coresolution.consultation.dto.ConsultantClientMappingResponse;
import com.coresolution.consultation.dto.ConsultantRegistrationRequest;
import com.coresolution.consultation.dto.ConsultantTransferRequest;
import com.coresolution.consultation.entity.Client;
// 표준화 2025-12-05: 역할 체크를 공통코드 기반 동적 조회로 변경 (COMMON_CODE_SYSTEM_STANDARD.md 준수)
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultationRecord;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.UserSocialAccountRepository;
import com.coresolution.consultation.service.AdminService;
import com.coresolution.consultation.service.BranchService;
import com.coresolution.consultation.service.ClientStatsService;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.ConsultantRatingService;
import com.coresolution.consultation.service.ConsultantStatsService;
import com.coresolution.consultation.service.ConsultationRecordService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.erp.ErpService;
import com.coresolution.consultation.service.erp.financial.FinancialTransactionService;
import com.coresolution.consultation.service.MenuService;
import com.coresolution.consultation.service.RealTimeStatisticsService;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.consultation.service.StoredProcedureService;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.util.PermissionCheckUtils;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.service.OnboardingService;
import com.coresolution.core.util.PaginationUtils;
import com.coresolution.core.util.StatusCodeHelper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin") // 표준화 2025-12-06: API 경로 표준화
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminController extends BaseApiController {

    private final AdminService adminService;
    private final BranchService branchService;
    private final ScheduleService scheduleService;
    private final ConsultationRecordService consultationRecordService;
    private final DynamicPermissionService dynamicPermissionService;
    private final MenuService menuService;
    private final FinancialTransactionService financialTransactionService;
    private final ErpService erpService;
    private final ConsultantRatingService consultantRatingService;
    private final UserSocialAccountRepository userSocialAccountRepository;
    private final UserService userService;
    private final StoredProcedureService storedProcedureService;
    private final PersonalDataEncryptionUtil personalDataEncryptionUtil;
    private final UserPersonalDataCacheService userPersonalDataCacheService;
    private final ConsultantStatsService consultantStatsService;
    private final ClientStatsService clientStatsService;
    private final CommonCodeService commonCodeService;
    private final StatusCodeHelper statusCodeHelper;
    private final OnboardingService onboardingService;
    private final RealTimeStatisticsService realTimeStatisticsService;
    private final UserRepository userRepository;

    /**
     * /** 상담사 통계 정보 조회 (캐시 사용) /** GET /api/admin/consultants/with-stats/{id}
     */
    @GetMapping("/consultants/with-stats/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getConsultantWithStats(
            @PathVariable Long id) {
        log.info("📊 상담사 통계 조회 API 호출: consultantId={}", id);

        Map<String, Object> stats = consultantStatsService.getConsultantWithStats(id);

        return success(stats);
    }

    /**
     * /** 전체 상담사 통계 정보 조회 (테넌트별 필터링) /** GET /api/admin/consultants/with-stats
     */
    @GetMapping("/consultants/with-stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllConsultantsWithStats(
            HttpSession session) {
        log.info("📊 전체 상담사 통계 조회 API 호출");

        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            log.error("❌ 로그인이 필요합니다. 세션: {}", session != null ? session.getId() : "null");
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }

        // 표준화 원칙: TenantContextHolder에 이미 설정된 tenantId 우선 사용 (TenantContextFilter에서 설정됨)
        // 없으면 SessionUtils.getTenantId() 사용 (세션 → User 객체 순서로 확인)
        // ⚠️ tenantId는 필수 값입니다. 없으면 보안 위험 (다른 테넌트 데이터 접근 가능)
        String tenantId = com.coresolution.core.context.TenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.isEmpty()) {
            // TenantContextHolder에 없으면 SessionUtils에서 조회
            tenantId = SessionUtils.getTenantId(session);
        }

        if (tenantId == null || tenantId.isEmpty()) {
            log.error("❌ [보안 오류] tenantId가 필수입니다. 사용자 ID: {}, 이메일: {}, 역할: {}", currentUser.getId(),
                    currentUser.getEmail(), currentUser.getRole());
            log.error("❌ User 객체의 tenantId: {}", currentUser.getTenantId());
            log.error("❌ TenantContextHolder의 tenantId: {}",
                    com.coresolution.core.context.TenantContextHolder.getTenantId());
            log.error("❌ 세션 정보 확인: sessionId={}, 세션 tenantId={}",
                    session != null ? session.getId() : "null",
                    session != null ? session.getAttribute(
                            com.coresolution.consultation.constant.SessionConstants.TENANT_ID)
                            : "null");

            // tenantId는 필수 값이므로 에러 반환
            String errorMessage = String.format(
                    "테넌트 정보가 없습니다. 사용자 ID: %d, 역할: %s. 관리자에게 문의하세요. (보안상 tenantId는 필수입니다.)",
                    currentUser.getId(), currentUser.getRole());
            throw new IllegalArgumentException(errorMessage);
        }

        log.info("🔍 현재 사용자 정보: userId={}, tenantId={}, 역할={}", currentUser.getId(), tenantId,
                currentUser.getRole());

        // TenantContextHolder에 tenantId 설정 (서비스에서 getRequiredTenantId() 사용을 위해)
        // 이미 설정되어 있을 수 있지만, 명시적으로 다시 설정하여 보장
        com.coresolution.core.context.TenantContextHolder.setTenantId(tenantId);

        List<Map<String, Object>> filteredStats =
                consultantStatsService.getAllConsultantsWithStatsByTenant(tenantId);
        log.info("📊 테넌트별 상담사 조회: tenantId={}, 조회된 수={}", tenantId, filteredStats.size());

        Map<String, Object> data = new HashMap<>();
        data.put("consultants", filteredStats);
        data.put("count", filteredStats.size());

        return success(data);
    }

    /**
     * /** 내담자 통계 정보 조회 (캐시 사용) /** GET /api/admin/clients/with-stats/{id}
     */
    @GetMapping("/clients/with-stats/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getClientWithStats(
            @PathVariable Long id) {
        log.info("📊 내담자 통계 조회 API 호출: clientId={}", id);

        Map<String, Object> stats = clientStatsService.getClientWithStats(id);

        return success(stats);
    }

    /**
     * /** 전체 내담자 통계 정보 조회 (캐시 사용 + 지점별 필터링) /** GET /api/admin/clients/with-stats
     */
    @GetMapping("/clients/with-stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllClientsWithStats(
            HttpSession session) {
        log.info("📊 전체 내담자 통계 조회 API 호출");

        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }

        // 표준화 원칙: SessionUtils.getTenantId() 사용 (세션 → User 객체 순서로 확인)
        String tenantId = SessionUtils.getTenantId(session);
        if (tenantId == null || tenantId.isEmpty()) {
            log.error("❌ tenantId가 필수입니다. 사용자 ID: {}, 이메일: {}, 역할: {}", currentUser.getId(),
                    currentUser.getEmail(), currentUser.getRole());
            String errorMessage = String.format("테넌트 정보가 없습니다. 사용자 ID: %d, 역할: %s. 관리자에게 문의하세요.",
                    currentUser.getId(), currentUser.getRole());
            throw new IllegalArgumentException(errorMessage);
        }

        log.info("🔍 현재 사용자 정보: tenantId={}, 역할={}", tenantId, currentUser.getRole());

        // TenantContextHolder에 tenantId 설정 (서비스에서 getRequiredTenantId() 사용을 위해)
        com.coresolution.core.context.TenantContextHolder.setTenantId(tenantId);

        List<Map<String, Object>> filteredStats =
                clientStatsService.getAllClientsWithStatsByTenant(tenantId);
        log.info("📊 테넌트별 내담자 조회: tenantId={}, 조회된 수={}", tenantId, filteredStats.size());

        Map<String, Object> data = new HashMap<>();
        data.put("clients", filteredStats);
        data.put("count", filteredStats.size());

        return success(data);
    }

    /**
     * /** 회기관리 통계 조회
     */
    @GetMapping("/sessions/statistics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSessionStatistics(
            HttpSession session) {
        log.info("🔍 회기관리 통계 조회");

        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(session,
                "MAPPING_MANAGE", dynamicPermissionService);
        if (permissionResponse != null) {
            throw new org.springframework.security.access.AccessDeniedException("권한이 없습니다.");
        }

        Map<String, Object> statistics = adminService.getSessionStatistics();

        return success(statistics);
    }

    /**
     * /** 회기관리 목록 조회
     */
    @GetMapping("/sessions")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSessions(HttpSession session) {
        log.info("🔍 회기관리 목록 조회");

        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(session,
                "MAPPING_MANAGE", dynamicPermissionService);
        if (permissionResponse != null) {
            throw new org.springframework.security.access.AccessDeniedException("권한이 없습니다.");
        }

        List<Map<String, Object>> sessions = adminService.getSessions();

        Map<String, Object> data = new HashMap<>();
        data.put("sessions", sessions);
        data.put("count", sessions.size());

        return success(data);
    }

    /**
     * /** 상담사 목록 조회 (전문분야 상세 정보 포함)
     */
    @GetMapping("/consultants")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllConsultants(HttpSession session) {
        log.info("🔍 상담사 목록 조회");

        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(session,
                "CONSULTANT_MANAGE", dynamicPermissionService);
        if (permissionResponse != null) {
            throw new org.springframework.security.access.AccessDeniedException("권한이 없습니다.");
        }

        User currentUser = SessionUtils.getCurrentUser(session);

        log.info("🔍 상담사 조회 권한 확인 완료: role={}", currentUser.getRole());

        // 표준화 원칙: SessionUtils.getTenantId() 사용
        String tenantId = SessionUtils.getTenantId(session);
        log.info("🔍 현재 사용자 tenantId: {}, 역할: {}", tenantId, currentUser.getRole());

        List<Map<String, Object>> consultantsWithSpecialty =
                adminService.getAllConsultantsWithSpecialty();
        log.info("📊 상담사 조회 완료: 조회된 수={}", consultantsWithSpecialty.size());

        Map<String, Object> data = new HashMap<>();
        data.put("consultants", consultantsWithSpecialty);
        data.put("count", consultantsWithSpecialty.size());

        return success(data);
    }

    /**
     * /** 휴무 정보를 포함한 상담사 목록 조회 (관리자 스케줄링용)
     */
    @GetMapping("/consultants/with-vacation")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllConsultantsWithVacationInfo(
            @RequestParam String date, HttpSession session) {
        log.info("🔍 휴무 정보를 포함한 상담사 목록 조회: date={}", date);

        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }

        // 표준화 원칙: SessionUtils.getTenantId() 사용 (세션 → User 객체 순서로 확인)
        String tenantId = SessionUtils.getTenantId(session);
        if (tenantId == null || tenantId.isEmpty()) {
            log.error("❌ tenantId가 필수입니다. 사용자 ID: {}, 이메일: {}, 역할: {}", currentUser.getId(),
                    currentUser.getEmail(), currentUser.getRole());
            String errorMessage = String.format("테넌트 정보가 없습니다. 사용자 ID: %d, 역할: %s. 관리자에게 문의하세요.",
                    currentUser.getId(), currentUser.getRole());
            throw new IllegalArgumentException(errorMessage);
        }

        log.info("🔍 현재 사용자 정보: userId={}, tenantId={}, 역할={}", currentUser.getId(), tenantId,
                currentUser.getRole());

        // TenantContextHolder에 tenantId 설정 (서비스에서 getTenantId() 사용을 위해)
        com.coresolution.core.context.TenantContextHolder.setTenantId(tenantId);

        List<Map<String, Object>> consultantsWithVacation =
                adminService.getAllConsultantsWithVacationInfo(date);
        log.info("📊 휴무 정보를 포함한 상담사 조회 완료: 조회된 수={}", consultantsWithVacation.size());

        Map<String, Object> data = new HashMap<>();
        data.put("consultants", consultantsWithVacation);
        data.put("count", consultantsWithVacation.size());

        return success(data);
    }

    /**
     * /** 상담사별 휴가 통계 조회
     */
    @GetMapping("/vacation-statistics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getConsultantVacationStats(
            @RequestParam(defaultValue = "month") String period, HttpSession session) {
        log.info("📊 상담사별 휴가 통계 조회: period={}", period);

        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            log.error("❌ 로그인된 사용자 정보가 없습니다");
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }

        // 표준화 원칙: SessionUtils.getTenantId() 사용 (세션 → User 객체 순서로 확인)
        String tenantId = SessionUtils.getTenantId(session);
        if (tenantId == null || tenantId.isEmpty()) {
            log.error("❌ tenantId가 필수입니다. 사용자 ID: {}, 이메일: {}, 역할: {}", currentUser.getId(),
                    currentUser.getEmail(), currentUser.getRole());
            String errorMessage = String.format("테넌트 정보가 없습니다. 사용자 ID: %d, 역할: %s. 관리자에게 문의하세요.",
                    currentUser.getId(), currentUser.getRole());
            throw new IllegalArgumentException(errorMessage);
        }

        log.info("👤 현재 사용자 정보: userId={}, tenantId={}, 역할={}", currentUser.getId(), tenantId,
                currentUser.getRole());

        // TenantContextHolder에 tenantId 설정 (서비스에서 getTenantIdOrNull() 사용을 위해)
        com.coresolution.core.context.TenantContextHolder.setTenantId(tenantId);

        Map<String, Object> vacationStats = adminService.getConsultantVacationStats(period);
        log.info("📊 상담사 휴무 통계 조회 완료");

        return success(vacationStats);
    }

    /**
     * /** 내담자 목록 조회
     */
    @GetMapping("/clients")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllClients(HttpSession session) {
        log.info("🔍 내담자 목록 조회");

        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(session,
                "CLIENT_MANAGE", dynamicPermissionService);
        if (permissionResponse != null) {
            throw new org.springframework.security.access.AccessDeniedException("권한이 없습니다.");
        }

        User currentUser = SessionUtils.getCurrentUser(session);
        // 표준화 원칙: SessionUtils.getTenantId() 사용
        String tenantId = SessionUtils.getTenantId(session);
        log.info("🔍 현재 사용자 tenantId: {}", tenantId);

        List<Client> clients = adminService.getAllClients();
        log.info("📊 내담자 목록 조회 완료: 조회된 수={}", clients.size());

        Map<String, Object> data = new HashMap<>();
        data.put("clients", clients);
        data.put("count", clients.size());

        return success(data);
    }

    /**
     * /** 통합 내담자 데이터 조회 (매칭 정보, 결제 상태, 남은 세션 등 포함)
     */
    @GetMapping("/clients/with-mapping-info")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllClientsWithMappingInfo(
            HttpSession session) {
        log.info("🔍 통합 내담자 데이터 조회");

        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }

        // 표준화 원칙: SessionUtils.getTenantId() 사용 (세션 → User 객체 순서로 확인)
        String tenantId = SessionUtils.getTenantId(session);
        if (tenantId == null || tenantId.isEmpty()) {
            log.error("❌ tenantId가 필수입니다. 사용자 ID: {}, 이메일: {}, 역할: {}", currentUser.getId(),
                    currentUser.getEmail(), currentUser.getRole());
            String errorMessage = String.format("테넌트 정보가 없습니다. 사용자 ID: %d, 역할: %s. 관리자에게 문의하세요.",
                    currentUser.getId(), currentUser.getRole());
            throw new IllegalArgumentException(errorMessage);
        }

        log.info("🔍 현재 사용자 정보: userId={}, tenantId={}, 역할={}", currentUser.getId(), tenantId,
                currentUser.getRole());

        // TenantContextHolder에 tenantId 설정 (서비스에서 getTenantId() 사용을 위해)
        com.coresolution.core.context.TenantContextHolder.setTenantId(tenantId);

        // 표준화 2025-12-08: Service 레이어에서 이미 tenantId 기반으로 필터링됨
        List<Map<String, Object>> clientsWithMappingInfo =
                adminService.getAllClientsWithMappingInfo();

        log.info("🔍 통합 내담자 데이터 조회 완료 - 전체: {}, tenantId: {}", clientsWithMappingInfo.size(),
                tenantId);

        Map<String, Object> data = new HashMap<>();
        data.put("clients", clientsWithMappingInfo);
        data.put("count", clientsWithMappingInfo.size());

        return success(data);
    }

    /**
     * /** 상담사별 매칭된 내담자 목록 조회 (스케줄 등록용)
     */
    @GetMapping("/mappings/consultant/{consultantId}/clients")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getClientsByConsultantMapping(
            @PathVariable Long consultantId, HttpSession session) {
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(session,
                "MAPPING_VIEW", dynamicPermissionService);
        if (permissionResponse != null) {
            throw new org.springframework.security.access.AccessDeniedException("권한이 없습니다.");
        }

        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            log.warn("❌ 세션에서 사용자 정보를 찾을 수 없습니다");
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다");
        }

        User fullUser = userService.findByEmail(currentUser.getEmail())
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        currentUser = fullUser; // Update currentUser with the fully loaded object

        log.info("🔍 현재 사용자 정보 - ID: {}, 이메일: {}, 역할: {}, 브랜치코드: {}", currentUser.getId(),
                currentUser.getEmail(), currentUser.getRole(), currentUser.getBranchCode());

        String currentBranchCode = currentUser.getBranchCode();
        if (currentBranchCode != null) {
            log.info("🔧 사용자 정보에서 브랜치 코드 가져옴 (레거시 호환): {}", currentBranchCode);
        }

        if (currentBranchCode == null) {
            log.info("🔧 브랜치 코드가 없지만 상담사 매칭 조회는 계속 진행");
        }

        log.info("🔍 상담사별 매칭된 내담자 목록 조회 - 상담사 ID: {}", consultantId);

        User targetConsultant = userService.findById(consultantId)
                .orElseThrow(() -> new RuntimeException("상담사를 찾을 수 없습니다: " + consultantId));

        List<ConsultantClientMapping> mappings =
                adminService.getMappingsByConsultantEmail(targetConsultant.getEmail());

        log.info("🔍 조회된 전체 매칭 수: {}", mappings.size());
        for (ConsultantClientMapping m : mappings) {
            log.info("🔍 매칭 상세 - ID: {}, 결제상태: {}, 상태: {}", 
                    m.getId(), m.getPaymentStatus(), m.getStatus());
        }

        List<Map<String, Object>> activeMappings = mappings.stream()
                .filter(mapping -> {
                    // 표준화 2025-12-08: 필터링 로직 개선 - 모든 활성 매핑 포함
                    boolean isActive = mapping.getStatus() != ConsultantClientMapping.MappingStatus.TERMINATED;
                    boolean hasValidPaymentStatus = mapping.getPaymentStatus() != null
                            && (statusCodeHelper.isStatus("PAYMENT_STATUS",
                                    mapping.getPaymentStatus().toString(), "APPROVED")
                                    || statusCodeHelper.isStatus("PAYMENT_STATUS",
                                            mapping.getPaymentStatus().toString(), "PENDING"));
                    
                    boolean included = isActive && hasValidPaymentStatus;
                    if (!included) {
                        log.debug("🔍 매칭 필터링 제외 - ID: {}, 결제상태: {}, 상태: {}, isActive: {}, hasValidPaymentStatus: {}", 
                                mapping.getId(), mapping.getPaymentStatus(), mapping.getStatus(), isActive, hasValidPaymentStatus);
                    }
                    return included;
                })
                .map(mapping -> {
                    Map<String, Object> data = new java.util.HashMap<>();
                    try {
                        data.put("id", mapping.getId());

                        // 표준화 2025-12-08: 개인정보 복호화 (캐시 활용)
                        if (mapping.getClient() != null) {
                            Map<String, String> decryptedClient = userPersonalDataCacheService
                                    .getDecryptedUserData(mapping.getClient());
                            String clientName =
                                    decryptedClient != null ? decryptedClient.get("name")
                                            : mapping.getClient().getName();
                            String clientEmail =
                                    decryptedClient != null ? decryptedClient.get("email")
                                            : mapping.getClient().getEmail();
                            String clientPhone =
                                    decryptedClient != null ? decryptedClient.get("phone")
                                            : mapping.getClient().getPhone();

                            data.put("client",
                                    Map.of("id", mapping.getClient().getId(), "name",
                                            clientName != null ? clientName : "", "email",
                                            clientEmail != null ? clientEmail : "", "phone",
                                            clientPhone != null ? clientPhone : "", "status",
                                            statusCodeHelper.getStatusCode("MAPPING_STATUS",
                                                    "ACTIVE") != null ? "ACTIVE" : "ACTIVE", // Client
                                                                                             // 엔티티에
                                                                                             // status
                                                                                             // 필드가
                                                                                             // 없으므로
                                                                                             // 기본값
                                                                                             // 사용
                                            "createdAt",
                                            mapping.getClient().getCreatedAt() != null
                                                    ? mapping.getClient().getCreatedAt().toString()
                                                    : ""));
                        }

                        data.put("totalSessions", mapping.getTotalSessions());
                        data.put("usedSessions", mapping.getUsedSessions());
                        data.put("remainingSessions", mapping.getRemainingSessions());
                        data.put("packageName", mapping.getPackageName());
                        data.put("packagePrice", mapping.getPackagePrice());
                        data.put("paymentStatus", mapping.getPaymentStatus().toString());
                        data.put("paymentMethod", mapping.getPaymentMethod());
                        data.put("paymentReference", mapping.getPaymentReference());
                        data.put("paymentDate", mapping.getPaymentDate());
                        data.put("mappingId", mapping.getId());
                        data.put("startDate", mapping.getStartDate());
                        data.put("endDate", mapping.getEndDate());
                        data.put("status", mapping.getStatus());
                        data.put("createdAt", mapping.getCreatedAt());
                        data.put("assignedAt", mapping.getAssignedAt());
                    } catch (Exception e) {
                        log.warn("매칭 ID {} 정보 추출 실패: {}", mapping.getId(), e.getMessage());
                    }
                    return data;
                }).collect(java.util.stream.Collectors.toList());

        log.info("🔍 필터링 후 활성 매칭 수: {} (전체: {})", activeMappings.size(), mappings.size());
        if (activeMappings.isEmpty() && !mappings.isEmpty()) {
            log.warn("⚠️ 매칭 데이터가 있지만 필터링으로 인해 모두 제외되었습니다. 결제상태를 확인하세요.");
        }

        Map<String, Object> data = new HashMap<>();
        data.put("mappings", activeMappings);
        data.put("count", activeMappings.size());

        return success(data);
    }

    /**
     * /** 내담자별 매칭 조회
     */
    @GetMapping("/mappings/client")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMappingsByClient(
            @RequestParam Long clientId) {
        log.info("🔍 내담자별 매칭 조회: 내담자 ID={}", clientId);
        List<ConsultantClientMapping> mappings = adminService.getMappingsByClient(clientId);

        List<Map<String, Object>> mappingData = mappings.stream().map(mapping -> {
            Map<String, Object> mappingInfo = new HashMap<>();
            mappingInfo.put("id", mapping.getId());
            mappingInfo.put("totalSessions", mapping.getTotalSessions());
            mappingInfo.put("usedSessions", mapping.getUsedSessions());
            mappingInfo.put("remainingSessions", mapping.getRemainingSessions());
            mappingInfo.put("packageName", mapping.getPackageName());
            mappingInfo.put("packagePrice", mapping.getPackagePrice());
            mappingInfo.put("paymentStatus", mapping.getPaymentStatus());
            mappingInfo.put("paymentMethod", mapping.getPaymentMethod());
            mappingInfo.put("paymentReference", mapping.getPaymentReference());
            mappingInfo.put("paymentDate", mapping.getPaymentDate());
            mappingInfo.put("status", mapping.getStatus());
            mappingInfo.put("createdAt", mapping.getCreatedAt());
            mappingInfo.put("assignedAt", mapping.getAssignedAt());

            // 표준화 2025-12-08: 개인정보 복호화 (캐시 활용)
            if (mapping.getConsultant() != null) {
                Map<String, Object> consultantInfo = new HashMap<>();
                consultantInfo.put("consultantId", mapping.getConsultant().getId());

                Map<String, String> decryptedConsultant =
                        userPersonalDataCacheService.getDecryptedUserData(mapping.getConsultant());
                String consultantName =
                        decryptedConsultant != null ? decryptedConsultant.get("name")
                                : mapping.getConsultant().getName();
                consultantInfo.put("consultantName",
                        consultantName != null ? consultantName : "알 수 없음");
                consultantInfo.put("specialty", mapping.getConsultant().getSpecialization());
                consultantInfo.put("intro", "전문적이고 따뜻한 상담을 제공합니다.");
                consultantInfo.put("profileImage", null);
                mappingInfo.put("consultant", consultantInfo);
            }

            return mappingInfo;
        }).collect(java.util.stream.Collectors.toList());

        Map<String, Object> data = new HashMap<>();
        data.put("mappings", mappingData);
        data.put("count", mappingData.size());

        return success("내담자별 매칭 조회 성공", data);
    }

    /**
     * /** 매칭 통계 정보 조회 (위젯용) /** GET /api/admin/mappings/stats
     */
    @GetMapping("/mappings/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMappingStats(HttpSession session) {
        log.info("📊 매칭 통계 조회 API 호출");

        try {
            ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(session,
                    "MAPPING_VIEW", dynamicPermissionService);
            if (permissionResponse != null) {
                throw new org.springframework.security.access.AccessDeniedException("권한이 없습니다.");
            }

            List<ConsultantClientMapping> mappings = adminService.getAllMappings();

            long totalMappings = mappings.size();
            long activeMappings = mappings.stream()
                    .filter(m -> statusCodeHelper.isStatus("MAPPING_STATUS",
                            m.getStatus() != null ? m.getStatus().toString() : "", "ACTIVE"))
                    .count();
            long completedMappings = mappings.stream()
                    .filter(m -> statusCodeHelper.isStatus("MAPPING_STATUS",
                            m.getStatus() != null ? m.getStatus().toString() : "", "COMPLETED"))
                    .count();
            long pendingMappings = mappings.stream()
                    .filter(m -> statusCodeHelper.isStatus("MAPPING_STATUS",
                            m.getStatus() != null ? m.getStatus().toString() : "", "PENDING"))
                    .count();

            Map<String, Object> stats = new java.util.HashMap<>();
            stats.put("totalMappings", totalMappings);
            stats.put("activeMappings", activeMappings);
            stats.put("completedMappings", completedMappings);
            stats.put("pendingMappings", pendingMappings);
            stats.put("lastUpdated", java.time.LocalDateTime.now());

            log.info("📊 매칭 통계 조회 완료: 전체={}, 활성={}, 완료={}, 대기={}", totalMappings, activeMappings,
                    completedMappings, pendingMappings);

            return success(stats);

        } catch (Exception e) {
            log.error("❌ 매칭 통계 조회 실패", e);
            Map<String, Object> errorData = new java.util.HashMap<>();
            errorData.put("error", "매칭 통계 조회에 실패했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("매칭 통계 조회에 실패했습니다", errorData));
        }
    }

    /**
     * /** 오늘의 통계 조회 (위젯용) /** GET /api/admin/today-stats
     */
    @GetMapping("/today-stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTodayStats(HttpSession session) {
        log.info("📊 오늘의 통계 조회 API 호출");

        try {
            ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(session,
                    "DASHBOARD_VIEW", dynamicPermissionService);
            if (permissionResponse != null) {
                throw new org.springframework.security.access.AccessDeniedException("권한이 없습니다.");
            }

            User currentUser = SessionUtils.getCurrentUser(session);
            // 표준화 원칙: SessionUtils.getTenantId() 사용 (세션 → User 객체 → TenantContextHolder 순서)
            String tenantId = SessionUtils.getTenantId(session);
            if (tenantId == null) {
                tenantId = com.coresolution.core.context.TenantContextHolder.getTenantId();
            }

            java.time.LocalDate today = java.time.LocalDate.now();
            java.time.LocalDate weekAgo = today.minusDays(7);

            // 오늘의 통계
            List<com.coresolution.consultation.entity.Schedule> todaySchedules =
                    scheduleService.getSchedulesByDate(today, null);

            long totalToday = todaySchedules.size();
            long completedToday = todaySchedules.stream()
                    .filter(s -> statusCodeHelper.isStatus("SCHEDULE_STATUS",
                            s.getStatus() != null ? s.getStatus().toString() : "", "COMPLETED"))
                    .count();
            long inProgressToday = todaySchedules.stream()
                    .filter(s -> statusCodeHelper.isStatus("SCHEDULE_STATUS",
                            s.getStatus() != null ? s.getStatus().toString() : "", "IN_PROGRESS"))
                    .count();
            long cancelledToday = todaySchedules.stream()
                    .filter(s -> statusCodeHelper.isStatus("SCHEDULE_STATUS",
                            s.getStatus() != null ? s.getStatus().toString() : "", "CANCELLED"))
                    .count();
            long bookedToday = todaySchedules.stream()
                    .filter(s -> statusCodeHelper.isStatus("SCHEDULE_STATUS",
                            s.getStatus() != null ? s.getStatus().toString() : "", "BOOKED"))
                    .count();

            // 지난 주 동일 요일 통계 (증가율 계산용)
            java.time.LocalDate lastWeekSameDay = today.minusDays(7);
            List<com.coresolution.consultation.entity.Schedule> lastWeekSchedules =
                    scheduleService.getSchedulesByDate(lastWeekSameDay, null);

            long lastWeekTotal = lastWeekSchedules.size();
            long lastWeekCompleted = lastWeekSchedules.stream()
                    .filter(s -> statusCodeHelper.isStatus("SCHEDULE_STATUS",
                            s.getStatus() != null ? s.getStatus().toString() : "", "COMPLETED"))
                    .count();
            long lastWeekBooked = lastWeekSchedules.stream()
                    .filter(s -> statusCodeHelper.isStatus("SCHEDULE_STATUS",
                            s.getStatus() != null ? s.getStatus().toString() : "", "BOOKED"))
                    .count();

            // 증가율 계산
            double bookedGrowthRate = lastWeekBooked > 0
                    ? ((double) (bookedToday - lastWeekBooked) / lastWeekBooked) * 100
                    : 0.0;
            double completedGrowthRate = lastWeekCompleted > 0
                    ? ((double) (completedToday - lastWeekCompleted) / lastWeekCompleted) * 100
                    : 0.0;

            // 총 사용자 증가율 계산 (이번 주 vs 지난 주)
            long currentWeekUsers =
                    adminService.getAllConsultants().size() + adminService.getAllClients().size();
            // 지난 주 사용자 수는 이번 주 기준으로 계산 (실제로는 지난 주 데이터가 필요하지만, 간단하게 현재 데이터 사용)
            // TODO: 실제 지난 주 데이터를 조회하도록 개선 필요
            long lastWeekUsers = currentWeekUsers; // 임시로 동일 값 사용 (실제 데이터 없음)
            double totalUsersGrowthRate = 0.0; // 데이터가 없으면 0

            Map<String, Object> stats = new java.util.HashMap<>();
            stats.put("totalToday", totalToday);
            stats.put("completedToday", completedToday);
            stats.put("inProgressToday", inProgressToday);
            stats.put("cancelledToday", cancelledToday);
            stats.put("bookedToday", bookedToday);
            stats.put("date", today);
            stats.put("lastUpdated", java.time.LocalDateTime.now());

            // 증가율 추가 (데이터가 있을 때만)
            if (lastWeekBooked > 0) {
                stats.put("bookedGrowthRate", Math.round(bookedGrowthRate * 10.0) / 10.0);
            }
            if (lastWeekCompleted > 0) {
                stats.put("completedGrowthRate", Math.round(completedGrowthRate * 10.0) / 10.0);
            }
            if (lastWeekUsers > 0 && currentWeekUsers != lastWeekUsers) {
                stats.put("totalUsersGrowthRate", Math.round(totalUsersGrowthRate * 10.0) / 10.0);
            }

            log.info("📊 오늘의 통계 조회 완료: 전체={}, 완료={}, 진행중={}, 취소={}, 예약 증가율={}%, 완료 증가율={}%",
                    totalToday, completedToday, inProgressToday, cancelledToday, bookedGrowthRate,
                    completedGrowthRate);

            return success(stats);

        } catch (Exception e) {
            log.error("❌ 오늘의 통계 조회 실패", e);
            Map<String, Object> errorData = new java.util.HashMap<>();
            errorData.put("error", "오늘의 통계 조회에 실패했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("오늘의 통계 조회에 실패했습니다", errorData));
        }
    }

    /**
     * /** 입금 대기 통계 조회 (위젯용) /** GET /api/admin/pending-deposit-stats
     */
    @GetMapping("/pending-deposit-stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPendingDepositStats(
            HttpSession session) {
        log.info("📊 입금 대기 통계 조회 API 호출");

        try {
            ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(session,
                    "MAPPING_VIEW", dynamicPermissionService);
            if (permissionResponse != null) {
                throw new org.springframework.security.access.AccessDeniedException("권한이 없습니다.");
            }

            List<ConsultantClientMapping> pendingDeposits =
                    adminService.getPendingDepositMappings();

            long count = pendingDeposits.size();
            long totalAmount = pendingDeposits.stream()
                    .mapToLong(
                            m -> m.getPackagePrice() != null ? m.getPackagePrice().longValue() : 0L)
                    .sum();

            long oldestHours = 0;
            if (!pendingDeposits.isEmpty()) {
                java.time.LocalDateTime now = java.time.LocalDateTime.now();
                oldestHours = pendingDeposits.stream().filter(m -> m.getCreatedAt() != null)
                        .mapToLong(m -> {
                            java.time.LocalDateTime createdAt = m.getCreatedAt();
                            return java.time.Duration.between(createdAt, now).toHours();
                        }).max().orElse(0L);
            }

            Map<String, Object> stats = new java.util.HashMap<>();
            stats.put("count", count);
            stats.put("totalAmount", totalAmount);
            stats.put("oldestHours", oldestHours);
            stats.put("lastUpdated", java.time.LocalDateTime.now());

            log.info("📊 입금 대기 통계 조회 완료: 건수={}, 총금액={}, 최장대기={}시간", count, totalAmount,
                    oldestHours);

            return success(stats);

        } catch (Exception e) {
            log.error("❌ 입금 대기 통계 조회 실패", e);
            Map<String, Object> errorData = new java.util.HashMap<>();
            errorData.put("error", "입금 대기 통계 조회에 실패했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("입금 대기 통계 조회에 실패했습니다", errorData));
        }
    }

    /**
     * /** 오늘의 스케줄 조회 (관리자용) /** GET /api/admin/schedules/today
     */
    @GetMapping("/schedules/today")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTodaySchedules(
            HttpSession session) {
        log.info("📅 오늘의 스케줄 조회 API 호출");

        try {
            ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(session,
                    "SCHEDULE_VIEW", dynamicPermissionService);
            if (permissionResponse != null) {
                throw new org.springframework.security.access.AccessDeniedException("권한이 없습니다.");
            }

            java.time.LocalDate today = java.time.LocalDate.now();
            List<com.coresolution.consultation.entity.Schedule> schedules =
                    scheduleService.getSchedulesByDate(today, null);

            List<Map<String, Object>> scheduleData = schedules.stream().map(s -> {
                Map<String, Object> data = new java.util.HashMap<>();
                data.put("id", s.getId());
                data.put("date", s.getDate());
                data.put("startTime", s.getStartTime());
                data.put("endTime", s.getEndTime());
                data.put("status", s.getStatus() != null ? s.getStatus().toString() : "UNKNOWN");
                return data;
            }).collect(java.util.stream.Collectors.toList());

            return success(scheduleData);

        } catch (Exception e) {
            log.error("❌ 오늘의 스케줄 조회 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("오늘의 스케줄 조회에 실패했습니다", null));
        }
    }

    /**
     * 재무 요약 조회 /** GET /api/admin/finance/summary
     */
    @GetMapping("/finance/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getFinanceSummary(HttpSession session) {
        log.info("💰 재무 요약 조회 API 호출");

        try {
            ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(session,
                    "FINANCE_VIEW", dynamicPermissionService);
            if (permissionResponse != null) {
                throw new org.springframework.security.access.AccessDeniedException("권한이 없습니다.");
            }

            Map<String, Object> summary = new java.util.HashMap<>();
            summary.put("totalRevenue", 0);
            summary.put("pendingPayments", 0);
            summary.put("lastUpdated", java.time.LocalDateTime.now());

            return success(summary);

        } catch (Exception e) {
            log.error("❌ 재무 요약 조회 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("재무 요약 조회에 실패했습니다", null));
        }
    }

    /**
     * 매칭 목록 조회 (중앙화 - 모든 매칭 조회)
     */
    @GetMapping("/mappings")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllMappings(HttpSession session) {
        log.info("🔍 매칭 목록 조회 (중앙화)");

        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(session,
                "MAPPING_VIEW", dynamicPermissionService);
        if (permissionResponse != null) {
            throw new org.springframework.security.access.AccessDeniedException("권한이 없습니다.");
        }

        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }

        // 표준화 원칙: SessionUtils.getTenantId() 사용 (세션 → User 객체 순서로 확인)
        String tenantId = SessionUtils.getTenantId(session);
        if (tenantId == null || tenantId.isEmpty()) {
            log.error("❌ tenantId가 필수입니다. 사용자 ID: {}, 이메일: {}, 역할: {}", currentUser.getId(),
                    currentUser.getEmail(), currentUser.getRole());
            String errorMessage = String.format("테넌트 정보가 없습니다. 사용자 ID: %d, 역할: %s. 관리자에게 문의하세요.",
                    currentUser.getId(), currentUser.getRole());
            throw new IllegalArgumentException(errorMessage);
        }

        log.info("🔍 현재 사용자 정보: userId={}, tenantId={}, 역할={}", currentUser.getId(), tenantId,
                currentUser.getRole());

        // TenantContextHolder에 tenantId 설정 (서비스에서 getTenantId() 사용을 위해)
        com.coresolution.core.context.TenantContextHolder.setTenantId(tenantId);

        List<ConsultantClientMapping> mappings = adminService.getAllMappings();

        log.info("🔍 매칭 목록 조회 완료 - 총 {}개", mappings.size());

        List<Map<String, Object>> mappingData = mappings.stream().map(mapping -> {
            Map<String, Object> data = new java.util.HashMap<>();
            try {
                data.put("id", mapping.getId());

                // 표준화 2025-12-08: 개인정보 복호화
                if (mapping.getConsultant() != null) {
                    data.put("consultantId", mapping.getConsultant().getId());
                    String consultantName = mapping.getConsultant().getName();
                    if (consultantName != null && !consultantName.trim().isEmpty()) {
                        try {
                            consultantName = personalDataEncryptionUtil.safeDecrypt(consultantName);
                        } catch (Exception e) {
                            log.warn("🔓 상담사 이름 복호화 실패: mappingId={}, consultantId={}, error={}",
                                    mapping.getId(), mapping.getConsultant().getId(),
                                    e.getMessage());
                        }
                    }
                    data.put("consultantName", consultantName);
                } else {
                    data.put("consultantId", null);
                    data.put("consultantName", "알 수 없음");
                }

                // 표준화 2025-12-08: 개인정보 복호화 (캐시 활용)
                if (mapping.getClient() != null) {
                    data.put("clientId", mapping.getClient().getId());
                    Map<String, String> decryptedClient =
                            userPersonalDataCacheService.getDecryptedUserData(mapping.getClient());
                    String clientName = decryptedClient != null ? decryptedClient.get("name")
                            : mapping.getClient().getName();
                    data.put("clientName", clientName != null ? clientName : "알 수 없음");
                } else {
                    data.put("clientId", null);
                    data.put("clientName", "알 수 없음");
                }

                data.put("status",
                        mapping.getStatus() != null ? mapping.getStatus().toString() : "UNKNOWN");
                data.put("paymentStatus",
                        mapping.getPaymentStatus() != null ? mapping.getPaymentStatus().toString()
                                : "UNKNOWN");
                data.put("totalSessions", mapping.getTotalSessions());
                data.put("remainingSessions", mapping.getRemainingSessions());
                data.put("usedSessions", mapping.getUsedSessions());
                data.put("packageName", mapping.getPackageName());
                data.put("packagePrice", mapping.getPackagePrice());
                data.put("paymentAmount", mapping.getPaymentAmount());
                data.put("paymentMethod", mapping.getPaymentMethod());
                data.put("paymentReference", mapping.getPaymentReference());
                data.put("paymentDate", mapping.getPaymentDate());
                data.put("adminApprovalDate", mapping.getAdminApprovalDate());
                data.put("approvedBy", mapping.getApprovedBy());
                data.put("assignedAt", mapping.getAssignedAt());
                data.put("createdAt", mapping.getCreatedAt());
                data.put("startDate", mapping.getStartDate());
                data.put("endDate", mapping.getEndDate());
            } catch (Exception e) {
                log.warn("매칭 ID {} 정보 추출 실패: {}", mapping.getId(), e.getMessage());
                data.put("id", mapping.getId());
                data.put("consultantId", null);
                data.put("consultantName", "오류");
                data.put("clientId", null);
                data.put("clientName", "오류");
                data.put("status", "ERROR");
                data.put("paymentStatus", "ERROR");
                data.put("assignedAt", null);
                data.put("createdAt", mapping.getCreatedAt());
            }
            return data;
        }).collect(java.util.stream.Collectors.toList());

        Map<String, Object> data = new HashMap<>();
        data.put("mappings", mappingData);
        data.put("count", mappings.size());

        return success(data);
    }


    /**
     * 매칭 정보 수정 (ERP 연동)
     */
    @PostMapping("/mappings/{mappingId}/update")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateMappingInfo(
            @PathVariable Long mappingId, @RequestBody Map<String, Object> updateRequest,
            HttpSession session) {
        log.info("🔄 매칭 정보 수정 요청: mappingId={}, request={}", mappingId, updateRequest);

        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(session,
                "MAPPING_MANAGE", dynamicPermissionService);
        if (permissionResponse != null) {
            throw new org.springframework.security.access.AccessDeniedException("권한이 없습니다.");
        }

        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }

        Map<String, Object> permissionResult = storedProcedureService.checkMappingUpdatePermission(
                mappingId, currentUser.getId(), currentUser.getRole().toString());

        if (!(Boolean) permissionResult.get("canUpdate")) {
            throw new IllegalArgumentException((String) permissionResult.get("reason"));
        }

        String newPackageName = (String) updateRequest.get("packageName");
        Double newPackagePrice = ((Number) updateRequest.get("packagePrice")).doubleValue();
        Integer newTotalSessions = ((Number) updateRequest.get("totalSessions")).intValue();

        Map<String, Object> updateResult = storedProcedureService.updateMappingInfo(mappingId,
                newPackageName, newPackagePrice, newTotalSessions, currentUser.getName());

        if ((Boolean) updateResult.get("success")) {
            log.info("✅ 매칭 정보 수정 완료: mappingId={}", mappingId);
            return updated((String) updateResult.get("message"), updateResult);
        } else {
            log.error("❌ 매칭 정보 수정 실패: mappingId={}, message={}", mappingId,
                    updateResult.get("message"));
            throw new IllegalArgumentException((String) updateResult.get("message"));
        }
    }


    /**
     * 입금 대기 중인 매칭 목록 조회
     */
    @GetMapping("/mappings/pending-payment")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPendingPaymentMappings() {
        log.info("🔍 입금 대기 중인 매칭 목록 조회");
        List<ConsultantClientMapping> mappings = adminService.getPendingPaymentMappings();

        Map<String, Object> data = new HashMap<>();
        data.put("mappings", mappings);
        data.put("count", mappings.size());

        return success(data);
    }

    /**
     * 입금 확인된 매칭 목록 조회
     */
    @GetMapping("/mappings/payment-confirmed")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPaymentConfirmedMappings() {
        log.info("🔍 입금 확인된 매칭 목록 조회");
        List<ConsultantClientMapping> mappings = adminService.getPaymentConfirmedMappings();

        Map<String, Object> data = new HashMap<>();
        data.put("mappings", mappings);
        data.put("count", mappings.size());

        return success(data);
    }

    /**
     * 입금 확인 대기 중인 매칭 목록 조회
     */
    @GetMapping("/mappings/pending-deposit")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPendingDepositMappings(
            HttpSession session) {
        log.info("🔔 입금 확인 대기 매칭 조회 요청");

        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }

        if (!currentUser.getRole().isAdmin()) {
            throw new org.springframework.security.access.AccessDeniedException("관리자 권한이 필요합니다.");
        }

        List<ConsultantClientMapping> pendingMappings = adminService.getPendingDepositMappings();

        List<Map<String, Object>> responseData = pendingMappings.stream().map(mapping -> {
            Map<String, Object> mappingData = new HashMap<>();
            mappingData.put("id", mapping.getId());
            // 표준화 2025-12-08: 개인정보 복호화 (캐시 활용)
            if (mapping.getClient() != null) {
                Map<String, String> decryptedClient =
                        userPersonalDataCacheService.getDecryptedUserData(mapping.getClient());
                String clientName = decryptedClient != null ? decryptedClient.get("name")
                        : mapping.getClient().getName();
                mappingData.put("clientName", clientName != null ? clientName : "알 수 없음");
            } else {
                mappingData.put("clientName", "알 수 없음");
            }

            if (mapping.getConsultant() != null) {
                Map<String, String> decryptedConsultant =
                        userPersonalDataCacheService.getDecryptedUserData(mapping.getConsultant());
                String consultantName =
                        decryptedConsultant != null ? decryptedConsultant.get("name")
                                : mapping.getConsultant().getName();
                mappingData.put("consultantName",
                        consultantName != null ? consultantName : "알 수 없음");
            } else {
                mappingData.put("consultantName", "알 수 없음");
            }
            mappingData.put("packageName", mapping.getPackageName());
            mappingData.put("packagePrice", mapping.getPackagePrice());
            mappingData.put("paymentDate", mapping.getPaymentDate());
            mappingData.put("paymentMethod", mapping.getPaymentMethod());
            mappingData.put("paymentReference", mapping.getPaymentReference());

            if (mapping.getPaymentDate() != null) {
                long hoursElapsed = java.time.Duration
                        .between(mapping.getPaymentDate(), java.time.LocalDateTime.now()).toHours();
                mappingData.put("hoursElapsed", hoursElapsed);
            } else {
                mappingData.put("hoursElapsed", 0L);
            }

            return mappingData;
        }).collect(java.util.stream.Collectors.toList());

        Map<String, Object> data = new HashMap<>();
        data.put("mappings", responseData);
        data.put("count", responseData.size());

        log.info("✅ 입금 확인 대기 매칭 조회 완료: {}개", responseData.size());
        return success("입금 확인 대기 매칭 조회 완료", data);
    }

    /**
     * 활성 매칭 목록 조회 (승인 완료)
     */
    @GetMapping("/mappings/active")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getActiveMappings() {
        log.info("🔍 활성 매칭 목록 조회");
        List<ConsultantClientMapping> mappings = adminService.getActiveMappings();

        List<Map<String, Object>> mappingData = mappings.stream().map(mapping -> {
            Map<String, Object> data = new java.util.HashMap<>();
            try {
                data.put("id", mapping.getId());

                // 표준화 2025-12-08: 개인정보 복호화 (캐시 활용)
                if (mapping.getConsultant() != null) {
                    data.put("consultantId", mapping.getConsultant().getId());

                    Map<String, String> decryptedConsultant = userPersonalDataCacheService
                            .getDecryptedUserData(mapping.getConsultant());
                    String consultantName =
                            decryptedConsultant != null ? decryptedConsultant.get("name")
                                    : mapping.getConsultant().getName();
                    String consultantEmail =
                            decryptedConsultant != null ? decryptedConsultant.get("email")
                                    : mapping.getConsultant().getEmail();
                    String consultantPhone =
                            decryptedConsultant != null ? decryptedConsultant.get("phone")
                                    : mapping.getConsultant().getPhone();

                    data.put("consultantName", consultantName != null ? consultantName : "알 수 없음");

                    Map<String, Object> consultantInfo = new java.util.HashMap<>();
                    consultantInfo.put("id", mapping.getConsultant().getId());
                    consultantInfo.put("name", consultantName);
                    consultantInfo.put("email", consultantEmail);
                    consultantInfo.put("phone", consultantPhone);
                    consultantInfo.put("role", mapping.getConsultant().getRole() != null
                            ? mapping.getConsultant().getRole().toString()
                            : com.coresolution.consultation.constant.UserRole.CONSULTANT.name());
                    data.put("consultant", consultantInfo);
                } else {
                    data.put("consultantId", null);
                    data.put("consultantName", "알 수 없음");
                    data.put("consultant", null);
                }

                // 표준화 2025-12-08: 개인정보 복호화 (캐시 활용)
                if (mapping.getClient() != null) {
                    data.put("clientId", mapping.getClient().getId());

                    Map<String, String> decryptedClient =
                            userPersonalDataCacheService.getDecryptedUserData(mapping.getClient());
                    String clientName = decryptedClient != null ? decryptedClient.get("name")
                            : mapping.getClient().getName();
                    String clientEmail = decryptedClient != null ? decryptedClient.get("email")
                            : mapping.getClient().getEmail();
                    String clientPhone = decryptedClient != null ? decryptedClient.get("phone")
                            : mapping.getClient().getPhone();

                    data.put("clientName", clientName != null ? clientName : "알 수 없음");

                    Map<String, Object> clientInfo = new java.util.HashMap<>();
                    clientInfo.put("id", mapping.getClient().getId());
                    clientInfo.put("name", clientName);
                    clientInfo.put("email", clientEmail);
                    clientInfo.put("phone", clientPhone);
                    clientInfo.put("role", mapping.getClient().getRole() != null
                            ? mapping.getClient().getRole().toString()
                            : com.coresolution.consultation.constant.UserRole.CLIENT.name());
                    data.put("client", clientInfo);
                } else {
                    data.put("clientId", null);
                    data.put("clientName", "알 수 없음");
                    data.put("client", null);
                }

                data.put("status",
                        mapping.getStatus() != null ? mapping.getStatus().toString() : "UNKNOWN");
                data.put("paymentStatus",
                        mapping.getPaymentStatus() != null ? mapping.getPaymentStatus().toString()
                                : "UNKNOWN");
                data.put("totalSessions", mapping.getTotalSessions());
                data.put("remainingSessions", mapping.getRemainingSessions());
                data.put("usedSessions", mapping.getUsedSessions());
                data.put("packageName", mapping.getPackageName());
                data.put("packagePrice", mapping.getPackagePrice());
                data.put("startDate", mapping.getStartDate());
                data.put("endDate", mapping.getEndDate());
                data.put("paymentDate", mapping.getPaymentDate());
                data.put("paymentMethod", mapping.getPaymentMethod());
                data.put("adminApprovalDate", mapping.getAdminApprovalDate());
                data.put("approvedBy", mapping.getApprovedBy());
                data.put("notes", mapping.getNotes());

                return data;
            } catch (Exception e) {
                log.warn("매칭 데이터 추출 중 오류 (ID: {}): {}", mapping.getId(), e.getMessage());
                Map<String, Object> errorData = new java.util.HashMap<>();
                errorData.put("id", mapping.getId());
                errorData.put("error", "데이터 추출 실패: " + e.getMessage());
                return errorData;
            }
        }).collect(java.util.stream.Collectors.toList());

        Map<String, Object> data = new HashMap<>();
        data.put("mappings", mappingData);
        data.put("count", mappingData.size());

        return success(data);
    }

    /**
     * 회기 소진된 매칭 목록 조회
     */
    @GetMapping("/mappings/sessions-exhausted")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSessionsExhaustedMappings() {
        log.info("🔍 회기 소진된 매칭 목록 조회");
        List<ConsultantClientMapping> mappings = adminService.getSessionsExhaustedMappings();

        Map<String, Object> data = new HashMap<>();
        data.put("mappings", mappings);
        data.put("count", mappings.size());

        return success(data);
    }

    /**
     * 개별 매칭 조회
     */
    @GetMapping("/mappings/{mappingId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMappingById(
            @PathVariable Long mappingId) {
        log.info("🔍 매칭 ID {} 조회", mappingId);
        ConsultantClientMapping mapping = adminService.getMappingById(mappingId);

        if (mapping == null) {
            throw new IllegalArgumentException("매칭을 찾을 수 없습니다.");
        }

        Map<String, Object> mappingData = new HashMap<>();
        mappingData.put("id", mapping.getId());
        mappingData.put("status",
                mapping.getStatus() != null ? mapping.getStatus().toString() : "UNKNOWN");
        mappingData.put("paymentStatus",
                mapping.getPaymentStatus() != null ? mapping.getPaymentStatus().toString()
                        : "UNKNOWN");
        mappingData.put("paymentMethod", mapping.getPaymentMethod());
        mappingData.put("paymentReference", mapping.getPaymentReference());
        mappingData.put("paymentAmount", mapping.getPaymentAmount());
        mappingData.put("paymentDate", mapping.getPaymentDate());
        mappingData.put("totalSessions", mapping.getTotalSessions());
        mappingData.put("remainingSessions", mapping.getRemainingSessions());
        mappingData.put("packageName", mapping.getPackageName());
        mappingData.put("packagePrice", mapping.getPackagePrice());
        mappingData.put("assignedAt", mapping.getAssignedAt());
        mappingData.put("createdAt", mapping.getCreatedAt());

        if (mapping.getConsultant() != null) {
            Map<String, Object> consultantData = new HashMap<>();
            consultantData.put("id", mapping.getConsultant().getId());
            consultantData.put("name", mapping.getConsultant().getName());
            consultantData.put("email", mapping.getConsultant().getEmail());
            mappingData.put("consultant", consultantData);
        }

        if (mapping.getClient() != null) {
            Map<String, Object> clientData = new HashMap<>();
            clientData.put("id", mapping.getClient().getId());
            clientData.put("name", mapping.getClient().getName());
            clientData.put("email", mapping.getClient().getEmail());
            mappingData.put("client", clientData);
        }

        return success(mappingData);
    }

    /**
     * 결제 확인 (미수금 상태)
     */
    @PostMapping("/mappings/{mappingId}/confirm-payment")
    public ResponseEntity<ApiResponse<Map<String, Object>>> confirmPayment(
            @PathVariable Long mappingId, @RequestBody Map<String, Object> request) {
        log.info("💰 매칭 ID {} 결제 확인 시작", mappingId);

        String paymentMethod = (String) request.get("paymentMethod");
        String paymentReference = (String) request.get("paymentReference");
        Long paymentAmount = request.get("paymentAmount") != null
                ? ((Number) request.get("paymentAmount")).longValue()
                : null;

        log.info("💰 요청 데이터 - paymentMethod: {}, paymentReference: {}, paymentAmount: {}",
                paymentMethod, paymentReference, paymentAmount);

        ConsultantClientMapping mapping = adminService.confirmPayment(mappingId, paymentMethod,
                paymentReference, paymentAmount);

        log.info("💰 매칭 ID {} 결제 확인 완료 (미수금 상태)", mappingId);

        Map<String, Object> mappingData = new HashMap<>();
        mappingData.put("id", mapping.getId());
        mappingData.put("status",
                mapping.getStatus() != null ? mapping.getStatus().toString() : "UNKNOWN");
        mappingData.put("paymentStatus",
                mapping.getPaymentStatus() != null ? mapping.getPaymentStatus().toString()
                        : "UNKNOWN");
        mappingData.put("paymentMethod", mapping.getPaymentMethod());
        mappingData.put("paymentReference", mapping.getPaymentReference());
        mappingData.put("paymentAmount", mapping.getPaymentAmount());
        mappingData.put("paymentDate", mapping.getPaymentDate());
        mappingData.put("totalSessions", mapping.getTotalSessions());
        mappingData.put("remainingSessions", mapping.getRemainingSessions());
        mappingData.put("packageName", mapping.getPackageName());
        mappingData.put("packagePrice", mapping.getPackagePrice());

        // 표준화 2025-12-08: 개인정보 복호화 (캐시 활용)
        if (mapping.getConsultant() != null) {
            Map<String, Object> consultantData = new HashMap<>();
            consultantData.put("id", mapping.getConsultant().getId());
            Map<String, String> decryptedConsultant =
                    userPersonalDataCacheService.getDecryptedUserData(mapping.getConsultant());
            consultantData.put("name", decryptedConsultant != null ? decryptedConsultant.get("name")
                    : mapping.getConsultant().getName());
            consultantData.put("email",
                    decryptedConsultant != null ? decryptedConsultant.get("email")
                            : mapping.getConsultant().getEmail());
            mappingData.put("consultant", consultantData);
        }

        if (mapping.getClient() != null) {
            Map<String, Object> clientData = new HashMap<>();
            clientData.put("id", mapping.getClient().getId());
            Map<String, String> decryptedClient =
                    userPersonalDataCacheService.getDecryptedUserData(mapping.getClient());
            clientData.put("name", decryptedClient != null ? decryptedClient.get("name")
                    : mapping.getClient().getName());
            clientData.put("email", decryptedClient != null ? decryptedClient.get("email")
                    : mapping.getClient().getEmail());
            mappingData.put("client", clientData);
        }

        return success("입금이 확인되었습니다. 이제 관리자 승인을 기다려주세요.", mappingData);
    }

    /**
     * 관리자 승인
     */
    @PostMapping("/mappings/{mappingId}/approve")
    public ResponseEntity<ApiResponse<Map<String, Object>>> approveMapping(
            @PathVariable Long mappingId, @RequestBody Map<String, Object> request) {
        log.info("✅ 매칭 ID {} 관리자 승인", mappingId);

        String adminName = (String) request.get("adminName");

        ConsultantClientMapping mapping = adminService.approveMapping(mappingId, adminName);

        log.info("✅ 매칭 ID {} 관리자 승인 완료", mappingId);

        // 트랜잭션이 커밋된 후 별도의 트랜잭션에서 통계 업데이트
        // LazyInitializationException 방지를 위해 트랜잭션 내에서 필요한 ID를 미리 추출
        Long consultantId = null;
        Long clientId = null;

        try {
            // 트랜잭션이 끝나기 전에 필요한 데이터를 미리 조회
            ConsultantClientMapping mappingWithRelations = adminService.getMappingById(mappingId);
            if (mappingWithRelations != null) {
                if (mappingWithRelations.getConsultant() != null) {
                    consultantId = mappingWithRelations.getConsultant().getId();
                }
                if (mappingWithRelations.getClient() != null) {
                    clientId = mappingWithRelations.getClient().getId();
                }
            }
        } catch (Exception e) {
            log.warn("⚠️ 매핑 정보 재조회 실패 (통계 업데이트는 건너뜀): {}", e.getMessage());
        }

        try {
            // 통계 업데이트 (독립적인 트랜잭션)
            if (consultantId != null && clientId != null) {
                realTimeStatisticsService.updateStatisticsOnMappingChange(consultantId, clientId,
                        null // 브랜치 코드 사용 금지
                );
                log.info("✅ 관리자 승인 후 실시간 통계 업데이트 완료: mappingId={}", mappingId);
            }
        } catch (Exception e) {
            log.error("❌ 관리자 승인 후 실시간 통계 업데이트 실패 (승인은 이미 완료됨): {}", e.getMessage(), e);
        }

        Map<String, Object> mappingData = new HashMap<>();
        mappingData.put("id", mapping.getId());
        mappingData.put("status",
                mapping.getStatus() != null ? mapping.getStatus().toString() : "UNKNOWN");
        mappingData.put("paymentStatus",
                mapping.getPaymentStatus() != null ? mapping.getPaymentStatus().toString()
                        : "UNKNOWN");
        mappingData.put("packageName", mapping.getPackageName());
        mappingData.put("packagePrice", mapping.getPackagePrice());
        mappingData.put("paymentAmount", mapping.getPaymentAmount());
        mappingData.put("paymentMethod", mapping.getPaymentMethod());
        mappingData.put("paymentReference", mapping.getPaymentReference());
        mappingData.put("paymentDate", mapping.getPaymentDate());
        mappingData.put("adminApprovalDate", mapping.getAdminApprovalDate());
        mappingData.put("approvedBy", mapping.getApprovedBy());
        mappingData.put("totalSessions", mapping.getTotalSessions());
        mappingData.put("remainingSessions", mapping.getRemainingSessions());
        mappingData.put("usedSessions", mapping.getUsedSessions());

        // LazyInitializationException 방지를 위해 트랜잭션 내에서 조회한 데이터 사용
        try {
            ConsultantClientMapping mappingWithRelations = adminService.getMappingById(mappingId);
            if (mappingWithRelations != null) {
                // 표준화 2025-12-08: 개인정보 복호화 (캐시 활용)
                if (mappingWithRelations.getConsultant() != null) {
                    Map<String, Object> consultantData = new HashMap<>();
                    consultantData.put("id", mappingWithRelations.getConsultant().getId());
                    Map<String, String> decryptedConsultant = userPersonalDataCacheService
                            .getDecryptedUserData(mappingWithRelations.getConsultant());
                    consultantData.put("name",
                            decryptedConsultant != null ? decryptedConsultant.get("name")
                                    : mappingWithRelations.getConsultant().getName());
                    consultantData.put("email",
                            decryptedConsultant != null ? decryptedConsultant.get("email")
                                    : mappingWithRelations.getConsultant().getEmail());
                    mappingData.put("consultant", consultantData);
                }

                if (mappingWithRelations.getClient() != null) {
                    Map<String, Object> clientData = new HashMap<>();
                    clientData.put("id", mappingWithRelations.getClient().getId());
                    Map<String, String> decryptedClient = userPersonalDataCacheService
                            .getDecryptedUserData(mappingWithRelations.getClient());
                    clientData.put("name", decryptedClient != null ? decryptedClient.get("name")
                            : mappingWithRelations.getClient().getName());
                    clientData.put("email", decryptedClient != null ? decryptedClient.get("email")
                            : mappingWithRelations.getClient().getEmail());
                    mappingData.put("client", clientData);
                }
            }
        } catch (Exception e) {
            log.warn("⚠️ 매핑 관계 데이터 조회 실패 (기본 데이터만 반환): {}", e.getMessage());
        }

        return success("매칭이 승인되었습니다. 이제 스케줄을 작성할 수 있습니다.", mappingData);
    }

    /**
     * 관리자 거부
     */
    @PostMapping("/mappings/{mappingId}/reject")
    public ResponseEntity<ApiResponse<ConsultantClientMapping>> rejectMapping(
            @PathVariable Long mappingId, @RequestBody Map<String, Object> request) {
        log.info("❌ 매칭 ID {} 관리자 거부", mappingId);

        String reason = (String) request.get("reason");

        ConsultantClientMapping mapping = adminService.rejectMapping(mappingId, reason);

        return success("매칭이 거부되었습니다.", mapping);
    }

    /**
     * 회기 사용 처리
     */
    @PostMapping("/mappings/{mappingId}/use-session")
    public ResponseEntity<ApiResponse<ConsultantClientMapping>> useSession(
            @PathVariable Long mappingId) {
        log.info("📅 매칭 ID {} 회기 사용 처리", mappingId);

        ConsultantClientMapping mapping = adminService.useSession(mappingId);

        return success("회기가 사용되었습니다.", mapping);
    }

    /**
     * 회기 추가 (연장)
     */
    @PostMapping("/mappings/{mappingId}/extend-sessions")
    public ResponseEntity<ApiResponse<ConsultantClientMapping>> extendSessions(
            @PathVariable Long mappingId, @RequestBody Map<String, Object> request) {
        log.info("🔄 매칭 ID {} 회기 추가 (연장)", mappingId);

        Integer additionalSessions = (Integer) request.get("additionalSessions");
        String packageName = (String) request.get("packageName");
        Long packagePrice = Long.valueOf(request.get("packagePrice").toString());

        ConsultantClientMapping mapping = adminService.extendSessions(mappingId, additionalSessions,
                packageName, packagePrice);

        return success("회기가 추가되었습니다.", mapping);
    }

    /**
     * 상담사 등록
     */
    @PostMapping("/consultants")
    public ResponseEntity<ApiResponse<User>> registerConsultant(
            @RequestBody ConsultantRegistrationRequest request, HttpSession session) {
        log.info("🔧 상담사 등록: {}", request.getUserId());

        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(session,
                "CONSULTANT_MANAGE", dynamicPermissionService);
        if (permissionResponse != null) {
            throw new org.springframework.security.access.AccessDeniedException("권한이 없습니다.");
        }

        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }

        // 표준화 원칙: SessionUtils.getTenantId() 사용 (세션 → User 객체 순서로 확인)
        String tenantId = SessionUtils.getTenantId(session);
        if (tenantId == null || tenantId.isEmpty()) {
            log.error("❌ tenantId가 필수입니다. 사용자 ID: {}, 이메일: {}, 역할: {}", currentUser.getId(),
                    currentUser.getEmail(), currentUser.getRole());
            String errorMessage = String.format("테넌트 정보가 없습니다. 사용자 ID: %d, 역할: %s. 관리자에게 문의하세요.",
                    currentUser.getId(), currentUser.getRole());
            throw new IllegalArgumentException(errorMessage);
        }

        log.info("🔧 현재 사용자 정보: userId={}, tenantId={}", currentUser.getId(), tenantId);

        // TenantContextHolder에 tenantId 설정 (서비스에서 getTenantIdOrNull() 사용을 위해)
        com.coresolution.core.context.TenantContextHolder.setTenantId(tenantId);

        /*
         * 주석 처리됨 - 지점코드 검증 로직 if (request.getBranchCode() == null ||
         * request.getBranchCode().trim().isEmpty()) { log.error("❌ 지점코드가 없습니다. 상담사 등록을 거부합니다.");
         * throw new IllegalArgumentException("지점코드는 필수입니다. 관리자에게 문의하세요."); }
         */

        User consultant = adminService.registerConsultant(request);
        return created("상담사가 성공적으로 등록되었습니다", consultant);
    }

    /**
     * 내담자 등록
     */
    @PostMapping("/clients")
    public ResponseEntity<ApiResponse<Client>> registerClient(
            @RequestBody ClientRegistrationRequest request, HttpSession session) {
        log.info("🔧 내담자 등록: {}", request.getName());

        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(session,
                "CLIENT_MANAGE", dynamicPermissionService);
        if (permissionResponse != null) {
            throw new org.springframework.security.access.AccessDeniedException("권한이 없습니다.");
        }

        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }

        // 표준화 원칙: SessionUtils.getTenantId() 사용 (세션 → User 객체 순서로 확인)
        String tenantId = SessionUtils.getTenantId(session);
        if (tenantId == null || tenantId.isEmpty()) {
            log.error("❌ tenantId가 필수입니다. 사용자 ID: {}, 이메일: {}, 역할: {}", currentUser.getId(),
                    currentUser.getEmail(), currentUser.getRole());
            String errorMessage = String.format("테넌트 정보가 없습니다. 사용자 ID: %d, 역할: %s. 관리자에게 문의하세요.",
                    currentUser.getId(), currentUser.getRole());
            throw new IllegalArgumentException(errorMessage);
        }

        log.info("🔧 세션 사용자: {}, tenantId={}", currentUser.getName(), tenantId);

        // TenantContextHolder에 tenantId 설정 (서비스에서 getTenantIdOrNull() 사용을 위해)
        com.coresolution.core.context.TenantContextHolder.setTenantId(tenantId);

        /*
         * 주석 처리됨 - 지점코드 검증 로직 if (request.getBranchCode() == null ||
         * request.getBranchCode().trim().isEmpty()) { log.error("❌ 지점코드가 없습니다. 등록을 거부합니다."); throw
         * new IllegalArgumentException("지점코드는 필수입니다. 관리자에게 문의하세요."); }
         */

        Client client = adminService.registerClient(request);
        log.info("✅ 내담자 등록 완료: id={}, name={}, branchCode={}", client.getId(), client.getName(),
                request.getBranchCode());

        return created("내담자가 성공적으로 등록되었습니다", client);
    }

    /**
     * 이메일 중복 확인 (내담자/상담사 등록용)
     * GET /api/v1/admin/duplicate-check/email?email={email}
     */
    @GetMapping("/duplicate-check/email")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkEmailDuplicate(
            @RequestParam String email,
            HttpSession session) {
        log.info("🔍 이메일 중복 확인 요청: email={}", email);
        
        String tenantId = com.coresolution.core.context.TenantContextHolder.getTenantId();
        if (tenantId == null) {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser != null) {
                tenantId = currentUser.getTenantId();
            }
        }
        
        if (tenantId == null) {
            log.warn("⚠️ 테넌트 ID를 찾을 수 없습니다.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("테넌트 정보를 찾을 수 없습니다."));
        }
        
        // 테넌트별 이메일 중복 확인
        boolean isDuplicate = userRepository.existsByTenantIdAndEmail(tenantId, email);
        
        Map<String, Object> result = new HashMap<>();
        result.put("email", email);
        result.put("isDuplicate", isDuplicate);
        result.put("available", !isDuplicate);
        result.put("message", isDuplicate ? "이미 사용 중인 이메일입니다." : "사용 가능한 이메일입니다.");
        
        log.info("✅ 이메일 중복 확인 완료: email={}, isDuplicate={}, tenantId={}", email, isDuplicate, tenantId);
        
        return success(result);
    }

    /**
     * 매칭 생성
     */
    @PostMapping("/mappings")
    public ResponseEntity<ApiResponse<ConsultantClientMappingResponse>> createMapping(
            @RequestBody ConsultantClientMappingCreateRequest request, HttpSession session) {
        log.info("🔧 매칭 생성 시작: 상담사={}, 내담자={}", request.getConsultantId(), request.getClientId());

        User currentUser = SessionUtils.getCurrentUser(session);
        log.info("🔧 SessionUtils.getCurrentUser() 결과: {}", currentUser);

        if (currentUser == null) {
            log.warn("❌ 세션이 없습니다. 로그인이 필요합니다. 세션ID: {}", session.getId());
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }

        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(session,
                "MAPPING_MANAGE", dynamicPermissionService);
        if (permissionResponse != null) {
            throw new org.springframework.security.access.AccessDeniedException("권한이 없습니다.");
        }

        String currentBranchCode = currentUser.getBranchCode();
        log.info("🔧 현재 사용자 지점코드: {}", currentBranchCode);

        ConsultantClientMapping mapping = adminService.createMapping(request);

        log.info("🔧 생성된 매칭 지점코드: {}", mapping.getBranchCode());

        ConsultantClientMappingResponse response =
                ConsultantClientMappingResponse.fromEntity(mapping);

        return created("매칭이 성공적으로 생성되었습니다", response);
    }

    /**
     * 상담사 정보 수정
     */
    @PutMapping("/consultants/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateConsultant(@PathVariable Long id,
            @RequestBody @Valid ConsultantRegistrationRequest request, HttpSession session) {
        log.info("🔧 상담사 정보 수정: ID={}", id);

        if (request == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("요청 본문이 없습니다."));
        }

        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser != null) {
            String reqBranch = request.getBranchCode();
            if (currentUser.getBranchCode() != null && !currentUser.getBranchCode().trim().isEmpty()
                    && (reqBranch == null || reqBranch.trim().isEmpty())) {
                request.setBranchCode(currentUser.getBranchCode());
            }
        }

        User consultant = adminService.updateConsultant(id, request);
        // LazyInitializationException 방지: User 엔티티 대신 id만 반환 (LAZY 연관 미직렬화)
        Map<String, Object> data = new HashMap<>();
        data.put("id", consultant.getId());
        return updated("상담사 정보가 성공적으로 수정되었습니다", data);
    }

    /**
     * 상담사 등급 업데이트
     */
    @PutMapping("/consultants/{id}/grade")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateConsultantGrade(
            @PathVariable Long id, @RequestBody Map<String, Object> request) {
        String grade = request.get("grade").toString();
        log.info("🔧 상담사 등급 업데이트: ID={}, 등급={}", id, grade);

        User consultant = adminService.updateConsultantGrade(id, grade);

        Map<String, Object> data = new HashMap<>();
        data.put("id", consultant.getId());
        data.put("name", consultant.getName());
        data.put("grade", consultant.getGrade());

        return updated("상담사 등급이 성공적으로 업데이트되었습니다", data);
    }

    /**
     * 내담자 정보 수정
     * LazyInitializationException 방지: Client 엔티티 대신 Map(id) 반환 (상담사 updateConsultant와 동일)
     */
    @PutMapping("/clients/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateClient(@PathVariable Long id,
            @RequestBody @Valid ClientRegistrationRequest request, HttpSession session) {
        log.info("🔧 내담자 정보 수정: ID={}", id);

        if (request == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("요청 본문이 없습니다."));
        }

        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser != null) {
            if (currentUser.getBranchCode() != null && !currentUser.getBranchCode().trim().isEmpty()
                    && (request.getBranchCode() == null
                            || request.getBranchCode().trim().isEmpty())) {
                request.setBranchCode(currentUser.getBranchCode());
            }
        }

        Client client = adminService.updateClient(id, request);
        Map<String, Object> data = new HashMap<>();
        data.put("id", client.getId());
        return updated("내담자 정보가 성공적으로 수정되었습니다", data);
    }

    /**
     * 매칭 정보 수정
     */
    @PutMapping("/mappings/{id}")
    public ResponseEntity<ApiResponse<ConsultantClientMapping>> updateMapping(@PathVariable Long id,
            @RequestBody ConsultantClientMappingCreateRequest request, HttpSession session) {
        log.info("🔧 매칭 정보 수정: ID={}", id);

        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(session,
                "MAPPING_MANAGE", dynamicPermissionService);
        if (permissionResponse != null) {
            log.warn("❌ 매칭 수정 권한 없음: MAPPING_MANAGE");
            throw new org.springframework.security.access.AccessDeniedException("권한이 없습니다.");
        }

        User currentUser = SessionUtils.getCurrentUser(session);
        String updatedBy = currentUser != null ? currentUser.getName() : "System";

        ConsultantClientMapping mapping = adminService.updateMapping(id, request, updatedBy);
        return updated("매칭 정보가 성공적으로 수정되었습니다", mapping);
    }

    /**
     * 상담사 삭제 (비활성화)
     */
    @DeleteMapping("/consultants/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteConsultant(@PathVariable Long id) {
        log.info("🔧 상담사 삭제: ID={}", id);
        adminService.deleteConsultant(id);
        return deleted("상담사가 성공적으로 삭제되었습니다");
    }

    /**
     * 상담사 삭제 (다른 상담사로 이전 포함)
     */
    @PostMapping("/consultants/{id}/delete-with-transfer")
    public ResponseEntity<ApiResponse<Void>> deleteConsultantWithTransfer(@PathVariable Long id,
            @RequestBody Map<String, Object> request) {
        Long transferToConsultantId =
                Long.valueOf(request.get("transferToConsultantId").toString());
        String reason = (String) request.get("reason");

        log.info("🔄 상담사 이전 삭제: ID={}, 이전 대상={}, 사유={}", id, transferToConsultantId, reason);
        adminService.deleteConsultantWithTransfer(id, transferToConsultantId, reason);

        return deleted("상담사가 성공적으로 이전 처리되어 삭제되었습니다");
    }

    /**
     * 상담사 삭제 가능 여부 확인
     */
    @GetMapping("/consultants/{id}/deletion-status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkConsultantDeletionStatus(
            @PathVariable Long id) {
        log.info("🔍 상담사 삭제 가능 여부 확인: ID={}", id);
        Map<String, Object> status = adminService.checkConsultantDeletionStatus(id);

        return success(status);
    }

    /**
     * 내담자 삭제 (비활성화)
     */
    @DeleteMapping("/clients/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteClient(@PathVariable Long id) {
        log.info("🔧 내담자 삭제: ID={}", id);
        adminService.deleteClient(id);
        return deleted("내담자가 성공적으로 삭제되었습니다");
    }

    /**
     * 내담자 삭제 가능 여부 확인
     */
    @GetMapping("/clients/{id}/deletion-status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkClientDeletionStatus(
            @PathVariable Long id) {
        log.info("🔍 내담자 삭제 가능 여부 확인: ID={}", id);
        Map<String, Object> status = adminService.checkClientDeletionStatus(id);

        return success(status);
    }

    /**
     * 매칭 삭제 (비활성화)
     */
    @DeleteMapping("/mappings/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteMapping(@PathVariable Long id,
            HttpSession session) {
        log.info("🔧 매칭 삭제: ID={}", id);

        User currentUser = SessionUtils.getCurrentUser(session);
        log.info("📋 현재 사용자: {}, Role: {}", currentUser != null ? currentUser.getEmail() : "null",
                currentUser != null ? currentUser.getRole() : "null");

        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(session,
                "MAPPING_DELETE", dynamicPermissionService);
        if (permissionResponse != null) {
            log.error("❌ 권한 체크 실패: {}", permissionResponse.getBody());
            throw new org.springframework.security.access.AccessDeniedException("권한이 없습니다.");
        }
        log.info("✅ 권한 체크 통과");

        adminService.deleteMapping(id);
        return deleted("매칭이 성공적으로 삭제되었습니다");
    }

    /**
     * 매칭 강제 종료 (전체 환불 처리)
     */
    @PostMapping("/mappings/{id}/terminate")
    public ResponseEntity<ApiResponse<Void>> terminateMapping(@PathVariable Long id,
            @RequestBody Map<String, Object> requestBody) {
        log.info("🔧 매칭 강제 종료: ID={}", id);
        String reason = (String) requestBody.get("reason");
        adminService.terminateMapping(id, reason);
        return success("매칭이 성공적으로 종료되었습니다");
    }

    /**
     * 매칭 부분 환불 처리 (지정된 회기수만 환불)
     */
    @PostMapping("/mappings/{id}/partial-refund")
    public ResponseEntity<ApiResponse<Void>> partialRefundMapping(@PathVariable Long id,
            @RequestBody Map<String, Object> requestBody, HttpSession session) {
        log.info("🔧 매칭 부분 환불: ID={}", id);

        String reason = (String) requestBody.get("reason");
        Object refundSessionsObj = requestBody.get("refundSessions");

        if (refundSessionsObj == null) {
            throw new IllegalArgumentException("환불할 회기수를 지정해주세요.");
        }

        int refundSessions;
        try {
            refundSessions = Integer.parseInt(refundSessionsObj.toString());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("환불 회기수는 숫자여야 합니다.");
        }

        adminService.partialRefundMapping(id, refundSessions, reason);
        return success(String.format("%d회기 부분 환불이 성공적으로 처리되었습니다", refundSessions));
    }

    /**
     * 환불 통계 조회
     */
    @GetMapping("/refund-statistics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRefundStatistics(
            @RequestParam(defaultValue = "month") String period, HttpSession session) {
        log.info("📊 환불 통계 조회: period={}", period);

        User currentUser = SessionUtils.getCurrentUser(session);
        String currentBranchCode = currentUser != null ? currentUser.getBranchCode() : null;
        log.info("🔍 현재 사용자 지점코드: {}", currentBranchCode);

        Map<String, Object> statistics =
                adminService.getRefundStatistics(period, currentBranchCode);

        return success(statistics);
    }

    /**
     * 환불 이력 조회
     */
    @GetMapping("/refund-history")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRefundHistory(
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String period,
            @RequestParam(required = false) String status, HttpSession session) {
        log.info("📋 환불 이력 조회: page={}, size={}, period={}, status={}", page, size, period, status);

        User currentUser = SessionUtils.getCurrentUser(session);
        String currentBranchCode = currentUser != null ? currentUser.getBranchCode() : null;
        log.info("🔍 현재 사용자 지점코드: {}", currentBranchCode);

        Map<String, Object> result =
                adminService.getRefundHistory(page, size, period, status, currentBranchCode);

        return success(result);
    }

    /**
     * ERP 동기화 상태 확인
     */
    @GetMapping("/erp-sync-status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getErpSyncStatus() {
        log.info("🔄 ERP 동기화 상태 확인");
        Map<String, Object> status = adminService.getErpSyncStatus();

        return success(status);
    }


    /**
     * 상담사 변경 처리
     */
    @PostMapping("/mappings/transfer")
    public ResponseEntity<ApiResponse<Map<String, Object>>> transferConsultant(
            @RequestBody ConsultantTransferRequest request) {
        log.info("🔄 상담사 변경 요청: 기존 매칭 ID={}, 새 상담사 ID={}", request.getCurrentMappingId(),
                request.getNewConsultantId());

        ConsultantClientMapping newMapping = adminService.transferConsultant(request);

        Map<String, Object> mappingData = new HashMap<>();
        mappingData.put("id", newMapping.getId());
        mappingData.put("status",
                newMapping.getStatus() != null ? newMapping.getStatus().toString() : "UNKNOWN");
        mappingData.put("paymentStatus",
                newMapping.getPaymentStatus() != null ? newMapping.getPaymentStatus().toString()
                        : "UNKNOWN");
        mappingData.put("totalSessions", newMapping.getTotalSessions());
        mappingData.put("remainingSessions", newMapping.getRemainingSessions());
        mappingData.put("packageName", newMapping.getPackageName());
        mappingData.put("packagePrice", newMapping.getPackagePrice());
        mappingData.put("assignedAt", newMapping.getAssignedAt());
        mappingData.put("createdAt", newMapping.getCreatedAt());

        if (newMapping.getConsultant() != null) {
            Map<String, Object> consultantData = new HashMap<>();
            consultantData.put("id", newMapping.getConsultant().getId());
            consultantData.put("name", newMapping.getConsultant().getName());
            consultantData.put("email", newMapping.getConsultant().getEmail());
            mappingData.put("consultant", consultantData);
        }

        if (newMapping.getClient() != null) {
            Map<String, Object> clientData = new HashMap<>();
            clientData.put("id", newMapping.getClient().getId());
            clientData.put("name", newMapping.getClient().getName());
            clientData.put("email", newMapping.getClient().getEmail());
            mappingData.put("client", clientData);
        }

        return success("상담사가 성공적으로 변경되었습니다.", mappingData);
    }

    /**
     * 내담자별 상담사 변경 이력 조회
     */
    @GetMapping("/clients/{clientId}/transfer-history")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTransferHistory(
            @PathVariable Long clientId) {
        log.info("🔍 내담자 ID {} 상담사 변경 이력 조회", clientId);
        List<ConsultantClientMapping> transferHistory = adminService.getTransferHistory(clientId);

        List<Map<String, Object>> historyData = transferHistory.stream().map(mapping -> {
            Map<String, Object> data = new HashMap<>();
            data.put("id", mapping.getId());
            data.put("status",
                    mapping.getStatus() != null ? mapping.getStatus().toString() : "UNKNOWN");
            data.put("terminationReason", mapping.getTerminationReason());
            data.put("terminatedAt", mapping.getTerminatedAt());
            data.put("terminatedBy", mapping.getTerminatedBy());
            data.put("startDate", mapping.getStartDate());
            data.put("endDate", mapping.getEndDate());

            if (mapping.getConsultant() != null) {
                Map<String, Object> consultantData = new HashMap<>();
                consultantData.put("id", mapping.getConsultant().getId());
                consultantData.put("name", mapping.getConsultant().getName());
                consultantData.put("email", mapping.getConsultant().getEmail());
                data.put("consultant", consultantData);
            }

            return data;
        }).collect(java.util.stream.Collectors.toList());

        Map<String, Object> data = new HashMap<>();
        data.put("history", historyData);
        data.put("count", historyData.size());

        return success(data);
    }

    /**
     * 입금 확인 (현금 수입)
     */
    @PostMapping("/mappings/{mappingId}/confirm-deposit")
    public ResponseEntity<ApiResponse<Map<String, Object>>> confirmDeposit(
            @PathVariable Long mappingId, @RequestBody Map<String, Object> request,
            HttpSession session) {
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(session,
                "MAPPING_MANAGE", dynamicPermissionService);
        if (permissionResponse != null) {
            throw new org.springframework.security.access.AccessDeniedException("권한이 없습니다.");
        }

        log.info("💰 매칭 ID {} 입금 확인 시작", mappingId);
        log.info("💰 요청 전체 데이터: {}", request);

        String depositReference = (String) request.get("depositReference");

        log.info("💰 요청 데이터 - depositReference: {}", depositReference);

        ConsultantClientMapping existingMapping = adminService.getMappingById(mappingId);
        if (existingMapping == null) {
            log.error("❌ 매핑 ID {}를 찾을 수 없습니다", mappingId);
            throw new IllegalArgumentException("매핑을 찾을 수 없습니다.");
        }

        log.info("💰 현재 매핑 상태 - status: {}, paymentStatus: {}", existingMapping.getStatus(),
                existingMapping.getPaymentStatus());

        ConsultantClientMapping mapping = adminService.confirmDeposit(mappingId, depositReference);

        log.info("💰 매칭 ID {} 입금 확인 완료 (현금 수입)", mappingId);

        // 트랜잭션이 커밋된 후 별도의 트랜잭션에서 통계 업데이트 및 상담료 수입 거래 생성
        // 이렇게 하면 실패가 입금 확인 트랜잭션에 영향을 주지 않음
        // LazyInitializationException 방지를 위해 트랜잭션 내에서 필요한 ID를 미리 추출
        Long consultantId = null;
        Long clientId = null;
        Long paymentAmount = null;

        try {
            // 트랜잭션이 끝나기 전에 필요한 데이터를 미리 조회
            ConsultantClientMapping mappingWithRelations = adminService.getMappingById(mappingId);
            if (mappingWithRelations != null) {
                if (mappingWithRelations.getConsultant() != null) {
                    consultantId = mappingWithRelations.getConsultant().getId();
                }
                if (mappingWithRelations.getClient() != null) {
                    clientId = mappingWithRelations.getClient().getId();
                }
                paymentAmount = mappingWithRelations.getPaymentAmount();
            }
        } catch (Exception e) {
            log.warn("⚠️ 매핑 정보 재조회 실패 (통계 업데이트는 건너뜀): {}", e.getMessage());
        }

        try {
            // 통계 업데이트 (독립적인 트랜잭션)
            if (consultantId != null && clientId != null) {
                realTimeStatisticsService.updateStatisticsOnMappingChange(consultantId, clientId,
                        null // 브랜치 코드 사용 금지
                );

                if (paymentAmount != null) {
                    realTimeStatisticsService.updateFinancialStatisticsOnPayment(null, // 브랜치 코드 사용
                                                                                       // 금지
                            paymentAmount, java.time.LocalDate.now());
                }

                log.info("✅ 입금 확인 후 실시간 통계 업데이트 완료: mappingId={}", mappingId);
            }
        } catch (Exception e) {
            log.error("❌ 입금 확인 후 실시간 통계 업데이트 실패 (입금 확인은 이미 완료됨): {}", e.getMessage(), e);
        }

        // ERP 거래(INCOME) 생성은 AdminServiceImpl.confirmDeposit() 내부에서 처리
        // (confirm-payment와 동일한 createConsultationIncomeTransaction / createAdditionalSessionIncomeTransaction 재사용)

        Map<String, Object> mappingData = new HashMap<>();
        mappingData.put("id", mapping.getId());
        mappingData.put("status",
                mapping.getStatus() != null ? mapping.getStatus().toString() : "UNKNOWN");
        mappingData.put("paymentStatus",
                mapping.getPaymentStatus() != null ? mapping.getPaymentStatus().toString()
                        : "UNKNOWN");
        mappingData.put("paymentMethod", mapping.getPaymentMethod());
        mappingData.put("paymentReference", mapping.getPaymentReference());
        mappingData.put("paymentAmount", mapping.getPaymentAmount());
        mappingData.put("paymentDate", mapping.getPaymentDate());
        mappingData.put("totalSessions", mapping.getTotalSessions());
        mappingData.put("remainingSessions", mapping.getRemainingSessions());
        mappingData.put("packageName", mapping.getPackageName());
        mappingData.put("packagePrice", mapping.getPackagePrice());

        // LazyInitializationException 방지를 위해 트랜잭션 내에서 조회한 데이터 사용
        try {
            ConsultantClientMapping mappingWithRelations = adminService.getMappingById(mappingId);
            if (mappingWithRelations != null) {
                if (mappingWithRelations.getConsultant() != null) {
                    Map<String, Object> consultantData = new HashMap<>();
                    consultantData.put("id", mappingWithRelations.getConsultant().getId());
                    consultantData.put("userId", mappingWithRelations.getConsultant().getUserId());
                    consultantData.put("email", mappingWithRelations.getConsultant().getEmail());
                    mappingData.put("consultant", consultantData);
                }

                if (mappingWithRelations.getClient() != null) {
                    Map<String, Object> clientData = new HashMap<>();
                    clientData.put("id", mappingWithRelations.getClient().getId());
                    clientData.put("userId", mappingWithRelations.getClient().getUserId());
                    clientData.put("email", mappingWithRelations.getClient().getEmail());
                    mappingData.put("client", clientData);
                }
            }
        } catch (Exception e) {
            log.warn("⚠️ 매핑 관계 데이터 조회 실패 (기본 데이터만 반환): {}", e.getMessage());
        }

        return success("입금이 성공적으로 확인되었습니다.", mappingData);
    }

    /**
     * 매칭 결제 확인
     */
    @PostMapping("/mapping/payment/confirm")
    public ResponseEntity<ApiResponse<Map<String, Object>>> confirmMappingPayment(
            @RequestBody Map<String, Object> request) {
        log.info("결제 확인 요청: {}", request);

        @SuppressWarnings("unchecked")
        List<Long> mappingIds = (List<Long>) request.get("mappingIds");
        String paymentMethod = (String) request.get("paymentMethod");
        Integer amount = (Integer) request.get("amount");
        String note = (String) request.get("note");

        if (mappingIds == null || mappingIds.isEmpty()) {
            throw new IllegalArgumentException("매칭 ID가 필요합니다.");
        }

        log.info("결제 확인 처리: mappingIds={}, method={}, amount={}, note={}", mappingIds,
                paymentMethod, amount, note);

        for (Long mappingId : mappingIds) {
            try {
                adminService.confirmPayment(mappingId, paymentMethod,
                        "ADMIN_CONFIRMED_" + System.currentTimeMillis(),
                        amount != null ? amount.longValue() : 0L);
                log.info("매칭 ID {} 결제 확인 및 ERP 연동 완료", mappingId);
            } catch (Exception e) {
                log.error("매칭 ID {} 결제 확인 실패: {}", mappingId, e.getMessage());
            }
        }

        Map<String, Object> data = new HashMap<>();
        data.put("confirmedMappings", mappingIds);
        data.put("paymentMethod", paymentMethod);
        data.put("amount", amount);
        data.put("note", note);
        data.put("confirmedAt", System.currentTimeMillis());

        return success("결제가 성공적으로 확인되었습니다.", data);
    }

    /**
     * 매칭 결제 취소
     */
    @PostMapping("/mapping/payment/cancel")
    public ResponseEntity<ApiResponse<Map<String, Object>>> cancelMappingPayment(
            @RequestBody Map<String, Object> request) {
        log.info("결제 취소 요청: {}", request);

        @SuppressWarnings("unchecked")
        List<Long> mappingIds = (List<Long>) request.get("mappingIds");

        if (mappingIds == null || mappingIds.isEmpty()) {
            throw new IllegalArgumentException("매칭 ID가 필요합니다.");
        }

        log.info("결제 취소 처리: mappingIds={}", mappingIds);

        for (Long mappingId : mappingIds) {
            try {
                ConsultantClientMapping mapping = adminService.getMappingById(mappingId);
                if (mapping != null) {
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                    mapping.setPaymentStatus(ConsultantClientMapping.PaymentStatus.REJECTED);
                    mapping.setUpdatedAt(java.time.LocalDateTime.now());

                    log.info("매칭 ID {} 결제 취소 완료", mappingId);
                }
            } catch (Exception e) {
                log.error("매칭 ID {} 결제 취소 실패: {}", mappingId, e.getMessage());
            }
        }

        Map<String, Object> data = new HashMap<>();
        data.put("cancelledMappings", mappingIds);
        data.put("cancelledAt", System.currentTimeMillis());

        return success("결제가 성공적으로 취소되었습니다.", data);
    }

    /**
     * 상담사별 상담 완료 건수 통계 조회
     */
    @GetMapping("/statistics/consultation-completion")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getConsultationCompletionStatistics(
            @RequestParam(required = false) String period, HttpSession session) {
        log.info("📊 상담사별 상담 완료 건수 통계 조회: period={}", period);

        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            log.error("❌ 로그인된 사용자 정보가 없습니다");
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }

        // 표준화 원칙: SessionUtils.getTenantId() 사용 (세션 → User 객체 순서로 확인)
        String tenantId = SessionUtils.getTenantId(session);
        if (tenantId == null || tenantId.isEmpty()) {
            log.error("❌ tenantId가 필수입니다. 사용자 ID: {}, 이메일: {}, 역할: {}", currentUser.getId(),
                    currentUser.getEmail(), currentUser.getRole());
            String errorMessage = String.format("테넌트 정보가 없습니다. 사용자 ID: %d, 역할: %s. 관리자에게 문의하세요.",
                    currentUser.getId(), currentUser.getRole());
            throw new IllegalArgumentException(errorMessage);
        }

        log.info("👤 현재 사용자 정보: userId={}, tenantId={}, 역할={}", currentUser.getId(), tenantId,
                currentUser.getRole());

        // TenantContextHolder에 tenantId 설정 (서비스에서 getTenantId() 사용을 위해)
        com.coresolution.core.context.TenantContextHolder.setTenantId(tenantId);

        // 표준화 2025-12-08: branchCode 제거, tenantId 기반으로만 조회
        List<Map<String, Object>> statistics =
                adminService.getConsultationCompletionStatistics(period);
        List<Map<String, Object>> monthlyData = adminService.getConsultationMonthlyTrend(6);
        List<Map<String, Object>> weeklyData = adminService.getConsultationWeeklyTrend(6);

        // 대시보드 KPI용: 전체 완료 건수·완료율 집계 (프론트 완료율 0% 방지)
        int totalCompleted = 0;
        long totalScheduled = 0;
        for (Map<String, Object> row : statistics) {
            Object completed = row.get("completedCount");
            Object total = row.get("totalCount");
            totalCompleted += completed instanceof Number ? ((Number) completed).intValue() : 0;
            totalScheduled += total instanceof Number ? ((Number) total).longValue() : 0;
        }
        double completionRate = totalScheduled > 0
                ? Math.round((double) totalCompleted / totalScheduled * 100.0 * 10.0) / 10.0
                : 0.0;

        // 이번 달·지난달 완료율로 증감 계산 (KPI 배지용)
        LocalDate now = LocalDate.now();
        double thisMonthRate = adminService.getCompletionRateForMonth(now.getYear(), now.getMonthValue());
        LocalDate lastMonth = now.minusMonths(1);
        double lastMonthRate = adminService.getCompletionRateForMonth(lastMonth.getYear(), lastMonth.getMonthValue());
        double completionRateChange = Math.round((thisMonthRate - lastMonthRate) * 10.0) / 10.0;

        Map<String, Object> data = new HashMap<>();
        data.put("statistics", statistics);
        data.put("count", statistics.size());
        data.put("period", period != null ? period : "전체");
        data.put("monthlyData", monthlyData);
        data.put("weeklyData", weeklyData);
        data.put("totalCompleted", totalCompleted);
        data.put("completionRate", completionRate);
        data.put("completionRateChange", completionRateChange);

        return success(data);
    }

    /**
     * 상담사별 스케줄 조회 (필터링)
     */
    @GetMapping("/schedules")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSchedules(
            @RequestParam(required = false) Long consultantId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        log.info("📅 어드민 스케줄 조회: consultantId={}, status={}, startDate={}, endDate={}",
                consultantId, status, startDate, endDate);

        List<Map<String, Object>> schedules;

        if (consultantId != null) {
            schedules = adminService.getSchedulesByConsultantId(consultantId);
        } else {
            schedules = adminService.getAllSchedules();
        }

        if (status != null && !status.isEmpty() && !"ALL".equals(status)) {
            schedules = schedules.stream().filter(schedule -> status.equals(schedule.get("status")))
                    .collect(java.util.stream.Collectors.toList());
        }

        if (startDate != null && !startDate.isEmpty()) {
            schedules = schedules.stream().filter(schedule -> {
                String scheduleDate = schedule.get("startTime") != null
                        ? schedule.get("startTime").toString().substring(0, 10)
                        : "";
                return scheduleDate.compareTo(startDate) >= 0;
            }).collect(java.util.stream.Collectors.toList());
        }

        if (endDate != null && !endDate.isEmpty()) {
            schedules = schedules.stream().filter(schedule -> {
                String scheduleDate = schedule.get("startTime") != null
                        ? schedule.get("startTime").toString().substring(0, 10)
                        : "";
                return scheduleDate.compareTo(endDate) <= 0;
            }).collect(java.util.stream.Collectors.toList());
        }

        Map<String, Object> data = new HashMap<>();
        data.put("schedules", schedules);
        data.put("count", schedules.size());
        data.put("consultantId", consultantId);
        data.put("status", status);
        data.put("startDate", startDate);
        data.put("endDate", endDate);

        return success(data);
    }

    /**
     * 스케줄 자동 완료 처리 (수동 실행)
     */
    @PostMapping("/schedules/auto-complete")
    public ResponseEntity<ApiResponse<Void>> autoCompleteSchedules() {
        log.info("🔄 스케줄 자동 완료 처리 수동 실행");

        scheduleService.autoCompleteExpiredSchedules();

        return success("스케줄 자동 완료 처리가 실행되었습니다.");
    }

    /**
     * 스케줄 자동 완료 처리 및 상담일지 미작성 알림 (수동 실행)
     */
    @PostMapping("/schedules/auto-complete-with-reminder")
    public ResponseEntity<ApiResponse<Map<String, Object>>> autoCompleteSchedulesWithReminder() {
        log.info("🔄 스케줄 자동 완료 처리 및 상담일지 미작성 알림 수동 실행");

        Map<String, Object> result = adminService.autoCompleteSchedulesWithReminder();

        return success(result);
    }

    /**
     * 스케줄 상태별 통계 조회
     */
    @GetMapping("/schedules/statistics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getScheduleStatistics(
            @RequestParam(required = false) String userRole, HttpSession session) {
        log.info("📊 스케줄 상태별 통계 조회 요청 - 사용자 역할: {}", userRole);

        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            log.warn("❌ 인증되지 않은 사용자");
            throw new org.springframework.security.access.AccessDeniedException("인증이 필요합니다.");
        }

        log.info("👤 현재 사용자: {} (역할: {}, 지점코드: {})", currentUser.getUserId(), currentUser.getRole(),
                currentUser.getBranchCode());

        Map<String, Object> statistics;
        if (isAdminRoleFromCommonCode(currentUser.getRole())
                && currentUser.getBranchCode() != null) {
            log.info("🏢 지점 관리자 - 자신의 지점 스케줄만 조회 (역할: {}, 지점: {})", currentUser.getRole(),
                    currentUser.getBranchCode());
            statistics = adminService.getScheduleStatisticsByBranch(currentUser.getBranchCode());
        } else {
            log.info("🏢 본사 관리자 - 모든 스케줄 조회 (역할: {})", currentUser.getRole());
            statistics = adminService.getScheduleStatistics();
        }

        if (statistics == null) {
            log.warn("⚠️ 스케줄 통계가 null입니다.");
            throw new RuntimeException("스케줄 통계를 조회할 수 없습니다.");
        }

        log.info("✅ 스케줄 통계 조회 완료 - 총 스케줄: {}", statistics.get("totalSchedules"));

        return success(statistics);
    }

    /**
     * 사용자 목록 조회
     */
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUsers(
            @RequestParam(value = "includeInactive",
                    defaultValue = "false") boolean includeInactive,
            @RequestParam(value = "role", required = false) String role,
            @RequestParam(value = "branchCode", required = false) String branchCode,
            HttpSession session) {
        log.info("🔍 사용자 목록 조회: includeInactive={}, role={}", includeInactive, role);

        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }

        if (!currentUser.getRole().isAdmin()) {
            throw new org.springframework.security.access.AccessDeniedException("권한이 없습니다.");
        }

        String targetBranchCode = branchCode; // 레거시 호환용 (사용하지 않음)

        List<User> users = adminService.getUsers(includeInactive, role, targetBranchCode);

        List<Map<String, Object>> userList = users.stream().map(user -> {
            Map<String, Object> userData = new HashMap<>();
            userData.put("id", user.getId());
            userData.put("name", user.getName() != null ? user.getName() : "");
            userData.put("email", user.getEmail() != null ? user.getEmail() : "");
            userData.put("phone", user.getPhone() != null ? user.getPhone() : "");
            userData.put("role", user.getRole() != null ? user.getRole().name() : "");
            userData.put("roleDisplayName",
                    user.getRole() != null ? user.getRole().getDisplayName() : "");
            userData.put("branchCode", user.getBranchCode() != null ? user.getBranchCode() : "");
            userData.put("isActive", user.getIsActive() != null ? user.getIsActive() : false);
            userData.put("createdAt",
                    user.getCreatedAt() != null ? user.getCreatedAt().toString() : "");
            return userData;
        }).collect(Collectors.toList());

        log.info("✅ 사용자 목록 조회 완료: {}명", userList.size());

        Map<String, Object> data = new HashMap<>();
        data.put("users", userList);
        data.put("total", userList.size());

        return success(data);
    }

    /**
     * 사용자 역할 변경
     */
    @PutMapping("/users/{userId}/role")
    public ResponseEntity<ApiResponse<Map<String, Object>>> changeUserRole(
            @PathVariable Long userId, @RequestParam String newRole, HttpSession session) {
        log.info("🔧 사용자 역할 변경: userId={}, newRole={}", userId, newRole);

        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }

        UserRole userRole = currentUser.getRole();
        boolean hasPermission = userRole.isAdmin();

        if (!hasPermission) {
            log.warn("❌ 사용자 역할 변경 권한 없음: role={}", userRole);
            throw new org.springframework.security.access.AccessDeniedException("권한이 없습니다.");
        }

        User updatedUser = adminService.changeUserRole(userId, newRole);

        if (updatedUser == null) {
            throw new IllegalArgumentException("사용자를 찾을 수 없습니다.");
        }

        log.info("✅ 사용자 역할 변경 완료: userId={}, newRole={}", userId, newRole);

        Map<String, Object> data = new HashMap<>();
        data.put("id", updatedUser.getId());
        data.put("name", updatedUser.getName());
        data.put("role", updatedUser.getRole().name());
        data.put("roleDisplayName", updatedUser.getRole().getDisplayName());

        return updated("사용자 역할이 성공적으로 변경되었습니다.", data);
    }

    /**
     * 사용자 상세 정보 조회
     */
    @GetMapping("/users/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUserById(@PathVariable Long id,
            HttpSession session) {
        log.info("🔍 사용자 상세 정보 조회: ID={}", id);

        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null || (!isAdminRoleFromCommonCode(currentUser.getRole()))) {
            throw new org.springframework.security.access.AccessDeniedException("권한이 없습니다.");
        }

        User user = adminService.getUserById(id);
        if (user == null) {
            throw new IllegalArgumentException("사용자를 찾을 수 없습니다.");
        }

        Map<String, Object> userData = new HashMap<>();
        userData.put("id", user.getId());
        userData.put("name", user.getName() != null ? user.getName() : "");
        userData.put("email", user.getEmail() != null ? user.getEmail() : "");
        userData.put("phone", user.getPhone() != null ? user.getPhone() : "");
        userData.put("role", user.getRole() != null ? user.getRole().name() : "");
        userData.put("roleDisplayName",
                user.getRole() != null ? user.getRole().getDisplayName() : "");
        userData.put("branchCode", user.getBranchCode() != null ? user.getBranchCode() : "");
        userData.put("isActive", user.getIsActive() != null ? user.getIsActive() : false);
        userData.put("createdAt",
                user.getCreatedAt() != null ? user.getCreatedAt().toString() : "");

        log.info("✅ 사용자 상세 정보 조회 완료: {}({})", user.getName(), user.getRole());

        return success(userData);
    }

    /**
     * 사용자 소셜 계정 정보 조회
     */
    @GetMapping("/users/{id}/social-accounts")
    public ResponseEntity<ApiResponse<List<?>>> getUserSocialAccounts(@PathVariable Long id,
            HttpSession session) {
        log.info("🔍 사용자 소셜 계정 정보 조회: ID={}", id);

        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null || (!isAdminRoleFromCommonCode(currentUser.getRole()))) {
            throw new org.springframework.security.access.AccessDeniedException("권한이 없습니다.");
        }

        // 테넌트별 소셜 계정 조회
        String tenantId = SessionUtils.getTenantId(session);
        var socialAccounts = tenantId != null
                ? userSocialAccountRepository.findByTenantIdAndUserIdAndIsDeletedFalse(tenantId, id)
                : userSocialAccountRepository.findByUserIdAndIsDeletedFalse(id); // 레거시 호환

        log.info("✅ 사용자 소셜 계정 정보 조회 완료: ID={}, count={}", id, socialAccounts.size());

        return success(socialAccounts);
    }

    /**
     * 사용자 역할 정보 조회 (동적 표시명) - 기존 호환성
     */
    @GetMapping("/user-roles")
    public ResponseEntity<ApiResponse<Map<String, Map<String, String>>>> getUserRolesLegacy() {
        return getUserRoles();
    }

    /**
     * 사용자 역할 정보 조회 (동적 표시명)
     */
    @GetMapping("/users/roles")
    public ResponseEntity<ApiResponse<Map<String, Map<String, String>>>> getUserRoles() {
        log.info("🔍 사용자 역할 정보 조회");

        Map<String, Map<String, String>> roleInfo = new HashMap<>();

        for (UserRole role : UserRole.values()) {
            Map<String, String> roleData = new HashMap<>();
            roleData.put("value", role.name());
            roleData.put("displayName", role.getDisplayName());
            roleData.put("displayNameEn", getEnglishDisplayName(role));
            roleInfo.put(role.name(), roleData);
        }

        log.info("✅ 사용자 역할 정보 조회 완료: {}개 역할", roleInfo.size());

        return success(roleInfo);
    }

    /**
     * 역할별 영문 표시명 매칭
     */
    private String getEnglishDisplayName(UserRole role) {
        switch (role) {
            case CLIENT:
                return "Client";
            case CONSULTANT:
                return "Consultant";
            case ADMIN:
                return "Admin";
            // Deprecated roles removed - use ADMIN instead
            default:
                return role.name();
        }
    }

    /**
     * 메뉴 목록 조회 (사용자 역할별)
     */
    @GetMapping("/menus")
    public ResponseEntity<Map<String, Object>> getMenus(HttpSession session) {
        try {
            log.info("🔍 메뉴 목록 조회");

            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "로그인이 필요합니다.");
                return ResponseEntity.status(401).body(response);
            }

            Map<String, Object> menuStructure =
                    menuService.getMenuStructureByRole(currentUser.getRole());
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> menus =
                    (List<Map<String, Object>>) menuStructure.get("menus");

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", menus);
            response.put("totalCount", menus.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ 메뉴 목록 조회 실패: {}", e.getMessage(), e);

            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "메뉴 목록 조회에 실패했습니다: " + e.getMessage());

            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * 재무 거래 목록 조회 (테넌트별 필터링 적용)
     */
    @GetMapping("/financial-transactions")
    public ResponseEntity<Map<String, Object>> getFinancialTransactions(
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String transactionType,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate, HttpSession session) {
        try {
            log.info("🔍 재무 거래 목록 조회: 유형={}, 카테고리={}", transactionType, category);

            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                log.warn("❌ 세션에서 사용자 정보를 찾을 수 없습니다.");
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "로그인이 필요합니다.");
                return ResponseEntity.status(401).body(response);
            }

            // 표준화 원칙: SessionUtils.getTenantId() 사용
            String tenantId = SessionUtils.getTenantId(session);
            log.info("👤 현재 사용자: 이메일={}, 역할={}, tenantId={}", currentUser.getEmail(),
                    currentUser.getRole(), tenantId);

            org.springframework.data.domain.Page<com.coresolution.consultation.dto.FinancialTransactionResponse> transactions =
                    financialTransactionService
                            .getTransactions(PaginationUtils.createPageable(page, size));

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", transactions.getContent());
            response.put("totalCount", transactions.getTotalElements());
            response.put("totalPages", transactions.getTotalPages());
            response.put("currentPage", transactions.getNumber());
            response.put("size", transactions.getSize());

            log.info("✅ 재무 거래 목록 조회 완료: tenantId={}, 총 {}건", tenantId,
                    transactions.getTotalElements());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ 재무 거래 목록 조회 실패: {}", e.getMessage(), e);

            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "재무 거래 목록 조회에 실패했습니다: " + e.getMessage());

            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * 예산 목록 조회
     */
    @GetMapping("/budgets")
    public ResponseEntity<Map<String, Object>> getBudgets(
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size,
            HttpSession session) {
        try {
            log.info("🔍 예산 목록 조회");

            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "로그인이 필요합니다.");
                return ResponseEntity.status(401).body(response);
            }

            java.util.List<com.coresolution.consultation.entity.Budget> budgets =
                    erpService.getAllActiveBudgets();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", budgets);
            response.put("totalCount", budgets.size());
            response.put("totalPages", 1);
            response.put("currentPage", 0);
            response.put("size", budgets.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ 예산 목록 조회 실패: {}", e.getMessage(), e);

            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "예산 목록 조회에 실패했습니다: " + e.getMessage());

            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * 세금 계산 목록 조회
     */
    @GetMapping("/tax/calculations")
    public ResponseEntity<Map<String, Object>> getTaxCalculations(
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size,
            HttpSession session) {
        try {
            log.info("🔍 세금 계산 목록 조회");

            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "로그인이 필요합니다.");
                return ResponseEntity.status(401).body(response);
            }

            if (!currentUser.getRole().isAdmin()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "세금 관리 권한이 없습니다.");
                return ResponseEntity.status(403).body(response);
            }

            List<Map<String, Object>> taxCalculations = new ArrayList<>();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", taxCalculations);
            response.put("totalCount", taxCalculations.size());
            response.put("totalPages", 1);
            response.put("currentPage", 0);
            response.put("size", taxCalculations.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ 세금 계산 목록 조회 실패: {}", e.getMessage(), e);

            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "세금 계산 목록 조회에 실패했습니다: " + e.getMessage());

            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * 세금 계산 항목 생성
     */
    @PostMapping("/tax/calculations")
    public ResponseEntity<Map<String, Object>> createTaxCalculation(
            @RequestBody Map<String, Object> taxData, HttpSession session) {
        try {
            log.info("🔍 세금 계산 항목 생성");

            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "로그인이 필요합니다.");
                return ResponseEntity.status(401).body(response);
            }

            if (!currentUser.getRole().isAdmin()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "세금 관리 권한이 없습니다.");
                return ResponseEntity.status(403).body(response);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "세금 계산 항목이 생성되었습니다.");
            response.put("data", taxData);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ 세금 계산 항목 생성 실패: {}", e.getMessage(), e);

            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "세금 계산 항목 생성에 실패했습니다: " + e.getMessage());

            return ResponseEntity.badRequest().body(response);
        }
    }


    /**
     * 관리자용 상담일지 목록 조회
     */
    @GetMapping("/consultation-records")
    public ResponseEntity<Map<String, Object>> getConsultationRecords(
            @RequestParam(required = false) Long consultantId,
            @RequestParam(required = false) Long clientId,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size,
            HttpSession session) {
        try {
            log.info("📝 관리자용 상담일지 목록 조회 - 상담사 ID: {}, 내담자 ID: {}", consultantId, clientId);

            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(401)
                        .body(Map.of("success", false, "message", "로그인이 필요합니다."));
            }

            if (!isAdminRoleFromCommonCode(currentUser.getRole())) {
                return ResponseEntity.status(403)
                        .body(Map.of("success", false, "message", "관리자 권한이 필요합니다."));
            }

            org.springframework.data.domain.Pageable pageable =
                    PaginationUtils.createPageable(page, size);

            org.springframework.data.domain.Page<com.coresolution.consultation.entity.ConsultationRecord> consultationRecords =
                    consultationRecordService.getConsultationRecords(consultantId, clientId,
                            pageable);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", consultationRecords.getContent());
            response.put("totalCount", consultationRecords.getTotalElements());
            response.put("totalPages", consultationRecords.getTotalPages());
            response.put("currentPage", consultationRecords.getNumber());
            response.put("size", consultationRecords.getSize());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ 관리자용 상담일지 목록 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(
                    Map.of("success", false, "message", "상담일지 목록 조회에 실패했습니다: " + e.getMessage()));
        }
    }

    /**
     * 관리자용 상담일지 상세 조회
     */
    @GetMapping("/consultation-records/{recordId}")
    public ResponseEntity<Map<String, Object>> getConsultationRecord(@PathVariable Long recordId,
            HttpSession session) {
        try {
            log.info("📝 관리자용 상담일지 상세 조회 - 기록 ID: {}", recordId);

            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(401)
                        .body(Map.of("success", false, "message", "로그인이 필요합니다."));
            }

            if (!isAdminRoleFromCommonCode(currentUser.getRole())) {
                return ResponseEntity.status(403)
                        .body(Map.of("success", false, "message", "관리자 권한이 필요합니다."));
            }

            com.coresolution.consultation.entity.ConsultationRecord record =
                    consultationRecordService.getConsultationRecordById(recordId);

            if (record == null) {
                return ResponseEntity.notFound().build();
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", record);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ 관리자용 상담일지 상세 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(
                    Map.of("success", false, "message", "상담일지 상세 조회에 실패했습니다: " + e.getMessage()));
        }
    }

    /**
     * 관리자용 상담일지 수정
     */
    @PutMapping("/consultation-records/{recordId}")
    public ResponseEntity<Map<String, Object>> updateConsultationRecord(@PathVariable Long recordId,
            @RequestBody Map<String, Object> recordData, HttpSession session) {
        try {
            log.info("📝 관리자용 상담일지 수정 - 기록 ID: {}", recordId);

            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(401)
                        .body(Map.of("success", false, "message", "로그인이 필요합니다."));
            }

            if (!isAdminRoleFromCommonCode(currentUser.getRole())) {
                return ResponseEntity.status(403)
                        .body(Map.of("success", false, "message", "관리자 권한이 필요합니다."));
            }

            com.coresolution.consultation.entity.ConsultationRecord updatedRecord =
                    consultationRecordService.updateConsultationRecord(recordId, recordData);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "상담일지가 성공적으로 수정되었습니다.");
            response.put("data", updatedRecord);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ 관리자용 상담일지 수정 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(
                    Map.of("success", false, "message", "상담일지 수정에 실패했습니다: " + e.getMessage()));
        }
    }

    /**
     * 관리자용 상담일지 삭제
     */
    @DeleteMapping("/consultation-records/{recordId}")
    public ResponseEntity<Map<String, Object>> deleteConsultationRecord(@PathVariable Long recordId,
            HttpSession session) {
        try {
            log.info("📝 관리자용 상담일지 삭제 - 기록 ID: {}", recordId);

            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(401)
                        .body(Map.of("success", false, "message", "로그인이 필요합니다."));
            }

            if (!isAdminRoleFromCommonCode(currentUser.getRole())) {
                return ResponseEntity.status(403)
                        .body(Map.of("success", false, "message", "관리자 권한이 필요합니다."));
            }

            consultationRecordService.deleteConsultationRecord(recordId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "상담일지가 성공적으로 삭제되었습니다.");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ 관리자용 상담일지 삭제 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(
                    Map.of("success", false, "message", "상담일지 삭제에 실패했습니다: " + e.getMessage()));
        }
    }

    /**
     * 중복 매칭 조회
     */
    @GetMapping("/duplicate-mappings")
    public ResponseEntity<ApiResponse<Map<String, Object>>> findDuplicateMappings(
            HttpSession session) {
        log.info("🔍 중복 매칭 조회");

        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }

        if (!isAdminRoleFromCommonCode(currentUser.getRole())) {
            throw new org.springframework.security.access.AccessDeniedException("관리자 권한이 필요합니다.");
        }

        List<Map<String, Object>> duplicates = adminService.findDuplicateMappings();

        Map<String, Object> data = new HashMap<>();
        data.put("duplicates", duplicates);
        data.put("count", duplicates.size());

        return success(data);
    }

    /**
     * /** 중복 매칭 통합
     */
    @PostMapping("/merge-duplicate-mappings")
    public ResponseEntity<ApiResponse<Map<String, Object>>> mergeDuplicateMappings(
            HttpSession session) {
        log.info("🔄 중복 매칭 통합 시작");

        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }

        if (!isAdminRoleFromCommonCode(currentUser.getRole())) {
            throw new org.springframework.security.access.AccessDeniedException("관리자 권한이 필요합니다.");
        }

        Map<String, Object> result = adminService.mergeDuplicateMappings();

        return success(result);
    }

    /**
     * 관리자용 상담사 평가 통계 조회
     */
    @GetMapping("/consultant-rating-stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getConsultantRatingStatistics(
            HttpSession session) {
        log.info("💖 관리자 평가 통계 조회 요청");

        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }

        // 표준화 원칙: SessionUtils.getTenantId() 사용 (세션 → User 객체 순서로 확인)
        String tenantId = SessionUtils.getTenantId(session);
        if (tenantId == null || tenantId.isEmpty()) {
            log.error("❌ tenantId가 필수입니다. 사용자 ID: {}, 이메일: {}, 역할: {}", currentUser.getId(),
                    currentUser.getEmail(), currentUser.getRole());
            String errorMessage = String.format("테넌트 정보가 없습니다. 사용자 ID: %d, 역할: %s. 관리자에게 문의하세요.",
                    currentUser.getId(), currentUser.getRole());
            throw new IllegalArgumentException(errorMessage);
        }

        log.info("👤 현재 사용자: {} (역할: {}, tenantId: {})", currentUser.getUserId(),
                currentUser.getRole(), tenantId);

        // TenantContextHolder에 tenantId 설정 (서비스에서 getRequiredTenantId() 사용을 위해)
        com.coresolution.core.context.TenantContextHolder.setTenantId(tenantId);

        // 표준화 2025-12-08: branchCode 제거, tenantId 기반으로만 조회
        Map<String, Object> statistics = consultantRatingService.getAdminRatingStatistics();

        log.info("✅ 관리자 평가 통계 조회 완료: tenantId={}", tenantId);

        return success(statistics);
    }


    /**
     * 상담사 전문분야 업데이트
     */
    @PutMapping("/consultants/{consultantId}/specialty")
    public ResponseEntity<Map<String, Object>> updateConsultantSpecialty(
            @PathVariable Long consultantId, @RequestBody Map<String, String> request,
            HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("success", false, "message", "인증이 필요합니다."));
            }

            if (!dynamicPermissionService.hasPermission(currentUser, "CONSULTANT_MANAGE")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("success", false, "message", "상담사 관리 권한이 없습니다."));
            }

            String specialty = request.get("specialty");
            if (specialty == null || specialty.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "전문분야를 입력해주세요."));
            }

            User consultant = userService.findById(consultantId).orElse(null);
            if (consultant == null) {
                return ResponseEntity.notFound().build();
            }

            consultant.setSpecialty(specialty.trim());
            userService.save(consultant);

            return ResponseEntity.ok(Map.of("success", true, "message", "상담사 전문분야가 업데이트되었습니다."));

        } catch (Exception e) {
            log.error("상담사 전문분야 업데이트 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("success",
                    false, "message", "상담사 전문분야 업데이트 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    /**
     * 전문분야 통계 조회 (통합 상담사 데이터 사용, 지점별 필터링 + 삭제 제외)
     */
    @GetMapping("/statistics/specialty")
    public ResponseEntity<Map<String, Object>> getSpecialtyStatistics(HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("success", false, "message", "인증이 필요합니다."));
            }

            if (!dynamicPermissionService.hasPermission(currentUser, "CONSULTANT_MANAGE")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("success", false, "message", "상담사 관리 권한이 없습니다."));
            }

            List<Map<String, Object>> consultantsList =
                    consultantStatsService.getAllConsultantsWithStats();

            long totalConsultants = consultantsList.size();
            long specialtySet = 0;
            Set<String> specialtyTypesSet = new HashSet<>();

            for (Map<String, Object> item : consultantsList) {
                Map<String, Object> consultantMap = (Map<String, Object>) item.get("consultant");
                if (consultantMap != null) {
                    String specialty = (String) consultantMap.get("specialty");
                    String specialization = (String) consultantMap.get("specialization");

                    if ((specialty != null && !specialty.trim().isEmpty())
                            || (specialization != null && !specialization.trim().isEmpty())) {
                        specialtySet++;
                    }

                    if (specialty != null && !specialty.trim().isEmpty()) {
                        specialtyTypesSet.add(specialty.trim());
                    }
                    if (specialization != null && !specialization.trim().isEmpty()) {
                        String[] specialties = specialization.split(",");
                        for (String s : specialties) {
                            if (!s.trim().isEmpty()) {
                                specialtyTypesSet.add(s.trim());
                            }
                        }
                    }
                }
            }

            long specialtyTypes = specialtyTypesSet.size();

            Map<String, Object> statistics = Map.of("totalConsultants", totalConsultants,
                    "specialtySet", specialtySet, "specialtyTypes", specialtyTypes);

            return ResponseEntity
                    .ok(Map.of("success", true, "data", statistics, "message", "전문분야 통계 조회 완료"));

        } catch (Exception e) {
            log.error("전문분야 통계 조회 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("success",
                    false, "message", "전문분야 통계 조회 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    /**
     * 반복 지출 목록 조회
     */
    @GetMapping("/recurring-expenses")
    public ResponseEntity<Map<String, Object>> getRecurringExpenses(HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("success", false, "message", "인증이 필요합니다."));
            }

            if (!dynamicPermissionService.hasPermission(currentUser, "FINANCIAL_VIEW")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("success", false, "message", "재무 조회 권한이 없습니다."));
            }

            List<Map<String, Object>> expenses = new ArrayList<>();

            return ResponseEntity.ok(Map.of("success", true, "data", expenses, "count",
                    expenses.size(), "message", "반복 지출 목록 조회 완료"));

        } catch (Exception e) {
            log.error("반복 지출 목록 조회 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("success",
                    false, "message", "반복 지출 목록 조회 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    /**
     * 반복 지출 통계 조회
     */
    @GetMapping("/statistics/recurring-expenses")
    public ResponseEntity<Map<String, Object>> getRecurringExpenseStatistics(HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("success", false, "message", "인증이 필요합니다."));
            }

            if (!dynamicPermissionService.hasPermission(currentUser, "FINANCIAL_VIEW")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("success", false, "message", "재무 조회 권한이 없습니다."));
            }

            Map<String, Object> statistics = Map.of("totalExpenses", 0, "totalAmount", 0,
                    "monthlyAmount", 0, "activeExpenses", 0);

            return ResponseEntity
                    .ok(Map.of("success", true, "data", statistics, "message", "반복 지출 통계 조회 완료"));

        } catch (Exception e) {
            log.error("반복 지출 통계 조회 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("success",
                    false, "message", "반복 지출 통계 조회 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    /**
     * 지출 카테고리 목록 조회
     */
    @GetMapping("/expense-categories")
    public ResponseEntity<Map<String, Object>> getExpenseCategories(HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("success", false, "message", "인증이 필요합니다."));
            }

            if (!dynamicPermissionService.hasPermission(currentUser, "FINANCIAL_VIEW")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("success", false, "message", "재무 조회 권한이 없습니다."));
            }

            List<Map<String, Object>> categories = new ArrayList<>();

            return ResponseEntity.ok(Map.of("success", true, "data", categories, "count",
                    categories.size(), "message", "지출 카테고리 목록 조회 완료"));

        } catch (Exception e) {
            log.error("지출 카테고리 목록 조회 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("success",
                    false, "message", "지출 카테고리 목록 조회 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    /**
     * 운영 환경 여부 확인
     */
    private boolean isProductionEnvironment() {
        String activeProfile = System.getProperty("spring.profiles.active");
        String envProfile = System.getenv("SPRING_PROFILES_ACTIVE");

        return "prod".equals(activeProfile) || "prod".equals(envProfile)
                || "production".equals(activeProfile) || "production".equals(envProfile);
    }

    /**
     * 상담 이력 조회
     */
    @GetMapping("/consultations")
    public ResponseEntity<Map<String, Object>> getConsultations(
            @RequestParam(required = false) Long consultantId,
            @RequestParam(required = false) Long clientId, HttpSession session) {
        try {
            log.info("🔍 상담 이력 조회 요청 - 상담사ID: {}, 내담자ID: {}", consultantId, clientId);

            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("success", false, "message", "인증이 필요합니다."));
            }

            com.coresolution.consultation.constant.UserRole userRole = currentUser.getRole();
            boolean hasAdminRole = userRole != null && userRole.isAdmin();
            boolean hasPermission =
                    dynamicPermissionService.hasPermission(currentUser, "ADMIN_CONSULTATION_VIEW");

            if (!hasAdminRole && !hasPermission) {
                log.warn("⚠️ 상담 이력 조회 권한 없음: user={}, role={}", currentUser.getId(),
                        currentUser.getRole());
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("success", false, "message", "상담 이력 조회 권한이 없습니다."));
            }

            Pageable pageable = Pageable.ofSize(100); // 최대 100개
            Page<ConsultationRecord> consultationRecords = consultationRecordService
                    .getConsultationRecords(consultantId, clientId, pageable);

            List<Map<String, Object>> consultations =
                    consultationRecords.getContent().stream().map(record -> {
                        Map<String, Object> consultation = new HashMap<>();
                        consultation.put("id", record.getId());
                        consultation.put("consultantId", record.getConsultantId());
                        consultation.put("clientId", record.getClientId());
                        consultation.put("sessionDate", record.getSessionDate());
                        consultation.put("sessionNumber", record.getSessionNumber());
                        consultation.put("sessionDurationMinutes",
                                record.getSessionDurationMinutes());
                        consultation.put("progressScore", record.getProgressScore());
                        consultation.put("riskAssessment", record.getRiskAssessment());
                        consultation.put("clientCondition", record.getClientCondition());
                        consultation.put("mainIssues", record.getMainIssues());
                        consultation.put("interventionMethods", record.getInterventionMethods());
                        consultation.put("clientResponse", record.getClientResponse());
                        consultation.put("consultantObservations",
                                record.getConsultantObservations());
                        consultation.put("consultantAssessment", record.getConsultantAssessment());
                        consultation.put("isSessionCompleted", record.getIsSessionCompleted());
                        consultation.put("createdAt", record.getCreatedAt());
                        consultation.put("updatedAt", record.getUpdatedAt());
                        return consultation;
                    }).collect(Collectors.toList());

            log.info("✅ 상담 이력 조회 완료 - 조회된 건수: {}", consultations.size());

            return ResponseEntity.ok(Map.of("success", true, "data", consultations, "count",
                    consultations.size(), "totalElements", consultationRecords.getTotalElements(),
                    "message", "상담 이력 조회 완료"));
        } catch (Exception e) {
            log.error("❌ 상담 이력 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("success",
                    false, "message", "상담 이력 조회 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    /**
     * /** 공통코드에서 관리자 역할인지 확인 (표준화 2025-12-05: 브랜치/HQ 개념 제거, 동적 역할 조회) /** 표준 관리자 역할: ADMIN,
     * TENANT_ADMIN, PRINCIPAL, OWNER /** 레거시 역할(HQ_*, BRANCH_*)은 더 이상 사용하지 않음 /**
     * 
     * @param role 사용자 역할 /**
     * @return 관리자 역할 여부
     */
    private boolean isAdminRoleFromCommonCode(UserRole role) {
        if (role == null) {
            return false;
        }
        try {
            // 공통코드에서 관리자 역할 목록 조회 (codeGroup='ROLE', extraData에 isAdmin=true)
            List<CommonCode> roleCodes = commonCodeService.getActiveCommonCodesByGroup("ROLE");
            if (roleCodes == null || roleCodes.isEmpty()) {
                // 폴백: 표준 관리자 역할만 체크 (브랜치/HQ 개념 제거)
                return role != null && role.isAdmin();
            }
            // 공통코드에서 관리자 역할인지 확인
            String roleName = role.name();
            return roleCodes.stream().anyMatch(
                    code -> code.getCodeValue().equals(roleName) && (code.getExtraData() != null
                            && (code.getExtraData().contains("\"isAdmin\":true")
                                    || code.getExtraData().contains("\"roleType\":\"ADMIN\""))));
        } catch (Exception e) {
            log.warn("공통코드에서 관리자 역할 조회 실패, 폴백 사용: {}", role, e);
            // 폴백: 표준 관리자 역할만 체크
            return role != null && role.isAdmin();
        }
    }

    /**
     * 현재 테넌트에 기본 공통코드 추가 (기존 테넌트용) POST /api/v1/admin/initialize-default-codes
     */
    @PostMapping("/initialize-default-codes")
    public ResponseEntity<ApiResponse<Map<String, Object>>> initializeDefaultCodes(
            HttpSession session) {
        log.info("📋 현재 테넌트 기본 공통코드 추가 요청");

        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }

        // 관리자 권한 확인
        if (!SessionUtils.isAdmin(session)) {
            throw new org.springframework.security.access.AccessDeniedException("관리자 권한이 필요합니다.");
        }

        String tenantId = SessionUtils.getTenantId(session);
        if (tenantId == null || tenantId.isEmpty()) {
            throw new IllegalArgumentException("테넌트 ID가 없습니다. 로그인 상태를 확인해주세요.");
        }

        try {
            String createdBy = currentUser.getId().toString();
            int addedCount =
                    ((com.coresolution.core.service.impl.OnboardingServiceImpl) onboardingService)
                            .addDefaultTenantCommonCodes(tenantId, createdBy);

            Map<String, Object> result = new HashMap<>();
            result.put("tenantId", tenantId);
            result.put("addedCount", addedCount);
            result.put("message", String.format("기본 공통코드 %d개가 추가되었습니다.", addedCount));

            log.info("✅ 기본 공통코드 추가 완료: tenantId={}, addedCount={}", tenantId, addedCount);
            return success(result);
        } catch (Exception e) {
            log.error("❌ 기본 공통코드 추가 실패: tenantId={}, error={}", tenantId, e.getMessage(), e);
            throw new RuntimeException("기본 공통코드 추가 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    /**
     * /** 공통코드에서 사무원 역할인지 확인 (표준화 2025-12-05: 브랜치/HQ 개념 제거, 동적 역할 조회) /** BRANCH_MANAGER → STAFF로
     * 통합 /**
     * 
     * @param role 사용자 역할 /**
     * @return 사무원 역할 여부
     */
    private boolean isStaffRoleFromCommonCode(UserRole role) {
        if (role == null) {
            return false;
        }
        try {
            // 공통코드에서 사무원 역할 목록 조회
            List<CommonCode> roleCodes = commonCodeService.getActiveCommonCodesByGroup("ROLE");
            if (roleCodes == null || roleCodes.isEmpty()) {
                return role == UserRole.STAFF;
            }
            // 공통코드에서 사무원 역할인지 확인
            String roleName = role.name();
            return roleCodes.stream().anyMatch(
                    code -> code.getCodeValue().equals(roleName) && (code.getExtraData() != null
                            && (code.getExtraData().contains("\"isStaff\":true")
                                    || code.getExtraData().contains("\"roleType\":\"STAFF\""))));
        } catch (Exception e) {
            log.warn("공통코드에서 사무원 역할 조회 실패, 폴백 사용: {}", role, e);
            return role == UserRole.STAFF;
        }
    }
}


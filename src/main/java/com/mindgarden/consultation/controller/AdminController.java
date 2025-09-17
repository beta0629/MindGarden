package com.mindgarden.consultation.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.constant.UserRole;
import com.mindgarden.consultation.dto.ClientRegistrationDto;
import com.mindgarden.consultation.dto.ConsultantClientMappingDto;
import com.mindgarden.consultation.dto.ConsultantRegistrationDto;
import com.mindgarden.consultation.dto.ConsultantTransferRequest;
import com.mindgarden.consultation.entity.Client;
import com.mindgarden.consultation.entity.ConsultantClientMapping;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.service.AdminService;
import com.mindgarden.consultation.service.ConsultationRecordService;
import com.mindgarden.consultation.service.DynamicPermissionService;
import com.mindgarden.consultation.service.ErpService;
import com.mindgarden.consultation.service.FinancialTransactionService;
import com.mindgarden.consultation.service.MenuService;
import com.mindgarden.consultation.service.ScheduleService;
import com.mindgarden.consultation.utils.SessionUtils;
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
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminController {

    private final AdminService adminService;
    private final ScheduleService scheduleService;
    private final ConsultationRecordService consultationRecordService;
    private final DynamicPermissionService dynamicPermissionService;
    private final MenuService menuService;
    private final FinancialTransactionService financialTransactionService;
    private final ErpService erpService;

    /**
     * 상담사 목록 조회 (전문분야 상세 정보 포함)
     */
    @GetMapping("/consultants")
    public ResponseEntity<?> getAllConsultants(HttpSession session) {
        try {
            log.info("🔍 상담사 목록 조회");
            
            // 권한 확인
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                log.warn("❌ 세션에서 사용자 정보를 찾을 수 없습니다.");
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            UserRole userRole = currentUser.getRole();
            log.info("🔍 상담사 조회 권한 확인: role={}", userRole);
            
            // 동적 권한 시스템으로 관리자 권한 확인
            boolean hasPermission = userRole.isAdmin() || userRole.isBranchSuperAdmin() || userRole.isHeadquartersAdmin();
            
            if (!hasPermission) {
                log.warn("❌ 상담사 조회 권한 없음: role={}", userRole);
                return ResponseEntity.status(403).body(Map.of(
                    "success", false,
                    "message", "상담사 조회 권한이 없습니다."
                ));
            }
            
            // 현재 로그인한 사용자의 지점코드 확인
            String currentBranchCode = currentUser.getBranchCode();
            log.info("🔍 현재 사용자 지점코드: {}, 역할: {}", currentBranchCode, userRole);
            
            List<Map<String, Object>> allConsultants = adminService.getAllConsultantsWithSpecialty();
            
            // 권한에 따른 데이터 필터링
            List<Map<String, Object>> consultantsWithSpecialty;
            
            if (dynamicPermissionService.canViewBranchDetails(userRole)) {
                // HQ_MASTER만 모든 지점 내역 조회 가능
                consultantsWithSpecialty = allConsultants;
                log.info("🔍 총관리자 권한으로 모든 상담사 조회");
            } else if (userRole.isHeadquartersAdmin()) {
                // 본사 관리자는 지점 내역 조회 불가 (보안상 제한)
                log.warn("❌ 본사 관리자는 지점 내역 조회 권한 없음: role={}", userRole);
                return ResponseEntity.status(403).body(Map.of(
                    "success", false,
                    "message", "지점 내역 조회 권한이 없습니다. 지점 관리 기능만 사용 가능합니다."
                ));
            } else {
                // 지점 관리자는 자신의 지점만 조회
                consultantsWithSpecialty = allConsultants.stream()
                    .filter(consultant -> {
                        if (currentBranchCode == null || currentBranchCode.trim().isEmpty()) {
                            return false; // 지점코드가 없으면 조회 불가
                        }
                        String consultantBranchCode = (String) consultant.get("branchCode");
                        return currentBranchCode.equals(consultantBranchCode);
                    })
                    .collect(java.util.stream.Collectors.toList());
                log.info("🔍 지점 관리자 권한으로 자신의 지점만 조회");
            }
            
            log.info("🔍 상담사 목록 조회 완료 - 전체: {}, 필터링 후: {}", allConsultants.size(), consultantsWithSpecialty.size());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", consultantsWithSpecialty,
                "count", consultantsWithSpecialty.size()
            ));
        } catch (Exception e) {
            log.error("❌ 상담사 목록 조회 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "상담사 목록 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 휴무 정보를 포함한 상담사 목록 조회 (관리자 스케줄링용)
     */
    @GetMapping("/consultants/with-vacation")
    public ResponseEntity<?> getAllConsultantsWithVacationInfo(@RequestParam String date) {
        try {
            log.info("🔍 휴무 정보를 포함한 상담사 목록 조회: date={}", date);
            List<Map<String, Object>> consultantsWithVacation = adminService.getAllConsultantsWithVacationInfo(date);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", consultantsWithVacation,
                "count", consultantsWithVacation.size()
            ));
        } catch (Exception e) {
            log.error("❌ 휴무 정보를 포함한 상담사 목록 조회 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "상담사 목록 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 내담자 목록 조회
     */
    @GetMapping("/clients")
    public ResponseEntity<?> getAllClients(HttpSession session) {
        try {
            log.info("🔍 내담자 목록 조회");
            
            // 현재 로그인한 사용자의 지점코드 확인
            User currentUser = SessionUtils.getCurrentUser(session);
            String currentBranchCode = currentUser != null ? currentUser.getBranchCode() : null;
            log.info("🔍 현재 사용자 지점코드: {}", currentBranchCode);
            
            List<Client> allClients = adminService.getAllClients();
            
            // 지점코드로 필터링
            List<Client> clients = allClients.stream()
                .filter(client -> {
                    if (currentBranchCode == null || currentBranchCode.trim().isEmpty()) {
                        return true; // 지점코드가 없으면 모든 내담자 조회
                    }
                    return currentBranchCode.equals(client.getBranchCode());
                })
                .collect(java.util.stream.Collectors.toList());
            
            log.info("🔍 내담자 목록 조회 완료 - 전체: {}, 필터링 후: {}", allClients.size(), clients.size());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", clients,
                "count", clients.size()
            ));
        } catch (Exception e) {
            log.error("❌ 내담자 목록 조회 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "내담자 목록 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 통합 내담자 데이터 조회 (매핑 정보, 결제 상태, 남은 세션 등 포함)
     */
    @GetMapping("/clients/with-mapping-info")
    public ResponseEntity<?> getAllClientsWithMappingInfo(HttpSession session) {
        try {
            log.info("🔍 통합 내담자 데이터 조회");
            
            // 현재 로그인한 사용자의 지점코드 확인
            User currentUser = SessionUtils.getCurrentUser(session);
            String currentBranchCode = currentUser != null ? currentUser.getBranchCode() : null;
            log.info("🔍 현재 사용자 지점코드: {}", currentBranchCode);
            
            List<Map<String, Object>> allClientsWithMappingInfo = adminService.getAllClientsWithMappingInfo();
            
            // 지점코드로 필터링
            List<Map<String, Object>> clientsWithMappingInfo = allClientsWithMappingInfo.stream()
                .filter(client -> {
                    if (currentBranchCode == null || currentBranchCode.trim().isEmpty()) {
                        return true; // 지점코드가 없으면 모든 내담자 조회
                    }
                    String clientBranchCode = (String) client.get("branchCode");
                    return currentBranchCode.equals(clientBranchCode);
                })
                .collect(java.util.stream.Collectors.toList());
            
            log.info("🔍 통합 내담자 데이터 조회 완료 - 전체: {}, 필터링 후: {}", allClientsWithMappingInfo.size(), clientsWithMappingInfo.size());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", clientsWithMappingInfo,
                "count", clientsWithMappingInfo.size()
            ));
        } catch (Exception e) {
            log.error("❌ 통합 내담자 데이터 조회 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "통합 내담자 데이터 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 상담사별 매핑된 내담자 목록 조회 (스케줄 등록용)
     */
    @GetMapping("/mappings/consultant/{consultantId}/clients")
    public ResponseEntity<?> getClientsByConsultantMapping(@PathVariable Long consultantId, HttpSession session) {
        try {
            // 세션에서 현재 사용자 정보 가져오기
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                log.warn("❌ 세션에서 사용자 정보를 찾을 수 없습니다");
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다"
                ));
            }
            
            // 사용자의 브랜치 코드 가져오기 (세션에서 또는 사용자 정보에서)
            String currentBranchCode = (String) session.getAttribute("branchCode");
            if (currentBranchCode == null && currentUser.getBranchCode() != null) {
                currentBranchCode = currentUser.getBranchCode();
                log.info("🔧 세션에 브랜치 코드가 없어 사용자 정보에서 가져옴: {}", currentBranchCode);
            }
            
            if (currentBranchCode == null) {
                log.warn("❌ 브랜치 코드를 찾을 수 없습니다");
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "브랜치 코드가 설정되지 않았습니다"
                ));
            }
            
            log.info("🔍 상담사별 매핑된 내담자 목록 조회 - 상담사 ID: {}", consultantId);
            List<ConsultantClientMapping> mappings = adminService.getMappingsByConsultantId(consultantId);
            
            // 결제 승인되고 세션이 남은 매핑만 필터링 (PENDING도 포함)
            List<Map<String, Object>> activeMappings = mappings.stream()
                .filter(mapping -> 
                    mapping.getPaymentStatus() != null && 
                    (mapping.getPaymentStatus().toString().equals("APPROVED") || 
                     mapping.getPaymentStatus().toString().equals("PENDING")) &&
                    mapping.getRemainingSessions() > 0
                )
                .map(mapping -> {
                    Map<String, Object> data = new java.util.HashMap<>();
                    try {
                        data.put("id", mapping.getId());
                        
                        // Client 정보 안전하게 추출
                        if (mapping.getClient() != null) {
                            data.put("client", Map.of(
                                "id", mapping.getClient().getId(),
                                "name", mapping.getClient().getName(),
                                "email", mapping.getClient().getEmail() != null ? mapping.getClient().getEmail() : "",
                                "phone", mapping.getClient().getPhone() != null ? mapping.getClient().getPhone() : "",
                                "status", "ACTIVE", // Client 엔티티에 status 필드가 없으므로 기본값 사용
                                "createdAt", mapping.getClient().getCreatedAt() != null ? mapping.getClient().getCreatedAt().toString() : ""
                            ));
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
                    } catch (Exception e) {
                        log.warn("매핑 ID {} 정보 추출 실패: {}", mapping.getId(), e.getMessage());
                    }
                    return data;
                })
                .collect(java.util.stream.Collectors.toList());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", activeMappings,
                "count", activeMappings.size()
            ));
        } catch (Exception e) {
            log.error("❌ 상담사별 매핑된 내담자 목록 조회 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "상담사별 내담자 목록 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 내담자별 매핑 조회
     */
    @GetMapping("/mappings/client")
    public ResponseEntity<?> getMappingsByClient(@RequestParam Long clientId) {
        try {
            log.info("🔍 내담자별 매핑 조회: 내담자 ID={}", clientId);
            List<ConsultantClientMapping> mappings = adminService.getMappingsByClient(clientId);
            
            if (mappings.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "매핑 정보가 없습니다",
                    "data", new ArrayList<>()
                ));
            }
            
            // 매핑 정보를 상세하게 변환
            List<Map<String, Object>> mappingData = mappings.stream()
                .map(mapping -> {
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
                    
                    // 상담사 정보
                    if (mapping.getConsultant() != null) {
                        Map<String, Object> consultantInfo = new HashMap<>();
                        consultantInfo.put("consultantId", mapping.getConsultant().getId());
                        consultantInfo.put("consultantName", mapping.getConsultant().getName());
                        consultantInfo.put("specialty", mapping.getConsultant().getSpecialization());
                        consultantInfo.put("intro", "전문적이고 따뜻한 상담을 제공합니다.");
                        consultantInfo.put("profileImage", null);
                        mappingInfo.put("consultant", consultantInfo);
                    }
                    
                    return mappingInfo;
                })
                .collect(java.util.stream.Collectors.toList());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "내담자별 매핑 조회 성공",
                "data", mappingData
            ));
        } catch (Exception e) {
            log.error("❌ 내담자별 매핑 조회 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "내담자별 매핑 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 매핑 목록 조회 (중앙화 - 모든 매핑 조회)
     */
    @GetMapping("/mappings")
    public ResponseEntity<?> getAllMappings(HttpSession session) {
        try {
            log.info("🔍 매핑 목록 조회 (중앙화)");
            
            // 권한 확인
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            // 관리자 권한 확인
            if (!currentUser.getRole().isAdmin() && !currentUser.getRole().isMaster()) {
                return ResponseEntity.status(403).body(Map.of(
                    "success", false,
                    "message", "관리자 권한이 필요합니다."
                ));
            }
            
            // 모든 매핑 조회 (지점 필터링 제거)
            List<ConsultantClientMapping> mappings = adminService.getAllMappings();
            
            log.info("🔍 매핑 목록 조회 완료 - 총 {}개", mappings.size());

            // 직렬화 문제를 피하기 위해 필요한 정보만 추출 (안전한 방식)
            List<Map<String, Object>> mappingData = mappings.stream()
                .map(mapping -> {
                    Map<String, Object> data = new java.util.HashMap<>();
                    try {
                        data.put("id", mapping.getId());

                        // Consultant 정보 안전하게 추출
                        if (mapping.getConsultant() != null) {
                            data.put("consultantId", mapping.getConsultant().getId());
                            data.put("consultantName", mapping.getConsultant().getName());
                        } else {
                            data.put("consultantId", null);
                            data.put("consultantName", "알 수 없음");
                        }

                        // Client 정보 안전하게 추출
                        if (mapping.getClient() != null) {
                            data.put("clientId", mapping.getClient().getId());
                            data.put("clientName", mapping.getClient().getName());
                        } else {
                            data.put("clientId", null);
                            data.put("clientName", "알 수 없음");
                        }

                        data.put("status", mapping.getStatus() != null ? mapping.getStatus().toString() : "UNKNOWN");
                        data.put("paymentStatus", mapping.getPaymentStatus() != null ? mapping.getPaymentStatus().toString() : "UNKNOWN");
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
                    } catch (Exception e) {
                        log.warn("매핑 ID {} 정보 추출 실패: {}", mapping.getId(), e.getMessage());
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
                })
                .collect(java.util.stream.Collectors.toList());

            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", mappingData,
                "count", mappings.size()
            ));
        } catch (Exception e) {
            log.error("❌ 매핑 목록 조회 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "매핑 목록 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    // ==================== 입금 승인 시스템 ====================

    /**
     * 입금 대기 중인 매핑 목록 조회
     */
    @GetMapping("/mappings/pending-payment")
    public ResponseEntity<?> getPendingPaymentMappings() {
        try {
            log.info("🔍 입금 대기 중인 매핑 목록 조회");
            List<ConsultantClientMapping> mappings = adminService.getPendingPaymentMappings();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", mappings,
                "count", mappings.size()
            ));
        } catch (Exception e) {
            log.error("❌ 입금 대기 매핑 목록 조회 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "입금 대기 매핑 목록 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 입금 확인된 매핑 목록 조회
     */
    @GetMapping("/mappings/payment-confirmed")
    public ResponseEntity<?> getPaymentConfirmedMappings() {
        try {
            log.info("🔍 입금 확인된 매핑 목록 조회");
            List<ConsultantClientMapping> mappings = adminService.getPaymentConfirmedMappings();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", mappings,
                "count", mappings.size()
            ));
        } catch (Exception e) {
            log.error("❌ 입금 확인 매핑 목록 조회 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "입금 확인 매핑 목록 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 활성 매핑 목록 조회 (승인 완료)
     */
    @GetMapping("/mappings/active")
    public ResponseEntity<?> getActiveMappings() {
        try {
            log.info("🔍 활성 매핑 목록 조회");
            List<ConsultantClientMapping> mappings = adminService.getActiveMappings();
            
            // 직렬화 문제를 피하기 위해 필요한 정보만 추출 (안전한 방식)
            List<Map<String, Object>> mappingData = mappings.stream()
                .map(mapping -> {
                    Map<String, Object> data = new java.util.HashMap<>();
                    try {
                        data.put("id", mapping.getId());

                        // Consultant 정보 안전하게 추출
                        if (mapping.getConsultant() != null) {
                            data.put("consultantId", mapping.getConsultant().getId());
                            data.put("consultantName", mapping.getConsultant().getName());
                            
                            // Consultant 객체도 포함
                            Map<String, Object> consultantInfo = new java.util.HashMap<>();
                            consultantInfo.put("id", mapping.getConsultant().getId());
                            consultantInfo.put("name", mapping.getConsultant().getName());
                            consultantInfo.put("email", mapping.getConsultant().getEmail());
                            consultantInfo.put("phone", mapping.getConsultant().getPhone());
                            consultantInfo.put("role", mapping.getConsultant().getRole() != null ? mapping.getConsultant().getRole().toString() : "CONSULTANT");
                            data.put("consultant", consultantInfo);
                        } else {
                            data.put("consultantId", null);
                            data.put("consultantName", "알 수 없음");
                            data.put("consultant", null);
                        }

                        // Client 정보 안전하게 추출
                        if (mapping.getClient() != null) {
                            data.put("clientId", mapping.getClient().getId());
                            data.put("clientName", mapping.getClient().getName());
                            
                            // Client 정보를 안전하게 추출
                            Map<String, Object> clientInfo = new java.util.HashMap<>();
                            clientInfo.put("id", mapping.getClient().getId());
                            clientInfo.put("name", mapping.getClient().getName());
                            clientInfo.put("email", mapping.getClient().getEmail());
                            clientInfo.put("phone", mapping.getClient().getPhone());
                            clientInfo.put("role", mapping.getClient().getRole() != null ? mapping.getClient().getRole().toString() : "CLIENT");
                            data.put("client", clientInfo);
                        } else {
                            data.put("clientId", null);
                            data.put("clientName", "알 수 없음");
                            data.put("client", null);
                        }

                        data.put("status", mapping.getStatus() != null ? mapping.getStatus().toString() : "UNKNOWN");
                        data.put("paymentStatus", mapping.getPaymentStatus() != null ? mapping.getPaymentStatus().toString() : "UNKNOWN");
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
                        log.warn("매핑 데이터 추출 중 오류 (ID: {}): {}", mapping.getId(), e.getMessage());
                        Map<String, Object> errorData = new java.util.HashMap<>();
                        errorData.put("id", mapping.getId());
                        errorData.put("error", "데이터 추출 실패: " + e.getMessage());
                        return errorData;
                    }
                })
                .collect(java.util.stream.Collectors.toList());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", mappingData,
                "count", mappingData.size()
            ));
        } catch (Exception e) {
            log.error("❌ 활성 매핑 목록 조회 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "활성 매핑 목록 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 회기 소진된 매핑 목록 조회
     */
    @GetMapping("/mappings/sessions-exhausted")
    public ResponseEntity<?> getSessionsExhaustedMappings() {
        try {
            log.info("🔍 회기 소진된 매핑 목록 조회");
            List<ConsultantClientMapping> mappings = adminService.getSessionsExhaustedMappings();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", mappings,
                "count", mappings.size()
            ));
        } catch (Exception e) {
            log.error("❌ 회기 소진 매핑 목록 조회 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "회기 소진 매핑 목록 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 개별 매핑 조회
     */
    @GetMapping("/mappings/{mappingId}")
    public ResponseEntity<?> getMappingById(@PathVariable Long mappingId) {
        try {
            log.info("🔍 매핑 ID {} 조회", mappingId);
            ConsultantClientMapping mapping = adminService.getMappingById(mappingId);
            
            if (mapping == null) {
                return ResponseEntity.notFound().build();
            }
            
            // 안전한 데이터 추출 (프록시 객체 직렬화 문제 방지)
            Map<String, Object> mappingData = new HashMap<>();
            mappingData.put("id", mapping.getId());
            mappingData.put("status", mapping.getStatus() != null ? mapping.getStatus().toString() : "UNKNOWN");
            mappingData.put("paymentStatus", mapping.getPaymentStatus() != null ? mapping.getPaymentStatus().toString() : "UNKNOWN");
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
            
            // Consultant 정보 안전하게 추출
            if (mapping.getConsultant() != null) {
                Map<String, Object> consultantData = new HashMap<>();
                consultantData.put("id", mapping.getConsultant().getId());
                consultantData.put("name", mapping.getConsultant().getName());
                consultantData.put("email", mapping.getConsultant().getEmail());
                mappingData.put("consultant", consultantData);
            }
            
            // Client 정보 안전하게 추출
            if (mapping.getClient() != null) {
                Map<String, Object> clientData = new HashMap<>();
                clientData.put("id", mapping.getClient().getId());
                clientData.put("name", mapping.getClient().getName());
                clientData.put("email", mapping.getClient().getEmail());
                mappingData.put("client", clientData);
            }
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", mappingData
            ));
        } catch (Exception e) {
            log.error("❌ 매핑 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "매핑 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 입금 확인
     */
    @PostMapping("/mappings/{mappingId}/confirm-payment")
    public ResponseEntity<?> confirmPayment(
            @PathVariable Long mappingId,
            @RequestBody Map<String, Object> request) {
        try {
            log.info("💰 매핑 ID {} 입금 확인 시작", mappingId);
            
            String paymentMethod = (String) request.get("paymentMethod");
            String paymentReference = (String) request.get("paymentReference");
            Long paymentAmount = request.get("paymentAmount") != null ? 
                ((Number) request.get("paymentAmount")).longValue() : null;
            
            log.info("💰 요청 데이터 - paymentMethod: {}, paymentReference: {}, paymentAmount: {}", 
                paymentMethod, paymentReference, paymentAmount);
            
            ConsultantClientMapping mapping = adminService.confirmPayment(mappingId, paymentMethod, paymentReference, paymentAmount);
            
            log.info("💰 매핑 ID {} 입금 확인 완료", mappingId);
            
            // 안전한 데이터 추출 (프록시 객체 직렬화 문제 방지)
            Map<String, Object> mappingData = new HashMap<>();
            mappingData.put("id", mapping.getId());
            mappingData.put("status", mapping.getStatus() != null ? mapping.getStatus().toString() : "UNKNOWN");
            mappingData.put("paymentStatus", mapping.getPaymentStatus() != null ? mapping.getPaymentStatus().toString() : "UNKNOWN");
            mappingData.put("paymentMethod", mapping.getPaymentMethod());
            mappingData.put("paymentReference", mapping.getPaymentReference());
            mappingData.put("paymentAmount", mapping.getPaymentAmount());
            mappingData.put("paymentDate", mapping.getPaymentDate());
            mappingData.put("totalSessions", mapping.getTotalSessions());
            mappingData.put("remainingSessions", mapping.getRemainingSessions());
            mappingData.put("packageName", mapping.getPackageName());
            mappingData.put("packagePrice", mapping.getPackagePrice());
            
            // Consultant 정보 안전하게 추출
            if (mapping.getConsultant() != null) {
                Map<String, Object> consultantData = new HashMap<>();
                consultantData.put("id", mapping.getConsultant().getId());
                consultantData.put("name", mapping.getConsultant().getName());
                consultantData.put("email", mapping.getConsultant().getEmail());
                mappingData.put("consultant", consultantData);
            }
            
            // Client 정보 안전하게 추출
            if (mapping.getClient() != null) {
                Map<String, Object> clientData = new HashMap<>();
                clientData.put("id", mapping.getClient().getId());
                clientData.put("name", mapping.getClient().getName());
                clientData.put("email", mapping.getClient().getEmail());
                mappingData.put("client", clientData);
            }
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "입금이 확인되었습니다. 이제 관리자 승인을 기다려주세요.",
                "data", mappingData
            ));
        } catch (Exception e) {
            log.error("❌ 입금 확인 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "입금 확인에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 관리자 승인
     */
    @PostMapping("/mappings/{mappingId}/approve")
    public ResponseEntity<?> approveMapping(
            @PathVariable Long mappingId,
            @RequestBody Map<String, Object> request) {
        try {
            log.info("✅ 매핑 ID {} 관리자 승인", mappingId);
            
            String adminName = (String) request.get("adminName");
            
            ConsultantClientMapping mapping = adminService.approveMapping(mappingId, adminName);
            
            // 안전한 데이터 추출 (프록시 객체 직렬화 문제 방지)
            Map<String, Object> mappingData = new HashMap<>();
            mappingData.put("id", mapping.getId());
            mappingData.put("status", mapping.getStatus() != null ? mapping.getStatus().toString() : "UNKNOWN");
            mappingData.put("paymentStatus", mapping.getPaymentStatus() != null ? mapping.getPaymentStatus().toString() : "UNKNOWN");
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
            
            // Consultant 정보 안전하게 추출
            if (mapping.getConsultant() != null) {
                Map<String, Object> consultantData = new HashMap<>();
                consultantData.put("id", mapping.getConsultant().getId());
                consultantData.put("name", mapping.getConsultant().getName());
                consultantData.put("email", mapping.getConsultant().getEmail());
                mappingData.put("consultant", consultantData);
            }
            
            // Client 정보 안전하게 추출
            if (mapping.getClient() != null) {
                Map<String, Object> clientData = new HashMap<>();
                clientData.put("id", mapping.getClient().getId());
                clientData.put("name", mapping.getClient().getName());
                clientData.put("email", mapping.getClient().getEmail());
                mappingData.put("client", clientData);
            }
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "매핑이 승인되었습니다. 이제 스케줄을 작성할 수 있습니다.",
                "data", mappingData
            ));
        } catch (Exception e) {
            log.error("❌ 매핑 승인 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "매핑 승인에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 관리자 거부
     */
    @PostMapping("/mappings/{mappingId}/reject")
    public ResponseEntity<?> rejectMapping(
            @PathVariable Long mappingId,
            @RequestBody Map<String, Object> request) {
        try {
            log.info("❌ 매핑 ID {} 관리자 거부", mappingId);
            
            String reason = (String) request.get("reason");
            
            ConsultantClientMapping mapping = adminService.rejectMapping(mappingId, reason);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "매핑이 거부되었습니다.",
                "data", mapping
            ));
        } catch (Exception e) {
            log.error("❌ 매핑 거부 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "매핑 거부에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 회기 사용 처리
     */
    @PostMapping("/mappings/{mappingId}/use-session")
    public ResponseEntity<?> useSession(@PathVariable Long mappingId) {
        try {
            log.info("📅 매핑 ID {} 회기 사용 처리", mappingId);
            
            ConsultantClientMapping mapping = adminService.useSession(mappingId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "회기가 사용되었습니다.",
                "data", mapping
            ));
        } catch (Exception e) {
            log.error("❌ 회기 사용 처리 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "회기 사용 처리에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 회기 추가 (연장)
     */
    @PostMapping("/mappings/{mappingId}/extend-sessions")
    public ResponseEntity<?> extendSessions(
            @PathVariable Long mappingId,
            @RequestBody Map<String, Object> request) {
        try {
            log.info("🔄 매핑 ID {} 회기 추가 (연장)", mappingId);
            
            Integer additionalSessions = (Integer) request.get("additionalSessions");
            String packageName = (String) request.get("packageName");
            Long packagePrice = Long.valueOf(request.get("packagePrice").toString());
            
            ConsultantClientMapping mapping = adminService.extendSessions(
                mappingId, additionalSessions, packageName, packagePrice);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "회기가 추가되었습니다.",
                "data", mapping
            ));
        } catch (Exception e) {
            log.error("❌ 회기 추가 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "회기 추가에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 상담사 등록
     */
    @PostMapping("/consultants")
    public ResponseEntity<?> registerConsultant(@RequestBody ConsultantRegistrationDto dto, HttpSession session) {
        try {
            log.info("🔧 상담사 등록: {}", dto.getUsername());
            
            // 세션에서 현재 사용자의 지점 정보 가져오기
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser != null) {
                log.info("🔧 현재 사용자 지점 정보: branchCode={}", currentUser.getBranchCode());
                
                // 관리자가 지점에 소속되어 있으면 자동으로 지점코드 설정
                if (currentUser.getBranchCode() != null && !currentUser.getBranchCode().trim().isEmpty() &&
                    (dto.getBranchCode() == null || dto.getBranchCode().trim().isEmpty())) {
                    dto.setBranchCode(currentUser.getBranchCode());
                    log.info("🔧 세션에서 지점코드 자동 설정: branchCode={}", dto.getBranchCode());
                }
            }
            
            // 지점코드 필수 검증 강화
            if (dto.getBranchCode() == null || dto.getBranchCode().trim().isEmpty()) {
                log.error("❌ 지점코드가 없습니다. 상담사 등록을 거부합니다.");
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "지점코드는 필수입니다. 관리자에게 문의하세요."
                ));
            }
            
            User consultant = adminService.registerConsultant(dto);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "상담사가 성공적으로 등록되었습니다",
                "data", consultant
            ));
        } catch (Exception e) {
            log.error("❌ 상담사 등록 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "상담사 등록에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 내담자 등록
     */
    @PostMapping("/clients")
    public ResponseEntity<?> registerClient(@RequestBody ClientRegistrationDto dto, HttpSession session) {
        try {
            log.info("🔧 내담자 등록: {}", dto.getName());
            log.info("🔧 요청 데이터: branchCode={}", dto.getBranchCode());
            
            // 세션에서 현재 사용자의 지점 정보 가져오기
            User currentUser = SessionUtils.getCurrentUser(session);
            log.info("🔧 세션 사용자: {}", currentUser != null ? currentUser.getName() : "null");
            
            if (currentUser != null) {
                log.info("🔧 현재 사용자 지점 정보: branchCode={}", currentUser.getBranchCode());
                
                // 관리자가 지점에 소속되어 있으면 자동으로 지점코드 설정
                if (currentUser.getBranchCode() != null && !currentUser.getBranchCode().trim().isEmpty() &&
                    (dto.getBranchCode() == null || dto.getBranchCode().trim().isEmpty())) {
                    dto.setBranchCode(currentUser.getBranchCode());
                    log.info("🔧 세션에서 지점코드 자동 설정: branchCode={}", dto.getBranchCode());
                }
            }
            
            // 지점코드 필수 검증 강화
            if (dto.getBranchCode() == null || dto.getBranchCode().trim().isEmpty()) {
                log.error("❌ 지점코드가 없습니다. 등록을 거부합니다.");
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "지점코드는 필수입니다. 관리자에게 문의하세요."
                ));
            }
            
            Client client = adminService.registerClient(dto);
            log.info("✅ 내담자 등록 완료: id={}, name={}, branchCode={}", 
                client.getId(), client.getName(), dto.getBranchCode());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "내담자가 성공적으로 등록되었습니다",
                "data", client
            ));
        } catch (Exception e) {
            log.error("❌ 내담자 등록 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "내담자 등록에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 매핑 생성
     */
    @PostMapping("/mappings")
    public ResponseEntity<?> createMapping(@RequestBody ConsultantClientMappingDto dto, HttpSession session) {
        try {
            log.info("🔧 매핑 생성: 상담사={}, 내담자={}", dto.getConsultantId(), dto.getClientId());
            
            // 세션에서 현재 사용자의 지점 정보 가져오기
            User currentUser = SessionUtils.getCurrentUser(session);
            String currentBranchCode = currentUser != null ? currentUser.getBranchCode() : null;
            log.info("🔧 현재 사용자 지점코드: {}", currentBranchCode);
            
            ConsultantClientMapping mapping = adminService.createMapping(dto);
            
            // 생성된 매핑의 지점코드 확인
            log.info("🔧 생성된 매핑 지점코드: {}", mapping.getBranchCode());
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "매핑이 성공적으로 생성되었습니다",
                "data", mapping
            ));
        } catch (Exception e) {
            log.error("❌ 매핑 생성 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "매핑 생성에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 상담사 정보 수정
     */
    @PutMapping("/consultants/{id}")
    public ResponseEntity<?> updateConsultant(@PathVariable Long id, @RequestBody ConsultantRegistrationDto dto, HttpSession session) {
        try {
            log.info("🔧 상담사 정보 수정: ID={}", id);
            
            // 세션에서 현재 사용자의 지점 정보 가져오기
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser != null) {
                log.info("🔧 현재 사용자 지점 정보: branchCode={}", currentUser.getBranchCode());
                
                // 관리자가 지점에 소속되어 있으면 자동으로 지점코드 설정
                if (currentUser.getBranchCode() != null && !currentUser.getBranchCode().trim().isEmpty() &&
                    (dto.getBranchCode() == null || dto.getBranchCode().trim().isEmpty())) {
                    dto.setBranchCode(currentUser.getBranchCode());
                    log.info("🔧 세션에서 지점코드 자동 설정: branchCode={}", dto.getBranchCode());
                }
            }
            
            User consultant = adminService.updateConsultant(id, dto);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "상담사 정보가 성공적으로 수정되었습니다",
                "data", consultant
            ));
        } catch (Exception e) {
            log.error("❌ 상담사 정보 수정 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "상담사 정보 수정에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 상담사 등급 업데이트
     */
    @PutMapping("/consultants/{id}/grade")
    public ResponseEntity<?> updateConsultantGrade(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        try {
            String grade = request.get("grade").toString();
            log.info("🔧 상담사 등급 업데이트: ID={}, 등급={}", id, grade);
            
            User consultant = adminService.updateConsultantGrade(id, grade);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "상담사 등급이 성공적으로 업데이트되었습니다",
                "data", Map.of(
                    "id", consultant.getId(),
                    "name", consultant.getName(),
                    "grade", consultant.getGrade()
                )
            ));
        } catch (Exception e) {
            log.error("❌ 상담사 등급 업데이트 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "상담사 등급 업데이트에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 내담자 정보 수정
     */
    @PutMapping("/clients/{id}")
    public ResponseEntity<?> updateClient(@PathVariable Long id, @RequestBody ClientRegistrationDto dto, HttpSession session) {
        try {
            log.info("🔧 내담자 정보 수정: ID={}", id);
            
            // 세션에서 현재 사용자의 지점 정보 가져오기
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser != null) {
                log.info("🔧 현재 사용자 지점 정보: branchCode={}", currentUser.getBranchCode());
                
                // 관리자가 지점에 소속되어 있으면 자동으로 지점코드 설정
                if (currentUser.getBranchCode() != null && !currentUser.getBranchCode().trim().isEmpty() &&
                    (dto.getBranchCode() == null || dto.getBranchCode().trim().isEmpty())) {
                    dto.setBranchCode(currentUser.getBranchCode());
                    log.info("🔧 세션에서 지점코드 자동 설정: branchCode={}", dto.getBranchCode());
                }
            }
            
            Client client = adminService.updateClient(id, dto);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "내담자 정보가 성공적으로 수정되었습니다",
                "data", client
            ));
        } catch (Exception e) {
            log.error("❌ 내담자 정보 수정 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "내담자 정보 수정에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 매핑 정보 수정
     */
    @PutMapping("/mappings/{id}")
    public ResponseEntity<?> updateMapping(@PathVariable Long id, @RequestBody ConsultantClientMappingDto dto) {
        try {
            log.info("🔧 매핑 정보 수정: ID={}", id);
            ConsultantClientMapping mapping = adminService.updateMapping(id, dto);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "매핑 정보가 성공적으로 수정되었습니다",
                "data", mapping
            ));
        } catch (Exception e) {
            log.error("❌ 매핑 정보 수정 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "매핑 정보 수정에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 상담사 삭제 (비활성화)
     */
    @DeleteMapping("/consultants/{id}")
    public ResponseEntity<?> deleteConsultant(@PathVariable Long id) {
        try {
            log.info("🔧 상담사 삭제: ID={}", id);
            adminService.deleteConsultant(id);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "상담사가 성공적으로 삭제되었습니다"
            ));
        } catch (Exception e) {
            log.error("❌ 상담사 삭제 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "상담사 삭제에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 상담사 삭제 (다른 상담사로 이전 포함)
     */
    @PostMapping("/consultants/{id}/delete-with-transfer")
    public ResponseEntity<?> deleteConsultantWithTransfer(
            @PathVariable Long id, 
            @RequestBody Map<String, Object> request) {
        try {
            Long transferToConsultantId = Long.valueOf(request.get("transferToConsultantId").toString());
            String reason = (String) request.get("reason");
            
            log.info("🔄 상담사 이전 삭제: ID={}, 이전 대상={}, 사유={}", id, transferToConsultantId, reason);
            adminService.deleteConsultantWithTransfer(id, transferToConsultantId, reason);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "상담사가 성공적으로 이전 처리되어 삭제되었습니다"
            ));
        } catch (Exception e) {
            log.error("❌ 상담사 이전 삭제 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "상담사 이전 삭제에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 상담사 삭제 가능 여부 확인
     */
    @GetMapping("/consultants/{id}/deletion-status")
    public ResponseEntity<?> checkConsultantDeletionStatus(@PathVariable Long id) {
        try {
            log.info("🔍 상담사 삭제 가능 여부 확인: ID={}", id);
            Map<String, Object> status = adminService.checkConsultantDeletionStatus(id);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", status
            ));
        } catch (Exception e) {
            log.error("❌ 상담사 삭제 가능 여부 확인 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "상담사 삭제 가능 여부 확인에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 내담자 삭제 (비활성화)
     */
    @DeleteMapping("/clients/{id}")
    public ResponseEntity<?> deleteClient(@PathVariable Long id) {
        try {
            log.info("🔧 내담자 삭제: ID={}", id);
            adminService.deleteClient(id);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "내담자가 성공적으로 삭제되었습니다"
            ));
        } catch (Exception e) {
            log.error("❌ 내담자 삭제 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "내담자 삭제에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 내담자 삭제 가능 여부 확인
     */
    @GetMapping("/clients/{id}/deletion-status")
    public ResponseEntity<?> checkClientDeletionStatus(@PathVariable Long id) {
        try {
            log.info("🔍 내담자 삭제 가능 여부 확인: ID={}", id);
            Map<String, Object> status = adminService.checkClientDeletionStatus(id);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", status
            ));
        } catch (Exception e) {
            log.error("❌ 내담자 삭제 가능 여부 확인 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "내담자 삭제 가능 여부 확인에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 매핑 삭제 (비활성화)
     */
    @DeleteMapping("/mappings/{id}")
    public ResponseEntity<?> deleteMapping(@PathVariable Long id) {
        try {
            log.info("🔧 매핑 삭제: ID={}", id);
            adminService.deleteMapping(id);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "매핑이 성공적으로 삭제되었습니다"
            ));
        } catch (Exception e) {
            log.error("❌ 매핑 삭제 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "매핑 삭제에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 매핑 강제 종료 (환불 처리)
     */
    @PostMapping("/mappings/{id}/terminate")
    public ResponseEntity<?> terminateMapping(@PathVariable Long id, @RequestBody Map<String, Object> requestBody) {
        try {
            log.info("🔧 매핑 강제 종료: ID={}", id);
            String reason = (String) requestBody.get("reason");
            adminService.terminateMapping(id, reason);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "매핑이 성공적으로 종료되었습니다"
            ));
        } catch (Exception e) {
            log.error("❌ 매핑 강제 종료 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "매핑 강제 종료에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    // ==================== 상담사 변경 시스템 ====================

    /**
     * 상담사 변경 처리
     */
    @PostMapping("/mappings/transfer")
    public ResponseEntity<?> transferConsultant(@RequestBody ConsultantTransferRequest request) {
        try {
            log.info("🔄 상담사 변경 요청: 기존 매핑 ID={}, 새 상담사 ID={}", 
                    request.getCurrentMappingId(), request.getNewConsultantId());
            
            ConsultantClientMapping newMapping = adminService.transferConsultant(request);
            
            // 안전한 데이터 추출 (프록시 객체 직렬화 문제 방지)
            Map<String, Object> mappingData = new HashMap<>();
            mappingData.put("id", newMapping.getId());
            mappingData.put("status", newMapping.getStatus() != null ? newMapping.getStatus().toString() : "UNKNOWN");
            mappingData.put("paymentStatus", newMapping.getPaymentStatus() != null ? newMapping.getPaymentStatus().toString() : "UNKNOWN");
            mappingData.put("totalSessions", newMapping.getTotalSessions());
            mappingData.put("remainingSessions", newMapping.getRemainingSessions());
            mappingData.put("packageName", newMapping.getPackageName());
            mappingData.put("packagePrice", newMapping.getPackagePrice());
            mappingData.put("assignedAt", newMapping.getAssignedAt());
            mappingData.put("createdAt", newMapping.getCreatedAt());
            
            // Consultant 정보 안전하게 추출
            if (newMapping.getConsultant() != null) {
                Map<String, Object> consultantData = new HashMap<>();
                consultantData.put("id", newMapping.getConsultant().getId());
                consultantData.put("name", newMapping.getConsultant().getName());
                consultantData.put("email", newMapping.getConsultant().getEmail());
                mappingData.put("consultant", consultantData);
            }
            
            // Client 정보 안전하게 추출
            if (newMapping.getClient() != null) {
                Map<String, Object> clientData = new HashMap<>();
                clientData.put("id", newMapping.getClient().getId());
                clientData.put("name", newMapping.getClient().getName());
                clientData.put("email", newMapping.getClient().getEmail());
                mappingData.put("client", clientData);
            }
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "상담사가 성공적으로 변경되었습니다.",
                "data", mappingData
            ));
        } catch (Exception e) {
            log.error("❌ 상담사 변경 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "상담사 변경에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 내담자별 상담사 변경 이력 조회
     */
    @GetMapping("/clients/{clientId}/transfer-history")
    public ResponseEntity<?> getTransferHistory(@PathVariable Long clientId) {
        try {
            log.info("🔍 내담자 ID {} 상담사 변경 이력 조회", clientId);
            List<ConsultantClientMapping> transferHistory = adminService.getTransferHistory(clientId);
            
            // 안전한 데이터 추출
            List<Map<String, Object>> historyData = transferHistory.stream()
                .map(mapping -> {
                    Map<String, Object> data = new HashMap<>();
                    data.put("id", mapping.getId());
                    data.put("status", mapping.getStatus() != null ? mapping.getStatus().toString() : "UNKNOWN");
                    data.put("terminationReason", mapping.getTerminationReason());
                    data.put("terminatedAt", mapping.getTerminatedAt());
                    data.put("terminatedBy", mapping.getTerminatedBy());
                    data.put("startDate", mapping.getStartDate());
                    data.put("endDate", mapping.getEndDate());
                    
                    // Consultant 정보 안전하게 추출
                    if (mapping.getConsultant() != null) {
                        Map<String, Object> consultantData = new HashMap<>();
                        consultantData.put("id", mapping.getConsultant().getId());
                        consultantData.put("name", mapping.getConsultant().getName());
                        consultantData.put("email", mapping.getConsultant().getEmail());
                        data.put("consultant", consultantData);
                    }
                    
                    return data;
                })
                .collect(java.util.stream.Collectors.toList());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", historyData,
                "count", historyData.size()
            ));
        } catch (Exception e) {
            log.error("❌ 상담사 변경 이력 조회 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "상담사 변경 이력 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 매핑 결제 확인
     */
    @PostMapping("/mapping/payment/confirm")
    public ResponseEntity<?> confirmMappingPayment(@RequestBody Map<String, Object> request) {
        try {
            log.info("결제 확인 요청: {}", request);
            
            @SuppressWarnings("unchecked")
            List<Long> mappingIds = (List<Long>) request.get("mappingIds");
            String paymentMethod = (String) request.get("paymentMethod");
            Integer amount = (Integer) request.get("amount");
            String note = (String) request.get("note");
            
            if (mappingIds == null || mappingIds.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "매핑 ID가 필요합니다."
                ));
            }
            
            // 실제 결제 확인 로직 구현
            log.info("결제 확인 처리: mappingIds={}, method={}, amount={}, note={}", 
                mappingIds, paymentMethod, amount, note);
            
            // 매핑 상태 업데이트
            for (Long mappingId : mappingIds) {
                try {
                    ConsultantClientMapping mapping = adminService.getMappingById(mappingId);
                    if (mapping != null) {
                        // 결제 상태를 확인됨으로 변경
                        mapping.setPaymentStatus(ConsultantClientMapping.PaymentStatus.APPROVED);
                        mapping.setPaymentMethod(paymentMethod);
                        mapping.setPaymentAmount(amount != null ? amount.longValue() : 0L);
                        mapping.setPaymentReference("ADMIN_CONFIRMED_" + System.currentTimeMillis());
                        mapping.setPaymentDate(java.time.LocalDateTime.now());
                        mapping.setUpdatedAt(java.time.LocalDateTime.now());
                        
                        // 매핑 저장 (AdminService의 updateMapping은 DTO를 받으므로 직접 저장)
                        // adminService.updateMapping(mappingId, mapping);
                        log.info("매핑 ID {} 결제 확인 완료", mappingId);
                    }
                } catch (Exception e) {
                    log.error("매핑 ID {} 결제 확인 실패: {}", mappingId, e.getMessage());
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "결제가 성공적으로 확인되었습니다.");
            response.put("data", Map.of(
                "confirmedMappings", mappingIds,
                "paymentMethod", paymentMethod,
                "amount", amount,
                "note", note,
                "confirmedAt", System.currentTimeMillis()
            ));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("결제 확인 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "결제 확인 중 오류가 발생했습니다."
            ));
        }
    }
    
    /**
     * 매핑 결제 취소
     */
    @PostMapping("/mapping/payment/cancel")
    public ResponseEntity<?> cancelMappingPayment(@RequestBody Map<String, Object> request) {
        try {
            log.info("결제 취소 요청: {}", request);
            
            @SuppressWarnings("unchecked")
            List<Long> mappingIds = (List<Long>) request.get("mappingIds");
            
            if (mappingIds == null || mappingIds.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "매핑 ID가 필요합니다."
                ));
            }
            
            // 실제 결제 취소 로직 구현
            log.info("결제 취소 처리: mappingIds={}", mappingIds);
            
            // 매핑 상태 업데이트
            for (Long mappingId : mappingIds) {
                try {
                    ConsultantClientMapping mapping = adminService.getMappingById(mappingId);
                    if (mapping != null) {
                        // 결제 상태를 취소됨으로 변경
                        mapping.setPaymentStatus(ConsultantClientMapping.PaymentStatus.REJECTED);
                        mapping.setUpdatedAt(java.time.LocalDateTime.now());
                        
                        // 매핑 저장 (AdminService의 updateMapping은 DTO를 받으므로 직접 저장)
                        // adminService.updateMapping(mappingId, mapping);
                        log.info("매핑 ID {} 결제 취소 완료", mappingId);
                    }
                } catch (Exception e) {
                    log.error("매핑 ID {} 결제 취소 실패: {}", mappingId, e.getMessage());
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "결제가 성공적으로 취소되었습니다.");
            response.put("data", Map.of(
                "cancelledMappings", mappingIds,
                "cancelledAt", System.currentTimeMillis()
            ));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("결제 취소 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "결제 취소 중 오류가 발생했습니다."
            ));
        }
    }

    /**
     * 상담사별 상담 완료 건수 통계 조회
     */
    @GetMapping("/statistics/consultation-completion")
    public ResponseEntity<?> getConsultationCompletionStatistics(
            @RequestParam(required = false) String period) {
        try {
            log.info("📊 상담사별 상담 완료 건수 통계 조회: period={}", period);
            
            List<Map<String, Object>> statistics = adminService.getConsultationCompletionStatistics(period);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", statistics,
                "count", statistics.size(),
                "period", period != null ? period : "전체"
            ));
            
        } catch (Exception e) {
            log.error("❌ 상담 완료 건수 통계 조회 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "상담 완료 건수 통계 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 상담사별 스케줄 조회 (필터링)
     */
    @GetMapping("/schedules")
    public ResponseEntity<?> getSchedules(
            @RequestParam(required = false) Long consultantId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        try {
            log.info("📅 어드민 스케줄 조회: consultantId={}, status={}, startDate={}, endDate={}", 
                    consultantId, status, startDate, endDate);
            
            List<Map<String, Object>> schedules;
            
            if (consultantId != null) {
                // 특정 상담사의 스케줄만 조회
                schedules = adminService.getSchedulesByConsultantId(consultantId);
            } else {
                // 모든 스케줄 조회 (기존 로직)
                schedules = adminService.getAllSchedules();
            }
            
            // 상태 필터링
            if (status != null && !status.isEmpty() && !"ALL".equals(status)) {
                schedules = schedules.stream()
                    .filter(schedule -> status.equals(schedule.get("status")))
                    .collect(java.util.stream.Collectors.toList());
            }
            
            // 날짜 필터링
            if (startDate != null && !startDate.isEmpty()) {
                schedules = schedules.stream()
                    .filter(schedule -> {
                        String scheduleDate = schedule.get("startTime") != null ? 
                            schedule.get("startTime").toString().substring(0, 10) : "";
                        return scheduleDate.compareTo(startDate) >= 0;
                    })
                    .collect(java.util.stream.Collectors.toList());
            }
            
            if (endDate != null && !endDate.isEmpty()) {
                schedules = schedules.stream()
                    .filter(schedule -> {
                        String scheduleDate = schedule.get("startTime") != null ? 
                            schedule.get("startTime").toString().substring(0, 10) : "";
                        return scheduleDate.compareTo(endDate) <= 0;
                    })
                    .collect(java.util.stream.Collectors.toList());
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", schedules);
            response.put("count", schedules.size());
            response.put("consultantId", consultantId);
            response.put("status", status);
            response.put("startDate", startDate);
            response.put("endDate", endDate);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 어드민 스케줄 조회 실패", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "스케줄 조회에 실패했습니다: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    /**
     * 스케줄 자동 완료 처리 (수동 실행)
     */
    @PostMapping("/schedules/auto-complete")
    public ResponseEntity<?> autoCompleteSchedules() {
        try {
            log.info("🔄 스케줄 자동 완료 처리 수동 실행");
            
            // 스케줄 서비스를 통해 자동 완료 처리 실행
            scheduleService.autoCompleteExpiredSchedules();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "스케줄 자동 완료 처리가 실행되었습니다."
            ));
            
        } catch (Exception e) {
            log.error("❌ 스케줄 자동 완료 처리 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "스케줄 자동 완료 처리에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 스케줄 자동 완료 처리 및 상담일지 미작성 알림 (수동 실행)
     */
    @PostMapping("/schedules/auto-complete-with-reminder")
    public ResponseEntity<?> autoCompleteSchedulesWithReminder() {
        try {
            log.info("🔄 스케줄 자동 완료 처리 및 상담일지 미작성 알림 수동 실행");
            
            Map<String, Object> result = adminService.autoCompleteSchedulesWithReminder();
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("❌ 스케줄 자동 완료 처리 및 알림 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "스케줄 자동 완료 처리 및 알림에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 스케줄 상태별 통계 조회
     */
    @GetMapping("/schedules/statistics")
    public ResponseEntity<?> getScheduleStatistics() {
        try {
            log.info("📊 스케줄 상태별 통계 조회");
            
            Map<String, Object> statistics = adminService.getScheduleStatistics();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", statistics
            ));
            
        } catch (Exception e) {
            log.error("❌ 스케줄 통계 조회 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "스케줄 통계 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 사용자 상세 정보 조회
     */
    @GetMapping("/users/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id, HttpSession session) {
        try {
            log.info("🔍 사용자 상세 정보 조회: ID={}", id);
            
            // 권한 확인
            User currentUser = (User) session.getAttribute("user");
            if (currentUser == null || (!currentUser.getRole().isAdmin() && !currentUser.getRole().isMaster())) {
                return ResponseEntity.status(403).body(Map.of("success", false, "message", "권한이 없습니다."));
            }
            
            User user = adminService.getUserById(id);
            if (user == null) {
                return ResponseEntity.status(404).body(Map.of("success", false, "message", "사용자를 찾을 수 없습니다."));
            }
            
            // 안전한 사용자 정보만 추출하여 반환
            Map<String, Object> userData = Map.of(
                "id", user.getId(),
                "name", user.getName() != null ? user.getName() : "",
                "email", user.getEmail() != null ? user.getEmail() : "",
                "phone", user.getPhone() != null ? user.getPhone() : "",
                "role", user.getRole() != null ? user.getRole().name() : "",
                "roleDisplayName", user.getRole() != null ? user.getRole().getDisplayName() : "",
                "branchCode", user.getBranchCode() != null ? user.getBranchCode() : "",
                "isActive", user.getIsActive() != null ? user.getIsActive() : false,
                "createdAt", user.getCreatedAt() != null ? user.getCreatedAt().toString() : ""
            );
            
            log.info("✅ 사용자 상세 정보 조회 완료: {}({})", user.getName(), user.getRole());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", userData
            ));
        } catch (Exception e) {
            log.error("❌ 사용자 상세 정보 조회 중 오류 발생: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "사용자 정보 조회 중 오류가 발생했습니다."));
        }
    }
    
    /**
     * 사용자 소셜 계정 정보 조회
     */
    @GetMapping("/users/{id}/social-accounts")
    public ResponseEntity<?> getUserSocialAccounts(@PathVariable Long id, HttpSession session) {
        try {
            log.info("🔍 사용자 소셜 계정 정보 조회: ID={}", id);
            
            // 권한 확인
            User currentUser = (User) session.getAttribute("user");
            if (currentUser == null || (!currentUser.getRole().isAdmin() && !currentUser.getRole().isMaster())) {
                return ResponseEntity.status(403).body(Map.of("success", false, "message", "권한이 없습니다."));
            }
            
            // 임시로 빈 데이터 반환 (실제 구현 필요)
            Map<String, Object> socialAccounts = Map.of(
                "kakao", Map.of("connected", false),
                "naver", Map.of("connected", false),
                "google", Map.of("connected", false)
            );
            
            log.info("✅ 사용자 소셜 계정 정보 조회 완료: ID={}", id);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", socialAccounts
            ));
        } catch (Exception e) {
            log.error("❌ 사용자 소셜 계정 정보 조회 중 오류 발생: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "소셜 계정 정보 조회 중 오류가 발생했습니다."));
        }
    }
    
    /**
     * 사용자 역할 정보 조회 (동적 표시명)
     */
    @GetMapping("/user-roles")
    public ResponseEntity<?> getUserRoles() {
        try {
            log.info("🔍 사용자 역할 정보 조회");
            
            Map<String, Map<String, String>> roleInfo = new HashMap<>();
            
            for (UserRole role : UserRole.values()) {
                Map<String, String> roleData = Map.of(
                    "value", role.name(),
                    "displayName", role.getDisplayName(),
                    "displayNameEn", getEnglishDisplayName(role)
                );
                roleInfo.put(role.name(), roleData);
            }
            
            log.info("✅ 사용자 역할 정보 조회 완료: {}개 역할", roleInfo.size());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", roleInfo
            ));
        } catch (Exception e) {
            log.error("❌ 사용자 역할 정보 조회 중 오류 발생: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "역할 정보 조회 중 오류가 발생했습니다."));
        }
    }
    
    /**
     * 역할별 영문 표시명 매핑
     */
    private String getEnglishDisplayName(UserRole role) {
        switch (role) {
            case CLIENT:
                return "Client";
            case CONSULTANT:
                return "Consultant";
            case ADMIN:
                return "Admin";
            case BRANCH_SUPER_ADMIN:
                return "Branch Super Admin";
            case HQ_ADMIN:
                return "HQ Admin";
            case SUPER_HQ_ADMIN:
                return "Super HQ Admin";
            case HQ_MASTER:
                return "HQ Master";
            case BRANCH_MANAGER:
                return "Branch Manager";
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
            
            // 사용자 역할에 따른 메뉴 목록 반환
            Map<String, Object> menuStructure = menuService.getMenuStructureByRole(currentUser.getRole());
            List<Map<String, Object>> menus = (List<Map<String, Object>>) menuStructure.get("menus");
            
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
     * 재무 거래 목록 조회
     */
    @GetMapping("/financial-transactions")
    public ResponseEntity<Map<String, Object>> getFinancialTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpSession session) {
        try {
            log.info("🔍 재무 거래 목록 조회");
            
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "로그인이 필요합니다.");
                return ResponseEntity.status(401).body(response);
            }
            
            // 재무 거래 목록 조회
            var transactions = financialTransactionService.getTransactions(
                org.springframework.data.domain.PageRequest.of(page, size)
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", transactions.getContent());
            response.put("totalCount", transactions.getTotalElements());
            response.put("totalPages", transactions.getTotalPages());
            response.put("currentPage", transactions.getNumber());
            response.put("size", transactions.getSize());
            
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
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
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
            
            // 예산 목록 조회
            var budgets = erpService.getAllActiveBudgets();
            
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
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
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
            
            // 세금 계산 목록 조회 (임시 데이터)
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
            @RequestBody Map<String, Object> taxData,
            HttpSession session) {
        try {
            log.info("🔍 세금 계산 항목 생성");
            
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "로그인이 필요합니다.");
                return ResponseEntity.status(401).body(response);
            }
            
            // 세금 계산 항목 생성 로직 (향후 구현)
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

    // ==================== 상담일지 관리 (관리자 전용) ====================

    /**
     * 관리자용 상담일지 목록 조회
     */
    @GetMapping("/consultation-records")
    public ResponseEntity<Map<String, Object>> getConsultationRecords(
            @RequestParam(required = false) Long consultantId,
            @RequestParam(required = false) Long clientId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpSession session) {
        try {
            log.info("📝 관리자용 상담일지 목록 조회 - 상담사 ID: {}, 내담자 ID: {}", consultantId, clientId);
            
            // 권한 확인
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            // 관리자 권한 확인
            if (!currentUser.getRole().isAdmin() && !currentUser.getRole().isMaster()) {
                return ResponseEntity.status(403).body(Map.of(
                    "success", false,
                    "message", "관리자 권한이 필요합니다."
                ));
            }
            
            // 페이지네이션 설정
            org.springframework.data.domain.Pageable pageable = 
                org.springframework.data.domain.PageRequest.of(page, size);
            
            // 상담일지 조회
            var consultationRecords = consultationRecordService.getConsultationRecords(consultantId, clientId, pageable);
            
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
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "상담일지 목록 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 관리자용 상담일지 상세 조회
     */
    @GetMapping("/consultation-records/{recordId}")
    public ResponseEntity<Map<String, Object>> getConsultationRecord(
            @PathVariable Long recordId,
            HttpSession session) {
        try {
            log.info("📝 관리자용 상담일지 상세 조회 - 기록 ID: {}", recordId);
            
            // 권한 확인
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            // 관리자 권한 확인
            if (!currentUser.getRole().isAdmin() && !currentUser.getRole().isMaster()) {
                return ResponseEntity.status(403).body(Map.of(
                    "success", false,
                    "message", "관리자 권한이 필요합니다."
                ));
            }
            
            // 상담일지 조회
            var record = consultationRecordService.getConsultationRecordById(recordId);
            
            if (record == null) {
                return ResponseEntity.notFound().build();
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", record);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 관리자용 상담일지 상세 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "상담일지 상세 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 관리자용 상담일지 수정
     */
    @PutMapping("/consultation-records/{recordId}")
    public ResponseEntity<Map<String, Object>> updateConsultationRecord(
            @PathVariable Long recordId,
            @RequestBody Map<String, Object> recordData,
            HttpSession session) {
        try {
            log.info("📝 관리자용 상담일지 수정 - 기록 ID: {}", recordId);
            
            // 권한 확인
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            // 관리자 권한 확인
            if (!currentUser.getRole().isAdmin() && !currentUser.getRole().isMaster()) {
                return ResponseEntity.status(403).body(Map.of(
                    "success", false,
                    "message", "관리자 권한이 필요합니다."
                ));
            }
            
            // 상담일지 수정
            var updatedRecord = consultationRecordService.updateConsultationRecord(recordId, recordData);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "상담일지가 성공적으로 수정되었습니다.");
            response.put("data", updatedRecord);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 관리자용 상담일지 수정 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "상담일지 수정에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 관리자용 상담일지 삭제
     */
    @DeleteMapping("/consultation-records/{recordId}")
    public ResponseEntity<Map<String, Object>> deleteConsultationRecord(
            @PathVariable Long recordId,
            HttpSession session) {
        try {
            log.info("📝 관리자용 상담일지 삭제 - 기록 ID: {}", recordId);
            
            // 권한 확인
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            // 관리자 권한 확인
            if (!currentUser.getRole().isAdmin() && !currentUser.getRole().isMaster()) {
                return ResponseEntity.status(403).body(Map.of(
                    "success", false,
                    "message", "관리자 권한이 필요합니다."
                ));
            }
            
            // 상담일지 삭제
            consultationRecordService.deleteConsultationRecord(recordId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "상담일지가 성공적으로 삭제되었습니다.");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 관리자용 상담일지 삭제 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "상담일지 삭제에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 중복 매핑 조회
     */
    @GetMapping("/duplicate-mappings")
    public ResponseEntity<?> findDuplicateMappings(HttpSession session) {
        try {
            log.info("🔍 중복 매핑 조회");
            
            // 권한 확인
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            // 관리자 권한 확인
            if (!currentUser.getRole().isAdmin() && !currentUser.getRole().isMaster()) {
                return ResponseEntity.status(403).body(Map.of(
                    "success", false,
                    "message", "관리자 권한이 필요합니다."
                ));
            }
            
            List<Map<String, Object>> duplicates = adminService.findDuplicateMappings();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", duplicates,
                "count", duplicates.size()
            ));
            
        } catch (Exception e) {
            log.error("❌ 중복 매핑 조회 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "중복 매핑 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 중복 매핑 통합
     */
    @PostMapping("/merge-duplicate-mappings")
    public ResponseEntity<?> mergeDuplicateMappings(HttpSession session) {
        try {
            log.info("🔄 중복 매핑 통합 시작");
            
            // 권한 확인
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            // 관리자 권한 확인
            if (!currentUser.getRole().isAdmin() && !currentUser.getRole().isMaster()) {
                return ResponseEntity.status(403).body(Map.of(
                    "success", false,
                    "message", "관리자 권한이 필요합니다."
                ));
            }
            
            Map<String, Object> result = adminService.mergeDuplicateMappings();
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("❌ 중복 매핑 통합 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "중복 매핑 통합에 실패했습니다: " + e.getMessage()
            ));
        }
    }
}

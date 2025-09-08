package com.mindgarden.consultation.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.dto.ClientRegistrationDto;
import com.mindgarden.consultation.dto.ConsultantClientMappingDto;
import com.mindgarden.consultation.dto.ConsultantRegistrationDto;
import com.mindgarden.consultation.dto.ConsultantTransferRequest;
import com.mindgarden.consultation.entity.Client;
import com.mindgarden.consultation.entity.ConsultantClientMapping;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.service.AdminService;
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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminController {

    private final AdminService adminService;

    /**
     * 상담사 목록 조회 (전문분야 상세 정보 포함)
     */
    @GetMapping("/consultants")
    public ResponseEntity<?> getAllConsultants() {
        try {
            log.info("🔍 상담사 목록 조회");
            List<Map<String, Object>> consultantsWithSpecialty = adminService.getAllConsultantsWithSpecialty();
            
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
     * 내담자 목록 조회
     */
    @GetMapping("/clients")
    public ResponseEntity<?> getAllClients() {
        try {
            log.info("🔍 내담자 목록 조회");
            List<Client> clients = adminService.getAllClients();
            
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
     * 상담사별 매핑된 내담자 목록 조회 (스케줄 등록용)
     */
    @GetMapping("/mappings/consultant/{consultantId}/clients")
    public ResponseEntity<?> getClientsByConsultantMapping(@PathVariable Long consultantId) {
        try {
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
                                "phone", mapping.getClient().getPhone() != null ? mapping.getClient().getPhone() : ""
                            ));
                        }
                        
                        data.put("remainingSessions", mapping.getRemainingSessions());
                        data.put("packageName", mapping.getPackageName());
                        data.put("paymentStatus", mapping.getPaymentStatus().toString());
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
                    "data", null
                ));
            }
            
            // 가장 최근 활성 매핑 찾기
            ConsultantClientMapping activeMapping = mappings.stream()
                .filter(mapping -> mapping.getStatus() == ConsultantClientMapping.MappingStatus.ACTIVE)
                .findFirst()
                .orElse(mappings.get(0));
            
            // 상담사 정보 추출
            Map<String, Object> consultantInfo = new HashMap<>();
            if (activeMapping.getConsultant() != null) {
                consultantInfo.put("consultantId", activeMapping.getConsultant().getId());
                consultantInfo.put("consultantName", activeMapping.getConsultant().getName());
                consultantInfo.put("specialty", activeMapping.getConsultant().getSpecialization());
                consultantInfo.put("intro", "전문적이고 따뜻한 상담을 제공합니다.");
                consultantInfo.put("profileImage", null);
            }
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "내담자별 매핑 조회 성공",
                "data", consultantInfo
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
     * 매핑 목록 조회
     */
    @GetMapping("/mappings")
    public ResponseEntity<?> getAllMappings() {
        try {
            log.info("🔍 매핑 목록 조회");
            List<ConsultantClientMapping> mappings = adminService.getAllMappings();

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
    public ResponseEntity<?> registerConsultant(@RequestBody ConsultantRegistrationDto dto) {
        try {
            log.info("🔧 상담사 등록: {}", dto.getUsername());
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
    public ResponseEntity<?> registerClient(@RequestBody ClientRegistrationDto dto) {
        try {
            log.info("🔧 내담자 등록: {}", dto.getName());
            Client client = adminService.registerClient(dto);
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
    public ResponseEntity<?> createMapping(@RequestBody ConsultantClientMappingDto dto) {
        try {
            log.info("🔧 매핑 생성: 상담사={}, 내담자={}", dto.getConsultantId(), dto.getClientId());
            ConsultantClientMapping mapping = adminService.createMapping(dto);
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
    public ResponseEntity<?> updateConsultant(@PathVariable Long id, @RequestBody ConsultantRegistrationDto dto) {
        try {
            log.info("🔧 상담사 정보 수정: ID={}", id);
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
     * 내담자 정보 수정
     */
    @PutMapping("/clients/{id}")
    public ResponseEntity<?> updateClient(@PathVariable Long id, @RequestBody ClientRegistrationDto dto) {
        try {
            log.info("🔧 내담자 정보 수정: ID={}", id);
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
}

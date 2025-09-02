package com.mindgarden.consultation.controller;

import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.dto.ClientRegistrationDto;
import com.mindgarden.consultation.dto.ConsultantClientMappingDto;
import com.mindgarden.consultation.dto.ConsultantRegistrationDto;
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
     * 상담사 목록 조회
     */
    @GetMapping("/consultants")
    public ResponseEntity<?> getAllConsultants() {
        try {
            log.info("🔍 상담사 목록 조회");
            List<User> consultants = adminService.getAllConsultants();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", consultants,
                "count", consultants.size()
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
                        } else {
                            data.put("consultantId", null);
                            data.put("consultantName", "알 수 없음");
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
     * 입금 확인 처리
     */
    @PostMapping("/mappings/{mappingId}/confirm-payment")
    public ResponseEntity<?> confirmPayment(
            @PathVariable Long mappingId,
            @RequestBody Map<String, Object> request) {
        try {
            log.info("💰 매핑 ID {} 입금 확인 처리", mappingId);
            
            String paymentMethod = (String) request.get("paymentMethod");
            String paymentReference = (String) request.get("paymentReference");
            Long paymentAmount = Long.valueOf(request.get("paymentAmount").toString());
            
            ConsultantClientMapping mapping = adminService.confirmPayment(
                mappingId, paymentMethod, paymentReference, paymentAmount);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "입금 확인이 완료되었습니다.",
                "data", mapping
            ));
        } catch (Exception e) {
            log.error("❌ 입금 확인 처리 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "입금 확인 처리에 실패했습니다: " + e.getMessage()
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
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "매핑이 승인되었습니다. 이제 스케줄을 작성할 수 있습니다.",
                "data", mapping
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
}

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
            
            // 직렬화 문제를 피하기 위해 필요한 정보만 추출
            List<Map<String, Object>> mappingData = mappings.stream()
                .map(mapping -> {
                    Map<String, Object> data = new java.util.HashMap<>();
                    data.put("id", mapping.getId());
                    data.put("consultantId", mapping.getConsultant().getId());
                    data.put("consultantName", mapping.getConsultant().getName());
                    data.put("clientId", mapping.getClient().getId());
                    data.put("clientName", mapping.getClient().getName());
                    data.put("status", mapping.getStatus());
                    data.put("assignedAt", mapping.getAssignedAt());
                    data.put("createdAt", mapping.getCreatedAt());
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

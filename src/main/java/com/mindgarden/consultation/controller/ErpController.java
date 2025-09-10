package com.mindgarden.consultation.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.mindgarden.consultation.constant.UserRole;
import com.mindgarden.consultation.dto.ItemCreateRequest;
import com.mindgarden.consultation.dto.ItemUpdateRequest;
import com.mindgarden.consultation.entity.Budget;
import com.mindgarden.consultation.entity.Item;
import com.mindgarden.consultation.entity.PurchaseOrder;
import com.mindgarden.consultation.entity.PurchaseRequest;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.service.ErpService;
import com.mindgarden.consultation.utils.SessionUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * ERP REST API 컨트롤러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@RestController
@RequestMapping("/api/erp")
@RequiredArgsConstructor
public class ErpController {
    
    private final ErpService erpService;
    
    // ==================== Item Management ====================
    
    /**
     * 모든 활성화된 아이템 조회
     */
    @GetMapping("/items")
    public ResponseEntity<Map<String, Object>> getAllItems() {
        try {
            log.info("모든 아이템 조회 요청");
            
            List<Item> items = erpService.getAllActiveItems();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", items);
            response.put("count", items.size());
            response.put("message", "아이템 목록을 성공적으로 조회했습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("아이템 목록 조회 중 오류: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "아이템 목록 조회에 실패했습니다.");
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    /**
     * ID로 아이템 조회
     */
    @GetMapping("/items/{id}")
    public ResponseEntity<Map<String, Object>> getItemById(@PathVariable Long id) {
        try {
            log.info("아이템 조회 요청: id={}", id);
            
            Optional<Item> item = erpService.getItemById(id);
            
            Map<String, Object> response = new HashMap<>();
            if (item.isPresent()) {
                response.put("success", true);
                response.put("data", item.get());
                response.put("message", "아이템을 성공적으로 조회했습니다.");
            } else {
                response.put("success", false);
                response.put("message", "아이템을 찾을 수 없습니다.");
                return ResponseEntity.status(404).body(response);
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("아이템 조회 중 오류: id={}, error={}", id, e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "아이템 조회에 실패했습니다.");
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    /**
     * 카테고리별 아이템 조회
     */
    @GetMapping("/items/category/{category}")
    public ResponseEntity<Map<String, Object>> getItemsByCategory(@PathVariable String category) {
        try {
            log.info("카테고리별 아이템 조회 요청: category={}", category);
            
            List<Item> items = erpService.getItemsByCategory(category);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", items);
            response.put("count", items.size());
            response.put("message", "카테고리별 아이템 목록을 성공적으로 조회했습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("카테고리별 아이템 조회 중 오류: category={}, error={}", category, e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "카테고리별 아이템 조회에 실패했습니다.");
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    /**
     * 이름으로 아이템 검색
     */
    @GetMapping("/items/search")
    public ResponseEntity<Map<String, Object>> searchItemsByName(@RequestParam String name) {
        try {
            log.info("아이템 검색 요청: name={}", name);
            
            List<Item> items = erpService.searchItemsByName(name);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", items);
            response.put("count", items.size());
            response.put("message", "아이템 검색을 성공적으로 완료했습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("아이템 검색 중 오류: name={}, error={}", name, e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "아이템 검색에 실패했습니다.");
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    /**
     * 재고 부족 아이템 조회
     */
    @GetMapping("/items/low-stock")
    public ResponseEntity<Map<String, Object>> getLowStockItems(@RequestParam(defaultValue = "10") Integer threshold) {
        try {
            log.info("재고 부족 아이템 조회 요청: threshold={}", threshold);
            
            List<Item> items = erpService.getLowStockItems(threshold);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", items);
            response.put("count", items.size());
            response.put("message", "재고 부족 아이템 목록을 성공적으로 조회했습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("재고 부족 아이템 조회 중 오류: threshold={}, error={}", threshold, e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "재고 부족 아이템 조회에 실패했습니다.");
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    /**
     * 아이템 생성 (관리자/수퍼어드민 전용)
     */
    @PostMapping("/items")
    public ResponseEntity<Map<String, Object>> createItem(@Valid @RequestBody ItemCreateRequest request, HttpSession session) {
        try {
            // 권한 확인
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null || (!currentUser.getRole().equals(UserRole.ADMIN) && !currentUser.getRole().equals(UserRole.SUPER_ADMIN))) {
                log.warn("아이템 생성 권한 없음: {}", currentUser != null ? currentUser.getEmail() : "null");
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "관리자 권한이 필요합니다."));
            }
            
            log.info("아이템 생성 요청: name={}, category={}", request.getName(), request.getCategory());
            
            // Item 엔티티 생성
            Item item = Item.builder()
                .name(request.getName())
                .description(request.getDescription())
                .category(request.getCategory())
                .unitPrice(request.getUnitPrice())
                .stockQuantity(request.getStockQuantity())
                .supplier(request.getSupplier())
                .isActive(true)
                .build();
            
            Item createdItem = erpService.createItem(item);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", createdItem);
            response.put("message", "아이템이 성공적으로 생성되었습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("아이템 생성 중 오류: error={}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "아이템 생성에 실패했습니다.");
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    /**
     * 아이템 수정 (관리자/수퍼어드민 전용)
     */
    @PutMapping("/items/{id}")
    public ResponseEntity<Map<String, Object>> updateItem(@PathVariable Long id, @Valid @RequestBody ItemUpdateRequest request, HttpSession session) {
        try {
            // 권한 확인
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null || (!currentUser.getRole().equals(UserRole.ADMIN) && !currentUser.getRole().equals(UserRole.SUPER_ADMIN))) {
                log.warn("아이템 수정 권한 없음: {}", currentUser != null ? currentUser.getEmail() : "null");
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "관리자 권한이 필요합니다."));
            }
            
            log.info("아이템 수정 요청: id={}, name={}", id, request.getName());
            
            // 기존 아이템 조회
            Optional<Item> existingItem = erpService.getItemById(id);
            if (existingItem.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "message", "아이템을 찾을 수 없습니다."));
            }
            
            // 아이템 정보 업데이트
            Item item = existingItem.get();
            item.setName(request.getName());
            item.setDescription(request.getDescription());
            item.setCategory(request.getCategory());
            item.setUnitPrice(request.getUnitPrice());
            item.setStockQuantity(request.getStockQuantity());
            item.setSupplier(request.getSupplier());
            
            Item updatedItem = erpService.updateItem(id, item);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", updatedItem);
            response.put("message", "아이템이 성공적으로 수정되었습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("아이템 수정 중 오류: id={}, error={}", id, e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "아이템 수정에 실패했습니다.");
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    /**
     * 아이템 삭제 (수퍼어드민 전용)
     */
    @DeleteMapping("/items/{id}")
    public ResponseEntity<Map<String, Object>> deleteItem(@PathVariable Long id, HttpSession session) {
        try {
            // 권한 확인 (수퍼어드민만)
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null || !currentUser.getRole().equals(UserRole.SUPER_ADMIN)) {
                log.warn("아이템 삭제 권한 없음: {}", currentUser != null ? currentUser.getEmail() : "null");
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "수퍼어드민 권한이 필요합니다."));
            }
            
            log.info("아이템 삭제 요청: id={}", id);
            
            boolean deleted = erpService.deleteItem(id);
            
            if (deleted) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "아이템이 성공적으로 삭제되었습니다.");
                
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "message", "아이템을 찾을 수 없습니다."));
            }
        } catch (Exception e) {
            log.error("아이템 삭제 중 오류: id={}, error={}", id, e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "아이템 삭제에 실패했습니다.");
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    /**
     * 아이템 재고 업데이트 (관리자/수퍼어드민 전용)
     */
    @PutMapping("/items/{id}/stock")
    public ResponseEntity<Map<String, Object>> updateItemStock(@PathVariable Long id, @RequestParam Integer quantity, HttpSession session) {
        try {
            // 권한 확인
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null || (!currentUser.getRole().equals(UserRole.ADMIN) && !currentUser.getRole().equals(UserRole.SUPER_ADMIN))) {
                log.warn("아이템 재고 업데이트 권한 없음: {}", currentUser != null ? currentUser.getEmail() : "null");
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "관리자 권한이 필요합니다."));
            }
            
            log.info("아이템 재고 업데이트 요청: id={}, quantity={}", id, quantity);
            
            boolean updated = erpService.updateItemStock(id, quantity);
            
            if (updated) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "아이템 재고가 성공적으로 업데이트되었습니다.");
                
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "message", "아이템을 찾을 수 없습니다."));
            }
        } catch (Exception e) {
            log.error("아이템 재고 업데이트 중 오류: id={}, quantity={}, error={}", id, quantity, e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "아이템 재고 업데이트에 실패했습니다.");
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    // ==================== Purchase Request Management ====================
    
    /**
     * 모든 구매 요청 조회
     */
    @GetMapping("/purchase-requests")
    public ResponseEntity<Map<String, Object>> getAllPurchaseRequests() {
        try {
            log.info("모든 구매 요청 조회");
            
            List<PurchaseRequest> requests = erpService.getAllActivePurchaseRequests();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", requests);
            response.put("count", requests.size());
            response.put("message", "구매 요청 목록을 성공적으로 조회했습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("구매 요청 목록 조회 중 오류: error={}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "구매 요청 목록 조회에 실패했습니다.");
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    /**
     * 구매 요청 생성
     */
    @PostMapping("/purchase-requests")
    public ResponseEntity<Map<String, Object>> createPurchaseRequest(
            @RequestParam Long requesterId,
            @RequestParam Long itemId,
            @RequestParam Integer quantity,
            @RequestParam(required = false) String reason) {
        try {
            log.info("구매 요청 생성: requesterId={}, itemId={}, quantity={}", requesterId, itemId, quantity);
            
            PurchaseRequest request = erpService.createPurchaseRequest(requesterId, itemId, quantity, reason);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", request);
            response.put("message", "구매 요청을 성공적으로 생성했습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("구매 요청 생성 중 오류: requesterId={}, itemId={}, quantity={}, error={}", 
                    requesterId, itemId, quantity, e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "구매 요청 생성에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.status(400).body(errorResponse);
        }
    }
    
    /**
     * 구매 요청 조회
     */
    @GetMapping("/purchase-requests/{id}")
    public ResponseEntity<Map<String, Object>> getPurchaseRequestById(@PathVariable Long id) {
        try {
            log.info("구매 요청 조회: id={}", id);
            
            Optional<PurchaseRequest> request = erpService.getPurchaseRequestById(id);
            
            Map<String, Object> response = new HashMap<>();
            if (request.isPresent()) {
                response.put("success", true);
                response.put("data", request.get());
                response.put("message", "구매 요청을 성공적으로 조회했습니다.");
            } else {
                response.put("success", false);
                response.put("message", "구매 요청을 찾을 수 없습니다.");
                return ResponseEntity.status(404).body(response);
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("구매 요청 조회 중 오류: id={}, error={}", id, e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "구매 요청 조회에 실패했습니다.");
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    /**
     * 요청자별 구매 요청 목록 조회
     */
    @GetMapping("/purchase-requests/requester/{requesterId}")
    public ResponseEntity<Map<String, Object>> getPurchaseRequestsByRequester(@PathVariable Long requesterId) {
        try {
            log.info("요청자별 구매 요청 목록 조회: requesterId={}", requesterId);
            
            List<PurchaseRequest> requests = erpService.getPurchaseRequestsByRequester(requesterId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", requests);
            response.put("count", requests.size());
            response.put("message", "요청자별 구매 요청 목록을 성공적으로 조회했습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("요청자별 구매 요청 목록 조회 중 오류: requesterId={}, error={}", requesterId, e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "요청자별 구매 요청 목록 조회에 실패했습니다.");
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    /**
     * 관리자 승인 대기 목록 조회
     */
    @GetMapping("/purchase-requests/pending-admin")
    public ResponseEntity<Map<String, Object>> getPendingAdminApproval() {
        try {
            log.info("관리자 승인 대기 목록 조회");
            
            List<PurchaseRequest> requests = erpService.getPendingAdminApproval();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", requests);
            response.put("count", requests.size());
            response.put("message", "관리자 승인 대기 목록을 성공적으로 조회했습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("관리자 승인 대기 목록 조회 중 오류: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "관리자 승인 대기 목록 조회에 실패했습니다.");
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    /**
     * 수퍼 관리자 승인 대기 목록 조회
     */
    @GetMapping("/purchase-requests/pending-super-admin")
    public ResponseEntity<Map<String, Object>> getPendingSuperAdminApproval() {
        try {
            log.info("수퍼 관리자 승인 대기 목록 조회");
            
            List<PurchaseRequest> requests = erpService.getPendingSuperAdminApproval();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", requests);
            response.put("count", requests.size());
            response.put("message", "수퍼 관리자 승인 대기 목록을 성공적으로 조회했습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("수퍼 관리자 승인 대기 목록 조회 중 오류: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "수퍼 관리자 승인 대기 목록 조회에 실패했습니다.");
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    /**
     * 관리자 승인
     */
    @PostMapping("/purchase-requests/{id}/approve-admin")
    public ResponseEntity<Map<String, Object>> approveByAdmin(
            @PathVariable Long id,
            @RequestParam Long adminId,
            @RequestParam(required = false) String comment) {
        try {
            log.info("관리자 승인: id={}, adminId={}", id, adminId);
            
            boolean success = erpService.approveByAdmin(id, adminId, comment);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", success);
            response.put("message", success ? "관리자 승인을 성공적으로 완료했습니다." : "관리자 승인에 실패했습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("관리자 승인 중 오류: id={}, adminId={}, error={}", id, adminId, e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "관리자 승인에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.status(400).body(errorResponse);
        }
    }
    
    /**
     * 관리자 거부
     */
    @PostMapping("/purchase-requests/{id}/reject-admin")
    public ResponseEntity<Map<String, Object>> rejectByAdmin(
            @PathVariable Long id,
            @RequestParam Long adminId,
            @RequestParam(required = false) String comment) {
        try {
            log.info("관리자 거부: id={}, adminId={}", id, adminId);
            
            boolean success = erpService.rejectByAdmin(id, adminId, comment);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", success);
            response.put("message", success ? "관리자 거부를 성공적으로 완료했습니다." : "관리자 거부에 실패했습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("관리자 거부 중 오류: id={}, adminId={}, error={}", id, adminId, e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "관리자 거부에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.status(400).body(errorResponse);
        }
    }
    
    /**
     * 수퍼 관리자 승인
     */
    @PostMapping("/purchase-requests/{id}/approve-super-admin")
    public ResponseEntity<Map<String, Object>> approveBySuperAdmin(
            @PathVariable Long id,
            @RequestParam Long superAdminId,
            @RequestParam(required = false) String comment) {
        try {
            log.info("수퍼 관리자 승인: id={}, superAdminId={}", id, superAdminId);
            
            boolean success = erpService.approveBySuperAdmin(id, superAdminId, comment);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", success);
            response.put("message", success ? "수퍼 관리자 승인을 성공적으로 완료했습니다." : "수퍼 관리자 승인에 실패했습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("수퍼 관리자 승인 중 오류: id={}, superAdminId={}, error={}", id, superAdminId, e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "수퍼 관리자 승인에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.status(400).body(errorResponse);
        }
    }
    
    /**
     * 수퍼 관리자 거부
     */
    @PostMapping("/purchase-requests/{id}/reject-super-admin")
    public ResponseEntity<Map<String, Object>> rejectBySuperAdmin(
            @PathVariable Long id,
            @RequestParam Long superAdminId,
            @RequestParam(required = false) String comment) {
        try {
            log.info("수퍼 관리자 거부: id={}, superAdminId={}", id, superAdminId);
            
            boolean success = erpService.rejectBySuperAdmin(id, superAdminId, comment);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", success);
            response.put("message", success ? "수퍼 관리자 거부를 성공적으로 완료했습니다." : "수퍼 관리자 거부에 실패했습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("수퍼 관리자 거부 중 오류: id={}, superAdminId={}, error={}", id, superAdminId, e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "수퍼 관리자 거부에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.status(400).body(errorResponse);
        }
    }
    
    /**
     * 구매 요청 취소
     */
    @PostMapping("/purchase-requests/{id}/cancel")
    public ResponseEntity<Map<String, Object>> cancelPurchaseRequest(
            @PathVariable Long id,
            @RequestParam Long requesterId) {
        try {
            log.info("구매 요청 취소: id={}, requesterId={}", id, requesterId);
            
            boolean success = erpService.cancelPurchaseRequest(id, requesterId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", success);
            response.put("message", success ? "구매 요청을 성공적으로 취소했습니다." : "구매 요청 취소에 실패했습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("구매 요청 취소 중 오류: id={}, requesterId={}, error={}", id, requesterId, e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "구매 요청 취소에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.status(400).body(errorResponse);
        }
    }
    
    // ==================== Purchase Order Management ====================
    
    /**
     * 모든 구매 주문 조회
     */
    @GetMapping("/purchase-orders")
    public ResponseEntity<Map<String, Object>> getAllPurchaseOrders() {
        try {
            log.info("모든 구매 주문 조회");
            
            List<PurchaseOrder> orders = erpService.getAllActivePurchaseOrders();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", orders);
            response.put("count", orders.size());
            response.put("message", "구매 주문 목록을 성공적으로 조회했습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("구매 주문 목록 조회 중 오류: error={}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "구매 주문 목록 조회에 실패했습니다.");
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    /**
     * 구매 주문 생성
     */
    @PostMapping("/purchase-orders")
    public ResponseEntity<Map<String, Object>> createPurchaseOrder(
            @RequestParam Long requestId,
            @RequestParam Long purchaserId,
            @RequestParam String supplier,
            @RequestParam(required = false) String supplierContact,
            @RequestParam(required = false) String expectedDeliveryDate,
            @RequestParam(required = false) String notes) {
        try {
            log.info("구매 주문 생성: requestId={}, purchaserId={}", requestId, purchaserId);
            
            LocalDateTime deliveryDate = null;
            if (expectedDeliveryDate != null && !expectedDeliveryDate.isEmpty()) {
                deliveryDate = LocalDateTime.parse(expectedDeliveryDate);
            }
            
            PurchaseOrder order = erpService.createPurchaseOrder(requestId, purchaserId, supplier, supplierContact, deliveryDate, notes);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", order);
            response.put("message", "구매 주문을 성공적으로 생성했습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("구매 주문 생성 중 오류: requestId={}, purchaserId={}, error={}", 
                    requestId, purchaserId, e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "구매 주문 생성에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.status(400).body(errorResponse);
        }
    }
    
    /**
     * 구매 주문 조회
     */
    @GetMapping("/purchase-orders/{id}")
    public ResponseEntity<Map<String, Object>> getPurchaseOrderById(@PathVariable Long id) {
        try {
            log.info("구매 주문 조회: id={}", id);
            
            Optional<PurchaseOrder> order = erpService.getPurchaseOrderById(id);
            
            Map<String, Object> response = new HashMap<>();
            if (order.isPresent()) {
                response.put("success", true);
                response.put("data", order.get());
                response.put("message", "구매 주문을 성공적으로 조회했습니다.");
            } else {
                response.put("success", false);
                response.put("message", "구매 주문을 찾을 수 없습니다.");
                return ResponseEntity.status(404).body(response);
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("구매 주문 조회 중 오류: id={}, error={}", id, e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "구매 주문 조회에 실패했습니다.");
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    /**
     * 주문 상태 업데이트
     */
    @PutMapping("/purchase-orders/{id}/status")
    public ResponseEntity<Map<String, Object>> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        try {
            log.info("주문 상태 업데이트: id={}, status={}", id, status);
            
            PurchaseOrder.PurchaseOrderStatus orderStatus = PurchaseOrder.PurchaseOrderStatus.valueOf(status);
            boolean success = erpService.updateOrderStatus(id, orderStatus);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", success);
            response.put("message", success ? "주문 상태를 성공적으로 업데이트했습니다." : "주문 상태 업데이트에 실패했습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("주문 상태 업데이트 중 오류: id={}, status={}, error={}", id, status, e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "주문 상태 업데이트에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.status(400).body(errorResponse);
        }
    }
    
    /**
     * 배송 완료 처리
     */
    @PostMapping("/purchase-orders/{id}/deliver")
    public ResponseEntity<Map<String, Object>> markAsDelivered(@PathVariable Long id) {
        try {
            log.info("배송 완료 처리: id={}", id);
            
            boolean success = erpService.markAsDelivered(id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", success);
            response.put("message", success ? "배송 완료 처리를 성공적으로 완료했습니다." : "배송 완료 처리에 실패했습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("배송 완료 처리 중 오류: id={}, error={}", id, e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "배송 완료 처리에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.status(400).body(errorResponse);
        }
    }
    
    // ==================== Budget Management ====================
    
    /**
     * 모든 활성화된 예산 조회
     */
    @GetMapping("/budgets")
    public ResponseEntity<Map<String, Object>> getAllBudgets() {
        try {
            log.info("모든 예산 조회 요청");
            
            List<Budget> budgets = erpService.getAllActiveBudgets();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", budgets);
            response.put("count", budgets.size());
            response.put("message", "예산 목록을 성공적으로 조회했습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("예산 목록 조회 중 오류: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "예산 목록 조회에 실패했습니다.");
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    /**
     * ID로 예산 조회
     */
    @GetMapping("/budgets/{id}")
    public ResponseEntity<Map<String, Object>> getBudgetById(@PathVariable Long id) {
        try {
            log.info("예산 조회: id={}", id);
            
            Optional<Budget> budget = erpService.getBudgetById(id);
            
            Map<String, Object> response = new HashMap<>();
            if (budget.isPresent()) {
                response.put("success", true);
                response.put("data", budget.get());
                response.put("message", "예산을 성공적으로 조회했습니다.");
            } else {
                response.put("success", false);
                response.put("message", "예산을 찾을 수 없습니다.");
                return ResponseEntity.status(404).body(response);
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("예산 조회 중 오류: id={}, error={}", id, e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "예산 조회에 실패했습니다.");
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    /**
     * 연도별 예산 조회
     */
    @GetMapping("/budgets/year/{year}")
    public ResponseEntity<Map<String, Object>> getBudgetsByYear(@PathVariable String year) {
        try {
            log.info("연도별 예산 조회: year={}", year);
            
            List<Budget> budgets = erpService.getBudgetsByYear(year);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", budgets);
            response.put("count", budgets.size());
            response.put("message", "연도별 예산 목록을 성공적으로 조회했습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("연도별 예산 조회 중 오류: year={}, error={}", year, e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "연도별 예산 조회에 실패했습니다.");
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    /**
     * 월별 예산 조회
     */
    @GetMapping("/budgets/year/{year}/month/{month}")
    public ResponseEntity<Map<String, Object>> getBudgetsByYearAndMonth(
            @PathVariable String year,
            @PathVariable String month) {
        try {
            log.info("월별 예산 조회: year={}, month={}", year, month);
            
            List<Budget> budgets = erpService.getBudgetsByYearAndMonth(year, month);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", budgets);
            response.put("count", budgets.size());
            response.put("message", "월별 예산 목록을 성공적으로 조회했습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("월별 예산 조회 중 오류: year={}, month={}, error={}", year, month, e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "월별 예산 조회에 실패했습니다.");
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    /**
     * 카테고리별 예산 조회
     */
    @GetMapping("/budgets/category/{category}")
    public ResponseEntity<Map<String, Object>> getBudgetsByCategory(@PathVariable String category) {
        try {
            log.info("카테고리별 예산 조회: category={}", category);
            
            List<Budget> budgets = erpService.getBudgetsByCategory(category);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", budgets);
            response.put("count", budgets.size());
            response.put("message", "카테고리별 예산 목록을 성공적으로 조회했습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("카테고리별 예산 조회 중 오류: category={}, error={}", category, e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "카테고리별 예산 조회에 실패했습니다.");
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    // ==================== Statistics and Reports ====================
    
    /**
     * 월별 구매 요청 통계
     */
    @GetMapping("/stats/purchase-requests/monthly")
    public ResponseEntity<Map<String, Object>> getMonthlyPurchaseRequestStats(
            @RequestParam int year,
            @RequestParam int month) {
        try {
            log.info("월별 구매 요청 통계: year={}, month={}", year, month);
            
            Map<String, Object> stats = erpService.getMonthlyPurchaseRequestStats(year, month);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", stats);
            response.put("message", "월별 구매 요청 통계를 성공적으로 조회했습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("월별 구매 요청 통계 조회 중 오류: year={}, month={}, error={}", year, month, e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "월별 구매 요청 통계 조회에 실패했습니다.");
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    /**
     * 월별 구매 주문 통계
     */
    @GetMapping("/stats/purchase-orders/monthly")
    public ResponseEntity<Map<String, Object>> getMonthlyPurchaseOrderStats(
            @RequestParam int year,
            @RequestParam int month) {
        try {
            log.info("월별 구매 주문 통계: year={}, month={}", year, month);
            
            Map<String, Object> stats = erpService.getMonthlyPurchaseOrderStats(year, month);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", stats);
            response.put("message", "월별 구매 주문 통계를 성공적으로 조회했습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("월별 구매 주문 통계 조회 중 오류: year={}, month={}, error={}", year, month, e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "월별 구매 주문 통계 조회에 실패했습니다.");
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    /**
     * 월별 예산 통계
     */
    @GetMapping("/stats/budgets/monthly")
    public ResponseEntity<Map<String, Object>> getMonthlyBudgetStats(
            @RequestParam String year,
            @RequestParam String month) {
        try {
            log.info("월별 예산 통계: year={}, month={}", year, month);
            
            Map<String, Object> stats = erpService.getMonthlyBudgetStats(year, month);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", stats);
            response.put("message", "월별 예산 통계를 성공적으로 조회했습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("월별 예산 통계 조회 중 오류: year={}, month={}, error={}", year, month, e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "월별 예산 통계 조회에 실패했습니다.");
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    /**
     * 상태별 구매 요청 통계
     */
    @GetMapping("/stats/purchase-requests/status")
    public ResponseEntity<Map<String, Object>> getPurchaseRequestStatsByStatus() {
        try {
            log.info("상태별 구매 요청 통계");
            
            Map<String, Object> stats = erpService.getPurchaseRequestStatsByStatus();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", stats);
            response.put("message", "상태별 구매 요청 통계를 성공적으로 조회했습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("상태별 구매 요청 통계 조회 중 오류: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "상태별 구매 요청 통계 조회에 실패했습니다.");
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    /**
     * 요청자별 구매 요청 통계
     */
    @GetMapping("/stats/purchase-requests/requester")
    public ResponseEntity<Map<String, Object>> getPurchaseRequestStatsByRequester() {
        try {
            log.info("요청자별 구매 요청 통계");
            
            Map<String, Object> stats = erpService.getPurchaseRequestStatsByRequester();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", stats);
            response.put("message", "요청자별 구매 요청 통계를 성공적으로 조회했습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("요청자별 구매 요청 통계 조회 중 오류: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "요청자별 구매 요청 통계 조회에 실패했습니다.");
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    /**
     * 공급업체별 구매 주문 통계
     */
    @GetMapping("/stats/purchase-orders/supplier")
    public ResponseEntity<Map<String, Object>> getPurchaseOrderStatsBySupplier() {
        try {
            log.info("공급업체별 구매 주문 통계");
            
            Map<String, Object> stats = erpService.getPurchaseOrderStatsBySupplier();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", stats);
            response.put("message", "공급업체별 구매 주문 통계를 성공적으로 조회했습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("공급업체별 구매 주문 통계 조회 중 오류: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "공급업체별 구매 주문 통계 조회에 실패했습니다.");
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    /**
     * 카테고리별 예산 통계
     */
    @GetMapping("/stats/budgets/category")
    public ResponseEntity<Map<String, Object>> getBudgetStatsByCategory() {
        try {
            log.info("카테고리별 예산 통계");
            
            Map<String, Object> stats = erpService.getBudgetStatsByCategory();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", stats);
            response.put("message", "카테고리별 예산 통계를 성공적으로 조회했습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("카테고리별 예산 통계 조회 중 오류: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "카테고리별 예산 통계 조회에 실패했습니다.");
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    /**
     * 예산 사용률이 높은 예산 목록
     */
    @GetMapping("/budgets/high-usage")
    public ResponseEntity<Map<String, Object>> getHighUsageBudgets() {
        try {
            log.info("예산 사용률이 높은 예산 목록 조회");
            
            List<Budget> budgets = erpService.getHighUsageBudgets();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", budgets);
            response.put("count", budgets.size());
            response.put("message", "예산 사용률이 높은 예산 목록을 성공적으로 조회했습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("예산 사용률이 높은 예산 목록 조회 중 오류: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "예산 사용률이 높은 예산 목록 조회에 실패했습니다.");
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    /**
     * 예산 부족 예산 목록
     */
    @GetMapping("/budgets/over-budget")
    public ResponseEntity<Map<String, Object>> getOverBudgetBudgets() {
        try {
            log.info("예산 부족 예산 목록 조회");
            
            List<Budget> budgets = erpService.getOverBudgetBudgets();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", budgets);
            response.put("count", budgets.size());
            response.put("message", "예산 부족 예산 목록을 성공적으로 조회했습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("예산 부족 예산 목록 조회 중 오류: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "예산 부족 예산 목록 조회에 실패했습니다.");
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
}

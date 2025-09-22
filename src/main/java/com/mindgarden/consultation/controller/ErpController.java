package com.mindgarden.consultation.controller;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.mindgarden.consultation.constant.UserRole;
import com.mindgarden.consultation.dto.FinancialTransactionRequest;
import com.mindgarden.consultation.dto.FinancialTransactionResponse;
import com.mindgarden.consultation.dto.ItemCreateRequest;
import com.mindgarden.consultation.dto.ItemUpdateRequest;
import com.mindgarden.consultation.entity.Budget;
import com.mindgarden.consultation.entity.Item;
import com.mindgarden.consultation.entity.PurchaseOrder;
import com.mindgarden.consultation.entity.PurchaseRequest;
import com.mindgarden.consultation.entity.RecurringExpense;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.service.CommonCodeService;
import com.mindgarden.consultation.service.DynamicPermissionService;
import com.mindgarden.consultation.service.ErpService;
import com.mindgarden.consultation.service.FinancialTransactionService;
import com.mindgarden.consultation.service.RecurringExpenseService;
import com.mindgarden.consultation.util.SecurityUtils;
import com.mindgarden.consultation.util.TaxCalculationUtil;
import com.mindgarden.consultation.utils.SessionUtils;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
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
import jakarta.servlet.http.HttpServletRequest;
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
    private final FinancialTransactionService financialTransactionService;
    private final RecurringExpenseService recurringExpenseService;
    private final CommonCodeService commonCodeService;
    private final DynamicPermissionService dynamicPermissionService;
    
    // ==================== Item Management ====================
    
    /**
     * 모든 활성화된 아이템 조회
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_SUPER_ADMIN', 'HQ_ADMIN', 'SUPER_HQ_ADMIN', 'HQ_MASTER')")
    @GetMapping("/items")
    public ResponseEntity<Map<String, Object>> getAllItems(HttpSession session) {
        try {
            log.info("모든 아이템 조회 요청");
            
            // 현재 로그인한 사용자의 지점코드 확인
            User currentUser = (User) session.getAttribute("user");
            String currentBranchCode = currentUser != null ? currentUser.getBranchCode() : null;
            log.info("🔍 현재 사용자 지점코드: {}", currentBranchCode);
            
            List<Item> allItems = erpService.getAllActiveItems();
            
            // 지점코드로 필터링 (branchCode가 null인 아이템은 모든 지점에서 사용 가능)
            List<Item> items = allItems.stream()
                .filter(item -> {
                    if (currentBranchCode == null || currentBranchCode.trim().isEmpty()) {
                        return true; // 지점코드가 없으면 모든 아이템 조회
                    }
                    // branchCode가 null이면 모든 지점에서 사용 가능
                    if (item.getBranchCode() == null || item.getBranchCode().trim().isEmpty()) {
                        return true;
                    }
                    return currentBranchCode.equals(item.getBranchCode());
                })
                .collect(java.util.stream.Collectors.toList());
            
            log.info("🔍 아이템 목록 조회 완료 - 전체: {}, 필터링 후: {}", allItems.size(), items.size());
            
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
            if (currentUser == null || (!currentUser.getRole().equals(UserRole.ADMIN) && !currentUser.getRole().equals(UserRole.HQ_MASTER))) {
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
            if (currentUser == null || (!currentUser.getRole().equals(UserRole.ADMIN) && !currentUser.getRole().equals(UserRole.HQ_MASTER))) {
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
            if (currentUser == null || !currentUser.getRole().equals(UserRole.HQ_MASTER)) {
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
            if (currentUser == null || (!currentUser.getRole().equals(UserRole.ADMIN) && !currentUser.getRole().equals(UserRole.HQ_MASTER))) {
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
    
    // ==================== 회계 시스템 통합 API ====================
    
    /**
     * 데이터 확인용 API (임시)
     */
    @GetMapping("/debug/transactions")
    public ResponseEntity<Map<String, Object>> debugTransactions(
            @RequestParam(required = false) String branchCode,
            HttpServletRequest request) {
        
        try {
            log.info("🔍 데이터 확인 API 호출: branchCode={}", branchCode);
            
            // 모든 거래 조회
            List<com.mindgarden.consultation.dto.FinancialTransactionResponse> allTransactions = 
                financialTransactionService.getTransactions(PageRequest.of(0, 100)).getContent();
            
            // 지점별 필터링
            List<com.mindgarden.consultation.dto.FinancialTransactionResponse> filteredTransactions = allTransactions;
            if (branchCode != null && !branchCode.isEmpty()) {
                filteredTransactions = allTransactions.stream()
                    .filter(t -> branchCode.equals(t.getBranchCode()))
                    .collect(java.util.stream.Collectors.toList());
            }
            
            // 카테고리별 집계
            Map<String, BigDecimal> categoryBreakdown = filteredTransactions.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                    t -> t.getCategory() != null ? t.getCategory() : "기타",
                    java.util.stream.Collectors.reducing(BigDecimal.ZERO, 
                        com.mindgarden.consultation.dto.FinancialTransactionResponse::getAmount, 
                        BigDecimal::add)
                ));
            
            Map<String, Object> result = new HashMap<>();
            result.put("totalTransactions", allTransactions.size());
            result.put("filteredTransactions", filteredTransactions.size());
            result.put("branchCode", branchCode);
            result.put("categoryBreakdown", categoryBreakdown);
            result.put("sampleTransactions", filteredTransactions.stream().limit(5).collect(java.util.stream.Collectors.toList()));
            
            log.info("🔍 데이터 확인 결과: 전체={}, 필터링={}, 카테고리={}", 
                allTransactions.size(), filteredTransactions.size(), categoryBreakdown.size());
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("❌ 데이터 확인 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "데이터 확인 실패: " + e.getMessage()));
        }
    }
    
    /**
     * 통합 재무 대시보드 데이터 조회 (수입/지출 통합)
     * 지점별 데이터 필터링 적용
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_SUPER_ADMIN', 'HQ_ADMIN', 'SUPER_HQ_ADMIN', 'HQ_MASTER')")
    @GetMapping("/finance/dashboard")
    public ResponseEntity<Map<String, Object>> getFinanceDashboard(
            @RequestParam(required = false) String branchCode,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            HttpSession session) {
        try {
            // ERP 접근 권한 확인 (공통 처리)
            ResponseEntity<Map<String, Object>> permissionCheck = SecurityUtils.checkPermission(
                session, UserRole.HQ_MASTER, UserRole.BRANCH_SUPER_ADMIN, UserRole.SUPER_HQ_ADMIN);
            if (permissionCheck != null) {
                return permissionCheck;
            }
            
            User currentUser = SessionUtils.getCurrentUser(session);
            
            log.info("재무 대시보드 데이터 조회 요청: 사용자={}, 사용자지점={}, 요청지점={}", 
                    currentUser.getEmail(), currentUser.getBranchCode(), branchCode);
            
            // 지점 선택 로직
            String targetBranchCode = branchCode;
            UserRole role = currentUser.getRole();
            
            // 본사 사용자 권한 확인
            boolean isHQUser = UserRole.HQ_MASTER.equals(role) || UserRole.SUPER_HQ_ADMIN.equals(role) || "HQ".equals(currentUser.getBranchCode());
            
            if (isHQUser) {
                // 본사 사용자: 요청된 지점 또는 통합 데이터 조회
                if (targetBranchCode == null || targetBranchCode.isEmpty()) {
                    // 지점 선택 안함: 통합 데이터 조회
                    log.info("📊 본사 사용자 - 통합 데이터 조회");
                    Map<String, Object> financeData = erpService.getIntegratedFinanceDashboard();
                    
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", true);
                    response.put("message", "통합 재무 대시보드 데이터를 성공적으로 조회했습니다.");
                    response.put("data", financeData);
                    response.put("branchCode", "HQ");
                    response.put("branchType", "integrated");
                    
                    return ResponseEntity.ok(response);
                } else {
                    // 특정 지점 선택: 해당 지점 데이터 조회
                    log.info("📍 본사 사용자 - 지점별 데이터 조회: {}", targetBranchCode);
                }
            } else {
                // 지점 사용자: 자기 지점 데이터만 조회 (요청 지점코드 무시)
                targetBranchCode = currentUser.getBranchCode();
                log.info("🏢 지점 사용자 - 자기 지점만 조회: {} (요청된 지점 {} 무시)", targetBranchCode, branchCode);
                
                if (targetBranchCode == null || targetBranchCode.isEmpty()) {
                    log.error("❌ 지점 사용자의 지점코드가 없음 - 세션 오류");
                    return ResponseEntity.status(401).body(Map.of(
                        "success", false,
                        "message", "세션이 만료되었습니다. 다시 로그인해주세요.",
                        "redirectToLogin", true
                    ));
                }
            }
            
            // 지점별 데이터 조회 (날짜 파라미터 전달)
            Map<String, Object> financeData;
            if (startDate != null && endDate != null) {
                LocalDate start = LocalDate.parse(startDate);
                LocalDate end = LocalDate.parse(endDate);
                financeData = erpService.getBranchFinanceDashboard(targetBranchCode, start, end);
                log.info("✅ 지점별 재무 대시보드 데이터 조회 완료: 지점={}, 기간={}~{}", targetBranchCode, startDate, endDate);
            } else {
                financeData = erpService.getBranchFinanceDashboard(targetBranchCode);
                log.info("✅ 지점별 재무 대시보드 데이터 조회 완료: 지점={} (전체 기간)", targetBranchCode);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "재무 대시보드 데이터를 성공적으로 조회했습니다.");
            response.put("data", financeData);
            response.put("branchCode", targetBranchCode);
            response.put("branchType", "branch");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("재무 대시보드 데이터 조회 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "재무 데이터 조회 중 오류가 발생했습니다."));
        }
    }
    
    /**
     * 수입/지출 통계 조회
     */
    @GetMapping("/finance/statistics")
    public ResponseEntity<Map<String, Object>> getFinanceStatistics(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String branchCode,
            HttpSession session) {
        try {
            // 비용처리 권한 확인 (어드민, 지점 수퍼 관리자, HQ 마스터 허용)
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null || (!UserRole.ADMIN.equals(currentUser.getRole()) &&
                !UserRole.HQ_MASTER.equals(currentUser.getRole()) && 
                !UserRole.BRANCH_SUPER_ADMIN.equals(currentUser.getRole()) && 
                !UserRole.SUPER_HQ_ADMIN.equals(currentUser.getRole()))) {
                log.warn("❌ 비용처리 접근 권한 없음: 현재 역할={}", currentUser != null ? currentUser.getRole() : "null");
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "비용처리는 관리자 권한이 필요합니다."));
            }
            
            // 지점코드 결정
            String targetBranchCode = branchCode;
            UserRole role = currentUser.getRole();
            
            if (role != UserRole.HQ_MASTER && role != UserRole.SUPER_HQ_ADMIN) {
                // 일반 관리자는 자신의 지점 데이터만 조회 가능
                targetBranchCode = currentUser.getBranchCode();
                log.info("📍 지점 관리자 권한: 자동으로 지점코드 설정 = {}", targetBranchCode);
            }
            
            log.info("수입/지출 통계 조회 요청: {} ~ {}, 지점={}", startDate, endDate, targetBranchCode);
            
            Map<String, Object> statistics = erpService.getBranchFinanceStatistics(targetBranchCode, startDate, endDate);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "수입/지출 통계를 성공적으로 조회했습니다.");
            response.put("data", statistics);
            response.put("branchCode", targetBranchCode);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("수입/지출 통계 조회 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "통계 조회 중 오류가 발생했습니다."));
        }
    }
    
    /**
     * 카테고리별 수입/지출 분석
     */
    @GetMapping("/finance/category-analysis")
    public ResponseEntity<Map<String, Object>> getCategoryAnalysis(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            HttpSession session) {
        try {
            // 관리자 권한 확인 (HQ_MASTER, BRANCH_SUPER_ADMIN, SUPER_HQ_ADMIN 허용)
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null || (!UserRole.HQ_MASTER.equals(currentUser.getRole()) && 
                !UserRole.BRANCH_SUPER_ADMIN.equals(currentUser.getRole()) && 
                !UserRole.SUPER_HQ_ADMIN.equals(currentUser.getRole()))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "관리자 권한이 필요합니다."));
            }
            
            log.info("카테고리별 분석 조회 요청: {} ~ {}", startDate, endDate);
            
            Map<String, Object> analysis = erpService.getCategoryAnalysis(startDate, endDate);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "카테고리별 분석을 성공적으로 조회했습니다.");
            response.put("data", analysis);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("카테고리별 분석 조회 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "분석 조회 중 오류가 발생했습니다."));
        }
    }
    
    /**
     * 일간 재무 리포트 조회
     */
    @GetMapping("/finance/daily-report")
    public ResponseEntity<Map<String, Object>> getDailyFinanceReport(
            @RequestParam(required = false) String reportDate,
            HttpSession session) {
        try {
            // 관리자 권한 확인 (HQ_MASTER, BRANCH_SUPER_ADMIN, SUPER_HQ_ADMIN 허용)
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null || (!UserRole.HQ_MASTER.equals(currentUser.getRole()) && 
                !UserRole.BRANCH_SUPER_ADMIN.equals(currentUser.getRole()) && 
                !UserRole.SUPER_HQ_ADMIN.equals(currentUser.getRole()))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "관리자 권한이 필요합니다."));
            }
            
            log.info("일간 재무 리포트 조회 요청: {}", reportDate);
            
            // 기본값으로 오늘 날짜 사용
            if (reportDate == null) {
                reportDate = java.time.LocalDate.now().toString();
            }
            
            Map<String, Object> dailyReport = erpService.getDailyFinanceReport(reportDate);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "일간 재무 리포트를 성공적으로 조회했습니다.");
            response.put("data", dailyReport);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("일간 재무 리포트 조회 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "일간 리포트 조회 중 오류가 발생했습니다."));
        }
    }
    
    /**
     * 월간 재무 리포트 조회
     */
    @GetMapping("/finance/monthly-report")
    public ResponseEntity<Map<String, Object>> getMonthlyFinanceReport(
            @RequestParam(required = false) String year,
            @RequestParam(required = false) String month,
            HttpSession session) {
        try {
            // 관리자 권한 확인 (HQ_MASTER, BRANCH_SUPER_ADMIN, SUPER_HQ_ADMIN 허용)
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null || (!UserRole.HQ_MASTER.equals(currentUser.getRole()) && 
                !UserRole.BRANCH_SUPER_ADMIN.equals(currentUser.getRole()) && 
                !UserRole.SUPER_HQ_ADMIN.equals(currentUser.getRole()))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "관리자 권한이 필요합니다."));
            }
            
            log.info("월간 재무 리포트 조회 요청: {}-{}", year, month);
            
            // 기본값으로 현재 년월 사용
            if (year == null) {
                year = String.valueOf(java.time.LocalDate.now().getYear());
            }
            if (month == null) {
                month = String.valueOf(java.time.LocalDate.now().getMonthValue());
            }
            
            Map<String, Object> monthlyReport = erpService.getMonthlyFinanceReport(year, month);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "월간 재무 리포트를 성공적으로 조회했습니다.");
            response.put("data", monthlyReport);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("월간 재무 리포트 조회 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "월간 리포트 조회 중 오류가 발생했습니다."));
        }
    }
    
    /**
     * 년간 재무 리포트 조회
     */
    @GetMapping("/finance/yearly-report")
    public ResponseEntity<Map<String, Object>> getYearlyFinanceReport(
            @RequestParam(required = false) String year,
            HttpSession session) {
        try {
            // 관리자 권한 확인 (HQ_MASTER, BRANCH_SUPER_ADMIN, SUPER_HQ_ADMIN 허용)
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null || (!UserRole.HQ_MASTER.equals(currentUser.getRole()) && 
                !UserRole.BRANCH_SUPER_ADMIN.equals(currentUser.getRole()) && 
                !UserRole.SUPER_HQ_ADMIN.equals(currentUser.getRole()))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "관리자 권한이 필요합니다."));
            }
            
            log.info("년간 재무 리포트 조회 요청: {}", year);
            
            // 기본값으로 현재 년도 사용
            if (year == null) {
                year = String.valueOf(java.time.LocalDate.now().getYear());
            }
            
            Map<String, Object> yearlyReport = erpService.getYearlyFinanceReport(year);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "년간 재무 리포트를 성공적으로 조회했습니다.");
            response.put("data", yearlyReport);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("년간 재무 리포트 조회 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "년간 리포트 조회 중 오류가 발생했습니다."));
        }
    }
    
    /**
     * 대차대조표 조회
     */
    @GetMapping("/finance/balance-sheet")
    public ResponseEntity<Map<String, Object>> getBalanceSheet(
            @RequestParam(required = false) String reportDate,
            @RequestParam(required = false) String branchCode,
            HttpSession session) {
        try {
            // 관리자 권한 확인 (HQ_MASTER, BRANCH_SUPER_ADMIN, SUPER_HQ_ADMIN 허용)
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null || (!UserRole.HQ_MASTER.equals(currentUser.getRole()) && 
                !UserRole.BRANCH_SUPER_ADMIN.equals(currentUser.getRole()) && 
                !UserRole.SUPER_HQ_ADMIN.equals(currentUser.getRole()))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "관리자 권한이 필요합니다."));
            }
            
            // 브랜치 코드 결정
            String targetBranchCode = null;
            if (UserRole.HQ_MASTER.equals(currentUser.getRole()) || UserRole.SUPER_HQ_ADMIN.equals(currentUser.getRole())) {
                // HQ 사용자는 요청된 브랜치 코드 사용 (없으면 전체)
                targetBranchCode = branchCode;
            } else {
                // 지점 관리자는 자신의 브랜치만 조회
                targetBranchCode = currentUser.getBranchCode();
                if (targetBranchCode == null || targetBranchCode.isEmpty()) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("success", false, "message", "지점 코드가 없습니다.", "redirectToLogin", true));
                }
            }
            
            log.info("대차대조표 조회 요청: {}, 브랜치: {}", reportDate, targetBranchCode);
            
            Map<String, Object> balanceSheet = erpService.getBalanceSheet(reportDate, targetBranchCode);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "대차대조표를 성공적으로 조회했습니다.");
            response.put("data", balanceSheet);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("대차대조표 조회 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "대차대조표 조회 중 오류가 발생했습니다."));
        }
    }
    
    /**
     * 손익계산서 조회
     */
    @GetMapping("/finance/income-statement")
    public ResponseEntity<Map<String, Object>> getIncomeStatement(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String branchCode,
            HttpSession session) {
        try {
            // 관리자 권한 확인 (HQ_MASTER, BRANCH_SUPER_ADMIN, SUPER_HQ_ADMIN 허용)
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null || (!UserRole.HQ_MASTER.equals(currentUser.getRole()) && 
                !UserRole.BRANCH_SUPER_ADMIN.equals(currentUser.getRole()) && 
                !UserRole.SUPER_HQ_ADMIN.equals(currentUser.getRole()))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "관리자 권한이 필요합니다."));
            }
            
            // 브랜치 코드 결정
            String targetBranchCode = null;
            if (UserRole.HQ_MASTER.equals(currentUser.getRole()) || UserRole.SUPER_HQ_ADMIN.equals(currentUser.getRole())) {
                // HQ 사용자는 요청된 브랜치 코드 사용 (없으면 전체)
                targetBranchCode = branchCode;
            } else {
                // 지점 관리자는 자신의 브랜치만 조회
                targetBranchCode = currentUser.getBranchCode();
                if (targetBranchCode == null || targetBranchCode.isEmpty()) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("success", false, "message", "지점 코드가 없습니다.", "redirectToLogin", true));
                }
            }
            
            log.info("손익계산서 조회 요청: {} ~ {}, 브랜치: {}", startDate, endDate, targetBranchCode);
            
            Map<String, Object> incomeStatement = erpService.getIncomeStatement(startDate, endDate, targetBranchCode);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "손익계산서를 성공적으로 조회했습니다.");
            response.put("data", incomeStatement);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("손익계산서 조회 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "손익계산서 조회 중 오류가 발생했습니다."));
        }
    }

    // ==================== 수입/지출 직접 등록 ====================
    
    /**
     * 수입/지출 거래 등록
     */
    @PostMapping("/finance/transactions")
    public ResponseEntity<Map<String, Object>> createFinancialTransaction(
            @Valid @RequestBody FinancialTransactionRequest request,
            HttpSession session) {
        try {
            // 비용처리 권한 확인 (어드민, 지점 수퍼 관리자, HQ 마스터 허용)
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null || 
                (!UserRole.ADMIN.equals(currentUser.getRole()) &&
                 !UserRole.HQ_MASTER.equals(currentUser.getRole()) && 
                 !UserRole.BRANCH_SUPER_ADMIN.equals(currentUser.getRole()) &&
                 !UserRole.SUPER_HQ_ADMIN.equals(currentUser.getRole()))) {
                log.warn("❌ 비용처리 접근 권한 없음: 현재 역할={}", currentUser != null ? currentUser.getRole() : "null");
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "비용처리는 관리자 권한이 필요합니다."));
            }
            
            // 지점코드 자동 설정
            if (request.getBranchCode() == null || request.getBranchCode().isEmpty()) {
                request.setBranchCode(currentUser.getBranchCode());
            }
            
            log.info("수입/지출 거래 등록 요청: 사용자={}, 지점={}, 거래={}", 
                    currentUser.getEmail(), currentUser.getBranchCode(), request);
            
            FinancialTransactionResponse response = financialTransactionService.createTransaction(request, currentUser);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "거래가 성공적으로 등록되었습니다.");
            result.put("data", response);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("수입/지출 거래 등록 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "거래 등록 중 오류가 발생했습니다."));
        }
    }
    
    /**
     * 모든 수입/지출 거래 조회 (지점별 필터링 적용)
     */
    @GetMapping("/finance/transactions")
    public ResponseEntity<Map<String, Object>> getAllFinancialTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String branchCode,
            @RequestParam(required = false) String transactionType,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            HttpSession session) {
        try {
            // 비용처리 권한 확인 (어드민, 지점 수퍼 관리자, HQ 마스터 허용)
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null || (!UserRole.ADMIN.equals(currentUser.getRole()) &&
                !UserRole.HQ_MASTER.equals(currentUser.getRole()) && 
                !UserRole.BRANCH_SUPER_ADMIN.equals(currentUser.getRole()) && 
                !UserRole.SUPER_HQ_ADMIN.equals(currentUser.getRole()))) {
                log.warn("❌ 비용처리 접근 권한 없음: 현재 역할={}", currentUser != null ? currentUser.getRole() : "null");
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "비용처리는 관리자 권한이 필요합니다."));
            }
            
            // 지점코드 결정: HQ_MASTER는 모든 지점, 나머지는 자신의 지점만
            String targetBranchCode = branchCode;
            UserRole role = currentUser.getRole();
            
            if (role != UserRole.HQ_MASTER && role != UserRole.SUPER_HQ_ADMIN) {
                // 일반 관리자는 자신의 지점 데이터만 조회 가능
                targetBranchCode = currentUser.getBranchCode();
                log.info("📍 지점 관리자 권한: 자동으로 지점코드 설정 = {}", targetBranchCode);
            }
            
            log.info("수입/지출 거래 목록 조회 요청: 지점={}", targetBranchCode);
            
            Page<FinancialTransactionResponse> transactionPage = financialTransactionService.getTransactionsByBranch(
                targetBranchCode, transactionType, category, startDate, endDate,
                PageRequest.of(page, size)
            );
            List<FinancialTransactionResponse> transactions = transactionPage.getContent();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "거래 목록을 성공적으로 조회했습니다.");
            response.put("data", transactions);
            response.put("branchCode", targetBranchCode);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("수입/지출 거래 목록 조회 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "거래 목록 조회 중 오류가 발생했습니다."));
        }
    }
    
    /**
     * 빠른 지출 등록 (급여, 임대료, 관리비, 세금 등)
     */
    @PostMapping("/finance/quick-expense")
    public ResponseEntity<Map<String, Object>> createQuickExpense(
            @RequestParam String category,
            @RequestParam String subcategory,
            @RequestParam java.math.BigDecimal amount,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String transactionDate,
            HttpSession session) {
        try {
            // 비용처리 권한 확인 (어드민, 지점 수퍼 관리자, HQ 마스터 허용)
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null || (!UserRole.ADMIN.equals(currentUser.getRole()) &&
                !UserRole.HQ_MASTER.equals(currentUser.getRole()) && 
                !UserRole.BRANCH_SUPER_ADMIN.equals(currentUser.getRole()) && 
                !UserRole.SUPER_HQ_ADMIN.equals(currentUser.getRole()))) {
                log.warn("❌ 비용처리 접근 권한 없음: 현재 역할={}", currentUser != null ? currentUser.getRole() : "null");
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "비용처리는 관리자 권한이 필요합니다."));
            }
            
            log.info("빠른 지출 등록 요청: category={}, amount={}, 지점={}", category, amount, currentUser.getBranchCode());
            
            // 부가세 적용 여부 확인 및 계산
            boolean isVatApplicable = TaxCalculationUtil.isVatApplicable(category);
            TaxCalculationUtil.TaxCalculationResult taxResult;
            
            if (isVatApplicable) {
                // 부가세 적용: 입력 금액은 부가세 제외 금액으로 간주
                taxResult = TaxCalculationUtil.calculateTaxForExpense(amount);
            } else {
                // 부가세 미적용: 급여 등
                taxResult = new TaxCalculationUtil.TaxCalculationResult(amount, amount, BigDecimal.ZERO);
            }
            
            FinancialTransactionRequest request = FinancialTransactionRequest.builder()
                    .transactionType("EXPENSE")
                    .category(category)
                    .subcategory(subcategory)
                    .amount(taxResult.getAmountIncludingTax()) // 부가세 포함 금액
                    .amountBeforeTax(taxResult.getAmountExcludingTax()) // 부가세 제외 금액
                    .taxAmount(taxResult.getVatAmount()) // 부가세 금액
                    .description(description != null ? description : category + " 지출")
                    .transactionDate(transactionDate != null ? java.time.LocalDate.parse(transactionDate) : java.time.LocalDate.now())
                    .taxIncluded(isVatApplicable)
                    .branchCode(currentUser.getBranchCode()) // 지점코드 자동 설정
                    .build();
            
            FinancialTransactionResponse response = financialTransactionService.createTransaction(request, currentUser);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", category + " 지출이 성공적으로 등록되었습니다.");
            result.put("data", response);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("빠른 지출 등록 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "지출 등록 중 오류가 발생했습니다."));
        }
    }
    
    /**
     * 빠른 수입 등록 (상담료, 기타수입 등)
     */
    @PostMapping("/finance/quick-income")
    public ResponseEntity<Map<String, Object>> createQuickIncome(
            @RequestParam String category,
            @RequestParam String subcategory,
            @RequestParam java.math.BigDecimal amount,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String transactionDate,
            HttpSession session) {
        try {
            // 비용처리 권한 확인 (어드민, 지점 수퍼 관리자, HQ 마스터 허용)
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null || (!UserRole.ADMIN.equals(currentUser.getRole()) &&
                !UserRole.HQ_MASTER.equals(currentUser.getRole()) && 
                !UserRole.BRANCH_SUPER_ADMIN.equals(currentUser.getRole()) && 
                !UserRole.SUPER_HQ_ADMIN.equals(currentUser.getRole()))) {
                log.warn("❌ 비용처리 접근 권한 없음: 현재 역할={}", currentUser != null ? currentUser.getRole() : "null");
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "비용처리는 관리자 권한이 필요합니다."));
            }
            
            log.info("빠른 수입 등록 요청: category={}, amount={}, 지점={}", category, amount, currentUser.getBranchCode());
            
            // 수입은 항상 부가세 포함 (내담자가 결제한 금액)
            TaxCalculationUtil.TaxCalculationResult taxResult = TaxCalculationUtil.calculateTaxFromPayment(amount);
            
            FinancialTransactionRequest request = FinancialTransactionRequest.builder()
                    .transactionType("INCOME")
                    .category(category)
                    .subcategory(subcategory)
                    .amount(taxResult.getAmountIncludingTax()) // 부가세 포함 금액
                    .amountBeforeTax(taxResult.getAmountExcludingTax()) // 부가세 제외 금액
                    .taxAmount(taxResult.getVatAmount()) // 부가세 금액
                    .description(description != null ? description : category + " 수입")
                    .transactionDate(transactionDate != null ? java.time.LocalDate.parse(transactionDate) : java.time.LocalDate.now())
                    .taxIncluded(true) // 수입은 항상 부가세 포함
                    .branchCode(currentUser.getBranchCode()) // 지점코드 자동 설정
                    .build();
            
            FinancialTransactionResponse response = financialTransactionService.createTransaction(request, currentUser);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", category + " 수입이 성공적으로 등록되었습니다.");
            result.put("data", response);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("빠른 수입 등록 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "수입 등록 중 오류가 발생했습니다."));
        }
    }
    
    // ==================== 반복 지출 관리 ====================
    
    /**
     * 반복 지출 생성
     */
    @PostMapping("/recurring-expenses")
    public ResponseEntity<?> createRecurringExpense(@RequestBody RecurringExpense recurringExpense, HttpServletRequest request) {
        try {
            log.info("반복 지출 생성 요청: {}", recurringExpense.getExpenseName());
            
            User currentUser = SessionUtils.getCurrentUser(request.getSession());
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "로그인이 필요합니다."));
            }
            
            recurringExpense.setCreatedBy(currentUser.getName());
            recurringExpense.setUpdatedBy(currentUser.getName());
            
            RecurringExpense createdExpense = recurringExpenseService.createRecurringExpense(recurringExpense);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "반복 지출이 성공적으로 생성되었습니다.");
            response.put("data", createdExpense);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("반복 지출 생성 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "반복 지출 생성에 실패했습니다: " + e.getMessage()));
        }
    }
    
    /**
     * 모든 활성 반복 지출 조회
     */
    @GetMapping("/recurring-expenses")
    public ResponseEntity<?> getAllRecurringExpenses() {
        try {
            log.info("모든 반복 지출 조회");
            
            List<RecurringExpense> expenses = recurringExpenseService.getAllActiveRecurringExpenses();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", expenses);
            response.put("total", expenses.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("반복 지출 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "반복 지출 조회에 실패했습니다: " + e.getMessage()));
        }
    }
    
    /**
     * 반복 지출 수정
     */
    @PutMapping("/recurring-expenses/{id}")
    public ResponseEntity<?> updateRecurringExpense(@PathVariable Long id, @RequestBody RecurringExpense recurringExpense, HttpServletRequest request) {
        try {
            log.info("반복 지출 수정 요청: id={}", id);
            
            User currentUser = SessionUtils.getCurrentUser(request.getSession());
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "로그인이 필요합니다."));
            }
            
            recurringExpense.setUpdatedBy(currentUser.getName());
            RecurringExpense updatedExpense = recurringExpenseService.updateRecurringExpense(id, recurringExpense);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "반복 지출이 성공적으로 수정되었습니다.");
            response.put("data", updatedExpense);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("반복 지출 수정 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "반복 지출 수정에 실패했습니다: " + e.getMessage()));
        }
    }
    
    /**
     * 반복 지출 삭제 (비활성화)
     */
    @DeleteMapping("/recurring-expenses/{id}")
    public ResponseEntity<?> deleteRecurringExpense(@PathVariable Long id) {
        try {
            log.info("반복 지출 삭제 요청: id={}", id);
            
            boolean deleted = recurringExpenseService.deleteRecurringExpense(id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", deleted);
            response.put("message", deleted ? "반복 지출이 성공적으로 삭제되었습니다." : "반복 지출 삭제에 실패했습니다.");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("반복 지출 삭제 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "반복 지출 삭제에 실패했습니다: " + e.getMessage()));
        }
    }
    
    /**
     * 반복 지출 수동 처리
     */
    @PostMapping("/recurring-expenses/{id}/process")
    public ResponseEntity<?> processRecurringExpense(@PathVariable Long id, @RequestParam(required = false) BigDecimal customAmount) {
        try {
            log.info("반복 지출 수동 처리 요청: id={}, 금액={}", id, customAmount);
            
            recurringExpenseService.processRecurringExpense(id, customAmount);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "반복 지출이 성공적으로 처리되었습니다.");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("반복 지출 처리 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "반복 지출 처리에 실패했습니다: " + e.getMessage()));
        }
    }
    
    /**
     * 반복 지출 현황 조회
     */
    @GetMapping("/recurring-expenses/status")
    public ResponseEntity<?> getRecurringExpenseStatus() {
        try {
            log.info("반복 지출 현황 조회");
            
            Map<String, Object> status = recurringExpenseService.getRecurringExpenseStatus();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", status);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("반복 지출 현황 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "반복 지출 현황 조회에 실패했습니다: " + e.getMessage()));
        }
    }
    
    /**
     * 월별 반복 지출 예상 금액 조회
     */
    @GetMapping("/recurring-expenses/forecast")
    public ResponseEntity<?> getMonthlyRecurringExpenseForecast() {
        try {
            log.info("월별 반복 지출 예상 금액 조회");
            
            Map<String, Object> forecast = recurringExpenseService.getMonthlyRecurringExpenseForecast();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", forecast);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("월별 반복 지출 예상 금액 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "월별 반복 지출 예상 금액 조회에 실패했습니다: " + e.getMessage()));
        }
    }
    
    // ==================== 공통 코드 관리 ====================
    
    /**
     * 재무 거래 관련 공통 코드 조회
     */
    @GetMapping("/common-codes/financial")
    public ResponseEntity<?> getFinancialCommonCodes() {
        try {
            log.info("재무 거래 관련 공통 코드 조회");
            
            Map<String, Object> financialCodes = new HashMap<>();
            
            // 거래 유형
            financialCodes.put("transactionTypes", commonCodeService.getActiveCodesByGroup("TRANSACTION_TYPE"));
            
            // 수입 카테고리
            financialCodes.put("incomeCategories", commonCodeService.getActiveCodesByGroup("INCOME_CATEGORY"));
            
            // 지출 카테고리
            financialCodes.put("expenseCategories", commonCodeService.getActiveCodesByGroup("EXPENSE_CATEGORY"));
            
            // 수입 세부 항목
            financialCodes.put("incomeSubcategories", commonCodeService.getActiveCodesByGroup("INCOME_SUBCATEGORY"));
            
            // 지출 세부 항목
            financialCodes.put("expenseSubcategories", commonCodeService.getActiveCodesByGroup("EXPENSE_SUBCATEGORY"));
            
            // 부가세 적용 여부
            financialCodes.put("vatCategories", commonCodeService.getActiveCodesByGroup("VAT_APPLICABLE"));
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", financialCodes);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("재무 거래 관련 공통 코드 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "공통 코드 조회에 실패했습니다: " + e.getMessage()));
        }
    }
    
    /**
     * 특정 코드 그룹의 공통 코드 조회
     */
    @GetMapping("/common-codes/{codeGroup}")
    public ResponseEntity<?> getCommonCodesByGroup(@PathVariable String codeGroup) {
        try {
            log.info("공통 코드 조회: codeGroup={}", codeGroup);
            
            List<Map<String, Object>> codes = commonCodeService.getActiveCodesByGroup(codeGroup);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", codes);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("공통 코드 조회 실패: codeGroup={}, error={}", codeGroup, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "공통 코드 조회에 실패했습니다: " + e.getMessage()));
        }
    }
}

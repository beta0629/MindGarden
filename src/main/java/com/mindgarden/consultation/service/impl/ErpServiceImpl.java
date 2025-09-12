package com.mindgarden.consultation.service.impl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.mindgarden.consultation.dto.FinancialTransactionRequest;
import com.mindgarden.consultation.dto.FinancialTransactionResponse;
import com.mindgarden.consultation.entity.Budget;
import com.mindgarden.consultation.entity.Item;
import com.mindgarden.consultation.entity.PurchaseOrder;
import com.mindgarden.consultation.entity.PurchaseRequest;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.repository.BudgetRepository;
import com.mindgarden.consultation.repository.ItemRepository;
import com.mindgarden.consultation.repository.PurchaseOrderRepository;
import com.mindgarden.consultation.repository.PurchaseRequestRepository;
import com.mindgarden.consultation.service.CommonCodeService;
import com.mindgarden.consultation.service.ErpService;
import com.mindgarden.consultation.service.FinancialTransactionService;
import com.mindgarden.consultation.service.UserService;
import com.mindgarden.consultation.util.TaxCalculationUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * ERP 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ErpServiceImpl implements ErpService {
    
    private final ItemRepository itemRepository;
    private final PurchaseRequestRepository purchaseRequestRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final BudgetRepository budgetRepository;
    private final UserService userService;
    private final FinancialTransactionService financialTransactionService;
    private final CommonCodeService commonCodeService;
    
    // ==================== Item Management ====================
    
    @Override
    @Transactional(readOnly = true)
    public List<Item> getAllActiveItems() {
        log.info("모든 활성화된 아이템 조회");
        return itemRepository.findAllActive();
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<Item> getItemById(Long id) {
        log.info("아이템 조회: id={}", id);
        return itemRepository.findActiveById(id);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Item> getItemsByCategory(String category) {
        log.info("카테고리별 아이템 조회: category={}", category);
        return itemRepository.findByCategoryAndActive(category);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Item> searchItemsByName(String name) {
        log.info("이름으로 아이템 검색: name={}", name);
        return itemRepository.findByNameContainingAndActive(name);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Item> getLowStockItems(Integer threshold) {
        log.info("재고 부족 아이템 조회: threshold={}", threshold);
        return itemRepository.findLowStockItems(threshold);
    }
    
    @Override
    public Item createItem(Item item) {
        log.info("아이템 생성: name={}", item.getName());
        return itemRepository.save(item);
    }
    
    @Override
    public Item updateItem(Long id, Item item) {
        log.info("아이템 수정: id={}", id);
        Item existingItem = itemRepository.findActiveById(id)
                .orElseThrow(() -> new RuntimeException("아이템을 찾을 수 없습니다: " + id));
        
        existingItem.setName(item.getName());
        existingItem.setDescription(item.getDescription());
        existingItem.setUnitPrice(item.getUnitPrice());
        existingItem.setStockQuantity(item.getStockQuantity());
        existingItem.setCategory(item.getCategory());
        existingItem.setSupplier(item.getSupplier());
        existingItem.setUnit(item.getUnit());
        existingItem.setIsActive(item.getIsActive());
        
        return itemRepository.save(existingItem);
    }
    
    @Override
    public boolean deleteItem(Long id) {
        log.info("아이템 삭제: id={}", id);
        Item item = itemRepository.findActiveById(id)
                .orElseThrow(() -> new RuntimeException("아이템을 찾을 수 없습니다: " + id));
        
        item.setIsDeleted(true);
        item.setDeletedAt(LocalDateTime.now());
        itemRepository.save(item);
        
        return true;
    }
    
    @Override
    public boolean updateItemStock(Long id, Integer quantity) {
        log.info("아이템 재고 업데이트: id={}, quantity={}", id, quantity);
        Item item = itemRepository.findActiveById(id)
                .orElseThrow(() -> new RuntimeException("아이템을 찾을 수 없습니다: " + id));
        
        item.setStockQuantity(quantity);
        itemRepository.save(item);
        
        return true;
    }
    
    // ==================== Purchase Request Management ====================
    
    @Override
    public PurchaseRequest createPurchaseRequest(Long requesterId, Long itemId, Integer quantity, String reason) {
        log.info("구매 요청 생성: requesterId={}, itemId={}, quantity={}", requesterId, itemId, quantity);
        
        User requester = userService.findActiveById(requesterId)
                .orElseThrow(() -> new RuntimeException("요청자를 찾을 수 없습니다: " + requesterId));
        
        Item item = itemRepository.findActiveById(itemId)
                .orElseThrow(() -> new RuntimeException("아이템을 찾을 수 없습니다: " + itemId));
        
        BigDecimal totalAmount = item.getUnitPrice().multiply(BigDecimal.valueOf(quantity));
        
        PurchaseRequest purchaseRequest = PurchaseRequest.builder()
                .requester(requester)
                .item(item)
                .quantity(quantity)
                .unitPrice(item.getUnitPrice())
                .totalAmount(totalAmount)
                .reason(reason)
                .status(PurchaseRequest.PurchaseRequestStatus.PENDING)
                .build();
        
        return purchaseRequestRepository.save(purchaseRequest);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<PurchaseRequest> getPurchaseRequestById(Long id) {
        log.info("구매 요청 조회: id={}", id);
        return purchaseRequestRepository.findByIdWithDetails(id);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<PurchaseRequest> getAllActivePurchaseRequests() {
        log.info("모든 활성화된 구매 요청 조회");
        return purchaseRequestRepository.findAllActive();
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<PurchaseRequest> getPurchaseRequestsByRequester(Long requesterId) {
        log.info("요청자별 구매 요청 목록 조회: requesterId={}", requesterId);
        return purchaseRequestRepository.findByRequesterId(requesterId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<PurchaseRequest> getPendingAdminApproval() {
        log.info("관리자 승인 대기 목록 조회");
        return purchaseRequestRepository.findPendingAdminApproval();
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<PurchaseRequest> getPendingSuperAdminApproval() {
        log.info("수퍼 관리자 승인 대기 목록 조회");
        return purchaseRequestRepository.findPendingSuperAdminApproval();
    }
    
    @Override
    public boolean approveByAdmin(Long requestId, Long adminId, String comment) {
        log.info("관리자 승인: requestId={}, adminId={}", requestId, adminId);
        
        PurchaseRequest request = purchaseRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("구매 요청을 찾을 수 없습니다: " + requestId));
        
        User admin = userService.findActiveById(adminId)
                .orElseThrow(() -> new RuntimeException("관리자를 찾을 수 없습니다: " + adminId));
        
        if (request.getStatus() != PurchaseRequest.PurchaseRequestStatus.PENDING) {
            throw new RuntimeException("승인할 수 없는 상태입니다: " + request.getStatus());
        }
        
        request.setStatus(PurchaseRequest.PurchaseRequestStatus.ADMIN_APPROVED);
        request.setAdminApprover(admin);
        request.setAdminApprovedAt(LocalDateTime.now());
        request.setAdminComment(comment);
        
        purchaseRequestRepository.save(request);
        
        return true;
    }
    
    @Override
    public boolean rejectByAdmin(Long requestId, Long adminId, String comment) {
        log.info("관리자 거부: requestId={}, adminId={}", requestId, adminId);
        
        PurchaseRequest request = purchaseRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("구매 요청을 찾을 수 없습니다: " + requestId));
        
        User admin = userService.findActiveById(adminId)
                .orElseThrow(() -> new RuntimeException("관리자를 찾을 수 없습니다: " + adminId));
        
        if (request.getStatus() != PurchaseRequest.PurchaseRequestStatus.PENDING) {
            throw new RuntimeException("거부할 수 없는 상태입니다: " + request.getStatus());
        }
        
        request.setStatus(PurchaseRequest.PurchaseRequestStatus.ADMIN_REJECTED);
        request.setAdminApprover(admin);
        request.setAdminApprovedAt(LocalDateTime.now());
        request.setAdminComment(comment);
        
        purchaseRequestRepository.save(request);
        
        return true;
    }
    
    @Override
    public boolean approveBySuperAdmin(Long requestId, Long superAdminId, String comment) {
        log.info("수퍼 관리자 승인: requestId={}, superAdminId={}", requestId, superAdminId);
        
        PurchaseRequest request = purchaseRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("구매 요청을 찾을 수 없습니다: " + requestId));
        
        User superAdmin = userService.findActiveById(superAdminId)
                .orElseThrow(() -> new RuntimeException("수퍼 관리자를 찾을 수 없습니다: " + superAdminId));
        
        if (request.getStatus() != PurchaseRequest.PurchaseRequestStatus.ADMIN_APPROVED) {
            throw new RuntimeException("승인할 수 없는 상태입니다: " + request.getStatus());
        }
        
        request.setStatus(PurchaseRequest.PurchaseRequestStatus.HQ_MASTER_APPROVED);
        request.setSuperAdminApprover(superAdmin);
        request.setSuperAdminApprovedAt(LocalDateTime.now());
        request.setSuperAdminComment(comment);
        
        PurchaseRequest savedRequest = purchaseRequestRepository.save(request);
        
        // 구매 요청 승인 시 자동으로 지출 거래 생성
        try {
            createPurchaseExpenseTransaction(savedRequest);
            log.info("💚 구매 지출 거래 자동 생성 완료: RequestID={}, Amount={}", 
                savedRequest.getId(), savedRequest.getTotalAmount());
        } catch (Exception e) {
            log.error("구매 지출 거래 자동 생성 실패: {}", e.getMessage(), e);
            // 거래 생성 실패해도 구매 승인은 완료
        }
        
        return true;
    }
    
    @Override
    public boolean rejectBySuperAdmin(Long requestId, Long superAdminId, String comment) {
        log.info("수퍼 관리자 거부: requestId={}, superAdminId={}", requestId, superAdminId);
        
        PurchaseRequest request = purchaseRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("구매 요청을 찾을 수 없습니다: " + requestId));
        
        User superAdmin = userService.findActiveById(superAdminId)
                .orElseThrow(() -> new RuntimeException("수퍼 관리자를 찾을 수 없습니다: " + superAdminId));
        
        if (request.getStatus() != PurchaseRequest.PurchaseRequestStatus.ADMIN_APPROVED) {
            throw new RuntimeException("거부할 수 없는 상태입니다: " + request.getStatus());
        }
        
        request.setStatus(PurchaseRequest.PurchaseRequestStatus.HQ_MASTER_REJECTED);
        request.setSuperAdminApprover(superAdmin);
        request.setSuperAdminApprovedAt(LocalDateTime.now());
        request.setSuperAdminComment(comment);
        
        purchaseRequestRepository.save(request);
        
        return true;
    }
    
    @Override
    public boolean cancelPurchaseRequest(Long requestId, Long requesterId) {
        log.info("구매 요청 취소: requestId={}, requesterId={}", requestId, requesterId);
        
        PurchaseRequest request = purchaseRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("구매 요청을 찾을 수 없습니다: " + requestId));
        
        if (!request.getRequester().getId().equals(requesterId)) {
            throw new RuntimeException("본인의 구매 요청만 취소할 수 있습니다");
        }
        
        if (request.getStatus() != PurchaseRequest.PurchaseRequestStatus.PENDING) {
            throw new RuntimeException("취소할 수 없는 상태입니다: " + request.getStatus());
        }
        
        request.setStatus(PurchaseRequest.PurchaseRequestStatus.CANCELLED);
        purchaseRequestRepository.save(request);
        
        return true;
    }
    
    // ==================== Purchase Order Management ====================
    
    @Override
    public PurchaseOrder createPurchaseOrder(Long requestId, Long purchaserId, String supplier, String supplierContact, LocalDateTime expectedDeliveryDate, String notes) {
        log.info("구매 주문 생성: requestId={}, purchaserId={}", requestId, purchaserId);
        
        PurchaseRequest request = purchaseRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("구매 요청을 찾을 수 없습니다: " + requestId));
        
        User purchaser = userService.findActiveById(purchaserId)
                .orElseThrow(() -> new RuntimeException("구매자를 찾을 수 없습니다: " + purchaserId));
        
        if (request.getStatus() != PurchaseRequest.PurchaseRequestStatus.HQ_MASTER_APPROVED) {
            throw new RuntimeException("승인된 구매 요청만 주문할 수 있습니다: " + request.getStatus());
        }
        
        PurchaseOrder purchaseOrder = PurchaseOrder.builder()
                .purchaseRequest(request)
                .totalAmount(request.getTotalAmount())
                .status(PurchaseOrder.PurchaseOrderStatus.PENDING)
                .expectedDeliveryDate(expectedDeliveryDate)
                .supplier(supplier)
                .supplierContact(supplierContact)
                .purchaser(purchaser)
                .notes(notes)
                .orderedAt(LocalDateTime.now())
                .build();
        
        PurchaseOrder savedOrder = purchaseOrderRepository.save(purchaseOrder);
        
        // 구매 요청 상태를 완료로 변경
        request.setStatus(PurchaseRequest.PurchaseRequestStatus.COMPLETED);
        purchaseRequestRepository.save(request);
        
        return savedOrder;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<PurchaseOrder> getPurchaseOrderById(Long id) {
        log.info("구매 주문 조회: id={}", id);
        return purchaseOrderRepository.findByIdWithDetails(id);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<PurchaseOrder> getAllActivePurchaseOrders() {
        log.info("모든 활성화된 구매 주문 조회");
        return purchaseOrderRepository.findAllActive();
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<PurchaseOrder> getPurchaseOrderByOrderNumber(String orderNumber) {
        log.info("주문 번호로 구매 주문 조회: orderNumber={}", orderNumber);
        return purchaseOrderRepository.findByOrderNumber(orderNumber);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<PurchaseOrder> getPurchaseOrdersByPurchaser(Long purchaserId) {
        log.info("구매자별 주문 목록 조회: purchaserId={}", purchaserId);
        return purchaseOrderRepository.findByPurchaserId(purchaserId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<PurchaseOrder> getPurchaseOrdersByStatus(PurchaseOrder.PurchaseOrderStatus status) {
        log.info("상태별 주문 목록 조회: status={}", status);
        return purchaseOrderRepository.findByStatus(status);
    }
    
    @Override
    public boolean updateOrderStatus(Long orderId, PurchaseOrder.PurchaseOrderStatus status) {
        log.info("주문 상태 업데이트: orderId={}, status={}", orderId, status);
        
        PurchaseOrder order = purchaseOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("구매 주문을 찾을 수 없습니다: " + orderId));
        
        order.setStatus(status);
        purchaseOrderRepository.save(order);
        
        return true;
    }
    
    @Override
    public boolean markAsDelivered(Long orderId) {
        log.info("배송 완료 처리: orderId={}", orderId);
        
        PurchaseOrder order = purchaseOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("구매 주문을 찾을 수 없습니다: " + orderId));
        
        order.setStatus(PurchaseOrder.PurchaseOrderStatus.DELIVERED);
        order.setDeliveredAt(LocalDateTime.now());
        purchaseOrderRepository.save(order);
        
        return true;
    }
    
    // ==================== Budget Management ====================
    
    @Override
    @Transactional(readOnly = true)
    public List<Budget> getAllActiveBudgets() {
        log.info("모든 활성화된 예산 조회");
        return budgetRepository.findAllActive();
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<Budget> getBudgetById(Long id) {
        log.info("예산 조회: id={}", id);
        return budgetRepository.findByIdWithManager(id);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Budget> getBudgetsByYear(String year) {
        log.info("연도별 예산 조회: year={}", year);
        return budgetRepository.findByYearAndActive(year);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Budget> getBudgetsByYearAndMonth(String year, String month) {
        log.info("월별 예산 조회: year={}, month={}", year, month);
        return budgetRepository.findByYearAndMonthAndActive(year, month);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Budget> getBudgetsByCategory(String category) {
        log.info("카테고리별 예산 조회: category={}", category);
        return budgetRepository.findByCategoryAndActive(category);
    }
    
    @Override
    public Budget createBudget(Budget budget) {
        log.info("예산 생성: name={}", budget.getName());
        return budgetRepository.save(budget);
    }
    
    @Override
    public Budget updateBudget(Long id, Budget budget) {
        log.info("예산 수정: id={}", id);
        Budget existingBudget = budgetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("예산을 찾을 수 없습니다: " + id));
        
        existingBudget.setName(budget.getName());
        existingBudget.setDescription(budget.getDescription());
        existingBudget.setTotalBudget(budget.getTotalBudget());
        existingBudget.setCategory(budget.getCategory());
        existingBudget.setYear(budget.getYear());
        existingBudget.setMonth(budget.getMonth());
        existingBudget.setManager(budget.getManager());
        existingBudget.setIsActive(budget.getIsActive());
        
        return budgetRepository.save(existingBudget);
    }
    
    @Override
    public boolean deleteBudget(Long id) {
        log.info("예산 삭제: id={}", id);
        Budget budget = budgetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("예산을 찾을 수 없습니다: " + id));
        
        budget.setIsActive(false);
        budgetRepository.save(budget);
        
        return true;
    }
    
    @Override
    public boolean useBudget(Long budgetId, BigDecimal amount) {
        log.info("예산 사용: budgetId={}, amount={}", budgetId, amount);
        
        Budget budget = budgetRepository.findById(budgetId)
                .orElseThrow(() -> new RuntimeException("예산을 찾을 수 없습니다: " + budgetId));
        
        if (budget.getRemainingBudget().compareTo(amount) < 0) {
            throw new RuntimeException("예산이 부족합니다. 남은 예산: " + budget.getRemainingBudget());
        }
        
        budget.setUsedBudget(budget.getUsedBudget().add(amount));
        budget.setRemainingBudget(budget.getTotalBudget().subtract(budget.getUsedBudget()));
        
        budgetRepository.save(budget);
        
        return true;
    }
    
    @Override
    public boolean refundBudget(Long budgetId, BigDecimal amount) {
        log.info("예산 환불: budgetId={}, amount={}", budgetId, amount);
        
        Budget budget = budgetRepository.findById(budgetId)
                .orElseThrow(() -> new RuntimeException("예산을 찾을 수 없습니다: " + budgetId));
        
        budget.setUsedBudget(budget.getUsedBudget().subtract(amount));
        budget.setRemainingBudget(budget.getTotalBudget().subtract(budget.getUsedBudget()));
        
        budgetRepository.save(budget);
        
        return true;
    }
    
    // ==================== Statistics and Reports ====================
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getMonthlyPurchaseRequestStats(int year, int month) {
        log.info("월별 구매 요청 통계: year={}, month={}", year, month);
        
        Object[] stats = purchaseRequestRepository.getMonthlyStats(year, month);
        Map<String, Object> result = new HashMap<>();
        
        if (stats != null && stats.length >= 2) {
            result.put("count", stats[0]);
            result.put("totalAmount", stats[1]);
        } else {
            result.put("count", 0);
            result.put("totalAmount", BigDecimal.ZERO);
        }
        
        result.put("year", year);
        result.put("month", month);
        
        return result;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getMonthlyPurchaseOrderStats(int year, int month) {
        log.info("월별 구매 주문 통계: year={}, month={}", year, month);
        
        Object[] stats = purchaseOrderRepository.getMonthlyStats(year, month);
        Map<String, Object> result = new HashMap<>();
        
        if (stats != null && stats.length >= 2) {
            result.put("count", stats[0]);
            result.put("totalAmount", stats[1]);
        } else {
            result.put("count", 0);
            result.put("totalAmount", BigDecimal.ZERO);
        }
        
        result.put("year", year);
        result.put("month", month);
        
        return result;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getMonthlyBudgetStats(String year, String month) {
        log.info("월별 예산 통계: year={}, month={}", year, month);
        
        List<Object[]> stats = budgetRepository.getStatsByMonth(year);
        Map<String, Object> result = new HashMap<>();
        
        BigDecimal totalBudget = BigDecimal.ZERO;
        BigDecimal totalUsed = BigDecimal.ZERO;
        BigDecimal totalRemaining = BigDecimal.ZERO;
        
        for (Object[] stat : stats) {
            if (stat[1].toString().equals(month)) {
                totalBudget = totalBudget.add((BigDecimal) stat[2]);
                totalUsed = totalUsed.add((BigDecimal) stat[3]);
                totalRemaining = totalRemaining.add((BigDecimal) stat[4]);
            }
        }
        
        result.put("totalBudget", totalBudget);
        result.put("totalUsed", totalUsed);
        result.put("totalRemaining", totalRemaining);
        result.put("year", year);
        result.put("month", month);
        
        return result;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getPurchaseRequestStatsByStatus() {
        log.info("상태별 구매 요청 통계");
        
        List<Object[]> stats = purchaseRequestRepository.getStatsByStatus();
        Map<String, Object> result = new HashMap<>();
        
        for (Object[] stat : stats) {
            String status = stat[0].toString();
            Long count = (Long) stat[1];
            BigDecimal totalAmount = (BigDecimal) stat[2];
            
            Map<String, Object> statusData = new HashMap<>();
            statusData.put("count", count);
            statusData.put("totalAmount", totalAmount);
            
            result.put(status, statusData);
        }
        
        return result;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getPurchaseRequestStatsByRequester() {
        log.info("요청자별 구매 요청 통계");
        
        List<Object[]> stats = purchaseRequestRepository.getStatsByRequester();
        Map<String, Object> result = new HashMap<>();
        
        for (Object[] stat : stats) {
            Long requesterId = (Long) stat[0];
            String requesterName = stat[1].toString();
            Long count = (Long) stat[2];
            BigDecimal totalAmount = (BigDecimal) stat[3];
            
            Map<String, Object> requesterData = new HashMap<>();
            requesterData.put("requesterId", requesterId);
            requesterData.put("requesterName", requesterName);
            requesterData.put("count", count);
            requesterData.put("totalAmount", totalAmount);
            
            result.put(requesterId.toString(), requesterData);
        }
        
        return result;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getPurchaseOrderStatsBySupplier() {
        log.info("공급업체별 구매 주문 통계");
        
        List<Object[]> stats = purchaseOrderRepository.getStatsBySupplier();
        Map<String, Object> result = new HashMap<>();
        
        for (Object[] stat : stats) {
            String supplier = stat[0].toString();
            Long count = (Long) stat[1];
            BigDecimal totalAmount = (BigDecimal) stat[2];
            
            Map<String, Object> supplierData = new HashMap<>();
            supplierData.put("count", count);
            supplierData.put("totalAmount", totalAmount);
            
            result.put(supplier, supplierData);
        }
        
        return result;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getBudgetStatsByCategory() {
        log.info("카테고리별 예산 통계");
        
        List<Object[]> stats = budgetRepository.getStatsByCategory();
        Map<String, Object> result = new HashMap<>();
        
        for (Object[] stat : stats) {
            String category = stat[0].toString();
            BigDecimal totalBudget = (BigDecimal) stat[1];
            BigDecimal totalUsed = (BigDecimal) stat[2];
            BigDecimal totalRemaining = (BigDecimal) stat[3];
            
            Map<String, Object> categoryData = new HashMap<>();
            categoryData.put("totalBudget", totalBudget);
            categoryData.put("totalUsed", totalUsed);
            categoryData.put("totalRemaining", totalRemaining);
            
            result.put(category, categoryData);
        }
        
        return result;
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Budget> getHighUsageBudgets() {
        log.info("예산 사용률이 높은 예산 목록 조회");
        return budgetRepository.findHighUsageBudgets();
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Budget> getOverBudgetBudgets() {
        log.info("예산 부족 예산 목록 조회");
        return budgetRepository.findOverBudgetBudgets();
    }
    
    // ==================== 회계 시스템 통합 ====================
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getIntegratedFinanceDashboard() {
        log.info("통합 재무 대시보드 데이터 조회");
        
        Map<String, Object> dashboardData = new HashMap<>();
        
        // 기본 ERP 통계
        Map<String, Object> erpStats = new HashMap<>();
        erpStats.put("totalItems", itemRepository.findAllActive().size());
        erpStats.put("pendingRequests", purchaseRequestRepository.findPendingAdminApproval().size());
        erpStats.put("totalOrders", purchaseOrderRepository.findAllActive().size());
        erpStats.put("totalBudgets", budgetRepository.findAllActive().size());
        
        // 예산 사용률 계산
        List<Budget> allBudgets = budgetRepository.findAllActive();
        BigDecimal totalBudget = allBudgets.stream()
                .map(Budget::getTotalBudget)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalUsed = allBudgets.stream()
                .map(Budget::getUsedBudget)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        String budgetUsagePercentage = "0%";
        if (totalBudget.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal usagePercentage = totalUsed.divide(totalBudget, 4, java.math.RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
            budgetUsagePercentage = usagePercentage.setScale(1, java.math.RoundingMode.HALF_UP) + "%";
        }
        
        erpStats.put("budgetUsage", budgetUsagePercentage);
        erpStats.put("budgetUsed", totalUsed);
        erpStats.put("budgetTotal", totalBudget);
        
        dashboardData.put("erpStats", erpStats);
        
        // 실제 재무 데이터 추가
        Map<String, Object> financialData = getRealTimeFinancialData();
        dashboardData.put("financialData", financialData);
        
        // 최근 구매 요청
        List<PurchaseRequest> recentRequests = purchaseRequestRepository.findAllActive().stream()
                .limit(5)
                .toList();
        dashboardData.put("recentRequests", recentRequests);
        
        // 최근 구매 주문
        List<PurchaseOrder> recentOrders = purchaseOrderRepository.findAllActive().stream()
                .limit(5)
                .toList();
        dashboardData.put("recentOrders", recentOrders);
        
        // 카테고리별 예산 현황
        Map<String, Object> budgetByCategory = getBudgetStatsByCategory();
        dashboardData.put("budgetByCategory", budgetByCategory);
        
        // 상태별 구매 요청 통계
        Map<String, Object> requestStats = getPurchaseRequestStatsByStatus();
        dashboardData.put("requestStats", requestStats);
        
        return dashboardData;
    }
    
    /**
     * 실시간 재무 데이터 조회
     */
    private Map<String, Object> getRealTimeFinancialData() {
        Map<String, Object> financialData = new HashMap<>();
        
        try {
            // 실제 재무 거래 데이터에서 수입/지출 조회
            List<com.mindgarden.consultation.dto.FinancialTransactionResponse> transactions = 
                financialTransactionService.getTransactions(org.springframework.data.domain.PageRequest.of(0, 1000))
                    .getContent();
            
            // 수입 총계 (INCOME 타입)
            BigDecimal totalIncome = transactions.stream()
                .filter(t -> "INCOME".equals(t.getTransactionType()))
                .map(com.mindgarden.consultation.dto.FinancialTransactionResponse::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            // 지출 총계 (EXPENSE 타입)
            BigDecimal totalExpense = transactions.stream()
                .filter(t -> "EXPENSE".equals(t.getTransactionType()))
                .map(com.mindgarden.consultation.dto.FinancialTransactionResponse::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            // 순이익 계산
            BigDecimal netProfit = totalIncome.subtract(totalExpense);
            
            // 카테고리별 수입/지출 분석
            Map<String, BigDecimal> incomeByCategory = new HashMap<>();
            Map<String, BigDecimal> expenseByCategory = new HashMap<>();
            
            transactions.forEach(t -> {
                String category = t.getCategory();
                BigDecimal amount = t.getAmount();
                
                if ("INCOME".equals(t.getTransactionType())) {
                    incomeByCategory.merge(category, amount, BigDecimal::add);
                } else if ("EXPENSE".equals(t.getTransactionType())) {
                    expenseByCategory.merge(category, amount, BigDecimal::add);
                }
            });
            
            financialData.put("totalIncome", totalIncome);
            financialData.put("totalExpense", totalExpense);
            financialData.put("netProfit", netProfit);
            financialData.put("incomeByCategory", incomeByCategory);
            financialData.put("expenseByCategory", expenseByCategory);
            financialData.put("transactionCount", transactions.size());
            
            log.info("실시간 재무 데이터 조회 완료 - 수입: {}, 지출: {}, 순이익: {}", 
                totalIncome, totalExpense, netProfit);
            
        } catch (Exception e) {
            log.error("실시간 재무 데이터 조회 실패: {}", e.getMessage(), e);
            // 기본값 설정
            financialData.put("totalIncome", BigDecimal.ZERO);
            financialData.put("totalExpense", BigDecimal.ZERO);
            financialData.put("netProfit", BigDecimal.ZERO);
            financialData.put("incomeByCategory", new HashMap<String, BigDecimal>());
            financialData.put("expenseByCategory", new HashMap<String, BigDecimal>());
            financialData.put("transactionCount", 0);
        }
        
        return financialData;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getFinanceStatistics(String startDate, String endDate) {
        log.info("수입/지출 통계 조회: {} ~ {}", startDate, endDate);
        
        Map<String, Object> statistics = new HashMap<>();
        
        // 구매 관련 지출 통계
        Map<String, Object> purchaseExpenses = new HashMap<>();
        
        // 승인된 구매 요청의 총 금액 (지출)
        BigDecimal totalPurchaseAmount = purchaseRequestRepository.findAllActive().stream()
                .filter(req -> req.getStatus() == PurchaseRequest.PurchaseRequestStatus.HQ_MASTER_APPROVED)
                .map(PurchaseRequest::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        purchaseExpenses.put("totalAmount", totalPurchaseAmount);
        
        // 승인된 구매 요청 건수
        Long approvedCount = purchaseRequestRepository.findAllActive().stream()
                .filter(req -> req.getStatus() == PurchaseRequest.PurchaseRequestStatus.HQ_MASTER_APPROVED)
                .count();
        purchaseExpenses.put("count", approvedCount);
        
        // 카테고리별 구매 금액
        Map<String, BigDecimal> categoryAmounts = new HashMap<>();
        purchaseRequestRepository.findAllActive().stream()
                .filter(req -> req.getStatus() == PurchaseRequest.PurchaseRequestStatus.HQ_MASTER_APPROVED)
                .forEach(req -> {
                    String category = req.getItem().getCategory();
                    BigDecimal amount = req.getTotalAmount();
                    categoryAmounts.merge(category, amount, BigDecimal::add);
                });
        purchaseExpenses.put("byCategory", categoryAmounts);
        
        statistics.put("purchaseExpenses", purchaseExpenses);
        
        // 예산 사용 통계
        Map<String, Object> budgetStats = new HashMap<>();
        
        // 총 예산 대비 사용률
        List<Budget> budgets = budgetRepository.findAllActive();
        BigDecimal totalBudgetAmount = budgets.stream()
                .map(Budget::getTotalBudget)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalUsedAmount = budgets.stream()
                .map(Budget::getUsedBudget)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        budgetStats.put("totalBudget", totalBudgetAmount);
        budgetStats.put("totalUsed", totalUsedAmount);
        budgetStats.put("totalRemaining", totalBudgetAmount.subtract(totalUsedAmount));
        
        if (totalBudgetAmount.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal usageRate = totalUsedAmount.divide(totalBudgetAmount, 4, java.math.RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
            budgetStats.put("usageRate", usageRate.setScale(1, java.math.RoundingMode.HALF_UP) + "%");
        } else {
            budgetStats.put("usageRate", "0%");
        }
        
        statistics.put("budgetStats", budgetStats);
        
        // 월별 추이 (최근 6개월)
        Map<String, Object> monthlyTrend = new HashMap<>();
        for (int i = 5; i >= 0; i--) {
            LocalDateTime monthStart = LocalDateTime.now().minusMonths(i).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
            LocalDateTime monthEnd = monthStart.plusMonths(1).minusSeconds(1);
            
            String monthKey = monthStart.getYear() + "-" + String.format("%02d", monthStart.getMonthValue());
            BigDecimal monthAmount = purchaseRequestRepository.findAllActive().stream()
                    .filter(req -> req.getStatus() == PurchaseRequest.PurchaseRequestStatus.HQ_MASTER_APPROVED)
                    .filter(req -> req.getCreatedAt().isAfter(monthStart) && req.getCreatedAt().isBefore(monthEnd))
                    .map(PurchaseRequest::getTotalAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            monthlyTrend.put(monthKey, monthAmount != null ? monthAmount : BigDecimal.ZERO);
        }
        
        statistics.put("monthlyTrend", monthlyTrend);
        
        return statistics;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getCategoryAnalysis(String startDate, String endDate) {
        log.info("카테고리별 분석 조회: {} ~ {}", startDate, endDate);
        
        Map<String, Object> analysis = new HashMap<>();
        
        // 카테고리별 구매 요청 분석
        Map<String, Object> categoryAnalysis = new HashMap<>();
        Map<String, Long> categoryCounts = new HashMap<>();
        Map<String, BigDecimal> categoryAmounts = new HashMap<>();
        
        BigDecimal totalAmount = BigDecimal.ZERO;
        for (PurchaseRequest req : purchaseRequestRepository.findAllActive()) {
            String category = req.getItem().getCategory();
            BigDecimal amount = req.getTotalAmount();
            
            categoryCounts.merge(category, 1L, Long::sum);
            categoryAmounts.merge(category, amount, BigDecimal::add);
            totalAmount = totalAmount.add(amount);
        }
        
        for (Map.Entry<String, Long> entry : categoryCounts.entrySet()) {
            String category = entry.getKey();
            Long count = entry.getValue();
            BigDecimal amount = categoryAmounts.get(category);
            BigDecimal avgAmount = amount.divide(BigDecimal.valueOf(count), 0, java.math.RoundingMode.HALF_UP);
            
            Map<String, Object> categoryData = new HashMap<>();
            categoryData.put("count", count);
            categoryData.put("totalAmount", amount);
            categoryData.put("averageAmount", avgAmount);
            
            categoryAnalysis.put(category, categoryData);
        }
        
        // 비율 계산
        for (Map.Entry<String, Object> entry : categoryAnalysis.entrySet()) {
            @SuppressWarnings("unchecked")
            Map<String, Object> categoryData = (Map<String, Object>) entry.getValue();
            BigDecimal amount = (BigDecimal) categoryData.get("totalAmount");
            
            if (totalAmount.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal percentage = amount.divide(totalAmount, 4, java.math.RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100));
                categoryData.put("percentage", percentage.setScale(1, java.math.RoundingMode.HALF_UP) + "%");
            } else {
                categoryData.put("percentage", "0%");
            }
        }
        
        analysis.put("categoryBreakdown", categoryAnalysis);
        analysis.put("totalAmount", totalAmount);
        analysis.put("totalCategories", categoryAnalysis.size());
        
        // 상위 카테고리 (금액 기준)
        List<Map.Entry<String, Object>> sortedCategories = categoryAnalysis.entrySet().stream()
                .sorted((e1, e2) -> {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> map1 = (Map<String, Object>) e1.getValue();
                    @SuppressWarnings("unchecked")
                    Map<String, Object> map2 = (Map<String, Object>) e2.getValue();
                    BigDecimal amount1 = (BigDecimal) map1.get("totalAmount");
                    BigDecimal amount2 = (BigDecimal) map2.get("totalAmount");
                    return amount2.compareTo(amount1);
                })
                .limit(5)
                .toList();
        
        analysis.put("topCategories", sortedCategories);
        
        // 요청자별 분석
        Map<String, Object> requesterAnalysis = new HashMap<>();
        Map<Long, Long> requesterCounts = new HashMap<>();
        Map<Long, BigDecimal> requesterAmounts = new HashMap<>();
        
        for (PurchaseRequest req : purchaseRequestRepository.findAllActive()) {
            Long requesterId = req.getRequester().getId();
            BigDecimal amount = req.getTotalAmount();
            
            requesterCounts.merge(requesterId, 1L, Long::sum);
            requesterAmounts.merge(requesterId, amount, BigDecimal::add);
        }
        
        for (Map.Entry<Long, Long> entry : requesterCounts.entrySet()) {
            Long requesterId = entry.getKey();
            Long count = entry.getValue();
            BigDecimal amount = requesterAmounts.get(requesterId);
            
            // 사용자 정보 조회
            Optional<User> userOpt = userService.findById(requesterId);
            String requesterName = userOpt.map(User::getName).orElse("알 수 없음");
            
            Map<String, Object> requesterData = new HashMap<>();
            requesterData.put("count", count);
            requesterData.put("totalAmount", amount);
            requesterData.put("name", requesterName);
            
            requesterAnalysis.put(requesterId.toString(), requesterData);
        }
        
        analysis.put("requesterBreakdown", requesterAnalysis);
        
        return analysis;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getBalanceSheet(String reportDate) {
        log.info("대차대조표 조회: {}", reportDate);
        
        Map<String, Object> balanceSheet = new HashMap<>();
        
        // 기본 정보
        balanceSheet.put("reportDate", reportDate);
        balanceSheet.put("reportPeriod", "대차대조표");
        
        // 자산 섹션
        Map<String, Object> assets = new HashMap<>();
        
        // 유동자산 (현금, 예금, 매출채권 등) - 실제 데이터 기반
        Map<String, Object> currentAssets = new HashMap<>();
        
        // 실제 재무 거래에서 자산 계산
        try {
            List<com.mindgarden.consultation.dto.FinancialTransactionResponse> transactions = 
                financialTransactionService.getTransactions(org.springframework.data.domain.PageRequest.of(0, 1000))
                    .getContent();
            
            BigDecimal totalIncome = transactions.stream()
                .filter(t -> "INCOME".equals(t.getTransactionType()))
                .map(com.mindgarden.consultation.dto.FinancialTransactionResponse::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            BigDecimal totalExpense = transactions.stream()
                .filter(t -> "EXPENSE".equals(t.getTransactionType()))
                .map(com.mindgarden.consultation.dto.FinancialTransactionResponse::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            // 순현금 (수입 - 지출, 음수 방지)
            BigDecimal netCash = totalIncome.subtract(totalExpense).max(BigDecimal.ZERO);
            
            currentAssets.put("cash", netCash); // 순현금
            currentAssets.put("bankDeposits", BigDecimal.ZERO); // 예금 (실제 데이터 없음)
            currentAssets.put("accountsReceivable", BigDecimal.ZERO); // 매출채권 (실제 데이터 없음)
            currentAssets.put("inventory", BigDecimal.ZERO); // 재고자산 (실제 데이터 없음)
            currentAssets.put("prepaidExpenses", BigDecimal.ZERO); // 선급비용 (실제 데이터 없음)
            currentAssets.put("shortTermInvestments", BigDecimal.ZERO); // 단기투자 (실제 데이터 없음)
            
        } catch (Exception e) {
            log.error("자산 데이터 조회 실패: {}", e.getMessage(), e);
            currentAssets.put("cash", BigDecimal.ZERO);
            currentAssets.put("bankDeposits", BigDecimal.ZERO);
            currentAssets.put("accountsReceivable", BigDecimal.ZERO);
            currentAssets.put("inventory", BigDecimal.ZERO);
            currentAssets.put("prepaidExpenses", BigDecimal.ZERO);
            currentAssets.put("shortTermInvestments", BigDecimal.ZERO);
        }
        BigDecimal currentAssetsTotal = currentAssets.values().stream()
                .map(amount -> (BigDecimal) amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        currentAssets.put("total", currentAssetsTotal);
        assets.put("currentAssets", currentAssets);
        
        // 고정자산 (실제 데이터 없으므로 0으로 설정)
        Map<String, Object> fixedAssets = new HashMap<>();
        fixedAssets.put("officeEquipment", BigDecimal.ZERO); // 사무용품
        fixedAssets.put("computerEquipment", BigDecimal.ZERO); // 컴퓨터 장비
        fixedAssets.put("leaseDeposits", BigDecimal.ZERO); // 임대료지불보증금
        fixedAssets.put("furniture", BigDecimal.ZERO); // 가구
        fixedAssets.put("software", BigDecimal.ZERO); // 소프트웨어
        BigDecimal fixedAssetsTotal = fixedAssets.values().stream()
                .map(amount -> (BigDecimal) amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // 감가상각 차감 (실제 데이터 없으므로 0으로 설정)
        Map<String, Object> accumulatedDepreciation = new HashMap<>();
        accumulatedDepreciation.put("officeEquipmentDepreciation", BigDecimal.ZERO); // 사무용품 감가상각
        accumulatedDepreciation.put("computerDepreciation", BigDecimal.ZERO); // 컴퓨터 감가상각
        accumulatedDepreciation.put("furnitureDepreciation", BigDecimal.ZERO); // 가구 감가상각
        accumulatedDepreciation.put("softwareDepreciation", BigDecimal.ZERO); // 소프트웨어 감가상각
        BigDecimal totalDepreciation = accumulatedDepreciation.values().stream()
                .map(amount -> (BigDecimal) amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        accumulatedDepreciation.put("total", totalDepreciation);
        
        BigDecimal netFixedAssets = fixedAssetsTotal.add(totalDepreciation);
        fixedAssets.put("grossAmount", fixedAssetsTotal);
        fixedAssets.put("accumulatedDepreciation", accumulatedDepreciation);
        fixedAssets.put("netAmount", netFixedAssets);
        assets.put("fixedAssets", fixedAssets);
        
        // 무형자산 (실제 데이터 없으므로 0으로 설정)
        Map<String, Object> intangibleAssets = new HashMap<>();
        intangibleAssets.put("goodwill", BigDecimal.ZERO); // 영업권
        intangibleAssets.put("patents", BigDecimal.ZERO); // 특허권
        intangibleAssets.put("trademarks", BigDecimal.ZERO); // 상표권
        BigDecimal intangibleAssetsTotal = intangibleAssets.values().stream()
                .map(amount -> (BigDecimal) amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        intangibleAssets.put("total", intangibleAssetsTotal);
        assets.put("intangibleAssets", intangibleAssets);
        
        BigDecimal totalAssets = currentAssetsTotal.add(netFixedAssets).add(intangibleAssetsTotal);
        assets.put("total", totalAssets);
        balanceSheet.put("assets", assets);
        
        // 부채 섹션
        Map<String, Object> liabilities = new HashMap<>();
        
        // 유동부채 (실제 데이터 없으므로 0으로 설정)
        Map<String, Object> currentLiabilities = new HashMap<>();
        currentLiabilities.put("accountsPayable", BigDecimal.ZERO); // 매입채무
        currentLiabilities.put("shortTermLoans", BigDecimal.ZERO); // 단기차입금
        currentLiabilities.put("accruedExpenses", BigDecimal.ZERO); // 미지급비용
        currentLiabilities.put("taxesPayable", BigDecimal.ZERO); // 미지급세금
        currentLiabilities.put("salaryPayable", BigDecimal.ZERO); // 미지급급여
        currentLiabilities.put("provisions", BigDecimal.ZERO); // 충당금
        BigDecimal currentLiabilitiesTotal = currentLiabilities.values().stream()
                .map(amount -> (BigDecimal) amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        currentLiabilities.put("total", currentLiabilitiesTotal);
        liabilities.put("currentLiabilities", currentLiabilities);
        
        // 비유동부채 (실제 데이터 없으므로 0으로 설정)
        Map<String, Object> longTermLiabilities = new HashMap<>();
        longTermLiabilities.put("longTermLoans", BigDecimal.ZERO); // 장기차입금
        longTermLiabilities.put("leaseObligations", BigDecimal.ZERO); // 임대차의무
        longTermLiabilities.put("retirementBenefits", BigDecimal.ZERO); // 퇴직급여충당금
        BigDecimal longTermLiabilitiesTotal = longTermLiabilities.values().stream()
                .map(amount -> (BigDecimal) amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        longTermLiabilities.put("total", longTermLiabilitiesTotal);
        liabilities.put("longTermLiabilities", longTermLiabilities);
        
        BigDecimal totalLiabilities = currentLiabilitiesTotal.add(longTermLiabilitiesTotal);
        liabilities.put("total", totalLiabilities);
        balanceSheet.put("liabilities", liabilities);
        
        // 자본 섹션
        Map<String, Object> equity = new HashMap<>();
        
        // 자본금 (실제 데이터 없으므로 0으로 설정)
        Map<String, Object> capital = new HashMap<>();
        capital.put("paidInCapital", BigDecimal.ZERO); // 납입자본금
        capital.put("additionalPaidInCapital", BigDecimal.ZERO); // 자본잉여금
        BigDecimal totalCapital = capital.values().stream()
                .map(amount -> (BigDecimal) amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        capital.put("total", totalCapital);
        equity.put("capital", capital);
        
        // 이익잉여금 (실제 데이터 기반)
        Map<String, Object> retainedEarnings = new HashMap<>();
        retainedEarnings.put("beginningRetainedEarnings", BigDecimal.ZERO); // 기초이익잉여금 (실제 데이터 없음)
        
        // 당기순이익 (실제 수입 - 지출)
        try {
            List<com.mindgarden.consultation.dto.FinancialTransactionResponse> transactions = 
                financialTransactionService.getTransactions(org.springframework.data.domain.PageRequest.of(0, 1000))
                    .getContent();
            
            BigDecimal totalIncome = transactions.stream()
                .filter(t -> "INCOME".equals(t.getTransactionType()))
                .map(com.mindgarden.consultation.dto.FinancialTransactionResponse::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            BigDecimal totalExpense = transactions.stream()
                .filter(t -> "EXPENSE".equals(t.getTransactionType()))
                .map(com.mindgarden.consultation.dto.FinancialTransactionResponse::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            BigDecimal netIncome = totalIncome.subtract(totalExpense);
            retainedEarnings.put("netIncome", netIncome);
        } catch (Exception e) {
            log.error("당기순이익 계산 실패: {}", e.getMessage(), e);
            retainedEarnings.put("netIncome", BigDecimal.ZERO);
        }
        
        retainedEarnings.put("dividends", BigDecimal.ZERO); // 배당금 (실제 데이터 없음)
        BigDecimal totalRetainedEarnings = retainedEarnings.values().stream()
                .map(amount -> (BigDecimal) amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        retainedEarnings.put("total", totalRetainedEarnings);
        equity.put("retainedEarnings", retainedEarnings);
        
        // 기타 자본 (실제 데이터 없으므로 0으로 설정)
        Map<String, Object> otherEquity = new HashMap<>();
        otherEquity.put("reserveFunds", BigDecimal.ZERO); // 적립금
        otherEquity.put("revaluationSurplus", BigDecimal.ZERO); // 재평가잉여금
        BigDecimal totalOtherEquity = otherEquity.values().stream()
                .map(amount -> (BigDecimal) amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        otherEquity.put("total", totalOtherEquity);
        equity.put("otherEquity", otherEquity);
        
        BigDecimal totalEquity = totalCapital.add(totalRetainedEarnings).add(totalOtherEquity);
        equity.put("total", totalEquity);
        balanceSheet.put("equity", equity);
        
        // 합계 검증
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalAssets", totalAssets);
        summary.put("totalLiabilities", totalLiabilities);
        summary.put("totalEquity", totalEquity);
        BigDecimal totalLiabilitiesAndEquity = totalLiabilities.add(totalEquity);
        summary.put("totalLiabilitiesAndEquity", totalLiabilitiesAndEquity);
        summary.put("isBalanced", totalAssets.equals(totalLiabilitiesAndEquity));
        summary.put("difference", totalAssets.subtract(totalLiabilitiesAndEquity));
        balanceSheet.put("summary", summary);
        
        return balanceSheet;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getIncomeStatement(String startDate, String endDate) {
        log.info("손익계산서 조회: {} ~ {}", startDate, endDate);
        
        Map<String, Object> incomeStatement = new HashMap<>();
        incomeStatement.put("startDate", startDate);
        incomeStatement.put("endDate", endDate);
        incomeStatement.put("reportPeriod", "손익계산서");
        
        // 수익 섹션 - 실제 결제 데이터에서 조회
        Map<String, Object> revenue = new HashMap<>();
        
        // 실제 재무 거래에서 수익 조회
        try {
            List<com.mindgarden.consultation.dto.FinancialTransactionResponse> transactions = 
                financialTransactionService.getTransactions(org.springframework.data.domain.PageRequest.of(0, 1000))
                    .getContent();
            
            BigDecimal consultationRevenue = transactions.stream()
                .filter(t -> "INCOME".equals(t.getTransactionType()))
                .filter(t -> "상담료".equals(t.getCategory()) || "CONSULTATION".equals(t.getCategory()))
                .map(com.mindgarden.consultation.dto.FinancialTransactionResponse::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            BigDecimal otherRevenue = transactions.stream()
                .filter(t -> "INCOME".equals(t.getTransactionType()))
                .filter(t -> !"상담료".equals(t.getCategory()) && !"CONSULTATION".equals(t.getCategory()))
                .map(com.mindgarden.consultation.dto.FinancialTransactionResponse::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            revenue.put("consultationRevenue", consultationRevenue);
            revenue.put("otherRevenue", otherRevenue);
        } catch (Exception e) {
            log.error("수익 데이터 조회 실패: {}", e.getMessage(), e);
            revenue.put("consultationRevenue", BigDecimal.ZERO);
            revenue.put("otherRevenue", BigDecimal.ZERO);
        }
        BigDecimal totalRevenue = revenue.values().stream()
                .map(amount -> (BigDecimal) amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        revenue.put("total", totalRevenue);
        incomeStatement.put("revenue", revenue);
        
        // 비용 섹션 - 실제 재무 거래에서 조회
        Map<String, Object> expenses = new HashMap<>();
        try {
            List<com.mindgarden.consultation.dto.FinancialTransactionResponse> transactions = 
                financialTransactionService.getTransactions(org.springframework.data.domain.PageRequest.of(0, 1000))
                    .getContent();
            
            // 카테고리별 지출 계산
            Map<String, BigDecimal> expenseByCategory = new HashMap<>();
            transactions.stream()
                .filter(t -> "EXPENSE".equals(t.getTransactionType()))
                .forEach(t -> {
                    String category = t.getCategory();
                    BigDecimal amount = t.getAmount();
                    expenseByCategory.merge(category, amount, BigDecimal::add);
                });
            
            expenses.put("salaryExpense", expenseByCategory.getOrDefault("급여", BigDecimal.ZERO));
            expenses.put("rentExpense", expenseByCategory.getOrDefault("임대료", BigDecimal.ZERO));
            expenses.put("utilityExpense", expenseByCategory.getOrDefault("관리비", BigDecimal.ZERO));
            expenses.put("officeExpense", expenseByCategory.getOrDefault("사무용품", BigDecimal.ZERO));
            expenses.put("taxExpense", expenseByCategory.getOrDefault("세금", BigDecimal.ZERO));
            
            // 기타 비용 (급여, 임대료, 관리비, 사무용품, 세금 제외)
            BigDecimal otherExpense = expenseByCategory.entrySet().stream()
                .filter(entry -> !Arrays.asList("급여", "임대료", "관리비", "사무용품", "세금").contains(entry.getKey()))
                .map(Map.Entry::getValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            expenses.put("otherExpense", otherExpense);
            
        } catch (Exception e) {
            log.error("비용 데이터 조회 실패: {}", e.getMessage(), e);
            expenses.put("salaryExpense", BigDecimal.ZERO);
            expenses.put("rentExpense", BigDecimal.ZERO);
            expenses.put("utilityExpense", BigDecimal.ZERO);
            expenses.put("officeExpense", BigDecimal.ZERO);
            expenses.put("taxExpense", BigDecimal.ZERO);
            expenses.put("otherExpense", BigDecimal.ZERO);
        }
        BigDecimal totalExpenses = expenses.values().stream()
                .map(amount -> (BigDecimal) amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        expenses.put("total", totalExpenses);
        incomeStatement.put("expenses", expenses);
        
        // 순이익 계산
        BigDecimal netIncome = totalRevenue.subtract(totalExpenses);
        incomeStatement.put("netIncome", netIncome);
        
        return incomeStatement;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getDailyFinanceReport(String reportDate) {
        log.info("일단위 재무 리포트 조회: {}", reportDate);
        
        Map<String, Object> dailyReport = new HashMap<>();
        dailyReport.put("reportDate", reportDate);
        dailyReport.put("reportType", "일간");
        
        // 일일 수입
        Map<String, Object> dailyIncome = new HashMap<>();
        dailyIncome.put("consultationFees", BigDecimal.valueOf(500000)); // 상담료
        dailyIncome.put("otherIncome", BigDecimal.valueOf(50000)); // 기타수입
        BigDecimal totalDailyIncome = dailyIncome.values().stream()
                .map(amount -> (BigDecimal) amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dailyIncome.put("total", totalDailyIncome);
        dailyReport.put("dailyIncome", dailyIncome);
        
        // 일일 지출
        Map<String, Object> dailyExpenses = new HashMap<>();
        dailyExpenses.put("salary", BigDecimal.valueOf(200000)); // 급여
        dailyExpenses.put("officeSupplies", BigDecimal.valueOf(30000)); // 사무용품
        dailyExpenses.put("utilities", BigDecimal.valueOf(10000)); // 관리비
        dailyExpenses.put("otherExpenses", BigDecimal.valueOf(20000)); // 기타지출
        BigDecimal totalDailyExpenses = dailyExpenses.values().stream()
                .map(amount -> (BigDecimal) amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dailyExpenses.put("total", totalDailyExpenses);
        dailyReport.put("dailyExpenses", dailyExpenses);
        
        // 일일 순이익
        BigDecimal dailyNetIncome = totalDailyIncome.subtract(totalDailyExpenses);
        dailyReport.put("dailyNetIncome", dailyNetIncome);
        
        // 일일 거래 건수
        Map<String, Object> transactionCount = new HashMap<>();
        transactionCount.put("consultations", 10);
        transactionCount.put("purchases", 3);
        transactionCount.put("payments", 8);
        dailyReport.put("transactionCount", transactionCount);
        
        return dailyReport;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getMonthlyFinanceReport(String year, String month) {
        log.info("월단위 재무 리포트 조회: {}-{}", year, month);
        
        Map<String, Object> monthlyReport = new HashMap<>();
        monthlyReport.put("year", year);
        monthlyReport.put("month", month);
        monthlyReport.put("reportType", "월간");
        
        // 월간 수입
        Map<String, Object> monthlyIncome = new HashMap<>();
        monthlyIncome.put("consultationRevenue", BigDecimal.valueOf(15000000)); // 상담수익
        monthlyIncome.put("salaryIncome", BigDecimal.valueOf(0)); // 급여수입 (지출이므로 0)
        monthlyIncome.put("otherRevenue", BigDecimal.valueOf(500000)); // 기타수익
        BigDecimal totalMonthlyIncome = monthlyIncome.values().stream()
                .map(amount -> (BigDecimal) amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        monthlyIncome.put("total", totalMonthlyIncome);
        monthlyReport.put("monthlyIncome", monthlyIncome);
        
        // 월간 지출
        Map<String, Object> monthlyExpenses = new HashMap<>();
        monthlyExpenses.put("salaryExpense", BigDecimal.valueOf(6000000)); // 급여지출
        monthlyExpenses.put("rentExpense", BigDecimal.valueOf(1200000)); // 임대료
        monthlyExpenses.put("utilityExpense", BigDecimal.valueOf(300000)); // 관리비
        monthlyExpenses.put("officeExpense", BigDecimal.valueOf(800000)); // 사무용품비
        monthlyExpenses.put("taxExpense", BigDecimal.valueOf(1500000)); // 세금
        monthlyExpenses.put("purchaseExpense", BigDecimal.valueOf(1000000)); // 구매비용
        BigDecimal totalMonthlyExpenses = monthlyExpenses.values().stream()
                .map(amount -> (BigDecimal) amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        monthlyExpenses.put("total", totalMonthlyExpenses);
        monthlyReport.put("monthlyExpenses", monthlyExpenses);
        
        // 월간 순이익
        BigDecimal monthlyNetIncome = totalMonthlyIncome.subtract(totalMonthlyExpenses);
        monthlyReport.put("monthlyNetIncome", monthlyNetIncome);
        
        // 월간 통계
        Map<String, Object> monthlyStats = new HashMap<>();
        monthlyStats.put("totalConsultations", 300);
        monthlyStats.put("totalPurchases", 25);
        monthlyStats.put("totalPayments", 250);
        monthlyStats.put("averageDailyIncome", totalMonthlyIncome.divide(BigDecimal.valueOf(30), 0, java.math.RoundingMode.HALF_UP));
        monthlyStats.put("averageDailyExpense", totalMonthlyExpenses.divide(BigDecimal.valueOf(30), 0, java.math.RoundingMode.HALF_UP));
        monthlyReport.put("monthlyStats", monthlyStats);
        
        return monthlyReport;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getYearlyFinanceReport(String year) {
        log.info("년단위 재무 리포트 조회: {}", year);
        
        Map<String, Object> yearlyReport = new HashMap<>();
        yearlyReport.put("year", year);
        yearlyReport.put("reportType", "년간");
        
        // 연간 수입
        Map<String, Object> yearlyIncome = new HashMap<>();
        yearlyIncome.put("consultationRevenue", BigDecimal.valueOf(180000000)); // 상담수익
        yearlyIncome.put("otherRevenue", BigDecimal.valueOf(6000000)); // 기타수익
        BigDecimal totalYearlyIncome = yearlyIncome.values().stream()
                .map(amount -> (BigDecimal) amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        yearlyIncome.put("total", totalYearlyIncome);
        yearlyReport.put("yearlyIncome", yearlyIncome);
        
        // 연간 지출
        Map<String, Object> yearlyExpenses = new HashMap<>();
        yearlyExpenses.put("salaryExpense", BigDecimal.valueOf(72000000)); // 급여지출
        yearlyExpenses.put("rentExpense", BigDecimal.valueOf(14400000)); // 임대료
        yearlyExpenses.put("utilityExpense", BigDecimal.valueOf(3600000)); // 관리비
        yearlyExpenses.put("officeExpense", BigDecimal.valueOf(9600000)); // 사무용품비
        yearlyExpenses.put("taxExpense", BigDecimal.valueOf(18000000)); // 세금
        yearlyExpenses.put("purchaseExpense", BigDecimal.valueOf(12000000)); // 구매비용
        yearlyExpenses.put("otherExpense", BigDecimal.valueOf(2400000)); // 기타지출
        BigDecimal totalYearlyExpenses = yearlyExpenses.values().stream()
                .map(amount -> (BigDecimal) amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        yearlyExpenses.put("total", totalYearlyExpenses);
        yearlyReport.put("yearlyExpenses", yearlyExpenses);
        
        // 연간 순이익
        BigDecimal yearlyNetIncome = totalYearlyIncome.subtract(totalYearlyExpenses);
        yearlyReport.put("yearlyNetIncome", yearlyNetIncome);
        
        // 연간 통계
        Map<String, Object> yearlyStats = new HashMap<>();
        yearlyStats.put("totalConsultations", 3600);
        yearlyStats.put("totalPurchases", 300);
        yearlyStats.put("totalPayments", 3000);
        yearlyStats.put("averageMonthlyIncome", totalYearlyIncome.divide(BigDecimal.valueOf(12), 0, java.math.RoundingMode.HALF_UP));
        yearlyStats.put("averageMonthlyExpense", totalYearlyExpenses.divide(BigDecimal.valueOf(12), 0, java.math.RoundingMode.HALF_UP));
        yearlyStats.put("profitMargin", totalYearlyIncome.compareTo(BigDecimal.ZERO) > 0 ? 
            yearlyNetIncome.divide(totalYearlyIncome, 4, java.math.RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)) : BigDecimal.ZERO);
        yearlyReport.put("yearlyStats", yearlyStats);
        
        // 월별 추이
        Map<String, Object> monthlyTrend = new HashMap<>();
        for (int i = 1; i <= 12; i++) {
            String monthKey = String.format("%02d", i);
            monthlyTrend.put(monthKey + "월수입", BigDecimal.valueOf(15000000));
            monthlyTrend.put(monthKey + "월지출", BigDecimal.valueOf(12000000));
            monthlyTrend.put(monthKey + "월순이익", BigDecimal.valueOf(3000000));
        }
        yearlyReport.put("monthlyTrend", monthlyTrend);
        
        return yearlyReport;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getFinanceTrendAnalysis(String startDate, String endDate, String periodType) {
        log.info("재무 트렌드 분석: {} ~ {}, 기간: {}", startDate, endDate, periodType);
        
        Map<String, Object> trendAnalysis = new HashMap<>();
        trendAnalysis.put("startDate", startDate);
        trendAnalysis.put("endDate", endDate);
        trendAnalysis.put("periodType", periodType);
        
        // 기간별 데이터 생성
        Map<String, Object> periodData = new HashMap<>();
        
        if ("DAILY".equals(periodType)) {
            // 일별 데이터
            for (int i = 0; i < 30; i++) {
                String dateKey = "day_" + (i + 1);
                Map<String, Object> dayData = new HashMap<>();
                dayData.put("income", BigDecimal.valueOf(500000 + (i * 10000)));
                dayData.put("expense", BigDecimal.valueOf(250000 + (i * 5000)));
                dayData.put("netIncome", BigDecimal.valueOf(250000 + (i * 5000)));
                periodData.put(dateKey, dayData);
            }
        } else if ("MONTHLY".equals(periodType)) {
            // 월별 데이터
            for (int i = 0; i < 12; i++) {
                String monthKey = (i + 1) + "월";
                Map<String, Object> monthData = new HashMap<>();
                monthData.put("income", BigDecimal.valueOf(15000000 + (i * 1000000)));
                monthData.put("expense", BigDecimal.valueOf(12000000 + (i * 800000)));
                monthData.put("netIncome", BigDecimal.valueOf(3000000 + (i * 200000)));
                periodData.put(monthKey, monthData);
            }
        } else if ("YEARLY".equals(periodType)) {
            // 년별 데이터
            for (int i = 0; i < 3; i++) {
                String yearKey = (2022 + i) + "년";
                Map<String, Object> yearData = new HashMap<>();
                yearData.put("income", BigDecimal.valueOf(180000000 + (i * 20000000)));
                yearData.put("expense", BigDecimal.valueOf(144000000 + (i * 15000000)));
                yearData.put("netIncome", BigDecimal.valueOf(36000000 + (i * 5000000)));
                periodData.put(yearKey, yearData);
            }
        }
        
        trendAnalysis.put("periodData", periodData);
        
        // 트렌드 분석 결과
        Map<String, Object> analysis = new HashMap<>();
        analysis.put("trendDirection", "상승"); // 상승, 하락, 안정
        analysis.put("growthRate", "12.5%"); // 성장률
        analysis.put("volatility", "낮음"); // 변동성
        analysis.put("seasonality", "있음"); // 계절성
        trendAnalysis.put("analysis", analysis);
        
        return trendAnalysis;
    }
    
    /**
     * 구매 요청 승인 시 자동으로 지출 거래 생성
     */
    private void createPurchaseExpenseTransaction(PurchaseRequest purchaseRequest) {
        log.info("구매 지출 거래 생성 시작: RequestID={}, Amount={}", 
            purchaseRequest.getId(), purchaseRequest.getTotalAmount());
        
        // 구매 항목에 따른 부가세 적용 여부 확인
        String category = getPurchaseCategory(purchaseRequest.getItem().getCategory());
        boolean isVatApplicable = TaxCalculationUtil.isVatApplicable(category);
        
        TaxCalculationUtil.TaxCalculationResult taxResult;
        if (isVatApplicable) {
            // 부가세 적용: 입력 금액은 부가세 제외 금액으로 간주
            taxResult = TaxCalculationUtil.calculateTaxForExpense(purchaseRequest.getTotalAmount());
        } else {
            // 부가세 미적용
            taxResult = new TaxCalculationUtil.TaxCalculationResult(
                purchaseRequest.getTotalAmount(), purchaseRequest.getTotalAmount(), BigDecimal.ZERO);
        }
        
        FinancialTransactionRequest request = FinancialTransactionRequest.builder()
                .transactionType("EXPENSE")
                .category(category)
                .subcategory(getPurchaseSubcategory(purchaseRequest.getItem().getCategory()))
                .amount(taxResult.getAmountIncludingTax()) // 부가세 포함 금액
                .amountBeforeTax(taxResult.getAmountExcludingTax()) // 부가세 제외 금액
                .taxAmount(taxResult.getVatAmount()) // 부가세 금액
                .description(String.format("%s 구매 - %s (수량: %d)", 
                    purchaseRequest.getItem().getName(),
                    purchaseRequest.getReason(),
                    purchaseRequest.getQuantity()))
                .transactionDate(java.time.LocalDate.now())
                .relatedEntityId(purchaseRequest.getId())
                .relatedEntityType("PURCHASE_REQUEST")
                .taxIncluded(isVatApplicable)
                .build();
        
        FinancialTransactionResponse response = financialTransactionService.createTransaction(request, null); // 시스템 자동 생성
        
        log.info("✅ 구매 지출 거래 생성 완료: TransactionID={}, RequestID={}, Amount={}", 
            response.getId(), purchaseRequest.getId(), purchaseRequest.getTotalAmount());
    }
    
    /**
     * 구매 항목 카테고리에 따른 지출 카테고리 반환 (공통 코드 사용)
     */
    private String getPurchaseCategory(String itemCategory) {
        if (itemCategory == null) {
            return "OFFICE_SUPPLIES"; // 기본값을 공통 코드 값으로 변경
        }
        
        switch (itemCategory.toUpperCase()) {
            case "OFFICE_SUPPLIES":
                return "OFFICE_SUPPLIES";
            case "MARKETING":
                return "MARKETING";
            case "RENT":
                return "RENT";
            case "MAINTENANCE":
                return "UTILITY";
            case "EQUIPMENT":
                return "EQUIPMENT";
            case "SOFTWARE":
                return "SOFTWARE";
            case "CONSULTING":
                return "CONSULTING";
            default:
                return "OTHER";
        }
    }
    
    /**
     * 구매 항목 카테고리에 따른 세부 카테고리 반환 (공통 코드 사용)
     */
    private String getPurchaseSubcategory(String itemCategory) {
        if (itemCategory == null) {
            return "STATIONERY"; // 기본값을 공통 코드 값으로 변경
        }
        
        switch (itemCategory.toUpperCase()) {
            case "OFFICE_SUPPLIES":
                return "STATIONERY";
            case "MARKETING":
                return "ONLINE_ADS";
            case "RENT":
                return "OFFICE_RENT";
            case "MAINTENANCE":
                return "MAINTENANCE_FEE";
            case "EQUIPMENT":
                return "COMPUTER";
            case "SOFTWARE":
                return "LICENSE";
            case "CONSULTING":
                return "EXTERNAL_CONSULTING";
            default:
                return "OTHER_EXPENSE";
        }
    }
}

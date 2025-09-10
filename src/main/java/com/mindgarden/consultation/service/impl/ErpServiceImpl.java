package com.mindgarden.consultation.service.impl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.mindgarden.consultation.entity.Budget;
import com.mindgarden.consultation.entity.Item;
import com.mindgarden.consultation.entity.PurchaseOrder;
import com.mindgarden.consultation.entity.PurchaseRequest;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.repository.BudgetRepository;
import com.mindgarden.consultation.repository.ItemRepository;
import com.mindgarden.consultation.repository.PurchaseOrderRepository;
import com.mindgarden.consultation.repository.PurchaseRequestRepository;
import com.mindgarden.consultation.service.ErpService;
import com.mindgarden.consultation.service.UserService;
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
        
        request.setStatus(PurchaseRequest.PurchaseRequestStatus.SUPER_ADMIN_APPROVED);
        request.setSuperAdminApprover(superAdmin);
        request.setSuperAdminApprovedAt(LocalDateTime.now());
        request.setSuperAdminComment(comment);
        
        purchaseRequestRepository.save(request);
        
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
        
        request.setStatus(PurchaseRequest.PurchaseRequestStatus.SUPER_ADMIN_REJECTED);
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
        
        if (request.getStatus() != PurchaseRequest.PurchaseRequestStatus.SUPER_ADMIN_APPROVED) {
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
}

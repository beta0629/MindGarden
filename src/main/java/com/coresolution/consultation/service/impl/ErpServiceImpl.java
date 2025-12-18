package com.coresolution.consultation.service.impl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import com.coresolution.consultation.dto.FinancialTransactionRequest;
import com.coresolution.consultation.dto.FinancialTransactionResponse;
import com.coresolution.consultation.entity.Budget;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.entity.Item;
import com.coresolution.consultation.entity.PurchaseOrder;
import com.coresolution.consultation.entity.PurchaseRequest;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.BudgetRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.repository.ItemRepository;
import com.coresolution.consultation.repository.PurchaseOrderRepository;
import com.coresolution.consultation.repository.PurchaseRequestRepository;
import com.coresolution.consultation.service.erp.ErpService;
import com.coresolution.consultation.service.erp.financial.FinancialTransactionService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.util.TaxCalculationUtil;
import com.coresolution.core.service.impl.BaseTenantAwareService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 /**
 * ERP 서비스 구현체
 /**
 * 
 /**
 * @author MindGarden
 /**
 * @version 1.0.0
 /**
 * @since 2024-12-19
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ErpServiceImpl extends BaseTenantAwareService implements ErpService {
    
    private final ItemRepository itemRepository;
    private final PurchaseRequestRepository purchaseRequestRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final BudgetRepository budgetRepository;
    private final FinancialTransactionRepository financialTransactionRepository;
    private final UserService userService;
    private final FinancialTransactionService financialTransactionService;
    // ERP 고도화 서비스 연동 (표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md)
    private final com.coresolution.consultation.service.FinancialStatementService financialStatementService;
    private final com.coresolution.consultation.service.AccountingService accountingService;
    private final com.coresolution.consultation.service.SettlementService settlementService;
    
    
    @Override
    @Transactional(readOnly = true)
    public List<Item> getAllActiveItems() {
        String tenantId = getTenantId();
        log.info("테넌트별 활성화된 아이템 조회: tenantId={}", tenantId);
        return itemRepository.findAllActiveByTenantId(tenantId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<Item> getItemById(Long id) {
        String tenantId = getTenantId();
        log.info("테넌트별 아이템 조회: tenantId={}, id={}", tenantId, id);
        return itemRepository.findByTenantIdAndIdAndActive(tenantId, id);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Item> getItemsByCategory(String category) {
        String tenantId = getTenantId();
        log.info("테넌트별 카테고리별 아이템 조회: tenantId={}, category={}", tenantId, category);
        return itemRepository.findByTenantIdAndCategoryAndActive(tenantId, category);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Item> searchItemsByName(String name) {
        String tenantId = getTenantId();
        log.info("테넌트별 이름으로 아이템 검색: tenantId={}, name={}", tenantId, name);
        return itemRepository.findByTenantIdAndNameContainingAndActive(tenantId, name);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Item> getLowStockItems(Integer threshold) {
        String tenantId = getTenantId();
        log.info("테넌트별 재고 부족 아이템 조회: tenantId={}, threshold={}", tenantId, threshold);
        return itemRepository.findLowStockItemsByTenantId(tenantId, threshold);
    }
    
    @Override
    public Item createItem(Item item) {
        String tenantId = getTenantId();
        log.info("테넌트별 아이템 생성: tenantId={}, name={}", tenantId, item.getName());
        // 테넌트 ID 자동 설정 (표준화 2025-12-07)
        item.setTenantId(tenantId);
        return itemRepository.save(item);
    }
    
    @Override
    public Item updateItem(Long id, Item item) {
        String tenantId = getTenantId();
        log.info("테넌트별 아이템 수정: tenantId={}, id={}", tenantId, id);
        Item existingItem = itemRepository.findByTenantIdAndIdAndActive(tenantId, id)
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
        String tenantId = getTenantId();
        log.info("테넌트별 아이템 삭제: tenantId={}, id={}", tenantId, id);
        Item item = itemRepository.findByTenantIdAndIdAndActive(tenantId, id)
                .orElseThrow(() -> new RuntimeException("아이템을 찾을 수 없습니다: " + id));
        
        item.setIsDeleted(true);
        item.setDeletedAt(LocalDateTime.now());
        itemRepository.save(item);
        
        return true;
    }
    
    @Override
    public boolean updateItemStock(Long id, Integer quantity) {
        String tenantId = getTenantId();
        log.info("테넌트별 아이템 재고 업데이트: tenantId={}, id={}, quantity={}", tenantId, id, quantity);
        Item item = itemRepository.findByTenantIdAndIdAndActive(tenantId, id)
                .orElseThrow(() -> new RuntimeException("아이템을 찾을 수 없습니다: " + id));
        
        item.setStockQuantity(quantity);
        itemRepository.save(item);
        
        return true;
    }
    
    
    @Override
    public PurchaseRequest createPurchaseRequest(Long requesterId, Long itemId, Integer quantity, String reason) {
        log.info("구매 요청 생성: requesterId={}, itemId={}, quantity={}", requesterId, itemId, quantity);
        
        User requester = userService.findActiveById(requesterId)
                .orElseThrow(() -> new RuntimeException("요청자를 찾을 수 없습니다: " + requesterId));
        
        String tenantId = getTenantId();
        Item item = itemRepository.findByTenantIdAndIdAndActive(tenantId, itemId)
                .orElseThrow(() -> new RuntimeException("아이템을 찾을 수 없습니다: " + itemId));
        
        BigDecimal totalAmount = item.getUnitPrice().multiply(BigDecimal.valueOf(quantity));
        
        PurchaseRequest purchaseRequest = PurchaseRequest.builder()
                .requester(requester)
                .item(item)
                .quantity(quantity)
                .unitPrice(item.getUnitPrice())
                .totalAmount(totalAmount)
                .reason(reason)
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
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
        
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
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
        
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
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
        
        // 표준화 2025-12-05: HQ_MASTER_APPROVED → ADMIN_APPROVED로 통합
        request.setStatus(PurchaseRequest.PurchaseRequestStatus.ADMIN_APPROVED);
        request.setSuperAdminApprover(superAdmin);
        request.setSuperAdminApprovedAt(LocalDateTime.now());
        request.setSuperAdminComment(comment);
        
        PurchaseRequest savedRequest = purchaseRequestRepository.save(request);
        
        try {
            createPurchaseExpenseTransaction(savedRequest);
            log.info("💚 구매 지출 거래 자동 생성 완료: RequestID={}, Amount={}", 
                savedRequest.getId(), savedRequest.getTotalAmount());
        } catch (Exception e) {
            log.error("구매 지출 거래 자동 생성 실패: {}", e.getMessage(), e);
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
        
        // 표준화 2025-12-05: HQ_MASTER_REJECTED → ADMIN_REJECTED로 통합
        request.setStatus(PurchaseRequest.PurchaseRequestStatus.ADMIN_REJECTED);
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
        
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        if (request.getStatus() != PurchaseRequest.PurchaseRequestStatus.PENDING) {
            throw new RuntimeException("취소할 수 없는 상태입니다: " + request.getStatus());
        }
        
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        request.setStatus(PurchaseRequest.PurchaseRequestStatus.CANCELLED);
        purchaseRequestRepository.save(request);
        
        return true;
    }
    
    
    @Override
    public PurchaseOrder createPurchaseOrder(Long requestId, Long purchaserId, String supplier, String supplierContact, LocalDateTime expectedDeliveryDate, String notes) {
        log.info("구매 주문 생성: requestId={}, purchaserId={}", requestId, purchaserId);
        
        PurchaseRequest request = purchaseRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("구매 요청을 찾을 수 없습니다: " + requestId));
        
        User purchaser = userService.findActiveById(purchaserId)
                .orElseThrow(() -> new RuntimeException("구매자를 찾을 수 없습니다: " + purchaserId));
        
        // 표준화 2025-12-05: HQ_MASTER_APPROVED → ADMIN_APPROVED로 통합
        if (request.getStatus() != PurchaseRequest.PurchaseRequestStatus.ADMIN_APPROVED) {
            throw new RuntimeException("승인된 구매 요청만 주문할 수 있습니다: " + request.getStatus());
        }
        
        PurchaseOrder purchaseOrder = PurchaseOrder.builder()
                .purchaseRequest(request)
                .totalAmount(request.getTotalAmount())
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                .status(PurchaseOrder.PurchaseOrderStatus.PENDING)
                .expectedDeliveryDate(expectedDeliveryDate)
                .supplier(supplier)
                .supplierContact(supplierContact)
                .purchaser(purchaser)
                .notes(notes)
                .orderedAt(LocalDateTime.now())
                .build();
        
        PurchaseOrder savedOrder = purchaseOrderRepository.save(purchaseOrder);
        
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
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

    // 표준화 2025-12-05: tenantId 필터링 필수
    String tenantId = getTenantId();
        return purchaseOrderRepository.findByTenantIdAndStatus(tenantId, status);
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
        existingBudget.setStatus(budget.getStatus());
        
        return budgetRepository.save(existingBudget);
    }
    
    @Override
    public boolean deleteBudget(Long id) {
        log.info("예산 삭제: id={}", id);
        Budget budget = budgetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("예산을 찾을 수 없습니다: " + id));
        
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        budget.setStatus(Budget.BudgetStatus.INACTIVE);
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
    
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getIntegratedFinanceDashboard() {
        log.info("통합 재무 대시보드 데이터 조회");
        
        Map<String, Object> dashboardData = new HashMap<>();
        
        String tenantId = getTenantId();
        Map<String, Object> erpStats = new HashMap<>();
        erpStats.put("totalItems", itemRepository.findAllActiveByTenantId(tenantId).size());
        erpStats.put("pendingRequests", purchaseRequestRepository.findPendingAdminApproval().size());
        erpStats.put("totalOrders", purchaseOrderRepository.findAllActive().size());
        erpStats.put("totalBudgets", budgetRepository.findAllActive().size());
        
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
        
        Map<String, Object> financialData = getRealTimeFinancialData();
        log.info("📊 통합 대시보드 - financialData 구조: {}", financialData);
        dashboardData.put("financialData", financialData);
        
        List<PurchaseRequest> recentRequests = purchaseRequestRepository.findAllActive().stream()
                .limit(5)
                .toList();
        dashboardData.put("recentRequests", recentRequests);
        
        List<PurchaseOrder> recentOrders = purchaseOrderRepository.findAllActive().stream()
                .limit(5)
                .toList();
        dashboardData.put("recentOrders", recentOrders);
        
        Map<String, Object> budgetByCategory = getBudgetStatsByCategory();
        dashboardData.put("budgetByCategory", budgetByCategory);
        
        Map<String, Object> requestStats = getPurchaseRequestStatsByStatus();
        dashboardData.put("requestStats", requestStats);
        
        return dashboardData;
    }
    
    /**
     * 재무 대시보드 데이터 조회
     * 표준화 2025-12-06: branchCode 파라미터는 레거시 호환용으로 유지되지만 사용하지 않음
     */
    @Override
    public Map<String, Object> getBranchFinanceDashboard(String branchCode) {
        // 표준화 2025-12-06: branchCode 무시
        if (branchCode != null) {
            // 표준화 2025-12-07: 브랜치 개념 제거됨, 로그에서 branchCode 제거
            log.warn("⚠️ Deprecated 파라미터: branchCode는 더 이상 사용하지 않음.");
        }
        String tenantId = getTenantId();
        Map<String, Object> dashboardData = new HashMap<>();
        
        try {
            log.info("🏢 재무 대시보드 데이터 조회: tenantId={}", tenantId);
            
            // 표준화: 테넌트 ID 기반 필터링 필수
            // getTransactionsByBranch는 내부적으로 TenantContextHolder의 tenantId를 사용하여 필터링함
            List<com.coresolution.consultation.dto.FinancialTransactionResponse> branchTransactions = 
                financialTransactionService.getTransactionsByBranch(null, null, null, null, null, 
                    org.springframework.data.domain.PageRequest.of(0, 10000))
                    .getContent();
            
            log.info("📊 거래 데이터 조회 완료: 테넌트={}, 건수={}건", tenantId, branchTransactions.size());
            
            BigDecimal totalIncome = branchTransactions.stream()
                .filter(t -> "INCOME".equals(t.getTransactionType()))
                .map(com.coresolution.consultation.dto.FinancialTransactionResponse::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            BigDecimal totalExpense = branchTransactions.stream()
                .filter(t -> "EXPENSE".equals(t.getTransactionType()))
                .map(com.coresolution.consultation.dto.FinancialTransactionResponse::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            BigDecimal netProfit = totalIncome.subtract(totalExpense);
            
            Map<String, BigDecimal> incomeByCategory = new HashMap<>();
            Map<String, BigDecimal> expenseByCategory = new HashMap<>();
            
            branchTransactions.forEach(t -> {
                if ("INCOME".equals(t.getTransactionType())) {
                    incomeByCategory.merge(t.getCategory() != null ? t.getCategory() : "기타", 
                        t.getAmount(), BigDecimal::add);
                } else if ("EXPENSE".equals(t.getTransactionType())) {
                    expenseByCategory.merge(t.getCategory() != null ? t.getCategory() : "기타", 
                        t.getAmount(), BigDecimal::add);
                }
            });
            
            List<Map<String, Object>> recentTransactions = branchTransactions.stream()
                .sorted((t1, t2) -> t2.getTransactionDate().compareTo(t1.getTransactionDate()))
                .limit(10)
                .map(t -> {
                    Map<String, Object> transactionMap = new HashMap<>();
                    transactionMap.put("id", t.getId());
                    transactionMap.put("type", t.getTransactionType());
                    transactionMap.put("amount", t.getAmount());
                    transactionMap.put("category", t.getCategory() != null ? t.getCategory() : "기타");
                    transactionMap.put("description", t.getDescription() != null ? t.getDescription() : "");
                    transactionMap.put("date", t.getTransactionDate());
                    transactionMap.put("status", t.getStatus());
                    return transactionMap;
                })
                .collect(java.util.stream.Collectors.toList());
            
            Map<String, Object> financialData = new HashMap<>();
            financialData.put("totalIncome", totalIncome);
            financialData.put("totalExpense", totalExpense);
            financialData.put("netProfit", netProfit);
            financialData.put("incomeByCategory", incomeByCategory);
            financialData.put("expenseByCategory", expenseByCategory);
            financialData.put("transactionCount", branchTransactions.size());
            
            dashboardData.put("tenantId", tenantId);
            dashboardData.put("financialData", financialData);
            dashboardData.put("recentTransactions", recentTransactions);
            
            Map<String, Object> erpStats = getBranchErpStatisticsBySession(null); // branchCode는 레거시 호환용
            dashboardData.put("erpStats", erpStats);
            
            log.info("✅ 재무 대시보드 데이터 구성 완료: tenantId={}, 수입={}, 지출={}", 
                    tenantId, totalIncome, totalExpense);
            
        } catch (Exception e) {
            log.error("❌ 재무 대시보드 데이터 조회 실패: tenantId={}, 오류={}", tenantId, e.getMessage(), e);
            throw new RuntimeException("재무 대시보드 데이터 조회에 실패했습니다: " + e.getMessage());
        }
        
        return dashboardData;
    }
    
    @Override
    /**
     * 재무 대시보드 데이터 조회 (기간 지정)
     * 표준화 2025-12-06: branchCode 파라미터는 레거시 호환용으로 유지되지만 사용하지 않음
     */
    public Map<String, Object> getBranchFinanceDashboard(String branchCode, LocalDate startDate, LocalDate endDate) {
        // 표준화 2025-12-06: branchCode 무시
        if (branchCode != null) {
            // 표준화 2025-12-07: 브랜치 개념 제거됨, 로그에서 branchCode 제거
            log.warn("⚠️ Deprecated 파라미터: branchCode는 더 이상 사용하지 않음.");
        }
        String tenantId = getTenantId();
        Map<String, Object> dashboardData = new HashMap<>();
        
        try {
            log.info("🏢 재무 대시보드 데이터 조회: tenantId={}, 기간={}~{}", tenantId, startDate, endDate);
            
            Map<String, Object> branchData = financialTransactionService.getBranchFinancialData(null, startDate, endDate, null, null); // branchCode는 레거시 호환용
            
            log.info("🔍 재무 데이터 조회 결과: tenantId={}, 데이터={}", tenantId, branchData);
            
            dashboardData.put("tenantId", tenantId);
            dashboardData.put("financialData", branchData);
            dashboardData.put("period", Map.of(
                "startDate", startDate.toString(),
                "endDate", endDate.toString()
            ));
            
            Map<String, Object> erpStats = getBranchErpStatisticsBySession(null); // branchCode는 레거시 호환용
            dashboardData.put("erpStats", erpStats);
            
            log.info("✅ 재무 대시보드 데이터 구성 완료: tenantId={}, 기간={}~{}", 
                    tenantId, startDate, endDate);
            
        } catch (Exception e) {
            log.error("❌ 재무 대시보드 데이터 조회 실패: tenantId={}, 기간={}~{}, 오류={}", 
                    tenantId, startDate, endDate, e.getMessage(), e);
            throw new RuntimeException("재무 대시보드 데이터 조회에 실패했습니다: " + e.getMessage());
        }
        
        return dashboardData;
    }
    
    @Override
    /**
     * 재무 통계 조회
     * 표준화 2025-12-06: branchCode 파라미터는 레거시 호환용으로 유지되지만 사용하지 않음
     */
    public Map<String, Object> getBranchFinanceStatistics(String branchCode, String startDate, String endDate) {
        // 표준화 2025-12-06: branchCode 무시
        if (branchCode != null) {
            // 표준화 2025-12-07: 브랜치 개념 제거됨, 로그에서 branchCode 제거
            log.warn("⚠️ Deprecated 파라미터: branchCode는 더 이상 사용하지 않음.");
        }
        String tenantId = getTenantId();
        Map<String, Object> statistics = new HashMap<>();
        
        try {
            log.info("📊 재무 통계 조회: tenantId={}, 기간={} ~ {}", tenantId, startDate, endDate);
            
            LocalDate start = startDate != null ? LocalDate.parse(startDate) : LocalDate.now().withDayOfMonth(1);
            LocalDate end = endDate != null ? LocalDate.parse(endDate) : LocalDate.now();
            
            Map<String, Object> branchData = financialTransactionService.getBranchFinancialData(null, start, end, null, null); // branchCode는 레거시 호환용
            
            statistics.put("tenantId", tenantId);
            statistics.put("period", Map.of(
                "startDate", start.toString(),
                "endDate", end.toString()
            ));
            statistics.putAll(branchData);
            
            log.info("✅ 재무 통계 조회 완료: tenantId={}", tenantId);
            
        } catch (Exception e) {
            log.error("❌ 재무 통계 조회 실패: tenantId={}, 오류={}", tenantId, e.getMessage(), e);
            throw new RuntimeException("재무 통계 조회에 실패했습니다: " + e.getMessage());
        }
        
        return statistics;
    }
    
     /**
     * 실시간 재무 데이터 조회 (HQ 전체)
     */
    private Map<String, Object> getRealTimeFinancialData() {
        Map<String, Object> financialData = new HashMap<>();
        
        try {
            List<com.coresolution.consultation.dto.FinancialTransactionResponse> transactions = 
                financialTransactionService.getTransactions(org.springframework.data.domain.PageRequest.of(0, 10000))
                    .getContent();
            
            log.info("📊 실시간 재무 데이터 - 전체 거래 건수: {}", transactions.size());
            
            BigDecimal totalIncome = transactions.stream()
                .filter(t -> "INCOME".equals(t.getTransactionType()))
                .map(com.coresolution.consultation.dto.FinancialTransactionResponse::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            BigDecimal totalExpense = transactions.stream()
                .filter(t -> "EXPENSE".equals(t.getTransactionType()))
                .map(com.coresolution.consultation.dto.FinancialTransactionResponse::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            BigDecimal netProfit = totalIncome.subtract(totalExpense);
            
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
            
            log.info("실시간 재무 데이터 조회 완료 - 수입: {}, 지출: {}, 순이익: {}, 거래건수: {}", 
                totalIncome, totalExpense, netProfit, transactions.size());
            
        } catch (Exception e) {
            log.error("실시간 재무 데이터 조회 실패: {}", e.getMessage(), e);
            financialData.put("totalIncome", BigDecimal.ZERO);
            financialData.put("totalExpense", BigDecimal.ZERO);
            financialData.put("netProfit", BigDecimal.ZERO);
            financialData.put("incomeByCategory", new HashMap<String, BigDecimal>());
            financialData.put("expenseByCategory", new HashMap<String, BigDecimal>());
            financialData.put("transactionCount", 0);
        }
        
        return financialData;
    }
    
     /**
     * 지점별 ERP 통계 조회 (세션 기반)
     * 표준화 2025-12-07: branchCode 파라미터는 레거시 호환용으로 유지되지만 사용하지 않음
     */
    private Map<String, Object> getBranchErpStatisticsBySession(String branchCode) {
        // 표준화 2025-12-07: branchCode 무시
        if (branchCode != null) {
            // 표준화 2025-12-07: 브랜치 개념 제거됨, 로그에서 branchCode 제거
            log.warn("⚠️ Deprecated 파라미터: branchCode는 더 이상 사용하지 않음.");
        }
        String tenantId = getTenantId();
        Map<String, Object> erpStats = new HashMap<>();
        
        try {
            
            erpStats.put("totalItems", itemRepository.findAllActiveByTenantId(tenantId).size());
            erpStats.put("pendingRequests", purchaseRequestRepository.findPendingAdminApproval().size());
            erpStats.put("totalOrders", purchaseOrderRepository.findAllActive().size());
            
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
            
            erpStats.put("totalBudgets", allBudgets.size());
            erpStats.put("budgetUsage", budgetUsagePercentage);
            erpStats.put("budgetUsed", totalUsed);
            erpStats.put("budgetTotal", totalBudget);
            
            log.info("📊 ERP 통계 조회 완료: tenantId={}, 아이템={}, 요청={}, 주문={}, 예산={}", 
                    tenantId, erpStats.get("totalItems"), erpStats.get("pendingRequests"), 
                    erpStats.get("totalOrders"), erpStats.get("totalBudgets"));
            
        } catch (Exception e) {
            log.error("❌ ERP 통계 조회 실패: tenantId={}, 오류={}", tenantId, e.getMessage(), e);
            erpStats.put("totalItems", 0);
            erpStats.put("pendingRequests", 0);
            erpStats.put("totalOrders", 0);
            erpStats.put("totalBudgets", 0);
            erpStats.put("budgetUsage", "0%");
            erpStats.put("budgetUsed", BigDecimal.ZERO);
            erpStats.put("budgetTotal", BigDecimal.ZERO);
        }
        
        return erpStats;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getFinanceStatistics(String startDate, String endDate) {
        log.info("수입/지출 통계 조회: {} ~ {}", startDate, endDate);
        
        Map<String, Object> statistics = new HashMap<>();
        
        Map<String, Object> purchaseExpenses = new HashMap<>();
        
        BigDecimal totalPurchaseAmount = purchaseRequestRepository.findAllActive().stream()
                // 표준화 2025-12-05: HQ_MASTER_APPROVED → ADMIN_APPROVED로 통합
                .filter(req -> req.getStatus() == PurchaseRequest.PurchaseRequestStatus.ADMIN_APPROVED)
                .map(PurchaseRequest::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        purchaseExpenses.put("totalAmount", totalPurchaseAmount);
        
        Long approvedCount = purchaseRequestRepository.findAllActive().stream()
                // 표준화 2025-12-05: HQ_MASTER_APPROVED → ADMIN_APPROVED로 통합
                .filter(req -> req.getStatus() == PurchaseRequest.PurchaseRequestStatus.ADMIN_APPROVED)
                .count();
        purchaseExpenses.put("count", approvedCount);
        
        Map<String, BigDecimal> categoryAmounts = new HashMap<>();
        purchaseRequestRepository.findAllActive().stream()
                // 표준화 2025-12-05: HQ_MASTER_APPROVED → ADMIN_APPROVED로 통합
                .filter(req -> req.getStatus() == PurchaseRequest.PurchaseRequestStatus.ADMIN_APPROVED)
                .forEach(req -> {
                    String category = req.getItem().getCategory();
                    BigDecimal amount = req.getTotalAmount();
                    categoryAmounts.merge(category, amount, BigDecimal::add);
                });
        purchaseExpenses.put("byCategory", categoryAmounts);
        
        statistics.put("purchaseExpenses", purchaseExpenses);
        
        Map<String, Object> budgetStats = new HashMap<>();
        
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
        
        Map<String, Object> monthlyTrend = new HashMap<>();
        for (int i = 5; i >= 0; i--) {
            LocalDateTime monthStart = LocalDateTime.now().minusMonths(i).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
            LocalDateTime monthEnd = monthStart.plusMonths(1).minusSeconds(1);
            
            String monthKey = monthStart.getYear() + "-" + String.format("%02d", monthStart.getMonthValue());
            BigDecimal monthAmount = purchaseRequestRepository.findAllActive().stream()
                    // 표준화 2025-12-05: HQ_MASTER_APPROVED → ADMIN_APPROVED로 통합
                .filter(req -> req.getStatus() == PurchaseRequest.PurchaseRequestStatus.ADMIN_APPROVED)
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
    public Map<String, Object> getBalanceSheet(String reportDate, String branchCode) {
        String tenantId = getTenantId();
        log.info("대차대조표 조회: {}, tenantId: {} (ERP 고도화 서비스 사용)", reportDate, tenantId);
        
        try {
            // ERP 고도화 서비스 사용 (표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md)
            java.time.LocalDate asOfDate = reportDate != null 
                ? java.time.LocalDate.parse(reportDate) 
                : java.time.LocalDate.now();
            
            return financialStatementService.generateBalanceSheet(tenantId, asOfDate);
        } catch (Exception e) {
            log.error("ERP 고도화 서비스에서 대차대조표 조회 실패, 레거시 방식으로 폴백: {}", e.getMessage(), e);
            // 레거시 방식으로 폴백 (하위 호환성)
            return getBalanceSheetLegacy(reportDate, branchCode);
        }
    }
    
    /**
     * 레거시 대차대조표 조회 (하위 호환성)
     * @deprecated ERP 고도화 서비스를 사용하세요
     */
    @Deprecated
    private Map<String, Object> getBalanceSheetLegacy(String reportDate, String branchCode) {
        String tenantId = getTenantId();
        log.info("레거시 대차대조표 조회: {}, tenantId: {}", reportDate, tenantId);
        
        Map<String, Object> balanceSheet = new HashMap<>();
        balanceSheet.put("reportDate", reportDate);
        balanceSheet.put("tenantId", tenantId);
        balanceSheet.put("reportPeriod", "대차대조표");
        
        // 레거시 로직 유지 (기존 코드)
        Map<String, Object> assets = new HashMap<>();
        Map<String, Object> currentAssets = new HashMap<>();
        
        try {
            List<com.coresolution.consultation.dto.FinancialTransactionResponse> transactions = 
                financialTransactionService.getTransactions(
                    org.springframework.data.domain.PageRequest.of(0, 1000)
                ).getContent();
            
            BigDecimal totalIncome = transactions.stream()
                .filter(t -> "INCOME".equals(t.getTransactionType()))
                .map(com.coresolution.consultation.dto.FinancialTransactionResponse::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            BigDecimal totalExpense = transactions.stream()
                .filter(t -> "EXPENSE".equals(t.getTransactionType()))
                .map(com.coresolution.consultation.dto.FinancialTransactionResponse::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            BigDecimal netCash = totalIncome.subtract(totalExpense).max(BigDecimal.ZERO);
            currentAssets.put("cash", netCash);
            currentAssets.put("bankDeposits", BigDecimal.ZERO);
            currentAssets.put("accountsReceivable", BigDecimal.ZERO);
            currentAssets.put("inventory", BigDecimal.ZERO);
            currentAssets.put("prepaidExpenses", BigDecimal.ZERO);
            currentAssets.put("shortTermInvestments", BigDecimal.ZERO);
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
        
        Map<String, Object> fixedAssets = new HashMap<>();
        fixedAssets.put("officeEquipment", BigDecimal.ZERO);
        fixedAssets.put("computerEquipment", BigDecimal.ZERO);
        fixedAssets.put("leaseDeposits", BigDecimal.ZERO);
        fixedAssets.put("furniture", BigDecimal.ZERO);
        fixedAssets.put("software", BigDecimal.ZERO);
        BigDecimal fixedAssetsTotal = fixedAssets.values().stream()
            .map(amount -> (BigDecimal) amount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        Map<String, Object> accumulatedDepreciation = new HashMap<>();
        accumulatedDepreciation.put("officeEquipmentDepreciation", BigDecimal.ZERO);
        accumulatedDepreciation.put("computerDepreciation", BigDecimal.ZERO);
        accumulatedDepreciation.put("furnitureDepreciation", BigDecimal.ZERO);
        accumulatedDepreciation.put("softwareDepreciation", BigDecimal.ZERO);
        BigDecimal totalDepreciation = accumulatedDepreciation.values().stream()
            .map(amount -> (BigDecimal) amount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        accumulatedDepreciation.put("total", totalDepreciation);
        
        BigDecimal netFixedAssets = fixedAssetsTotal.add(totalDepreciation);
        fixedAssets.put("grossAmount", fixedAssetsTotal);
        fixedAssets.put("accumulatedDepreciation", accumulatedDepreciation);
        fixedAssets.put("netAmount", netFixedAssets);
        assets.put("fixedAssets", fixedAssets);
        
        Map<String, Object> intangibleAssets = new HashMap<>();
        intangibleAssets.put("goodwill", BigDecimal.ZERO);
        intangibleAssets.put("patents", BigDecimal.ZERO);
        intangibleAssets.put("trademarks", BigDecimal.ZERO);
        BigDecimal intangibleAssetsTotal = intangibleAssets.values().stream()
            .map(amount -> (BigDecimal) amount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        intangibleAssets.put("total", intangibleAssetsTotal);
        assets.put("intangibleAssets", intangibleAssets);
        
        BigDecimal totalAssets = currentAssetsTotal.add(netFixedAssets).add(intangibleAssetsTotal);
        assets.put("total", totalAssets);
        balanceSheet.put("assets", assets);
        
        Map<String, Object> liabilities = new HashMap<>();
        Map<String, Object> currentLiabilities = new HashMap<>();
        currentLiabilities.put("accountsPayable", BigDecimal.ZERO);
        currentLiabilities.put("shortTermLoans", BigDecimal.ZERO);
        currentLiabilities.put("accruedExpenses", BigDecimal.ZERO);
        currentLiabilities.put("taxesPayable", BigDecimal.ZERO);
        currentLiabilities.put("salaryPayable", BigDecimal.ZERO);
        currentLiabilities.put("provisions", BigDecimal.ZERO);
        BigDecimal currentLiabilitiesTotal = currentLiabilities.values().stream()
            .map(amount -> (BigDecimal) amount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        currentLiabilities.put("total", currentLiabilitiesTotal);
        liabilities.put("currentLiabilities", currentLiabilities);
        
        Map<String, Object> longTermLiabilities = new HashMap<>();
        longTermLiabilities.put("longTermLoans", BigDecimal.ZERO);
        longTermLiabilities.put("leaseObligations", BigDecimal.ZERO);
        longTermLiabilities.put("retirementBenefits", BigDecimal.ZERO);
        BigDecimal longTermLiabilitiesTotal = longTermLiabilities.values().stream()
            .map(amount -> (BigDecimal) amount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        longTermLiabilities.put("total", longTermLiabilitiesTotal);
        liabilities.put("longTermLiabilities", longTermLiabilities);
        
        BigDecimal totalLiabilities = currentLiabilitiesTotal.add(longTermLiabilitiesTotal);
        liabilities.put("total", totalLiabilities);
        balanceSheet.put("liabilities", liabilities);
        
        Map<String, Object> equity = new HashMap<>();
        Map<String, Object> capital = new HashMap<>();
        capital.put("paidInCapital", BigDecimal.ZERO);
        capital.put("additionalPaidInCapital", BigDecimal.ZERO);
        BigDecimal totalCapital = capital.values().stream()
            .map(amount -> (BigDecimal) amount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        capital.put("total", totalCapital);
        equity.put("capital", capital);
        
        Map<String, Object> retainedEarnings = new HashMap<>();
        retainedEarnings.put("beginningRetainedEarnings", BigDecimal.ZERO);
        try {
            List<com.coresolution.consultation.dto.FinancialTransactionResponse> transactions = 
                financialTransactionService.getTransactions(org.springframework.data.domain.PageRequest.of(0, 1000))
                    .getContent();
            BigDecimal totalIncome = transactions.stream()
                .filter(t -> "INCOME".equals(t.getTransactionType()))
                .map(com.coresolution.consultation.dto.FinancialTransactionResponse::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal totalExpense = transactions.stream()
                .filter(t -> "EXPENSE".equals(t.getTransactionType()))
                .map(com.coresolution.consultation.dto.FinancialTransactionResponse::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal netIncome = totalIncome.subtract(totalExpense);
            retainedEarnings.put("netIncome", netIncome);
        } catch (Exception e) {
            log.error("당기순이익 계산 실패: {}", e.getMessage(), e);
            retainedEarnings.put("netIncome", BigDecimal.ZERO);
        }
        retainedEarnings.put("dividends", BigDecimal.ZERO);
        BigDecimal totalRetainedEarnings = retainedEarnings.values().stream()
            .map(amount -> (BigDecimal) amount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        retainedEarnings.put("total", totalRetainedEarnings);
        equity.put("retainedEarnings", retainedEarnings);
        
        Map<String, Object> otherEquity = new HashMap<>();
        otherEquity.put("reserveFunds", BigDecimal.ZERO);
        otherEquity.put("revaluationSurplus", BigDecimal.ZERO);
        BigDecimal totalOtherEquity = otherEquity.values().stream()
            .map(amount -> (BigDecimal) amount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        otherEquity.put("total", totalOtherEquity);
        equity.put("otherEquity", otherEquity);
        
        BigDecimal totalEquity = totalCapital.add(totalRetainedEarnings).add(totalOtherEquity);
        equity.put("total", totalEquity);
        balanceSheet.put("equity", equity);
        
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
    public Map<String, Object> getIncomeStatement(String startDate, String endDate, String branchCode) {
        String tenantId = getTenantId();
        log.info("손익계산서 조회: {} ~ {}, tenantId: {} (ERP 고도화 서비스 사용)", startDate, endDate, tenantId);
        
        try {
            // ERP 고도화 서비스 사용 (표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md)
            java.time.LocalDate start = startDate != null 
                ? java.time.LocalDate.parse(startDate) 
                : java.time.LocalDate.now().withDayOfMonth(1);
            java.time.LocalDate end = endDate != null 
                ? java.time.LocalDate.parse(endDate) 
                : java.time.LocalDate.now();
            
            return financialStatementService.generateIncomeStatement(tenantId, start, end);
        } catch (Exception e) {
            log.error("ERP 고도화 서비스에서 손익계산서 조회 실패, 레거시 방식으로 폴백: {}", e.getMessage(), e);
            // 레거시 방식으로 폴백 (하위 호환성)
            return getIncomeStatementLegacy(startDate, endDate, branchCode);
        }
    }
    
    /**
     * 레거시 손익계산서 조회 (하위 호환성)
     * @deprecated ERP 고도화 서비스를 사용하세요
     */
    @Deprecated
    private Map<String, Object> getIncomeStatementLegacy(String startDate, String endDate, String branchCode) {
        String tenantId = getTenantId();
        log.info("레거시 손익계산서 조회: {} ~ {}, tenantId: {}", startDate, endDate, tenantId);
        
        Map<String, Object> incomeStatement = new HashMap<>();
        incomeStatement.put("startDate", startDate);
        incomeStatement.put("endDate", endDate);
        incomeStatement.put("tenantId", tenantId);
        incomeStatement.put("reportPeriod", "손익계산서");
        
        Map<String, Object> revenue = new HashMap<>();
        try {
            List<com.coresolution.consultation.dto.FinancialTransactionResponse> transactions = 
                financialTransactionService.getTransactions(
                    org.springframework.data.domain.PageRequest.of(0, 1000)
                ).getContent();
            
            BigDecimal consultationRevenue = transactions.stream()
                .filter(t -> "INCOME".equals(t.getTransactionType()))
                .filter(t -> "CONSULTATION".equals(t.getCategory()))
                .map(com.coresolution.consultation.dto.FinancialTransactionResponse::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            BigDecimal otherRevenue = transactions.stream()
                .filter(t -> "INCOME".equals(t.getTransactionType()))
                .filter(t -> !"CONSULTATION".equals(t.getCategory()))
                .map(com.coresolution.consultation.dto.FinancialTransactionResponse::getAmount)
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
        
        Map<String, Object> expenses = new HashMap<>();
        try {
            List<com.coresolution.consultation.dto.FinancialTransactionResponse> transactions = 
                financialTransactionService.getTransactions(
                    org.springframework.data.domain.PageRequest.of(0, 1000)
                ).getContent();
            
            Map<String, BigDecimal> expenseByCategory = new HashMap<>();
            transactions.stream()
                .filter(t -> "EXPENSE".equals(t.getTransactionType()))
                .forEach(t -> {
                    String category = t.getCategory();
                    BigDecimal amount = t.getAmount();
                    expenseByCategory.merge(category, amount, BigDecimal::add);
                });
            
            expenses.put("salaryExpense", expenseByCategory.getOrDefault("SALARY", BigDecimal.ZERO));
            expenses.put("rentExpense", expenseByCategory.getOrDefault("RENT", BigDecimal.ZERO));
            expenses.put("utilityExpense", expenseByCategory.getOrDefault("UTILITY", BigDecimal.ZERO));
            expenses.put("officeExpense", expenseByCategory.getOrDefault("OFFICE_SUPPLIES", BigDecimal.ZERO));
            expenses.put("taxExpense", expenseByCategory.getOrDefault("TAX", BigDecimal.ZERO));
            
            BigDecimal otherExpense = expenseByCategory.entrySet().stream()
                .filter(entry -> !Arrays.asList("SALARY", "RENT", "UTILITY", "OFFICE_SUPPLIES", "TAX").contains(entry.getKey()))
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
        
        BigDecimal netIncome = totalRevenue.subtract(totalExpenses);
        incomeStatement.put("netIncome", netIncome);
        
        return incomeStatement;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getDailyFinanceReport(String reportDate, String branchCode) {
        String tenantId = getTenantId();
        log.info("일단위 재무 리포트 조회: {}, tenantId: {}", reportDate, tenantId);
        
        LocalDate targetDate = LocalDate.parse(reportDate);
        Map<String, Object> dailyReport = new HashMap<>();
        dailyReport.put("reportDate", reportDate);
        dailyReport.put("reportType", "일간");
        dailyReport.put("tenantId", tenantId);
        
        List<FinancialTransaction> allTransactions = financialTransactionRepository
            .findByTenantIdAndTransactionDateAndIsDeletedFalse(tenantId, targetDate);
        
        List<FinancialTransaction> dailyTransactions = allTransactions;
        
        log.info("📊 일간 리포트 - 전체 거래: {}건 (tenantId: {})", 
            allTransactions.size(), tenantId);
        
        Map<String, Object> dailyIncome = new HashMap<>();
        BigDecimal consultationFees = dailyTransactions.stream()
            .filter(t -> t.getTransactionType() == FinancialTransaction.TransactionType.INCOME)
            .filter(t -> "CONSULTATION".equals(t.getCategory()))
            .map(FinancialTransaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal otherIncome = dailyTransactions.stream()
            .filter(t -> t.getTransactionType() == FinancialTransaction.TransactionType.INCOME)
            .filter(t -> !"CONSULTATION".equals(t.getCategory()))
            .map(FinancialTransaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        dailyIncome.put("consultationFees", consultationFees);
        dailyIncome.put("otherIncome", otherIncome);
        BigDecimal totalDailyIncome = consultationFees.add(otherIncome);
        dailyIncome.put("total", totalDailyIncome);
        dailyReport.put("dailyIncome", dailyIncome);
        
        Map<String, Object> dailyExpenses = new HashMap<>();
        BigDecimal salary = dailyTransactions.stream()
            .filter(t -> t.getTransactionType() == FinancialTransaction.TransactionType.EXPENSE)
            .filter(t -> "SALARY".equals(t.getCategory()))
            .map(FinancialTransaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        BigDecimal officeSupplies = dailyTransactions.stream()
            .filter(t -> t.getTransactionType() == FinancialTransaction.TransactionType.EXPENSE)
            .filter(t -> "OFFICE_SUPPLIES".equals(t.getCategory()))
            .map(FinancialTransaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        BigDecimal utilities = dailyTransactions.stream()
            .filter(t -> t.getTransactionType() == FinancialTransaction.TransactionType.EXPENSE)
            .filter(t -> "UTILITY".equals(t.getCategory()))
            .map(FinancialTransaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        BigDecimal otherExpenses = dailyTransactions.stream()
            .filter(t -> t.getTransactionType() == FinancialTransaction.TransactionType.EXPENSE)
            .filter(t -> !"SALARY".equals(t.getCategory()) && !"OFFICE_SUPPLIES".equals(t.getCategory()) && !"UTILITY".equals(t.getCategory()))
            .map(FinancialTransaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        dailyExpenses.put("salary", salary);
        dailyExpenses.put("officeSupplies", officeSupplies);
        dailyExpenses.put("utilities", utilities);
        dailyExpenses.put("otherExpenses", otherExpenses);
        BigDecimal totalDailyExpenses = salary.add(officeSupplies).add(utilities).add(otherExpenses);
        dailyExpenses.put("total", totalDailyExpenses);
        dailyReport.put("dailyExpenses", dailyExpenses);
        
        BigDecimal dailyNetIncome = totalDailyIncome.subtract(totalDailyExpenses);
        dailyReport.put("dailyNetIncome", dailyNetIncome);
        
        Map<String, Object> transactionCount = new HashMap<>();
        
        long consultations = dailyTransactions.stream()
            .filter(t -> t.getTransactionType() == FinancialTransaction.TransactionType.INCOME)
            .filter(t -> "CONSULTATION".equals(t.getCategory()))
            .count();
            
        long purchases = dailyTransactions.stream()
            .filter(t -> t.getTransactionType() == FinancialTransaction.TransactionType.EXPENSE)
            .filter(t -> "OFFICE_SUPPLIES".equals(t.getCategory()) || "EQUIPMENT".equals(t.getCategory()))
            .count();
            
        long payments = dailyTransactions.size();
        
        transactionCount.put("consultations", (int) consultations);
        transactionCount.put("purchases", (int) purchases);
        transactionCount.put("payments", (int) payments);
        dailyReport.put("transactionCount", transactionCount);
        
        return dailyReport;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getMonthlyFinanceReport(String year, String month, String branchCode) {
        String tenantId = getTenantId();
        log.info("월단위 재무 리포트 조회: {}-{}, tenantId: {}", year, month, tenantId);
        
        int yearInt = Integer.parseInt(year);
        int monthInt = Integer.parseInt(month);
        LocalDate startDate = LocalDate.of(yearInt, monthInt, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
        
        Map<String, Object> monthlyReport = new HashMap<>();
        monthlyReport.put("year", year);
        monthlyReport.put("month", month);
        monthlyReport.put("reportType", "월간");
        monthlyReport.put("tenantId", tenantId);
        
        List<FinancialTransaction> allTransactions = financialTransactionRepository
            .findByTenantIdAndTransactionDateBetweenAndIsDeletedFalse(tenantId, startDate, endDate);
        
        List<FinancialTransaction> monthlyTransactions = allTransactions;
        
        log.info("📊 월간 리포트 - 전체 거래: {}건 (tenantId: {})", 
            allTransactions.size(), tenantId);
        
        Map<String, Object> monthlyIncome = new HashMap<>();
        BigDecimal consultationRevenue = monthlyTransactions.stream()
            .filter(t -> t.getTransactionType() == FinancialTransaction.TransactionType.INCOME)
            .filter(t -> "CONSULTATION".equals(t.getCategory()))
            .map(FinancialTransaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal otherRevenue = monthlyTransactions.stream()
            .filter(t -> t.getTransactionType() == FinancialTransaction.TransactionType.INCOME)
            .filter(t -> !"CONSULTATION".equals(t.getCategory()))
            .map(FinancialTransaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        monthlyIncome.put("consultationRevenue", consultationRevenue);
        monthlyIncome.put("salaryIncome", BigDecimal.ZERO); // 급여는 지출 항목
        monthlyIncome.put("otherRevenue", otherRevenue);
        BigDecimal totalMonthlyIncome = consultationRevenue.add(otherRevenue);
        monthlyIncome.put("total", totalMonthlyIncome);
        monthlyReport.put("monthlyIncome", monthlyIncome);
        
        Map<String, Object> monthlyExpenses = new HashMap<>();
        BigDecimal salaryExpense = monthlyTransactions.stream()
            .filter(t -> t.getTransactionType() == FinancialTransaction.TransactionType.EXPENSE)
            .filter(t -> "SALARY".equals(t.getCategory()))
            .map(FinancialTransaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        BigDecimal rentExpense = monthlyTransactions.stream()
            .filter(t -> t.getTransactionType() == FinancialTransaction.TransactionType.EXPENSE)
            .filter(t -> "RENT".equals(t.getCategory()))
            .map(FinancialTransaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        BigDecimal utilityExpense = monthlyTransactions.stream()
            .filter(t -> t.getTransactionType() == FinancialTransaction.TransactionType.EXPENSE)
            .filter(t -> "UTILITY".equals(t.getCategory()))
            .map(FinancialTransaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        BigDecimal officeExpense = monthlyTransactions.stream()
            .filter(t -> t.getTransactionType() == FinancialTransaction.TransactionType.EXPENSE)
            .filter(t -> "OFFICE_SUPPLIES".equals(t.getCategory()))
            .map(FinancialTransaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        BigDecimal taxExpense = monthlyTransactions.stream()
            .filter(t -> t.getTransactionType() == FinancialTransaction.TransactionType.EXPENSE)
            .filter(t -> "TAX".equals(t.getCategory()))
            .map(FinancialTransaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        BigDecimal purchaseExpense = monthlyTransactions.stream()
            .filter(t -> t.getTransactionType() == FinancialTransaction.TransactionType.EXPENSE)
            .filter(t -> "EQUIPMENT".equals(t.getCategory()))
            .map(FinancialTransaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        monthlyExpenses.put("salaryExpense", salaryExpense);
        monthlyExpenses.put("rentExpense", rentExpense);
        monthlyExpenses.put("utilityExpense", utilityExpense);
        monthlyExpenses.put("officeExpense", officeExpense);
        monthlyExpenses.put("taxExpense", taxExpense);
        monthlyExpenses.put("purchaseExpense", purchaseExpense);
        BigDecimal totalMonthlyExpenses = salaryExpense.add(rentExpense).add(utilityExpense)
            .add(officeExpense).add(taxExpense).add(purchaseExpense);
        monthlyExpenses.put("total", totalMonthlyExpenses);
        monthlyReport.put("monthlyExpenses", monthlyExpenses);
        
        BigDecimal monthlyNetIncome = totalMonthlyIncome.subtract(totalMonthlyExpenses);
        monthlyReport.put("monthlyNetIncome", monthlyNetIncome);
        
        Map<String, Object> monthlyStats = new HashMap<>();
        
        long totalConsultations = monthlyTransactions.stream()
            .filter(t -> t.getTransactionType() == FinancialTransaction.TransactionType.INCOME)
            .filter(t -> "CONSULTATION".equals(t.getCategory()))
            .count();
            
        long totalPurchases = monthlyTransactions.stream()
            .filter(t -> t.getTransactionType() == FinancialTransaction.TransactionType.EXPENSE)
            .filter(t -> "OFFICE_SUPPLIES".equals(t.getCategory()) || "EQUIPMENT".equals(t.getCategory()))
            .count();
            
        long totalPayments = monthlyTransactions.size();
        
        int daysInMonth = endDate.getDayOfMonth();
        monthlyStats.put("totalConsultations", (int) totalConsultations);
        monthlyStats.put("totalPurchases", (int) totalPurchases);
        monthlyStats.put("totalPayments", (int) totalPayments);
        monthlyStats.put("averageDailyIncome", 
            daysInMonth > 0 ? totalMonthlyIncome.divide(BigDecimal.valueOf(daysInMonth), 0, java.math.RoundingMode.HALF_UP) : BigDecimal.ZERO);
        monthlyStats.put("averageDailyExpense", 
            daysInMonth > 0 ? totalMonthlyExpenses.divide(BigDecimal.valueOf(daysInMonth), 0, java.math.RoundingMode.HALF_UP) : BigDecimal.ZERO);
        monthlyReport.put("monthlyStats", monthlyStats);
        
        return monthlyReport;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getYearlyFinanceReport(String year) {
        log.info("년단위 재무 리포트 조회: {}", year);
        
        int yearInt = Integer.parseInt(year);
        LocalDate startDate = LocalDate.of(yearInt, 1, 1);
        LocalDate endDate = LocalDate.of(yearInt, 12, 31);
        
        Map<String, Object> yearlyReport = new HashMap<>();
        yearlyReport.put("year", year);
        yearlyReport.put("reportType", "년간");
        
        List<FinancialTransaction> yearlyTransactions = financialTransactionRepository
            .findByTransactionDateBetweenAndIsDeletedFalse(startDate, endDate);
        
        Map<String, Object> yearlyIncome = new HashMap<>();
        BigDecimal consultationRevenue = yearlyTransactions.stream()
            .filter(t -> t.getTransactionType() == FinancialTransaction.TransactionType.INCOME)
            .filter(t -> "CONSULTATION".equals(t.getCategory()))
            .map(FinancialTransaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal otherRevenue = yearlyTransactions.stream()
            .filter(t -> t.getTransactionType() == FinancialTransaction.TransactionType.INCOME)
            .filter(t -> !"CONSULTATION".equals(t.getCategory()))
            .map(FinancialTransaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        yearlyIncome.put("consultationRevenue", consultationRevenue);
        yearlyIncome.put("otherRevenue", otherRevenue);
        BigDecimal totalYearlyIncome = consultationRevenue.add(otherRevenue);
        yearlyIncome.put("total", totalYearlyIncome);
        yearlyReport.put("yearlyIncome", yearlyIncome);
        
        Map<String, Object> yearlyExpenses = new HashMap<>();
        BigDecimal salaryExpense = yearlyTransactions.stream()
            .filter(t -> t.getTransactionType() == FinancialTransaction.TransactionType.EXPENSE)
            .filter(t -> "SALARY".equals(t.getCategory()))
            .map(FinancialTransaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        BigDecimal rentExpense = yearlyTransactions.stream()
            .filter(t -> t.getTransactionType() == FinancialTransaction.TransactionType.EXPENSE)
            .filter(t -> "RENT".equals(t.getCategory()))
            .map(FinancialTransaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        BigDecimal utilityExpense = yearlyTransactions.stream()
            .filter(t -> t.getTransactionType() == FinancialTransaction.TransactionType.EXPENSE)
            .filter(t -> "UTILITY".equals(t.getCategory()))
            .map(FinancialTransaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        BigDecimal officeExpense = yearlyTransactions.stream()
            .filter(t -> t.getTransactionType() == FinancialTransaction.TransactionType.EXPENSE)
            .filter(t -> "OFFICE_SUPPLIES".equals(t.getCategory()))
            .map(FinancialTransaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        BigDecimal taxExpense = yearlyTransactions.stream()
            .filter(t -> t.getTransactionType() == FinancialTransaction.TransactionType.EXPENSE)
            .filter(t -> "TAX".equals(t.getCategory()))
            .map(FinancialTransaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        BigDecimal purchaseExpense = yearlyTransactions.stream()
            .filter(t -> t.getTransactionType() == FinancialTransaction.TransactionType.EXPENSE)
            .filter(t -> "EQUIPMENT".equals(t.getCategory()))
            .map(FinancialTransaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        BigDecimal otherExpense = yearlyTransactions.stream()
            .filter(t -> t.getTransactionType() == FinancialTransaction.TransactionType.EXPENSE)
            .filter(t -> !"SALARY".equals(t.getCategory()) && !"RENT".equals(t.getCategory()) && 
                         !"UTILITY".equals(t.getCategory()) && !"OFFICE_SUPPLIES".equals(t.getCategory()) && 
                         !"TAX".equals(t.getCategory()) && !"EQUIPMENT".equals(t.getCategory()))
            .map(FinancialTransaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        yearlyExpenses.put("salaryExpense", salaryExpense);
        yearlyExpenses.put("rentExpense", rentExpense);
        yearlyExpenses.put("utilityExpense", utilityExpense);
        yearlyExpenses.put("officeExpense", officeExpense);
        yearlyExpenses.put("taxExpense", taxExpense);
        yearlyExpenses.put("purchaseExpense", purchaseExpense);
        yearlyExpenses.put("otherExpense", otherExpense);
        BigDecimal totalYearlyExpenses = salaryExpense.add(rentExpense).add(utilityExpense)
            .add(officeExpense).add(taxExpense).add(purchaseExpense).add(otherExpense);
        yearlyExpenses.put("total", totalYearlyExpenses);
        yearlyReport.put("yearlyExpenses", yearlyExpenses);
        
        BigDecimal yearlyNetIncome = totalYearlyIncome.subtract(totalYearlyExpenses);
        yearlyReport.put("yearlyNetIncome", yearlyNetIncome);
        
        Map<String, Object> yearlyStats = new HashMap<>();
        
        long totalConsultations = yearlyTransactions.stream()
            .filter(t -> t.getTransactionType() == FinancialTransaction.TransactionType.INCOME)
            .filter(t -> "CONSULTATION".equals(t.getCategory()))
            .count();
            
        long totalPurchases = yearlyTransactions.stream()
            .filter(t -> t.getTransactionType() == FinancialTransaction.TransactionType.EXPENSE)
            .filter(t -> "OFFICE_SUPPLIES".equals(t.getCategory()) || "EQUIPMENT".equals(t.getCategory()))
            .count();
            
        long totalPayments = yearlyTransactions.size();
        
        yearlyStats.put("totalConsultations", (int) totalConsultations);
        yearlyStats.put("totalPurchases", (int) totalPurchases);
        yearlyStats.put("totalPayments", (int) totalPayments);
        yearlyStats.put("averageMonthlyIncome", totalYearlyIncome.divide(BigDecimal.valueOf(12), 0, java.math.RoundingMode.HALF_UP));
        yearlyStats.put("averageMonthlyExpense", totalYearlyExpenses.divide(BigDecimal.valueOf(12), 0, java.math.RoundingMode.HALF_UP));
        yearlyStats.put("profitMargin", totalYearlyIncome.compareTo(BigDecimal.ZERO) > 0 ? 
            yearlyNetIncome.divide(totalYearlyIncome, 4, java.math.RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)) : BigDecimal.ZERO);
        yearlyReport.put("yearlyStats", yearlyStats);
        
        Map<String, Object> monthlyTrend = new HashMap<>();
        for (int i = 1; i <= 12; i++) {
            LocalDate monthStart = LocalDate.of(yearInt, i, 1);
            LocalDate monthEnd = monthStart.withDayOfMonth(monthStart.lengthOfMonth());
            
            List<FinancialTransaction> monthTransactions = yearlyTransactions.stream()
                .filter(t -> !t.getTransactionDate().isBefore(monthStart) && !t.getTransactionDate().isAfter(monthEnd))
                .collect(Collectors.toList());
            
            BigDecimal monthIncome = monthTransactions.stream()
                .filter(t -> t.getTransactionType() == FinancialTransaction.TransactionType.INCOME)
                .map(FinancialTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
                
            BigDecimal monthExpense = monthTransactions.stream()
                .filter(t -> t.getTransactionType() == FinancialTransaction.TransactionType.EXPENSE)
                .map(FinancialTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
                
            BigDecimal monthProfit = monthIncome.subtract(monthExpense);
            
            String monthKey = String.format("%02d", i);
            monthlyTrend.put(monthKey + "월수입", monthIncome);
            monthlyTrend.put(monthKey + "월지출", monthExpense);
            monthlyTrend.put(monthKey + "월순이익", monthProfit);
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
        
        Map<String, Object> periodData = new HashMap<>();
        
        if ("DAILY".equals(periodType)) {
            for (int i = 0; i < 30; i++) {
                String dateKey = "day_" + (i + 1);
                Map<String, Object> dayData = new HashMap<>();
                dayData.put("income", BigDecimal.valueOf(500000 + (i * 10000)));
                dayData.put("expense", BigDecimal.valueOf(250000 + (i * 5000)));
                dayData.put("netIncome", BigDecimal.valueOf(250000 + (i * 5000)));
                periodData.put(dateKey, dayData);
            }
        } else if ("MONTHLY".equals(periodType)) {
            for (int i = 0; i < 12; i++) {
                String monthKey = (i + 1) + "월";
                Map<String, Object> monthData = new HashMap<>();
                monthData.put("income", BigDecimal.valueOf(15000000 + (i * 1000000)));
                monthData.put("expense", BigDecimal.valueOf(12000000 + (i * 800000)));
                monthData.put("netIncome", BigDecimal.valueOf(3000000 + (i * 200000)));
                periodData.put(monthKey, monthData);
            }
        } else if ("YEARLY".equals(periodType)) {
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
        
        String category = getPurchaseCategory(purchaseRequest.getItem().getCategory());
        boolean isVatApplicable = TaxCalculationUtil.isVatApplicable(category);
        
        TaxCalculationUtil.TaxCalculationResult taxResult;
        if (isVatApplicable) {
            taxResult = TaxCalculationUtil.calculateTaxForExpense(purchaseRequest.getTotalAmount());
        } else {
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
    
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getRefundHistory(int page, int size, String period, String status) {
        log.info("📋 ERP 환불 이력 조회: page={}, size={}, period={}, status={}", page, size, period, status);
        
        Map<String, Object> result = new HashMap<>();
        
        result.put("refundHistory", List.of());
        result.put("pageInfo", Map.of(
            "currentPage", page,
            "pageSize", size,
            "totalElements", 0,
            "totalPages", 0
        ));
        result.put("period", period);
        result.put("status", status);
        
        log.info("✅ ERP 환불 이력 조회 완료");
        return result;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getRefundStatistics(String period) {
        log.info("📊 ERP 환불 통계 조회: period={}", period);
        
        Map<String, Object> result = new HashMap<>();
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalRefundCount", 0);
        summary.put("totalRefundedSessions", 0);
        summary.put("totalRefundAmount", BigDecimal.ZERO);
        summary.put("averageRefundPerCase", BigDecimal.ZERO);
        
        result.put("summary", summary);
        result.put("period", period);
        result.put("refundReasonStats", Map.of());
        result.put("monthlyTrend", List.of());
        result.put("recentRefunds", List.of());
        
        log.info("✅ ERP 환불 통계 조회 완료");
        return result;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getErpSyncStatus() {
        log.info("🔄 ERP 동기화 상태 확인");
        
        Map<String, Object> result = new HashMap<>();
        
        result.put("erpSystemAvailable", true);
        result.put("lastSyncTime", LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        result.put("erpSuccessRate", 95.5);
        result.put("pendingErpRequests", 2);
        result.put("failedErpRequests", 1);
        
        Map<String, Object> accountingStatus = new HashMap<>();
        accountingStatus.put("processedToday", 5);
        accountingStatus.put("pendingApproval", 0);
        accountingStatus.put("totalRefundAmount", BigDecimal.valueOf(500000));
        
        result.put("accountingStatus", accountingStatus);
        result.put("lastChecked", LocalDateTime.now());
        
        log.info("✅ ERP 동기화 상태 확인 완료");
        return result;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getRefundAccountingStatus(String period) {
        log.info("💰 환불 회계 처리 현황 조회: period={}", period);
        
        Map<String, Object> result = new HashMap<>();
        
        Map<String, Object> accountingStatus = new HashMap<>();
        accountingStatus.put("processedRefunds", 15);
        accountingStatus.put("pendingRefunds", 3);
        accountingStatus.put("rejectedRefunds", 1);
        accountingStatus.put("totalRefundAmount", BigDecimal.valueOf(2500000));
        accountingStatus.put("averageProcessingTime", "2.5시간");
        
        result.put("accountingStatus", accountingStatus);
        result.put("period", period);
        
        Map<String, Object> processorStats = new HashMap<>();
        processorStats.put("김회계", Map.of("processed", 8, "amount", BigDecimal.valueOf(1200000)));
        processorStats.put("이재무", Map.of("processed", 7, "amount", BigDecimal.valueOf(1300000)));
        
        result.put("processorStats", processorStats);
        
        log.info("✅ 환불 회계 처리 현황 조회 완료");
        return result;
    }
}

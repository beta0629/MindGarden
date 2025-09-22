package com.mindgarden.consultation.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.mindgarden.consultation.entity.Budget;
import com.mindgarden.consultation.entity.Item;
import com.mindgarden.consultation.entity.PurchaseOrder;
import com.mindgarden.consultation.entity.PurchaseRequest;

/**
 * ERP 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
public interface ErpService {
    
    // ==================== Item Management ====================
    
    /**
     * 모든 활성화된 아이템 조회
     */
    List<Item> getAllActiveItems();
    
    /**
     * ID로 아이템 조회
     */
    Optional<Item> getItemById(Long id);
    
    /**
     * 카테고리별 아이템 조회
     */
    List<Item> getItemsByCategory(String category);
    
    /**
     * 이름으로 아이템 검색
     */
    List<Item> searchItemsByName(String name);
    
    /**
     * 재고 부족 아이템 조회
     */
    List<Item> getLowStockItems(Integer threshold);
    
    /**
     * 아이템 생성
     */
    Item createItem(Item item);
    
    /**
     * 아이템 수정
     */
    Item updateItem(Long id, Item item);
    
    /**
     * 아이템 삭제 (소프트 삭제)
     */
    boolean deleteItem(Long id);
    
    /**
     * 아이템 재고 업데이트
     */
    boolean updateItemStock(Long id, Integer quantity);
    
    // ==================== Purchase Request Management ====================
    
    /**
     * 구매 요청 생성
     */
    PurchaseRequest createPurchaseRequest(Long requesterId, Long itemId, Integer quantity, String reason);
    
    /**
     * 구매 요청 조회
     */
    Optional<PurchaseRequest> getPurchaseRequestById(Long id);
    
    /**
     * 모든 활성화된 구매 요청 조회
     */
    List<PurchaseRequest> getAllActivePurchaseRequests();
    
    /**
     * 요청자별 구매 요청 목록 조회
     */
    List<PurchaseRequest> getPurchaseRequestsByRequester(Long requesterId);
    
    /**
     * 관리자 승인 대기 목록 조회
     */
    List<PurchaseRequest> getPendingAdminApproval();
    
    /**
     * 수퍼 관리자 승인 대기 목록 조회
     */
    List<PurchaseRequest> getPendingSuperAdminApproval();
    
    /**
     * 관리자 승인
     */
    boolean approveByAdmin(Long requestId, Long adminId, String comment);
    
    /**
     * 관리자 거부
     */
    boolean rejectByAdmin(Long requestId, Long adminId, String comment);
    
    /**
     * 수퍼 관리자 승인
     */
    boolean approveBySuperAdmin(Long requestId, Long superAdminId, String comment);
    
    /**
     * 수퍼 관리자 거부
     */
    boolean rejectBySuperAdmin(Long requestId, Long superAdminId, String comment);
    
    /**
     * 구매 요청 취소
     */
    boolean cancelPurchaseRequest(Long requestId, Long requesterId);
    
    // ==================== Purchase Order Management ====================
    
    /**
     * 구매 주문 생성
     */
    PurchaseOrder createPurchaseOrder(Long requestId, Long purchaserId, String supplier, String supplierContact, LocalDateTime expectedDeliveryDate, String notes);
    
    /**
     * 구매 주문 조회
     */
    Optional<PurchaseOrder> getPurchaseOrderById(Long id);
    
    /**
     * 모든 활성화된 구매 주문 조회
     */
    List<PurchaseOrder> getAllActivePurchaseOrders();
    
    /**
     * 주문 번호로 구매 주문 조회
     */
    Optional<PurchaseOrder> getPurchaseOrderByOrderNumber(String orderNumber);
    
    /**
     * 구매자별 주문 목록 조회
     */
    List<PurchaseOrder> getPurchaseOrdersByPurchaser(Long purchaserId);
    
    /**
     * 상태별 주문 목록 조회
     */
    List<PurchaseOrder> getPurchaseOrdersByStatus(PurchaseOrder.PurchaseOrderStatus status);
    
    /**
     * 주문 상태 업데이트
     */
    boolean updateOrderStatus(Long orderId, PurchaseOrder.PurchaseOrderStatus status);
    
    /**
     * 배송 완료 처리
     */
    boolean markAsDelivered(Long orderId);
    
    // ==================== Budget Management ====================
    
    /**
     * 모든 활성화된 예산 조회
     */
    List<Budget> getAllActiveBudgets();
    
    /**
     * ID로 예산 조회
     */
    Optional<Budget> getBudgetById(Long id);
    
    /**
     * 연도별 예산 조회
     */
    List<Budget> getBudgetsByYear(String year);
    
    /**
     * 월별 예산 조회
     */
    List<Budget> getBudgetsByYearAndMonth(String year, String month);
    
    /**
     * 카테고리별 예산 조회
     */
    List<Budget> getBudgetsByCategory(String category);
    
    /**
     * 예산 생성
     */
    Budget createBudget(Budget budget);
    
    /**
     * 예산 수정
     */
    Budget updateBudget(Long id, Budget budget);
    
    /**
     * 예산 삭제
     */
    boolean deleteBudget(Long id);
    
    /**
     * 예산 사용 처리
     */
    boolean useBudget(Long budgetId, BigDecimal amount);
    
    /**
     * 예산 환불 처리
     */
    boolean refundBudget(Long budgetId, BigDecimal amount);
    
    // ==================== Statistics and Reports ====================
    
    /**
     * 월별 구매 요청 통계
     */
    Map<String, Object> getMonthlyPurchaseRequestStats(int year, int month);
    
    /**
     * 월별 구매 주문 통계
     */
    Map<String, Object> getMonthlyPurchaseOrderStats(int year, int month);
    
    /**
     * 월별 예산 통계
     */
    Map<String, Object> getMonthlyBudgetStats(String year, String month);
    
    /**
     * 상태별 구매 요청 통계
     */
    Map<String, Object> getPurchaseRequestStatsByStatus();
    
    /**
     * 요청자별 구매 요청 통계
     */
    Map<String, Object> getPurchaseRequestStatsByRequester();
    
    /**
     * 공급업체별 구매 주문 통계
     */
    Map<String, Object> getPurchaseOrderStatsBySupplier();
    
    /**
     * 카테고리별 예산 통계
     */
    Map<String, Object> getBudgetStatsByCategory();
    
    /**
     * 예산 사용률이 높은 예산 목록
     */
    List<Budget> getHighUsageBudgets();
    
    /**
     * 예산 부족 예산 목록
     */
    List<Budget> getOverBudgetBudgets();
    
    // ==================== 회계 시스템 통합 ====================
    
    /**
     * 통합 재무 대시보드 데이터 조회 (HQ 전체)
     */
    Map<String, Object> getIntegratedFinanceDashboard();
    
    /**
     * 지점별 재무 대시보드 데이터 조회
     */
    Map<String, Object> getBranchFinanceDashboard(String branchCode);
    
    /**
     * 지점별 재무 대시보드 데이터 조회 (날짜 범위 지정)
     */
    Map<String, Object> getBranchFinanceDashboard(String branchCode, java.time.LocalDate startDate, java.time.LocalDate endDate);
    
    /**
     * 수입/지출 통계 조회 (HQ 전체)
     */
    Map<String, Object> getFinanceStatistics(String startDate, String endDate);
    
    /**
     * 지점별 수입/지출 통계 조회
     */
    Map<String, Object> getBranchFinanceStatistics(String branchCode, String startDate, String endDate);
    
    /**
     * 카테고리별 수입/지출 분석
     */
    Map<String, Object> getCategoryAnalysis(String startDate, String endDate);
    
    /**
     * 대차대조표 조회
     */
    Map<String, Object> getBalanceSheet(String reportDate, String branchCode);
    
    /**
     * 손익계산서 조회
     */
    Map<String, Object> getIncomeStatement(String startDate, String endDate, String branchCode);
    
    /**
     * 일단위 재무 리포트
     */
    Map<String, Object> getDailyFinanceReport(String reportDate);
    
    /**
     * 월단위 재무 리포트
     */
    Map<String, Object> getMonthlyFinanceReport(String year, String month);
    
    /**
     * 년단위 재무 리포트
     */
    Map<String, Object> getYearlyFinanceReport(String year);
    
    /**
     * 기간별 재무 트렌드 분석
     */
    Map<String, Object> getFinanceTrendAnalysis(String startDate, String endDate, String periodType);
    
    // ==================== 환불 관리 ====================
    
    /**
     * 환불 이력 조회 (페이징)
     */
    Map<String, Object> getRefundHistory(int page, int size, String period, String status);
    
    /**
     * 환불 통계 조회 (ERP 연동 기반)
     */
    Map<String, Object> getRefundStatistics(String period);
    
    /**
     * ERP 동기화 상태 확인
     */
    Map<String, Object> getErpSyncStatus();
    
    /**
     * 환불 회계 처리 현황
     */
    Map<String, Object> getRefundAccountingStatus(String period);
}

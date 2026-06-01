package com.coresolution.consultation.repository.erp.financial;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 회계 거래 Repository
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-11
 */
@Repository
public interface FinancialTransactionRepository extends JpaRepository<FinancialTransaction, Long>,
        JpaSpecificationExecutor<FinancialTransaction> {

    /**
     * 테넌트 ID와 거래 PK로 비삭제 건만 조회 (테넌트 격리)
     *
     * @param tenantId 테넌트 ID
     * @param id       거래 PK
     * @return 거래 Optional
     */
    @Query("SELECT ft FROM FinancialTransaction ft WHERE ft.tenantId = :tenantId AND ft.id = :id AND ft.isDeleted = false")
    Optional<FinancialTransaction> findByTenantIdAndId(@Param("tenantId") String tenantId, @Param("id") Long id);
    
    /**
     * 테넌트별 모든 거래 조회 (테넌트 필터링)
     */
    @Query("SELECT ft FROM FinancialTransaction ft WHERE ft.tenantId = :tenantId")
    List<FinancialTransaction> findByTenantId(@Param("tenantId") String tenantId);
    
    /**
     * 테넌트별 삭제되지 않은 모든 거래 조회 (테넌트 필터링)
     */
    @Query("SELECT ft FROM FinancialTransaction ft WHERE ft.tenantId = :tenantId AND ft.isDeleted = false")
    List<FinancialTransaction> findByTenantIdAndIsDeletedFalse(@Param("tenantId") String tenantId);
    
    /**
     * @Deprecated - 🚨 극도로 위험: 모든 테넌트 금융 거래 데이터 노출!
     */
    @Deprecated
    List<FinancialTransaction> findByIsDeletedFalse();
    
    /**
     * 테넌트별 거래 유형별 조회 (테넌트 필터링)
     */
    @Query("SELECT ft FROM FinancialTransaction ft WHERE ft.tenantId = :tenantId AND ft.transactionType = :transactionType AND ft.isDeleted = false")
    List<FinancialTransaction> findByTenantIdAndTransactionTypeAndIsDeletedFalse(
        @Param("tenantId") String tenantId,
        @Param("transactionType") FinancialTransaction.TransactionType transactionType);
    
    /**
     * @Deprecated - 🚨 극도로 위험: 모든 테넌트 거래 유형별 데이터 노출!
     */
    @Deprecated
    List<FinancialTransaction> findByTransactionTypeAndIsDeletedFalse(
        FinancialTransaction.TransactionType transactionType);
    
    /**
     * 카테고리별 조회 (tenantId 필터링)
     */
    List<FinancialTransaction> findByTenantIdAndCategoryAndIsDeletedFalse(String tenantId, String category);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 금융 데이터 노출!
     */
    @Deprecated
    List<FinancialTransaction> findByCategoryAndIsDeletedFalse(String category);
    
    /**
     * 상태별 조회 (tenantId 필터링)
     */
    List<FinancialTransaction> findByTenantIdAndStatusAndIsDeletedFalse(
        String tenantId, FinancialTransaction.TransactionStatus status);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 금융 데이터 노출!
     */
    @Deprecated
    List<FinancialTransaction> findByStatusAndIsDeletedFalse(
        FinancialTransaction.TransactionStatus status);
    
    /**
     * 기간별 조회 (tenantId 필터링)
     */
    List<FinancialTransaction> findByTenantIdAndTransactionDateBetweenAndIsDeletedFalse(
        String tenantId, LocalDate startDate, LocalDate endDate);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 금융 데이터 노출!
     */
    @Deprecated
    List<FinancialTransaction> findByTransactionDateBetweenAndIsDeletedFalse(
        LocalDate startDate, LocalDate endDate);
    
    /**
     * 거래 유형과 기간으로 조회 (tenantId 필터링)
     */
    List<FinancialTransaction> findByTenantIdAndTransactionTypeAndTransactionDateBetweenAndIsDeletedFalse(
        String tenantId, FinancialTransaction.TransactionType transactionType, LocalDate startDate, LocalDate endDate);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 금융 데이터 노출!
     */
    @Deprecated
    List<FinancialTransaction> findByTransactionTypeAndTransactionDateBetweenAndIsDeletedFalse(
        FinancialTransaction.TransactionType transactionType, LocalDate startDate, LocalDate endDate);
    
    /**
     * 승인 대기 중인 거래 조회 (tenantId 필터링)
     */
    List<FinancialTransaction> findByTenantIdAndStatusAndIsDeletedFalseOrderByCreatedAtDesc(
        String tenantId, FinancialTransaction.TransactionStatus status);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 금융 데이터 노출!
     */
    @Deprecated
    List<FinancialTransaction> findByStatusAndIsDeletedFalseOrderByCreatedAtDesc(
        FinancialTransaction.TransactionStatus status);
    
    /**
     * 관련 엔티티로 조회 (tenantId 필터링)
     */
    List<FinancialTransaction> findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
        String tenantId, Long relatedEntityId, String relatedEntityType);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 금융 데이터 노출!
     */
    @Deprecated
    List<FinancialTransaction> findByRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
        Long relatedEntityId, String relatedEntityType);
    
    /**
     * 페이징 조회 (tenantId 필터링)
     */
    Page<FinancialTransaction> findByTenantIdAndIsDeletedFalseOrderByTransactionDateDescCreatedAtDesc(String tenantId, Pageable pageable);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 금융 데이터 노출!
     */
    @Deprecated
    Page<FinancialTransaction> findByIsDeletedFalseOrderByTransactionDateDescCreatedAtDesc(Pageable pageable);
    
    /**
     * 거래 유형별 페이징 조회 (tenantId 필터링)
     */
    Page<FinancialTransaction> findByTenantIdAndTransactionTypeAndIsDeletedFalseOrderByTransactionDateDescCreatedAtDesc(
        String tenantId, FinancialTransaction.TransactionType transactionType, Pageable pageable);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 금융 데이터 노출!
     */
    @Deprecated
    Page<FinancialTransaction> findByTransactionTypeAndIsDeletedFalseOrderByTransactionDateDescCreatedAtDesc(
        FinancialTransaction.TransactionType transactionType, Pageable pageable);
    
    /**
     * 카테고리별 페이징 조회 (tenantId 필터링)
     */
    Page<FinancialTransaction> findByTenantIdAndCategoryAndIsDeletedFalseOrderByTransactionDateDescCreatedAtDesc(
        String tenantId, String category, Pageable pageable);
    
    /**
     * 카테고리 In 페이징 조회 (tenantId 필터링)
     * 상담료 하위호환: CONSULTATION, 상담료 둘 다 조회 시 사용
     */
    Page<FinancialTransaction> findByTenantIdAndCategoryInAndIsDeletedFalseOrderByTransactionDateDescCreatedAtDesc(
        String tenantId, Collection<String> categories, Pageable pageable);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 금융 데이터 노출!
     */
    @Deprecated
    Page<FinancialTransaction> findByCategoryAndIsDeletedFalseOrderByTransactionDateDescCreatedAtDesc(
        String category, Pageable pageable);
    
    /**
     * 기간별 페이징 조회 (tenantId 필터링)
     */
    Page<FinancialTransaction> findByTenantIdAndTransactionDateBetweenAndIsDeletedFalseOrderByTransactionDateDescCreatedAtDesc(
        String tenantId, LocalDate startDate, LocalDate endDate, Pageable pageable);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 금융 데이터 노출!
     */
    @Deprecated
    Page<FinancialTransaction> findByTransactionDateBetweenAndIsDeletedFalseOrderByTransactionDateDescCreatedAtDesc(
        LocalDate startDate, LocalDate endDate, Pageable pageable);
    
    /**
     * 승인 대기 건수 조회 (tenantId 필터링)
     */
    @Query("SELECT COUNT(f) FROM FinancialTransaction f WHERE f.tenantId = :tenantId AND f.status = 'PENDING' AND f.isDeleted = false")
    Long countPendingApprovals(@Param("tenantId") String tenantId);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 금융 데이터 노출!
     */
    @Deprecated
    @Query("SELECT COUNT(f) FROM FinancialTransaction f WHERE f.status = 'PENDING' AND f.isDeleted = false")
    Long countPendingApprovalsDeprecated();
    
    /**
     * 기간별 총 수입 조회 (tenantId 필터링)
     */
    @Query("SELECT COALESCE(SUM(f.amount), 0) FROM FinancialTransaction f " +
           "WHERE f.tenantId = :tenantId AND f.transactionType = 'INCOME' AND f.status = 'COMPLETED' " +
           "AND f.transactionDate BETWEEN :startDate AND :endDate AND f.isDeleted = false")
    BigDecimal sumIncomeByDateRange(@Param("tenantId") String tenantId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 금융 데이터 노출!
     */
    @Deprecated
    @Query("SELECT COALESCE(SUM(f.amount), 0) FROM FinancialTransaction f " +
           "WHERE f.transactionType = 'INCOME' AND f.status = 'COMPLETED' " +
           "AND f.transactionDate BETWEEN :startDate AND :endDate AND f.isDeleted = false")
    BigDecimal sumIncomeByDateRangeDeprecated(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    /**
     * 기간별 총 지출 조회 (tenantId 필터링)
     */
    @Query("SELECT COALESCE(SUM(f.amount), 0) FROM FinancialTransaction f " +
           "WHERE f.tenantId = :tenantId AND f.transactionType = 'EXPENSE' AND f.status = 'COMPLETED' " +
           "AND f.transactionDate BETWEEN :startDate AND :endDate AND f.isDeleted = false")
    BigDecimal sumExpenseByDateRange(@Param("tenantId") String tenantId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 금융 데이터 노출!
     */
    @Deprecated
    @Query("SELECT COALESCE(SUM(f.amount), 0) FROM FinancialTransaction f " +
           "WHERE f.transactionType = 'EXPENSE' AND f.status = 'COMPLETED' " +
           "AND f.transactionDate BETWEEN :startDate AND :endDate AND f.isDeleted = false")
    BigDecimal sumExpenseByDateRangeDeprecated(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    /**
     * 카테고리별 수입 통계 (tenantId 필터링)
     */
    @Query("SELECT f.category, COALESCE(SUM(f.amount), 0), COUNT(f) " +
           "FROM FinancialTransaction f " +
           "WHERE f.tenantId = :tenantId AND f.transactionType = 'INCOME' AND f.status = 'COMPLETED' " +
           "AND f.transactionDate BETWEEN :startDate AND :endDate AND f.isDeleted = false " +
           "GROUP BY f.category ORDER BY SUM(f.amount) DESC")
    List<Object[]> getIncomeByCategory(@Param("tenantId") String tenantId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 금융 데이터 노출!
     */
    @Deprecated
    @Query("SELECT f.category, COALESCE(SUM(f.amount), 0), COUNT(f) " +
           "FROM FinancialTransaction f " +
           "WHERE f.transactionType = 'INCOME' AND f.status = 'COMPLETED' " +
           "AND f.transactionDate BETWEEN :startDate AND :endDate AND f.isDeleted = false " +
           "GROUP BY f.category ORDER BY SUM(f.amount) DESC")
    List<Object[]> getIncomeByCategoryDeprecated(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    /**
     * 카테고리별 지출 통계 (tenantId 필터링)
     */
    @Query("SELECT f.category, COALESCE(SUM(f.amount), 0), COUNT(f) " +
           "FROM FinancialTransaction f " +
           "WHERE f.tenantId = :tenantId AND f.transactionType = 'EXPENSE' AND f.status = 'COMPLETED' " +
           "AND f.transactionDate BETWEEN :startDate AND :endDate AND f.isDeleted = false " +
           "GROUP BY f.category ORDER BY SUM(f.amount) DESC")
    List<Object[]> getExpenseByCategory(@Param("tenantId") String tenantId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 금융 데이터 노출!
     */
    @Deprecated
    @Query("SELECT f.category, COALESCE(SUM(f.amount), 0), COUNT(f) " +
           "FROM FinancialTransaction f " +
           "WHERE f.transactionType = 'EXPENSE' AND f.status = 'COMPLETED' " +
           "AND f.transactionDate BETWEEN :startDate AND :endDate AND f.isDeleted = false " +
           "GROUP BY f.category ORDER BY SUM(f.amount) DESC")
    List<Object[]> getExpenseByCategoryDeprecated(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    /**
     * 월별 수입/지출 통계 (tenantId 필터링)
     */
    @Query("SELECT YEAR(f.transactionDate) as year, MONTH(f.transactionDate) as month, " +
           "f.transactionType, COALESCE(SUM(f.amount), 0) " +
           "FROM FinancialTransaction f " +
           "WHERE f.tenantId = :tenantId AND f.status = 'COMPLETED' AND f.transactionDate BETWEEN :startDate AND :endDate " +
           "AND f.isDeleted = false " +
           "GROUP BY YEAR(f.transactionDate), MONTH(f.transactionDate), f.transactionType " +
           "ORDER BY year, month")
    List<Object[]> getMonthlyFinancialData(@Param("tenantId") String tenantId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 금융 데이터 노출!
     */
    @Deprecated
    @Query("SELECT YEAR(f.transactionDate) as year, MONTH(f.transactionDate) as month, " +
           "f.transactionType, COALESCE(SUM(f.amount), 0) " +
           "FROM FinancialTransaction f " +
           "WHERE f.status = 'COMPLETED' AND f.transactionDate BETWEEN :startDate AND :endDate " +
           "AND f.isDeleted = false " +
           "GROUP BY YEAR(f.transactionDate), MONTH(f.transactionDate), f.transactionType " +
           "ORDER BY year, month")
    List<Object[]> getMonthlyFinancialDataDeprecated(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    /**
     * 최근 거래 내역 조회 (tenantId 필터링)
     */
    @Query("SELECT f FROM FinancialTransaction f WHERE f.tenantId = :tenantId AND f.isDeleted = false " +
           "ORDER BY f.transactionDate DESC, f.createdAt DESC")
    List<FinancialTransaction> findRecentTransactions(@Param("tenantId") String tenantId, Pageable pageable);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 금융 데이터 노출!
     */
    @Deprecated
    @Query("SELECT f FROM FinancialTransaction f WHERE f.isDeleted = false " +
           "ORDER BY f.transactionDate DESC, f.createdAt DESC")
    List<FinancialTransaction> findRecentTransactionsDeprecated(Pageable pageable);
    
    /**
     * 급여 관련 거래 조회 (tenantId 필터링)
     */
    @Query("SELECT f FROM FinancialTransaction f " +
           "WHERE f.tenantId = :tenantId AND f.relatedEntityType = 'SALARY' AND f.isDeleted = false " +
           "ORDER BY f.transactionDate DESC")
    List<FinancialTransaction> findSalaryTransactions(@Param("tenantId") String tenantId);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 금융 데이터 노출!
     */
    @Deprecated
    @Query("SELECT f FROM FinancialTransaction f " +
           "WHERE f.relatedEntityType = 'SALARY' AND f.isDeleted = false " +
           "ORDER BY f.transactionDate DESC")
    List<FinancialTransaction> findSalaryTransactionsDeprecated();
    
    /**
     * ERP 구매 관련 거래 조회 (tenantId 필터링)
     */
    @Query("SELECT f FROM FinancialTransaction f " +
           "WHERE f.tenantId = :tenantId AND f.relatedEntityType = 'PURCHASE' AND f.isDeleted = false " +
           "ORDER BY f.transactionDate DESC")
    List<FinancialTransaction> findPurchaseTransactions(@Param("tenantId") String tenantId);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 금융 데이터 노출!
     */
    @Deprecated
    @Query("SELECT f FROM FinancialTransaction f " +
           "WHERE f.relatedEntityType = 'PURCHASE' AND f.isDeleted = false " +
           "ORDER BY f.transactionDate DESC")
    List<FinancialTransaction> findPurchaseTransactionsDeprecated();
    
    /**
     * 결제 관련 거래 조회 (tenantId 필터링)
     */
    @Query("SELECT f FROM FinancialTransaction f " +
           "WHERE f.tenantId = :tenantId AND f.relatedEntityType = 'PAYMENT' AND f.isDeleted = false " +
           "ORDER BY f.transactionDate DESC")
    List<FinancialTransaction> findPaymentTransactions(@Param("tenantId") String tenantId);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 금융 데이터 노출!
     */
    @Deprecated
    @Query("SELECT f FROM FinancialTransaction f " +
           "WHERE f.relatedEntityType = 'PAYMENT' AND f.isDeleted = false " +
           "ORDER BY f.transactionDate DESC")
    List<FinancialTransaction> findPaymentTransactionsDeprecated();
    
    /**
     * 특정 날짜의 거래 조회 (tenantId 필터링)
     */
    List<FinancialTransaction> findByTenantIdAndTransactionDateAndIsDeletedFalse(String tenantId, LocalDate transactionDate);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 금융 데이터 노출!
     */
    @Deprecated
    List<FinancialTransaction> findByTransactionDateAndIsDeletedFalse(LocalDate transactionDate);
    
    /**
     * 중복 거래 방지를 위한 존재 여부 확인 (tenantId 필터링)
     */
    boolean existsByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndTransactionTypeAndIsDeletedFalse(
        String tenantId, Long relatedEntityId, String relatedEntityType, FinancialTransaction.TransactionType transactionType);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 금융 데이터 노출!
     */
    @Deprecated
    boolean existsByRelatedEntityIdAndRelatedEntityTypeAndTransactionTypeAndIsDeletedFalse(
        Long relatedEntityId, String relatedEntityType, FinancialTransaction.TransactionType transactionType);
    
    /**
     * 거래 유형, 세부카테고리, 기간으로 조회 (부분 환불용) (tenantId 필터링)
     */
    List<FinancialTransaction> findByTenantIdAndTransactionTypeAndSubcategoryAndTransactionDateBetweenAndIsDeletedFalse(
        String tenantId, FinancialTransaction.TransactionType transactionType, String subcategory, LocalDate startDate, LocalDate endDate);

    /**
     * 거래 유형, 다중 세부카테고리(IN), 기간으로 조회 (환불 전체+부분 통합용) (tenantId 필터링).
     *
     * <p>P0 hotfix 2026-05-29 (옵션 A): 운영 /erp/refund-management 5월 환불 0건 표시 원인이 된
     * {@code AdminServiceImpl.getRefundHistory/getRefundStatistics} partial 분기 SQL 의
     * 단일 subcategory 매칭 결함(H11) 을 해소하기 위해 도입. CONSULTATION_REFUND (전체환불) 와
     * CONSULTATION_PARTIAL_REFUND (부분환불) 를 한 번에 조회해 어느 분기에도 카운팅되지 않는
     * 누락 케이스를 제거한다. 디버그 보고서:
     * docs/project-management/2026-05-29/REFUND_MANAGEMENT_MAY_MISSING_DEBUG.md</p>
     *
     * @since 2026-05-29 P0 hotfix
     */
    List<FinancialTransaction> findByTenantIdAndTransactionTypeAndSubcategoryInAndTransactionDateBetweenAndIsDeletedFalse(
        String tenantId, FinancialTransaction.TransactionType transactionType,
        java.util.Collection<String> subcategories, LocalDate startDate, LocalDate endDate);
    
    /**
     * @Deprecated - 🚨 극도로 위험: tenantId 필터링 없이 금융 데이터 노출!
     */
    @Deprecated
    List<FinancialTransaction> findByTransactionTypeAndSubcategoryAndTransactionDateBetweenAndIsDeletedFalse(
        FinancialTransaction.TransactionType transactionType, String subcategory, LocalDate startDate, LocalDate endDate);

    /**
     * ERP P0-2 결산용 — 거래 유형별 amount 합계 (status 무관, soft delete 만 제외).
     *
     * <p>합의서 §4.3: 마감 시 SUM(amount) GROUP BY transaction_type 산식. status 가 PENDING/APPROVED 인
     * 거래도 마감 합산에 포함된다 (운영 데이터 SSOT). 기존 {@code sumIncomeByDateRange} (status=COMPLETED 만)
     * 와 의미가 다르므로 별도 쿼리로 분리.</p>
     *
     * @param tenantId 테넌트 ID
     * @param type 거래 유형 (INCOME/EXPENSE/RECEIVABLES)
     * @param startDate 시작일 (포함)
     * @param endDate 종료일 (포함)
     * @return amount 합 (NULL 안전 — COALESCE)
     */
    @Query("SELECT COALESCE(SUM(f.amount), 0) FROM FinancialTransaction f "
            + "WHERE f.tenantId = :tenantId "
            + "AND f.transactionType = :type "
            + "AND f.transactionDate BETWEEN :startDate AND :endDate "
            + "AND f.isDeleted = false")
    BigDecimal sumAmountForCloseByType(
            @Param("tenantId") String tenantId,
            @Param("type") FinancialTransaction.TransactionType type,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * ERP P0-2 결산용 — INCOME 거래의 부가세(tax_amount) 합 (status 무관).
     *
     * <p>합의서 §2 Q8 부가세 가드 비교 대상. EXPENSE 의 매입세액공제는 본 PR 범위 밖.</p>
     *
     * @param tenantId 테넌트 ID
     * @param startDate 시작일 (포함)
     * @param endDate 종료일 (포함)
     * @return INCOME tax_amount 합 (NULL 안전)
     */
    @Query("SELECT COALESCE(SUM(f.taxAmount), 0) FROM FinancialTransaction f "
            + "WHERE f.tenantId = :tenantId "
            + "AND f.transactionType = 'INCOME' "
            + "AND f.transactionDate BETWEEN :startDate AND :endDate "
            + "AND f.isDeleted = false")
    BigDecimal sumIncomeTaxAmountForClose(
            @Param("tenantId") String tenantId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * ERP P0-2 결산용 — EXPENSE + 환불 서브카테고리 의 amount 합 (status 무관).
     *
     * <p>합의서 §2 Q8: expected_tax = 10% × (INCOME − REFUND) 산식의 REFUND 항.
     * 환불 서브카테고리: CONSULTATION_REFUND / CONSULTATION_PARTIAL_REFUND / SESSION_REFUND
     * / PARTIAL_SESSION_REFUND ({@code FinancialTransactionConstants.REFUND_SUBCATEGORIES}).</p>
     *
     * @param tenantId 테넌트 ID
     * @param startDate 시작일 (포함)
     * @param endDate 종료일 (포함)
     * @param refundSubcategories 환불 서브카테고리 IN 절
     * @return 환불 amount 합 (NULL 안전)
     */
    @Query("SELECT COALESCE(SUM(f.amount), 0) FROM FinancialTransaction f "
            + "WHERE f.tenantId = :tenantId "
            + "AND f.transactionType = 'EXPENSE' "
            + "AND f.subcategory IN :refundSubcategories "
            + "AND f.transactionDate BETWEEN :startDate AND :endDate "
            + "AND f.isDeleted = false")
    BigDecimal sumRefundForClose(
            @Param("tenantId") String tenantId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("refundSubcategories") Collection<String> refundSubcategories);

    /**
     * D8 dry-run: 레거시 원천이 {@code tax_amount}에만 있는 후보 건수(읽기 전용).
     * <p>
     * 조건: INCOME·비삭제·{@code withholding_tax_amount = 0}·{@code tax_amount &gt; 0}·
     * 서브카테고리/설명/비고 중 하나라도 프리랜스·원천·사업소득 문자열 패턴과 일치(보수적 LIKE).
     * VAT만 있는 거래·다른 세목은 제외되지 않을 수 있으므로 운영 샘플로 규칙 확정 필요.
     * </p>
     *
     * @param tenantId              테넌트 ID
     * @param likeFreelanceSub      서브카테고리용 LIKE 패턴 (예: {@code %freelance%})
     * @param likeWithholdingKr     원천 키워드 LIKE (예: {@code %원천%})
     * @param likeBusinessIncomeKr  사업소득 키워드 LIKE (예: {@code %사업소득%})
     * @return 후보 건수
     */
    @Query("SELECT COUNT(f) FROM FinancialTransaction f WHERE f.tenantId = :tenantId AND f.isDeleted = false "
            + "AND f.transactionType = 'INCOME' "
            + "AND f.withholdingTaxAmount = 0 AND f.taxAmount IS NOT NULL AND f.taxAmount > 0 AND ("
            + "LOWER(COALESCE(f.subcategory, '')) LIKE LOWER(:likeFreelanceSub) OR "
            + "LOWER(COALESCE(f.description, '')) LIKE LOWER(:likeWithholdingKr) OR "
            + "LOWER(COALESCE(f.description, '')) LIKE LOWER(:likeBusinessIncomeKr) OR "
            + "LOWER(COALESCE(f.remarks, '')) LIKE LOWER(:likeWithholdingKr))")
    long countD8WithholdingLegacyCandidates(
            @Param("tenantId") String tenantId,
            @Param("likeFreelanceSub") String likeFreelanceSub,
            @Param("likeWithholdingKr") String likeWithholdingKr,
            @Param("likeBusinessIncomeKr") String likeBusinessIncomeKr);

    /**
     * D8 dry-run: 위 {@link #countD8WithholdingLegacyCandidates}와 동일 조건의 거래 ID 목록(표본용, 오름차순).
     *
     * @param tenantId              테넌트 ID
     * @param likeFreelanceSub      서브카테고리용 LIKE 패턴
     * @param likeWithholdingKr     원천 키워드 LIKE
     * @param likeBusinessIncomeKr  사업소득 키워드 LIKE
     * @param pageable              표본 상한(정렬은 id ASC 권장)
     * @return 거래 ID 목록
     */
    @Query("SELECT f.id FROM FinancialTransaction f WHERE f.tenantId = :tenantId AND f.isDeleted = false "
            + "AND f.transactionType = 'INCOME' "
            + "AND f.withholdingTaxAmount = 0 AND f.taxAmount IS NOT NULL AND f.taxAmount > 0 AND ("
            + "LOWER(COALESCE(f.subcategory, '')) LIKE LOWER(:likeFreelanceSub) OR "
            + "LOWER(COALESCE(f.description, '')) LIKE LOWER(:likeWithholdingKr) OR "
            + "LOWER(COALESCE(f.description, '')) LIKE LOWER(:likeBusinessIncomeKr) OR "
            + "LOWER(COALESCE(f.remarks, '')) LIKE LOWER(:likeWithholdingKr)) "
            + "ORDER BY f.id ASC")
    List<Long> findD8WithholdingLegacyCandidateIds(
            @Param("tenantId") String tenantId,
            @Param("likeFreelanceSub") String likeFreelanceSub,
            @Param("likeWithholdingKr") String likeWithholdingKr,
            @Param("likeBusinessIncomeKr") String likeBusinessIncomeKr,
            Pageable pageable);
}

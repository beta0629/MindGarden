package com.coresolution.consultation.repository;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.Account;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {
    
    // ==================== tenantId 필터링 메서드 ====================
    
    /**
     * 테넌트별 활성 계좌 조회 (tenantId 필터링)
     */
    @Query("SELECT a FROM Account a WHERE a.tenantId = :tenantId AND a.isActive = true AND a.isDeleted = false")
    List<Account> findByTenantIdAndIsActiveTrueAndIsDeletedFalse(@Param("tenantId") String tenantId);
    
    /**
     * 테넌트별 지점별 계좌 조회 (tenantId 필터링)
     */
    @Query("SELECT a FROM Account a WHERE a.tenantId = :tenantId AND a.branchId = :branchId AND a.isActive = true AND a.isDeleted = false")
    List<Account> findByTenantIdAndBranchIdAndIsActiveTrueAndIsDeletedFalse(@Param("tenantId") String tenantId, @Param("branchId") Long branchId);
    
    /**
     * 테넌트별 기본 계좌 조회 (tenantId 필터링)
     */
    @Query("SELECT a FROM Account a WHERE a.tenantId = :tenantId AND a.isPrimary = true AND a.isActive = true AND a.isDeleted = false")
    Optional<Account> findByTenantIdAndIsPrimaryTrueAndIsActiveTrueAndIsDeletedFalse(@Param("tenantId") String tenantId);
    
    /**
     * 테넌트별 지점별 기본 계좌 조회 (tenantId 필터링)
     */
    @Query("SELECT a FROM Account a WHERE a.tenantId = :tenantId AND a.branchId = :branchId AND a.isPrimary = true AND a.isActive = true AND a.isDeleted = false")
    Optional<Account> findByTenantIdAndBranchIdAndIsPrimaryTrueAndIsActiveTrueAndIsDeletedFalse(@Param("tenantId") String tenantId, @Param("branchId") Long branchId);
    
    /**
     * 테넌트별 계좌번호로 조회 (tenantId 필터링)
     */
    @Query("SELECT a FROM Account a WHERE a.tenantId = :tenantId AND a.accountNumber = :accountNumber AND a.isDeleted = false")
    Optional<Account> findByTenantIdAndAccountNumberAndIsDeletedFalse(@Param("tenantId") String tenantId, @Param("accountNumber") String accountNumber);
    
    /**
     * 테넌트별 은행별 계좌 조회 (tenantId 필터링)
     */
    @Query("SELECT a FROM Account a WHERE a.tenantId = :tenantId AND a.bankCode = :bankCode AND a.isActive = true AND a.isDeleted = false")
    List<Account> findByTenantIdAndBankCodeAndIsActiveTrueAndIsDeletedFalse(@Param("tenantId") String tenantId, @Param("bankCode") String bankCode);
    
    /**
     * 테넌트별 계좌 검색 (은행명, 계좌번호, 예금주명) (tenantId 필터링)
     */
    @Query("SELECT a FROM Account a WHERE " +
           "a.tenantId = :tenantId AND " +
           "a.isDeleted = false AND " +
           "a.isActive = true AND " +
           "(a.bankName LIKE %:keyword% OR " +
           "a.accountNumber LIKE %:keyword% OR " +
           "a.accountHolder LIKE %:keyword%)")
    Page<Account> searchAccountsByTenantId(@Param("tenantId") String tenantId, @Param("keyword") String keyword, Pageable pageable);
    
    /**
     * 테넌트별 계좌 통계 (tenantId 필터링)
     */
    @Query("SELECT COUNT(a) FROM Account a WHERE a.tenantId = :tenantId AND a.isDeleted = false")
    Long countActiveAccountsByTenantId(@Param("tenantId") String tenantId);
    
    @Query("SELECT COUNT(a) FROM Account a WHERE a.tenantId = :tenantId AND a.isActive = true AND a.isDeleted = false")
    Long countActiveAccountsOnlyByTenantId(@Param("tenantId") String tenantId);
    
    @Query("SELECT a.bankCode, COUNT(a) FROM Account a WHERE a.tenantId = :tenantId AND a.isDeleted = false GROUP BY a.bankCode")
    List<Object[]> countAccountsByBankAndTenantId(@Param("tenantId") String tenantId);
    
    // ==================== @Deprecated 메서드 (하위 호환성) ====================
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndIsActiveTrueAndIsDeletedFalse 사용하세요.
     */
    @Deprecated
    List<Account> findByIsActiveTrueAndIsDeletedFalse();
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndBranchIdAndIsActiveTrueAndIsDeletedFalse 사용하세요.
     */
    @Deprecated
    List<Account> findByBranchIdAndIsActiveTrueAndIsDeletedFalse(Long branchId);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndIsPrimaryTrueAndIsActiveTrueAndIsDeletedFalse 사용하세요.
     */
    @Deprecated
    Optional<Account> findByIsPrimaryTrueAndIsActiveTrueAndIsDeletedFalse();
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndBranchIdAndIsPrimaryTrueAndIsActiveTrueAndIsDeletedFalse 사용하세요.
     */
    @Deprecated
    Optional<Account> findByBranchIdAndIsPrimaryTrueAndIsActiveTrueAndIsDeletedFalse(Long branchId);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndAccountNumberAndIsDeletedFalse 사용하세요.
     */
    @Deprecated
    Optional<Account> findByAccountNumberAndIsDeletedFalse(String accountNumber);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndBankCodeAndIsActiveTrueAndIsDeletedFalse 사용하세요.
     */
    @Deprecated
    List<Account> findByBankCodeAndIsActiveTrueAndIsDeletedFalse(String bankCode);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! searchAccountsByTenantId 사용하세요.
     */
    @Deprecated
    @Query("SELECT a FROM Account a WHERE " +
           "a.isDeleted = false AND " +
           "a.isActive = true AND " +
           "(a.bankName LIKE %:keyword% OR " +
           "a.accountNumber LIKE %:keyword% OR " +
           "a.accountHolder LIKE %:keyword%)")
    Page<Account> searchAccounts(@Param("keyword") String keyword, Pageable pageable);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! countActiveAccountsByTenantId 사용하세요.
     */
    @Deprecated
    @Query("SELECT COUNT(a) FROM Account a WHERE a.isDeleted = false")
    Long countActiveAccounts();
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! countActiveAccountsOnlyByTenantId 사용하세요.
     */
    @Deprecated
    @Query("SELECT COUNT(a) FROM Account a WHERE a.isActive = true AND a.isDeleted = false")
    Long countActiveAccountsOnly();
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! countAccountsByBankAndTenantId 사용하세요.
     */
    @Deprecated
    @Query("SELECT a.bankCode, COUNT(a) FROM Account a WHERE a.isDeleted = false GROUP BY a.bankCode")
    List<Object[]> countAccountsByBank();
}

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
    
    // 활성 계좌 조회
    List<Account> findByIsActiveTrueAndIsDeletedFalse();
    
    // 지점별 계좌 조회
    List<Account> findByBranchIdAndIsActiveTrueAndIsDeletedFalse(Long branchId);
    
    // 기본 계좌 조회
    Optional<Account> findByIsPrimaryTrueAndIsActiveTrueAndIsDeletedFalse();
    
    // 지점별 기본 계좌 조회
    Optional<Account> findByBranchIdAndIsPrimaryTrueAndIsActiveTrueAndIsDeletedFalse(Long branchId);
    
    // 계좌번호로 조회
    Optional<Account> findByAccountNumberAndIsDeletedFalse(String accountNumber);
    
    // 은행별 계좌 조회
    List<Account> findByBankCodeAndIsActiveTrueAndIsDeletedFalse(String bankCode);
    
    // 계좌 검색 (은행명, 계좌번호, 예금주명)
    @Query("SELECT a FROM Account a WHERE " +
           "a.isDeleted = false AND " +
           "a.isActive = true AND " +
           "(a.bankName LIKE %:keyword% OR " +
           "a.accountNumber LIKE %:keyword% OR " +
           "a.accountHolder LIKE %:keyword%)")
    Page<Account> searchAccounts(@Param("keyword") String keyword, Pageable pageable);
    
    // 계좌 통계
    @Query("SELECT COUNT(a) FROM Account a WHERE a.isDeleted = false")
    Long countActiveAccounts();
    
    @Query("SELECT COUNT(a) FROM Account a WHERE a.isActive = true AND a.isDeleted = false")
    Long countActiveAccountsOnly();
    
    @Query("SELECT a.bankCode, COUNT(a) FROM Account a WHERE a.isDeleted = false GROUP BY a.bankCode")
    List<Object[]> countAccountsByBank();
}

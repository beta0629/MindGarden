package com.mindgarden.consultation.service;

import com.mindgarden.consultation.dto.AccountRequest;
import com.mindgarden.consultation.dto.AccountResponse;
import com.mindgarden.consultation.entity.Account;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;

public interface AccountService {
    
    // 계좌 등록
    AccountResponse createAccount(AccountRequest request);
    
    // 계좌 조회
    AccountResponse getAccount(Long id);
    
    // 계좌 수정
    AccountResponse updateAccount(Long id, AccountRequest request);
    
    // 계좌 삭제 (소프트 삭제)
    void deleteAccount(Long id);
    
    // 계좌 활성화/비활성화
    AccountResponse toggleAccountStatus(Long id);
    
    // 기본 계좌 설정
    AccountResponse setPrimaryAccount(Long id);
    
    // 모든 계좌 조회
    Page<AccountResponse> getAllAccounts(Pageable pageable);
    
    // 활성 계좌 조회
    List<AccountResponse> getActiveAccounts();
    
    // 지점별 계좌 조회
    List<AccountResponse> getAccountsByBranch(Long branchId);
    
    // 계좌 검색
    Page<AccountResponse> searchAccounts(String keyword, Pageable pageable);
    
    // 계좌 통계
    Map<String, Object> getAccountStatistics();
    
    // 계좌 검증
    boolean validateAccount(String bankCode, String accountNumber);
    
    // 기본 계좌 조회
    AccountResponse getPrimaryAccount();
    
    // 지점별 기본 계좌 조회
    AccountResponse getPrimaryAccountByBranch(Long branchId);
}

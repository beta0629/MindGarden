package com.mindgarden.consultation.service.impl;

import com.mindgarden.consultation.dto.AccountRequest;
import com.mindgarden.consultation.dto.AccountResponse;
import com.mindgarden.consultation.entity.Account;
import com.mindgarden.consultation.repository.AccountRepository;
import com.mindgarden.consultation.service.AccountService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AccountServiceImpl implements AccountService {
    
    private final AccountRepository accountRepository;
    
    @Override
    public AccountResponse createAccount(AccountRequest request) {
        log.info("계좌 등록 요청: {}", request);
        
        // 계좌번호 중복 확인
        if (accountRepository.findByAccountNumberAndIsDeletedFalse(request.getAccountNumber()).isPresent()) {
            throw new IllegalArgumentException("이미 등록된 계좌번호입니다: " + request.getAccountNumber());
        }
        
        // 기본 계좌 설정 시 기존 기본 계좌 해제
        if (Boolean.TRUE.equals(request.getIsPrimary())) {
            if (request.getBranchId() != null) {
                accountRepository.findByBranchIdAndIsPrimaryTrueAndIsActiveTrueAndIsDeletedFalse(request.getBranchId())
                        .ifPresent(account -> {
                            account.setIsPrimary(false);
                            accountRepository.save(account);
                        });
            } else {
                accountRepository.findByIsPrimaryTrueAndIsActiveTrueAndIsDeletedFalse()
                        .ifPresent(account -> {
                            account.setIsPrimary(false);
                            accountRepository.save(account);
                        });
            }
        }
        
        Account account = Account.builder()
                .bankCode(request.getBankCode())
                .bankName(request.getBankName())
                .accountNumber(request.getAccountNumber())
                .accountHolder(request.getAccountHolder())
                .branchId(request.getBranchId())
                .isPrimary(request.getIsPrimary())
                .isActive(request.getIsActive())
                .description(request.getDescription())
                .build();
        
        Account savedAccount = accountRepository.save(account);
        log.info("계좌 등록 완료: ID={}, 계좌번호={}", savedAccount.getId(), savedAccount.getAccountNumber());
        
        return AccountResponse.from(savedAccount);
    }
    
    @Override
    @Transactional(readOnly = true)
    public AccountResponse getAccount(Long id) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("계좌를 찾을 수 없습니다: " + id));
        
        if (account.getIsDeleted()) {
            throw new IllegalArgumentException("삭제된 계좌입니다: " + id);
        }
        
        return AccountResponse.from(account);
    }
    
    @Override
    public AccountResponse updateAccount(Long id, AccountRequest request) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("계좌를 찾을 수 없습니다: " + id));
        
        if (account.getIsDeleted()) {
            throw new IllegalArgumentException("삭제된 계좌입니다: " + id);
        }
        
        // 계좌번호 변경 시 중복 확인
        if (!account.getAccountNumber().equals(request.getAccountNumber())) {
            if (accountRepository.findByAccountNumberAndIsDeletedFalse(request.getAccountNumber()).isPresent()) {
                throw new IllegalArgumentException("이미 등록된 계좌번호입니다: " + request.getAccountNumber());
            }
        }
        
        // 기본 계좌 설정 시 기존 기본 계좌 해제
        if (Boolean.TRUE.equals(request.getIsPrimary()) && !Boolean.TRUE.equals(account.getIsPrimary())) {
            if (request.getBranchId() != null) {
                accountRepository.findByBranchIdAndIsPrimaryTrueAndIsActiveTrueAndIsDeletedFalse(request.getBranchId())
                        .ifPresent(existingPrimary -> {
                            existingPrimary.setIsPrimary(false);
                            accountRepository.save(existingPrimary);
                        });
            } else {
                accountRepository.findByIsPrimaryTrueAndIsActiveTrueAndIsDeletedFalse()
                        .ifPresent(existingPrimary -> {
                            existingPrimary.setIsPrimary(false);
                            accountRepository.save(existingPrimary);
                        });
            }
        }
        
        account.setBankCode(request.getBankCode());
        account.setBankName(request.getBankName());
        account.setAccountNumber(request.getAccountNumber());
        account.setAccountHolder(request.getAccountHolder());
        account.setBranchId(request.getBranchId());
        account.setIsPrimary(request.getIsPrimary());
        account.setIsActive(request.getIsActive());
        account.setDescription(request.getDescription());
        
        Account savedAccount = accountRepository.save(account);
        log.info("계좌 수정 완료: ID={}, 계좌번호={}", savedAccount.getId(), savedAccount.getAccountNumber());
        
        return AccountResponse.from(savedAccount);
    }
    
    @Override
    public void deleteAccount(Long id) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("계좌를 찾을 수 없습니다: " + id));
        
        if (account.getIsDeleted()) {
            throw new IllegalArgumentException("이미 삭제된 계좌입니다: " + id);
        }
        
        account.setIsDeleted(true);
        account.setIsActive(false);
        account.setIsPrimary(false);
        accountRepository.save(account);
        
        log.info("계좌 삭제 완료: ID={}, 계좌번호={}", account.getId(), account.getAccountNumber());
    }
    
    @Override
    public AccountResponse toggleAccountStatus(Long id) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("계좌를 찾을 수 없습니다: " + id));
        
        if (account.getIsDeleted()) {
            throw new IllegalArgumentException("삭제된 계좌입니다: " + id);
        }
        
        account.setIsActive(!account.getIsActive());
        if (!account.getIsActive()) {
            account.setIsPrimary(false);
        }
        
        Account savedAccount = accountRepository.save(account);
        log.info("계좌 상태 변경: ID={}, 활성={}", savedAccount.getId(), savedAccount.getIsActive());
        
        return AccountResponse.from(savedAccount);
    }
    
    @Override
    public AccountResponse setPrimaryAccount(Long id) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("계좌를 찾을 수 없습니다: " + id));
        
        if (account.getIsDeleted() || !account.getIsActive()) {
            throw new IllegalArgumentException("활성화된 계좌만 기본 계좌로 설정할 수 있습니다: " + id);
        }
        
        // 기존 기본 계좌 해제
        if (account.getBranchId() != null) {
            accountRepository.findByBranchIdAndIsPrimaryTrueAndIsActiveTrueAndIsDeletedFalse(account.getBranchId())
                    .ifPresent(existingPrimary -> {
                        existingPrimary.setIsPrimary(false);
                        accountRepository.save(existingPrimary);
                    });
        } else {
            accountRepository.findByIsPrimaryTrueAndIsActiveTrueAndIsDeletedFalse()
                    .ifPresent(existingPrimary -> {
                        existingPrimary.setIsPrimary(false);
                        accountRepository.save(existingPrimary);
                    });
        }
        
        account.setIsPrimary(true);
        Account savedAccount = accountRepository.save(account);
        log.info("기본 계좌 설정 완료: ID={}, 계좌번호={}", savedAccount.getId(), savedAccount.getAccountNumber());
        
        return AccountResponse.from(savedAccount);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<AccountResponse> getAllAccounts(Pageable pageable) {
        return accountRepository.findAll(pageable)
                .map(AccountResponse::from);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<AccountResponse> getActiveAccounts() {
        return accountRepository.findByIsActiveTrueAndIsDeletedFalse()
                .stream()
                .map(AccountResponse::from)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<AccountResponse> getAccountsByBranch(Long branchId) {
        return accountRepository.findByBranchIdAndIsActiveTrueAndIsDeletedFalse(branchId)
                .stream()
                .map(AccountResponse::from)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<AccountResponse> searchAccounts(String keyword, Pageable pageable) {
        return accountRepository.searchAccounts(keyword, pageable)
                .map(AccountResponse::from);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getAccountStatistics() {
        Map<String, Object> statistics = new HashMap<>();
        
        statistics.put("totalAccounts", accountRepository.countActiveAccounts());
        statistics.put("activeAccounts", accountRepository.countActiveAccountsOnly());
        statistics.put("bankCounts", accountRepository.countAccountsByBank());
        
        return statistics;
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean validateAccount(String bankCode, String accountNumber) {
        // 간단한 계좌번호 형식 검증
        if (accountNumber == null || accountNumber.trim().isEmpty()) {
            return false;
        }
        
        // 숫자와 하이픈만 허용
        if (!accountNumber.matches("^[0-9-]+$")) {
            return false;
        }
        
        // 은행 코드 검증
        try {
            Account.BankCode.fromCode(bankCode);
        } catch (IllegalArgumentException e) {
            return false;
        }
        
        return true;
    }
    
    @Override
    @Transactional(readOnly = true)
    public AccountResponse getPrimaryAccount() {
        return accountRepository.findByIsPrimaryTrueAndIsActiveTrueAndIsDeletedFalse()
                .map(AccountResponse::from)
                .orElse(null);
    }
    
    @Override
    @Transactional(readOnly = true)
    public AccountResponse getPrimaryAccountByBranch(Long branchId) {
        return accountRepository.findByBranchIdAndIsPrimaryTrueAndIsActiveTrueAndIsDeletedFalse(branchId)
                .map(AccountResponse::from)
                .orElse(null);
    }
}

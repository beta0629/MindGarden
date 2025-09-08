package com.mindgarden.consultation.controller;

import com.mindgarden.consultation.dto.AccountRequest;
import com.mindgarden.consultation.dto.AccountResponse;
import com.mindgarden.consultation.service.AccountService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
@Slf4j
public class AccountController {
    
    private final AccountService accountService;
    
    // 계좌 등록
    @PostMapping
    public ResponseEntity<AccountResponse> createAccount(@Valid @RequestBody AccountRequest request) {
        log.info("계좌 등록 요청: {}", request);
        AccountResponse response = accountService.createAccount(request);
        return ResponseEntity.ok(response);
    }
    
    // 계좌 조회
    @GetMapping("/{id}")
    public ResponseEntity<AccountResponse> getAccount(@PathVariable Long id) {
        AccountResponse response = accountService.getAccount(id);
        return ResponseEntity.ok(response);
    }
    
    // 계좌 수정
    @PutMapping("/{id}")
    public ResponseEntity<AccountResponse> updateAccount(
            @PathVariable Long id, 
            @Valid @RequestBody AccountRequest request) {
        AccountResponse response = accountService.updateAccount(id, request);
        return ResponseEntity.ok(response);
    }
    
    // 계좌 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAccount(@PathVariable Long id) {
        accountService.deleteAccount(id);
        return ResponseEntity.ok().build();
    }
    
    // 계좌 상태 토글
    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<AccountResponse> toggleAccountStatus(@PathVariable Long id) {
        AccountResponse response = accountService.toggleAccountStatus(id);
        return ResponseEntity.ok(response);
    }
    
    // 기본 계좌 설정
    @PatchMapping("/{id}/set-primary")
    public ResponseEntity<AccountResponse> setPrimaryAccount(@PathVariable Long id) {
        AccountResponse response = accountService.setPrimaryAccount(id);
        return ResponseEntity.ok(response);
    }
    
    // 모든 계좌 조회 (페이징)
    @GetMapping
    public ResponseEntity<Page<AccountResponse>> getAllAccounts(Pageable pageable) {
        Page<AccountResponse> response = accountService.getAllAccounts(pageable);
        return ResponseEntity.ok(response);
    }
    
    // 활성 계좌 조회
    @GetMapping("/active")
    public ResponseEntity<List<AccountResponse>> getActiveAccounts() {
        List<AccountResponse> response = accountService.getActiveAccounts();
        return ResponseEntity.ok(response);
    }
    
    // 지점별 계좌 조회
    @GetMapping("/branch/{branchId}")
    public ResponseEntity<List<AccountResponse>> getAccountsByBranch(@PathVariable Long branchId) {
        List<AccountResponse> response = accountService.getAccountsByBranch(branchId);
        return ResponseEntity.ok(response);
    }
    
    // 계좌 검색
    @GetMapping("/search")
    public ResponseEntity<Page<AccountResponse>> searchAccounts(
            @RequestParam String keyword, 
            Pageable pageable) {
        Page<AccountResponse> response = accountService.searchAccounts(keyword, pageable);
        return ResponseEntity.ok(response);
    }
    
    // 계좌 통계
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getAccountStatistics() {
        Map<String, Object> response = accountService.getAccountStatistics();
        return ResponseEntity.ok(response);
    }
    
    // 계좌 검증
    @PostMapping("/validate")
    public ResponseEntity<Map<String, Boolean>> validateAccount(
            @RequestParam String bankCode, 
            @RequestParam String accountNumber) {
        boolean isValid = accountService.validateAccount(bankCode, accountNumber);
        return ResponseEntity.ok(Map.of("valid", isValid));
    }
    
    // 기본 계좌 조회
    @GetMapping("/primary")
    public ResponseEntity<AccountResponse> getPrimaryAccount() {
        AccountResponse response = accountService.getPrimaryAccount();
        return ResponseEntity.ok(response);
    }
    
    // 지점별 기본 계좌 조회
    @GetMapping("/primary/branch/{branchId}")
    public ResponseEntity<AccountResponse> getPrimaryAccountByBranch(@PathVariable Long branchId) {
        AccountResponse response = accountService.getPrimaryAccountByBranch(branchId);
        return ResponseEntity.ok(response);
    }
    
    // 은행 목록 조회
    @GetMapping("/banks")
    public ResponseEntity<List<Map<String, String>>> getBankList() {
        List<Map<String, String>> banks = List.of(
            Map.of("code", "001", "name", "국민은행"),
            Map.of("code", "088", "name", "신한은행"),
            Map.of("code", "020", "name", "우리은행"),
            Map.of("code", "081", "name", "하나은행"),
            Map.of("code", "011", "name", "농협은행"),
            Map.of("code", "003", "name", "기업은행"),
            Map.of("code", "004", "name", "외환은행"),
            Map.of("code", "002", "name", "산업은행"),
            Map.of("code", "007", "name", "수협은행"),
            Map.of("code", "071", "name", "우체국"),
            Map.of("code", "090", "name", "카카오뱅크"),
            Map.of("code", "092", "name", "토스뱅크")
        );
        return ResponseEntity.ok(banks);
    }
}

package com.mindgarden.consultation.controller;

import com.mindgarden.consultation.dto.AccountIntegrationRequest;
import com.mindgarden.consultation.dto.AccountIntegrationResponse;
import com.mindgarden.consultation.service.AccountIntegrationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 계정 통합 컨트롤러
 * SNS 계정과 일반 계정 간의 통합을 처리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@RestController
@RequestMapping("/api/account-integration")
@RequiredArgsConstructor
public class AccountIntegrationController {
    
    private final AccountIntegrationService accountIntegrationService;
    
    /**
     * 이메일 인증 코드 발송
     */
    @PostMapping("/send-verification-code")
    public ResponseEntity<AccountIntegrationResponse> sendVerificationCode(@RequestParam String email) {
        try {
            log.info("이메일 인증 코드 발송 요청: email={}", email);
            
            boolean success = accountIntegrationService.sendEmailVerificationCode(email);
            
            if (success) {
                return ResponseEntity.ok(AccountIntegrationResponse.builder()
                    .success(true)
                    .message("인증 코드가 발송되었습니다.")
                    .build());
            } else {
                return ResponseEntity.badRequest().body(AccountIntegrationResponse.builder()
                    .success(false)
                    .message("인증 코드 발송에 실패했습니다.")
                    .build());
            }
            
        } catch (Exception e) {
            log.error("이메일 인증 코드 발송 실패", e);
            return ResponseEntity.internalServerError().body(AccountIntegrationResponse.builder()
                .success(false)
                .message("서버 오류가 발생했습니다.")
                .build());
        }
    }
    
    /**
     * 이메일 인증 코드 검증
     */
    @PostMapping("/verify-code")
    public ResponseEntity<AccountIntegrationResponse> verifyCode(
            @RequestParam String email, 
            @RequestParam String code) {
        try {
            log.info("이메일 인증 코드 검증 요청: email={}", email);
            
            boolean isValid = accountIntegrationService.verifyEmailCode(email, code);
            
            if (isValid) {
                return ResponseEntity.ok(AccountIntegrationResponse.builder()
                    .success(true)
                    .message("인증 코드가 올바릅니다.")
                    .build());
            } else {
                return ResponseEntity.badRequest().body(AccountIntegrationResponse.builder()
                    .success(false)
                    .message("인증 코드가 올바르지 않거나 만료되었습니다.")
                    .build());
            }
            
        } catch (Exception e) {
            log.error("이메일 인증 코드 검증 실패", e);
            return ResponseEntity.internalServerError().body(AccountIntegrationResponse.builder()
                .success(false)
                .message("서버 오류가 발생했습니다.")
                .build());
        }
    }
    
    /**
     * 계정 통합
     */
    @PostMapping("/integrate")
    public ResponseEntity<AccountIntegrationResponse> integrateAccounts(@RequestBody AccountIntegrationRequest request) {
        try {
            log.info("계정 통합 요청: existingEmail={}, provider={}", 
                    request.getExistingEmail(), request.getProvider());
            
            AccountIntegrationResponse response = accountIntegrationService.integrateAccountsByEmail(request);
            
            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }
            
        } catch (Exception e) {
            log.error("계정 통합 실패", e);
            return ResponseEntity.internalServerError().body(AccountIntegrationResponse.builder()
                .success(false)
                .message("서버 오류가 발생했습니다.")
                .build());
        }
    }
    
    /**
     * 계정 통합 상태 확인
     */
    @GetMapping("/status")
    public ResponseEntity<AccountIntegrationResponse> checkIntegrationStatus(@RequestParam String email) {
        try {
            log.info("계정 통합 상태 확인 요청: email={}", email);
            
            AccountIntegrationResponse response = accountIntegrationService.checkIntegrationStatus(email);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("계정 통합 상태 확인 실패", e);
            return ResponseEntity.internalServerError().body(AccountIntegrationResponse.builder()
                .success(false)
                .message("서버 오류가 발생했습니다.")
                .build());
        }
    }
    
    /**
     * SNS 계정 연결
     */
    @PostMapping("/link-social")
    public ResponseEntity<AccountIntegrationResponse> linkSocialAccount(
            @RequestParam Long userId,
            @RequestParam String provider,
            @RequestParam String providerUserId) {
        try {
            log.info("SNS 계정 연결 요청: userId={}, provider={}", userId, provider);
            
            boolean success = accountIntegrationService.linkSocialAccount(userId, provider, providerUserId);
            
            if (success) {
                return ResponseEntity.ok(AccountIntegrationResponse.builder()
                    .success(true)
                    .message("SNS 계정이 성공적으로 연결되었습니다.")
                    .build());
            } else {
                return ResponseEntity.badRequest().body(AccountIntegrationResponse.builder()
                    .success(false)
                    .message("SNS 계정 연결에 실패했습니다.")
                    .build());
            }
            
        } catch (Exception e) {
            log.error("SNS 계정 연결 실패", e);
            return ResponseEntity.internalServerError().body(AccountIntegrationResponse.builder()
                .success(false)
                .message("서버 오류가 발생했습니다.")
                .build());
        }
    }
}

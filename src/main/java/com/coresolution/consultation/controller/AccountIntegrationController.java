package com.coresolution.consultation.controller;

import com.coresolution.consultation.dto.AccountIntegrationRequest;
import com.coresolution.consultation.dto.AccountIntegrationResponse;
import com.coresolution.consultation.dto.EmailVerificationSendOutcome;
import com.coresolution.consultation.service.AccountIntegrationService;
import com.coresolution.consultation.service.support.ClientPathAccessGuard;
import com.coresolution.consultation.util.EmailLogMasking;
import com.coresolution.consultation.constant.AccountIntegrationApiPaths;
import com.coresolution.consultation.constant.AccountIntegrationMessages;
import com.coresolution.consultation.entity.User;
import com.coresolution.core.util.HttpRequestClientIp;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
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
@RequestMapping(AccountIntegrationApiPaths.BASE)
@RequiredArgsConstructor
public class AccountIntegrationController {
    
    private final AccountIntegrationService accountIntegrationService;

    private final ClientPathAccessGuard clientPathAccessGuard;
    
    /**
     * 이메일 인증 코드 발송. 가입 여부와 무관하게 같은 응답을 돌려준다.
     */
    @PostMapping(AccountIntegrationApiPaths.SEND_VERIFICATION_CODE)
    public ResponseEntity<AccountIntegrationResponse> sendVerificationCode(
            @RequestParam String email, HttpServletRequest httpRequest) {
        try {
            log.info("이메일 인증 코드 발송 요청: email={}", EmailLogMasking.maskForLog(email));

            EmailVerificationSendOutcome outcome = accountIntegrationService.sendEmailVerificationCode(
                email, HttpRequestClientIp.resolve(httpRequest));

            switch (outcome.getStatus()) {
                case SUCCESS:
                    return ResponseEntity.ok(simple(true, AccountIntegrationMessages.CODE_SENT));
                case COOLDOWN:
                    return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                        .header(HttpHeaders.RETRY_AFTER, String.valueOf(outcome.getRetryAfterSeconds()))
                        .body(simple(false, AccountIntegrationMessages.SEND_COOLDOWN));
                case DAILY_LIMIT:
                    return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                        .body(simple(false, AccountIntegrationMessages.SEND_DAILY_LIMIT));
                case IP_LIMIT:
                    return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                        .body(simple(false, AccountIntegrationMessages.SEND_IP_LIMIT));
                case EMAIL_SEND_FAILED:
                default:
                    return ResponseEntity.badRequest().body(simple(false, AccountIntegrationMessages.SERVER_ERROR));
            }

        } catch (Exception e) {
            log.error("이메일 인증 코드 발송 실패", e);
            return ResponseEntity.internalServerError().body(simple(false, AccountIntegrationMessages.SERVER_ERROR));
        }
    }

    /**
     * 이메일 인증 코드 검증
     */
    @PostMapping(AccountIntegrationApiPaths.VERIFY_CODE)
    public ResponseEntity<AccountIntegrationResponse> verifyCode(
            @RequestParam String email,
            @RequestParam String code,
            HttpServletRequest httpRequest) {
        try {
            log.info("이메일 인증 코드 검증 요청: email={}", EmailLogMasking.maskForLog(email));

            boolean locked = accountIntegrationService.isVerificationLocked(email);
            boolean isValid = accountIntegrationService.verifyEmailCode(
                email, code, HttpRequestClientIp.resolve(httpRequest));

            if (isValid) {
                return ResponseEntity.ok(simple(true, AccountIntegrationMessages.CODE_VALID));
            }
            if (locked || accountIntegrationService.isVerificationLocked(email)) {
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(simple(false, AccountIntegrationMessages.CODE_LOCKED));
            }
            return ResponseEntity.badRequest().body(simple(false, AccountIntegrationMessages.CODE_INVALID));

        } catch (Exception e) {
            log.error("이메일 인증 코드 검증 실패", e);
            return ResponseEntity.internalServerError().body(simple(false, AccountIntegrationMessages.SERVER_ERROR));
        }
    }

    /**
     * 계정 통합
     */
    @PostMapping(AccountIntegrationApiPaths.INTEGRATE)
    public ResponseEntity<AccountIntegrationResponse> integrateAccounts(
            @RequestBody AccountIntegrationRequest request, HttpServletRequest httpRequest) {
        try {
            log.info("계정 통합 요청: existingEmail={}, provider={}",
                    EmailLogMasking.maskForLog(request.getExistingEmail()), request.getProvider());

            AccountIntegrationResponse response = accountIntegrationService.integrateAccountsByEmail(
                request, HttpRequestClientIp.resolve(httpRequest));

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            log.error("계정 통합 실패", e);
            return ResponseEntity.internalServerError().body(simple(false, AccountIntegrationMessages.SERVER_ERROR));
        }
    }

    /**
     * 계정 통합 상태 확인 — 로그인 필수, 본인 이메일만, 응답은 연동 여부만.
     */
    @GetMapping(AccountIntegrationApiPaths.STATUS)
    public ResponseEntity<AccountIntegrationResponse> checkIntegrationStatus(
            @RequestParam String email, HttpSession session) {
        User caller = clientPathAccessGuard.requireCaller(session);
        if (caller.getEmail() == null || !caller.getEmail().trim().equalsIgnoreCase(email == null ? "" : email.trim())) {
            throw new AccessDeniedException(AccountIntegrationMessages.STATUS_OWN_EMAIL_ONLY);
        }
        try {
            log.info("계정 통합 상태 확인 요청: userId={}", caller.getId());
            return ResponseEntity.ok(accountIntegrationService.checkIntegrationStatus(caller.getEmail()));
        } catch (Exception e) {
            log.error("계정 통합 상태 확인 실패", e);
            return ResponseEntity.internalServerError().body(simple(false, AccountIntegrationMessages.STATUS_FAILED));
        }
    }

    /**
     * SNS 계정 연결
     */
    @PostMapping(AccountIntegrationApiPaths.LINK_SOCIAL)
    public ResponseEntity<AccountIntegrationResponse> linkSocialAccount(
            @RequestParam(required = false) Long userId,
            @RequestParam String provider,
            @RequestParam String providerUserId,
            HttpSession session) {
        Long ownerId = clientPathAccessGuard.requireSelf(session, userId).getId();
        try {
            log.info("SNS 계정 연결 요청: userId={}, provider={}", ownerId, provider);
            
            boolean success = accountIntegrationService.linkSocialAccount(ownerId, provider, providerUserId);
            
            if (success) {
                return ResponseEntity.ok(AccountIntegrationResponse.builder()
                    .success(true)
                    .message(AccountIntegrationMessages.LINK_SUCCESS)
                    .build());
            } else {
                return ResponseEntity.badRequest().body(AccountIntegrationResponse.builder()
                    .success(false)
                    .message(AccountIntegrationMessages.LINK_FAILED)
                    .build());
            }
            
        } catch (Exception e) {
            log.error("SNS 계정 연결 실패", e);
            return ResponseEntity.internalServerError().body(AccountIntegrationResponse.builder()
                .success(false)
                .message(AccountIntegrationMessages.SERVER_ERROR)
                .build());
        }
    }

    private static AccountIntegrationResponse simple(boolean success, String message) {
        return AccountIntegrationResponse.builder().success(success).message(message).build();
    }
}

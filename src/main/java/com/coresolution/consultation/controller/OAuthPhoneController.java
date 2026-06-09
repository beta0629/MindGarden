package com.coresolution.consultation.controller;

import com.coresolution.consultation.dto.auth.OAuthPhoneSendRequest;
import com.coresolution.consultation.dto.auth.OAuthPhoneSendResponse;
import com.coresolution.consultation.dto.auth.OAuthPhoneVerifyRequest;
import com.coresolution.consultation.dto.auth.OAuthPhoneVerifyResponse;
import com.coresolution.consultation.service.OAuthPhoneVerificationService;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * provider-agnostic OAuth 휴대폰 매칭(OTP) 컨트롤러.
 *
 * <p>4 종 OAuth provider (Apple/Google/Kakao/Naver) 가 동일 스키마로 호출한다.</p>
 *
 * <ul>
 *   <li>{@code POST /api/v1/auth/oauth/phone/send} — OAuth 콜백 후 휴대폰 OTP 발송</li>
 *   <li>{@code POST /api/v1/auth/oauth/phone/verify} — OTP 검증 + 휴대폰 매칭 + JWT 발급</li>
 * </ul>
 *
 * <p>Apple SIWA P1 (PR #158/#161) 의 Apple 전용 엔드포인트
 * ({@code /api/v1/auth/oauth/apple/phone/{send,verify}}) 는 FE PR #161 회귀 방지를 위해
 * 기존 {@link AppleSignInController} 가 그대로 유지한다. 본 컨트롤러는 신규 OAuth provider
 * 일반화 엔드포인트만 담당한다.</p>
 *
 * <p>경로 prefix 가 {@code /api/v1/auth/} 인 이유: Spring Security 매처
 * {@code /api/v1/auth/**} 가 permitAll 로 설정돼 있어 신규 보안 매처 추가 없이 안전하게 노출 가능.
 * 디자이너 산출물(§3) 의 {@code /api/v1/oauth/phone/{send,verify}} 와 prefix 만 다르고 스키마는 동일.</p>
 *
 * @author MindGarden
 * @since 2026-06-09
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/auth/oauth/phone")
@RequiredArgsConstructor
public class OAuthPhoneController extends BaseApiController {

    private final OAuthPhoneVerificationService oauthPhoneVerificationService;

    /**
     * OAuth 휴대폰 매칭 — OTP 발송.
     *
     * @param request {@code oauthProvider + phoneVerificationToken + phone}
     * @return 발송 결과 + challenge 토큰
     */
    @PostMapping("/send")
    public ResponseEntity<ApiResponse<OAuthPhoneSendResponse>> sendOtp(
            @Valid @RequestBody OAuthPhoneSendRequest request) {
        log.info("OAuth phone OTP send 요청 수신: provider={}, hasPhoneVerificationToken={}, hasPhone={}",
            request.getOauthProvider(),
            request.getPhoneVerificationToken() != null,
            request.getPhone() != null);
        OAuthPhoneSendResponse response = oauthPhoneVerificationService.sendOtp(request);
        return success(response.getMessage() != null ? response.getMessage() : "OAuth 휴대폰 OTP 처리", response);
    }

    /**
     * OAuth 휴대폰 매칭 — OTP 검증 + 휴대폰 매칭 + JWT 발급.
     *
     * @param request {@code oauthProvider + phoneVerificationToken + challengeToken + otpCode}
     * @return 로그인/계정선택 결과
     */
    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<OAuthPhoneVerifyResponse>> verifyOtp(
            @Valid @RequestBody OAuthPhoneVerifyRequest request) {
        log.info("OAuth phone OTP verify 요청 수신: provider={}, hasPhoneVerificationToken={}, hasChallengeToken={}",
            request.getOauthProvider(),
            request.getPhoneVerificationToken() != null,
            request.getChallengeToken() != null);
        OAuthPhoneVerifyResponse response = oauthPhoneVerificationService.verifyOtp(request);
        return success(response.getMessage() != null ? response.getMessage() : "OAuth 휴대폰 인증 처리", response);
    }
}

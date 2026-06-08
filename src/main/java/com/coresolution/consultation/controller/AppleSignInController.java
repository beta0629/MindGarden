package com.coresolution.consultation.controller;

import com.coresolution.consultation.dto.auth.ApplePhoneSendRequest;
import com.coresolution.consultation.dto.auth.ApplePhoneSendResponse;
import com.coresolution.consultation.dto.auth.ApplePhoneVerifyRequest;
import com.coresolution.consultation.dto.auth.AppleSignInRequest;
import com.coresolution.consultation.dto.auth.AppleSignInResponse;
import com.coresolution.consultation.service.ApplePhoneVerificationService;
import com.coresolution.consultation.service.AppleSignInService;
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
 * Sign in with Apple (SIWA) 컨트롤러.
 *
 * <p>Apple App Store 4.8 (Login Services) 대응 — T1 트랙.
 * 기존 카카오·네이버 흐름과 별도 endpoint 로 분리 (Apple identityToken 기반 native 검증).</p>
 *
 * <ul>
 *   <li>{@code POST /api/v1/auth/oauth/apple/login} — Native iOS / 웹 (identityToken 우선)</li>
 *   <li>{@code POST /api/v1/auth/oauth/apple/callback} — 웹 서버 콜백 (authorizationCode 우선)</li>
 *   <li>{@code POST /api/v1/auth/oauth/apple/phone/send} — apple_sub 매칭 실패 시 휴대폰 인증 OTP 발송</li>
 *   <li>{@code POST /api/v1/auth/oauth/apple/phone/verify} — OTP 검증 + 휴대폰 매칭 + JWT 발급</li>
 * </ul>
 *
 * <p>두 경로 모두 {@code /api/v1/auth/**} 매처에 의해 permitAll 처리되며,
 * 응답 본문은 {@code ApiResponse<AppleSignInResponse>} 래퍼를 사용한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-07
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/auth/oauth/apple")
@RequiredArgsConstructor
public class AppleSignInController extends BaseApiController {

    private final AppleSignInService appleSignInService;
    private final ApplePhoneVerificationService applePhoneVerificationService;

    /**
     * Apple identityToken 기반 로그인/가입.
     *
     * @param request Apple SIWA 요청 본문 (identityToken 필수, nonce/name/email 선택)
     * @return 표준 ApiResponse 래퍼 + AppleSignInResponse
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AppleSignInResponse>> login(
            @Valid @RequestBody AppleSignInRequest request) {
        log.info("Apple SIWA 로그인 요청 수신: hasIdentityToken={}, hasNonce={}, hasEmail={}",
            request.getIdentityToken() != null,
            request.getNonce() != null,
            request.getEmail() != null);
        AppleSignInResponse response = appleSignInService.signIn(request);
        // TODO(diagnostic) Apple SIWA v1.0.6 호환 진단 완료 후 제거 — 응답 메타 INFO 로그 (PII 없음)
        log.info("Apple SIWA 응답 메타: APPLE_SIWA_RESPONSE_META success={}, requiresSignup={}, "
                + "requiresPhoneVerification={}, requiresPhoneAccountSelection={}, "
                + "hasAccessToken={}, accessTokenLen={}, hasRefreshToken={}, refreshTokenLen={}, "
                + "hasPhoneVerificationToken={}, phoneVerificationTokenLen={}, "
                + "hasPhoneAccountSelectionToken={}, phoneAccountSelectionTokenLen={}, "
                + "hasUser={}, userId={}, userRole={}, hasTenantId={}, "
                + "hasSocialUserInfo={}, messageLen={}",
            response.isSuccess(),
            response.isRequiresSignup(),
            response.isRequiresPhoneVerification(),
            response.isRequiresPhoneAccountSelection(),
            response.getAccessToken() != null,
            response.getAccessToken() != null ? response.getAccessToken().length() : 0,
            response.getRefreshToken() != null,
            response.getRefreshToken() != null ? response.getRefreshToken().length() : 0,
            response.getPhoneVerificationToken() != null,
            response.getPhoneVerificationToken() != null ? response.getPhoneVerificationToken().length() : 0,
            response.getPhoneAccountSelectionToken() != null,
            response.getPhoneAccountSelectionToken() != null ? response.getPhoneAccountSelectionToken().length() : 0,
            response.getUser() != null,
            response.getUser() != null ? response.getUser().getId() : null,
            response.getUser() != null ? response.getUser().getRole() : null,
            response.getUser() != null && response.getUser().getTenantId() != null,
            response.getSocialUserInfo() != null,
            response.getMessage() != null ? response.getMessage().length() : 0);
        if (response.isSuccess()) {
            return success(response.getMessage() != null ? response.getMessage() : "Apple 로그인 성공", response);
        }
        return success(response.getMessage() != null ? response.getMessage() : "Apple 로그인 실패", response);
    }

    /**
     * Apple 웹 콜백(authorization_code) 흐름.
     *
     * @param request Apple SIWA 요청 본문 (authorizationCode 필수)
     * @return 표준 ApiResponse 래퍼 + AppleSignInResponse
     */
    @PostMapping("/callback")
    public ResponseEntity<ApiResponse<AppleSignInResponse>> callback(
            @Valid @RequestBody AppleSignInRequest request) {
        log.info("Apple SIWA 콜백 요청 수신: hasAuthorizationCode={}",
            request.getAuthorizationCode() != null);
        AppleSignInResponse response = appleSignInService.callback(request);
        if (response.isSuccess()) {
            return success(response.getMessage() != null ? response.getMessage() : "Apple 콜백 처리 성공", response);
        }
        return success(response.getMessage() != null ? response.getMessage() : "Apple 콜백 처리 실패", response);
    }

    /**
     * Apple SIWA 휴대폰 매칭 흐름 — OTP 발송.
     *
     * <p>{@code /api/v1/auth/oauth/apple/login} 응답으로 받은 {@code phoneVerificationToken} 과
     * 사용자가 입력한 휴대폰 번호로 OTP 를 발송한다. 응답에는 verify 시 함께 보낼 {@code otpChallengeToken} 이 포함된다.</p>
     *
     * @param request {@code phoneVerificationToken + phoneNumber}
     * @return 발송 결과 + challenge 토큰
     */
    @PostMapping("/phone/send")
    public ResponseEntity<ApiResponse<ApplePhoneSendResponse>> sendPhoneOtp(
            @Valid @RequestBody ApplePhoneSendRequest request) {
        log.info("Apple SIWA OTP 발송 요청 수신: hasPhoneVerificationToken={}, hasPhoneNumber={}",
            request.getPhoneVerificationToken() != null,
            request.getPhoneNumber() != null);
        ApplePhoneSendResponse response = applePhoneVerificationService.sendOtp(request);
        return success(response.getMessage() != null ? response.getMessage() : "Apple SIWA OTP 처리", response);
    }

    /**
     * Apple SIWA 휴대폰 매칭 흐름 — OTP 검증 + 휴대폰 매칭 + JWT 발급.
     *
     * <p>휴대폰 매칭 결과에 따라:
     * <ul>
     *   <li>매칭 1명/없음 → {@code success=true} + accessToken/refreshToken + user (정상 로그인)</li>
     *   <li>매칭 N명(역할 혼재) → {@code requiresPhoneAccountSelection=true} + 기존 OAuth 계정 선택 토큰</li>
     * </ul>
     * </p>
     *
     * @param request {@code phoneVerificationToken + otpChallengeToken + code}
     * @return AppleSignInResponse (정상 로그인 응답 또는 selection 분기)
     */
    @PostMapping("/phone/verify")
    public ResponseEntity<ApiResponse<AppleSignInResponse>> verifyPhoneOtp(
            @Valid @RequestBody ApplePhoneVerifyRequest request) {
        log.info("Apple SIWA OTP 검증 요청 수신: hasPhoneVerificationToken={}, hasOtpChallengeToken={}, hasCode={}",
            request.getPhoneVerificationToken() != null,
            request.getOtpChallengeToken() != null,
            request.getCode() != null);
        AppleSignInResponse response = applePhoneVerificationService.verifyOtp(request);
        return success(response.getMessage() != null ? response.getMessage() : "Apple SIWA 휴대폰 인증 처리", response);
    }
}

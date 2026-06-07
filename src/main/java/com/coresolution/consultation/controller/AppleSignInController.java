package com.coresolution.consultation.controller;

import com.coresolution.consultation.dto.auth.AppleSignInRequest;
import com.coresolution.consultation.dto.auth.AppleSignInResponse;
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
        if (response.isSuccess()) {
            return success(response.isRequiresSignup()
                ? "Apple 신규 가입 정보 prefill"
                : (response.getMessage() != null ? response.getMessage() : "Apple 로그인 성공"), response);
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
}

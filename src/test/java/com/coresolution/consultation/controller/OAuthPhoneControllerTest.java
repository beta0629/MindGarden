package com.coresolution.consultation.controller;

import com.coresolution.consultation.dto.auth.OAuthPhoneSendRequest;
import com.coresolution.consultation.dto.auth.OAuthPhoneSendResponse;
import com.coresolution.consultation.dto.auth.OAuthPhoneVerifyRequest;
import com.coresolution.consultation.dto.auth.OAuthPhoneVerifyResponse;
import com.coresolution.consultation.entity.auth.OAuthProvider;
import com.coresolution.consultation.service.OAuthPhoneVerificationService;
import com.coresolution.core.dto.ApiResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@link OAuthPhoneController} 단위 테스트.
 *
 * <p>provider-agnostic 휴대폰 매칭 엔드포인트가 OAuthPhoneVerificationService 응답을
 * ApiResponse 래퍼로 정확히 전달하는지 검증한다. Apple alias 엔드포인트
 * ({@code /api/v1/auth/oauth/apple/phone/{send,verify}}) 는 {@link AppleSignInController} 가
 * 기존대로 처리하며, 본 컨트롤러는 신규 provider-agnostic 엔드포인트만 담당한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-09
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("OAuthPhoneController")
class OAuthPhoneControllerTest {

    @Mock
    private OAuthPhoneVerificationService oauthPhoneVerificationService;

    @InjectMocks
    private OAuthPhoneController controller;

    @Test
    @DisplayName("/send — KAKAO 요청을 service 에 위임하고 ApiResponse 200 으로 래핑한다")
    void send_kakao_delegatesAndWraps() {
        OAuthPhoneSendRequest request = OAuthPhoneSendRequest.builder()
            .oauthProvider(OAuthProvider.KAKAO)
            .phoneVerificationToken("pv-jwt")
            .phone("01012345678")
            .build();
        OAuthPhoneSendResponse stub = OAuthPhoneSendResponse.builder()
            .success(true)
            .message("인증번호를 전송했습니다.")
            .challengeToken("challenge-jwt")
            .expiresInSeconds(180L)
            .maskedPhone("010-****-5678")
            .build();
        when(oauthPhoneVerificationService.sendOtp(any(OAuthPhoneSendRequest.class))).thenReturn(stub);

        ResponseEntity<ApiResponse<OAuthPhoneSendResponse>> response = controller.sendOtp(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();
        assertThat(response.getBody().getData().getChallengeToken()).isEqualTo("challenge-jwt");
        assertThat(response.getBody().getData().getMaskedPhone()).isEqualTo("010-****-5678");
        verify(oauthPhoneVerificationService).sendOtp(request);
    }

    @Test
    @DisplayName("/send — NAVER 쿨다운 응답 그대로 전달 (retryAfterSeconds + code)")
    void send_naver_cooldown_passthrough() {
        OAuthPhoneSendResponse cooldown = OAuthPhoneSendResponse.builder()
            .success(false)
            .code("RESEND_COOLDOWN")
            .message("잠시 후 다시 시도해 주세요.")
            .retryAfterSeconds(45L)
            .resendCooldownSeconds(60L)
            .build();
        when(oauthPhoneVerificationService.sendOtp(any())).thenReturn(cooldown);

        ResponseEntity<ApiResponse<OAuthPhoneSendResponse>> response = controller.sendOtp(
            OAuthPhoneSendRequest.builder()
                .oauthProvider(OAuthProvider.NAVER)
                .phoneVerificationToken("pv-jwt")
                .phone("01012345678")
                .build());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData().getCode()).isEqualTo("RESEND_COOLDOWN");
        assertThat(response.getBody().getData().getRetryAfterSeconds()).isEqualTo(45L);
    }

    @Test
    @DisplayName("/verify — APPLE 정상 검증 응답을 ApiResponse 200 으로 래핑한다")
    void verify_apple_passesThroughTokens() {
        OAuthPhoneVerifyRequest request = OAuthPhoneVerifyRequest.builder()
            .oauthProvider(OAuthProvider.APPLE)
            .phoneVerificationToken("pv-jwt")
            .challengeToken("oc-jwt")
            .otpCode("123456")
            .build();
        OAuthPhoneVerifyResponse stub = OAuthPhoneVerifyResponse.builder()
            .success(true)
            .message("휴대폰 인증 완료 — 기존 계정 연결")
            .accessToken("access-jwt")
            .refreshToken("refresh-jwt")
            .matchedAccount(OAuthPhoneVerifyResponse.MatchedAccount.builder()
                .userId(123L)
                .tenantId("t1")
                .role("CLIENT")
                .build())
            .build();
        when(oauthPhoneVerificationService.verifyOtp(any(OAuthPhoneVerifyRequest.class))).thenReturn(stub);

        ResponseEntity<ApiResponse<OAuthPhoneVerifyResponse>> response = controller.verifyOtp(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData().getAccessToken()).isEqualTo("access-jwt");
        assertThat(response.getBody().getData().getMatchedAccount().getUserId()).isEqualTo(123L);
        verify(oauthPhoneVerificationService).verifyOtp(request);
    }

    @Test
    @DisplayName("/verify — 다중 매칭 시 phoneAccountSelectionToken 응답 전달")
    void verify_naver_multiMatch_returnsSelectionToken() {
        OAuthPhoneVerifyResponse multi = OAuthPhoneVerifyResponse.builder()
            .success(true)
            .requiresPhoneAccountSelection(true)
            .phoneAccountSelectionToken("selection-jwt")
            .message("동일 전화번호에 여러 역할이 있어 계정을 선택해 주세요.")
            .build();
        when(oauthPhoneVerificationService.verifyOtp(any())).thenReturn(multi);

        ResponseEntity<ApiResponse<OAuthPhoneVerifyResponse>> response = controller.verifyOtp(
            OAuthPhoneVerifyRequest.builder()
                .oauthProvider(OAuthProvider.NAVER)
                .phoneVerificationToken("pv-jwt")
                .challengeToken("oc-jwt")
                .otpCode("123456")
                .build());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getData().isRequiresPhoneAccountSelection()).isTrue();
        assertThat(response.getBody().getData().getPhoneAccountSelectionToken()).isEqualTo("selection-jwt");
    }
}

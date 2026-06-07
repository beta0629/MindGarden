package com.coresolution.consultation.controller;

import com.coresolution.consultation.dto.auth.AppleSignInRequest;
import com.coresolution.consultation.dto.auth.AppleSignInResponse;
import com.coresolution.consultation.dto.auth.AppleUserSummary;
import com.coresolution.consultation.service.AppleSignInService;
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
 * {@link AppleSignInController} 단위 테스트.
 *
 * <p>Apple App Store 4.8 (T1) — `/login`, `/callback` 두 엔드포인트가
 * 서비스 응답을 ApiResponse 래퍼로 정확히 전달하는지 검증한다.</p>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AppleSignInController")
class AppleSignInControllerTest {

    @Mock
    private AppleSignInService appleSignInService;

    @InjectMocks
    private AppleSignInController controller;

    private AppleSignInResponse authenticated() {
        return AppleSignInResponse.builder()
            .success(true)
            .requiresSignup(false)
            .message("Apple 로그인 성공")
            .accessToken("access-jwt")
            .refreshToken("refresh-jwt")
            .user(AppleUserSummary.builder()
                .id(1L)
                .email("user@example.com")
                .role("CLIENT")
                .build())
            .build();
    }

    @Test
    @DisplayName("/login — 서비스 응답을 ApiResponse 200 으로 래핑한다")
    void login_delegatesToService_andWrapsSuccess() {
        AppleSignInRequest request = AppleSignInRequest.builder()
            .identityToken("eyJ.fake.token")
            .nonce("nonce-1")
            .build();
        when(appleSignInService.signIn(any(AppleSignInRequest.class))).thenReturn(authenticated());

        ResponseEntity<ApiResponse<AppleSignInResponse>> response = controller.login(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();
        assertThat(response.getBody().getData()).isNotNull();
        assertThat(response.getBody().getData().getAccessToken()).isEqualTo("access-jwt");
        verify(appleSignInService).signIn(request);
    }

    @Test
    @DisplayName("/login — 신규 가입 분기는 requiresSignup=true 그대로 전달한다")
    void login_passesRequiresSignupFlag() {
        AppleSignInResponse signupNeeded = AppleSignInResponse.builder()
            .success(true)
            .requiresSignup(true)
            .message("Apple 신규 가입 정보 prefill")
            .build();
        when(appleSignInService.signIn(any())).thenReturn(signupNeeded);

        ResponseEntity<ApiResponse<AppleSignInResponse>> response = controller.login(
            AppleSignInRequest.builder().identityToken("eyJ.fake.token").build());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData().isRequiresSignup()).isTrue();
    }

    @Test
    @DisplayName("/callback — authorization_code 흐름도 동일하게 래핑된다")
    void callback_delegatesToService() {
        AppleSignInRequest request = AppleSignInRequest.builder()
            .identityToken("eyJ.fake.token")
            .authorizationCode("auth-code-1")
            .build();
        when(appleSignInService.callback(any())).thenReturn(authenticated());

        ResponseEntity<ApiResponse<AppleSignInResponse>> response = controller.callback(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData().getRefreshToken()).isEqualTo("refresh-jwt");
        verify(appleSignInService).callback(request);
    }
}

package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Map;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.dto.AuthResponse;
import com.coresolution.consultation.dto.PasswordChangeRequest;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.SmsOtpVerificationFailedException;
import com.coresolution.consultation.service.AuthService;
import com.coresolution.consultation.service.PasswordConfigService;
import com.coresolution.consultation.service.PasswordResetService;
import com.coresolution.consultation.service.PasswordValidationService;
import com.coresolution.consultation.service.SmsOtpVerificationService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.security.PasswordService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpSession;

/**
 * 첫 로그인({@code isPasswordChanged=false}) 비밀번호 변경 시 휴대폰 OTP 필수 검증.
 *
 * @author MindGarden
 * @since 2026-10-28
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("PasswordManagementController — 첫 로그인 OTP")
class PasswordManagementControllerFirstLoginOtpTest {

    private static final String PHONE_ENC = "enc:01099998888";
    private static final String PHONE_PLAIN = "01099998888";
    private static final String OTP = "123456";

    @Mock private PasswordValidationService passwordValidationService;
    @Mock private PasswordConfigService passwordConfigService;
    @Mock private PasswordResetService passwordResetService;
    @Mock private UserService userService;
    @Mock private PasswordService passwordService;
    @Mock private AuthService authService;
    @Mock private SmsOtpVerificationService smsOtpVerificationService;
    @Mock private PersonalDataEncryptionUtil encryptionUtil;
    @Mock private HttpServletRequest httpRequest;

    @InjectMocks
    private PasswordManagementController controller;

    private User firstLoginUser;
    private HttpSession session;

    @BeforeEach
    void setUp() {
        firstLoginUser = new User();
        firstLoginUser.setId(42L);
        firstLoginUser.setPassword("hashed-old");
        firstLoginUser.setIsPasswordChanged(Boolean.FALSE);
        firstLoginUser.setPhone(PHONE_ENC);

        session = new MockHttpSession();
        session.setAttribute(SessionConstants.USER_OBJECT, firstLoginUser);
    }

    @Test
    @DisplayName("첫 로그인 — OTP 없으면 400, 비밀번호 변경 미호출")
    void firstLogin_withoutOtp_returns400() {
        PasswordChangeRequest request = PasswordChangeRequest.builder()
                .currentPassword("TempPass1!")
                .newPassword("NewPass1@x")
                .confirmPassword("NewPass1@x")
                .build();

        when(encryptionUtil.safeDecrypt(PHONE_ENC)).thenReturn(PHONE_PLAIN);

        ResponseEntity<Map<String, Object>> response =
                controller.changePassword(request, session, httpRequest);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).containsEntry("success", false);
        assertThat(String.valueOf(response.getBody().get("message"))).contains("인증 코드");
        verify(userService, never()).changePassword(anyLong(), anyString(), anyString());
        verify(smsOtpVerificationService, never()).verifyAndConsume(anyString(), anyString());
    }

    @Test
    @DisplayName("첫 로그인 — OTP 틀리면 400, 비밀번호 변경 미호출")
    void firstLogin_invalidOtp_returns400() {
        PasswordChangeRequest request = PasswordChangeRequest.builder()
                .currentPassword("TempPass1!")
                .newPassword("NewPass1@x")
                .confirmPassword("NewPass1@x")
                .verificationCode("000000")
                .build();

        when(encryptionUtil.safeDecrypt(PHONE_ENC)).thenReturn(PHONE_PLAIN);
        when(smsOtpVerificationService.verifyAndConsume(PHONE_PLAIN, "000000")).thenReturn(false);
        when(smsOtpVerificationService.getSendStatus(PHONE_PLAIN)).thenReturn(null);

        ResponseEntity<Map<String, Object>> response =
                controller.changePassword(request, session, httpRequest);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).containsEntry("success", false);
        assertThat(response.getBody().get("message"))
                .isEqualTo(SmsOtpVerificationFailedException.MSG_INVALID);
        verify(userService, never()).changePassword(anyLong(), anyString(), anyString());
    }

    @Test
    @DisplayName("첫 로그인 — 유효 OTP 이면 비밀번호 변경 성공")
    void firstLogin_validOtp_changesPassword() {
        PasswordChangeRequest request = PasswordChangeRequest.builder()
                .currentPassword("TempPass1!")
                .newPassword("NewPass1@x")
                .confirmPassword("NewPass1@x")
                .verificationCode(OTP)
                .build();

        when(encryptionUtil.safeDecrypt(PHONE_ENC)).thenReturn(PHONE_PLAIN);
        when(smsOtpVerificationService.verifyAndConsume(PHONE_PLAIN, OTP)).thenReturn(true);
        when(passwordValidationService.validatePassword("NewPass1@x"))
                .thenReturn(Map.of("isValid", true));
        when(passwordService.matches("TempPass1!", "hashed-old")).thenReturn(true);
        when(passwordService.matches("NewPass1@x", "hashed-old")).thenReturn(false);
        when(authService.issueTokensForUser(any(User.class), eq(httpRequest)))
                .thenReturn(AuthResponse.builder().token("access").refreshToken("refresh").build());

        ResponseEntity<Map<String, Object>> response =
                controller.changePassword(request, session, httpRequest);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsEntry("success", true);
        verify(userService).changePassword(42L, "TempPass1!", "NewPass1@x");
        verify(smsOtpVerificationService).verifyAndConsume(PHONE_PLAIN, OTP);
    }

    @Test
    @DisplayName("일반 변경(isPasswordChanged=true) — OTP 없이 진행")
    void normalChange_skipsOtp() {
        firstLoginUser.setIsPasswordChanged(Boolean.TRUE);
        PasswordChangeRequest request = PasswordChangeRequest.builder()
                .currentPassword("OldPass1!")
                .newPassword("NewPass1@x")
                .confirmPassword("NewPass1@x")
                .build();

        when(passwordValidationService.validatePassword("NewPass1@x"))
                .thenReturn(Map.of("isValid", true));
        when(passwordService.matches("OldPass1!", "hashed-old")).thenReturn(true);
        when(passwordService.matches("NewPass1@x", "hashed-old")).thenReturn(false);
        when(authService.issueTokensForUser(any(User.class), eq(httpRequest)))
                .thenReturn(AuthResponse.builder().build());

        ResponseEntity<Map<String, Object>> response =
                controller.changePassword(request, session, httpRequest);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(smsOtpVerificationService, never()).verifyAndConsume(anyString(), anyString());
        verify(userService).changePassword(42L, "OldPass1!", "NewPass1@x");
        verify(encryptionUtil, never()).safeDecrypt(anyString());
    }

    @Test
    @DisplayName("첫 로그인 — 휴대폰 없으면 400")
    void firstLogin_missingPhone_returns400() {
        firstLoginUser.setPhone(null);
        PasswordChangeRequest request = PasswordChangeRequest.builder()
                .currentPassword("TempPass1!")
                .newPassword("NewPass1@x")
                .confirmPassword("NewPass1@x")
                .verificationCode(OTP)
                .build();

        ResponseEntity<Map<String, Object>> response =
                controller.changePassword(request, session, httpRequest);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(String.valueOf(response.getBody().get("message"))).contains("관리자");
        verify(userService, never()).changePassword(anyLong(), anyString(), anyString());
    }
}

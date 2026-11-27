package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import com.coresolution.consultation.constant.AuditAction;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.MyPageEmailChangeRequest;
import com.coresolution.consultation.entity.AuditLog;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserAddressRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.AuditLogService;
import com.coresolution.consultation.service.EmailOtpVerificationService;
import com.coresolution.consultation.service.ProfileImageStorageService;
import com.coresolution.consultation.service.RefreshTokenService;
import com.coresolution.consultation.service.SmsOtpVerificationService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@code MyPageServiceImpl#changeEmail} 단위 테스트 — 정규화·OTP 검증·tenant unique·AuditLog
 * 적재·세션/JWT 강제 만료 검증 (Phase B).
 *
 * <p>커버리지:
 * <ul>
 *   <li>정규화: 대문자/공백 입력 → {@code trim().toLowerCase()} 결과로 저장·OTP 키 사용</li>
 *   <li>형식: 잘못된 이메일 형식 → IllegalArgumentException</li>
 *   <li>OTP: 만료/불일치/미발송 거부</li>
 *   <li>중복: 같은 tenant 내 다른 사용자가 이미 사용 중인 경우 차단</li>
 *   <li>AuditLog: {@link AuditAction#USER_EMAIL_CHANGE} 로 적재</li>
 *   <li>세션·JWT 강제 만료: {@link RefreshTokenService#revokeAllUserTokens(Long)} 호출</li>
 * </ul></p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("MyPageServiceImpl 이메일 변경(Phase B)")
class MyPageServiceImplEmailChangeTest {

    private static final String TENANT = "tenant-email-" + UUID.randomUUID();
    private static final Long USER_ID = 42L;
    private static final String OTP = "123456";
    private static final String NORMALIZED_EMAIL = "new.user@example.com";

    @Mock
    private UserRepository userRepository;
    @Mock
    private UserService userService;
    @Mock
    private PersonalDataEncryptionUtil encryptionUtil;
    @Mock
    private UserAddressRepository userAddressRepository;
    @Mock
    private NotificationChannelPreferenceResolutionService notificationChannelPreferenceResolutionService;
    @Mock
    private ProfileImageStorageService profileImageStorageService;
    @Mock
    private SmsOtpVerificationService smsOtpVerificationService;
    @Mock
    private EmailOtpVerificationService emailOtpVerificationService;
    @Mock
    private RefreshTokenService refreshTokenService;
    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private MyPageServiceImpl myPageService;

    @BeforeEach
    void setTenant() {
        TenantContextHolder.setTenantId(TENANT);
        lenient().when(userRepository.findProfileImageInfoByUserId(eq(TENANT), eq(USER_ID)))
                .thenReturn(Collections.emptyList());
        lenient().when(userAddressRepository.findByUserIdAndIsPrimaryTrueAndIsDeletedFalse(eq(USER_ID)))
                .thenReturn(Optional.empty());
        lenient().when(notificationChannelPreferenceResolutionService.buildProfileSnapshot(any()))
                .thenReturn(new NotificationChannelPreferenceResolutionService.NotificationChannelProfileSnapshot(
                        null, false, false, null, false));
    }

    @AfterEach
    void clearTenant() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("정규화: 대문자·공백 입력 → trim().toLowerCase() 결과로 OTP 검증·저장 호출")
    void normalizesUppercaseAndWhitespace() {
        prepareSuccess();
        myPageService.changeEmail(USER_ID, request("  New.User@Example.COM  ", OTP));
        verify(emailOtpVerificationService).verifyAndConsume(NORMALIZED_EMAIL, OTP);
        verify(userRepository, never()).existsByTenantIdAndEmailAndIdNot(
                eq(TENANT), eq("  New.User@Example.COM  "), eq(USER_ID));
        verify(userRepository).existsByTenantIdAndEmailAndIdNot(TENANT, NORMALIZED_EMAIL, USER_ID);
    }

    @Test
    @DisplayName("형식 위반: '@ 없음' → IllegalArgumentException 던지고 OTP 검증 호출도 없음")
    void rejectsInvalidEmailFormat() {
        when(userRepository.findByTenantIdAndId(TENANT, USER_ID))
                .thenReturn(Optional.of(buildUser()));

        assertThatThrownBy(() -> myPageService.changeEmail(USER_ID, request("not-an-email", OTP)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("이메일 형식");

        verify(emailOtpVerificationService, never()).verifyAndConsume(any(), any());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("OTP 만료·불일치·미발송 → IllegalArgumentException 던지고 저장 안 함")
    void rejectsInvalidOtp() {
        when(userRepository.findByTenantIdAndId(TENANT, USER_ID))
                .thenReturn(Optional.of(buildUser()));
        when(emailOtpVerificationService.verifyAndConsume(NORMALIZED_EMAIL, OTP)).thenReturn(false);

        assertThatThrownBy(() -> myPageService.changeEmail(USER_ID, request(NORMALIZED_EMAIL, OTP)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("인증 코드");

        verify(userRepository, never()).save(any());
        verify(auditLogService, never()).record(any());
        verify(refreshTokenService, never()).revokeAllUserTokens(any());
    }

    @Test
    @DisplayName("tenant 내 다른 사용자가 동일 이메일 사용 중 → IllegalArgumentException 차단")
    void rejectsDuplicateEmailInSameTenant() {
        when(userRepository.findByTenantIdAndId(TENANT, USER_ID))
                .thenReturn(Optional.of(buildUser()));
        when(emailOtpVerificationService.verifyAndConsume(NORMALIZED_EMAIL, OTP)).thenReturn(true);
        when(userRepository.existsByTenantIdAndEmailAndIdNot(TENANT, NORMALIZED_EMAIL, USER_ID))
                .thenReturn(true);

        assertThatThrownBy(() -> myPageService.changeEmail(USER_ID, request(NORMALIZED_EMAIL, OTP)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("이미 사용");

        verify(userRepository, never()).save(any());
        verify(auditLogService, never()).record(any());
        verify(refreshTokenService, never()).revokeAllUserTokens(any());
    }

    @Test
    @DisplayName("AuditLog: USER_EMAIL_CHANGE 로 마스킹된 before/after metadata 기록")
    void recordsAuditLogOnSuccess() {
        prepareSuccess();

        myPageService.changeEmail(USER_ID, request(NORMALIZED_EMAIL, OTP));

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogService).record(captor.capture());
        AuditLog logged = captor.getValue();

        assertThat(logged.getAction()).isEqualTo(AuditAction.USER_EMAIL_CHANGE);
        assertThat(logged.getTenantId()).isEqualTo(TENANT);
        assertThat(logged.getActorUserId()).isEqualTo(USER_ID);
        assertThat(logged.getTargetUserId()).isEqualTo(USER_ID);
        assertThat(logged.getEntityType()).isEqualTo("USER");
        assertThat(logged.getEntityId()).isEqualTo(USER_ID);
        // 마스킹된 새 이메일은 n***@e***.com 형태이며 평문이 포함되어선 안 된다.
        assertThat(logged.getMetadataJson())
                .contains("\"phase\":\"B\"")
                .doesNotContain(NORMALIZED_EMAIL);
    }

    @Test
    @DisplayName("성공 시 RefreshTokenService.revokeAllUserTokens(userId) 호출 → JWT 강제 만료")
    void revokesAllRefreshTokensOnSuccess() {
        prepareSuccess();

        myPageService.changeEmail(USER_ID, request(NORMALIZED_EMAIL, OTP));

        verify(refreshTokenService).revokeAllUserTokens(USER_ID);
    }

    // ---------- helpers ----------

    private void prepareSuccess() {
        when(userRepository.findByTenantIdAndId(TENANT, USER_ID)).thenReturn(Optional.of(buildUser()));
        when(emailOtpVerificationService.verifyAndConsume(eq(NORMALIZED_EMAIL), eq(OTP))).thenReturn(true);
        when(userRepository.existsByTenantIdAndEmailAndIdNot(eq(TENANT), eq(NORMALIZED_EMAIL), eq(USER_ID)))
                .thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private MyPageEmailChangeRequest request(String email, String code) {
        return MyPageEmailChangeRequest.builder()
                .newEmail(email)
                .verificationCode(code)
                .build();
    }

    private User buildUser() {
        User u = User.builder()
                .userId("u" + USER_ID)
                .email("old.user@example.com")
                .name("n")
                .role(UserRole.CLIENT)
                .phone("enc-phone")
                .isActive(true)
                .build();
        u.setId(USER_ID);
        u.setTenantId(TENANT);
        u.setIsDeleted(false);
        return u;
    }
}

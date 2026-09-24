package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.auth.PhoneOtpAttempt;
import com.coresolution.consultation.repository.auth.PhoneOtpAttemptRepository;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.consultation.util.PhoneHashUtils;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * phone_otp_attempts VERIFIED 장부 SSOT — PROFILE·OAuth(APPLE/KAKAO) OTP 성공 행 모두 결제 게이트 허용.
 *
 * @author MindGarden
 * @since 2026-09-18
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ClientProfilePhoneVerificationServiceImpl")
class ClientProfilePhoneVerificationServiceImplTest {

    private static final String TENANT = "tpf-" + UUID.randomUUID().toString().replace("-", "").substring(0, 32);
    private static final Long USER_ID = 77L;
    private static final String PHONE = "01012345678";
    private static final String PHONE_HASH = PhoneHashUtils.sha256Hex(PHONE);

    @Mock
    private PhoneOtpAttemptRepository phoneOtpAttemptRepository;
    @Mock
    private PersonalDataEncryptionUtil encryptionUtil;

    @InjectMocks
    private ClientProfilePhoneVerificationServiceImpl service;

    @Test
    @DisplayName("recordVerifiedAfterChangePhone — PROFILE VERIFIED 행 저장")
    void recordVerified_writesProfileVerifiedRow() {
        service.recordVerifiedAfterChangePhone(TENANT, USER_ID, PHONE);

        ArgumentCaptor<PhoneOtpAttempt> captor = ArgumentCaptor.forClass(PhoneOtpAttempt.class);
        verify(phoneOtpAttemptRepository).save(captor.capture());
        PhoneOtpAttempt row = captor.getValue();
        assertThat(row.getTenantId()).isEqualTo(TENANT);
        assertThat(row.getProvider()).isEqualTo(PhoneOtpAttempt.PROVIDER_PROFILE);
        assertThat(row.getProviderUserId()).isEqualTo(String.valueOf(USER_ID));
        assertThat(row.getPhoneHash()).isEqualTo(PHONE_HASH);
        assertThat(row.getStatus()).isEqualTo(PhoneOtpAttempt.STATUS_VERIFIED);
        assertThat(row.getVerifiedAt()).isNotNull();
        assertThat(row.getCodeHash()).isNotBlank();
        assertThat(row.getAttempts()).isNotNull();
        assertThat(row.getDailyCount()).isNotNull();
        assertThat(row.getCreatedAt()).isNotNull();
        assertThat(row.getExpiresAt()).isNotNull();
    }

    @Test
    @DisplayName("isPhoneVerifiedForPayment — PROFILE VERIFIED + 동일 phone_hash 이면 true")
    void isVerified_whenProfileRowMatches() {
        User user = buildUser(PHONE);
        when(encryptionUtil.safeDecrypt("enc-" + PHONE)).thenReturn(PHONE);
        when(phoneOtpAttemptRepository
                .findFirstByTenantIdAndPhoneHashAndStatusAndVerifiedAtIsNotNullOrderByVerifiedAtDesc(
                        eq(TENANT),
                        eq(PHONE_HASH),
                        eq(PhoneOtpAttempt.STATUS_VERIFIED)))
                .thenReturn(Optional.of(PhoneOtpAttempt.builder()
                        .provider(PhoneOtpAttempt.PROVIDER_PROFILE)
                        .status(PhoneOtpAttempt.STATUS_VERIFIED)
                        .phoneHash(PHONE_HASH)
                        .verifiedAt(LocalDateTime.now())
                        .build()));

        assertThat(service.isPhoneVerifiedForPayment(user)).isTrue();
        assertThat(service.findPhoneVerifiedAt(user)).isPresent();
    }

    @Test
    @DisplayName("isPhoneVerifiedForPayment — APPLE VERIFIED + 동일 phone_hash 이면 true")
    void isVerified_whenAppleOAuthRowMatches() {
        User user = buildUser(PHONE);
        when(encryptionUtil.safeDecrypt("enc-" + PHONE)).thenReturn(PHONE);
        when(phoneOtpAttemptRepository
                .findFirstByTenantIdAndPhoneHashAndStatusAndVerifiedAtIsNotNullOrderByVerifiedAtDesc(
                        eq(TENANT),
                        eq(PHONE_HASH),
                        eq(PhoneOtpAttempt.STATUS_VERIFIED)))
                .thenReturn(Optional.of(PhoneOtpAttempt.builder()
                        .provider(PhoneOtpAttempt.PROVIDER_APPLE)
                        .status(PhoneOtpAttempt.STATUS_VERIFIED)
                        .phoneHash(PHONE_HASH)
                        .verifiedAt(LocalDateTime.now())
                        .build()));

        assertThat(service.isPhoneVerifiedForPayment(user)).isTrue();
        assertThat(service.findPhoneVerifiedAt(user)).isPresent();
    }

    @Test
    @DisplayName("isPhoneVerifiedForPayment — KAKAO VERIFIED + 동일 phone_hash 이면 true")
    void isVerified_whenKakaoOAuthRowMatches() {
        User user = buildUser(PHONE);
        when(encryptionUtil.safeDecrypt("enc-" + PHONE)).thenReturn(PHONE);
        when(phoneOtpAttemptRepository
                .findFirstByTenantIdAndPhoneHashAndStatusAndVerifiedAtIsNotNullOrderByVerifiedAtDesc(
                        eq(TENANT),
                        eq(PHONE_HASH),
                        eq(PhoneOtpAttempt.STATUS_VERIFIED)))
                .thenReturn(Optional.of(PhoneOtpAttempt.builder()
                        .provider("KAKAO")
                        .status(PhoneOtpAttempt.STATUS_VERIFIED)
                        .phoneHash(PHONE_HASH)
                        .verifiedAt(LocalDateTime.now())
                        .build()));

        assertThat(service.isPhoneVerifiedForPayment(user)).isTrue();
    }

    @Test
    @DisplayName("isPhoneVerifiedForPayment — VERIFIED 행 없으면 false")
    void isVerified_rejectsWhenNoVerifiedRow() {
        User user = buildUser(PHONE);
        when(encryptionUtil.safeDecrypt("enc-" + PHONE)).thenReturn(PHONE);
        when(phoneOtpAttemptRepository
                .findFirstByTenantIdAndPhoneHashAndStatusAndVerifiedAtIsNotNullOrderByVerifiedAtDesc(
                        eq(TENANT),
                        eq(PHONE_HASH),
                        eq(PhoneOtpAttempt.STATUS_VERIFIED)))
                .thenReturn(Optional.empty());

        assertThat(service.isPhoneVerifiedForPayment(user)).isFalse();
        verify(phoneOtpAttemptRepository, never()).save(any());
    }

    @Test
    @DisplayName("번호 변경(해시 불일치) — fail-closed")
    void isVerified_failClosedOnPhoneChange() {
        User user = buildUser("01099998888");
        when(encryptionUtil.safeDecrypt("enc-01099998888")).thenReturn("01099998888");
        String newHash = PhoneHashUtils.sha256Hex("01099998888");
        when(phoneOtpAttemptRepository
                .findFirstByTenantIdAndPhoneHashAndStatusAndVerifiedAtIsNotNullOrderByVerifiedAtDesc(
                        eq(TENANT),
                        eq(newHash),
                        eq(PhoneOtpAttempt.STATUS_VERIFIED)))
                .thenReturn(Optional.empty());

        assertThat(service.isPhoneVerifiedForPayment(user)).isFalse();
    }

    private User buildUser(String plainPhone) {
        User u = User.builder()
                .email("u@example.com")
                .name("n")
                .phone("enc-" + plainPhone)
                .build();
        u.setId(USER_ID);
        u.setTenantId(TENANT);
        return u;
    }
}

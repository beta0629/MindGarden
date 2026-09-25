package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Collection;
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
 * phone_otp_attempts VERIFIED 장부 SSOT — 본인 providerUserId 스코프의 PROFILE·OAuth 행만 결제 게이트 허용.
 *
 * @author MindGarden
 * @since 2026-09-18
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ClientProfilePhoneVerificationServiceImpl")
class ClientProfilePhoneVerificationServiceImplTest {

    private static final String TENANT = "tpf-" + UUID.randomUUID().toString().replace("-", "").substring(0, 32);
    private static final Long USER_ID = 77L;
    private static final String USER_ID_STR = String.valueOf(USER_ID);
    private static final String PHONE = "01012345678";
    private static final String PHONE_HASH = PhoneHashUtils.sha256Hex(PHONE);
    private static final String APPLE_SUB = "apple.sub.001";
    private static final String KAKAO_PROVIDER_USER_ID = "kakao-uid-9";

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
        assertThat(row.getProviderUserId()).isEqualTo(USER_ID_STR);
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
    @DisplayName("isPhoneVerifiedForPayment — PROFILE providerUserId=USER_ID 이면 true")
    void isVerified_whenProfileRowMatchesOwnUserId() {
        User user = buildUser(PHONE);
        when(encryptionUtil.safeDecrypt("enc-" + PHONE)).thenReturn(PHONE);
        when(phoneOtpAttemptRepository
                .findFirstByTenantIdAndPhoneHashAndStatusAndVerifiedAtIsNotNullAndProviderUserIdInOrderByVerifiedAtDesc(
                        eq(TENANT),
                        eq(PHONE_HASH),
                        eq(PhoneOtpAttempt.STATUS_VERIFIED),
                        argThat(ids -> containsExactlyUserId(ids))))
                .thenReturn(Optional.of(PhoneOtpAttempt.builder()
                        .provider(PhoneOtpAttempt.PROVIDER_PROFILE)
                        .providerUserId(USER_ID_STR)
                        .status(PhoneOtpAttempt.STATUS_VERIFIED)
                        .phoneHash(PHONE_HASH)
                        .verifiedAt(LocalDateTime.now())
                        .build()));

        assertThat(service.isPhoneVerifiedForPayment(user)).isTrue();
        assertThat(service.findPhoneVerifiedAt(user)).isPresent();
    }

    @Test
    @DisplayName("isPhoneVerifiedForPayment — 타 userId VERIFIED(동일 phoneHash)만 있으면 false")
    void isVerified_rejectsWhenOnlyOtherUserVerifiedRowExists() {
        User user = buildUser(PHONE);
        when(encryptionUtil.safeDecrypt("enc-" + PHONE)).thenReturn(PHONE);
        when(phoneOtpAttemptRepository
                .findFirstByTenantIdAndPhoneHashAndStatusAndVerifiedAtIsNotNullAndProviderUserIdInOrderByVerifiedAtDesc(
                        eq(TENANT),
                        eq(PHONE_HASH),
                        eq(PhoneOtpAttempt.STATUS_VERIFIED),
                        argThat(ids -> containsExactlyUserId(ids))))
                .thenReturn(Optional.empty());

        assertThat(service.isPhoneVerifiedForPayment(user)).isFalse();
        verify(phoneOtpAttemptRepository, never()).save(any());
    }

    @Test
    @DisplayName("isPhoneVerifiedForPayment — APPLE appleSub 후보로 매칭되면 true")
    void isVerified_whenAppleSubInCandidatesMatches() {
        User user = buildUser(PHONE);
        user.setAppleSub(APPLE_SUB);
        when(encryptionUtil.safeDecrypt("enc-" + PHONE)).thenReturn(PHONE);
        when(phoneOtpAttemptRepository
                .findFirstByTenantIdAndPhoneHashAndStatusAndVerifiedAtIsNotNullAndProviderUserIdInOrderByVerifiedAtDesc(
                        eq(TENANT),
                        eq(PHONE_HASH),
                        eq(PhoneOtpAttempt.STATUS_VERIFIED),
                        argThat(ids -> ids != null
                                && ids.contains(USER_ID_STR)
                                && ids.contains(APPLE_SUB))))
                .thenReturn(Optional.of(PhoneOtpAttempt.builder()
                        .provider(PhoneOtpAttempt.PROVIDER_APPLE)
                        .providerUserId(APPLE_SUB)
                        .status(PhoneOtpAttempt.STATUS_VERIFIED)
                        .phoneHash(PHONE_HASH)
                        .verifiedAt(LocalDateTime.now())
                        .build()));

        assertThat(service.isPhoneVerifiedForPayment(user)).isTrue();
        assertThat(service.findPhoneVerifiedAt(user)).isPresent();
    }

    @Test
    @DisplayName("isPhoneVerifiedForPayment — KAKAO socialProviderUserId 후보로 매칭되면 true")
    void isVerified_whenKakaoSocialProviderUserIdMatches() {
        User user = buildUser(PHONE);
        user.setSocialProviderUserId(KAKAO_PROVIDER_USER_ID);
        when(encryptionUtil.safeDecrypt("enc-" + PHONE)).thenReturn(PHONE);
        when(phoneOtpAttemptRepository
                .findFirstByTenantIdAndPhoneHashAndStatusAndVerifiedAtIsNotNullAndProviderUserIdInOrderByVerifiedAtDesc(
                        eq(TENANT),
                        eq(PHONE_HASH),
                        eq(PhoneOtpAttempt.STATUS_VERIFIED),
                        argThat(ids -> ids != null
                                && ids.contains(USER_ID_STR)
                                && ids.contains(KAKAO_PROVIDER_USER_ID))))
                .thenReturn(Optional.of(PhoneOtpAttempt.builder()
                        .provider("KAKAO")
                        .providerUserId(KAKAO_PROVIDER_USER_ID)
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
                .findFirstByTenantIdAndPhoneHashAndStatusAndVerifiedAtIsNotNullAndProviderUserIdInOrderByVerifiedAtDesc(
                        eq(TENANT),
                        eq(PHONE_HASH),
                        eq(PhoneOtpAttempt.STATUS_VERIFIED),
                        argThat(ClientProfilePhoneVerificationServiceImplTest::containsExactlyUserId)))
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
                .findFirstByTenantIdAndPhoneHashAndStatusAndVerifiedAtIsNotNullAndProviderUserIdInOrderByVerifiedAtDesc(
                        eq(TENANT),
                        eq(newHash),
                        eq(PhoneOtpAttempt.STATUS_VERIFIED),
                        argThat(ClientProfilePhoneVerificationServiceImplTest::containsExactlyUserId)))
                .thenReturn(Optional.empty());

        assertThat(service.isPhoneVerifiedForPayment(user)).isFalse();
    }

    private static boolean containsExactlyUserId(Collection<String> ids) {
        return ids != null && ids.size() == 1 && ids.contains(USER_ID_STR);
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

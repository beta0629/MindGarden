package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Optional;

import com.coresolution.consultation.constant.EulaVersion;
import com.coresolution.consultation.dto.community.UserEulaConsentRequest;
import com.coresolution.consultation.dto.community.UserEulaConsentResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.UserPrivacyConsent;
import com.coresolution.consultation.repository.UserPrivacyConsentRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

/**
 * Apple G1.2 UGC (P2-C) — {@link UserEulaConsentServiceImpl} 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-06-11
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UserEulaConsentServiceImpl — Apple G1.2 EULA 동의")
class UserEulaConsentServiceImplTest {

    private static final String TENANT_ID = "tenant-eula-test";
    private static final Long USER_ID = 999L;

    @Mock private UserPrivacyConsentRepository userPrivacyConsentRepository;

    private UserEulaConsentServiceImpl service;
    private User user;

    @BeforeEach
    void setUp() {
        service = new UserEulaConsentServiceImpl(userPrivacyConsentRepository);
        user = new User();
        user.setId(USER_ID);
        user.setTenantId(TENANT_ID);
    }

    @Test
    @DisplayName("getConsentStatus — 동의 row 없으면 requiresReconsent=true + acceptedVersion=null")
    void getConsentStatus_noRecord_returnsReconsent() {
        when(userPrivacyConsentRepository.findLatestByTenantIdAndUserId(TENANT_ID, USER_ID))
                .thenReturn(Optional.empty());

        UserEulaConsentResponse response = service.getConsentStatus(user);

        assertThat(response.isRequiresReconsent()).isTrue();
        assertThat(response.getCurrentVersion()).isEqualTo(EulaVersion.CURRENT);
        assertThat(response.getAcceptedVersion()).isNull();
        assertThat(response.getMarketingConsent()).isFalse();
    }

    @Test
    @DisplayName("getConsentStatus — 동의 row 의 termsVersion 이 현재와 일치하면 requiresReconsent=false")
    void getConsentStatus_currentVersion_passes() {
        UserPrivacyConsent existing = UserPrivacyConsent.builder()
                .id(1L)
                .tenantId(TENANT_ID)
                .userId(USER_ID)
                .termsConsent(true)
                .privacyConsent(true)
                .marketingConsent(true)
                .termsVersion(EulaVersion.CURRENT)
                .consentDate(LocalDateTime.now())
                .build();
        when(userPrivacyConsentRepository.findLatestByTenantIdAndUserId(TENANT_ID, USER_ID))
                .thenReturn(Optional.of(existing));

        UserEulaConsentResponse response = service.getConsentStatus(user);

        assertThat(response.isRequiresReconsent()).isFalse();
        assertThat(response.getAcceptedVersion()).isEqualTo(EulaVersion.CURRENT);
        assertThat(response.getMarketingConsent()).isTrue();
    }

    @Test
    @DisplayName("getConsentStatus — 구버전(termsVersion=null) 이면 requiresReconsent=true")
    void getConsentStatus_oldVersion_requiresReconsent() {
        UserPrivacyConsent existing = UserPrivacyConsent.builder()
                .id(2L)
                .tenantId(TENANT_ID)
                .userId(USER_ID)
                .termsConsent(true)
                .privacyConsent(true)
                .marketingConsent(false)
                .termsVersion(null)
                .consentDate(LocalDateTime.now().minusYears(1))
                .build();
        when(userPrivacyConsentRepository.findLatestByTenantIdAndUserId(TENANT_ID, USER_ID))
                .thenReturn(Optional.of(existing));

        UserEulaConsentResponse response = service.getConsentStatus(user);

        assertThat(response.isRequiresReconsent()).isTrue();
        assertThat(response.getAcceptedVersion()).isNull();
    }

    @Test
    @DisplayName("acceptConsent — 정상 케이스: 새 row 저장 + 응답 requiresReconsent=false")
    void acceptConsent_persistsRow() {
        UserEulaConsentRequest request = UserEulaConsentRequest.builder()
                .termsConsent(true)
                .privacyConsent(true)
                .marketingConsent(false)
                .termsVersion(EulaVersion.CURRENT)
                .build();
        when(userPrivacyConsentRepository.save(any(UserPrivacyConsent.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        UserEulaConsentResponse response =
                service.acceptConsent(user, request, "127.0.0.1", "jest");

        ArgumentCaptor<UserPrivacyConsent> captor = ArgumentCaptor.forClass(UserPrivacyConsent.class);
        verify(userPrivacyConsentRepository).save(captor.capture());
        UserPrivacyConsent saved = captor.getValue();
        assertThat(saved.getTenantId()).isEqualTo(TENANT_ID);
        assertThat(saved.getUserId()).isEqualTo(USER_ID);
        assertThat(saved.getTermsConsent()).isTrue();
        assertThat(saved.getPrivacyConsent()).isTrue();
        assertThat(saved.getMarketingConsent()).isFalse();
        assertThat(saved.getTermsVersion()).isEqualTo(EulaVersion.CURRENT);
        assertThat(saved.getIpAddress()).isEqualTo("127.0.0.1");
        assertThat(saved.getUserAgent()).isEqualTo("jest");

        assertThat(response.isRequiresReconsent()).isFalse();
        assertThat(response.getAcceptedVersion()).isEqualTo(EulaVersion.CURRENT);
    }

    @Test
    @DisplayName("acceptConsent — 다른 버전 요청 시 IllegalArgument")
    void acceptConsent_unsupportedVersion_throws() {
        UserEulaConsentRequest request = UserEulaConsentRequest.builder()
                .termsConsent(true)
                .privacyConsent(true)
                .termsVersion("9.9.9")
                .build();
        assertThatThrownBy(() -> service.acceptConsent(user, request, "127.0.0.1", "jest"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("지원하지 않는 약관 버전");
        verify(userPrivacyConsentRepository, never()).save(any(UserPrivacyConsent.class));
    }

    @Test
    @DisplayName("acceptConsent — 필수 동의 누락 시 IllegalArgument")
    void acceptConsent_missingRequired_throws() {
        UserEulaConsentRequest request = UserEulaConsentRequest.builder()
                .termsConsent(true)
                .privacyConsent(false)
                .termsVersion(EulaVersion.CURRENT)
                .build();
        assertThatThrownBy(() -> service.acceptConsent(user, request, "127.0.0.1", "jest"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("필수");
        verify(userPrivacyConsentRepository, never()).save(any(UserPrivacyConsent.class));
    }

    @Test
    @DisplayName("tenant 정보 없음 — AccessDenied")
    void noTenant_accessDenied() {
        User noTenant = new User();
        noTenant.setId(2L);
        noTenant.setTenantId(" ");

        assertThatThrownBy(() -> service.getConsentStatus(noTenant))
                .isInstanceOf(AccessDeniedException.class);
    }
}

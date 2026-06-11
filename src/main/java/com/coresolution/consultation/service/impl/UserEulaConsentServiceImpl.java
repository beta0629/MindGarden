package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.Optional;

import com.coresolution.consultation.constant.EulaVersion;
import com.coresolution.consultation.dto.community.UserEulaConsentRequest;
import com.coresolution.consultation.dto.community.UserEulaConsentResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.UserPrivacyConsent;
import com.coresolution.consultation.repository.UserPrivacyConsentRepository;
import com.coresolution.consultation.service.UserEulaConsentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Apple G1.2 UGC (P2-C) — {@link UserEulaConsentService} 구현체.
 *
 * <p>{@code user_privacy_consent} 테이블을 SSOT 로 사용한다. 약관 버전이 올라가면 사용자 row 의
 * {@code terms_version} 이 구버전이라 {@link UserEulaConsentResponse#isRequiresReconsent()} 가
 * {@code true} 가 되어 FE 가 EULA 게이트를 재발동한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserEulaConsentServiceImpl implements UserEulaConsentService {

    private final UserPrivacyConsentRepository userPrivacyConsentRepository;

    @Override
    @Transactional(readOnly = true)
    public UserEulaConsentResponse getConsentStatus(User user) {
        String tenantId = requireTenantId(user);
        Optional<UserPrivacyConsent> latest =
                userPrivacyConsentRepository.findLatestByTenantIdAndUserId(tenantId, user.getId());
        UserEulaConsentResponse response = UserEulaConsentResponse.fromEntity(latest.orElse(null));
        log.info("[EulaConsent] status — userId={} current={} accepted={} requiresReconsent={}",
                user.getId(), response.getCurrentVersion(), response.getAcceptedVersion(),
                response.isRequiresReconsent());
        return response;
    }

    @Override
    @Transactional
    public UserEulaConsentResponse acceptConsent(
            User user,
            UserEulaConsentRequest request,
            String ipAddress,
            String userAgent) {
        String tenantId = requireTenantId(user);
        if (!EulaVersion.CURRENT.equals(request.getTermsVersion())) {
            throw new IllegalArgumentException(
                    "지원하지 않는 약관 버전입니다. (요청="
                            + request.getTermsVersion()
                            + ", 현재="
                            + EulaVersion.CURRENT
                            + ")");
        }
        if (!Boolean.TRUE.equals(request.getTermsConsent())
                || !Boolean.TRUE.equals(request.getPrivacyConsent())) {
            throw new IllegalArgumentException("이용약관 및 개인정보 처리방침 동의는 필수입니다.");
        }

        UserPrivacyConsent saved = UserPrivacyConsent.builder()
                .tenantId(tenantId)
                .userId(user.getId())
                .termsConsent(Boolean.TRUE)
                .privacyConsent(Boolean.TRUE)
                .marketingConsent(Boolean.TRUE.equals(request.getMarketingConsent()))
                .termsVersion(request.getTermsVersion())
                .consentDate(LocalDateTime.now())
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build();
        UserPrivacyConsent persisted = userPrivacyConsentRepository.save(saved);
        log.info("[EulaConsent] accepted — userId={} version={} marketing={} consentDate={}",
                user.getId(), persisted.getTermsVersion(),
                persisted.getMarketingConsent(), persisted.getConsentDate());
        return UserEulaConsentResponse.fromEntity(persisted);
    }

    private static String requireTenantId(User user) {
        if (user == null || user.getTenantId() == null || user.getTenantId().isBlank()) {
            throw new AccessDeniedException("테넌트 정보가 없습니다.");
        }
        return user.getTenantId().trim();
    }
}

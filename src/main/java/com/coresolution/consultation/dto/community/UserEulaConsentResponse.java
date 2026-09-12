package com.coresolution.consultation.dto.community;

import java.time.LocalDateTime;
import com.coresolution.consultation.constant.EulaVersion;
import com.coresolution.consultation.entity.UserPrivacyConsent;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Apple G1.2 UGC (P2-C) — EULA 동의 상태 응답.
 *
 * <p>FE 가 부팅 시 호출하여 {@code requiresReconsent} 가 {@code true} 면 EULA 게이트를 띄운다.
 * 필드 명세는 시안 §A — 신규 사용자(미동의)·기존 사용자(구버전 동의)·재동의 케이스 모두 지원.</p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserEulaConsentResponse {

    /** 현재 시행 중인 EULA 버전 (서버 SSOT). */
    private String currentVersion;

    /** 마지막 동의 버전 — 미동의면 {@code null}. */
    private String acceptedVersion;

    /** 마지막 동의 시각 — 미동의면 {@code null}. */
    private LocalDateTime acceptedAt;

    /** 마지막 마케팅 동의 — 미동의면 {@code false}. */
    private Boolean marketingConsent;

    /** {@code true} 면 FE 가 EULA 게이트를 띄워야 함 (미동의 또는 구버전 동의). */
    private boolean requiresReconsent;

    /**
     * Entity → Response 변환. {@code consent} 가 {@code null} 이면 미동의 상태 응답을 반환한다.
     *
     * @param consent 최신 동의 row (없으면 {@code null})
     * @return 응답 DTO
     */
    public static UserEulaConsentResponse fromEntity(UserPrivacyConsent consent) {
        if (consent == null) {
            return UserEulaConsentResponse.builder()
                    .currentVersion(EulaVersion.CURRENT)
                    .acceptedVersion(null)
                    .acceptedAt(null)
                    .marketingConsent(Boolean.FALSE)
                    .requiresReconsent(true)
                    .build();
        }
        String acceptedVersion = consent.getTermsVersion();
        boolean reconsent = acceptedVersion == null
                || !EulaVersion.CURRENT.equals(acceptedVersion)
                || !Boolean.TRUE.equals(consent.getTermsConsent())
                || !Boolean.TRUE.equals(consent.getPrivacyConsent());
        return UserEulaConsentResponse.builder()
                .currentVersion(EulaVersion.CURRENT)
                .acceptedVersion(acceptedVersion)
                .acceptedAt(consent.getConsentDate())
                .marketingConsent(Boolean.TRUE.equals(consent.getMarketingConsent()))
                .requiresReconsent(reconsent)
                .build();
    }
}

package com.coresolution.consultation.dto.community;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Apple G1.2 UGC (P2-C) — EULA(이용약관) 동의 저장 요청.
 *
 * <p>FE {@code app/(auth)/eula-consent.tsx} 에서 약관 스크롤 끝 + 필수 2개 체크 후 호출한다.
 * 필수 동의(약관/개인정보)는 모두 {@code true} 여야 하며, {@code termsVersion} 은 현재
 * 시행 버전과 일치해야 한다 (서비스 레이어에서 검증).</p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserEulaConsentRequest {

    /** (필수) 이용약관 + 무관용 정책 동의. */
    @NotNull
    private Boolean termsConsent;

    /** (필수) 개인정보 처리방침 동의. */
    @NotNull
    private Boolean privacyConsent;

    /** (선택) 마케팅 정보 수신 동의 — 기본 {@code false}. */
    private Boolean marketingConsent;

    /** 동의 시점의 EULA 버전 (예: {@code "1.0.0"}). */
    @NotBlank
    @Size(max = 32)
    private String termsVersion;

    /**
     * 필수 동의 항목 검증 — 두 항목이 모두 {@code true} 가 아니면 400.
     *
     * @return 두 필수 동의가 모두 {@code true} 면 {@code true}
     */
    @AssertTrue(message = "이용약관 및 개인정보 처리방침 동의는 필수입니다.")
    public boolean isRequiredConsentAccepted() {
        return Boolean.TRUE.equals(termsConsent) && Boolean.TRUE.equals(privacyConsent);
    }
}

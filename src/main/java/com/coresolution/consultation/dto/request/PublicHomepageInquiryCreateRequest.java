package com.coresolution.consultation.dto.request;

import com.coresolution.consultation.constant.HomepageInquiryConstants;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 홈페이지 공개 문의 접수 요청.
 *
 * <p>허니팟 {@link HomepageInquiryConstants#HONEYPOT_FIELD} 가 채워지면 서버는 202 만 반환하고 저장하지 않는다.
 *
 * @author CoreSolution
 * @since 2026-11-11
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicHomepageInquiryCreateRequest {

    @NotBlank
    @Size(max = HomepageInquiryConstants.MAX_NAME_LENGTH)
    private String name;

    @NotBlank
    @Size(max = HomepageInquiryConstants.MAX_PHONE_LENGTH)
    private String phone;

    @NotBlank
    @Size(max = 64)
    private String inquiryType;

    @NotBlank
    @Size(max = HomepageInquiryConstants.MAX_CONTENT_LENGTH)
    private String content;

    @NotNull
    @AssertTrue(message = "개인정보 수집·이용에 동의해야 합니다.")
    private Boolean privacyConsent;

    @NotBlank
    @Size(max = HomepageInquiryConstants.MAX_CONSENT_VERSION_LENGTH)
    private String consentVersion;

    /**
     * 허니팟. 사람이 비워 두는 필드. 채워지면 스팸으로 간주해 저장하지 않는다.
     */
    @JsonProperty(HomepageInquiryConstants.HONEYPOT_FIELD)
    @Size(max = 200)
    private String website;

    /**
     * Turnstile 등 CAPTCHA 토큰(선택). 설정으로 강제 시 검증.
     */
    @JsonAlias({"turnstileToken", "captchaToken"})
    @Size(max = 2048)
    private String captchaToken;
}

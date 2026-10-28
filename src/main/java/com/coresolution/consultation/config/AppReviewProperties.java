package com.coresolution.consultation.config;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.StringUtils;
import lombok.Getter;
import lombok.Setter;

/**
 * App Store Connect 리뷰용 OTP 바이패스 설정.
 *
 * <p>{@code app.review.*} — 기본 OFF. 운영에서 ASC Review Notes 에 안내할
 * 전화·코드만 env 로 주입한다. 클라이언트에 시크릿을 심지 않는다.</p>
 *
 * @author MindGarden
 * @since 2026-10-28
 */
@ConfigurationProperties(prefix = "app.review")
@Getter
@Setter
public class AppReviewProperties {

    /**
     * ASC 리뷰 전화에 대한 고정 OTP 바이패스 활성 여부.
     * {@code APP_REVIEW_APPLE_OTP_BYPASS} — 기본 false.
     */
    private boolean appleOtpBypassEnabled = false;

    /**
     * 허용 전화번호(쉼표 구분). E.164 또는 국내 휴대폰 형식.
     * {@code APP_REVIEW_APPLE_OTP_PHONES}.
     */
    private String appleOtpPhones = "";

    /**
     * 리뷰 고정 OTP. 비어 있으면 플래그가 true 여도 바이패스 비활성.
     * {@code APP_REVIEW_APPLE_OTP_CODE}.
     */
    private String appleOtpCode = "";

    /**
     * 허용 전화 목록(trim · 빈 항목 제거).
     *
     * @return 불변 목록
     */
    public List<String> getAppleOtpPhoneList() {
        if (!StringUtils.hasText(appleOtpPhones)) {
            return Collections.emptyList();
        }
        return Arrays.stream(appleOtpPhones.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .collect(Collectors.toUnmodifiableList());
    }
}

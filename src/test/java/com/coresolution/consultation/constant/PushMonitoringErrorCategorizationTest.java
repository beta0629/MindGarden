package com.coresolution.consultation.constant;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.constant.PushMonitoringErrorCategorization.Category;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link PushMonitoringErrorCategorization} 4분류 화이트리스트 단위 테스트.
 *
 * <p>Phase 1 explore 결론(D3) 의 4 카테고리를 모두 검증한다 — 핸드오프 가드.
 *
 * @author MindGarden core-coder
 * @since 2026-06-07
 */
class PushMonitoringErrorCategorizationTest {

    @Test
    @DisplayName("성공 행은 분류 대상 외 — null 반환")
    void successReturnsNull() {
        assertThat(PushMonitoringErrorCategorization.classify(true, "ALIMTALK", null))
            .isNull();
        assertThat(PushMonitoringErrorCategorization.classify(true, "PENDING", "SEND_FAILED"))
            .isNull();
    }

    @Test
    @DisplayName("PENDING channelUsed 는 PENDING 카테고리")
    void pendingChannelMapsPending() {
        assertThat(PushMonitoringErrorCategorization.classify(false, "PENDING", null))
            .isEqualTo(Category.PENDING);
        assertThat(PushMonitoringErrorCategorization.classify(false, "", "SEND_FAILED"))
            .isEqualTo(Category.PENDING);
        assertThat(PushMonitoringErrorCategorization.classify(false, null, "anything"))
            .isEqualTo(Category.PENDING);
    }

    @Test
    @DisplayName("외부발송 실패 화이트리스트는 EXTERNAL_FAILURE")
    void externalFailureWhitelist() {
        assertThat(PushMonitoringErrorCategorization.classify(false, "ALIMTALK", "SEND_FAILED"))
            .isEqualTo(Category.EXTERNAL_FAILURE);
        assertThat(PushMonitoringErrorCategorization.classify(false, "SMS", "EMPTY_BODY"))
            .isEqualTo(Category.EXTERNAL_FAILURE);
        assertThat(PushMonitoringErrorCategorization.classify(false, "ALIMTALK", "INVALID_REQUEST"))
            .isEqualTo(Category.EXTERNAL_FAILURE);
        assertThat(PushMonitoringErrorCategorization.classify(false, "ALIMTALK", "PARSE_ERROR"))
            .isEqualTo(Category.EXTERNAL_FAILURE);
        assertThat(PushMonitoringErrorCategorization.classify(false, "ALIMTALK", "UNKNOWN"))
            .isEqualTo(Category.EXTERNAL_FAILURE);
    }

    @Test
    @DisplayName("Solapi 숫자 코드도 EXTERNAL_FAILURE")
    void numericExternalFailure() {
        assertThat(PushMonitoringErrorCategorization.classify(false, "ALIMTALK", "4001"))
            .isEqualTo(Category.EXTERNAL_FAILURE);
        assertThat(PushMonitoringErrorCategorization.classify(false, "ALIMTALK", "500"))
            .isEqualTo(Category.EXTERNAL_FAILURE);
    }

    @Test
    @DisplayName("사전검증 skip 화이트리스트")
    void validationSkipWhitelist() {
        assertThat(PushMonitoringErrorCategorization.classify(false, "ALIMTALK",
            "RECIPIENT_PHONE_MISSING"))
            .isEqualTo(Category.VALIDATION_SKIP);
        assertThat(PushMonitoringErrorCategorization.classify(false, "ALIMTALK",
            "MARKETING_CONSENT_REQUIRED"))
            .isEqualTo(Category.VALIDATION_SKIP);
        assertThat(PushMonitoringErrorCategorization.classify(false, "ALIMTALK",
            "TARGET_NOT_FOUND"))
            .isEqualTo(Category.VALIDATION_SKIP);
    }

    @Test
    @DisplayName("정책 skip 화이트리스트")
    void policySkipWhitelist() {
        assertThat(PushMonitoringErrorCategorization.classify(false, "ALIMTALK",
            "MARKETING_NO_FALLBACK"))
            .isEqualTo(Category.POLICY_SKIP);
        assertThat(PushMonitoringErrorCategorization.classify(false, "ALIMTALK",
            "DEPLOY_CUTOFF_BEFORE"))
            .isEqualTo(Category.POLICY_SKIP);
        assertThat(PushMonitoringErrorCategorization.classify(false, "ALIMTALK",
            "NOT_FIRST_SCHEDULE"))
            .isEqualTo(Category.POLICY_SKIP);
        assertThat(PushMonitoringErrorCategorization.classify(false, "ALIMTALK",
            "TEMPLATE_NOT_MAPPED"))
            .isEqualTo(Category.POLICY_SKIP);
    }

    @Test
    @DisplayName("미지의 코드는 EXTERNAL_FAILURE 로 fallback (외부 채널 확정)")
    void unknownCodeFallsBackExternal() {
        assertThat(PushMonitoringErrorCategorization.classify(false, "ALIMTALK", "WTF_UNKNOWN"))
            .isEqualTo(Category.EXTERNAL_FAILURE);
    }

    @Test
    @DisplayName("isNumericExternalFailure — 숫자만 true")
    void numericDetector() {
        assertThat(PushMonitoringErrorCategorization.isNumericExternalFailure("4001")).isTrue();
        assertThat(PushMonitoringErrorCategorization.isNumericExternalFailure("500")).isTrue();
        assertThat(PushMonitoringErrorCategorization.isNumericExternalFailure("ABC")).isFalse();
        assertThat(PushMonitoringErrorCategorization.isNumericExternalFailure("")).isFalse();
        assertThat(PushMonitoringErrorCategorization.isNumericExternalFailure(null)).isFalse();
        assertThat(PushMonitoringErrorCategorization.isNumericExternalFailure("12"))
            .isFalse(); // 너무 짧음 (3자리 미만)
    }
}

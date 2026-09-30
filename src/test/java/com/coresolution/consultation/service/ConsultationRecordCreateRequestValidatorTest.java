package com.coresolution.consultation.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.catchThrowableOfType;

import java.util.HashMap;
import java.util.Map;
import com.coresolution.consultation.constant.consultation.ConsultationRecordCreateValidationMessages;
import com.coresolution.consultation.exception.ValidationException;
import com.coresolution.core.domain.ClientPlatform;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 상담일지 작성 서버 필수값 검증 — 프론트 validateConsultationLogForm 신규 작성 규칙과 동일한지 확인.
 *
 * @author CoreSolution
 * @since 2026-09-29
 */
@DisplayName("ConsultationRecordCreateRequestValidator")
class ConsultationRecordCreateRequestValidatorTest {

    private final ConsultationRecordCreateRequestValidator validator = new ConsultationRecordCreateRequestValidator();

    private static Map<String, Object> validPayload() {
        Map<String, Object> payload = new HashMap<>();
        payload.put("consultationId", 30L);
        payload.put("clientId", 20L);
        payload.put("consultantId", 41L);
        payload.put("sessionDurationMinutes", 50);
        payload.put("clientCondition", "안정적");
        payload.put("mainIssues", "불안");
        payload.put("interventionMethods", "인지행동");
        payload.put("clientResponse", "긍정적");
        payload.put("riskAssessment", "LOW");
        payload.put("progressEvaluation", "호전");
        return payload;
    }

    private Map<String, String> errorsOf(Map<String, Object> payload, boolean institutionLink) {
        ValidationException ex = catchThrowableOfType(
                () -> validator.validate(payload, institutionLink), ValidationException.class);
        assertThat(ex).isNotNull();
        assertThat(ex.getMessage()).isEqualTo(ConsultationRecordCreateValidationMessages.MSG_SUMMARY);
        return ex.getFieldErrors();
    }

    @Test
    @DisplayName("필수값이 모두 있으면 통과하고, 신규 작성은 회기를 요구하지 않는다")
    void validPayload_passesWithoutSessionNumber() {
        assertThatCode(() -> validator.validate(validPayload(), false)).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("빈 본문은 FE와 같은 7개 필드 오류를 낸다")
    void emptyPayload_reportsAllRequiredFields() {
        Map<String, String> errors = errorsOf(new HashMap<>(), false);

        assertThat(errors).containsOnlyKeys(
                "sessionDurationMinutes", "clientCondition", "mainIssues", "interventionMethods",
                "clientResponse", "riskAssessment", "progressEvaluation");
        assertThat(errors.get("sessionDurationMinutes"))
                .isEqualTo(ConsultationRecordCreateValidationMessages.MSG_SESSION_DURATION_MINUTES);
    }

    @Test
    @DisplayName("공백만 있는 텍스트는 누락으로 본다")
    void whitespaceText_isBlank() {
        Map<String, Object> payload = validPayload();
        payload.put("mainIssues", "   ");
        payload.put("progressEvaluation", "");

        assertThat(errorsOf(payload, false)).containsOnlyKeys("mainIssues", "progressEvaluation");
    }

    @Test
    @DisplayName("세션 시간은 1분 이상이어야 한다")
    void sessionDuration_mustBeAtLeastOne() {
        Map<String, Object> payload = validPayload();
        payload.put("sessionDurationMinutes", 0);
        assertThat(errorsOf(payload, false)).containsOnlyKeys("sessionDurationMinutes");

        payload.put("sessionDurationMinutes", "abc");
        assertThat(errorsOf(payload, false)).containsOnlyKeys("sessionDurationMinutes");

        payload.put("sessionDurationMinutes", "1");
        assertThatCode(() -> validator.validate(payload, false)).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("내담자 상태는 4000자를 넘으면 한도 문구를 낸다")
    void clientCondition_maxLength() {
        Map<String, Object> payload = validPayload();
        payload.put("clientCondition",
                "가".repeat(ConsultationRecordCreateValidationMessages.CLIENT_CONDITION_MAX_LENGTH + 1));

        assertThat(errorsOf(payload, false).get("clientCondition"))
                .isEqualTo(ConsultationRecordCreateValidationMessages.MSG_CLIENT_CONDITION_MAX_LENGTH);

        payload.put("clientCondition",
                "가".repeat(ConsultationRecordCreateValidationMessages.CLIENT_CONDITION_MAX_LENGTH));
        assertThatCode(() -> validator.validate(payload, false)).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("회기권 일지는 위험도 평가가 필수, 타기관 일지는 선택")
    void riskAssessment_requiredOnlyForSessionLog() {
        Map<String, Object> payload = validPayload();
        payload.remove("riskAssessment");

        assertThat(errorsOf(payload, false)).containsOnlyKeys("riskAssessment");
        assertThatCode(() -> validator.validate(payload, true)).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("타기관 일지도 위험도 외 필수값은 요구한다")
    void institutionLink_stillRequiresOtherFields() {
        Map<String, Object> payload = validPayload();
        payload.remove("riskAssessment");
        payload.remove("clientResponse");

        assertThat(errorsOf(payload, true)).containsOnlyKeys("clientResponse");
    }

    @Test
    @DisplayName("필수값 키가 하나도 없으면 채널과 무관하게 기존 앱 페이로드로 통과")
    void legacyPayload_skipsValidationRegardlessOfChannel() {
        Map<String, Object> legacy = new HashMap<>();
        legacy.put("consultationId", 30L);
        legacy.put("consultantObservations", "메모");

        assertThat(validator.isLegacyAppPayload(legacy)).isTrue();
        assertThatCode(() -> validator.validate(legacy, false, ClientPlatform.IOS)).doesNotThrowAnyException();
        assertThatCode(() -> validator.validate(legacy, false, ClientPlatform.ANDROID))
                .doesNotThrowAnyException();
        assertThatCode(() -> validator.validate(legacy, false, ClientPlatform.WEB)).doesNotThrowAnyException();
        assertThatCode(() -> validator.validate(legacy, false, ClientPlatform.fromHeader(null)))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("웹: 필수값 키가 있는데 값이 비면 채널 헤더 없이도 검증한다")
    void webChannel_blankRequiredValues_validates() {
        Map<String, Object> payload = validPayload();
        payload.put("clientResponse", "");
        payload.put("riskAssessment", null);

        assertThat(validator.isLegacyAppPayload(payload)).isFalse();
        ValidationException ex = catchThrowableOfType(
                () -> validator.validate(payload, false, ClientPlatform.fromHeader(null)), ValidationException.class);
        assertThat(ex).isNotNull();
        assertThat(ex.getFieldErrors()).containsOnlyKeys("clientResponse", "riskAssessment");
    }

    @Test
    @DisplayName("앱 채널이라도 필수값 키를 하나라도 보내면 웹과 같은 검증")
    void appChannel_withRequiredKey_validatesLikeWeb() {
        Map<String, Object> payload = validPayload();
        payload.put("mainIssues", "");

        assertThat(validator.isLegacyAppPayload(payload)).isFalse();
        ValidationException ex = catchThrowableOfType(
                () -> validator.validate(payload, false, ClientPlatform.ANDROID), ValidationException.class);
        assertThat(ex).isNotNull();
        assertThat(ex.getFieldErrors()).containsOnlyKeys("mainIssues");
        assertThatCode(() -> validator.validate(validPayload(), false, ClientPlatform.IOS))
                .doesNotThrowAnyException();
    }
}

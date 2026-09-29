package com.coresolution.consultation.service;

import java.util.LinkedHashMap;
import java.util.Map;
import com.coresolution.consultation.constant.consultation.ConsultationRecordCreateValidationMessages;
import com.coresolution.consultation.exception.ValidationException;
import com.coresolution.core.domain.ClientPlatform;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 상담일지 작성(POST /api/v1/schedules/consultation-records) 필수값 검증.
 *
 * <p>프론트 {@code validateConsultationLogForm} 의 신규 작성 규칙과 같다. 신규 작성은 회기를 요구하지 않고,
 * 타기관 연계 일지는 위험도 평가를 요구하지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-09-29
 */
@Slf4j
@Component
public class ConsultationRecordCreateRequestValidator {

    /**
     * 클라이언트 채널({@code X-Client-Platform})을 고려해 검증한다.
     *
     * <p>웹(헤더 없음 포함)은 항상 검증한다. 앱(ios/android)은 필수값 키가 하나도 없는 기존 앱 페이로드만
     * 검증 없이 통과시키고, 필수값 키를 하나라도 보내는 앱 빌드부터는 웹과 같은 검증을 탄다.
     * 스토어 배포는 백엔드와 같이 나가지 않으므로 기존 앱 작성이 400 이 되지 않게 하기 위함이다.</p>
     *
     * @param recordData 상담일지 본문
     * @param institutionLink 타기관 연계 일지 여부
     * @param platform 요청 클라이언트 채널
     * @throws ValidationException 필수값 누락·한도 초과
     */
    public void validate(Map<String, Object> recordData, boolean institutionLink, ClientPlatform platform) {
        if (isLegacyAppPayload(recordData, platform)) {
            log.warn("상담일지 작성: 필수값 폼 이전 앱 페이로드 통과 platform={}", platform);
            return;
        }
        validate(recordData, institutionLink);
    }

    /**
     * 앱 채널이면서 필수값 키를 하나도 보내지 않은 기존 앱 페이로드인지.
     *
     * @param recordData 상담일지 본문
     * @param platform 요청 클라이언트 채널
     * @return 기존 앱 페이로드면 true
     */
    public boolean isLegacyAppPayload(Map<String, Object> recordData, ClientPlatform platform) {
        if (platform != ClientPlatform.IOS && platform != ClientPlatform.ANDROID) {
            return false;
        }
        if (recordData == null) {
            return true;
        }
        return ConsultationRecordCreateValidationMessages.REQUIRED_FIELDS.stream()
                .noneMatch(recordData::containsKey);
    }

    /**
     * 필수값이 비었으면 필드별 오류와 함께 {@link ValidationException} 을 던진다.
     *
     * @param recordData 상담일지 본문
     * @param institutionLink 타기관 연계 일지 여부
     * @throws ValidationException 필수값 누락·한도 초과
     */
    public void validate(Map<String, Object> recordData, boolean institutionLink) {
        Map<String, Object> data = recordData != null ? recordData : Map.of();
        Map<String, String> errors = new LinkedHashMap<>();

        Object sessionDuration = data.get(ConsultationRecordCreateValidationMessages.FIELD_SESSION_DURATION_MINUTES);
        if (!isSessionDurationValid(sessionDuration)) {
            errors.put(ConsultationRecordCreateValidationMessages.FIELD_SESSION_DURATION_MINUTES,
                    ConsultationRecordCreateValidationMessages.MSG_SESSION_DURATION_MINUTES);
        }

        Object clientCondition = data.get(ConsultationRecordCreateValidationMessages.FIELD_CLIENT_CONDITION);
        if (isBlank(clientCondition)) {
            errors.put(ConsultationRecordCreateValidationMessages.FIELD_CLIENT_CONDITION,
                    ConsultationRecordCreateValidationMessages.MSG_CLIENT_CONDITION);
        } else if (clientCondition.toString().length()
                > ConsultationRecordCreateValidationMessages.CLIENT_CONDITION_MAX_LENGTH) {
            errors.put(ConsultationRecordCreateValidationMessages.FIELD_CLIENT_CONDITION,
                    ConsultationRecordCreateValidationMessages.MSG_CLIENT_CONDITION_MAX_LENGTH);
        }

        requireText(data, ConsultationRecordCreateValidationMessages.FIELD_MAIN_ISSUES,
                ConsultationRecordCreateValidationMessages.MSG_MAIN_ISSUES, errors);
        requireText(data, ConsultationRecordCreateValidationMessages.FIELD_INTERVENTION_METHODS,
                ConsultationRecordCreateValidationMessages.MSG_INTERVENTION_METHODS, errors);
        requireText(data, ConsultationRecordCreateValidationMessages.FIELD_CLIENT_RESPONSE,
                ConsultationRecordCreateValidationMessages.MSG_CLIENT_RESPONSE, errors);

        if (!institutionLink) {
            requireText(data, ConsultationRecordCreateValidationMessages.FIELD_RISK_ASSESSMENT,
                    ConsultationRecordCreateValidationMessages.MSG_RISK_ASSESSMENT, errors);
        }

        requireText(data, ConsultationRecordCreateValidationMessages.FIELD_PROGRESS_EVALUATION,
                ConsultationRecordCreateValidationMessages.MSG_PROGRESS_EVALUATION, errors);

        if (!errors.isEmpty()) {
            throw new ValidationException(ConsultationRecordCreateValidationMessages.MSG_SUMMARY, errors);
        }
    }

    private static void requireText(Map<String, Object> data, String field, String message,
            Map<String, String> errors) {
        if (isBlank(data.get(field))) {
            errors.put(field, message);
        }
    }

    private static boolean isBlank(Object value) {
        return value == null || value.toString().trim().isEmpty();
    }

    private static boolean isSessionDurationValid(Object raw) {
        if (isBlank(raw)) {
            return false;
        }
        try {
            return Double.parseDouble(raw.toString().trim())
                    >= ConsultationRecordCreateValidationMessages.SESSION_DURATION_MINUTES_MIN;
        } catch (NumberFormatException e) {
            return false;
        }
    }
}

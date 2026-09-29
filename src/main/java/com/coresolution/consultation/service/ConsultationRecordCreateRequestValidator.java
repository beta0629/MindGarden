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
     * 필수값 폼 이전 앱 페이로드를 걸러낸 뒤 검증한다.
     *
     * <p>필수값 키({@link ConsultationRecordCreateValidationMessages#REQUIRED_FIELDS})가 본문에 하나도 없으면
     * 필수값 폼 이전 앱 빌드로 보고 검증 없이 통과시킨다. 2026-09-12 이전 앱 빌드는 {@code X-Client-Platform}
     * 헤더를 보내지 않으므로 헤더로는 판별하지 않는다. 필수값 키를 하나라도 보내면(웹·신규 앱) 전체 검증한다.</p>
     *
     * @param recordData 상담일지 본문
     * @param institutionLink 타기관 연계 일지 여부
     * @param platform 요청 클라이언트 채널(로그용)
     * @throws ValidationException 필수값 누락·한도 초과
     */
    public void validate(Map<String, Object> recordData, boolean institutionLink, ClientPlatform platform) {
        if (isLegacyAppPayload(recordData)) {
            log.warn("상담일지 작성: 필수값 폼 이전 앱 페이로드 통과 platform={}", platform);
            return;
        }
        validate(recordData, institutionLink);
    }

    /**
     * 필수값 키를 하나도 보내지 않은 기존 앱 페이로드인지. 채널 헤더와 무관하다.
     *
     * @param recordData 상담일지 본문
     * @return 기존 앱 페이로드면 true
     */
    public boolean isLegacyAppPayload(Map<String, Object> recordData) {
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

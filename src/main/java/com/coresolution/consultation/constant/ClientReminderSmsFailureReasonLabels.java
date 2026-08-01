package com.coresolution.consultation.constant;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * 예약 SMS 실패 사유 짧은 한글 라벨 (PII 없음, errorCode 기반).
 *
 * @author MindGarden
 * @since 2026-08-01
 */
public final class ClientReminderSmsFailureReasonLabels {

    public static final String DEFAULT = "발송 실패";

    private static final Map<String, String> BY_ERROR_CODE;

    static {
        Map<String, String> map = new HashMap<>();
        map.put(BatchNotificationTemplateCodes.ERROR_CODE_SEND_FAILED, "발송 실패");
        map.put(BatchNotificationTemplateCodes.ERROR_CODE_RECIPIENT_PHONE_MISSING, "번호 없음");
        map.put(BatchNotificationTemplateCodes.ERROR_CODE_TEMPLATE_NOT_MAPPED, "템플릿 없음");
        map.put(BatchNotificationTemplateCodes.ERROR_CODE_TARGET_NOT_FOUND, "대상 없음");
        map.put(BatchNotificationTemplateCodes.ERROR_CODE_NOT_FIRST_SCHEDULE, "조건 미충족");
        map.put(BatchNotificationTemplateCodes.ERROR_CODE_MARKETING_CONSENT_REQUIRED, "동의 필요");
        map.put(BatchNotificationTemplateCodes.ERROR_CODE_DEPLOY_CUTOFF_BEFORE, "발송 제외");
        map.put(BatchNotificationTemplateCodes.ERROR_CODE_MARKETING_NO_FALLBACK, "폴백 없음");
        BY_ERROR_CODE = Collections.unmodifiableMap(map);
    }

    private ClientReminderSmsFailureReasonLabels() {
    }

    /**
     * errorCode → 짧은 한글. 알 수 없으면 {@link #DEFAULT}.
     *
     * @param errorCode 발송 로그 error_code
     * @return 표시용 짧은 사유
     */
    public static String resolve(String errorCode) {
        if (errorCode == null || errorCode.isBlank()) {
            return DEFAULT;
        }
        return BY_ERROR_CODE.getOrDefault(errorCode.trim(), DEFAULT);
    }
}

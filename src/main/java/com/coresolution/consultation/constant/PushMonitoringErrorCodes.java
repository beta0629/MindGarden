package com.coresolution.consultation.constant;

import java.util.Set;

/**
 * BW-1 「푸시 설정 모니터링」 실패 4분류 화이트리스트.
 *
 * <p>Phase 1 explore 결론(D3) 에 따라 알림 발송 결과를 다음 4가지로 분류한다:
 * <ol>
 *   <li>{@link #EXTERNAL_FAILURE_CODES} — 외부발송 실패 (KPI #3)</li>
 *   <li>{@link #VALIDATION_SKIP_CODES} — 사전검증 skip (KPI #4)</li>
 *   <li>{@link #POLICY_SKIP_CODES} — 정책 skip (KPI #4)</li>
 *   <li>PENDING — {@code channel_used='PENDING'} 인 행 (KPI #1 subtitle)</li>
 * </ol>
 *
 * <p>본 화이트리스트는 `BatchNotificationTemplateCodes` 의 ERROR_CODE_* 와 1:1 매핑한다.
 * 새 에러코드가 추가되면 본 클래스의 화이트리스트도 갱신해야 KPI 분류가 정확하다.
 *
 * <p>SSOT — 본 클래스 외에서 동일 분류 로직을 작성하지 않는다 (코더 표준).
 *
 * @author MindGarden
 * @since 2026-06-07
 */
public final class PushMonitoringErrorCodes {

    /** KPI 카테고리 — 외부발송 실패. */
    public static final String CATEGORY_EXTERNAL_FAILURE = "EXTERNAL_FAILURE";

    /** KPI 카테고리 — 사전검증 skip. */
    public static final String CATEGORY_VALIDATION_SKIP = "VALIDATION_SKIP";

    /** KPI 카테고리 — 정책 skip. */
    public static final String CATEGORY_POLICY_SKIP = "POLICY_SKIP";

    /** KPI 카테고리 — PENDING (channel_used='PENDING'). */
    public static final String CATEGORY_PENDING = "PENDING";

    /** {@code channel_used} 컬럼 값 — PENDING 행 식별. */
    public static final String CHANNEL_USED_PENDING = "PENDING";

    /**
     * 외부발송 실패 화이트리스트 — KPI #3 「실패」 카드 모집단.
     *
     * <p>실 운영의 Solapi reject 코드 + 일반 SEND_FAILED 패턴.
     */
    public static final Set<String> EXTERNAL_FAILURE_CODES = Set.of(
        BatchNotificationTemplateCodes.ERROR_CODE_SEND_FAILED,
        "2030",
        "4030",
        "INVALID_REQUEST",
        "CLIENT_ERROR",
        "PARSE_ERROR",
        "UNKNOWN",
        "EMPTY_BODY"
    );

    /**
     * 사전검증 skip 화이트리스트 — KPI #4.validation 카운트 모집단.
     */
    public static final Set<String> VALIDATION_SKIP_CODES = Set.of(
        BatchNotificationTemplateCodes.ERROR_CODE_RECIPIENT_PHONE_MISSING,
        BatchNotificationTemplateCodes.ERROR_CODE_MARKETING_CONSENT_REQUIRED,
        BatchNotificationTemplateCodes.ERROR_CODE_TARGET_NOT_FOUND
    );

    /**
     * 정책 skip 화이트리스트 — KPI #4.policy 카운트 모집단.
     */
    public static final Set<String> POLICY_SKIP_CODES = Set.of(
        BatchNotificationTemplateCodes.ERROR_CODE_MARKETING_NO_FALLBACK,
        BatchNotificationTemplateCodes.ERROR_CODE_DEPLOY_CUTOFF_BEFORE,
        BatchNotificationTemplateCodes.ERROR_CODE_NOT_FIRST_SCHEDULE,
        BatchNotificationTemplateCodes.ERROR_CODE_TEMPLATE_NOT_MAPPED
    );

    /**
     * 행을 4분류 카테고리로 매핑.
     *
     * <p>입력은 {@code (success, errorCode, channelUsed)} 3종. 우선순위:
     * <ol>
     *   <li>{@code channelUsed=PENDING} → {@link #CATEGORY_PENDING}</li>
     *   <li>{@code success=true} → {@code null} (성공 — 카테고리 없음)</li>
     *   <li>{@code errorCode} ∈ EXTERNAL_FAILURE_CODES → {@link #CATEGORY_EXTERNAL_FAILURE}</li>
     *   <li>{@code errorCode} ∈ VALIDATION_SKIP_CODES → {@link #CATEGORY_VALIDATION_SKIP}</li>
     *   <li>{@code errorCode} ∈ POLICY_SKIP_CODES → {@link #CATEGORY_POLICY_SKIP}</li>
     *   <li>그 외 실패는 {@link #CATEGORY_EXTERNAL_FAILURE} 로 보수적 분류
     *       (KPI 누락 방지 — D3 가드)</li>
     * </ol>
     *
     * @param success     성공 여부 (TRUE/FALSE/NULL — NULL 도 실패로 간주)
     * @param errorCode   에러코드 (null 허용)
     * @param channelUsed channel_used 값 (PENDING 식별용)
     * @return 카테고리 문자열, 또는 성공일 경우 {@code null}
     */
    public static String categorize(Boolean success, String errorCode, String channelUsed) {
        if (CHANNEL_USED_PENDING.equals(channelUsed)) {
            return CATEGORY_PENDING;
        }
        if (Boolean.TRUE.equals(success)) {
            return null;
        }
        if (errorCode == null || errorCode.isBlank()) {
            return CATEGORY_EXTERNAL_FAILURE;
        }
        String upper = errorCode.trim().toUpperCase();
        if (VALIDATION_SKIP_CODES.contains(upper)
                || VALIDATION_SKIP_CODES.contains(errorCode.trim())) {
            return CATEGORY_VALIDATION_SKIP;
        }
        if (POLICY_SKIP_CODES.contains(upper)
                || POLICY_SKIP_CODES.contains(errorCode.trim())) {
            return CATEGORY_POLICY_SKIP;
        }
        return CATEGORY_EXTERNAL_FAILURE;
    }

    /**
     * 카테고리 문자열로부터 재발송 가능 여부 판정. EXTERNAL_FAILURE 만 재발송 허용.
     *
     * @param category {@link #categorize(Boolean, String, String)} 결과
     * @return 재발송 가능 여부
     */
    public static boolean isRetryable(String category) {
        return CATEGORY_EXTERNAL_FAILURE.equals(category);
    }

    private PushMonitoringErrorCodes() {
    }
}

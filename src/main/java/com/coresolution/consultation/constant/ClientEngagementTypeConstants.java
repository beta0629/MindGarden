package com.coresolution.consultation.constant;

/**
 * 내담자 연계 유형 SSOT. 등록 시점에 분리하고 배정이 읽는다.
 *
 * <p>바우처는 선택지에 두지 않는다. remainingSessions 로 추정하지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
public final class ClientEngagementTypeConstants {

    /** 일반 회기. 기본값. */
    public static final String SESSION_TICKET = "SESSION_TICKET";

    /** 타기관 연계. 배정 시 {@link PaymentTimingConstants#INSTITUTION_LINK}. */
    public static final String INSTITUTION_LINK = "INSTITUTION_LINK";

    public static final String MSG_INSTITUTION_REQUIRED = "기관을 선택하세요.";

    public static final String MSG_INSTITUTION_NAME_REQUIRED = "기관 이름을 입력하세요.";

    public static final String MSG_INSTITUTION_CONTACT_NAME_REQUIRED = "기관 담당자를 입력하세요.";

    public static final String MSG_INSTITUTION_CONTACT_PHONE_REQUIRED = "기관 담당 연락처를 입력하세요.";

    public static final String MSG_INSTITUTION_DOCUMENT_PHONE_REQUIRED = "문서 발송 연락처를 입력하세요.";

    public static final String MSG_INSTITUTION_DOCUMENT_EMAIL_REQUIRED = "문서 발송 이메일을 입력하세요.";

    public static final String MSG_PREPAID_REQUIRED = "선납 여부를 선택하세요.";

    public static final String MSG_PREPAID_DATE_REQUIRED = "선납 일자를 입력하세요.";

    public static final String MSG_PREPAID_AMOUNT_REQUIRED = "선납 금액을 입력하세요.";

    public static final String MSG_INVALID_ENGAGEMENT_TYPE = "지원하지 않는 내담자 유형입니다.";

    public static final String MSG_INSTITUTION_CLIENT_ONLY_INSTITUTION_ASSIGNMENT =
            "타기관 내담자는 기관연계만 배정할 수 있습니다.";

    public static final String MSG_SESSION_CLIENT_NOT_INSTITUTION_ASSIGNMENT =
            "일반 내담자는 회기·가예약만 배정할 수 있습니다.";

    private ClientEngagementTypeConstants() {
    }

    /**
     * 유형 정규화. 빈 값은 일반 회기. 바우처는 허용하지 않는다.
     *
     * @param value 요청 유형
     * @return SESSION_TICKET 또는 INSTITUTION_LINK
     * @throws IllegalArgumentException 알 수 없는 값
     */
    public static String normalizeOrThrow(String value) {
        if (value == null || value.trim().isEmpty()) {
            return SESSION_TICKET;
        }
        String normalized = value.trim().toUpperCase();
        if (SESSION_TICKET.equals(normalized)) {
            return SESSION_TICKET;
        }
        if (INSTITUTION_LINK.equals(normalized)) {
            return INSTITUTION_LINK;
        }
        throw new IllegalArgumentException(MSG_INVALID_ENGAGEMENT_TYPE);
    }

    /**
     * 타기관 연계 유형인지.
     *
     * @param value 유형
     * @return INSTITUTION_LINK 이면 true
     */
    public static boolean isInstitutionLink(String value) {
        return INSTITUTION_LINK.equalsIgnoreCase(value);
    }

    /**
     * 내담자 유형과 요청 배정 시점을 교차 없이 해석한다.
     *
     * @param engagementType 내담자 연계 유형
     * @param requestedPaymentTiming 요청 paymentTiming
     * @return 저장할 paymentTiming
     * @throws IllegalArgumentException 교차 배정
     */
    public static String resolveAssignmentPaymentTiming(String engagementType, String requestedPaymentTiming) {
        String engagement = normalizeOrThrow(engagementType);
        if (isInstitutionLink(engagement)) {
            if (requestedPaymentTiming != null
                    && !requestedPaymentTiming.trim().isEmpty()
                    && !PaymentTimingConstants.isInstitutionLink(requestedPaymentTiming)) {
                throw new IllegalArgumentException(MSG_INSTITUTION_CLIENT_ONLY_INSTITUTION_ASSIGNMENT);
            }
            return PaymentTimingConstants.INSTITUTION_LINK;
        }
        if (PaymentTimingConstants.isInstitutionLink(requestedPaymentTiming)) {
            throw new IllegalArgumentException(MSG_SESSION_CLIENT_NOT_INSTITUTION_ASSIGNMENT);
        }
        return requestedPaymentTiming;
    }

    /**
     * 타기관 등록 필드 필수 검사.
     *
     * @param institutionName 기관 이름
     * @param contactName 담당자
     * @param contactPhone 담당 연락처
     * @param documentPhone 문서 발송 연락처
     * @param documentEmail 문서 발송 이메일
     * @param prepaid 선납 여부
     * @param prepaidDate 선납 일자 입력 여부
     * @param prepaidAmount 선납 금액
     */
    public static void assertInstitutionRegisterFields(
            String institutionName,
            String contactName,
            String contactPhone,
            String documentPhone,
            String documentEmail,
            Boolean prepaid,
            boolean prepaidDatePresent,
            Long prepaidAmount) {
        if (isBlank(institutionName)) {
            throw new IllegalArgumentException(MSG_INSTITUTION_NAME_REQUIRED);
        }
        if (isBlank(contactName)) {
            throw new IllegalArgumentException(MSG_INSTITUTION_CONTACT_NAME_REQUIRED);
        }
        if (isBlank(contactPhone)) {
            throw new IllegalArgumentException(MSG_INSTITUTION_CONTACT_PHONE_REQUIRED);
        }
        if (isBlank(documentPhone)) {
            throw new IllegalArgumentException(MSG_INSTITUTION_DOCUMENT_PHONE_REQUIRED);
        }
        if (isBlank(documentEmail)) {
            throw new IllegalArgumentException(MSG_INSTITUTION_DOCUMENT_EMAIL_REQUIRED);
        }
        if (prepaid == null) {
            throw new IllegalArgumentException(MSG_PREPAID_REQUIRED);
        }
        if (Boolean.TRUE.equals(prepaid)) {
            if (!prepaidDatePresent) {
                throw new IllegalArgumentException(MSG_PREPAID_DATE_REQUIRED);
            }
            if (prepaidAmount == null || prepaidAmount < 0L) {
                throw new IllegalArgumentException(MSG_PREPAID_AMOUNT_REQUIRED);
            }
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}

package com.coresolution.consultation.constant;

import java.util.Set;

/**
 * BW-1 「푸시 설정 모니터링」 발송 결과 4분류 화이트리스트.
 *
 * <p>Phase 1 explore 결론(D3) — 「실패」 단일 분류를 다음 4 카테고리로 분리한다:
 * <ol>
 *   <li>{@link Category#EXTERNAL_FAILURE} — 외부발송 실패: SOLAPI/Expo 호출 자체가 실패한 경우.
 *       「실패율」 KPI 카드 분자 = 본 카테고리만.</li>
 *   <li>{@link Category#VALIDATION_SKIP} — 사전검증 skip: 수신자 누락, 마케팅 동의 미획득 등.
 *       발송 시도 자체를 건너뜀.</li>
 *   <li>{@link Category#POLICY_SKIP} — 정책 skip: 마케팅 NO_FALLBACK / 첫 실행 cutoff /
 *       첫 회기 아님 / 알림톡 매핑 없음 등 정책에 의한 skip.</li>
 *   <li>{@link Category#PENDING} — 채널 미확정 ({@code channel_used='PENDING'}).
 *       발송 직전 INSERT 후 외부 호출 결과 UPDATE 가 누락된 행.</li>
 * </ol>
 *
 * <p>「성공」은 {@link com.coresolution.consultation.entity.NotificationBatchSendLog#getSuccess()}
 * == {@code true} 한 가지로 정의한다. KPI 「실패율」은 다음과 같이 계산:
 * <pre>
 *   failureRate = externalFailureCount / (successCount + externalFailureCount)
 * </pre>
 * — Skip / Pending 은 분모에서 제외한다(외부 발송이 실제 시도된 모집단만 고려).
 *
 * <p>본 클래스는 정책 식별자(상수)이며 비즈니스 로직 변경에 따라 화이트리스트가 갱신될 수 있다.
 * 운영에서 신규 {@code error_code} 가 등장하면 본 화이트리스트에 추가하는 것이 1차 조치이다.
 *
 * @author MindGarden
 * @since 2026-06-07
 */
public final class PushMonitoringErrorCategorization {

    /**
     * 4분류 카테고리.
     */
    public enum Category {
        /** 외부발송 실패 — SOLAPI/Expo 호출 자체 실패. KPI 「실패」카드 분자. */
        EXTERNAL_FAILURE,
        /** 사전검증 skip — 수신자/동의 누락 등 발송 자체 미시도. */
        VALIDATION_SKIP,
        /** 정책 skip — 마케팅·cutoff·매핑 부재 등 정책에 의한 skip. */
        POLICY_SKIP,
        /** 채널 미확정 (channel_used='PENDING') — 외부 호출 결과 UPDATE 누락. */
        PENDING
    }

    /** 채널 미확정 마커 (NotificationBatchSendLog.channelUsed). */
    public static final String CHANNEL_PENDING = "PENDING";

    /**
     * 외부발송 실패 화이트리스트.
     *
     * <p>{@code error_code} 가 본 집합에 속하면 「실패」카테고리로 분류한다. Solapi 응답
     * statusCode (4001 등) 가 그대로 {@code error_code} 에 들어오는 경우는 별도 검사
     * ({@link #isNumericExternalFailure(String)}) 로 흡수한다.
     *
     * <p>화이트리스트:
     * <ul>
     *   <li>{@code SEND_FAILED} — 폴백까지 모두 실패</li>
     *   <li>{@code EMPTY_BODY} — 응답 본문 누락</li>
     *   <li>{@code INVALID_REQUEST} — 외부 4xx</li>
     *   <li>{@code CLIENT_ERROR} — 외부 4xx (별칭)</li>
     *   <li>{@code PARSE_ERROR} — 응답 파싱 실패</li>
     *   <li>{@code UNKNOWN} — 분류 미상 (외부 호출 흔적 있음)</li>
     * </ul>
     */
    public static final Set<String> EXTERNAL_FAILURE_CODES = Set.of(
        "SEND_FAILED",
        "EMPTY_BODY",
        "INVALID_REQUEST",
        "CLIENT_ERROR",
        "PARSE_ERROR",
        "UNKNOWN"
    );

    /**
     * 사전검증 skip 화이트리스트.
     *
     * <ul>
     *   <li>{@code RECIPIENT_PHONE_MISSING} — 수신자 전화번호 누락</li>
     *   <li>{@code MARKETING_CONSENT_REQUIRED} — 마케팅 수신 동의 미획득</li>
     *   <li>{@code TARGET_NOT_FOUND} — 발송 대상 엔티티 부재</li>
     * </ul>
     */
    public static final Set<String> VALIDATION_SKIP_CODES = Set.of(
        "RECIPIENT_PHONE_MISSING",
        "MARKETING_CONSENT_REQUIRED",
        "TARGET_NOT_FOUND"
    );

    /**
     * 정책 skip 화이트리스트.
     *
     * <ul>
     *   <li>{@code MARKETING_NO_FALLBACK} — 마케팅 알림톡 실패 후 SMS 폴백 미수행</li>
     *   <li>{@code DEPLOY_CUTOFF_BEFORE} — 첫 실행 cutoff 이전 매핑</li>
     *   <li>{@code NOT_FIRST_SCHEDULE} — INITIAL_GUIDE 첫 회기 아님</li>
     *   <li>{@code TEMPLATE_NOT_MAPPED} — 알림톡 매핑 없음(SMS 폴백만 발송)</li>
     * </ul>
     */
    public static final Set<String> POLICY_SKIP_CODES = Set.of(
        "MARKETING_NO_FALLBACK",
        "DEPLOY_CUTOFF_BEFORE",
        "NOT_FIRST_SCHEDULE",
        "TEMPLATE_NOT_MAPPED"
    );

    /**
     * Solapi statusCode 같은 숫자 코드(예: {@code "4001"}) 도 외부발송 실패로 흡수한다.
     *
     * @param errorCode error_code 컬럼 값
     * @return 4자리 숫자 코드면 {@code true}
     */
    public static boolean isNumericExternalFailure(String errorCode) {
        if (errorCode == null || errorCode.isBlank()) {
            return false;
        }
        String trimmed = errorCode.trim();
        if (trimmed.length() < 3 || trimmed.length() > 6) {
            return false;
        }
        for (int i = 0; i < trimmed.length(); i += 1) {
            if (!Character.isDigit(trimmed.charAt(i))) {
                return false;
            }
        }
        return true;
    }

    /**
     * 통합 분류 진입점. 호출자({@code AdminPushMonitoringServiceImpl}) 는 본 메서드만 사용한다.
     *
     * @param success     성공 여부({@code NotificationBatchSendLog.success})
     * @param channelUsed 채널 컬럼 값({@code channel_used}) — null/blank 이면 PENDING 으로 본다.
     * @param errorCode   error_code 컬럼 값(null/blank 허용)
     * @return 4분류 카테고리. 성공이면 {@code null} 반환(분류 대상 외).
     */
    public static Category classify(boolean success, String channelUsed, String errorCode) {
        if (success) {
            return null;
        }
        if (channelUsed == null || channelUsed.isBlank()
                || CHANNEL_PENDING.equalsIgnoreCase(channelUsed.trim())) {
            return Category.PENDING;
        }
        String code = errorCode == null ? "" : errorCode.trim();
        if (EXTERNAL_FAILURE_CODES.contains(code) || isNumericExternalFailure(code)) {
            return Category.EXTERNAL_FAILURE;
        }
        if (VALIDATION_SKIP_CODES.contains(code)) {
            return Category.VALIDATION_SKIP;
        }
        if (POLICY_SKIP_CODES.contains(code)) {
            return Category.POLICY_SKIP;
        }
        // 분류 미정 — 외부 채널이 확정된 채로 실패했으므로 외부발송 실패로 간주.
        return Category.EXTERNAL_FAILURE;
    }

    private PushMonitoringErrorCategorization() {
    }
}

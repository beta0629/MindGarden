package com.coresolution.consultation.exception;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 어드민이 사용자(내담자·상담사)를 강제 종료(삭제)하려 했으나, 비즈니스 가드
 * (결제 대기 매칭·잔여 회기·예정 스케줄 등)로 인해 차단되었음을 알리는 도메인 예외.
 *
 * <p>{@code GlobalExceptionHandler} 가 본 예외를 HTTP {@code 409 Conflict} + 정형화된
 * JSON 본문 ({@code success}, {@code code}, {@code message}, {@code details}) 으로
 * 응답한다. 시스템 오류가 아닌 의도된 비즈니스 차단 흐름이므로 로그 레벨은
 * {@code INFO} 로 기록한다.</p>
 *
 * <p>운영자가 차단 사유를 확인하고 결제 처리·환불·스케줄 정리 등 후속 조치를 취한 뒤
 * 다시 삭제를 시도하면 정상 처리될 수 있다.</p>
 *
 * @author MindGarden
 * @since 2026-05-28
 */
public class AdminDeleteBlockedException extends RuntimeException {

    /** 차단 사유 코드 (예: {@code PENDING_PAYMENT_MAPPING}). */
    private final String code;

    /** 추가 상세 정보 (예: {@code pendingMappingCount}, {@code remainingSessions}). 불변 맵. */
    private final transient Map<String, Object> details;

    /**
     * 사유 코드·메시지만 포함하는 기본 생성자.
     *
     * @param code    차단 사유 코드 (UPPER_SNAKE_CASE)
     * @param message 사용자 노출 메시지 (한국어)
     */
    public AdminDeleteBlockedException(String code, String message) {
        this(code, message, Collections.emptyMap());
    }

    /**
     * 사유 코드·메시지·상세 정보를 모두 포함하는 생성자.
     *
     * @param code    차단 사유 코드 (UPPER_SNAKE_CASE)
     * @param message 사용자 노출 메시지 (한국어)
     * @param details 상세 정보 맵. {@code null} 이면 빈 맵으로 대체된다.
     */
    public AdminDeleteBlockedException(String code, String message, Map<String, Object> details) {
        super(message);
        this.code = code;
        this.details = details == null
                ? Collections.emptyMap()
                : Collections.unmodifiableMap(new LinkedHashMap<>(details));
    }

    /**
     * 차단 사유 코드를 반환한다.
     *
     * @return 차단 사유 코드 (예: {@code PENDING_PAYMENT_MAPPING})
     */
    public String getCode() {
        return code;
    }

    /**
     * 추가 상세 정보를 반환한다.
     *
     * @return 불변 상세 정보 맵 (절대 {@code null} 이 아님)
     */
    public Map<String, Object> getDetails() {
        return details;
    }
}

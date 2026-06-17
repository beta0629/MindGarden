package com.coresolution.consultation.exception;

/**
 * 동일 상담사·내담자 조합에 ACTIVE 매핑이 이미 존재할 때 신규 매칭 생성을 차단하는 예외.
 *
 * <p>회기 추가는 {@code session-extensions} API(또는 {@code SessionExtensionModal})를 사용해야 한다.
 * {@link com.coresolution.consultation.exception.GlobalExceptionHandler} 가 HTTP 409 Conflict 로 매핑한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-17
 */
public class ActiveMappingExistsException extends IllegalStateException {

    private static final long serialVersionUID = 1L;

    public static final String ERROR_CODE = "ACTIVE_MAPPING_EXISTS";

    private final Long mappingId;

    /**
     * ACTIVE 매핑 충돌 예외.
     *
     * @param mappingId 기존 ACTIVE 매핑 ID
     * @param message 사용자 노출 메시지
     */
    public ActiveMappingExistsException(Long mappingId, String message) {
        super(message);
        this.mappingId = mappingId;
    }

    public Long getMappingId() {
        return mappingId;
    }
}

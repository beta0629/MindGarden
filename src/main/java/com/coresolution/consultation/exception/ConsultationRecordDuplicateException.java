package com.coresolution.consultation.exception;

/**
 * 같은 일정에 활성 상담일지가 이미 있어 신규 생성을 거부할 때 발생한다 (일정당 일지 1건).
 *
 * <p>{@link GlobalExceptionHandler} 가 HTTP 409 + {@code existingRecordId} 로 응답해
 * 화면이 기존 일지 수정으로 전환하도록 한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
public class ConsultationRecordDuplicateException extends IllegalStateException {

    private static final long serialVersionUID = 1L;

    private final Long scheduleId;
    private final Long existingRecordId;

    /**
     * @param scheduleId       대상 일정 ID
     * @param existingRecordId 기존 활성 일지 ID (조회 실패 시 null)
     * @param message          사용자 안내 문구
     */
    public ConsultationRecordDuplicateException(Long scheduleId, Long existingRecordId, String message) {
        super(message);
        this.scheduleId = scheduleId;
        this.existingRecordId = existingRecordId;
    }

    public Long getScheduleId() {
        return scheduleId;
    }

    public Long getExistingRecordId() {
        return existingRecordId;
    }
}

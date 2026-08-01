package com.coresolution.consultation.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 스케줄 단위 내담자 예약 문자(SMS) 표시 상태.
 *
 * <p>Phase 0: 읽기/표시 전용. {@code status} 가 null 이거나 객체가 null 이면 UI 숨김.
 * 전화·본문 등 PII 는 포함하지 않는다.</p>
 *
 * @author MindGarden
 * @since 2026-08-01
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientReminderSmsStatusDto {

    /**
     * 표시 상태: {@code SENT} / {@code PENDING} / {@code FAILED}.
     * N/A·SKIPPED 는 DTO 자체를 null 로 내려 숨긴다.
     */
    private String status;

    /** PENDING 예정 시각 ({@code immediate_reservation_sms_pending.fire_at}). */
    private LocalDateTime fireAt;

    /** 발송(또는 시도) 시각 ({@code notification_batch_send_log.sent_at} / pending.processed_at). */
    private LocalDateTime sentAt;

    /** 짧은 실패 사유(코드 기반 한글). PII 없음. FAILED 외에는 null. */
    private String failureReason;
}

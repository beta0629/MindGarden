package com.coresolution.consultation.dto;

import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 「푸시 설정 모니터링」 - 최근 SMS/알림톡 발송 카드 1행.
 *
 * <p>{@code notification_batch_send_log} 행에서 SMS / ALIMTALK 채널만 필터링하여 운영자에게
 * 노출한다. PII 가드: {@code recipientPhone} 은 백엔드에서 이미 마스킹된
 * {@code recipient_phone_masked} 컬럼 값을 그대로 전달하며 프론트는 재가공하지 않는다.
 *
 * <p>{@code recipientName} 은 {@code users.name} 컬럼 값으로, 호출 측 서비스가 N+1 방지를 위해
 * 1회 in-쿼리로 묶어서 매핑한다. 사용자 행이 없거나 권한이 부족하면 {@code null} 로 직렬화된다
 * ({@link JsonInclude.Include#NON_NULL} 처리).
 *
 * @author MindGarden core-coder
 * @since 2026-06-13
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SmsLogItem {

    /** {@code notification_batch_send_log.id}. */
    private Long id;

    /** 템플릿 코드 (예: {@code RESERVATION_REMINDER_D2}). */
    private String templateCode;

    /** 채널 — SMS / ALIMTALK. */
    private String channelUsed;

    /** 대상 타입 — SCHEDULE / USER / MAPPING. */
    private String targetType;

    /** 대상 엔티티 PK. */
    private Long targetId;

    /** 수신자 users.id. */
    private Long recipientUserId;

    /** 수신자 이름 (users.name — 행이 없으면 null). */
    private String recipientName;

    /** 마스킹된 수신자 번호({@code recipient_phone_masked} 컬럼 그대로). */
    private String recipientPhone;

    /** 발송 성공 여부. */
    private Boolean successFlag;

    /** 에러 코드 (성공 시 null). */
    private String errorCode;

    /** 에러 메시지(한국어 prefix 포함, 성공 시 null). */
    private String errorMessage;

    /** 생성 시각 (Asia/Seoul). */
    private LocalDateTime createdAt;
}

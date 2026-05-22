package com.coresolution.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 다중 발송 배치의 단일 수신자 결과.
 *
 * <p>{@link BulkNotificationResponse} 의 {@code results} 항목으로 사용된다. 전화번호는 마스킹 후
 * 노출하며, 솔라피 식별자(groupId/messageId) 는 발송 성공·실패와 무관하게 솔라피가 응답한 경우
 * 모두 보존한다(어드민 감사로그·솔라피 콘솔 사후 추적용).
 *
 * @author MindGarden
 * @since 2026-05-23
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkRecipientResult {

    /** 수신자 사용자 PK. {@code RECIPIENT_NOT_FOUND} / 다른 테넌트 등으로 미해결 시도 동일 ID 보존. */
    private Long userId;

    /** 사용자 이름(복호화). 미해결·복호화 실패 시 {@code null}. */
    private String name;

    /** 마스킹된 전화번호. 미해결 시 {@code "n/a"}. */
    private String phoneMasked;

    private boolean success;

    /** 표준 errorCode (예: {@code RECIPIENT_NOT_FOUND}, {@code SEND_FAILED}). */
    private String errorCode;

    /** 사용자 표시용 상세 메시지(절단 가능). */
    private String errorMessage;

    /** 솔라피 groupId(SMS 또는 미수신 시 null). */
    private String solapiGroupId;

    /** 솔라피 messageId(SMS 또는 미수신 시 null). */
    private String solapiMessageId;

    /** 감사로그 PK. 발송 시도 행이 INSERT 됐다면 채워진다. */
    private Long logId;
}

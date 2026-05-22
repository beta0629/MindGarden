package com.coresolution.consultation.dto;

import java.time.LocalDateTime;
import com.coresolution.consultation.entity.AdminTestNotificationLog;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 어드민 테스트 발송 이력 항목 DTO.
 *
 * @author MindGarden
 * @since 2026-05-22
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestNotificationHistoryItem {

    private Long id;
    private LocalDateTime sentAt;
    private TestNotificationChannel channel;
    private TestNotificationRecipientMode recipientMode;
    private String recipientPhoneMasked;
    private Long recipientUserId;
    private String templateCode;
    private String reason;
    private boolean success;
    private String errorCode;
    private String solapiGroupId;
    private String solapiMessageId;

    /**
     * Entity → DTO 변환.
     *
     * @param entity 엔티티
     * @return DTO
     */
    public static TestNotificationHistoryItem fromEntity(AdminTestNotificationLog entity) {
        return TestNotificationHistoryItem.builder()
            .id(entity.getId())
            .sentAt(entity.getSentAt())
            .channel(entity.getChannel())
            .recipientMode(entity.getRecipientMode())
            .recipientPhoneMasked(entity.getRecipientPhoneMasked())
            .recipientUserId(entity.getRecipientUserId())
            .templateCode(entity.getTemplateCode())
            .reason(entity.getReason())
            .success(Boolean.TRUE.equals(entity.getSuccess()))
            .errorCode(entity.getErrorCode())
            .solapiGroupId(entity.getSolapiGroupId())
            .solapiMessageId(entity.getSolapiMessageId())
            .build();
    }
}

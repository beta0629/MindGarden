package com.coresolution.consultation.entity;

import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 상담사-내담자 메시지 엔티티
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-05
 */
@Entity
@Table(name = "consultation_messages", indexes = {
    @Index(name = "idx_consultation_messages_consultant_id", columnList = "consultant_id"),
    @Index(name = "idx_consultation_messages_client_id", columnList = "client_id"),
    @Index(name = "idx_consultation_messages_consultation_id", columnList = "consultation_id"),
    @Index(name = "idx_consultation_messages_sender_type", columnList = "sender_type"),
    @Index(name = "idx_consultation_messages_created_at", columnList = "created_at"),
    @Index(name = "idx_consultation_messages_is_deleted", columnList = "is_deleted")
})
public class ConsultationMessage extends BaseEntity {
    
    @NotNull(message = "상담사 ID는 필수입니다.")
    @Column(name = "consultant_id", nullable = false)
    private Long consultantId;
    
    @NotNull(message = "내담자 ID는 필수입니다.")
    @Column(name = "client_id", nullable = false)
    private Long clientId;
    
    @Column(name = "consultation_id")
    private Long consultationId; // 상담 ID (선택사항)
    
    @NotNull(message = "발신자 유형은 필수입니다.")
    @Size(max = 20, message = "발신자 유형은 20자 이하여야 합니다.")
    @Column(name = "sender_type", nullable = false, length = 20)
    private String senderType; // CONSULTANT, CLIENT
    
    @NotNull(message = "발신자 ID는 필수입니다.")
    @Column(name = "sender_id", nullable = false)
    private Long senderId;
    
    @NotNull(message = "수신자 ID는 필수입니다.")
    @Column(name = "receiver_id", nullable = false)
    private Long receiverId;
    
    @NotNull(message = "메시지 제목은 필수입니다.")
    @Size(max = 200, message = "메시지 제목은 200자 이하여야 합니다.")
    @Column(name = "title", nullable = false, length = 200)
    private String title;
    
    @NotNull(message = "메시지 내용은 필수입니다.")
    @Size(max = 2000, message = "메시지 내용은 2000자 이하여야 합니다.")
    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;
    
    @Size(max = 20, message = "메시지 유형은 20자 이하여야 합니다.")
    @Column(name = "message_type", length = 20)
    private String messageType = "GENERAL"; // GENERAL, URGENT, REMINDER, FOLLOW_UP, HOMEWORK
    
    @Size(max = 20, message = "메시지 상태는 20자 이하여야 합니다.")
    @Column(name = "status", length = 20)
    private String status = "SENT"; // SENT, DELIVERED, READ, REPLIED
    
    @Column(name = "is_important")
    private Boolean isImportant = false; // 중요 메시지 여부
    
    @Column(name = "is_urgent")
    private Boolean isUrgent = false; // 긴급 메시지 여부
    
    @Column(name = "is_read")
    private Boolean isRead = false; // 읽음 여부
    
    @Column(name = "read_at")
    private LocalDateTime readAt; // 읽은 시간
    
    @Column(name = "replied_at")
    private LocalDateTime repliedAt; // 답장한 시간
    
    @Column(name = "reply_to_message_id")
    private Long replyToMessageId; // 답장 대상 메시지 ID
    
    @Size(max = 500, message = "첨부파일은 500자 이하여야 합니다.")
    @Column(name = "attachments", length = 500)
    private String attachments; // 첨부파일 정보 (JSON)
    
    @Size(max = 1000, message = "메타데이터는 1000자 이하여야 합니다.")
    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata; // 추가 메타데이터 (JSON)
    
    @Column(name = "scheduled_send_at")
    private LocalDateTime scheduledSendAt; // 예약 발송 시간
    
    @Column(name = "sent_at")
    private LocalDateTime sentAt; // 실제 발송 시간
    
    @Size(max = 100, message = "발송 채널은 100자 이하여야 합니다.")
    @Column(name = "delivery_channel", length = 100)
    private String deliveryChannel = "SYSTEM"; // SYSTEM, EMAIL, SMS, PUSH
    
    @Size(max = 1000, message = "발송 결과는 1000자 이하여야 합니다.")
    @Column(name = "delivery_result", columnDefinition = "TEXT")
    private String deliveryResult; // 발송 결과 정보
    
    @Column(name = "is_delivered")
    private Boolean isDelivered = false; // 발송 완료 여부
    
    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt; // 발송 완료 시간
    
    @Column(name = "is_archived")
    private Boolean isArchived = false; // 아카이브 여부
    
    @Column(name = "archived_at")
    private LocalDateTime archivedAt; // 아카이브 시간
    
    // 생성자
    public ConsultationMessage() {
        super();
        this.sentAt = LocalDateTime.now();
    }
    
    // 비즈니스 메서드
    /**
     * 메시지 읽음 처리
     */
    public void markAsRead() {
        this.isRead = true;
        this.readAt = LocalDateTime.now();
        this.status = "READ";
    }
    
    /**
     * 메시지 답장 처리
     */
    public void markAsReplied() {
        this.repliedAt = LocalDateTime.now();
        this.status = "REPLIED";
    }
    
    /**
     * 메시지 발송 완료 처리
     */
    public void markAsDelivered() {
        this.isDelivered = true;
        this.deliveredAt = LocalDateTime.now();
        this.status = "DELIVERED";
    }
    
    /**
     * 메시지 아카이브 처리
     */
    public void archive() {
        this.isArchived = true;
        this.archivedAt = LocalDateTime.now();
    }
    
    /**
     * 긴급 메시지 설정
     */
    public void setUrgent(Boolean urgent) {
        this.isUrgent = urgent;
        if (urgent) {
            this.messageType = "URGENT";
        }
    }
    
    /**
     * 중요 메시지 설정
     */
    public void setImportant(Boolean important) {
        this.isImportant = important;
        if (important) {
            this.messageType = "IMPORTANT";
        }
    }
    
    // Getter & Setter
    public Long getConsultantId() {
        return consultantId;
    }
    
    public void setConsultantId(Long consultantId) {
        this.consultantId = consultantId;
    }
    
    public Long getClientId() {
        return clientId;
    }
    
    public void setClientId(Long clientId) {
        this.clientId = clientId;
    }
    
    public Long getConsultationId() {
        return consultationId;
    }
    
    public void setConsultationId(Long consultationId) {
        this.consultationId = consultationId;
    }
    
    public String getSenderType() {
        return senderType;
    }
    
    public void setSenderType(String senderType) {
        this.senderType = senderType;
    }
    
    public Long getSenderId() {
        return senderId;
    }
    
    public void setSenderId(Long senderId) {
        this.senderId = senderId;
    }
    
    public Long getReceiverId() {
        return receiverId;
    }
    
    public void setReceiverId(Long receiverId) {
        this.receiverId = receiverId;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getContent() {
        return content;
    }
    
    public void setContent(String content) {
        this.content = content;
    }
    
    public String getMessageType() {
        return messageType;
    }
    
    public void setMessageType(String messageType) {
        this.messageType = messageType;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public Boolean getIsImportant() {
        return isImportant;
    }
    
    public void setIsImportant(Boolean isImportant) {
        this.isImportant = isImportant;
    }
    
    public Boolean getIsUrgent() {
        return isUrgent;
    }
    
    public void setIsUrgent(Boolean isUrgent) {
        this.isUrgent = isUrgent;
    }
    
    public Boolean getIsRead() {
        return isRead;
    }
    
    public void setIsRead(Boolean isRead) {
        this.isRead = isRead;
    }
    
    public LocalDateTime getReadAt() {
        return readAt;
    }
    
    public void setReadAt(LocalDateTime readAt) {
        this.readAt = readAt;
    }
    
    public LocalDateTime getRepliedAt() {
        return repliedAt;
    }
    
    public void setRepliedAt(LocalDateTime repliedAt) {
        this.repliedAt = repliedAt;
    }
    
    public Long getReplyToMessageId() {
        return replyToMessageId;
    }
    
    public void setReplyToMessageId(Long replyToMessageId) {
        this.replyToMessageId = replyToMessageId;
    }
    
    public String getAttachments() {
        return attachments;
    }
    
    public void setAttachments(String attachments) {
        this.attachments = attachments;
    }
    
    public String getMetadata() {
        return metadata;
    }
    
    public void setMetadata(String metadata) {
        this.metadata = metadata;
    }
    
    public LocalDateTime getScheduledSendAt() {
        return scheduledSendAt;
    }
    
    public void setScheduledSendAt(LocalDateTime scheduledSendAt) {
        this.scheduledSendAt = scheduledSendAt;
    }
    
    public LocalDateTime getSentAt() {
        return sentAt;
    }
    
    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt;
    }
    
    public String getDeliveryChannel() {
        return deliveryChannel;
    }
    
    public void setDeliveryChannel(String deliveryChannel) {
        this.deliveryChannel = deliveryChannel;
    }
    
    public String getDeliveryResult() {
        return deliveryResult;
    }
    
    public void setDeliveryResult(String deliveryResult) {
        this.deliveryResult = deliveryResult;
    }
    
    public Boolean getIsDelivered() {
        return isDelivered;
    }
    
    public void setIsDelivered(Boolean isDelivered) {
        this.isDelivered = isDelivered;
    }
    
    public LocalDateTime getDeliveredAt() {
        return deliveredAt;
    }
    
    public void setDeliveredAt(LocalDateTime deliveredAt) {
        this.deliveredAt = deliveredAt;
    }
    
    public Boolean getIsArchived() {
        return isArchived;
    }
    
    public void setIsArchived(Boolean isArchived) {
        this.isArchived = isArchived;
    }
    
    public LocalDateTime getArchivedAt() {
        return archivedAt;
    }
    
    public void setArchivedAt(LocalDateTime archivedAt) {
        this.archivedAt = archivedAt;
    }
    
    // toString
    @Override
    public String toString() {
        return "ConsultationMessage{" +
                "id=" + getId() +
                ", consultantId=" + consultantId +
                ", clientId=" + clientId +
                ", senderType='" + senderType + '\'' +
                ", title='" + title + '\'' +
                ", messageType='" + messageType + '\'' +
                ", status='" + status + '\'' +
                ", isRead=" + isRead +
                ", sentAt=" + sentAt +
                '}';
    }
}

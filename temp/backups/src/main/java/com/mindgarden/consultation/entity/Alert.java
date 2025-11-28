package com.mindgarden.consultation.entity;

import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 알림 시스템 엔티티
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Entity
@Table(name = "alerts", indexes = {
    @Index(name = "idx_alerts_user_id", columnList = "user_id"),
    @Index(name = "idx_alerts_type", columnList = "type"),
    @Index(name = "idx_alerts_priority", columnList = "priority"),
    @Index(name = "idx_alerts_status", columnList = "status"),
    @Index(name = "idx_alerts_created_at", columnList = "created_at"),
    @Index(name = "idx_alerts_is_deleted", columnList = "is_deleted")
})
public class Alert extends BaseEntity {
    
    @NotNull(message = "사용자 ID는 필수입니다.")
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @NotNull(message = "알림 유형은 필수입니다.")
    @Size(max = 50, message = "알림 유형은 50자 이하여야 합니다.")
    @Column(name = "type", nullable = false, length = 50)
    private String type; // CONSULTATION, SCHEDULE, SYSTEM, SECURITY, REMINDER, NOTIFICATION
    
    @NotNull(message = "알림 우선순위는 필수입니다.")
    @Size(max = 20, message = "알림 우선순위는 20자 이하여야 합니다.")
    @Column(name = "priority", nullable = false, length = 20)
    private String priority = "NORMAL"; // LOW, NORMAL, HIGH, URGENT, CRITICAL
    
    @NotNull(message = "알림 상태는 필수입니다.")
    @Size(max = 20, message = "알림 상태는 20자 이하여야 합니다.")
    @Column(name = "status", nullable = false, length = 20)
    private String status = "UNREAD"; // UNREAD, READ, ARCHIVED, DELETED
    
    @NotNull(message = "알림 제목은 필수입니다.")
    @Size(max = 200, message = "알림 제목은 200자 이하여야 합니다.")
    @Column(name = "title", nullable = false, length = 200)
    private String title;
    
    @Size(max = 1000, message = "알림 내용은 1000자 이하여야 합니다.")
    @Column(name = "content", columnDefinition = "TEXT")
    private String content;
    
    @Size(max = 500, message = "알림 요약은 500자 이하여야 합니다.")
    @Column(name = "summary", length = 500)
    private String summary;
    
    @Size(max = 100, message = "알림 아이콘은 100자 이하여야 합니다.")
    @Column(name = "icon", length = 100)
    private String icon; // CSS 클래스명 또는 아이콘 경로
    
    @Size(max = 100, message = "알림 색상은 100자 이하여야 합니다.")
    @Column(name = "color", length = 100)
    private String color; // CSS 색상 코드
    
    @Size(max = 500, message = "알림 이미지는 500자 이하여야 합니다.")
    @Column(name = "image_url", length = 500)
    private String imageUrl;
    
    @Size(max = 500, message = "알림 링크는 500자 이하여야 합니다.")
    @Column(name = "link_url", length = 500)
    private String linkUrl; // 클릭 시 이동할 URL
    
    @Size(max = 100, message = "링크 타겟은 100자 이하여야 합니다.")
    @Column(name = "link_target", length = 100)
    private String linkTarget; // _blank, _self, _parent, _top
    
    @Column(name = "is_sticky")
    private Boolean isSticky = false; // 상단 고정 알림 여부
    
    @Column(name = "is_dismissible")
    private Boolean isDismissible = true; // 닫기 가능 여부
    
    @Column(name = "auto_dismiss_seconds")
    private Integer autoDismissSeconds; // 자동 닫기 시간 (초)
    
    @Column(name = "dismissed_at")
    private LocalDateTime dismissedAt; // 닫힌 시간
    
    @Column(name = "read_at")
    private LocalDateTime readAt; // 읽은 시간
    
    @Column(name = "archived_at")
    private LocalDateTime archivedAt; // 보관된 시간
    
    @Column(name = "scheduled_at")
    private LocalDateTime scheduledAt; // 예약 발송 시간
    
    @Column(name = "expires_at")
    private LocalDateTime expiresAt; // 만료 시간
    
    @Column(name = "is_recurring")
    private Boolean isRecurring = false; // 반복 알림 여부
    
    @Size(max = 20, message = "반복 패턴은 20자 이하여야 합니다.")
    @Column(name = "recurrence_pattern", length = 20)
    private String recurrencePattern; // DAILY, WEEKLY, MONTHLY, YEARLY
    
    @Column(name = "recurrence_interval")
    private Integer recurrenceInterval; // 반복 간격
    
    @Column(name = "recurrence_end_date")
    private LocalDateTime recurrenceEndDate; // 반복 종료일
    
    @Column(name = "last_sent_at")
    private LocalDateTime lastSentAt; // 마지막 발송 시간
    
    @Column(name = "next_send_at")
    private LocalDateTime nextSendAt; // 다음 발송 예정 시간
    
    @Column(name = "send_count")
    private Integer sendCount = 0; // 발송 횟수
    
    @Column(name = "max_send_count")
    private Integer maxSendCount; // 최대 발송 횟수
    
    @Size(max = 20, message = "알림 채널은 20자 이하여야 합니다.")
    @Column(name = "channel", length = 20)
    private String channel = "IN_APP"; // IN_APP, EMAIL, SMS, PUSH, WEBHOOK
    
    @Size(max = 1000, message = "채널별 설정은 1000자 이하여야 합니다.")
    @Column(name = "channel_config", columnDefinition = "TEXT")
    private String channelConfig; // 채널별 설정 (JSON)
    
    @Column(name = "is_sent")
    private Boolean isSent = false; // 발송 완료 여부
    
    @Column(name = "sent_at")
    private LocalDateTime sentAt; // 발송 완료 시간
    
    @Size(max = 500, message = "발송 오류는 500자 이하여야 합니다.")
    @Column(name = "send_error", length = 500)
    private String sendError; // 발송 오류 메시지
    
    @Column(name = "retry_count")
    private Integer retryCount = 0; // 재시도 횟수
    
    @Column(name = "max_retry_count")
    private Integer maxRetryCount = 3; // 최대 재시도 횟수
    
    @Column(name = "next_retry_at")
    private LocalDateTime nextRetryAt; // 다음 재시도 시간
    
    @Size(max = 1000, message = "메타데이터는 1000자 이하여야 합니다.")
    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata; // 추가 메타데이터 (JSON)
    
    @Column(name = "related_entity_type")
    private String relatedEntityType; // 관련 엔티티 타입
    
    @Column(name = "related_entity_id")
    private Long relatedEntityId; // 관련 엔티티 ID
    
    // 생성자
    public Alert() {
        super();
        this.priority = "NORMAL";
        this.status = "UNREAD";
        this.isSticky = false;
        this.isDismissible = true;
        this.isRecurring = false;
        this.channel = "IN_APP";
        this.isSent = false;
        this.retryCount = 0;
        this.maxRetryCount = 3;
        this.sendCount = 0;
    }
    
    // 비즈니스 메서드
    /**
     * 알림 읽음 처리
     */
    public void markAsRead() {
        this.status = "READ";
        this.readAt = LocalDateTime.now();
    }
    
    /**
     * 알림 보관 처리
     */
    public void archive() {
        this.status = "ARCHIVED";
        this.archivedAt = LocalDateTime.now();
    }
    
    /**
     * 알림 닫기 처리
     */
    public void dismiss() {
        this.dismissedAt = LocalDateTime.now();
    }
    
    /**
     * 알림 삭제 처리
     */
    public void delete() {
        this.status = "DELETED";
        this.delete();
    }
    
    /**
     * 알림 발송 완료
     */
    public void markAsSent() {
        this.isSent = true;
        this.sentAt = LocalDateTime.now();
        this.lastSentAt = LocalDateTime.now();
        this.sendCount++;
        this.retryCount = 0;
    }
    
    /**
     * 알림 발송 실패
     */
    public void markAsFailed(String error) {
        this.sendError = error;
        this.retryCount++;
        if (this.retryCount < this.maxRetryCount) {
            this.nextRetryAt = LocalDateTime.now().plusMinutes(5 * this.retryCount);
        }
    }
    
    /**
     * 반복 알림 설정
     */
    public void setRecurring(String pattern, Integer interval, LocalDateTime endDate) {
        this.isRecurring = true;
        this.recurrencePattern = pattern;
        this.recurrenceInterval = interval;
        this.recurrenceEndDate = endDate;
        calculateNextSendTime();
    }
    
    /**
     * 다음 발송 시간 계산
     */
    private void calculateNextSendTime() {
        if (this.lastSentAt != null && this.recurrencePattern != null) {
            switch (this.recurrencePattern) {
                case "DAILY":
                    this.nextSendAt = this.lastSentAt.plusDays(this.recurrenceInterval);
                    break;
                case "WEEKLY":
                    this.nextSendAt = this.lastSentAt.plusWeeks(this.recurrenceInterval);
                    break;
                case "MONTHLY":
                    this.nextSendAt = this.lastSentAt.plusMonths(this.recurrenceInterval);
                    break;
                case "YEARLY":
                    this.nextSendAt = this.lastSentAt.plusYears(this.recurrenceInterval);
                    break;
            }
        }
    }
    
    /**
     * 알림 만료 여부 확인
     */
    public boolean isExpired() {
        return this.expiresAt != null && LocalDateTime.now().isAfter(this.expiresAt);
    }
    
    /**
     * 알림 발송 가능 여부 확인
     */
    public boolean canSend() {
        if (this.isSent && this.maxSendCount != null && this.sendCount >= this.maxSendCount) {
            return false;
        }
        if (this.isExpired()) {
            return false;
        }
        if (this.nextSendAt != null && LocalDateTime.now().isBefore(this.nextSendAt)) {
            return false;
        }
        return true;
    }
    
    /**
     * 자동 닫기 설정
     */
    public void setAutoDismiss(Integer seconds) {
        this.autoDismissSeconds = seconds;
    }
    
    /**
     * 상단 고정 설정
     */
    public void setSticky() {
        this.isSticky = true;
        this.isDismissible = false;
    }
    
    // Getter & Setter
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    
    public String getType() {
        return type;
    }
    
    public void setType(String type) {
        this.type = type;
    }
    
    public String getPriority() {
        return priority;
    }
    
    public void setPriority(String priority) {
        this.priority = priority;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
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
    
    public String getSummary() {
        return summary;
    }
    
    public void setSummary(String summary) {
        this.summary = summary;
    }
    
    public String getIcon() {
        return icon;
    }
    
    public void setIcon(String icon) {
        this.icon = icon;
    }
    
    public String getColor() {
        return color;
    }
    
    public void setColor(String color) {
        this.color = color;
    }
    
    public String getImageUrl() {
        return imageUrl;
    }
    
    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
    
    public String getLinkUrl() {
        return linkUrl;
    }
    
    public void setLinkUrl(String linkUrl) {
        this.linkUrl = linkUrl;
    }
    
    public String getLinkTarget() {
        return linkTarget;
    }
    
    public void setLinkTarget(String linkTarget) {
        this.linkTarget = linkTarget;
    }
    
    public Boolean getIsSticky() {
        return isSticky;
    }
    
    public void setIsSticky(Boolean isSticky) {
        this.isSticky = isSticky;
    }
    
    public Boolean getIsDismissible() {
        return isDismissible;
    }
    
    public void setIsDismissible(Boolean isDismissible) {
        this.isDismissible = isDismissible;
    }
    
    public Integer getAutoDismissSeconds() {
        return autoDismissSeconds;
    }
    
    public void setAutoDismissSeconds(Integer autoDismissSeconds) {
        this.autoDismissSeconds = autoDismissSeconds;
    }
    
    public LocalDateTime getDismissedAt() {
        return dismissedAt;
    }
    
    public void setDismissedAt(LocalDateTime dismissedAt) {
        this.dismissedAt = dismissedAt;
    }
    
    public LocalDateTime getReadAt() {
        return readAt;
    }
    
    public void setReadAt(LocalDateTime readAt) {
        this.readAt = readAt;
    }
    
    public LocalDateTime getArchivedAt() {
        return archivedAt;
    }
    
    public void setArchivedAt(LocalDateTime archivedAt) {
        this.archivedAt = archivedAt;
    }
    
    public LocalDateTime getScheduledAt() {
        return scheduledAt;
    }
    
    public void setScheduledAt(LocalDateTime scheduledAt) {
        this.scheduledAt = scheduledAt;
    }
    
    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }
    
    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }
    
    public Boolean getIsRecurring() {
        return isRecurring;
    }
    
    public void setIsRecurring(Boolean isRecurring) {
        this.isRecurring = isRecurring;
    }
    
    public String getRecurrencePattern() {
        return recurrencePattern;
    }
    
    public void setRecurrencePattern(String recurrencePattern) {
        this.recurrencePattern = recurrencePattern;
    }
    
    public Integer getRecurrenceInterval() {
        return recurrenceInterval;
    }
    
    public void setRecurrenceInterval(Integer recurrenceInterval) {
        this.recurrenceInterval = recurrenceInterval;
    }
    
    public LocalDateTime getRecurrenceEndDate() {
        return recurrenceEndDate;
    }
    
    public void setRecurrenceEndDate(LocalDateTime recurrenceEndDate) {
        this.recurrenceEndDate = recurrenceEndDate;
    }
    
    public LocalDateTime getLastSentAt() {
        return lastSentAt;
    }
    
    public void setLastSentAt(LocalDateTime lastSentAt) {
        this.lastSentAt = lastSentAt;
    }
    
    public LocalDateTime getNextSendAt() {
        return nextSendAt;
    }
    
    public void setNextSendAt(LocalDateTime nextSendAt) {
        this.nextSendAt = nextSendAt;
    }
    
    public Integer getSendCount() {
        return sendCount;
    }
    
    public void setSendCount(Integer sendCount) {
        this.sendCount = sendCount;
    }
    
    public Integer getMaxSendCount() {
        return maxSendCount;
    }
    
    public void setMaxSendCount(Integer maxSendCount) {
        this.maxSendCount = maxSendCount;
    }
    
    public String getChannel() {
        return channel;
    }
    
    public void setChannel(String channel) {
        this.channel = channel;
    }
    
    public String getChannelConfig() {
        return channelConfig;
    }
    
    public void setChannelConfig(String channelConfig) {
        this.channelConfig = channelConfig;
    }
    
    public Boolean getIsSent() {
        return isSent;
    }
    
    public void setIsSent(Boolean isSent) {
        this.isSent = isSent;
    }
    
    public LocalDateTime getSentAt() {
        return sentAt;
    }
    
    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt;
    }
    
    public String getSendError() {
        return sendError;
    }
    
    public void setSendError(String sendError) {
        this.sendError = sendError;
    }
    
    public Integer getRetryCount() {
        return retryCount;
    }
    
    public void setRetryCount(Integer retryCount) {
        this.retryCount = retryCount;
    }
    
    public Integer getMaxRetryCount() {
        return maxRetryCount;
    }
    
    public void setMaxRetryCount(Integer maxRetryCount) {
        this.maxRetryCount = maxRetryCount;
    }
    
    public LocalDateTime getNextRetryAt() {
        return nextRetryAt;
    }
    
    public void setNextRetryAt(LocalDateTime nextRetryAt) {
        this.nextRetryAt = nextRetryAt;
    }
    
    public String getMetadata() {
        return metadata;
    }
    
    public void setMetadata(String metadata) {
        this.metadata = metadata;
    }
    
    public String getRelatedEntityType() {
        return relatedEntityType;
    }
    
    public void setRelatedEntityType(String relatedEntityType) {
        this.relatedEntityType = relatedEntityType;
    }
    
    public Long getRelatedEntityId() {
        return relatedEntityId;
    }
    
    public void setRelatedEntityId(Long relatedEntityId) {
        this.relatedEntityId = relatedEntityId;
    }
    
    // toString
    @Override
    public String toString() {
        return "Alert{" +
                "id=" + getId() +
                ", userId=" + userId +
                ", type='" + type + '\'' +
                ", priority='" + priority + '\'' +
                ", status='" + status + '\'' +
                ", title='" + title + '\'' +
                ", isSent=" + isSent +
                ", sendCount=" + sendCount +
                '}';
    }
}

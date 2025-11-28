package com.mindgarden.consultation.entity;

import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 오류 메시지 관리 엔티티
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Entity
@Table(name = "error_messages", indexes = {
    @Index(name = "idx_error_messages_code", columnList = "error_code"),
    @Index(name = "idx_error_messages_severity", columnList = "severity"),
    @Index(name = "idx_error_messages_status", columnList = "status"),
    @Index(name = "idx_error_messages_created_at", columnList = "created_at"),
    @Index(name = "idx_error_messages_is_deleted", columnList = "is_deleted")
})
public class ErrorMessage extends BaseEntity {
    
    @NotNull(message = "오류 코드는 필수입니다.")
    @Size(max = 50, message = "오류 코드는 50자 이하여야 합니다.")
    @Column(name = "error_code", nullable = false, length = 50, unique = true)
    private String errorCode;
    
    @NotNull(message = "오류 심각도는 필수입니다.")
    @Size(max = 20, message = "오류 심각도는 20자 이하여야 합니다.")
    @Column(name = "severity", nullable = false, length = 20)
    private String severity = "MEDIUM"; // LOW, MEDIUM, HIGH, CRITICAL
    
    @NotNull(message = "오류 상태는 필수입니다.")
    @Size(max = 20, message = "오류 상태는 20자 이하여야 합니다.")
    @Column(name = "status", nullable = false, length = 20)
    private String status = "ACTIVE"; // ACTIVE, INACTIVE, DEPRECATED
    
    @NotNull(message = "오류 제목은 필수입니다.")
    @Size(max = 200, message = "오류 제목은 200자 이하여야 합니다.")
    @Column(name = "title", nullable = false, length = 200)
    private String title;
    
    @NotNull(message = "오류 메시지는 필수입니다.")
    @Size(max = 1000, message = "오류 메시지는 1000자 이하여야 합니다.")
    @Column(name = "message", nullable = false, columnDefinition = "TEXT")
    private String message;
    
    @Size(max = 1000, message = "오류 설명은 1000자 이하여야 합니다.")
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Size(max = 100, message = "오류 카테고리는 100자 이하여야 합니다.")
    @Column(name = "category", length = 100)
    private String category; // VALIDATION, AUTHENTICATION, AUTHORIZATION, BUSINESS, SYSTEM, DATABASE
    
    @Size(max = 100, message = "오류 그룹은 100자 이하여야 합니다.")
    @Column(name = "error_group", length = 100)
    private String errorGroup; // 오류 그룹화
    
    @Size(max = 100, message = "오류 서브그룹은 100자 이하여야 합니다.")
    @Column(name = "error_subgroup", length = 100)
    private String errorSubgroup; // 오류 서브그룹화
    
    @Size(max = 100, message = "오류 타입은 100자 이하여야 합니다.")
    @Column(name = "error_type", length = 100)
    private String errorType; // CLIENT_ERROR, SERVER_ERROR, NETWORK_ERROR
    
    @Size(max = 100, message = "HTTP 상태 코드는 100자 이하여야 합니다.")
    @Column(name = "http_status_code", length = 100)
    private String httpStatusCode; // 400, 401, 403, 404, 500 등
    
    @Size(max = 1000, message = "사용자 안내 메시지는 1000자 이하여야 합니다.")
    @Column(name = "user_message", columnDefinition = "TEXT")
    private String userMessage; // 사용자에게 보여줄 메시지
    
    @Size(max = 1000, message = "개발자 메시지는 1000자 이하여야 합니다.")
    @Column(name = "developer_message", columnDefinition = "TEXT")
    private String developerMessage; // 개발자를 위한 상세 메시지
    
    @Size(max = 1000, message = "해결 방법은 1000자 이하여야 합니다.")
    @Column(name = "solution", columnDefinition = "TEXT")
    private String solution; // 오류 해결 방법
    
    @Size(max = 1000, message = "예방 방법은 1000자 이하여야 합니다.")
    @Column(name = "prevention", columnDefinition = "TEXT")
    private String prevention; // 오류 예방 방법
    
    @Size(max = 500, message = "관련 문서는 500자 이하여야 합니다.")
    @Column(name = "documentation_url", length = 500)
    private String documentationUrl; // 관련 문서 URL
    
    @Size(max = 500, message = "지원 연락처는 500자 이하여야 합니다.")
    @Column(name = "support_contact", length = 500)
    private String supportContact; // 지원 연락처
    
    @Column(name = "is_user_friendly")
    private Boolean isUserFriendly = true; // 사용자 친화적 메시지 여부
    
    @Column(name = "is_localized")
    private Boolean isLocalized = false; // 다국어 지원 여부
    
    @Size(max = 20, message = "기본 언어는 20자 이하여야 합니다.")
    @Column(name = "default_language", length = 20)
    private String defaultLanguage = "ko"; // 기본 언어 (ko, en, ja, zh)
    
    @Size(max = 1000, message = "다국어 메시지는 1000자 이하여야 합니다.")
    @Column(name = "localized_messages", columnDefinition = "TEXT")
    private String localizedMessages; // 다국어 메시지 (JSON)
    
    @Column(name = "is_logged")
    private Boolean isLogged = true; // 로그 기록 여부
    
    @Size(max = 20, message = "로그 레벨은 20자 이하여야 합니다.")
    @Column(name = "log_level", length = 20)
    private String logLevel = "ERROR"; // DEBUG, INFO, WARN, ERROR, FATAL
    
    @Column(name = "is_monitored")
    private Boolean isMonitored = true; // 모니터링 대상 여부
    
    @Column(name = "is_alerted")
    private Boolean isAlerted = false; // 알림 발송 여부
    
    @Size(max = 100, message = "알림 우선순위는 100자 이하여야 합니다.")
    @Column(name = "alert_priority", length = 100)
    private String alertPriority = "NORMAL"; // LOW, NORMAL, HIGH, URGENT
    
    @Column(name = "occurrence_count")
    private Long occurrenceCount = 0L; // 발생 횟수
    
    @Column(name = "last_occurrence")
    private LocalDateTime lastOccurrence; // 마지막 발생 시간
    
    @Column(name = "first_occurrence")
    private LocalDateTime firstOccurrence; // 첫 발생 시간
    
    @Column(name = "average_occurrence_interval")
    private Long averageOccurrenceInterval; // 평균 발생 간격 (초)
    
    @Size(max = 1000, message = "발생 패턴은 1000자 이하여야 합니다.")
    @Column(name = "occurrence_pattern", columnDefinition = "TEXT")
    private String occurrencePattern; // 발생 패턴 분석
    
    @Column(name = "is_resolved")
    private Boolean isResolved = false; // 해결 여부
    
    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt; // 해결 시간
    
    @Size(max = 500, message = "해결 방법은 500자 이하여야 합니다.")
    @Column(name = "resolution_method", length = 500)
    private String resolutionMethod; // 해결 방법
    
    @Size(max = 100, message = "해결 담당자는 100자 이하여야 합니다.")
    @Column(name = "resolved_by", length = 100)
    private String resolvedBy; // 해결 담당자
    
    @Size(max = 1000, message = "해결 노트는 1000자 이하여야 합니다.")
    @Column(name = "resolution_notes", columnDefinition = "TEXT")
    private String resolutionNotes; // 해결 노트
    
    @Column(name = "is_deprecated")
    private Boolean isDeprecated = false; // 사용 중단 여부
    
    @Column(name = "deprecated_at")
    private LocalDateTime deprecatedAt; // 사용 중단 시간
    
    @Size(max = 500, message = "사용 중단 사유는 500자 이하여야 합니다.")
    @Column(name = "deprecation_reason", length = 500)
    private String deprecationReason; // 사용 중단 사유
    
    @Size(max = 100, message = "대체 오류 코드는 100자 이하여야 합니다.")
    @Column(name = "replacement_error_code", length = 100)
    private String replacementErrorCode; // 대체 오류 코드
    
    @Size(max = 1000, message = "마이그레이션 가이드는 1000자 이하여야 합니다.")
    @Column(name = "migration_guide", columnDefinition = "TEXT")
    private String migrationGuide; // 마이그레이션 가이드
    
    // 생성자
    public ErrorMessage() {
        super();
        this.severity = "MEDIUM";
        this.status = "ACTIVE";
        this.isUserFriendly = true;
        this.isLocalized = false;
        this.defaultLanguage = "ko";
        this.isLogged = true;
        this.logLevel = "ERROR";
        this.isMonitored = true;
        this.isAlerted = false;
        this.alertPriority = "NORMAL";
        this.occurrenceCount = 0L;
        this.isResolved = false;
        this.isDeprecated = false;
    }
    
    // 비즈니스 메서드
    /**
     * 오류 발생 기록
     */
    public void recordOccurrence() {
        this.occurrenceCount++;
        this.lastOccurrence = LocalDateTime.now();
        
        if (this.firstOccurrence == null) {
            this.firstOccurrence = LocalDateTime.now();
        }
        
        updateAverageOccurrenceInterval();
    }
    
    /**
     * 평균 발생 간격 업데이트
     */
    private void updateAverageOccurrenceInterval() {
        if (this.firstOccurrence != null && this.lastOccurrence != null && this.occurrenceCount > 1) {
            long totalSeconds = java.time.Duration.between(this.firstOccurrence, this.lastOccurrence).getSeconds();
            this.averageOccurrenceInterval = totalSeconds / (this.occurrenceCount - 1);
        }
    }
    
    /**
     * 오류 해결 처리
     */
    public void resolve(String method, String resolvedBy, String notes) {
        this.isResolved = true;
        this.resolvedAt = LocalDateTime.now();
        this.resolutionMethod = method;
        this.resolvedBy = resolvedBy;
        this.resolutionNotes = notes;
    }
    
    /**
     * 오류 사용 중단 처리
     */
    public void deprecate(String reason, String replacementCode, String migrationGuide) {
        this.isDeprecated = true;
        this.deprecatedAt = LocalDateTime.now();
        this.deprecationReason = reason;
        this.replacementErrorCode = replacementCode;
        this.migrationGuide = migrationGuide;
        this.status = "DEPRECATED";
    }
    
    /**
     * 오류 활성화
     */
    public void activate() {
        this.status = "ACTIVE";
        this.isDeprecated = false;
        this.deprecatedAt = null;
        this.deprecationReason = null;
    }
    
    /**
     * 오류 비활성화
     */
    public void deactivate() {
        this.status = "INACTIVE";
    }
    
    /**
     * 알림 설정
     */
    public void enableAlerting(String priority) {
        this.isAlerted = true;
        this.alertPriority = priority;
    }
    
    /**
     * 알림 해제
     */
    public void disableAlerting() {
        this.isAlerted = false;
    }
    
    /**
     * 다국어 메시지 설정
     */
    public void setLocalizedMessages(String messages) {
        this.localizedMessages = messages;
        this.isLocalized = true;
    }
    
    /**
     * 사용자 친화적 메시지 설정
     */
    public void setUserFriendly(boolean userFriendly) {
        this.isUserFriendly = userFriendly;
    }
    
    /**
     * 로그 레벨 설정
     */
    public void setLogLevel(String level) {
        if (level != null && (level.equals("DEBUG") || level.equals("INFO") || 
                            level.equals("WARN") || level.equals("ERROR") || level.equals("FATAL"))) {
            this.logLevel = level;
        }
    }
    
    /**
     * 심각도 설정
     */
    public void setSeverity(String severity) {
        if (severity != null && (severity.equals("LOW") || severity.equals("MEDIUM") || 
                               severity.equals("HIGH") || severity.equals("CRITICAL"))) {
            this.severity = severity;
        }
    }
    
    // Getter & Setter
    public String getErrorCode() {
        return errorCode;
    }
    
    public void setErrorCode(String errorCode) {
        this.errorCode = errorCode;
    }
    
    public String getSeverity() {
        return severity;
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
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getCategory() {
        return category;
    }
    
    public void setCategory(String category) {
        this.category = category;
    }
    
    public String getErrorGroup() {
        return errorGroup;
    }
    
    public void setErrorGroup(String errorGroup) {
        this.errorGroup = errorGroup;
    }
    
    public String getErrorSubgroup() {
        return errorSubgroup;
    }
    
    public void setErrorSubgroup(String errorSubgroup) {
        this.errorSubgroup = errorSubgroup;
    }
    
    public String getErrorType() {
        return errorType;
    }
    
    public void setErrorType(String errorType) {
        this.errorType = errorType;
    }
    
    public String getHttpStatusCode() {
        return httpStatusCode;
    }
    
    public void setHttpStatusCode(String httpStatusCode) {
        this.httpStatusCode = httpStatusCode;
    }
    
    public String getUserMessage() {
        return userMessage;
    }
    
    public void setUserMessage(String userMessage) {
        this.userMessage = userMessage;
    }
    
    public String getDeveloperMessage() {
        return developerMessage;
    }
    
    public void setDeveloperMessage(String developerMessage) {
        this.developerMessage = developerMessage;
    }
    
    public String getSolution() {
        return solution;
    }
    
    public void setSolution(String solution) {
        this.solution = solution;
    }
    
    public String getPrevention() {
        return prevention;
    }
    
    public void setPrevention(String prevention) {
        this.prevention = prevention;
    }
    
    public String getDocumentationUrl() {
        return documentationUrl;
    }
    
    public void setDocumentationUrl(String documentationUrl) {
        this.documentationUrl = documentationUrl;
    }
    
    public String getSupportContact() {
        return supportContact;
    }
    
    public void setSupportContact(String supportContact) {
        this.supportContact = supportContact;
    }
    
    public Boolean getIsUserFriendly() {
        return isUserFriendly;
    }
    
    public void setIsUserFriendly(Boolean isUserFriendly) {
        this.isUserFriendly = isUserFriendly;
    }
    
    public Boolean getIsLocalized() {
        return isLocalized;
    }
    
    public void setIsLocalized(Boolean isLocalized) {
        this.isLocalized = isLocalized;
    }
    
    public String getDefaultLanguage() {
        return defaultLanguage;
    }
    
    public void setDefaultLanguage(String defaultLanguage) {
        this.defaultLanguage = defaultLanguage;
    }
    
    public String getLocalizedMessages() {
        return localizedMessages;
    }
    
    public Boolean getIsLogged() {
        return isLogged;
    }
    
    public void setIsLogged(Boolean isLogged) {
        this.isLogged = isLogged;
    }
    
    public String getLogLevel() {
        return logLevel;
    }
    
    public Boolean getIsMonitored() {
        return isMonitored;
    }
    
    public void setIsMonitored(Boolean isMonitored) {
        this.isMonitored = isMonitored;
    }
    
    public Boolean getIsAlerted() {
        return isAlerted;
    }
    
    public void setIsAlerted(Boolean isAlerted) {
        this.isAlerted = isAlerted;
    }
    
    public String getAlertPriority() {
        return alertPriority;
    }
    
    public void setAlertPriority(String alertPriority) {
        this.alertPriority = alertPriority;
    }
    
    public Long getOccurrenceCount() {
        return occurrenceCount;
    }
    
    public void setOccurrenceCount(Long occurrenceCount) {
        this.occurrenceCount = occurrenceCount;
    }
    
    public LocalDateTime getLastOccurrence() {
        return lastOccurrence;
    }
    
    public void setLastOccurrence(LocalDateTime lastOccurrence) {
        this.lastOccurrence = lastOccurrence;
    }
    
    public LocalDateTime getFirstOccurrence() {
        return firstOccurrence;
    }
    
    public void setFirstOccurrence(LocalDateTime firstOccurrence) {
        this.firstOccurrence = firstOccurrence;
    }
    
    public Long getAverageOccurrenceInterval() {
        return averageOccurrenceInterval;
    }
    
    public void setAverageOccurrenceInterval(Long averageOccurrenceInterval) {
        this.averageOccurrenceInterval = averageOccurrenceInterval;
    }
    
    public String getOccurrencePattern() {
        return occurrencePattern;
    }
    
    public void setOccurrencePattern(String occurrencePattern) {
        this.occurrencePattern = occurrencePattern;
    }
    
    public Boolean getIsResolved() {
        return isResolved;
    }
    
    public void setIsResolved(Boolean isResolved) {
        this.isResolved = isResolved;
    }
    
    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }
    
    public void setResolvedAt(LocalDateTime resolvedAt) {
        this.resolvedAt = resolvedAt;
    }
    
    public String getResolutionMethod() {
        return resolutionMethod;
    }
    
    public void setResolutionMethod(String resolutionMethod) {
        this.resolutionMethod = resolutionMethod;
    }
    
    public String getResolvedBy() {
        return resolvedBy;
    }
    
    public void setResolvedBy(String resolvedBy) {
        this.resolvedBy = resolvedBy;
    }
    
    public String getResolutionNotes() {
        return resolutionNotes;
    }
    
    public void setResolutionNotes(String resolutionNotes) {
        this.resolutionNotes = resolutionNotes;
    }
    
    public Boolean getIsDeprecated() {
        return isDeprecated;
    }
    
    public void setIsDeprecated(Boolean isDeprecated) {
        this.isDeprecated = isDeprecated;
    }
    
    public LocalDateTime getDeprecatedAt() {
        return deprecatedAt;
    }
    
    public void setDeprecatedAt(LocalDateTime deprecatedAt) {
        this.deprecatedAt = deprecatedAt;
    }
    
    public String getDeprecationReason() {
        return deprecationReason;
    }
    
    public void setDeprecationReason(String deprecationReason) {
        this.deprecationReason = deprecationReason;
    }
    
    public String getReplacementErrorCode() {
        return replacementErrorCode;
    }
    
    public void setReplacementErrorCode(String replacementErrorCode) {
        this.replacementErrorCode = replacementErrorCode;
    }
    
    public String getMigrationGuide() {
        return migrationGuide;
    }
    
    public void setMigrationGuide(String migrationGuide) {
        this.migrationGuide = migrationGuide;
    }
    
    // toString
    @Override
    public String toString() {
        return "ErrorMessage{" +
                "id=" + getId() +
                ", errorCode='" + errorCode + '\'' +
                ", severity='" + severity + '\'' +
                ", status='" + status + '\'' +
                ", title='" + title + '\'' +
                ", occurrenceCount=" + occurrenceCount +
                ", isResolved=" + isResolved +
                '}';
    }
}

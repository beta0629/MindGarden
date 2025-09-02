package com.mindgarden.consultation.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 상담 일정 엔티티
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Entity
@Table(name = "schedules", indexes = {
    @Index(name = "idx_schedules_consultant_id", columnList = "consultant_id"),
    @Index(name = "idx_schedules_date", columnList = "date"),
    @Index(name = "idx_schedules_status", columnList = "status"),
    @Index(name = "idx_schedules_is_deleted", columnList = "is_deleted")
})
public class Schedule extends BaseEntity {
    
    @NotNull(message = "상담사 ID는 필수입니다.")
    @Column(name = "consultant_id", nullable = false)
    private Long consultantId;
    
    @NotNull(message = "일정 일자는 필수입니다.")
    @Column(name = "date", nullable = false)
    private LocalDate date;
    
    @NotNull(message = "시작 시간은 필수입니다.")
    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;
    
    @NotNull(message = "종료 시간은 필수입니다.")
    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;
    
    @Size(max = 20, message = "일정 상태는 20자 이하여야 합니다.")
    @Column(name = "status", nullable = false, length = 20)
    private String status = "AVAILABLE"; // AVAILABLE, BOOKED, BLOCKED, BREAK
    
    @Size(max = 100, message = "일정 유형은 100자 이하여야 합니다.")
    @Column(name = "schedule_type", length = 100)
    private String scheduleType; // CONSULTATION, BREAK, MEETING, TRAINING, OTHER
    
    @Size(max = 50, message = "상담 유형은 50자 이하여야 합니다.")
    @Column(name = "consultation_type", length = 50)
    private String consultationType; // INDIVIDUAL, FAMILY, COUPLE, GROUP, INITIAL, FOLLOW_UP, CRISIS, ASSESSMENT
    
    @Size(max = 500, message = "일정 제목은 500자 이하여야 합니다.")
    @Column(name = "title", length = 500)
    private String title;
    
    @Size(max = 1000, message = "일정 설명은 1000자 이하여야 합니다.")
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "consultation_id")
    private Long consultationId; // 상담 ID (예약된 경우)
    
    @Column(name = "client_id")
    private Long clientId; // 내담자 ID (예약된 경우)
    
    @Size(max = 20, message = "상담 방법은 20자 이하여야 합니다.")
    @Column(name = "consultation_method", length = 20)
    private String consultationMethod; // FACE_TO_FACE, ONLINE, PHONE
    
    @Size(max = 500, message = "상담 장소는 500자 이하여야 합니다.")
    @Column(name = "consultation_location", length = 500)
    private String consultationLocation;
    
    @Column(name = "duration_minutes")
    private Integer durationMinutes; // 일정 시간 (분)
    
    @Column(name = "is_recurring")
    private Boolean isRecurring = false; // 반복 일정 여부
    
    @Size(max = 20, message = "반복 주기는 20자 이하여야 합니다.")
    @Column(name = "recurrence_pattern", length = 20)
    private String recurrencePattern; // DAILY, WEEKLY, MONTHLY, YEARLY
    
    @Column(name = "recurrence_interval")
    private Integer recurrenceInterval; // 반복 간격 (1, 2, 3...)
    
    @Column(name = "recurrence_end_date")
    private LocalDate recurrenceEndDate; // 반복 종료일
    
    @Column(name = "is_all_day")
    private Boolean isAllDay = false; // 종일 일정 여부
    
    @Column(name = "is_private")
    private Boolean isPrivate = false; // 개인 일정 여부
    
    @Size(max = 100, message = "우선순위는 100자 이하여야 합니다.")
    @Column(name = "priority", length = 100)
    private String priority = "NORMAL"; // LOW, NORMAL, HIGH, URGENT
    
    @Size(max = 100, message = "색상은 100자 이하여야 합니다.")
    @Column(name = "color", length = 100)
    private String color; // 일정 색상 (CSS 색상 코드)
    
    @Size(max = 1000, message = "메모는 1000자 이하여야 합니다.")
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
    
    @Column(name = "reminder_time")
    private LocalDateTime reminderTime; // 알림 시간
    
    @Column(name = "is_reminder_sent")
    private Boolean isReminderSent = false; // 알림 발송 여부
    
    @Column(name = "created_by")
    private Long createdBy; // 일정 생성자 ID
    
    @Column(name = "last_modified_by")
    private Long lastModifiedBy; // 마지막 수정자 ID
    
    // 생성자
    public Schedule() {
        super();
        this.status = "AVAILABLE";
        this.priority = "NORMAL";
        this.isRecurring = false;
        this.isAllDay = false;
        this.isPrivate = false;
        this.isReminderSent = false;
    }
    
    // 비즈니스 메서드
    /**
     * 일정 예약
     */
    public void book(Long consultationId, Long clientId) {
        this.status = "BOOKED";
        this.consultationId = consultationId;
        this.clientId = clientId;
    }
    
    /**
     * 일정 차단 (상담 불가)
     */
    public void block(String reason) {
        this.status = "BLOCKED";
        this.description = reason;
    }
    
    /**
     * 휴식 시간 설정
     */
    public void setBreak(String title, String description) {
        this.status = "BREAK";
        this.scheduleType = "BREAK";
        this.title = title;
        this.description = description;
    }
    
    /**
     * 일정 시간 계산
     */
    public void calculateDuration() {
        if (startTime != null && endTime != null) {
            this.durationMinutes = endTime.getHour() * 60 + endTime.getMinute() - 
                                  startTime.getHour() * 60 - startTime.getMinute();
        }
    }
    
    /**
     * 일정 가능 여부 확인
     */
    public boolean isAvailable() {
        return "AVAILABLE".equals(status);
    }
    
    /**
     * 일정 예약 여부 확인
     */
    public boolean isBooked() {
        return "BOOKED".equals(status);
    }
    
    /**
     * 일정 차단 여부 확인
     */
    public boolean isBlocked() {
        return "BLOCKED".equals(status);
    }
    
    /**
     * 휴식 시간 여부 확인
     */
    public boolean isBreak() {
        return "BREAK".equals(status);
    }
    
    /**
     * 반복 일정 설정
     */
    public void setRecurring(String pattern, Integer interval, LocalDate endDate) {
        this.isRecurring = true;
        this.recurrencePattern = pattern;
        this.recurrenceInterval = interval;
        this.recurrenceEndDate = endDate;
    }
    
    /**
     * 알림 설정
     */
    public void setReminder(LocalDateTime reminderTime) {
        this.reminderTime = reminderTime;
        this.isReminderSent = false;
    }
    
    /**
     * 알림 발송 완료
     */
    public void markReminderSent() {
        this.isReminderSent = true;
    }
    
    // Getter & Setter
    public Long getConsultantId() {
        return consultantId;
    }
    
    public void setConsultantId(Long consultantId) {
        this.consultantId = consultantId;
    }
    
    public LocalDate getDate() {
        return date;
    }
    
    public void setDate(LocalDate date) {
        this.date = date;
    }
    
    public LocalTime getStartTime() {
        return startTime;
    }
    
    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }
    
    public LocalTime getEndTime() {
        return endTime;
    }
    
    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public String getScheduleType() {
        return scheduleType;
    }
    
    public void setScheduleType(String scheduleType) {
        this.scheduleType = scheduleType;
    }
    
    public String getConsultationType() {
        return consultationType;
    }
    
    public void setConsultationType(String consultationType) {
        this.consultationType = consultationType;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public Long getConsultationId() {
        return consultationId;
    }
    
    public void setConsultationId(Long consultationId) {
        this.consultationId = consultationId;
    }
    
    public Long getClientId() {
        return clientId;
    }
    
    public void setClientId(Long clientId) {
        this.clientId = clientId;
    }
    
    public String getConsultationMethod() {
        return consultationMethod;
    }
    
    public void setConsultationMethod(String consultationMethod) {
        this.consultationMethod = consultationMethod;
    }
    
    public String getConsultationLocation() {
        return consultationLocation;
    }
    
    public void setConsultationLocation(String consultationLocation) {
        this.consultationLocation = consultationLocation;
    }
    
    public Integer getDurationMinutes() {
        return durationMinutes;
    }
    
    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
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
    
    public LocalDate getRecurrenceEndDate() {
        return recurrenceEndDate;
    }
    
    public void setRecurrenceEndDate(LocalDate recurrenceEndDate) {
        this.recurrenceEndDate = recurrenceEndDate;
    }
    
    public Boolean getIsAllDay() {
        return isAllDay;
    }
    
    public void setIsAllDay(Boolean isAllDay) {
        this.isAllDay = isAllDay;
    }
    
    public Boolean getIsPrivate() {
        return isPrivate;
    }
    
    public void setIsPrivate(Boolean isPrivate) {
        this.isPrivate = isPrivate;
    }
    
    public String getPriority() {
        return priority;
    }
    
    public void setPriority(String priority) {
        this.priority = priority;
    }
    
    public String getColor() {
        return color;
    }
    
    public void setColor(String color) {
        this.color = color;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
    }
    
    public LocalDateTime getReminderTime() {
        return reminderTime;
    }
    
    public void setReminderTime(LocalDateTime reminderTime) {
        this.reminderTime = reminderTime;
    }
    
    public Boolean getIsReminderSent() {
        return isReminderSent;
    }
    
    public void setIsReminderSent(Boolean isReminderSent) {
        this.isReminderSent = isReminderSent;
    }
    
    public Long getCreatedBy() {
        return createdBy;
    }
    
    public void setCreatedBy(Long createdBy) {
        this.createdBy = createdBy;
    }
    
    public Long getLastModifiedBy() {
        return lastModifiedBy;
    }
    
    public void setLastModifiedBy(Long lastModifiedBy) {
        this.lastModifiedBy = lastModifiedBy;
    }
    
    // toString
    @Override
    public String toString() {
        return "Schedule{" +
                "id=" + getId() +
                ", consultantId=" + consultantId +
                ", date=" + date +
                ", startTime=" + startTime +
                ", endTime=" + endTime +
                ", status='" + status + '\'' +
                ", title='" + title + '\'' +
                ", scheduleType='" + scheduleType + '\'' +
                ", isRecurring=" + isRecurring +
                '}';
    }
}

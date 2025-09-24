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
 * 상담 기본 정보 엔티티
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Entity
@Table(name = "consultations", indexes = {
    @Index(name = "idx_consultations_client_id", columnList = "client_id"),
    @Index(name = "idx_consultations_consultant_id", columnList = "consultant_id"),
    @Index(name = "idx_consultations_status", columnList = "status"),
    @Index(name = "idx_consultations_consultation_date", columnList = "consultation_date"),
    @Index(name = "idx_consultations_is_deleted", columnList = "is_deleted")
})
public class Consultation extends BaseEntity {
    
    @NotNull(message = "내담자 ID는 필수입니다.")
    @Column(name = "client_id", nullable = false)
    private Long clientId;
    
    @NotNull(message = "상담사 ID는 필수입니다.")
    @Column(name = "consultant_id", nullable = false)
    private Long consultantId;
    
    @NotNull(message = "상담 상태는 필수입니다.")
    @Size(max = 20, message = "상담 상태는 20자 이하여야 합니다.")
    @Column(name = "status", nullable = false, length = 20)
    private String status = "REQUESTED"; // REQUESTED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED
    
    @NotNull(message = "상담 일자는 필수입니다.")
    @Column(name = "consultation_date", nullable = false)
    private LocalDate consultationDate;
    
    @NotNull(message = "상담 시작 시간은 필수입니다.")
    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;
    
    @NotNull(message = "상담 종료 시간은 필수입니다.")
    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;
    
    @Size(max = 200, message = "상담 제목은 200자 이하여야 합니다.")
    @Column(name = "title", nullable = false, length = 200)
    private String title; // 상담 제목
    
    @Column(name = "duration_minutes")
    private Integer durationMinutes; // 상담 시간 (분)
    
    @Size(max = 20, message = "상담 방법은 20자 이하여야 합니다.")
    @Column(name = "consultation_method", length = 20)
    private String consultationMethod; // FACE_TO_FACE, ONLINE, PHONE
    
    @Size(max = 500, message = "상담 장소는 500자 이하여야 합니다.")
    @Column(name = "consultation_location", length = 500)
    private String consultationLocation;
    
    @Size(max = 1000, message = "상담 목표는 1000자 이하여야 합니다.")
    @Column(name = "consultation_goals", columnDefinition = "TEXT")
    private String consultationGoals;
    
    @Size(max = 1000, message = "상담 내용은 1000자 이하여야 합니다.")
    @Column(name = "consultation_content", columnDefinition = "TEXT")
    private String consultationContent;
    
    @Size(max = 20, message = "상담 우선순위는 20자 이하여야 합니다.")
    @Column(name = "priority", length = 20)
    private String priority = "NORMAL"; // LOW, NORMAL, HIGH, URGENT
    
    @Size(max = 20, message = "위험도는 20자 이하여야 합니다.")
    @Column(name = "risk_level", length = 20)
    private String riskLevel = "LOW"; // LOW, MEDIUM, HIGH, CRITICAL
    
    @Column(name = "session_number")
    private Integer sessionNumber; // 상담 세션 번호
    
    @Column(name = "is_first_session")
    private Boolean isFirstSession = false; // 첫 상담 여부
    
    @Column(name = "is_emergency")
    private Boolean isEmergency = false; // 긴급 상담 여부
    
    @Column(name = "request_date")
    private LocalDateTime requestDate; // 상담 신청일시
    
    @Column(name = "confirmation_date")
    private LocalDateTime confirmationDate; // 상담 확정일시
    
    @Column(name = "cancellation_date")
    private LocalDateTime cancellationDate; // 상담 취소일시
    
    @Size(max = 500, message = "취소 사유는 500자 이하여야 합니다.")
    @Column(name = "cancellation_reason", length = 500)
    private String cancellationReason;
    
    @Size(max = 1000, message = "특별 고려사항은 1000자 이하여야 합니다.")
    @Column(name = "special_considerations", columnDefinition = "TEXT")
    private String specialConsiderations;
    
    @Size(max = 1000, message = "사전 준비사항은 1000자 이하여야 합니다.")
    @Column(name = "preparation_notes", columnDefinition = "TEXT")
    private String preparationNotes;
    
    @Column(name = "client_satisfaction_rating")
    private Integer clientSatisfactionRating; // 1-5점
    
    @Size(max = 500, message = "클라이언트 피드백은 500자 이하여야 합니다.")
    @Column(name = "client_feedback", length = 500)
    private String clientFeedback;
    
    @Column(name = "consultant_notes")
    private String consultantNotes; // 상담사 메모
    
    @Column(name = "next_consultation_date")
    private LocalDate nextConsultationDate; // 다음 상담 예정일
    
    @Column(name = "homework_assigned")
    private String homeworkAssigned; // 과제 부여
    
    @Column(name = "homework_due_date")
    private LocalDate homeworkDueDate; // 과제 제출 기한
    
    // 생성자
    public Consultation() {
        super();
        this.status = "REQUESTED";
        this.priority = "NORMAL";
        this.riskLevel = "LOW";
        this.isFirstSession = false;
        this.isEmergency = false;
        this.requestDate = LocalDateTime.now();
    }
    
    // 비즈니스 메서드
    /**
     * 상담 확정
     */
    public void confirm() {
        this.status = "CONFIRMED";
        this.confirmationDate = LocalDateTime.now();
    }
    
    /**
     * 상담 시작
     */
    public void start() {
        this.status = "IN_PROGRESS";
    }
    
    /**
     * 상담 완료
     */
    public void complete() {
        this.status = "COMPLETED";
        calculateDuration();
    }
    
    /**
     * 상담 취소
     */
    public void cancel(String reason) {
        this.status = "CANCELLED";
        this.cancellationDate = LocalDateTime.now();
        this.cancellationReason = reason;
    }
    
    /**
     * 상담 시간 계산
     */
    private void calculateDuration() {
        if (startTime != null && endTime != null) {
            this.durationMinutes = endTime.getHour() * 60 + endTime.getMinute() - 
                                  startTime.getHour() * 60 - startTime.getMinute();
        }
    }
    
    /**
     * 상담 가능 여부 확인
     */
    public boolean isAvailable() {
        return "REQUESTED".equals(status) || "CONFIRMED".equals(status);
    }
    
    /**
     * 상담 완료 여부 확인
     */
    public boolean isCompleted() {
        return "COMPLETED".equals(status);
    }
    
    /**
     * 상담 취소 여부 확인
     */
    public boolean isCancelled() {
        return "CANCELLED".equals(status);
    }
    
    /**
     * 긴급 상담 여부 확인
     */
    public boolean isEmergency() {
        return isEmergency != null && isEmergency;
    }
    
    // Getter & Setter
    public Long getClientId() {
        return clientId;
    }
    
    public void setClientId(Long clientId) {
        this.clientId = clientId;
    }
    
    public Long getConsultantId() {
        return consultantId;
    }
    
    public void setConsultantId(Long consultantId) {
        this.consultantId = consultantId;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public LocalDate getConsultationDate() {
        return consultationDate;
    }
    
    public void setConsultationDate(LocalDate consultationDate) {
        this.consultationDate = consultationDate;
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
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public Integer getDurationMinutes() {
        return durationMinutes;
    }
    
    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
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
    
    public String getConsultationGoals() {
        return consultationGoals;
    }
    
    public void setConsultationGoals(String consultationGoals) {
        this.consultationGoals = consultationGoals;
    }
    
    public String getConsultationContent() {
        return consultationContent;
    }
    
    public void setConsultationContent(String consultationContent) {
        this.consultationContent = consultationContent;
    }
    
    public String getPriority() {
        return priority;
    }
    
    public void setPriority(String priority) {
        this.priority = priority;
    }
    
    public String getRiskLevel() {
        return riskLevel;
    }
    
    public void setRiskLevel(String riskLevel) {
        this.riskLevel = riskLevel;
    }
    
    public Integer getSessionNumber() {
        return sessionNumber;
    }
    
    public void setSessionNumber(Integer sessionNumber) {
        this.sessionNumber = sessionNumber;
    }
    
    public Boolean getIsFirstSession() {
        return isFirstSession;
    }
    
    public void setIsFirstSession(Boolean isFirstSession) {
        this.isFirstSession = isFirstSession;
    }
    
    public Boolean getIsEmergency() {
        return isEmergency;
    }
    
    public void setIsEmergency(Boolean isEmergency) {
        this.isEmergency = isEmergency;
    }
    
    public LocalDateTime getRequestDate() {
        return requestDate;
    }
    
    public void setRequestDate(LocalDateTime requestDate) {
        this.requestDate = requestDate;
    }
    
    public LocalDateTime getConfirmationDate() {
        return confirmationDate;
    }
    
    public void setConfirmationDate(LocalDateTime confirmationDate) {
        this.confirmationDate = confirmationDate;
    }
    
    public LocalDateTime getCancellationDate() {
        return cancellationDate;
    }
    
    public void setCancellationDate(LocalDateTime cancellationDate) {
        this.cancellationDate = cancellationDate;
    }
    
    public String getCancellationReason() {
        return cancellationReason;
    }
    
    public void setCancellationReason(String cancellationReason) {
        this.cancellationReason = cancellationReason;
    }
    
    public String getSpecialConsiderations() {
        return specialConsiderations;
    }
    
    public void setSpecialConsiderations(String specialConsiderations) {
        this.specialConsiderations = specialConsiderations;
    }
    
    public String getPreparationNotes() {
        return preparationNotes;
    }
    
    public void setPreparationNotes(String preparationNotes) {
        this.preparationNotes = preparationNotes;
    }
    
    public Integer getClientSatisfactionRating() {
        return clientSatisfactionRating;
    }
    
    public void setClientSatisfactionRating(Integer clientSatisfactionRating) {
        this.clientSatisfactionRating = clientSatisfactionRating;
    }
    
    public String getClientFeedback() {
        return clientFeedback;
    }
    
    public void setClientFeedback(String clientFeedback) {
        this.clientFeedback = clientFeedback;
    }
    
    public String getConsultantNotes() {
        return consultantNotes;
    }
    
    public void setConsultantNotes(String consultantNotes) {
        this.consultantNotes = consultantNotes;
    }
    
    public LocalDate getNextConsultationDate() {
        return nextConsultationDate;
    }
    
    public void setNextConsultationDate(LocalDate nextConsultationDate) {
        this.nextConsultationDate = nextConsultationDate;
    }
    
    public String getHomeworkAssigned() {
        return homeworkAssigned;
    }
    
    public void setHomeworkAssigned(String homeworkAssigned) {
        this.homeworkAssigned = homeworkAssigned;
    }
    
    public LocalDate getHomeworkDueDate() {
        return homeworkDueDate;
    }
    
    public void setHomeworkDueDate(LocalDate homeworkDueDate) {
        this.homeworkDueDate = homeworkDueDate;
    }
    
    // toString
    @Override
    public String toString() {
        return "Consultation{" +
                "id=" + getId() +
                ", clientId=" + clientId +
                ", consultantId=" + consultantId +
                ", status='" + status + '\'' +
                ", consultationDate=" + consultationDate +
                ", startTime=" + startTime +
                ", endTime=" + endTime +
                ", durationMinutes=" + durationMinutes +
                ", consultationMethod='" + consultationMethod + '\'' +
                '}';
    }
}

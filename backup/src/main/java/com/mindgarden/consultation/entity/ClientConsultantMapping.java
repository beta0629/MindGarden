package com.mindgarden.consultation.entity;

import java.time.LocalDate;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 내담자-상담사 매핑 엔티티
 * 상담사 1명이 여러 내담자를 담당하는 1:N 관계 관리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Entity
@Table(name = "client_consultant_mappings", indexes = {
    @Index(name = "idx_client_consultant_mappings_client_id", columnList = "client_id"),
    @Index(name = "idx_client_consultant_mappings_consultant_id", columnList = "consultant_id"),
    @Index(name = "idx_client_consultant_mappings_status", columnList = "status"),
    @Index(name = "idx_client_consultant_mappings_start_date", columnList = "start_date"),
    @Index(name = "idx_client_consultant_mappings_is_deleted", columnList = "is_deleted")
})
public class ClientConsultantMapping extends BaseEntity {
    
    @NotNull(message = "내담자 ID는 필수입니다.")
    @Column(name = "client_id", nullable = false)
    private Long clientId;
    
    @NotNull(message = "상담사 ID는 필수입니다.")
    @Column(name = "consultant_id", nullable = false)
    private Long consultantId;
    
    @NotNull(message = "매핑 상태는 필수입니다.")
    @Size(max = 20, message = "매핑 상태는 20자 이하여야 합니다.")
    @Column(name = "status", nullable = false, length = 20)
    private String status = "ACTIVE"; // ACTIVE, INACTIVE, TRANSFERRED, TERMINATED
    
    @NotNull(message = "매핑 시작일은 필수입니다.")
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;
    
    @Column(name = "end_date")
    private LocalDate endDate; // 매핑 종료일
    
    @Column(name = "transfer_date")
    private LocalDate transferDate; // 상담사 변경일
    
    @Size(max = 20, message = "매핑 유형은 20자 이하여야 합니다.")
    @Column(name = "mapping_type", length = 20)
    private String mappingType = "PRIMARY"; // PRIMARY, SECONDARY, SUPERVISORY, EMERGENCY
    
    @Size(max = 500, message = "매핑 사유는 500자 이하여야 합니다.")
    @Column(name = "mapping_reason", length = 500)
    private String mappingReason; // 매핑 사유
    
    @Size(max = 500, message = "매핑 종료 사유는 500자 이하여야 합니다.")
    @Column(name = "termination_reason", length = 500)
    private String terminationReason; // 매핑 종료 사유
    
    @Size(max = 1000, message = "특별 고려사항은 1000자 이하여야 합니다.")
    @Column(name = "special_considerations", columnDefinition = "TEXT")
    private String specialConsiderations; // 특별 고려사항
    
    @Column(name = "is_emergency_mapping")
    private Boolean isEmergencyMapping = false; // 긴급 매핑 여부
    
    @Column(name = "emergency_expiry_date")
    private LocalDate emergencyExpiryDate; // 긴급 매핑 만료일
    
    @Column(name = "supervisor_id")
    private Long supervisorId; // 지도자 ID (시니어 상담사)
    
    @Size(max = 20, message = "지도 필요도는 20자 이하여야 합니다.")
    @Column(name = "supervision_level", length = 20)
    private String supervisionLevel = "NONE"; // NONE, LOW, MEDIUM, HIGH, CRITICAL
    
    @Size(max = 1000, message = "지도 계획은 1000자 이하여야 합니다.")
    @Column(name = "supervision_plan", columnDefinition = "TEXT")
    private String supervisionPlan; // 지도 계획
    
    @Column(name = "last_supervision_date")
    private LocalDate lastSupervisionDate; // 마지막 지도일
    
    @Column(name = "next_supervision_date")
    private LocalDate nextSupervisionDate; // 다음 지도 예정일
    
    @Size(max = 1000, message = "지도 노트는 1000자 이하여야 합니다.")
    @Column(name = "supervision_notes", columnDefinition = "TEXT")
    private String supervisionNotes; // 지도 노트
    
    @Column(name = "total_sessions")
    private Integer totalSessions = 0; // 총 상담 세션 수
    
    @Column(name = "completed_sessions")
    private Integer completedSessions = 0; // 완료된 세션 수
    
    @Column(name = "cancelled_sessions")
    private Integer cancelledSessions = 0; // 취소된 세션 수
    
    @Column(name = "last_session_date")
    private LocalDate lastSessionDate; // 마지막 상담일
    
    @Column(name = "next_session_date")
    private LocalDate nextSessionDate; // 다음 상담 예정일
    
    @Column(name = "progress_score")
    private Integer progressScore = 0; // 진행도 점수 (0-100)
    
    @Size(max = 20, message = "목표 달성도는 20자 이하여야 합니다.")
    @Column(name = "goal_achievement", length = 20)
    private String goalAchievement = "LOW"; // LOW, MEDIUM, HIGH, EXCELLENT
    
    @Size(max = 1000, message = "목표 달성 상세는 1000자 이하여야 합니다.")
    @Column(name = "goal_achievement_details", columnDefinition = "TEXT")
    private String goalAchievementDetails; // 목표 달성 상세
    
    @Column(name = "client_satisfaction_rating")
    private Integer clientSatisfactionRating; // 내담자 만족도 (1-5점)
    
    @Size(max = 500, message = "내담자 피드백은 500자 이하여야 합니다.")
    @Column(name = "client_feedback", length = 500)
    private String clientFeedback; // 내담자 피드백
    
    @Column(name = "consultant_evaluation_score")
    private Integer consultantEvaluationScore; // 상담사 평가 점수 (1-5점)
    
    @Size(max = 1000, message = "상담사 평가 상세는 1000자 이하여야 합니다.")
    @Column(name = "consultant_evaluation_details", columnDefinition = "TEXT")
    private String consultantEvaluationDetails; // 상담사 평가 상세
    
    @Column(name = "evaluation_date")
    private LocalDate evaluationDate; // 평가일
    
    @Column(name = "is_auto_renewal")
    private Boolean isAutoRenewal = true; // 자동 갱신 여부
    
    @Column(name = "renewal_period_months")
    private Integer renewalPeriodMonths = 6; // 갱신 주기 (개월)
    
    @Column(name = "next_renewal_date")
    private LocalDate nextRenewalDate; // 다음 갱신일
    
    // 생성자
    public ClientConsultantMapping() {
        super();
        this.status = "ACTIVE";
        this.mappingType = "PRIMARY";
        this.supervisionLevel = "NONE";
        this.totalSessions = 0;
        this.completedSessions = 0;
        this.cancelledSessions = 0;
        this.progressScore = 0;
        this.goalAchievement = "LOW";
        this.isEmergencyMapping = false;
        this.isAutoRenewal = true;
        this.renewalPeriodMonths = 6;
        this.startDate = LocalDate.now();
    }
    
    // 비즈니스 메서드
    /**
     * 매핑 활성화
     */
    public void activate() {
        this.status = "ACTIVE";
        this.startDate = LocalDate.now();
        this.endDate = null;
    }
    
    /**
     * 매핑 비활성화
     */
    public void deactivate(String reason) {
        this.status = "INACTIVE";
        this.terminationReason = reason;
        this.endDate = LocalDate.now();
    }
    
    /**
     * 상담사 변경
     */
    public void transfer(Long newConsultantId, String reason) {
        this.status = "TRANSFERRED";
        this.transferDate = LocalDate.now();
        this.terminationReason = reason;
        this.endDate = LocalDate.now();
    }
    
    /**
     * 매핑 종료
     */
    public void terminate(String reason) {
        this.status = "TERMINATED";
        this.terminationReason = reason;
        this.endDate = LocalDate.now();
    }
    
    /**
     * 긴급 매핑 설정
     */
    public void setEmergencyMapping(LocalDate expiryDate) {
        this.isEmergencyMapping = true;
        this.emergencyExpiryDate = expiryDate;
        this.mappingType = "EMERGENCY";
    }
    
    /**
     * 긴급 매핑 해제
     */
    public void removeEmergencyMapping() {
        this.isEmergencyMapping = false;
        this.emergencyExpiryDate = null;
        this.mappingType = "PRIMARY";
    }
    
    /**
     * 상담 세션 완료
     */
    public void completeSession() {
        this.completedSessions++;
        this.totalSessions++;
        this.lastSessionDate = LocalDate.now();
        updateProgressScore();
    }
    
    /**
     * 상담 세션 취소
     */
    public void cancelSession() {
        this.cancelledSessions++;
        this.totalSessions++;
    }
    
    /**
     * 진행도 점수 업데이트
     */
    private void updateProgressScore() {
        if (this.totalSessions > 0) {
            this.progressScore = Math.min(100, (this.completedSessions * 100) / this.totalSessions);
        }
    }
    
    /**
     * 목표 달성도 설정
     */
    public void setGoalAchievement(String achievement) {
        if (achievement != null && (achievement.equals("LOW") || achievement.equals("MEDIUM") || 
                                  achievement.equals("HIGH") || achievement.equals("EXCELLENT"))) {
            this.goalAchievement = achievement;
        }
    }
    
    /**
     * 지도 필요도 설정
     */
    public void setSupervisionLevel(String level) {
        if (level != null && (level.equals("NONE") || level.equals("LOW") || 
                            level.equals("MEDIUM") || level.equals("HIGH") || level.equals("CRITICAL"))) {
            this.supervisionLevel = level;
        }
    }
    
    /**
     * 지도 계획 설정
     */
    public void setSupervisionPlan(String plan, LocalDate nextDate) {
        this.supervisionPlan = plan;
        this.nextSupervisionDate = nextDate;
    }
    
    /**
     * 지도 완료
     */
    public void completeSupervision() {
        this.lastSupervisionDate = LocalDate.now();
    }
    
    /**
     * 자동 갱신 설정
     */
    public void setAutoRenewal(Integer periodMonths) {
        if (periodMonths != null && periodMonths > 0) {
            this.isAutoRenewal = true;
            this.renewalPeriodMonths = periodMonths;
            this.nextRenewalDate = LocalDate.now().plusMonths(periodMonths);
        }
    }
    
    /**
     * 자동 갱신 해제
     */
    public void disableAutoRenewal() {
        this.isAutoRenewal = false;
        this.nextRenewalDate = null;
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
    
    public LocalDate getStartDate() {
        return startDate;
    }
    
    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }
    
    public LocalDate getEndDate() {
        return endDate;
    }
    
    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }
    
    public LocalDate getTransferDate() {
        return transferDate;
    }
    
    public void setTransferDate(LocalDate transferDate) {
        this.transferDate = transferDate;
    }
    
    public String getMappingType() {
        return mappingType;
    }
    
    public void setMappingType(String mappingType) {
        this.mappingType = mappingType;
    }
    
    public String getMappingReason() {
        return mappingReason;
    }
    
    public void setMappingReason(String mappingReason) {
        this.mappingReason = mappingReason;
    }
    
    public String getTerminationReason() {
        return terminationReason;
    }
    
    public void setTerminationReason(String terminationReason) {
        this.terminationReason = terminationReason;
    }
    
    public String getSpecialConsiderations() {
        return specialConsiderations;
    }
    
    public void setSpecialConsiderations(String specialConsiderations) {
        this.specialConsiderations = specialConsiderations;
    }
    
    public Boolean getIsEmergencyMapping() {
        return isEmergencyMapping;
    }
    
    public void setIsEmergencyMapping(Boolean isEmergencyMapping) {
        this.isEmergencyMapping = isEmergencyMapping;
    }
    
    public LocalDate getEmergencyExpiryDate() {
        return emergencyExpiryDate;
    }
    
    public void setEmergencyExpiryDate(LocalDate emergencyExpiryDate) {
        this.emergencyExpiryDate = emergencyExpiryDate;
    }
    
    public Long getSupervisorId() {
        return supervisorId;
    }
    
    public void setSupervisorId(Long supervisorId) {
        this.supervisorId = supervisorId;
    }
    
    public String getSupervisionLevel() {
        return supervisionLevel;
    }
    
    public String getSupervisionPlan() {
        return supervisionPlan;
    }
    
    public void setSupervisionPlan(String supervisionPlan) {
        this.supervisionPlan = supervisionPlan;
    }
    
    public LocalDate getLastSupervisionDate() {
        return lastSupervisionDate;
    }
    
    public void setLastSupervisionDate(LocalDate lastSupervisionDate) {
        this.lastSupervisionDate = lastSupervisionDate;
    }
    
    public LocalDate getNextSupervisionDate() {
        return nextSupervisionDate;
    }
    
    public void setNextSupervisionDate(LocalDate nextSupervisionDate) {
        this.nextSupervisionDate = nextSupervisionDate;
    }
    
    public String getSupervisionNotes() {
        return supervisionNotes;
    }
    
    public void setSupervisionNotes(String supervisionNotes) {
        this.supervisionNotes = supervisionNotes;
    }
    
    public Integer getTotalSessions() {
        return totalSessions;
    }
    
    public Integer getCompletedSessions() {
        return completedSessions;
    }
    
    public Integer getCancelledSessions() {
        return cancelledSessions;
    }
    
    public LocalDate getLastSessionDate() {
        return lastSessionDate;
    }
    
    public void setLastSessionDate(LocalDate lastSessionDate) {
        this.lastSessionDate = lastSessionDate;
    }
    
    public LocalDate getNextSessionDate() {
        return nextSessionDate;
    }
    
    public void setNextSessionDate(LocalDate nextSessionDate) {
        this.nextSessionDate = nextSessionDate;
    }
    
    public Integer getProgressScore() {
        return progressScore;
    }
    
    public void setProgressScore(Integer progressScore) {
        this.progressScore = progressScore;
    }
    
    public String getGoalAchievement() {
        return goalAchievement;
    }
    
    public String getGoalAchievementDetails() {
        return goalAchievementDetails;
    }
    
    public void setGoalAchievementDetails(String goalAchievementDetails) {
        this.goalAchievementDetails = goalAchievementDetails;
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
    
    public Integer getConsultantEvaluationScore() {
        return consultantEvaluationScore;
    }
    
    public void setConsultantEvaluationScore(Integer consultantEvaluationScore) {
        this.consultantEvaluationScore = consultantEvaluationScore;
    }
    
    public String getConsultantEvaluationDetails() {
        return consultantEvaluationDetails;
    }
    
    public void setConsultantEvaluationDetails(String consultantEvaluationDetails) {
        this.consultantEvaluationDetails = consultantEvaluationDetails;
    }
    
    public LocalDate getEvaluationDate() {
        return evaluationDate;
    }
    
    public void setEvaluationDate(LocalDate evaluationDate) {
        this.evaluationDate = evaluationDate;
    }
    
    public Boolean getIsAutoRenewal() {
        return isAutoRenewal;
    }
    
    public void setIsAutoRenewal(Boolean isAutoRenewal) {
        this.isAutoRenewal = isAutoRenewal;
    }
    
    public Integer getRenewalPeriodMonths() {
        return renewalPeriodMonths;
    }
    
    public void setRenewalPeriodMonths(Integer renewalPeriodMonths) {
        this.renewalPeriodMonths = renewalPeriodMonths;
    }
    
    public LocalDate getNextRenewalDate() {
        return nextRenewalDate;
    }
    
    public void setNextRenewalDate(LocalDate nextRenewalDate) {
        this.nextRenewalDate = nextRenewalDate;
    }
    
    // toString
    @Override
    public String toString() {
        return "ClientConsultantMapping{" +
                "id=" + getId() +
                ", clientId=" + clientId +
                ", consultantId=" + consultantId +
                ", status='" + status + '\'' +
                ", mappingType='" + mappingType + '\'' +
                ", startDate=" + startDate +
                ", endDate=" + endDate +
                ", totalSessions=" + totalSessions +
                ", progressScore=" + progressScore +
                '}';
    }
}

package com.coresolution.consultation.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 상담일지 엔티티
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Entity
@Table(name = "consultation_records", indexes = {
    @Index(name = "idx_consultation_records_consultation_id", columnList = "consultation_id"),
    @Index(name = "idx_consultation_records_client_id", columnList = "client_id"),
    @Index(name = "idx_consultation_records_consultant_id", columnList = "consultant_id"),
    @Index(name = "idx_consultation_records_session_date", columnList = "session_date"),
    @Index(name = "idx_consultation_records_is_deleted", columnList = "is_deleted")
})
public class ConsultationRecord extends BaseEntity {
    
    @NotNull(message = "상담 ID는 필수입니다.")
    @Column(name = "consultation_id", nullable = false)
    private Long consultationId;
    
    @NotNull(message = "내담자 ID는 필수입니다.")
    @Column(name = "client_id", nullable = false)
    private Long clientId;
    
    @NotNull(message = "상담사 ID는 필수입니다.")
    @Column(name = "consultant_id", nullable = false)
    private Long consultantId;
    
    @NotNull(message = "세션 일자는 필수입니다.")
    @Column(name = "session_date", nullable = false)
    private LocalDate sessionDate;
    
    @Column(name = "session_number")
    private Integer sessionNumber; // 상담 세션 번호
    
    @Size(max = 1000, message = "내담자 상태는 1000자 이하여야 합니다.")
    @Column(name = "client_condition", columnDefinition = "TEXT")
    private String clientCondition; // 내담자 현재 상태
    
    @Size(max = 1000, message = "주요 이슈는 1000자 이하여야 합니다.")
    @Column(name = "main_issues", columnDefinition = "TEXT")
    private String mainIssues; // 주요 상담 이슈
    
    @Size(max = 1000, message = "개입 방법은 1000자 이하여야 합니다.")
    @Column(name = "intervention_methods", columnDefinition = "TEXT")
    private String interventionMethods; // 상담 개입 방법
    
    @Size(max = 1000, message = "내담자 반응은 1000자 이하여야 합니다.")
    @Column(name = "client_response", columnDefinition = "TEXT")
    private String clientResponse; // 내담자 반응 및 변화
    
    @Size(max = 1000, message = "다음 세션 계획은 1000자 이하여야 합니다.")
    @Column(name = "next_session_plan", columnDefinition = "TEXT")
    private String nextSessionPlan; // 다음 세션 계획
    
    @Size(max = 1000, message = "과제 부여는 1000자 이하여야 합니다.")
    @Column(name = "homework_assigned", columnDefinition = "TEXT")
    private String homeworkAssigned; // 과제 부여
    
    @Column(name = "homework_due_date")
    private LocalDate homeworkDueDate; // 과제 제출 기한
    
    @Size(max = 20, message = "위험도는 20자 이하여야 합니다.")
    @Column(name = "risk_assessment", length = 20)
    private String riskAssessment; // 위험도 평가 (LOW, MEDIUM, HIGH, CRITICAL)
    
    @Size(max = 1000, message = "위험 요소는 1000자 이하여야 합니다.")
    @Column(name = "risk_factors", columnDefinition = "TEXT")
    private String riskFactors; // 위험 요소 상세
    
    @Size(max = 1000, message = "긴급 대응 계획은 1000자 이하여야 합니다.")
    @Column(name = "emergency_response_plan", columnDefinition = "TEXT")
    private String emergencyResponsePlan; // 긴급 대응 계획
    
    @Size(max = 1000, message = "진행도 평가는 1000자 이하여야 합니다.")
    @Column(name = "progress_evaluation", columnDefinition = "TEXT")
    private String progressEvaluation; // 진행도 평가
    
    @Column(name = "progress_score")
    private Integer progressScore; // 진행도 점수 (0-100)
    
    @Size(max = 20, message = "목표 달성도는 20자 이하여야 합니다.")
    @Column(name = "goal_achievement", length = 20)
    private String goalAchievement; // 목표 달성도 (LOW, MEDIUM, HIGH, EXCELLENT)
    
    @Size(max = 1000, message = "목표 달성 상세는 1000자 이하여야 합니다.")
    @Column(name = "goal_achievement_details", columnDefinition = "TEXT")
    private String goalAchievementDetails; // 목표 달성 상세
    
    @Size(max = 1000, message = "상담사 관찰사항은 1000자 이하여야 합니다.")
    @Column(name = "consultant_observations", columnDefinition = "TEXT")
    private String consultantObservations; // 상담사 관찰사항
    
    @Size(max = 1000, message = "상담사 평가는 1000자 이하여야 합니다.")
    @Column(name = "consultant_assessment", columnDefinition = "TEXT")
    private String consultantAssessment; // 상담사 평가
    
    @Size(max = 1000, message = "특별 고려사항은 1000자 이하여야 합니다.")
    @Column(name = "special_considerations", columnDefinition = "TEXT")
    private String specialConsiderations; // 특별 고려사항
    
    @Size(max = 1000, message = "의료 정보는 1000자 이하여야 합니다.")
    @Column(name = "medical_information", columnDefinition = "TEXT")
    private String medicalInformation; // 의료 정보
    
    @Size(max = 1000, message = "약물 정보는 1000자 이하여야 합니다.")
    @Column(name = "medication_info", columnDefinition = "TEXT")
    private String medicationInfo; // 약물 정보
    
    @Size(max = 1000, message = "가족 관계는 1000자 이하여야 합니다.")
    @Column(name = "family_relationships", columnDefinition = "TEXT")
    private String familyRelationships; // 가족 관계
    
    @Size(max = 1000, message = "사회적 지원은 1000자 이하여야 합니다.")
    @Column(name = "social_support", columnDefinition = "TEXT")
    private String socialSupport; // 사회적 지원
    
    @Size(max = 1000, message = "환경적 요인은 1000자 이하여야 합니다.")
    @Column(name = "environmental_factors", columnDefinition = "TEXT")
    private String environmentalFactors; // 환경적 요인
    
    @Column(name = "session_duration_minutes")
    private Integer sessionDurationMinutes; // 세션 시간 (분)
    
    @Column(name = "is_session_completed")
    private Boolean isSessionCompleted = false; // 세션 완료 여부
    
    @Column(name = "completion_time")
    private LocalDateTime completionTime; // 세션 완료 시간
    
    @Size(max = 500, message = "미완료 사유는 500자 이하여야 합니다.")
    @Column(name = "incompletion_reason", length = 500)
    private String incompletionReason; // 미완료 사유
    
    @Column(name = "next_session_date")
    private LocalDate nextSessionDate; // 다음 세션 예정일
    
    @Size(max = 1000, message = "후속 조치사항은 1000자 이하여야 합니다.")
    @Column(name = "follow_up_actions", columnDefinition = "TEXT")
    private String followUpActions; // 후속 조치사항
    
    @Column(name = "follow_up_due_date")
    private LocalDate followUpDueDate; // 후속 조치 기한
    
    // 생성자
    public ConsultationRecord() {
        super();
        this.isSessionCompleted = false;
        this.sessionDate = LocalDate.now();
    }
    
    // 비즈니스 메서드
    /**
     * 세션 완료 처리
     */
    public void completeSession() {
        this.isSessionCompleted = true;
        this.completionTime = LocalDateTime.now();
    }
    
    /**
     * 진행도 점수 설정 (비즈니스 로직 포함)
     */
    public void setProgressScore(Integer score) {
        if (score != null && score >= 0 && score <= 100) {
            this.progressScore = score;
        }
    }
    
    /**
     * 위험도 평가 설정 (비즈니스 로직 포함)
     */
    public void setRiskAssessment(String riskLevel) {
        if (riskLevel != null && (riskLevel.equals("LOW") || riskLevel.equals("MEDIUM") || 
                                 riskLevel.equals("HIGH") || riskLevel.equals("CRITICAL"))) {
            this.riskAssessment = riskLevel;
        }
    }
    
    /**
     * 목표 달성도 설정 (비즈니스 로직 포함)
     */
    public void setGoalAchievement(String achievement) {
        if (achievement != null && (achievement.equals("LOW") || achievement.equals("MEDIUM") || 
                                  achievement.equals("HIGH") || achievement.equals("EXCELLENT"))) {
            this.goalAchievement = achievement;
        }
    }
    
    /**
     * 과제 부여
     */
    public void assignHomework(String homework, LocalDate dueDate) {
        this.homeworkAssigned = homework;
        this.homeworkDueDate = dueDate;
    }
    
    /**
     * 다음 세션 계획 설정
     */
    public void setNextSessionPlan(String plan, LocalDate nextDate) {
        this.nextSessionPlan = plan;
        this.nextSessionDate = nextDate;
    }
    
    /**
     * 세션 시간 설정
     */
    public void setSessionDuration(Integer duration) {
        if (duration != null && duration > 0) {
            this.sessionDurationMinutes = duration;
        }
    }
    
    // Getter & Setter
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
    
    public Long getConsultantId() {
        return consultantId;
    }
    
    public void setConsultantId(Long consultantId) {
        this.consultantId = consultantId;
    }
    
    public LocalDate getSessionDate() {
        return sessionDate;
    }
    
    public void setSessionDate(LocalDate sessionDate) {
        this.sessionDate = sessionDate;
    }
    
    public Integer getSessionNumber() {
        return sessionNumber;
    }
    
    public void setSessionNumber(Integer sessionNumber) {
        this.sessionNumber = sessionNumber;
    }
    
    public String getClientCondition() {
        return clientCondition;
    }
    
    public void setClientCondition(String clientCondition) {
        this.clientCondition = clientCondition;
    }
    
    public String getMainIssues() {
        return mainIssues;
    }
    
    public void setMainIssues(String mainIssues) {
        this.mainIssues = mainIssues;
    }
    
    public String getInterventionMethods() {
        return interventionMethods;
    }
    
    public void setInterventionMethods(String interventionMethods) {
        this.interventionMethods = interventionMethods;
    }
    
    public String getClientResponse() {
        return clientResponse;
    }
    
    public void setClientResponse(String clientResponse) {
        this.clientResponse = clientResponse;
    }
    
    public String getNextSessionPlan() {
        return nextSessionPlan;
    }
    
    public void setNextSessionPlan(String nextSessionPlan) {
        this.nextSessionPlan = nextSessionPlan;
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
    
    public String getRiskAssessment() {
        return riskAssessment;
    }
    
    public String getRiskFactors() {
        return riskFactors;
    }
    
    public void setRiskFactors(String riskFactors) {
        this.riskFactors = riskFactors;
    }
    
    public String getEmergencyResponsePlan() {
        return emergencyResponsePlan;
    }
    
    public void setEmergencyResponsePlan(String emergencyResponsePlan) {
        this.emergencyResponsePlan = emergencyResponsePlan;
    }
    
    public String getProgressEvaluation() {
        return progressEvaluation;
    }
    
    public void setProgressEvaluation(String progressEvaluation) {
        this.progressEvaluation = progressEvaluation;
    }
    
    public Integer getProgressScore() {
        return progressScore;
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
    
    public String getConsultantObservations() {
        return consultantObservations;
    }
    
    public void setConsultantObservations(String consultantObservations) {
        this.consultantObservations = consultantObservations;
    }
    
    public String getConsultantAssessment() {
        return consultantAssessment;
    }
    
    public void setConsultantAssessment(String consultantAssessment) {
        this.consultantAssessment = consultantAssessment;
    }
    
    public String getSpecialConsiderations() {
        return specialConsiderations;
    }
    
    public void setSpecialConsiderations(String specialConsiderations) {
        this.specialConsiderations = specialConsiderations;
    }
    
    public String getMedicalInformation() {
        return medicalInformation;
    }
    
    public void setMedicalInformation(String medicalInformation) {
        this.medicalInformation = medicalInformation;
    }
    
    public String getMedicationInfo() {
        return medicationInfo;
    }
    
    public void setMedicationInfo(String medicationInfo) {
        this.medicationInfo = medicationInfo;
    }
    
    public String getFamilyRelationships() {
        return familyRelationships;
    }
    
    public void setFamilyRelationships(String familyRelationships) {
        this.familyRelationships = familyRelationships;
    }
    
    public String getSocialSupport() {
        return socialSupport;
    }
    
    public void setSocialSupport(String socialSupport) {
        this.socialSupport = socialSupport;
    }
    
    public String getEnvironmentalFactors() {
        return environmentalFactors;
    }
    
    public void setEnvironmentalFactors(String environmentalFactors) {
        this.environmentalFactors = environmentalFactors;
    }
    
    public Integer getSessionDurationMinutes() {
        return sessionDurationMinutes;
    }
    
    public void setSessionDurationMinutes(Integer sessionDurationMinutes) {
        this.sessionDurationMinutes = sessionDurationMinutes;
    }
    
    public Boolean getIsSessionCompleted() {
        return isSessionCompleted;
    }
    
    public void setIsSessionCompleted(Boolean isSessionCompleted) {
        this.isSessionCompleted = isSessionCompleted;
    }
    
    public LocalDateTime getCompletionTime() {
        return completionTime;
    }
    
    public void setCompletionTime(LocalDateTime completionTime) {
        this.completionTime = completionTime;
    }
    
    public String getIncompletionReason() {
        return incompletionReason;
    }
    
    public void setIncompletionReason(String incompletionReason) {
        this.incompletionReason = incompletionReason;
    }
    
    public LocalDate getNextSessionDate() {
        return nextSessionDate;
    }
    
    public void setNextSessionDate(LocalDate nextSessionDate) {
        this.nextSessionDate = nextSessionDate;
    }
    
    public String getFollowUpActions() {
        return followUpActions;
    }
    
    public void setFollowUpActions(String followUpActions) {
        this.followUpActions = followUpActions;
    }
    
    public LocalDate getFollowUpDueDate() {
        return followUpDueDate;
    }
    
    public void setFollowUpDueDate(LocalDate followUpDueDate) {
        this.followUpDueDate = followUpDueDate;
    }
    
    // toString
    @Override
    public String toString() {
        return "ConsultationRecord{" +
                "id=" + getId() +
                ", consultationId=" + consultationId +
                ", clientId=" + clientId +
                ", consultantId=" + consultantId +
                ", sessionDate=" + sessionDate +
                ", sessionNumber=" + sessionNumber +
                ", isSessionCompleted=" + isSessionCompleted +
                ", progressScore=" + progressScore +
                ", riskAssessment='" + riskAssessment + '\'' +
                '}';
    }
}

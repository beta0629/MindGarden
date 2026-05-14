package com.coresolution.consultation.entity;

import java.util.List;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import com.coresolution.consultation.constant.SelfAssessmentType;
import com.coresolution.consultation.dto.selfassessment.SelfAssessmentInterpretationJson;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

/**
 * 자가검사 제출 엔티티.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Entity
@Table(
    name = "self_assessment_submissions",
    indexes = {
        @Index(name = "idx_sas_tenant_client_created", columnList = "tenant_id,client_id,created_at")
    }
)
@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@NoArgsConstructor
public class SelfAssessmentSubmission extends BaseEntity {

    @Column(name = "client_id", nullable = false)
    private Long clientId;

    @Enumerated(EnumType.STRING)
    @Column(name = "assessment_type", nullable = false, length = 16)
    private SelfAssessmentType assessmentType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "answers_json", nullable = false, columnDefinition = "json")
    private List<Integer> answers;

    @Column(name = "total_score", nullable = false)
    private int totalScore;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "interpretation_json", nullable = false, columnDefinition = "json")
    private SelfAssessmentInterpretationJson interpretation;

    @Column(name = "shared_with_consultant", nullable = false)
    private boolean sharedWithConsultant;
}

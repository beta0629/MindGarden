package com.coresolution.consultation.entity;

import com.fasterxml.jackson.databind.JsonNode;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import com.coresolution.consultation.constant.SelfAssessmentType;
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
 * 자가검사 템플릿(관리자 CRUD 예정 — Flyway 선반영).
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Entity
@Table(
    name = "self_assessment_templates",
    indexes = {
        @Index(name = "idx_sat_tenant_active", columnList = "tenant_id,is_active")
    }
)
@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@NoArgsConstructor
public class SelfAssessmentTemplate extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "assessment_type", nullable = false, length = 16)
    private SelfAssessmentType assessmentType;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "template_version", nullable = false)
    private int templateVersion;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "meta_json", columnDefinition = "json")
    private JsonNode metaJson;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    /**
     * Apple 1.4.1 — 자가검사 표준 척도 원저작 인용(표시용).
     */
    @Column(name = "source_label", length = 200)
    private String sourceLabel;

    @Column(name = "source_url", length = 500)
    private String sourceUrl;

    @Column(name = "source_author", length = 200)
    private String sourceAuthor;

    @Column(name = "source_published_year")
    private Integer sourcePublishedYear;
}

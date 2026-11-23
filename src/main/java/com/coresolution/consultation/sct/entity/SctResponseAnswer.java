package com.coresolution.consultation.sct.entity;

import java.time.LocalDateTime;
import com.coresolution.consultation.converter.ConsultationBodyAttributeConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * SCT 문항별 응답(임시·제출 공용). 본문은 ConsultationBodyAttributeConverter.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
@Entity
@Table(name = "sct_response_answers", uniqueConstraints = {
    @UniqueConstraint(name = "uk_sct_answer", columnNames = {"invitation_id", "form_item_id"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SctResponseAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 36)
    private String tenantId;

    @Column(name = "invitation_id", nullable = false)
    private Long invitationId;

    @Column(name = "form_item_id", nullable = false)
    private Long formItemId;

    @Convert(converter = ConsultationBodyAttributeConverter.class)
    @Column(name = "answer_text_enc", columnDefinition = "TEXT")
    private String answerText;

    @Column(name = "not_applicable", nullable = false)
    @Builder.Default
    private Boolean notApplicable = false;

    @Column(name = "is_blank", nullable = false)
    @Builder.Default
    private Boolean isBlank = false;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = LocalDateTime.now();
        if (notApplicable == null) {
            notApplicable = false;
        }
        if (isBlank == null) {
            isBlank = false;
        }
    }
}

package com.coresolution.consultation.sct.entity;

import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * SCT 문항.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
@Entity
@Table(name = "sct_form_items", uniqueConstraints = {
    @UniqueConstraint(name = "uk_sct_form_item", columnNames = {"form_template_id", "item_no"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SctFormItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "form_template_id", nullable = false)
    private Long formTemplateId;

    @Column(name = "item_no", nullable = false)
    private Integer itemNo;

    @Column(name = "prompt_text", nullable = false, length = 1000)
    private String promptText;

    @Column(name = "domain_code", nullable = false, length = 64)
    private String domainCode;

    @Column(name = "domain_label", nullable = false, length = 100)
    private String domainLabel;

    @Column(name = "valence", length = 16)
    private String valence;

    @Column(name = "tense", length = 16)
    private String tense;

    @Column(name = "allows_not_applicable", nullable = false)
    @Builder.Default
    private Boolean allowsNotApplicable = false;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (allowsNotApplicable == null) {
            allowsNotApplicable = false;
        }
    }
}

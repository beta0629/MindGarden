package com.coresolution.consultation.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/**
 * 상담일지 서버 초안(자동저장) 엔티티. 확정 {@link ConsultationRecord} 와 테이블 분리.
 *
 * @author CoreSolution
 * @since 2026-04-22
 */
@Entity
@Table(name = "consultation_record_drafts", indexes = {
    @Index(name = "idx_crd_tenant_consult_sched", columnList = "tenant_id, consultation_id, consultant_id"),
    @Index(name = "idx_crd_tenant_deleted", columnList = "tenant_id, is_deleted")
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
public class ConsultationRecordDraft extends BaseEntity {

    @NotNull
    @Column(name = "consultation_id", nullable = false)
    private Long consultationId;

    @NotNull
    @Column(name = "consultant_id", nullable = false)
    private Long consultantId;

    @NotNull
    @Lob
    @Column(name = "payload_json", nullable = false, columnDefinition = "LONGTEXT")
    private String payloadJson;
}

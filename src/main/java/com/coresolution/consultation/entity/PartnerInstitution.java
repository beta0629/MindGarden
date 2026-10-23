package com.coresolution.consultation.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/**
 * 연계 기관 마스터. 월말 상담내역 문서 수신처.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@Entity
@Table(name = "partner_institutions", indexes = {
    @Index(name = "idx_pi_tenant_deleted", columnList = "tenant_id, is_deleted"),
    @Index(name = "idx_pi_tenant_name", columnList = "tenant_id, name")
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
public class PartnerInstitution extends BaseEntity {

    @NotNull
    @Size(max = 200)
    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @NotNull
    @Size(max = 100)
    @Column(name = "contact_name", nullable = false, length = 100)
    private String contactName;

    @Size(max = 50)
    @Column(name = "contact_phone", length = 50)
    private String contactPhone;

    @NotNull
    @Size(max = 255)
    @Column(name = "document_email", nullable = false, length = 255)
    private String documentEmail;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}

package com.coresolution.consultation.sct.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * SCT 관리번호 테넌트 시퀀스.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
@Entity
@Table(name = "sct_management_no_seq")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SctManagementNoSeq {

    @Id
    @Column(name = "tenant_id", nullable = false, length = 36)
    private String tenantId;

    @Column(name = "next_val", nullable = false)
    private Long nextVal;
}

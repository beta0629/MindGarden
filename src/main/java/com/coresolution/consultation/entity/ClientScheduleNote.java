package com.coresolution.consultation.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 통합 스케줄 맥락의 내담자 특이사항(지속 메모). 입금 확인용 adminNote와 별도.
 *
 * @author CoreSolution
 * @since 2026-04-29
 */
@Entity
@Table(name = "client_schedule_notes", indexes = {
    @Index(name = "idx_csn_tenant_client_deleted", columnList = "tenant_id,client_id,is_deleted"),
    @Index(name = "idx_csn_tenant_schedule_deleted", columnList = "tenant_id,schedule_id,is_deleted"),
    @Index(name = "idx_csn_tenant_mapping_deleted", columnList = "tenant_id,mapping_id,is_deleted")
})
@Data
public class ClientScheduleNote extends BaseEntity {

    @Column(name = "client_id")
    private Long clientId;

    @Column(name = "mapping_id")
    private Long mappingId;

    @Column(name = "schedule_id")
    private Long scheduleId;

    @Size(max = 120)
    @Column(name = "occurrence_key", length = 120)
    private String occurrenceKey;

    @NotNull
    @Size(max = 64)
    @Column(name = "note_type", nullable = false, length = 64)
    private String noteType;

    @NotNull
    @Size(max = 300)
    @Column(name = "title", nullable = false, length = 300)
    private String title;

    @Column(name = "body", columnDefinition = "TEXT")
    private String body;

    @Column(name = "promise_date")
    private LocalDate promiseDate;

    /** 해소(처리 완료) 시각. null이면 미해소 — 목록 상단 누적 표시. */
    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "amount", precision = 19, scale = 4)
    private BigDecimal amount;

    @Size(max = 10)
    @Column(name = "currency", length = 10)
    private String currency;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "updated_by")
    private Long updatedBy;

    public ClientScheduleNote() {
        super();
    }
}

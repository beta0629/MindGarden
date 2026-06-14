package com.coresolution.consultation.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

/**
 * PII KEY/IV 회전 chunk 진행률 SSOT 엔티티.
 *
 * <p>{@code pii_reencryption_progress} 테이블 (Flyway V20260615_001) 과 1:1 매핑된다.
 * Phase 1 (회전 인프라) 에서는 {@link com.coresolution.consultation.service.PersonalDataKeyRotationService}
 * 가 chunk 단위로 본 엔티티에 진행률을 기록하고, Phase 2 (배치 실행) 에서는 외부 트리거(admin
 * endpoint / 워크플로) 가 본 엔티티의 status / rows_done 를 SSOT 로 참조한다.</p>
 *
 * <p>본 엔티티는 평문 / 암호문 PII 를 절대 보관하지 않는다. chunk 메타 + 키 ID 스냅샷 +
 * sanitize 된 에러 요약만 기록한다. {@code BaseEntity} 의 audit / 테넌트 컬럼은 의도적으로
 * 상속하지 않는다 — 본 테이블은 운영 SSOT 한 행으로 동작하며 멀티테넌트 격리 대상이 아니다.</p>
 *
 * @author CoreSolution
 * @since 2026-06-15
 */
@Entity
@Table(
    name = "pii_reencryption_progress",
    uniqueConstraints = {
        @UniqueConstraint(name = "uniq_table_chunk_target", columnNames = {"table_name", "chunk_no", "target_key_id"})
    },
    indexes = {
        @Index(name = "idx_pii_progress_status", columnList = "status, table_name"),
        @Index(name = "idx_pii_progress_target_key", columnList = "target_key_id, table_name")
    }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class PiiReencryptionProgress {

    /** chunk 진행률 상태 enum — DB 컬럼은 VARCHAR 로 매핑한다. */
    public enum Status {
        PENDING,
        IN_PROGRESS,
        DONE,
        FAILED,
        SKIPPED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @Column(name = "table_name", nullable = false, length = 64)
    private String tableName;

    @Column(name = "chunk_no", nullable = false)
    private Integer chunkNo;

    @Column(name = "chunk_start_id")
    private Long chunkStartId;

    @Column(name = "chunk_end_id")
    private Long chunkEndId;

    /**
     * VARCHAR(16) 매핑 — Status enum value 를 문자열로 저장.
     *
     * <p>{@link jakarta.persistence.EnumType#STRING} 대신 직접 문자열을 다루는 이유는
     * Flyway 진행률 조회 SQL 이 enum 변환 없이 바로 비교·집계할 수 있도록 하기 위함이다.</p>
     */
    @Column(name = "status", nullable = false, length = 16)
    private String status;

    @Column(name = "rows_total")
    private Integer rowsTotal;

    @Column(name = "rows_done")
    private Integer rowsDone;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @Column(name = "active_key_id", nullable = false, length = 16)
    private String activeKeyId;

    @Column(name = "target_key_id", nullable = false, length = 16)
    private String targetKeyId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /** Status enum 헬퍼 — null 안전 변환. */
    public Status statusEnum() {
        return status == null ? null : Status.valueOf(status);
    }

    public void setStatusEnum(Status next) {
        this.status = next == null ? null : next.name();
    }
}

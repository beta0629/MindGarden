package com.coresolution.consultation.entity;

import java.time.LocalDate;
import java.util.List;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

/**
 * 감정 일기 엔티티.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Entity
@Table(
    name = "mood_journal_entries",
    indexes = {
        @Index(name = "idx_mje_tenant_client_month", columnList = "tenant_id,client_id,journal_date")
    }
)
@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@NoArgsConstructor
public class MoodJournalEntry extends BaseEntity {

    @Column(name = "client_id", nullable = false)
    private Long clientId;

    @Column(name = "journal_date", nullable = false)
    private LocalDate journalDate;

    @Column(name = "mood_value", nullable = false)
    private int moodValue;

    @Column(name = "emoji", length = 16)
    private String emoji;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "tags_json", nullable = false, columnDefinition = "json")
    private List<String> tags;

    @Column(name = "memo", nullable = false, columnDefinition = "TEXT")
    private String memo;

    @Column(name = "shared_with_consultant", nullable = false)
    private boolean sharedWithConsultant;
}

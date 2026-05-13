package com.coresolution.consultation.entity;

import java.util.List;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import com.coresolution.consultation.dto.mindweather.MindWeatherKeywordPayload;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

/**
 * 마음 날씨 분석 카드 엔티티.
 *
 * @author MindGarden
 * @since 2026-05-13
 */
@Entity
@Table(name = "mind_weather_cards", indexes = {
    @Index(name = "idx_mwc_tenant_client_created", columnList = "tenant_id,client_id,created_at"),
    @Index(name = "idx_mwc_inbox", columnList = "tenant_id,share_summary,share_consultant_id,created_at")
})
@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@NoArgsConstructor
public class MindWeatherCard extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "client_id", nullable = false)
    private User client;

    @Column(name = "source", nullable = false, length = 32)
    private String source;

    @Column(name = "source_ref_id", length = 128)
    private String sourceRefId;

    @Column(name = "body_text", nullable = false, columnDefinition = "TEXT")
    private String bodyText;

    @Column(name = "summary", nullable = false, length = 2000)
    private String summary;

    @Column(name = "tone", nullable = false, length = 16)
    private String tone;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "keywords_json", nullable = false, columnDefinition = "json")
    private List<MindWeatherKeywordPayload> keywords;

    @Column(name = "share_summary", nullable = false)
    private boolean shareSummary;

    @Column(name = "share_original", nullable = false)
    private boolean shareOriginal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "share_consultant_id")
    private User shareConsultant;

    @Column(name = "consent_updated_at")
    private java.time.LocalDateTime consentUpdatedAt;
}

package com.coresolution.consultation.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

/**
 * 힐링 카탈로그(명상·글·오디오·영상) 테넌트 마스터.
 *
 * @author MindGarden
 * @since 2026-05-15
 */
@Entity
@Table(
    name = "healing_content_catalog_items",
    uniqueConstraints = @UniqueConstraint(name = "uk_hcci_tenant_code", columnNames = {"tenant_id", "code"}),
    indexes = {
        @Index(name = "idx_hcci_tenant_pub_sort", columnList = "tenant_id,is_published,sort_order,id")
    }
)
@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@NoArgsConstructor
public class HealingContentCatalogItem extends BaseEntity {

    @Column(name = "code", nullable = false, length = 64)
    private String code;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "description", length = 600)
    private String description;

    @Column(name = "category", nullable = false, length = 64)
    private String category;

    @Column(name = "media_type", nullable = false, length = 32)
    private String mediaType;

    @Column(name = "thumbnail_url", length = 512)
    private String thumbnailUrl;

    @Column(name = "content_url", length = 512)
    private String contentUrl;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "is_published", nullable = false)
    private boolean published;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    /**
     * Apple 1.4.1 — 의료/건강 콘텐츠 출처 라벨(표시용).
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

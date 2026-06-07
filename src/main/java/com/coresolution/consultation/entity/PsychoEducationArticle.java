package com.coresolution.consultation.entity;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * 심리교육 카드뉴스(테넌트 마스터).
 *
 * @author MindGarden
 * @since 2026-05-15
 */
@Entity
@Table(
    name = "psycho_education_articles",
    uniqueConstraints = @UniqueConstraint(name = "uk_pea_tenant_slug", columnNames = {"tenant_id", "slug"}),
    indexes = {
        @Index(name = "idx_pea_tenant_pub_sort", columnList = "tenant_id,is_published,sort_order,id")
    }
)
@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@NoArgsConstructor
public class PsychoEducationArticle extends BaseEntity {

    @Column(name = "slug", nullable = false, length = 128)
    private String slug;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "summary", nullable = false, length = 600)
    private String summary;

    @Column(name = "body", nullable = false, columnDefinition = "mediumtext")
    private String body;

    @Column(name = "category", nullable = false, length = 32)
    private String category;

    @Column(name = "category_label", nullable = false, length = 64)
    private String categoryLabel;

    @Column(name = "read_minutes", nullable = false)
    private int readMinutes;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "pages_json", nullable = false, columnDefinition = "json")
    private JsonNode pagesJson;

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

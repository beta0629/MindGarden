package com.mindgarden.consultation.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * CSS 테마 메타데이터 엔티티
 * 테마의 기본 정보를 관리하는 엔티티
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Entity
@Table(name = "css_theme_metadata")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = false)
public class CssThemeMetadata extends BaseEntity {

    @Id
    @Column(name = "theme_name", nullable = false, length = 50)
    private String themeName; // 테마명 (예: default, corporate, warm, cool)

    @Column(name = "display_name", nullable = false, length = 100)
    private String displayName; // 테마 표시명 (예: 기본 테마, 기업 테마)

    @Column(name = "description", length = 500)
    private String description; // 테마 설명

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true; // 활성 여부

    @Column(name = "is_default", nullable = false)
    @Builder.Default
    private Boolean isDefault = false; // 기본 테마 여부

    @Column(name = "display_order")
    private Integer displayOrder; // 표시 순서
}

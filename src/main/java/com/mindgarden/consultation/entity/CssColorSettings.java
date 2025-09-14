package com.mindgarden.consultation.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * CSS 색상 설정 엔티티
 * 테마별 색상 설정을 관리하는 엔티티
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Entity
@Table(name = "css_color_settings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = false)
public class CssColorSettings extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "theme_name", nullable = false, length = 50)
    private String themeName; // 테마명

    @Column(name = "color_key", nullable = false, length = 50)
    private String colorKey; // 색상 키 (예: PRIMARY, SUCCESS)

    @Column(name = "color_value", nullable = false, length = 50)
    private String colorValue; // 색상 값 (예: #667eea)

    @Enumerated(EnumType.STRING)
    @Column(name = "color_type", nullable = false)
    @Builder.Default
    private ColorType colorType = ColorType.HEX; // 색상 타입

    @Column(name = "color_category", nullable = false, length = 30)
    private String colorCategory; // 색상 카테고리 (PRIMARY, SECONDARY, STATUS, FUNCTIONAL)

    @Column(name = "description", length = 200)
    private String description; // 색상 설명

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true; // 활성 여부

    /**
     * 색상 타입 열거형
     */
    public enum ColorType {
        HEX, RGB, RGBA, GRADIENT
    }
}

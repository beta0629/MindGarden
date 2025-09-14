package com.mindgarden.consultation.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 코드그룹 메타데이터 엔티티
 * 코드그룹별 한글명, 아이콘, 색상 등 표시 정보를 관리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-14
 */
@Entity
@Table(name = "code_group_metadata")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodeGroupMetadata {

    @Id
    @Column(name = "group_name", length = 50, nullable = false)
    private String groupName; // 코드그룹명 (예: GENDER, PAYMENT_METHOD)

    @Column(name = "korean_name", length = 100, nullable = false)
    private String koreanName; // 한글명 (예: 성별, 결제 방법)

    @Column(name = "description", length = 500)
    private String description; // 그룹 설명

    @Column(name = "icon", length = 10)
    private String icon; // 아이콘 (이모지)

    @Column(name = "color_code", length = 7)
    private String colorCode; // 색상 코드 (예: #007bff)

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0; // 표시 순서

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true; // 활성 여부
}

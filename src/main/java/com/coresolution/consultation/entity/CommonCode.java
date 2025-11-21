package com.coresolution.consultation.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * 공통코드 엔티티
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Entity
@Table(name = "common_codes", indexes = {
    @Index(name = "idx_common_code_group", columnList = "codeGroup"),
    @Index(name = "idx_common_code_value", columnList = "codeValue"),
    @Index(name = "idx_common_code_active", columnList = "isActive"),
    @Index(name = "idx_common_code_tenant", columnList = "tenantId")
}, uniqueConstraints = {
    @UniqueConstraint(
        name = "uk_tenant_code_group_value",
        columnNames = {"tenantId", "codeGroup", "codeValue"}
    )
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = false)
public class CommonCode extends BaseEntity {

    @Column(name = "code_group", nullable = false, length = 50)
    private String codeGroup; // 코드 그룹 (예: PACKAGE_TYPE, PAYMENT_METHOD, RESPONSIBILITY)

    @Column(name = "code_value", nullable = false, length = 50)
    private String codeValue; // 코드 값 (예: basic_10, card, mental_health)

    @Column(name = "code_label", nullable = false, length = 100)
    private String codeLabel; // 코드 라벨 (예: 기본 10회기 패키지, 신용카드, 정신건강 상담)

    @Column(name = "code_description", length = 500)
    private String codeDescription; // 코드 설명

    @Column(name = "sort_order")
    private Integer sortOrder; // 정렬 순서

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true; // 활성 여부

    @Column(name = "parent_code_group", length = 50)
    private String parentCodeGroup; // 상위 코드 그룹 (계층 구조용)

    @Column(name = "parent_code_value", length = 50)
    private String parentCodeValue; // 상위 코드 값 (계층 구조용)

    @Column(name = "extra_data", length = 1000)
    private String extraData; // 추가 데이터 (JSON 형태로 저장)

    @Column(name = "icon", length = 10)
    private String icon; // 아이콘 (이모지 또는 아이콘 클래스명)

    @Column(name = "color_code", length = 7)
    private String colorCode; // 색상 코드 (예: #007bff)

    @Column(name = "korean_name", nullable = false, length = 100)
    private String koreanName; // 한글명 (필수) - 한국에서 사용되므로 한글명 필수

    @PrePersist
    protected void onCreate() {
        if (isActive == null) {
            isActive = true;
        }
        if (sortOrder == null) {
            sortOrder = 0;
        }
        // 한글명이 없으면 codeLabel을 한글명으로 사용 (한국 사용 필수)
        if (koreanName == null || koreanName.trim().isEmpty()) {
            koreanName = codeLabel != null ? codeLabel : codeValue;
        }
    }
    
    /**
     * 코어솔루션 코드인지 확인
     * tenant_id가 NULL이면 코어솔루션 코드
     */
    public boolean isCoreCode() {
        return getTenantId() == null || getTenantId().isEmpty();
    }
    
    /**
     * 테넌트별 코드인지 확인
     */
    public boolean isTenantCode() {
        return !isCoreCode();
    }
}

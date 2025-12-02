package com.coresolution.core.dto;

import com.coresolution.core.domain.WidgetDefinition;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 위젯 정의 응답 DTO
 * 
 * 표준: DTO_NAMING_STANDARD.md 준수
 * 
 * @author CoreSolution Team
 * @since 2025-12-02
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WidgetDefinitionResponse {
    
    private String widgetId;
    private String tenantId;
    private String widgetType;
    private String widgetName;
    private String widgetNameKo;
    private String widgetNameEn;
    private String groupId;
    private String businessType;
    private String roleCode;
    private String defaultConfig;
    private Integer displayOrder;
    private String description;
    private String iconName;
    
    // 권한 필드
    private Boolean isSystemManaged;
    private Boolean isRequired;
    private Boolean isDeletable;
    private Boolean isMovable;
    private Boolean isConfigurable;
    
    private Boolean isActive;
    private Boolean isSystemWidget;
    private Boolean isIndependentWidget;
    private LocalDateTime createdAt;
    private String createdBy;
    
    /**
     * 엔티티를 DTO로 변환 (정적 팩토리 메서드)
     */
    public static WidgetDefinitionResponse from(WidgetDefinition entity) {
        if (entity == null) {
            return null;
        }
        
        return WidgetDefinitionResponse.builder()
                .widgetId(entity.getWidgetId())
                .tenantId(entity.getTenantId())
                .widgetType(entity.getWidgetType())
                .widgetName(entity.getWidgetName())
                .widgetNameKo(entity.getWidgetNameKo())
                .widgetNameEn(entity.getWidgetNameEn())
                .groupId(entity.getGroupId())
                .businessType(entity.getBusinessType())
                .roleCode(entity.getRoleCode())
                .defaultConfig(entity.getDefaultConfig())
                .displayOrder(entity.getDisplayOrder())
                .description(entity.getDescription())
                .iconName(entity.getIconName())
                .isSystemManaged(entity.getIsSystemManaged())
                .isRequired(entity.getIsRequired())
                .isDeletable(entity.getIsDeletable())
                .isMovable(entity.getIsMovable())
                .isConfigurable(entity.getIsConfigurable())
                .isActive(entity.getIsActive())
                .isSystemWidget(entity.isSystemWidget())
                .isIndependentWidget(entity.isIndependentWidget())
                .createdAt(entity.getCreatedAt())
                .createdBy(entity.getCreatedBy())
                .build();
    }
    
    /**
     * 엔티티 리스트를 DTO 리스트로 변환
     */
    public static List<WidgetDefinitionResponse> fromList(List<WidgetDefinition> entities) {
        if (entities == null) {
            return List.of();
        }
        
        return entities.stream()
                .map(WidgetDefinitionResponse::from)
                .collect(Collectors.toList());
    }
}


package com.coresolution.core.dto;

import com.coresolution.core.domain.WidgetGroup;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 위젯 그룹 응답 DTO
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
public class WidgetGroupResponse {
    
    private String groupId;
    private String tenantId;
    private String groupName;
    private String groupNameKo;
    private String groupNameEn;
    private String businessType;
    private String roleCode;
    private Integer displayOrder;
    private String description;
    private String iconName;
    private Boolean isActive;
    private Boolean isSystemGroup;
    private LocalDateTime createdAt;
    private String createdBy;
    
    /**
     * 엔티티를 DTO로 변환 (정적 팩토리 메서드)
     */
    public static WidgetGroupResponse from(WidgetGroup entity) {
        if (entity == null) {
            return null;
        }
        
        return WidgetGroupResponse.builder()
                .groupId(entity.getGroupId())
                .tenantId(entity.getTenantId())
                .groupName(entity.getGroupName())
                .groupNameKo(entity.getGroupNameKo())
                .groupNameEn(entity.getGroupNameEn())
                .businessType(entity.getBusinessType())
                .roleCode(entity.getRoleCode())
                .displayOrder(entity.getDisplayOrder())
                .description(entity.getDescription())
                .iconName(entity.getIconName())
                .isActive(entity.getIsActive())
                .isSystemGroup(entity.isSystemGroup())
                .createdAt(entity.getCreatedAt())
                .createdBy(entity.getCreatedBy())
                .build();
    }
    
    /**
     * 엔티티 리스트를 DTO 리스트로 변환
     */
    public static List<WidgetGroupResponse> fromList(List<WidgetGroup> entities) {
        if (entities == null) {
            return List.of();
        }
        
        return entities.stream()
                .map(WidgetGroupResponse::from)
                .collect(Collectors.toList());
    }
}


package com.coresolution.core.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * 권한 그룹 DTO
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-12-03
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PermissionGroupDTO {

    private Long id;
    private String tenantId;
    private String groupCode;
    private String groupName;
    private String groupNameEn;
    private String description;
    private String groupType;
    private String parentGroupCode;
    private Integer sortOrder;
    private String icon;
    private String colorCode;
    private Boolean isActive;

    /**
     * 하위 그룹 목록
     */
    @Builder.Default
    private List<PermissionGroupDTO> children = new ArrayList<>();

    /**
     * 하위 그룹이 있는지 확인
     */
    public boolean hasChildren() {
        return children != null && !children.isEmpty();
    }

    /**
     * 하위 그룹 추가
     */
    public void addChild(PermissionGroupDTO child) {
        if (children == null) {
            children = new ArrayList<>();
        }
        children.add(child);
    }
}


package com.coresolution.core.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * 메뉴 DTO
 * 
 * 계층형 메뉴 구조 표현
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-12-03
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MenuDTO {

    private Long id;
    private String menuCode;
    private String menuName;
    private String menuNameEn;
    private String menuPath;
    private Long parentMenuId;
    private Integer depth;
    private String requiredRole;
    private Boolean isAdminOnly;
    private String icon;
    private String description;
    private Integer sortOrder;
    private Boolean isActive;

    /**
     * 하위 메뉴 목록
     */
    @Builder.Default
    private List<MenuDTO> children = new ArrayList<>();

    /**
     * 하위 메뉴가 있는지 확인
     */
    public boolean hasChildren() {
        return children != null && !children.isEmpty();
    }

    /**
     * 하위 메뉴 추가
     */
    public void addChild(MenuDTO child) {
        if (children == null) {
            children = new ArrayList<>();
        }
        children.add(child);
    }
}


package com.coresolution.core.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 메뉴 권한 DTO
 * 
 * 역할별 메뉴 권한 정보를 표현
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-12-03
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MenuPermissionDTO {

    private Long menuId;
    private String menuCode;
    private String menuName;
    private String menuPath;
    private String minRequiredRole;
    private String menuLocation;
    
    private Boolean hasPermission;
    private Boolean canView;
    private Boolean canCreate;
    private Boolean canUpdate;
    private Boolean canDelete;
}


package com.coresolution.core.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 메뉴 권한 부여 요청 DTO
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-12-03
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MenuPermissionGrantRequest {

    @NotNull(message = "역할 ID는 필수입니다")
    private String roleId;

    @NotNull(message = "메뉴 ID는 필수입니다")
    private Long menuId;

    private Boolean canView = true;
    private Boolean canCreate = false;
    private Boolean canUpdate = false;
    private Boolean canDelete = false;
}


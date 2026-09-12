package com.coresolution.core.service;

import com.coresolution.core.domain.ClientPlatform;
import com.coresolution.core.dto.MenuDTO;
import com.coresolution.core.dto.MenuPermissionDTO;
import com.coresolution.core.dto.MenuPermissionGrantRequest;

import java.util.List;

/**
 * 메뉴 권한 서비스 인터페이스
 *
 * 역할별 메뉴 접근 권한 관리
 *
 * @author MindGarden
 * @version 2.1.0
 * @since 2025-12-03
 */
public interface MenuPermissionService {

    /**
     * 역할별 메뉴 권한 목록 조회 (관리자용)
     *
     * @param tenantId 테넌트 ID
     * @param roleId 역할 ID
     * @return 메뉴 권한 목록
     */
    List<MenuPermissionDTO> getRoleMenuPermissions(String tenantId, String roleId);

    /**
     * 메뉴 권한 부여 (부분 갱신: null 필드는 미변경)
     *
     * @param tenantId 테넌트 ID
     * @param request 권한 부여 요청
     */
    void grantMenuPermission(String tenantId, MenuPermissionGrantRequest request);

    /**
     * 메뉴 권한 회수
     *
     * @param tenantId 테넌트 ID
     * @param roleId 역할 ID
     * @param menuId 메뉴 ID
     */
    void revokeMenuPermission(String tenantId, String roleId, Long menuId);

    /**
     * 역할의 메뉴 권한 일괄 설정
     *
     * @param tenantId 테넌트 ID
     * @param roleId 역할 ID
     * @param requests 권한 부여 요청 목록
     */
    void batchUpdateMenuPermissions(String tenantId, String roleId, List<MenuPermissionGrantRequest> requests);

    /**
     * 사용자의 접근 가능한 메뉴 조회 (권한 기반)
     *
     * @param tenantId 테넌트 ID
     * @param roleId 역할 ID
     * @param userRole 사용자 역할 (ADMIN, STAFF, CONSULTANT, CLIENT)
     * @return 접근 가능한 메뉴 목록 (계층형)
     */
    List<MenuDTO> getUserAccessibleMenus(String tenantId, String roleId, String userRole);

    /**
     * LNB 등 이미 location/role로 좁힌 메뉴 트리에 테넌트 {@code RoleMenuPermission} 플랫폼 플래그를 적용한다.
     *
     * <p>테넌트 권한 행이 있으면 플랫폼별 canView* 로 필터하고, 없으면 min-role 기본을 유지한다.
     * {@code tenantId}/{@code roleId}가 없으면 location 필터 결과만 그대로 반환한다.
     * 플랫폼 미지정은 {@link ClientPlatform#WEB}({@code can_view})이다.</p>
     *
     * @param tree LNB 메뉴 트리
     * @param tenantId 테넌트 ID
     * @param roleId 테넌트 역할 ID ({@code tenant_role_id})
     * @param userRole 사용자 역할 코드
     * @return 권한 필터된 메뉴 트리 (웹 기본)
     */
    default List<MenuDTO> filterMenuTreeByPermissions(
        List<MenuDTO> tree,
        String tenantId,
        String roleId,
        String userRole
    ) {
        return filterMenuTreeByPermissions(tree, tenantId, roleId, userRole, ClientPlatform.WEB);
    }

    /**
     * LNB 메뉴 트리에 플랫폼별 RoleMenuPermission 플래그를 적용한다.
     *
     * @param tree LNB 메뉴 트리
     * @param tenantId 테넌트 ID
     * @param roleId 테넌트 역할 ID
     * @param userRole 사용자 역할 코드
     * @param platform 클라이언트 플랫폼 ({@code ios|android|web})
     * @return 권한 필터된 메뉴 트리
     */
    List<MenuDTO> filterMenuTreeByPermissions(
        List<MenuDTO> tree,
        String tenantId,
        String roleId,
        String userRole,
        ClientPlatform platform
    );

    /**
     * 테넌트 내 역할 코드(nameEn)로 {@code tenant_role_id}를 조회한다.
     *
     * @param tenantId 테넌트 ID
     * @param roleCode ADMIN/STAFF/CONSULTANT/CLIENT 등
     * @return tenant_role_id 또는 없으면 {@code null}
     */
    String resolveTenantRoleIdForRoleCode(String tenantId, String roleCode);
}

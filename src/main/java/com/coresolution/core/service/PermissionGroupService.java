package com.coresolution.core.service;

import com.coresolution.core.dto.PermissionGroupDTO;

import java.util.List;

/**
 * 권한 그룹 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-12-03
 */
public interface PermissionGroupService {

    /**
     * 사용자의 권한 그룹 코드 목록 조회
     * 
     * @param tenantId 테넌트 ID
     * @param tenantRoleId 역할 ID
     * @return 권한 그룹 코드 목록
     */
    List<String> getUserPermissionGroupCodes(String tenantId, String tenantRoleId);

    /**
     * 특정 그룹 권한 체크
     * 
     * @param tenantId 테넌트 ID
     * @param tenantRoleId 역할 ID
     * @param groupCode 그룹 코드
     * @return 권한 여부
     */
    boolean hasPermissionGroup(String tenantId, String tenantRoleId, String groupCode);

    /**
     * 권한 그룹 레벨 조회
     * 
     * @param tenantId 테넌트 ID
     * @param tenantRoleId 역할 ID
     * @param groupCode 그룹 코드
     * @return 권한 레벨 (READ, WRITE, FULL, NONE)
     */
    String getPermissionGroupLevel(String tenantId, String tenantRoleId, String groupCode);

    /**
     * 모든 권한 그룹 조회 (시스템 + 테넌트)
     * 
     * @param tenantId 테넌트 ID
     * @return 권한 그룹 목록
     */
    List<PermissionGroupDTO> getAllPermissionGroups(String tenantId);

    /**
     * 역할에 권한 그룹 부여
     * 
     * @param tenantId 테넌트 ID
     * @param tenantRoleId 역할 ID
     * @param groupCode 그룹 코드
     * @param accessLevel 권한 레벨 (READ, WRITE, FULL)
     */
    void grantPermissionGroup(String tenantId, String tenantRoleId, String groupCode, String accessLevel);

    /**
     * 역할의 권한 그룹 회수
     * 
     * @param tenantId 테넌트 ID
     * @param tenantRoleId 역할 ID
     * @param groupCode 그룹 코드
     */
    void revokePermissionGroup(String tenantId, String tenantRoleId, String groupCode);

    /**
     * 역할의 권한 그룹 일괄 설정
     * 
     * @param tenantId 테넌트 ID
     * @param tenantRoleId 역할 ID
     * @param groupCodes 그룹 코드 목록
     * @param accessLevel 기본 권한 레벨
     */
    void batchGrantPermissionGroups(String tenantId, String tenantRoleId, List<String> groupCodes, String accessLevel);
}


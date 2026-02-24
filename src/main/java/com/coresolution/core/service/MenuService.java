package com.coresolution.core.service;

import com.coresolution.core.dto.MenuDTO;

import java.util.List;
import java.util.Set;

/**
 * 메뉴 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-12-03
 */
public interface MenuService {

    /**
     * 사용자 역할에 따른 메뉴 조회
     * 
     * @param role 사용자 역할 (ADMIN, STAFF, CONSULTANT, CLIENT)
     * @return 계층형 메뉴 목록
     */
    List<MenuDTO> getMenusByRole(String role);

    /**
     * 관리자 전용 메뉴 조회
     * 
     * @return 관리자 전용 메뉴 목록 (계층형)
     */
    List<MenuDTO> getAdminMenus();

    /**
     * 일반 메뉴 조회 (관리자 전용 제외)
     * 
     * @return 일반 메뉴 목록 (계층형)
     */
    List<MenuDTO> getNonAdminMenus();

    /**
     * 모든 활성 메뉴 조회
     * 
     * @return 전체 메뉴 목록 (계층형)
     */
    List<MenuDTO> getAllActiveMenus();

    /**
     * 메뉴 코드로 조회
     * 
     * @param menuCode 메뉴 코드
     * @return 메뉴 DTO
     */
    MenuDTO getMenuByCode(String menuCode);

    /**
     * 메뉴 경로로 조회
     * 
     * @param menuPath 메뉴 경로
     * @return 메뉴 DTO
     */
    MenuDTO getMenuByPath(String menuPath);

    /**
     * LNB용 메뉴 트리 조회 (역할·권한 필터)
     * ADMIN: ADMIN_ONLY 전체, STAFF: ADMIN_ONLY 중 ERP는 ERP_ACCESS 있을 때만, CONSULTANT/CLIENT: 해당 location
     *
     * @param role 사용자 역할 (ADMIN, STAFF, CONSULTANT, CLIENT)
     * @param permissionCodes 사용자 권한 코드 목록 (STAFF일 때 ERP_ACCESS 등)
     * @return 계층형 메뉴 트리
     */
    List<MenuDTO> getLnbMenus(String role, Set<String> permissionCodes);
}


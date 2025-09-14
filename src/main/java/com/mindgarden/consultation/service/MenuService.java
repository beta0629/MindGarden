package com.mindgarden.consultation.service;

import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.constant.UserRole;

/**
 * 메뉴 서비스 인터페이스
 * 권한별 동적 메뉴 관리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-14
 */
public interface MenuService {
    
    /**
     * 사용자 역할에 따른 전체 메뉴 구조 조회
     * 
     * @param userRole 사용자 역할
     * @return 메뉴 구조 (메인 메뉴 + 서브 메뉴)
     */
    Map<String, Object> getMenuStructureByRole(UserRole userRole);
    
    /**
     * 공통 메뉴 조회 (모든 역할에서 공통으로 사용)
     * 
     * @return 공통 메뉴 목록
     */
    List<Map<String, Object>> getCommonMenus();
    
    /**
     * 특정 역할의 메뉴 조회
     * 
     * @param userRole 사용자 역할
     * @return 역할별 메뉴 목록
     */
    List<Map<String, Object>> getMenusByRole(UserRole userRole);
    
    /**
     * 메뉴 접근 권한 확인
     * 
     * @param userRole 사용자 역할
     * @param menuId 메뉴 ID
     * @return 접근 권한 여부
     */
    boolean hasMenuPermission(UserRole userRole, String menuId);
    
    /**
     * 메뉴 경로에 사용자 역할 동적 적용
     * 
     * @param basePath 기본 경로
     * @param userRole 사용자 역할
     * @return 역할이 적용된 경로
     */
    String buildDynamicPath(String basePath, UserRole userRole);
    
    /**
     * 메뉴 트리 구조 생성 (메인 메뉴 + 서브 메뉴)
     * 
     * @param menuList 메뉴 목록
     * @return 트리 구조의 메뉴
     */
    List<Map<String, Object>> buildMenuTree(List<Map<String, Object>> menuList);
}

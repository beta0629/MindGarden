package com.coresolution.core.repository;

import com.coresolution.core.entity.Menu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 메뉴 Repository
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-12-03
 */
@Repository
public interface MenuRepository extends JpaRepository<Menu, Long> {

    /**
     * 메뉴 코드로 조회
     */
    Optional<Menu> findByMenuCode(String menuCode);

    /**
     * 모든 활성 메뉴 조회 (정렬 순서대로)
     */
    @Query("SELECT m FROM Menu m WHERE m.isActive = true ORDER BY m.depth ASC, m.sortOrder ASC")
    List<Menu> findAllActiveMenusOrdered();

    /**
     * 관리자 전용 메뉴만 조회
     */
    @Query("SELECT m FROM Menu m WHERE m.isAdminOnly = true AND m.isActive = true ORDER BY m.depth ASC, m.sortOrder ASC")
    List<Menu> findAdminOnlyMenus();

    /**
     * 일반 메뉴만 조회 (관리자 전용 제외)
     */
    @Query("SELECT m FROM Menu m WHERE m.isAdminOnly = false AND m.isActive = true ORDER BY m.depth ASC, m.sortOrder ASC")
    List<Menu> findNonAdminMenus();

    /**
     * 특정 역할이 접근 가능한 메뉴 조회
     */
    @Query("SELECT m FROM Menu m WHERE m.requiredRole = :role AND m.isActive = true ORDER BY m.depth ASC, m.sortOrder ASC")
    List<Menu> findByRequiredRole(@Param("role") String role);

    /**
     * 부모 메뉴 ID로 하위 메뉴 조회
     */
    @Query("SELECT m FROM Menu m WHERE m.parentMenuId = :parentId AND m.isActive = true ORDER BY m.sortOrder ASC")
    List<Menu> findByParentMenuId(@Param("parentId") Long parentId);

    /**
     * 최상위 메뉴만 조회 (parent_menu_id = NULL)
     */
    @Query("SELECT m FROM Menu m WHERE m.parentMenuId IS NULL AND m.isActive = true ORDER BY m.sortOrder ASC")
    List<Menu> findRootMenus();

    /**
     * 특정 깊이의 메뉴 조회
     */
    @Query("SELECT m FROM Menu m WHERE m.depth = :depth AND m.isActive = true ORDER BY m.sortOrder ASC")
    List<Menu> findByDepth(@Param("depth") Integer depth);

    /**
     * 메뉴 경로로 조회
     */
    Optional<Menu> findByMenuPath(String menuPath);

    /**
     * 활성 메뉴 개수 조회
     */
    @Query("SELECT COUNT(m) FROM Menu m WHERE m.isActive = true")
    long countActiveMenus();

    /**
     * 관리자 전용 메뉴 개수 조회
     */
    @Query("SELECT COUNT(m) FROM Menu m WHERE m.isAdminOnly = true AND m.isActive = true")
    long countAdminOnlyMenus();
}


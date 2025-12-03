package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.CodeGroupMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 코드그룹 메타데이터 Repository
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-12-03
 */
@Repository
public interface CodeGroupMetadataRepository extends JpaRepository<CodeGroupMetadata, String> {

    /**
     * 시스템 공통코드 그룹 조회 (code_type = 'SYSTEM')
     */
    @Query("SELECT m FROM CodeGroupMetadata m WHERE m.codeType = 'SYSTEM' AND m.isActive = true ORDER BY m.displayOrder ASC")
    List<CodeGroupMetadata> findSystemCodeGroups();

    /**
     * 테넌트 공통코드 그룹 조회 (code_type = 'TENANT')
     */
    @Query("SELECT m FROM CodeGroupMetadata m WHERE m.codeType = 'TENANT' AND m.isActive = true ORDER BY m.displayOrder ASC")
    List<CodeGroupMetadata> findTenantCodeGroups();

    /**
     * 카테고리별 코드그룹 조회
     */
    @Query("SELECT m FROM CodeGroupMetadata m WHERE m.codeType = :codeType AND m.isActive = true ORDER BY m.displayOrder ASC")
    List<CodeGroupMetadata> findByCodeTypeAndIsActiveTrue(@Param("codeType") String codeType);

    /**
     * 그룹명으로 조회
     */
    Optional<CodeGroupMetadata> findByGroupName(String groupName);

    /**
     * 활성 상태 그룹 조회
     */
    List<CodeGroupMetadata> findByIsActiveTrueOrderByDisplayOrderAsc();

    /**
     * 코드 타입별 그룹 개수
     */
    @Query("SELECT COUNT(m) FROM CodeGroupMetadata m WHERE m.codeType = :codeType AND m.isActive = true")
    long countByCodeType(@Param("codeType") String codeType);
}

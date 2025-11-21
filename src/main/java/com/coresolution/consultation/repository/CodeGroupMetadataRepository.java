package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.CodeGroupMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 코드그룹 메타데이터 Repository
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-14
 */
@Repository
public interface CodeGroupMetadataRepository extends JpaRepository<CodeGroupMetadata, String> {

    /**
     * 활성화된 모든 코드그룹 메타데이터 조회 (표시 순서로 정렬)
     */
    @Query("SELECT cgm FROM CodeGroupMetadata cgm WHERE cgm.isActive = true ORDER BY cgm.displayOrder ASC, cgm.groupName ASC")
    List<CodeGroupMetadata> findAllActiveOrderByDisplayOrder();

    /**
     * 특정 코드그룹의 메타데이터 조회
     */
    Optional<CodeGroupMetadata> findByGroupNameAndIsActiveTrue(String groupName);

    /**
     * 코드그룹명으로 메타데이터 존재 여부 확인
     */
    boolean existsByGroupNameAndIsActiveTrue(String groupName);
    
    /**
     * 코드그룹명으로 메타데이터 조회
     */
    Optional<CodeGroupMetadata> findByGroupName(String groupName);
}

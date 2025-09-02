package com.mindgarden.consultation.repository;

import java.util.List;
import java.util.Optional;
import com.mindgarden.consultation.entity.CodeGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 코드 그룹 Repository
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Repository
public interface CodeGroupRepository extends JpaRepository<CodeGroup, Long> {
    
    /**
     * 코드로 코드 그룹 조회
     */
    Optional<CodeGroup> findByCodeAndIsDeletedFalse(String code);
    
    /**
     * 활성화된 모든 코드 그룹 조회
     */
    List<CodeGroup> findByIsActiveTrueAndIsDeletedFalseOrderBySortOrderAsc();
    
    /**
     * 코드 중복 확인
     */
    boolean existsByCodeAndIsDeletedFalse(String code);
    
    /**
     * 코드 그룹과 관련된 코드 값 개수 조회
     */
    @Query("SELECT COUNT(cv) FROM CodeValue cv WHERE cv.codeGroup.id = :groupId AND cv.isDeleted = false")
    long countCodeValuesByGroupId(@Param("groupId") Long groupId);
}

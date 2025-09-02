package com.mindgarden.consultation.repository;

import java.util.List;
import java.util.Optional;
import com.mindgarden.consultation.entity.CodeValue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 코드 값 Repository
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Repository
public interface CodeValueRepository extends JpaRepository<CodeValue, Long> {
    
    /**
     * 코드 그룹 코드로 코드 값들 조회
     */
    @Query("SELECT cv FROM CodeValue cv JOIN cv.codeGroup cg WHERE cg.code = :groupCode AND cv.isDeleted = false ORDER BY cv.sortOrder ASC")
    List<CodeValue> findByGroupCodeAndIsDeletedFalseOrderBySortOrderAsc(@Param("groupCode") String groupCode);
    
    /**
     * 코드 그룹 ID로 코드 값들 조회
     */
    List<CodeValue> findByCodeGroupIdAndIsDeletedFalseOrderBySortOrderAsc(Long codeGroupId);
    
    /**
     * 코드 그룹 코드와 코드 값으로 조회
     */
    @Query("SELECT cv FROM CodeValue cv JOIN cv.codeGroup cg WHERE cg.code = :groupCode AND cv.code = :code AND cv.isDeleted = false")
    Optional<CodeValue> findByGroupCodeAndCodeAndIsDeletedFalse(@Param("groupCode") String groupCode, @Param("code") String code);
    
    /**
     * 활성화된 코드 값들만 조회
     */
    @Query("SELECT cv FROM CodeValue cv JOIN cv.codeGroup cg WHERE cg.code = :groupCode AND cv.isActive = true AND cv.isDeleted = false ORDER BY cv.sortOrder ASC")
    List<CodeValue> findActiveByGroupCodeAndIsDeletedFalseOrderBySortOrderAsc(@Param("groupCode") String groupCode);
    
    /**
     * 코드 중복 확인 (같은 그룹 내에서)
     */
    @Query("SELECT COUNT(cv) > 0 FROM CodeValue cv JOIN cv.codeGroup cg WHERE cg.code = :groupCode AND cv.code = :code AND cv.isDeleted = false")
    boolean existsByGroupCodeAndCodeAndIsDeletedFalse(@Param("groupCode") String groupCode, @Param("code") String code);
}

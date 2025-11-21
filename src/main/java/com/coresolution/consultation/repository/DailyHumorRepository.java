package com.coresolution.consultation.repository;

import java.util.List;
import com.coresolution.consultation.entity.DailyHumor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

/**
 * 일일 유머 데이터 레포지토리
 */
@Repository
public interface DailyHumorRepository extends JpaRepository<DailyHumor, Long> {
    
    /**
     * 카테고리별 랜덤 유머 조회
     * @param category 카테고리
     * @return 랜덤 유머
     */
    @Query(value = "SELECT * FROM daily_humor WHERE category = ?1 AND is_active = true ORDER BY RAND() LIMIT 1", nativeQuery = true)
    DailyHumor findRandomByCategory(String category);
    
    /**
     * 랜덤 유머 조회 (카테고리 무관)
     * @return 랜덤 유머
     */
    @Query(value = "SELECT * FROM daily_humor WHERE is_active = true ORDER BY RAND() LIMIT 1", nativeQuery = true)
    DailyHumor findRandom();
    
    /**
     * 카테고리별 유머 목록 조회
     * @param category 카테고리
     * @return 유머 목록
     */
    List<DailyHumor> findByCategoryAndIsActive(String category, Boolean isActive);
}

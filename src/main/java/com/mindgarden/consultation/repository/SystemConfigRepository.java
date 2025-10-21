package com.mindgarden.consultation.repository;

import com.mindgarden.consultation.entity.SystemConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 시스템 설정 Repository
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-21
 */
@Repository
public interface SystemConfigRepository extends JpaRepository<SystemConfig, Long> {
    
    /**
     * 설정 키로 조회
     */
    Optional<SystemConfig> findByConfigKeyAndIsActiveTrue(String configKey);
    
    /**
     * 카테고리별 활성 설정 조회
     */
    List<SystemConfig> findByCategoryAndIsActiveTrue(String category);
    
    /**
     * 암호화된 설정 조회
     */
    @Query("SELECT s FROM SystemConfig s WHERE s.isEncrypted = true AND s.isActive = true")
    List<SystemConfig> findEncryptedConfigs();
    
    /**
     * 설정 키 존재 여부 확인
     */
    boolean existsByConfigKey(String configKey);
}

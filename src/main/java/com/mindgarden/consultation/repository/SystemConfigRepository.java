package com.mindgarden.consultation.repository;

import java.util.List;
import java.util.Optional;
import com.mindgarden.consultation.entity.SystemConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SystemConfigRepository extends JpaRepository<SystemConfig, Long> {
    Optional<SystemConfig> findByConfigKeyAndIsActiveTrue(String configKey);
    List<SystemConfig> findByCategoryAndIsActiveTrue(String category);
}
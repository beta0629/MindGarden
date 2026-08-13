package com.coresolution.consultation.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.VisitPredictionSettings;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 방문 예측 설정 Repository
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-08-13
 */
@Repository
public interface VisitPredictionSettingsRepository extends BaseRepository<VisitPredictionSettings, Long> {

    /**
     * 테넌트·매핑 ID로 설정 단건 조회
     */
    Optional<VisitPredictionSettings> findByTenantIdAndMappingId(String tenantId, Long mappingId);

    /**
     * 테넌트 내 여러 매핑의 설정을 일괄 조회
     */
    @Query("SELECT s FROM VisitPredictionSettings s "
            + "WHERE s.tenantId = :tenantId AND s.mappingId IN :mappingIds AND s.isDeleted = false")
    List<VisitPredictionSettings> findByTenantIdAndMappingIdIn(
            @Param("tenantId") String tenantId,
            @Param("mappingIds") Collection<Long> mappingIds);

    /**
     * 예측 비활성화된 매핑 ID 목록 조회
     */
    @Query("SELECT s.mappingId FROM VisitPredictionSettings s "
            + "WHERE s.tenantId = :tenantId AND s.predictionEnabled = false AND s.isDeleted = false")
    List<Long> findDisabledMappingIds(@Param("tenantId") String tenantId);
}

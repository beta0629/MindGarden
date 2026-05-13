package com.coresolution.consultation.repository;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.MindWeatherCard;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 마음 날씨 카드 저장소.
 *
 * @author MindGarden
 * @since 2026-05-13
 */
@Repository
public interface MindWeatherCardRepository extends BaseRepository<MindWeatherCard, Long> {

    @Query("SELECT c FROM MindWeatherCard c JOIN FETCH c.client LEFT JOIN FETCH c.shareConsultant "
        + "WHERE c.tenantId = :tenantId AND c.client.id = :clientId AND c.isDeleted = false ORDER BY c.createdAt DESC")
    List<MindWeatherCard> findByTenantIdAndClientIdForList(
        @Param("tenantId") String tenantId, @Param("clientId") Long clientId);

    @Query("SELECT c FROM MindWeatherCard c JOIN FETCH c.client LEFT JOIN FETCH c.shareConsultant "
        + "WHERE c.tenantId = :tenantId AND c.id = :id AND c.client.id = :clientId AND c.isDeleted = false")
    Optional<MindWeatherCard> findByTenantIdAndIdAndClientId(
        @Param("tenantId") String tenantId, @Param("id") Long id, @Param("clientId") Long clientId);

    @Query("SELECT c FROM MindWeatherCard c JOIN FETCH c.client LEFT JOIN FETCH c.shareConsultant "
        + "WHERE c.tenantId = :tenantId AND c.id = :id AND c.isDeleted = false")
    Optional<MindWeatherCard> findByTenantIdAndId(@Param("tenantId") String tenantId, @Param("id") Long id);

    @Query("SELECT c FROM MindWeatherCard c JOIN FETCH c.client LEFT JOIN FETCH c.shareConsultant "
        + "WHERE c.tenantId = :tenantId AND c.isDeleted = false AND c.shareSummary = true "
        + "AND c.shareConsultant.id = :consultantId ORDER BY c.consentUpdatedAt DESC, c.createdAt DESC")
    List<MindWeatherCard> findInboxForConsultant(
        @Param("tenantId") String tenantId, @Param("consultantId") Long consultantId);
}

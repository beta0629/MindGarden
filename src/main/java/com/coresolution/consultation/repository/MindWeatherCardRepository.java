package com.coresolution.consultation.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.MindWeatherCard;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    /**
     * 요약 공유가 켜진 활성 카드 수(BW-6 관측).
     *
     * @param tenantId 테넌트 ID
     * @return 개수
     */
    @Query("SELECT COUNT(c) FROM MindWeatherCard c WHERE c.tenantId = :tenantId AND c.isDeleted = false "
        + "AND c.shareSummary = true")
    long countActiveShareSummaryByTenantId(@Param("tenantId") String tenantId);

    /**
     * 기간 내 생성된 활성 카드 수.
     *
     * @param tenantId 테넌트 ID
     * @param since    하한(포함)
     * @return 개수
     */
    @Query("SELECT COUNT(c) FROM MindWeatherCard c WHERE c.tenantId = :tenantId AND c.isDeleted = false "
        + "AND c.createdAt >= :since")
    long countActiveCreatedSince(@Param("tenantId") String tenantId, @Param("since") LocalDateTime since);

    /**
     * 가장 최근 생성 시각.
     *
     * @param tenantId 테넌트 ID
     * @return 시각 또는 null
     */
    @Query("SELECT MAX(c.createdAt) FROM MindWeatherCard c WHERE c.tenantId = :tenantId AND c.isDeleted = false")
    LocalDateTime findMaxCreatedAtByTenantId(@Param("tenantId") String tenantId);

    /**
     * 어드민 목록: 연관 사용자 로딩 포함 페이징.
     *
     * @param tenantId 테넌트 ID
     * @param pageable 정렬·페이지
     * @return 페이지
     */
    @Query(
        value = "SELECT DISTINCT c FROM MindWeatherCard c JOIN FETCH c.client LEFT JOIN FETCH c.shareConsultant "
            + "WHERE c.tenantId = :tenantId AND c.isDeleted = false",
        countQuery = "SELECT COUNT(c) FROM MindWeatherCard c WHERE c.tenantId = :tenantId AND c.isDeleted = false")
    Page<MindWeatherCard> findAdminPageByTenantId(@Param("tenantId") String tenantId, Pageable pageable);
}

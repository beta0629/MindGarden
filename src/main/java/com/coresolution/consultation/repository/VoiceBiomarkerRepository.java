package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.VoiceBiomarker;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 음성 바이오마커 리포지토리
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-01-21
 */
@Repository
public interface VoiceBiomarkerRepository extends JpaRepository<VoiceBiomarker, Long> {

    Optional<VoiceBiomarker> findByIdAndIsDeletedFalse(Long id);

    Optional<VoiceBiomarker> findByConsultationRecordIdAndIsDeletedFalse(Long consultationRecordId);

    List<VoiceBiomarker> findByAudioFileIdAndIsDeletedFalse(Long audioFileId);

    @Query("SELECT v FROM VoiceBiomarker v " +
           "WHERE v.consultationRecordId IN " +
           "(SELECT cr.id FROM ConsultationRecord cr " +
           " WHERE cr.clientId = :clientId " +
           " AND cr.isDeleted = false) " +
           "AND v.isDeleted = false " +
           "ORDER BY v.createdAt DESC")
    List<VoiceBiomarker> findByClientIdOrderByCreatedAtDesc(@Param("clientId") Long clientId);

    @Query("SELECT v FROM VoiceBiomarker v " +
           "WHERE v.tenantId = :tenantId " +
           "AND v.isDeleted = false " +
           "AND (v.anxietyScore > 0.7 OR v.depressionScore > 0.7) " +
           "ORDER BY v.createdAt DESC")
    List<VoiceBiomarker> findHighRiskByTenantId(@Param("tenantId") String tenantId);
}

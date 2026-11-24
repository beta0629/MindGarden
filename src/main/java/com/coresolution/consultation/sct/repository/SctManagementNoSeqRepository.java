package com.coresolution.consultation.sct.repository;

import java.util.Optional;
import com.coresolution.consultation.sct.entity.SctManagementNoSeq;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * SCT 관리번호 시퀀스 Repository.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
public interface SctManagementNoSeqRepository extends JpaRepository<SctManagementNoSeq, String> {

    /**
     * 테넌트 시퀀스 행 잠금.
     *
     * @param tenantId 테넌트
     * @return 시퀀스
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM SctManagementNoSeq s WHERE s.tenantId = :tenantId")
    Optional<SctManagementNoSeq> findByTenantIdForUpdate(@Param("tenantId") String tenantId);
}

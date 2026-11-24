package com.coresolution.consultation.sct.repository;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.sct.entity.SctDomainMemo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * SCT 영역 메모 Repository.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
@Repository
public interface SctDomainMemoRepository extends JpaRepository<SctDomainMemo, Long> {

    /**
     * 초대별 활성 메모 목록.
     *
     * @param tenantId     테넌트
     * @param invitationId 초대
     * @return 메모
     */
    List<SctDomainMemo> findByTenantIdAndInvitationIdAndIsDeletedFalse(
            String tenantId, Long invitationId);

    /**
     * 초대·영역 활성 메모.
     *
     * @param tenantId     테넌트
     * @param invitationId 초대
     * @param domainCode   영역
     * @return 메모
     */
    Optional<SctDomainMemo> findByTenantIdAndInvitationIdAndDomainCodeAndIsDeletedFalse(
            String tenantId, Long invitationId, String domainCode);
}

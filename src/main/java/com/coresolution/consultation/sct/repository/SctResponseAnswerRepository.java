package com.coresolution.consultation.sct.repository;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.sct.entity.SctResponseAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * SCT 응답 Repository.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
public interface SctResponseAnswerRepository extends JpaRepository<SctResponseAnswer, Long> {

    List<SctResponseAnswer> findByTenantIdAndInvitationId(String tenantId, Long invitationId);

    Optional<SctResponseAnswer> findByTenantIdAndInvitationIdAndFormItemId(
            String tenantId, Long invitationId, Long formItemId);

    /**
     * 초대 응답 하드 삭제(파기).
     *
     * @param tenantId     테넌트
     * @param invitationId 초대
     */
    void deleteByTenantIdAndInvitationId(String tenantId, Long invitationId);
}

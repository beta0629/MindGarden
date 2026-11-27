package com.coresolution.consultation.sct.repository;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.sct.entity.SctShortLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * SCT 단축 링크 Repository.
 *
 * @author MindGarden
 * @since 2026-11-27
 */
@Repository
public interface SctShortLinkRepository extends JpaRepository<SctShortLink, Long> {

    /**
     * short_code 전역 조회(삭제되지 않은 행).
     *
     * @param shortCode 단축 코드
     * @return 단축 링크
     */
    Optional<SctShortLink> findByShortCodeAndIsDeletedFalse(String shortCode);

    /**
     * 초대별 활성 단축 링크.
     *
     * @param tenantId     테넌트
     * @param invitationId 초대
     * @return 활성 목록
     */
    List<SctShortLink> findByTenantIdAndInvitationIdAndIsActiveTrueAndIsDeletedFalse(
            String tenantId, Long invitationId);

    /**
     * 초대별 최신 활성 단축 코드 1건.
     *
     * @param tenantId     테넌트
     * @param invitationId 초대
     * @return 활성 단축 링크
     */
    Optional<SctShortLink> findFirstByTenantIdAndInvitationIdAndIsActiveTrueAndIsDeletedFalseOrderByCreatedAtDesc(
            String tenantId, Long invitationId);

    /**
     * 초대에 연결된 모든 활성 단축 링크 비활성화.
     *
     * @param tenantId     테넌트
     * @param invitationId 초대
     * @return 갱신 행 수
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE SctShortLink s SET s.isActive = false, s.updatedAt = CURRENT_TIMESTAMP "
            + "WHERE s.tenantId = :tenantId AND s.invitationId = :invitationId "
            + "AND s.isActive = true AND s.isDeleted = false")
    int deactivateActiveForInvitation(
            @Param("tenantId") String tenantId, @Param("invitationId") Long invitationId);

    /**
     * 코드 존재 여부(충돌 검사).
     *
     * @param shortCode 코드
     * @return 존재하면 true
     */
    boolean existsByShortCodeAndIsDeletedFalse(String shortCode);
}

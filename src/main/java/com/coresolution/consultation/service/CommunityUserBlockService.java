package com.coresolution.consultation.service;

import java.util.List;
import com.coresolution.consultation.dto.community.CommunityUserBlockRequest;
import com.coresolution.consultation.dto.community.CommunityUserBlockResponse;
import com.coresolution.consultation.entity.User;
import org.springframework.data.domain.Pageable;

/**
 * Apple T2 (1.2 UGC) — 커뮤니티 사용자 차단 서비스.
 *
 * <p>차단/해제/목록 조회와 피드 필터를 위한 차단 대상 ID 조회를 책임진다.
 * 모든 메서드는 호출자의 {@code tenantId} 로 격리되며, 자기 자신 차단은 허용하지 않는다.</p>
 *
 * @author MindGarden
 * @since 2026-06-07
 */
public interface CommunityUserBlockService {

    /**
     * 사용자 차단(멱등 — 이미 차단 중이면 NO-OP).
     *
     * @param blocker        차단을 하는 사용자
     * @param blockedUserId  차단 대상 users.id
     * @param request        차단 사유(선택)
     * @return 차단 row id
     */
    Long blockUser(User blocker, Long blockedUserId, CommunityUserBlockRequest request);

    /**
     * 차단 해제 (soft delete).
     *
     * @param blocker        차단자
     * @param blockedUserId  차단 해제 대상 users.id
     */
    void unblockUser(User blocker, Long blockedUserId);

    /**
     * 차단 목록 조회 — 사용자 차단 목록 페이지에 표시.
     *
     * @param blocker  차단자
     * @param pageable 페이지
     * @return 차단된 사용자 목록(차단 시각 내림차순)
     */
    List<CommunityUserBlockResponse> listBlockedUsers(User blocker, Pageable pageable);

    /**
     * 피드/댓글 쿼리에 적용할 차단 대상 ID 목록.
     *
     * <p>호출 측에서 빈 리스트와 비교하여 차단 필터 적용 여부를 결정한다 (JPQL 빈 IN 절 회피).</p>
     *
     * @param blocker 차단자
     * @return 차단 대상 users.id 리스트(없으면 empty)
     */
    List<Long> findBlockedUserIds(User blocker);
}

package com.coresolution.consultation.service.impl;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import com.coresolution.consultation.dto.community.CommunityUserBlockRequest;
import com.coresolution.consultation.dto.community.CommunityUserBlockResponse;
import com.coresolution.consultation.entity.CommunityUserBlock;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.repository.CommunityUserBlockRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.CommunityUserBlockService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link CommunityUserBlockService} 구현.
 *
 * @author MindGarden
 * @since 2026-06-07
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class CommunityUserBlockServiceImpl implements CommunityUserBlockService {

    private static final DateTimeFormatter ISO_DT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    private static final String DISPLAY_FALLBACK = "사용자";

    private final CommunityUserBlockRepository communityUserBlockRepository;
    private final UserRepository userRepository;

    @Override
    public Long blockUser(User blocker, Long blockedUserId, CommunityUserBlockRequest request) {
        String tenantId = requireTenantId(blocker);
        if (Objects.equals(blocker.getId(), blockedUserId)) {
            throw new AccessDeniedException("자기 자신은 차단할 수 없습니다.");
        }
        User blockedRef = userRepository.findById(blockedUserId)
                .orElseThrow(() -> new EntityNotFoundException("차단 대상 사용자를 찾을 수 없습니다."));
        String reason = request != null ? trimToNull(request.getReason()) : null;
        CommunityUserBlock existing = communityUserBlockRepository
                .findByTenantIdAndBlocker_IdAndBlocked_Id(tenantId, blocker.getId(), blockedUserId)
                .orElse(null);
        if (existing != null) {
            if (!existing.getIsDeleted()) {
                if (reason != null) {
                    existing.setReason(reason);
                    communityUserBlockRepository.save(existing);
                }
                return existing.getId();
            }
            existing.setIsDeleted(false);
            existing.setDeletedAt(null);
            existing.setReason(reason);
            CommunityUserBlock saved = communityUserBlockRepository.save(existing);
            return saved.getId();
        }
        CommunityUserBlock fresh = CommunityUserBlock.builder()
                .tenantId(tenantId)
                .blocker(userRepository.getReferenceById(blocker.getId()))
                .blocked(blockedRef)
                .reason(reason)
                .isDeleted(false)
                .build();
        CommunityUserBlock saved = communityUserBlockRepository.save(fresh);
        return saved.getId();
    }

    @Override
    public void unblockUser(User blocker, Long blockedUserId) {
        String tenantId = requireTenantId(blocker);
        CommunityUserBlock active = communityUserBlockRepository
                .findByTenantIdAndBlocker_IdAndBlocked_IdAndIsDeletedFalse(
                        tenantId, blocker.getId(), blockedUserId)
                .orElseThrow(() -> new EntityNotFoundException("차단된 사용자가 아닙니다."));
        active.delete();
        communityUserBlockRepository.save(active);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommunityUserBlockResponse> listBlockedUsers(User blocker, Pageable pageable) {
        String tenantId = requireTenantId(blocker);
        List<CommunityUserBlock> rows = communityUserBlockRepository.findActiveByBlocker(
                tenantId, blocker.getId(), pageable);
        List<CommunityUserBlockResponse> out = new ArrayList<>(rows.size());
        for (CommunityUserBlock row : rows) {
            out.add(CommunityUserBlockResponse.builder()
                    .id(row.getId())
                    .blockedUserId(row.getBlocked().getId())
                    .blockedDisplayName(displayForUser(row.getBlocked()))
                    .blockedAt(fmt(row.getCreatedAt()))
                    .build());
        }
        return out;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Long> findBlockedUserIds(User blocker) {
        if (blocker == null || blocker.getId() == null) {
            return List.of();
        }
        String tenantId = requireTenantId(blocker);
        return communityUserBlockRepository.findBlockedUserIds(tenantId, blocker.getId());
    }

    private static String displayForUser(User user) {
        if (user.getNickname() != null && !user.getNickname().isBlank()) {
            return user.getNickname().trim();
        }
        if (user.getName() != null && !user.getName().isBlank()) {
            return user.getName().trim();
        }
        return DISPLAY_FALLBACK;
    }

    private static String requireTenantId(User user) {
        String tenantId = user.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            throw new AccessDeniedException("테넌트 정보가 없습니다.");
        }
        return tenantId.trim();
    }

    private static String fmt(java.time.LocalDateTime t) {
        return t == null ? "" : ISO_DT.format(t);
    }

    private static String trimToNull(String s) {
        if (s == null) {
            return null;
        }
        String trimmed = s.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}

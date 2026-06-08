package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import com.coresolution.consultation.dto.community.CommunityUserBlockRequest;
import com.coresolution.consultation.dto.community.CommunityUserBlockResponse;
import com.coresolution.consultation.entity.CommunityUserBlock;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.repository.CommunityUserBlockRepository;
import com.coresolution.consultation.repository.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;

/**
 * Apple T2 (1.2 UGC) — {@link CommunityUserBlockServiceImpl} 단위 테스트.
 *
 * <p>차단/해제/멱등/자기 차단 거부/차단 목록 조회/차단 대상 ID 회수 — Apple 리뷰 응답 핵심 시나리오.</p>
 *
 * @author MindGarden
 * @since 2026-06-07
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("CommunityUserBlockServiceImpl — Apple T2 사용자 차단")
class CommunityUserBlockServiceImplTest {

    private static final String TENANT_ID = "tenant-block-test";
    private static final Long BLOCKER_ID = 100L;
    private static final Long BLOCKED_ID = 200L;

    @Mock private CommunityUserBlockRepository communityUserBlockRepository;
    @Mock private UserRepository userRepository;

    private CommunityUserBlockServiceImpl service;

    private User blocker;
    private User blocked;

    @BeforeEach
    void setUp() {
        service = new CommunityUserBlockServiceImpl(communityUserBlockRepository, userRepository);
        blocker = new User();
        blocker.setId(BLOCKER_ID);
        blocker.setTenantId(TENANT_ID);
        blocker.setNickname("blocker-nick");
        blocked = new User();
        blocked.setId(BLOCKED_ID);
        blocked.setTenantId(TENANT_ID);
        blocked.setNickname("blocked-nick");
    }

    @Test
    @DisplayName("blockUser — 신규 차단 row 가 저장된다")
    void blockUser_createsNewRow() {
        when(communityUserBlockRepository.findByTenantIdAndBlocker_IdAndBlocked_Id(
                TENANT_ID, BLOCKER_ID, BLOCKED_ID)).thenReturn(Optional.empty());
        when(userRepository.findById(BLOCKED_ID)).thenReturn(Optional.of(blocked));
        when(userRepository.getReferenceById(BLOCKER_ID)).thenReturn(blocker);
        when(communityUserBlockRepository.save(any(CommunityUserBlock.class)))
                .thenAnswer(inv -> {
                    CommunityUserBlock entity = inv.getArgument(0);
                    entity.setId(7777L);
                    return entity;
                });

        CommunityUserBlockRequest request = new CommunityUserBlockRequest();
        request.setReason("악성 댓글");
        Long id = service.blockUser(blocker, BLOCKED_ID, request);

        assertThat(id).isEqualTo(7777L);
        ArgumentCaptor<CommunityUserBlock> captor = ArgumentCaptor.forClass(CommunityUserBlock.class);
        verify(communityUserBlockRepository).save(captor.capture());
        CommunityUserBlock saved = captor.getValue();
        assertThat(saved.getTenantId()).isEqualTo(TENANT_ID);
        assertThat(saved.getBlocker()).isEqualTo(blocker);
        assertThat(saved.getBlocked()).isEqualTo(blocked);
        assertThat(saved.getReason()).isEqualTo("악성 댓글");
    }

    @Test
    @DisplayName("blockUser — 자기 자신은 차단할 수 없다")
    void blockUser_selfBlockIsRejected() {
        assertThatThrownBy(() -> service.blockUser(blocker, BLOCKER_ID, null))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("자기 자신");
        verify(communityUserBlockRepository, never()).save(any());
    }

    @Test
    @DisplayName("blockUser — 이미 활성 차단이면 NO-OP (멱등)")
    void blockUser_idempotentWhenAlreadyActive() {
        CommunityUserBlock existing = CommunityUserBlock.builder()
                .tenantId(TENANT_ID)
                .blocker(blocker)
                .blocked(blocked)
                .isDeleted(false)
                .build();
        existing.setId(123L);
        when(communityUserBlockRepository.findByTenantIdAndBlocker_IdAndBlocked_Id(
                TENANT_ID, BLOCKER_ID, BLOCKED_ID)).thenReturn(Optional.of(existing));
        when(userRepository.findById(BLOCKED_ID)).thenReturn(Optional.of(blocked));

        Long id = service.blockUser(blocker, BLOCKED_ID, null);

        assertThat(id).isEqualTo(123L);
        verify(communityUserBlockRepository, never()).save(any());
    }

    @Test
    @DisplayName("blockUser — 과거 차단 해제된 row 가 있으면 재활용한다")
    void blockUser_reactivatesSoftDeletedRow() {
        CommunityUserBlock soft = CommunityUserBlock.builder()
                .tenantId(TENANT_ID)
                .blocker(blocker)
                .blocked(blocked)
                .isDeleted(true)
                .build();
        soft.setId(555L);
        when(communityUserBlockRepository.findByTenantIdAndBlocker_IdAndBlocked_Id(
                TENANT_ID, BLOCKER_ID, BLOCKED_ID)).thenReturn(Optional.of(soft));
        when(userRepository.findById(BLOCKED_ID)).thenReturn(Optional.of(blocked));
        when(communityUserBlockRepository.save(any(CommunityUserBlock.class))).thenReturn(soft);

        Long id = service.blockUser(blocker, BLOCKED_ID, null);

        assertThat(id).isEqualTo(555L);
        assertThat(soft.getIsDeleted()).isFalse();
        assertThat(soft.getDeletedAt()).isNull();
        verify(communityUserBlockRepository).save(soft);
    }

    @Test
    @DisplayName("unblockUser — 활성 차단을 soft-delete 처리한다")
    void unblockUser_softDeletesActiveRow() {
        CommunityUserBlock active = CommunityUserBlock.builder()
                .tenantId(TENANT_ID)
                .blocker(blocker)
                .blocked(blocked)
                .isDeleted(false)
                .build();
        active.setId(999L);
        when(communityUserBlockRepository.findByTenantIdAndBlocker_IdAndBlocked_IdAndIsDeletedFalse(
                TENANT_ID, BLOCKER_ID, BLOCKED_ID)).thenReturn(Optional.of(active));
        when(communityUserBlockRepository.save(any(CommunityUserBlock.class))).thenReturn(active);

        service.unblockUser(blocker, BLOCKED_ID);

        assertThat(active.getIsDeleted()).isTrue();
        assertThat(active.getDeletedAt()).isNotNull();
        verify(communityUserBlockRepository, times(1)).save(active);
    }

    @Test
    @DisplayName("unblockUser — 차단 row 없으면 EntityNotFoundException")
    void unblockUser_throwsWhenNotFound() {
        when(communityUserBlockRepository.findByTenantIdAndBlocker_IdAndBlocked_IdAndIsDeletedFalse(
                TENANT_ID, BLOCKER_ID, BLOCKED_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.unblockUser(blocker, BLOCKED_ID))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    @DisplayName("listBlockedUsers — 차단 row 를 응답 DTO 로 매핑한다")
    void listBlockedUsers_mapsToResponse() {
        CommunityUserBlock row = CommunityUserBlock.builder()
                .tenantId(TENANT_ID)
                .blocker(blocker)
                .blocked(blocked)
                .isDeleted(false)
                .build();
        row.setId(11L);
        row.setCreatedAt(java.time.LocalDateTime.of(2026, 6, 7, 12, 0));
        when(communityUserBlockRepository.findActiveByBlocker(eq(TENANT_ID), eq(BLOCKER_ID), any()))
                .thenReturn(List.of(row));

        List<CommunityUserBlockResponse> result = service.listBlockedUsers(blocker, PageRequest.of(0, 20));

        assertThat(result).hasSize(1);
        CommunityUserBlockResponse item = result.get(0);
        assertThat(item.getId()).isEqualTo(11L);
        assertThat(item.getBlockedUserId()).isEqualTo(BLOCKED_ID);
        assertThat(item.getBlockedDisplayName()).isEqualTo("blocked-nick");
    }

    @Test
    @DisplayName("findBlockedUserIds — 저장소로 위임하고 결과를 그대로 반환")
    void findBlockedUserIds_delegatesToRepo() {
        when(communityUserBlockRepository.findBlockedUserIds(TENANT_ID, BLOCKER_ID))
                .thenReturn(List.of(BLOCKED_ID, 999L));

        List<Long> ids = service.findBlockedUserIds(blocker);

        assertThat(ids).containsExactly(BLOCKED_ID, 999L);
    }

    @Test
    @DisplayName("findBlockedUserIds — null user 면 빈 리스트")
    void findBlockedUserIds_nullUserReturnsEmpty() {
        assertThat(service.findBlockedUserIds(null)).isEmpty();
        verify(communityUserBlockRepository, never()).findBlockedUserIds(any(), any());
    }
}

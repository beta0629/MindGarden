package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Optional;

import com.coresolution.consultation.constant.LifecycleState;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.lifecycle.Actor;
import com.coresolution.consultation.dto.lifecycle.DormantUserDetailResponse;
import com.coresolution.consultation.dto.lifecycle.DormantUserSummaryResponse;
import com.coresolution.consultation.dto.lifecycle.TransitionResult;
import com.coresolution.consultation.entity.DormantUserPiiVault;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.CommunityAnonymizationAuditRepository;
import com.coresolution.consultation.repository.DormantUserPiiVaultRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.UserLifecycleService;

import java.util.Collections;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

/**
 * {@link AdminLifecycleServiceImpl} 단위 테스트 — Phase 4 어드민 휴면 사용자 관리 로직.
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminLifecycleServiceImpl — 휴면 목록·상세·복귀·강제 익명화")
class AdminLifecycleServiceImplTest {

    private static final Long USER_ID = 4242L;
    private static final String USER_LOGIN_ID = "client.test.account";
    private static final String TENANT_ID = "tenant-admin-svc-test";

    @Mock private UserRepository userRepository;
    @Mock private DormantUserPiiVaultRepository dormantUserPiiVaultRepository;
    @Mock private CommunityAnonymizationAuditRepository auditRepository;
    @Mock private UserLifecycleService userLifecycleService;

    @InjectMocks
    private AdminLifecycleServiceImpl service;

    private User dormantUser;
    private DormantUserPiiVault vault;

    @BeforeEach
    void setUp() {
        dormantUser = new User();
        dormantUser.setId(USER_ID);
        dormantUser.setTenantId(TENANT_ID);
        dormantUser.setUserId(USER_LOGIN_ID);
        dormantUser.setEmail("user@example.com");
        dormantUser.setRole(UserRole.CLIENT);
        dormantUser.setLifecycleState(LifecycleState.DORMANT);
        dormantUser.setLastLoginAt(LocalDateTime.now().minusYears(1));

        vault = DormantUserPiiVault.builder()
                .userId(USER_ID)
                .encryptedPii("{}")
                .dormantEnteredAt(LocalDateTime.now().minusYears(1))
                .anonymizeScheduledAt(LocalDateTime.now().plusYears(3))
                .preNoticeSentAt(LocalDateTime.now().minusDays(1))
                .preNoticeChannel("EMAIL")
                .build();
        vault.setTenantId(TENANT_ID);
    }

    @Test
    @DisplayName("listDormantUsers: vault 메타데이터 합쳐 summary 페이지 반환")
    void listDormantUsers_mergesVaultMetadata() {
        Pageable pageable = PageRequest.of(0, 20);
        when(userRepository.findDormantUsersByTenantId(TENANT_ID, pageable))
                .thenReturn(new PageImpl<>(Collections.singletonList(dormantUser), pageable, 1));
        when(dormantUserPiiVaultRepository.findByUserIdAndTenantId(USER_ID, TENANT_ID))
                .thenReturn(Optional.of(vault));

        Page<DormantUserSummaryResponse> page = service.listDormantUsers(TENANT_ID, pageable);

        assertThat(page.getContent()).singleElement().satisfies(item -> {
            assertThat(item.getUserId()).isEqualTo(USER_ID);
            assertThat(item.getMaskedUserId()).startsWith("clie");
            assertThat(item.getMaskedUserId()).doesNotContain(USER_LOGIN_ID);
            assertThat(item.isVaultPresent()).isTrue();
            assertThat(item.getPreNoticeChannel()).isEqualTo("EMAIL");
        });
    }

    @Test
    @DisplayName("listDormantUsers: tenantId 누락 시 IllegalArgumentException")
    void listDormantUsers_validatesTenant() {
        assertThatThrownBy(() -> service.listDormantUsers(null, PageRequest.of(0, 20)))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.listDormantUsers(" ", PageRequest.of(0, 20)))
                .isInstanceOf(IllegalArgumentException.class);
        verify(userRepository, never()).findDormantUsersByTenantId(anyString(), any());
    }

    @Test
    @DisplayName("getDormantUserDetail: vault 있음 → 전체 메타데이터 응답 + audit 카운트 포함")
    void getDormantUserDetail_withVault() {
        when(userRepository.findDormantUserByTenantIdAndId(TENANT_ID, USER_ID))
                .thenReturn(Optional.of(dormantUser));
        when(dormantUserPiiVaultRepository.findByUserIdAndTenantId(USER_ID, TENANT_ID))
                .thenReturn(Optional.of(vault));
        when(auditRepository.countByTenantIdAndOriginalUserId(TENANT_ID, USER_ID))
                .thenReturn(3L);

        DormantUserDetailResponse detail = service.getDormantUserDetail(TENANT_ID, USER_ID);

        assertThat(detail.getUserId()).isEqualTo(USER_ID);
        assertThat(detail.isVaultPresent()).isTrue();
        assertThat(detail.getAnonymizeScheduledAt()).isEqualTo(vault.getAnonymizeScheduledAt());
        assertThat(detail.getCommunityAnonymizationAuditCount()).isEqualTo(3L);
        assertThat(detail.getMaskedUserId()).doesNotContain(USER_LOGIN_ID);
    }

    @Test
    @DisplayName("getDormantUserDetail: vault 없음 → vaultPresent=false + 시각 null")
    void getDormantUserDetail_withoutVault() {
        when(userRepository.findDormantUserByTenantIdAndId(TENANT_ID, USER_ID))
                .thenReturn(Optional.of(dormantUser));
        when(dormantUserPiiVaultRepository.findByUserIdAndTenantId(USER_ID, TENANT_ID))
                .thenReturn(Optional.empty());
        when(auditRepository.countByTenantIdAndOriginalUserId(TENANT_ID, USER_ID))
                .thenReturn(0L);

        DormantUserDetailResponse detail = service.getDormantUserDetail(TENANT_ID, USER_ID);

        assertThat(detail.isVaultPresent()).isFalse();
        assertThat(detail.getAnonymizeScheduledAt()).isNull();
        assertThat(detail.getPreNoticeSentAt()).isNull();
        assertThat(detail.getCommunityAnonymizationAuditCount()).isZero();
    }

    @Test
    @DisplayName("getDormantUserDetail: 미존재 사용자 → IllegalArgumentException")
    void getDormantUserDetail_notFound() {
        when(userRepository.findDormantUserByTenantIdAndId(TENANT_ID, USER_ID))
                .thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getDormantUserDetail(TENANT_ID, USER_ID))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("DORMANT user not found");
    }

    @Test
    @DisplayName("reactivateDormantUser: UserLifecycleService.reactivate 위임")
    void reactivateDormantUser_delegates() {
        Actor actor = Actor.user(99L, "ADMIN");
        TransitionResult expected = TransitionResult.builder()
                .userId(USER_ID)
                .fromState(LifecycleState.DORMANT)
                .toState(LifecycleState.ACTIVE)
                .transitionedAt(LocalDateTime.now())
                .auditLogId(701L)
                .build();
        when(userLifecycleService.reactivate(USER_ID, TENANT_ID, actor)).thenReturn(expected);

        TransitionResult result = service.reactivateDormantUser(TENANT_ID, USER_ID, actor);

        assertThat(result).isEqualTo(expected);
        verify(userLifecycleService).reactivate(USER_ID, TENANT_ID, actor);
    }

    @Test
    @DisplayName("forceAnonymizeDormantUser: ANONYMIZED 전이 + vault 삭제 위임")
    void forceAnonymizeDormantUser_transitionsAndDeletesVault() {
        Actor actor = Actor.user(99L, "ADMIN");
        when(userRepository.findDormantUserByTenantIdAndId(TENANT_ID, USER_ID))
                .thenReturn(Optional.of(dormantUser));
        when(dormantUserPiiVaultRepository.findByUserIdAndTenantId(USER_ID, TENANT_ID))
                .thenReturn(Optional.of(vault));
        TransitionResult expected = TransitionResult.builder()
                .userId(USER_ID)
                .fromState(LifecycleState.DORMANT)
                .toState(LifecycleState.ANONYMIZED)
                .transitionedAt(LocalDateTime.now())
                .auditLogId(801L)
                .build();
        when(userLifecycleService.transitionTo(
                eq(USER_ID), eq(LifecycleState.ANONYMIZED), eq(actor), anyString()))
                .thenReturn(expected);

        TransitionResult result = service.forceAnonymizeDormantUser(TENANT_ID, USER_ID, actor);

        assertThat(result).isEqualTo(expected);
        verify(userLifecycleService).transitionTo(
                eq(USER_ID), eq(LifecycleState.ANONYMIZED), eq(actor), anyString());
        verify(dormantUserPiiVaultRepository).delete(vault);
    }

    @Test
    @DisplayName("forceAnonymizeDormantUser: vault 없음 → 전이만 하고 delete 호출 안함")
    void forceAnonymizeDormantUser_noVault_noDelete() {
        Actor actor = Actor.user(99L, "ADMIN");
        when(userRepository.findDormantUserByTenantIdAndId(TENANT_ID, USER_ID))
                .thenReturn(Optional.of(dormantUser));
        when(dormantUserPiiVaultRepository.findByUserIdAndTenantId(USER_ID, TENANT_ID))
                .thenReturn(Optional.empty());
        when(userLifecycleService.transitionTo(
                eq(USER_ID), eq(LifecycleState.ANONYMIZED), eq(actor), anyString()))
                .thenReturn(TransitionResult.builder()
                        .userId(USER_ID)
                        .fromState(LifecycleState.DORMANT)
                        .toState(LifecycleState.ANONYMIZED)
                        .transitionedAt(LocalDateTime.now())
                        .auditLogId(802L)
                        .build());

        service.forceAnonymizeDormantUser(TENANT_ID, USER_ID, actor);

        verify(dormantUserPiiVaultRepository, never()).delete(any(DormantUserPiiVault.class));
    }

    @Test
    @DisplayName("forceAnonymizeDormantUser: 미존재 사용자 → IllegalArgumentException + lifecycle 미호출")
    void forceAnonymizeDormantUser_notFound() {
        Actor actor = Actor.user(99L, "ADMIN");
        when(userRepository.findDormantUserByTenantIdAndId(TENANT_ID, USER_ID))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.forceAnonymizeDormantUser(TENANT_ID, USER_ID, actor))
                .isInstanceOf(IllegalArgumentException.class);

        verify(userLifecycleService, never()).transitionTo(
                anyLong(), any(), any(Actor.class), anyString());
    }

    @Test
    @DisplayName("maskUserId: 4자 노출 + 나머지 마스킹 / 짧은 입력 안전 처리")
    void maskUserId_shape() {
        assertThat(AdminLifecycleServiceImpl.maskUserId("client123")).isEqualTo("clie*****");
        assertThat(AdminLifecycleServiceImpl.maskUserId("ab")).isEqualTo("ab****");
        assertThat(AdminLifecycleServiceImpl.maskUserId(null)).isEmpty();
        assertThat(AdminLifecycleServiceImpl.maskUserId("")).isEmpty();
    }
}

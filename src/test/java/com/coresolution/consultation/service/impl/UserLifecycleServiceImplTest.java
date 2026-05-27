package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Optional;

import com.coresolution.consultation.constant.AuditAction;
import com.coresolution.consultation.constant.LifecycleState;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.lifecycle.Actor;
import com.coresolution.consultation.dto.lifecycle.AnonymizeResult;
import com.coresolution.consultation.dto.lifecycle.TransitionResult;
import com.coresolution.consultation.dto.lifecycle.WithdrawalOptions;
import com.coresolution.consultation.entity.AuditLog;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.IllegalStateTransitionException;
import com.coresolution.consultation.repository.AuditLogRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.UserAnonymizationService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link UserLifecycleServiceImpl} 단위 테스트 — Phase 2-α §3.6 단일 진입점 + 전이 가드.
 *
 * @author CoreSolution
 * @since 2026-06-05
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UserLifecycleServiceImpl — 전이 가드 + audit_logs + ANONYMIZED 위임")
class UserLifecycleServiceImplTest {

    private static final String TENANT_ID = "tenant-lifecycle-test";
    private static final Long USER_ID = 2002L;

    @Mock private UserRepository userRepository;
    @Mock private AuditLogRepository auditLogRepository;
    @Mock private UserAnonymizationService userAnonymizationService;

    @InjectMocks
    private UserLifecycleServiceImpl service;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(USER_ID);
        user.setTenantId(TENANT_ID);
        user.setUserId("u-active");
        user.setEmail("u-active@example.com");
        user.setRole(UserRole.CLIENT);
        user.setLifecycleState(LifecycleState.ACTIVE);
        user.setIsActive(true);
    }

    private void stubSaveAndAudit() {
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(auditLogRepository.save(any(AuditLog.class)))
                .thenAnswer(inv -> {
                    AuditLog a = inv.getArgument(0);
                    a.setId(901L);
                    return a;
                });
    }

    @Test
    @DisplayName("transitionTo ACTIVE → WITHDRAWAL_PENDING: lifecycleState 변경 + withdrawal_requested_at stamp")
    void transitionTo_active_to_withdrawalPending() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        stubSaveAndAudit();

        TransitionResult result = service.transitionTo(
                USER_ID,
                LifecycleState.WITHDRAWAL_PENDING,
                Actor.user(USER_ID, "CLIENT"),
                "SELF_WITHDRAWAL_REQUEST");

        assertThat(user.getLifecycleState()).isEqualTo(LifecycleState.WITHDRAWAL_PENDING);
        assertThat(user.getWithdrawalRequestedAt()).isNotNull();
        assertThat(result.getFromState()).isEqualTo(LifecycleState.ACTIVE);
        assertThat(result.getToState()).isEqualTo(LifecycleState.WITHDRAWAL_PENDING);
        assertThat(result.getAuditLogId()).isEqualTo(901L);
    }

    @Test
    @DisplayName("transitionTo WITHDRAWAL_PENDING → ACTIVE: withdrawal_requested_at clear")
    void transitionTo_withdrawalPending_to_active_clears_stamp() {
        user.setLifecycleState(LifecycleState.WITHDRAWAL_PENDING);
        user.setWithdrawalRequestedAt(LocalDateTime.now().minusDays(3));
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        stubSaveAndAudit();

        TransitionResult result = service.transitionTo(
                USER_ID,
                LifecycleState.ACTIVE,
                Actor.user(USER_ID, "CLIENT"),
                "SELF_WITHDRAWAL_CANCEL");

        assertThat(user.getLifecycleState()).isEqualTo(LifecycleState.ACTIVE);
        assertThat(user.getWithdrawalRequestedAt())
                .as("ACTIVE 복귀 시 withdrawal_requested_at 은 clear 되어야 한다")
                .isNull();
        assertThat(result.getFromState()).isEqualTo(LifecycleState.WITHDRAWAL_PENDING);
        assertThat(result.getToState()).isEqualTo(LifecycleState.ACTIVE);
    }

    @Test
    @DisplayName("transitionTo WITHDRAWAL_PENDING → ANONYMIZED: UserAnonymizationService 위임")
    void transitionTo_anonymized_delegates() {
        user.setLifecycleState(LifecycleState.WITHDRAWAL_PENDING);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        AnonymizeResult delegated = AnonymizeResult.builder()
                .userId(USER_ID)
                .auditLogId(701L)
                .destructionLogId(702L)
                .anonymizedAt(LocalDateTime.now())
                .build();
        when(userAnonymizationService.anonymize(eq(USER_ID), any(Actor.class), anyString()))
                .thenReturn(delegated);

        TransitionResult result = service.transitionTo(
                USER_ID,
                LifecycleState.ANONYMIZED,
                Actor.system(),
                "WITHDRAWAL_GRACE_EXPIRED");

        verify(userAnonymizationService, times(1))
                .anonymize(eq(USER_ID), any(Actor.class), eq("WITHDRAWAL_GRACE_EXPIRED"));
        // ANONYMIZED 위임 경로에서는 본 service 가 직접 user 를 save 하지 않는다
        verify(userRepository, never()).save(any(User.class));
        // audit_logs 도 anonymizationService 가 책임지므로 본 service 의 직접 저장은 없다
        verify(auditLogRepository, never()).save(any(AuditLog.class));
        assertThat(result.getToState()).isEqualTo(LifecycleState.ANONYMIZED);
        assertThat(result.getAuditLogId()).isEqualTo(701L);
        assertThat(result.getDestructionLogId()).isEqualTo(702L);
    }

    @Test
    @DisplayName("transitionTo: 전이 그래프 위반 시 IllegalStateTransitionException — HARD_DELETED → ACTIVE 거부")
    void transitionTo_illegal_throws() {
        user.setLifecycleState(LifecycleState.HARD_DELETED);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> service.transitionTo(
                USER_ID, LifecycleState.ACTIVE, Actor.system(), "ILLEGAL"))
                .isInstanceOf(IllegalStateTransitionException.class);

        verify(userRepository, never()).save(any(User.class));
        verify(auditLogRepository, never()).save(any(AuditLog.class));
    }

    @Test
    @DisplayName("transitionTo: ANONYMIZED → ACTIVE 위반 거부 (PII 복원 불가)")
    void transitionTo_anonymizedToActive_illegal() {
        user.setLifecycleState(LifecycleState.ANONYMIZED);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> service.transitionTo(
                USER_ID, LifecycleState.ACTIVE, Actor.system(), "ILLEGAL"))
                .isInstanceOf(IllegalStateTransitionException.class);
    }

    @Test
    @DisplayName("transitionTo: 자기 자신으로의 전이 거부")
    void transitionTo_self_illegal() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> service.transitionTo(
                USER_ID, LifecycleState.ACTIVE, Actor.system(), "SELF"))
                .isInstanceOf(IllegalStateTransitionException.class);
    }

    @Test
    @DisplayName("transitionTo: lifecycleState 가 null 인 경우 (마이그레이션 미적용) IllegalStateTransitionException")
    void transitionTo_currentStateNull_throws() {
        user.setLifecycleState(null);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> service.transitionTo(
                USER_ID, LifecycleState.WITHDRAWAL_PENDING, Actor.system(), "REASON"))
                .isInstanceOf(IllegalStateTransitionException.class);
    }

    @Test
    @DisplayName("transitionTo: userId null 입력 시 IllegalArgumentException")
    void transitionTo_nullUserId_throws() {
        assertThatThrownBy(() -> service.transitionTo(
                null, LifecycleState.ACTIVE, Actor.system(), "REASON"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("transitionTo: newState null 입력 시 IllegalArgumentException")
    void transitionTo_nullNewState_throws() {
        assertThatThrownBy(() -> service.transitionTo(
                USER_ID, null, Actor.system(), "REASON"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("transitionTo: actor null 입력 시 IllegalArgumentException")
    void transitionTo_nullActor_throws() {
        assertThatThrownBy(() -> service.transitionTo(
                USER_ID, LifecycleState.ACTIVE, null, "REASON"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("transitionTo: 존재하지 않는 userId 시 IllegalArgumentException")
    void transitionTo_userNotFound() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.transitionTo(
                USER_ID, LifecycleState.SUSPENDED, Actor.system(), "REASON"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("requestWithdrawal: ACTIVE → WITHDRAWAL_PENDING 위임 + SELF_WITHDRAWAL_REQUEST 사유")
    void requestWithdrawal_calls_transitionTo() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        stubSaveAndAudit();

        TransitionResult result = service.requestWithdrawal(
                USER_ID, Actor.user(USER_ID, "CLIENT"));

        assertThat(result.getFromState()).isEqualTo(LifecycleState.ACTIVE);
        assertThat(result.getToState()).isEqualTo(LifecycleState.WITHDRAWAL_PENDING);
        assertThat(user.getWithdrawalRequestedAt()).isNotNull();
        // 기본 옵션 — withdrawal_options_json 은 null
        assertThat(user.getWithdrawalOptionsJson()).isNull();
    }

    @Test
    @DisplayName("requestWithdrawal(options): Q12-b deleteCommunityBody=true → withdrawal_options_json 저장")
    void requestWithdrawal_withOptions_persistsJson() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        stubSaveAndAudit();

        TransitionResult result = service.requestWithdrawal(
                USER_ID, Actor.user(USER_ID, "CLIENT"), WithdrawalOptions.of(true));

        assertThat(result.getToState()).isEqualTo(LifecycleState.WITHDRAWAL_PENDING);
        assertThat(user.getWithdrawalOptionsJson())
                .as("Q12-b 옵션은 users.withdrawal_options_json 컬럼에 JSON 으로 보관된다")
                .contains("\"deleteCommunityBody\":true");
    }

    @Test
    @DisplayName("requestWithdrawal(options): 기본 옵션 — withdrawal_options_json NULL 유지")
    void requestWithdrawal_withDefaultOptions_keepsNull() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        stubSaveAndAudit();

        service.requestWithdrawal(USER_ID, Actor.user(USER_ID, "CLIENT"),
                WithdrawalOptions.defaults());

        assertThat(user.getWithdrawalOptionsJson())
                .as("기본 옵션은 storage 효율을 위해 NULL 로 유지된다")
                .isNull();
    }

    @Test
    @DisplayName("requestWithdrawal(options): null options 인자도 안전하게 기본값으로 해석")
    void requestWithdrawal_withNullOptions_safe() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        stubSaveAndAudit();

        service.requestWithdrawal(USER_ID, Actor.user(USER_ID, "CLIENT"), null);

        assertThat(user.getWithdrawalOptionsJson()).isNull();
    }

    @Test
    @DisplayName("cancelWithdrawal: WITHDRAWAL_PENDING → ACTIVE 위임 + SELF_WITHDRAWAL_CANCEL 사유")
    void cancelWithdrawal_calls_transitionTo() {
        user.setLifecycleState(LifecycleState.WITHDRAWAL_PENDING);
        user.setWithdrawalRequestedAt(LocalDateTime.now().minusDays(2));
        user.setWithdrawalOptionsJson("{\"deleteCommunityBody\":true}");
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        stubSaveAndAudit();

        TransitionResult result = service.cancelWithdrawal(
                USER_ID, Actor.user(USER_ID, "CLIENT"));

        assertThat(result.getFromState()).isEqualTo(LifecycleState.WITHDRAWAL_PENDING);
        assertThat(result.getToState()).isEqualTo(LifecycleState.ACTIVE);
        assertThat(user.getWithdrawalRequestedAt()).isNull();
        assertThat(user.getWithdrawalOptionsJson())
                .as("취소 시점에 보관된 옵션은 정리되어야 한다 (재요청 시 깨끗한 상태)")
                .isNull();
    }

    @Test
    @DisplayName("transitionTo ACTIVE → DELETED_BY_ADMIN: ADMIN_FORCE_DEACTIVATE audit action")
    void transitionTo_active_to_deletedByAdmin_audit() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        stubSaveAndAudit();

        service.transitionTo(USER_ID,
                LifecycleState.DELETED_BY_ADMIN,
                Actor.user(99L, "ADMIN"),
                "ADMIN_FORCE_DEACTIVATE");

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());
        assertThat(captor.getValue().getAction())
                .isEqualTo(AuditAction.ADMIN_FORCE_DEACTIVATE);
    }

    @Test
    @DisplayName("transitionTo ACTIVE → DORMANT: USER_DORMANT_TRANSITION audit action")
    void transitionTo_active_to_dormant_audit() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        stubSaveAndAudit();

        service.transitionTo(USER_ID,
                LifecycleState.DORMANT,
                Actor.system(),
                "ONE_YEAR_INACTIVE");

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());
        assertThat(captor.getValue().getAction())
                .isEqualTo(AuditAction.USER_DORMANT_TRANSITION);
    }

    @Test
    @DisplayName("transitionTo ACTIVE → SUSPENDED: LIFECYCLE_STATE_CHANGE audit (기본)")
    void transitionTo_active_to_suspended_audit() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        stubSaveAndAudit();

        service.transitionTo(USER_ID,
                LifecycleState.SUSPENDED,
                Actor.user(99L, "ADMIN"),
                "OPS_PAUSE");

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());
        assertThat(captor.getValue().getAction())
                .isEqualTo(AuditAction.LIFECYCLE_STATE_CHANGE);
    }

    @Test
    @DisplayName("transitionTo SUSPENDED → ACTIVE: USER_RESTORE audit (해제)")
    void transitionTo_suspended_to_active_audit() {
        user.setLifecycleState(LifecycleState.SUSPENDED);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        stubSaveAndAudit();

        service.transitionTo(USER_ID,
                LifecycleState.ACTIVE,
                Actor.user(99L, "ADMIN"),
                "RELEASE_SUSPEND");

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());
        assertThat(captor.getValue().getAction()).isEqualTo(AuditAction.USER_RESTORE);
    }

    @Test
    @DisplayName("resolveAuditAction: 정적 매핑 표준 케이스 검증")
    void resolveAuditAction_static() {
        assertThat(UserLifecycleServiceImpl.resolveAuditAction(
                LifecycleState.ACTIVE, LifecycleState.WITHDRAWAL_PENDING))
                .isEqualTo(AuditAction.USER_WITHDRAWAL_REQUEST);
        assertThat(UserLifecycleServiceImpl.resolveAuditAction(
                LifecycleState.WITHDRAWAL_PENDING, LifecycleState.ACTIVE))
                .isEqualTo(AuditAction.USER_WITHDRAWAL_CANCEL);
        assertThat(UserLifecycleServiceImpl.resolveAuditAction(
                LifecycleState.ANONYMIZED, LifecycleState.HARD_DELETED))
                .isEqualTo(AuditAction.USER_HARD_DELETE);
        assertThat(UserLifecycleServiceImpl.resolveAuditAction(
                LifecycleState.SUSPENDED, LifecycleState.ANONYMIZED))
                .isEqualTo(AuditAction.LIFECYCLE_STATE_CHANGE);
    }

    @Test
    @DisplayName("transitionTo: audit_logs 의 tenant_id / target_user_id / entity_type 정합")
    void transitionTo_auditLog_basic_fields() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        stubSaveAndAudit();

        service.transitionTo(USER_ID,
                LifecycleState.SUSPENDED,
                Actor.user(99L, "ADMIN"),
                "REASON");

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());
        AuditLog a = captor.getValue();
        assertThat(a.getTenantId()).isEqualTo(TENANT_ID);
        assertThat(a.getTargetUserId()).isEqualTo(USER_ID);
        assertThat(a.getEntityType()).isEqualTo("USER");
        assertThat(a.getEntityId()).isEqualTo(USER_ID);
        assertThat(a.getActorUserId()).isEqualTo(99L);
        assertThat(a.getActorRole()).isEqualTo("ADMIN");
    }
}

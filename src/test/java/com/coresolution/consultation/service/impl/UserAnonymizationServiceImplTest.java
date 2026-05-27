package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

import com.coresolution.consultation.constant.AuditAction;
import com.coresolution.consultation.constant.DestructionType;
import com.coresolution.consultation.constant.LegalBasis;
import com.coresolution.consultation.constant.LifecycleState;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.lifecycle.Actor;
import com.coresolution.consultation.dto.lifecycle.AnonymizeResult;
import com.coresolution.consultation.entity.AuditLog;
import com.coresolution.consultation.entity.CommunityComment;
import com.coresolution.consultation.entity.CommunityPost;
import com.coresolution.consultation.entity.PersonalDataDestructionLog;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.AuditLogRepository;
import com.coresolution.consultation.repository.CommunityCommentRepository;
import com.coresolution.consultation.repository.CommunityPostRepository;
import com.coresolution.consultation.repository.PersonalDataDestructionLogRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.CommunityAnonymizationService;
import com.coresolution.consultation.service.UserAnonymizationService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link UserAnonymizationServiceImpl} 단위 테스트 — Phase 2-α §3 PII 매트릭스 + W3 tombstone.
 *
 * @author CoreSolution
 * @since 2026-06-05
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UserAnonymizationServiceImpl — PII 매트릭스 + W3 tombstone + audit/destruction 동시 기록")
class UserAnonymizationServiceImplTest {

    private static final String TENANT_ID = "tenant-anon-test";
    private static final Long USER_ID = 1001L;

    @Mock private UserRepository userRepository;
    @Mock private AuditLogRepository auditLogRepository;
    @Mock private PersonalDataDestructionLogRepository personalDataDestructionLogRepository;
    @Mock private CommunityPostRepository communityPostRepository;
    @Mock private CommunityCommentRepository communityCommentRepository;
    @Mock private CommunityAnonymizationService communityAnonymizationService;

    @InjectMocks
    private UserAnonymizationServiceImpl service;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(USER_ID);
        user.setTenantId(TENANT_ID);
        user.setUserId("client01");
        user.setEmail("client01@example.com");
        user.setPassword("encoded-password");
        user.setName("홍길동");
        user.setNickname("길동이");
        user.setPhone("01012345678");
        user.setGender("M");
        user.setRrnEncrypted("ENC[123]");
        user.setAddress("서울시 종로구");
        user.setAddressDetail("123-45");
        user.setPostalCode("03000");
        user.setProfileImageUrl("https://cdn/profile/1001.jpg");
        user.setMemo("주의 메모");
        user.setNotes("내부 노트");
        user.setRole(UserRole.CLIENT);
        user.setLifecycleState(LifecycleState.WITHDRAWAL_PENDING);
        user.setIsActive(true);
        user.setSocialProvider("KAKAO");
        user.setSocialProviderUserId("kakao-uid-1");
        user.setIsSocialAccount(true);
        user.setEmailVerificationToken("evt-token");
        user.setPasswordResetToken("prt-token");

        // Q12-b 기본 — community sweep 은 옵션 false 시 호출되지 않으므로 lenient stub
        Mockito.lenient().when(communityPostRepository.findByAuthor_Id(USER_ID))
                .thenReturn(Collections.emptyList());
        Mockito.lenient().when(communityCommentRepository.findByAuthor_Id(USER_ID))
                .thenReturn(Collections.emptyList());
        // Phase 4 옵션 b — community author 익명화 service mock (모든 호출에 기본 NONE 반환)
        Mockito.lenient().when(communityAnonymizationService.anonymizeCommunityRecords(
                Mockito.anyLong(), Mockito.anyString(), Mockito.anyString(),
                Mockito.any(), Mockito.any()))
                .thenReturn(CommunityAnonymizationService.Result.NONE);
    }

    @Test
    @DisplayName("anonymize: §3.2 PII 컬럼이 모두 surrogate / TOMBSTONE 으로 치환된다")
    void anonymize_appliesUsersPiiMatrix() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        AuditLog savedAudit = AuditLog.builder().id(101L).build();
        when(auditLogRepository.save(any(AuditLog.class))).thenReturn(savedAudit);
        PersonalDataDestructionLog savedDestruction =
                PersonalDataDestructionLog.builder().id(202L).build();
        when(personalDataDestructionLogRepository.save(any(PersonalDataDestructionLog.class)))
                .thenReturn(savedDestruction);

        AnonymizeResult result = service.anonymize(
                USER_ID, Actor.user(99L, "ADMIN"), "WITHDRAWAL_GRACE_EXPIRED");

        assertThat(user.getUserId()).startsWith("anon-");
        assertThat(user.getEmail()).matches(Pattern.compile("^deleted-1001-\\d+@anonymized\\.local$"));
        assertThat(user.getName()).startsWith("이용종료-");
        assertThat(user.getPhone()).startsWith("000-0000-");
        assertThat(user.getPassword()).isNull();
        assertThat(user.getNickname()).isNull();
        assertThat(user.getGender()).isNull();
        assertThat(user.getRrnEncrypted()).isNull();
        assertThat(user.getAddress()).isNull();
        assertThat(user.getAddressDetail()).isNull();
        assertThat(user.getPostalCode()).isNull();
        assertThat(user.getProfileImageUrl()).isNull();
        assertThat(user.getMemo()).isNull();
        assertThat(user.getNotes()).isNull();
        assertThat(user.getSocialProvider()).isNull();
        assertThat(user.getSocialProviderUserId()).isNull();
        assertThat(user.getEmailVerificationToken()).isNull();
        assertThat(user.getPasswordResetToken()).isNull();
        assertThat(user.getIsSocialAccount()).isFalse();
        assertThat(user.getLifecycleState()).isEqualTo(LifecycleState.ANONYMIZED);
        assertThat(user.getIsActive()).isFalse();
        assertThat(user.getWithdrawalRequestedAt()).isNull();

        assertThat(result.getEmailTombstone()).startsWith("deleted-1001-");
        assertThat(result.getEmailTombstone()).endsWith("@anonymized.local");
        assertThat(result.getAuditLogId()).isEqualTo(101L);
        assertThat(result.getDestructionLogId()).isEqualTo(202L);
        assertThat(result.getPiiColumnsAffected())
                .contains("user_id", "email", "password", "name", "phone");
    }

    @Test
    @DisplayName("anonymize: CONSULTANT specialization 은 KEEP (Q7)")
    void anonymize_consultant_specialization_kept() {
        user.setRole(UserRole.CONSULTANT);
        user.setSpecialization("아동심리");
        user.setSpecialty("CBT");
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(auditLogRepository.save(any(AuditLog.class)))
                .thenReturn(AuditLog.builder().id(11L).build());
        when(personalDataDestructionLogRepository.save(any(PersonalDataDestructionLog.class)))
                .thenReturn(PersonalDataDestructionLog.builder().id(22L).build());

        service.anonymize(USER_ID, Actor.system(), "DORMANT_AUTO_FOUR_YEARS");

        assertThat(user.getSpecialization())
                .as("Q7 — CONSULTANT specialization KEEP (통계 우선)")
                .isEqualTo("아동심리");
        assertThat(user.getSpecialty()).isEqualTo("CBT");
    }

    @Test
    @DisplayName("anonymize: CLIENT 역할은 specialization/specialty TOMBSTONE")
    void anonymize_client_specialization_tombstone() {
        user.setRole(UserRole.CLIENT);
        user.setSpecialization("불필요한 값");
        user.setSpecialty("기타");
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(auditLogRepository.save(any(AuditLog.class)))
                .thenReturn(AuditLog.builder().id(11L).build());
        when(personalDataDestructionLogRepository.save(any(PersonalDataDestructionLog.class)))
                .thenReturn(PersonalDataDestructionLog.builder().id(22L).build());

        service.anonymize(USER_ID, Actor.system(), "WITHDRAWAL_GRACE_EXPIRED");

        assertThat(user.getSpecialization()).isNull();
        assertThat(user.getSpecialty()).isNull();
    }

    @Test
    @DisplayName("anonymize: audit_logs 가 USER_ANONYMIZE 로 기록된다")
    void anonymize_recordsAuditLog() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(auditLogRepository.save(any(AuditLog.class)))
                .thenReturn(AuditLog.builder().id(11L).build());
        when(personalDataDestructionLogRepository.save(any(PersonalDataDestructionLog.class)))
                .thenReturn(PersonalDataDestructionLog.builder().id(22L).build());

        service.anonymize(USER_ID, Actor.user(50L, "ADMIN"), "ADMIN_FORCED_DELETION");

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());
        AuditLog audit = captor.getValue();
        assertThat(audit.getAction()).isEqualTo(AuditAction.USER_ANONYMIZE);
        assertThat(audit.getTenantId()).isEqualTo(TENANT_ID);
        assertThat(audit.getActorUserId()).isEqualTo(50L);
        assertThat(audit.getActorRole()).isEqualTo("ADMIN");
        assertThat(audit.getTargetUserId()).isEqualTo(USER_ID);
        assertThat(audit.getEntityType()).isEqualTo("USER");
    }

    @Test
    @DisplayName("anonymize: personal_data_destruction_logs 가 ANONYMIZE 로 기록된다 + SHA-256 hash")
    void anonymize_recordsDestructionLog_withHash() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(auditLogRepository.save(any(AuditLog.class)))
                .thenReturn(AuditLog.builder().id(11L).build());
        when(personalDataDestructionLogRepository.save(any(PersonalDataDestructionLog.class)))
                .thenReturn(PersonalDataDestructionLog.builder().id(22L).build());

        service.anonymize(USER_ID, Actor.system(), "WITHDRAWAL_GRACE_EXPIRED");

        ArgumentCaptor<PersonalDataDestructionLog> captor =
                ArgumentCaptor.forClass(PersonalDataDestructionLog.class);
        verify(personalDataDestructionLogRepository).save(captor.capture());
        PersonalDataDestructionLog log = captor.getValue();
        assertThat(log.getDestructionType()).isEqualTo(DestructionType.ANONYMIZE);
        assertThat(log.getTenantId()).isEqualTo(TENANT_ID);
        assertThat(log.getTargetUserId()).isEqualTo(USER_ID);
        assertThat(log.getBeforeEmailHash()).hasSize(64);
        assertThat(log.getBeforeNameHash()).hasSize(64);
        assertThat(log.getBeforePhoneHash()).hasSize(64);
        assertThat(log.getExecutionReason()).isEqualTo("WITHDRAWAL_GRACE_EXPIRED");
        assertThat(log.getPiiColumnsAffected()).contains("\"email\"")
                .contains("\"phone\"")
                .contains("\"password\"");
    }

    @Test
    @DisplayName("anonymize: legal_basis — DORMANT 사유는 PIPA_39_6")
    void anonymize_legalBasis_dormant() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(auditLogRepository.save(any(AuditLog.class)))
                .thenReturn(AuditLog.builder().id(11L).build());
        when(personalDataDestructionLogRepository.save(any(PersonalDataDestructionLog.class)))
                .thenReturn(PersonalDataDestructionLog.builder().id(22L).build());

        service.anonymize(USER_ID, Actor.system(), "DORMANT_AUTO_FOUR_YEARS");

        ArgumentCaptor<PersonalDataDestructionLog> captor =
                ArgumentCaptor.forClass(PersonalDataDestructionLog.class);
        verify(personalDataDestructionLogRepository).save(captor.capture());
        assertThat(captor.getValue().getLegalBasis()).isEqualTo(LegalBasis.PIPA_39_6);
    }

    @Test
    @DisplayName("anonymize: legal_basis — ADMIN 사유는 ADMIN_FORCED")
    void anonymize_legalBasis_admin() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(auditLogRepository.save(any(AuditLog.class)))
                .thenReturn(AuditLog.builder().id(11L).build());
        when(personalDataDestructionLogRepository.save(any(PersonalDataDestructionLog.class)))
                .thenReturn(PersonalDataDestructionLog.builder().id(22L).build());

        service.anonymize(USER_ID, Actor.user(99L, "ADMIN"), "ADMIN_FORCED_DELETE");

        ArgumentCaptor<PersonalDataDestructionLog> captor =
                ArgumentCaptor.forClass(PersonalDataDestructionLog.class);
        verify(personalDataDestructionLogRepository).save(captor.capture());
        assertThat(captor.getValue().getLegalBasis()).isEqualTo(LegalBasis.ADMIN_FORCED);
    }

    @Test
    @DisplayName("anonymize: 이미 ANONYMIZED 사용자는 idempotent skip — save 호출 없음")
    void anonymize_idempotent_terminal_skip() {
        user.setLifecycleState(LifecycleState.ANONYMIZED);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

        AnonymizeResult result = service.anonymize(
                USER_ID, Actor.system(), "WITHDRAWAL_GRACE_EXPIRED");

        verify(userRepository, never()).save(any(User.class));
        verify(auditLogRepository, never()).save(any(AuditLog.class));
        verify(personalDataDestructionLogRepository, never())
                .save(any(PersonalDataDestructionLog.class));
        assertThat(result.getUserId()).isEqualTo(USER_ID);
    }

    @Test
    @DisplayName("anonymize: HARD_DELETED 사용자도 idempotent skip")
    void anonymize_idempotent_hardDeleted_skip() {
        user.setLifecycleState(LifecycleState.HARD_DELETED);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

        service.anonymize(USER_ID, Actor.system(), "WITHDRAWAL_GRACE_EXPIRED");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("anonymize: userId null 입력 시 IllegalArgumentException")
    void anonymize_nullUserId_throws() {
        assertThatThrownBy(() -> service.anonymize(null, Actor.system(), "REASON"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("anonymize: actor null 입력 시 IllegalArgumentException")
    void anonymize_nullActor_throws() {
        assertThatThrownBy(() -> service.anonymize(USER_ID, null, "REASON"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("anonymize: 존재하지 않는 userId 는 IllegalArgumentException")
    void anonymize_notFound_throws() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.anonymize(USER_ID, Actor.system(), "REASON"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("buildEmailTombstone: W3 표준 패턴 — deleted-{uid}-{epoch}@anonymized.local")
    void w3_emailTombstone_standard() {
        long epoch = LocalDateTime.now().toEpochSecond(java.time.ZoneOffset.UTC);
        String tombstone = UserAnonymizationService.buildEmailTombstone(42L, epoch);
        assertThat(tombstone).matches(Pattern.compile("^deleted-42-\\d+@anonymized\\.local$"));
    }

    @Test
    @DisplayName("buildEmailTombstone: userId null 시 IllegalArgumentException")
    void w3_emailTombstone_nullUserId() {
        assertThatThrownBy(() -> UserAnonymizationService.buildEmailTombstone(null, 1L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("isAlreadyTerminal: ANONYMIZED/HARD_DELETED 만 true")
    void isAlreadyTerminal_classification() {
        User u = new User();
        u.setLifecycleState(LifecycleState.ACTIVE);
        assertThat(UserAnonymizationService.isAlreadyTerminal(u)).isFalse();

        u.setLifecycleState(LifecycleState.WITHDRAWAL_PENDING);
        assertThat(UserAnonymizationService.isAlreadyTerminal(u)).isFalse();

        u.setLifecycleState(LifecycleState.ANONYMIZED);
        assertThat(UserAnonymizationService.isAlreadyTerminal(u)).isTrue();

        u.setLifecycleState(LifecycleState.HARD_DELETED);
        assertThat(UserAnonymizationService.isAlreadyTerminal(u)).isTrue();

        assertThat(UserAnonymizationService.isAlreadyTerminal(null)).isFalse();
    }

    @Test
    @DisplayName("anonymize: SYSTEM actor 일 때 actor_user_id=null + actor_role=SYSTEM 으로 audit 기록")
    void anonymize_systemActor() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(auditLogRepository.save(any(AuditLog.class)))
                .thenReturn(AuditLog.builder().id(11L).build());
        when(personalDataDestructionLogRepository.save(any(PersonalDataDestructionLog.class)))
                .thenReturn(PersonalDataDestructionLog.builder().id(22L).build());

        service.anonymize(USER_ID, Actor.system(), "WITHDRAWAL_GRACE_EXPIRED");

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());
        assertThat(captor.getValue().getActorUserId()).isNull();
        assertThat(captor.getValue().getActorRole()).isEqualTo("SYSTEM");

        ArgumentCaptor<PersonalDataDestructionLog> dCaptor =
                ArgumentCaptor.forClass(PersonalDataDestructionLog.class);
        verify(personalDataDestructionLogRepository).save(dCaptor.capture());
        assertThat(dCaptor.getValue().getExecutedByUserId()).isNull();
    }

    // ---------- Q12-b deleteCommunityBody 옵션 분기 ----------

    @Test
    @DisplayName("Q12-b: withdrawal_options_json=null → community 본문 KEEP (sweep 미호출)")
    void q12b_defaultOption_skipsCommunitySweep() {
        user.setWithdrawalOptionsJson(null);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(auditLogRepository.save(any(AuditLog.class)))
                .thenReturn(AuditLog.builder().id(11L).build());
        when(personalDataDestructionLogRepository.save(any(PersonalDataDestructionLog.class)))
                .thenReturn(PersonalDataDestructionLog.builder().id(22L).build());

        service.anonymize(USER_ID, Actor.system(), "WITHDRAWAL_GRACE_EXPIRED");

        verify(communityPostRepository, never()).saveAll(any());
        verify(communityCommentRepository, never()).saveAll(any());
        assertThat(user.getWithdrawalOptionsJson()).isNull();
    }

    @Test
    @DisplayName("Q12-b: deleteCommunityBody=true → 본인 작성 게시글·댓글 body 익명화 + soft-delete")
    void q12b_optionTrue_anonymizesCommunityBodies() {
        user.setWithdrawalOptionsJson("{\"deleteCommunityBody\":true}");
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(auditLogRepository.save(any(AuditLog.class)))
                .thenReturn(AuditLog.builder().id(11L).build());
        when(personalDataDestructionLogRepository.save(any(PersonalDataDestructionLog.class)))
                .thenReturn(PersonalDataDestructionLog.builder().id(22L).build());

        CommunityPost p1 = new CommunityPost();
        p1.setBody("원본 게시글 본문 1");
        p1.setTenantId(TENANT_ID);
        p1.setIsDeleted(false);
        CommunityPost p2 = new CommunityPost();
        p2.setBody("원본 게시글 본문 2");
        p2.setTenantId(TENANT_ID);
        p2.setIsDeleted(true);
        Mockito.when(communityPostRepository.findByAuthor_Id(USER_ID))
                .thenReturn(Arrays.asList(p1, p2));

        CommunityComment c1 = new CommunityComment();
        c1.setBody("원본 댓글 1");
        c1.setTenantId(TENANT_ID);
        c1.setIsDeleted(false);
        Mockito.when(communityCommentRepository.findByAuthor_Id(USER_ID))
                .thenReturn(Collections.singletonList(c1));

        service.anonymize(USER_ID, Actor.system(), "WITHDRAWAL_GRACE_EXPIRED");

        assertThat(p1.getBody())
                .isEqualTo(UserAnonymizationServiceImpl.COMMUNITY_BODY_TOMBSTONE);
        assertThat(p1.getIsDeleted()).isTrue();
        assertThat(p1.getDeletedAt()).isNotNull();
        assertThat(p2.getBody())
                .isEqualTo(UserAnonymizationServiceImpl.COMMUNITY_BODY_TOMBSTONE);
        assertThat(c1.getBody())
                .isEqualTo(UserAnonymizationServiceImpl.COMMUNITY_BODY_TOMBSTONE);
        assertThat(c1.getIsDeleted()).isTrue();

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<CommunityPost>> postCaptor =
                ArgumentCaptor.forClass(List.class);
        verify(communityPostRepository).saveAll(postCaptor.capture());
        assertThat(postCaptor.getValue()).hasSize(2);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<CommunityComment>> commentCaptor =
                ArgumentCaptor.forClass(List.class);
        verify(communityCommentRepository).saveAll(commentCaptor.capture());
        assertThat(commentCaptor.getValue()).hasSize(1);
    }

    @Test
    @DisplayName("Q12-b: deleteCommunityBody=true 옵션이지만 본인 게시글이 없으면 saveAll 미호출")
    void q12b_optionTrue_noPosts_noSaveAll() {
        user.setWithdrawalOptionsJson("{\"deleteCommunityBody\":true}");
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(auditLogRepository.save(any(AuditLog.class)))
                .thenReturn(AuditLog.builder().id(11L).build());
        when(personalDataDestructionLogRepository.save(any(PersonalDataDestructionLog.class)))
                .thenReturn(PersonalDataDestructionLog.builder().id(22L).build());

        service.anonymize(USER_ID, Actor.system(), "WITHDRAWAL_GRACE_EXPIRED");

        verify(communityPostRepository, never()).saveAll(any());
        verify(communityCommentRepository, never()).saveAll(any());
    }

    @Test
    @DisplayName("Q12-b: legacy/이상한 JSON 값은 안전하게 기본값 (KEEP) 으로 해석")
    void q12b_legacyJson_treatedAsDefault() {
        user.setWithdrawalOptionsJson("{\"deleteCommunityBody\":false,\"unknownLegacy\":true}");
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(auditLogRepository.save(any(AuditLog.class)))
                .thenReturn(AuditLog.builder().id(11L).build());
        when(personalDataDestructionLogRepository.save(any(PersonalDataDestructionLog.class)))
                .thenReturn(PersonalDataDestructionLog.builder().id(22L).build());

        service.anonymize(USER_ID, Actor.system(), "WITHDRAWAL_GRACE_EXPIRED");

        verify(communityPostRepository, never()).saveAll(any());
    }

    // ---------- Phase 4 옵션 b — 작성자 익명화 통합 ----------

    @Test
    @DisplayName("Phase 4 옵션 b: anonymize 호출 시 CommunityAnonymizationService 가 항상 호출된다 "
            + "(reason / actor 전파)")
    void phase4_optionB_invokesCommunityAnonymizationService() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(auditLogRepository.save(any(AuditLog.class)))
                .thenReturn(AuditLog.builder().id(11L).build());
        when(personalDataDestructionLogRepository.save(any(PersonalDataDestructionLog.class)))
                .thenReturn(PersonalDataDestructionLog.builder().id(22L).build());

        service.anonymize(USER_ID, Actor.user(99L, "ADMIN"), "ADMIN_FORCED_DELETION");

        verify(communityAnonymizationService).anonymizeCommunityRecords(
                Mockito.eq(USER_ID), Mockito.eq(TENANT_ID),
                Mockito.eq("ADMIN_FORCED"),
                Mockito.eq(99L), Mockito.eq("ADMIN"));
    }

    @Test
    @DisplayName("Phase 4 옵션 b: DORMANT_AUTO reason 은 audit 표준값 DORMANT_AUTO_4Y 로 정규화")
    void phase4_optionB_dormantReasonNormalized() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(auditLogRepository.save(any(AuditLog.class)))
                .thenReturn(AuditLog.builder().id(11L).build());
        when(personalDataDestructionLogRepository.save(any(PersonalDataDestructionLog.class)))
                .thenReturn(PersonalDataDestructionLog.builder().id(22L).build());

        service.anonymize(USER_ID, Actor.system(), "DORMANT_AUTO_FOUR_YEARS");

        verify(communityAnonymizationService).anonymizeCommunityRecords(
                Mockito.eq(USER_ID), Mockito.eq(TENANT_ID),
                Mockito.eq("DORMANT_AUTO_4Y"),
                Mockito.isNull(), Mockito.eq("SYSTEM"));
    }

    @Test
    @DisplayName("Phase 4 옵션 b: WITHDRAWAL_GRACE_EXPIRED reason 은 SELF_WITHDRAWAL 로 정규화")
    void phase4_optionB_selfWithdrawalReasonNormalized() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(auditLogRepository.save(any(AuditLog.class)))
                .thenReturn(AuditLog.builder().id(11L).build());
        when(personalDataDestructionLogRepository.save(any(PersonalDataDestructionLog.class)))
                .thenReturn(PersonalDataDestructionLog.builder().id(22L).build());

        service.anonymize(USER_ID, Actor.user(USER_ID, "CLIENT"), "WITHDRAWAL_GRACE_EXPIRED");

        verify(communityAnonymizationService).anonymizeCommunityRecords(
                Mockito.eq(USER_ID), Mockito.eq(TENANT_ID),
                Mockito.eq("SELF_WITHDRAWAL"),
                Mockito.eq(USER_ID), Mockito.eq("CLIENT"));
    }

    @Test
    @DisplayName("anonymize: 단일 트랜잭션 내 user/audit/destruction 모두 1회 save")
    void anonymize_singleTransaction_savesAll() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(auditLogRepository.save(any(AuditLog.class)))
                .thenReturn(AuditLog.builder().id(11L).build());
        when(personalDataDestructionLogRepository.save(any(PersonalDataDestructionLog.class)))
                .thenReturn(PersonalDataDestructionLog.builder().id(22L).build());

        service.anonymize(USER_ID, Actor.system(), "REASON");

        verify(userRepository, times(1)).save(any(User.class));
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
        verify(personalDataDestructionLogRepository, times(1))
                .save(any(PersonalDataDestructionLog.class));
    }
}

package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import com.coresolution.consultation.entity.CommunityAnonymizationAudit;
import com.coresolution.consultation.entity.CommunityComment;
import com.coresolution.consultation.entity.CommunityPost;
import com.coresolution.consultation.repository.CommunityAnonymizationAuditRepository;
import com.coresolution.consultation.repository.CommunityCommentRepository;
import com.coresolution.consultation.repository.CommunityPostRepository;
import com.coresolution.consultation.service.CommunityAnonymizationService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link CommunityAnonymizationServiceImpl} 단위 테스트 — Phase 4 옵션 b
 * (USER_LIFECYCLE_TERMINATION_POLICY v1.2 §10.12 Q12).
 *
 * <p>6 시나리오: 0건 / 3건 / 5건 / disabled / tenantId 격리 / audit + body_hash 정합.</p>
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("CommunityAnonymizationServiceImpl — Phase 4 옵션 b 작성자 익명화")
class CommunityAnonymizationServiceImplTest {

    private static final Long USER_ID = 5001L;
    private static final String TENANT_ID = "tenant-community-anon-test";
    private static final String OTHER_TENANT_ID = "tenant-other";
    private static final String REASON = "SELF_WITHDRAWAL";

    @Mock private CommunityPostRepository communityPostRepository;
    @Mock private CommunityCommentRepository communityCommentRepository;
    @Mock private CommunityAnonymizationAuditRepository auditRepository;

    private CommunityAnonymizationServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new CommunityAnonymizationServiceImpl(
                communityPostRepository,
                communityCommentRepository,
                auditRepository,
                true,
                CommunityAnonymizationServiceImpl.DEFAULT_TABLES_CSV);
    }

    @Test
    @DisplayName("0건: 작성한 글이 없으면 audit / saveAll 미호출 + 결과 zero count")
    void zeroRecords_noSaves() {
        when(communityPostRepository.findByAuthor_Id(USER_ID))
                .thenReturn(Collections.emptyList());
        when(communityCommentRepository.findByAuthor_Id(USER_ID))
                .thenReturn(Collections.emptyList());

        CommunityAnonymizationService.Result result =
                service.anonymizeCommunityRecords(
                        USER_ID, TENANT_ID, REASON, 99L, "ADMIN");

        assertThat(result.skipped()).isFalse();
        assertThat(result.postsAnonymized()).isZero();
        assertThat(result.commentsAnonymized()).isZero();
        assertThat(result.auditRecordsCreated()).isZero();
        verify(auditRepository, never()).save(any());
        verify(communityPostRepository, never()).saveAll(any());
        verify(communityCommentRepository, never()).saveAll(any());
    }

    @Test
    @DisplayName("3건 (posts 2 + comments 1): 각 행마다 audit 기록 + 본문 보존 + author_anonymized=true")
    void threeRecords_audit_and_preserveBody() {
        CommunityPost p1 = newPost(11L, TENANT_ID, "본문-1");
        CommunityPost p2 = newPost(12L, TENANT_ID, "본문-2");
        CommunityComment c1 = newComment(21L, TENANT_ID, "댓글-1");
        when(communityPostRepository.findByAuthor_Id(USER_ID)).thenReturn(Arrays.asList(p1, p2));
        when(communityCommentRepository.findByAuthor_Id(USER_ID))
                .thenReturn(Collections.singletonList(c1));

        CommunityAnonymizationService.Result result =
                service.anonymizeCommunityRecords(
                        USER_ID, TENANT_ID, REASON, 99L, "ADMIN");

        assertThat(result.postsAnonymized()).isEqualTo(2);
        assertThat(result.commentsAnonymized()).isEqualTo(1);
        assertThat(result.auditRecordsCreated()).isEqualTo(3);

        // 본문 보존 — 옵션 b 핵심
        assertThat(p1.getBody()).isEqualTo("본문-1");
        assertThat(p2.getBody()).isEqualTo("본문-2");
        assertThat(c1.getBody()).isEqualTo("댓글-1");

        // 플래그 적용
        assertThat(p1.isAuthorAnonymized()).isTrue();
        assertThat(p1.getAuthorAnonymizedAt()).isNotNull();
        assertThat(p2.isAuthorAnonymized()).isTrue();
        assertThat(c1.isAuthorAnonymized()).isTrue();

        verify(communityPostRepository).saveAll(any());
        verify(communityCommentRepository).saveAll(any());
    }

    @Test
    @DisplayName("5건 (posts 3 + comments 2): audit 5건 + body_hash 모두 SHA-256 64자 hex")
    void fiveRecords_bodyHash_format() {
        List<CommunityPost> posts = Arrays.asList(
                newPost(101L, TENANT_ID, "p-a"),
                newPost(102L, TENANT_ID, "p-b"),
                newPost(103L, TENANT_ID, "p-c"));
        List<CommunityComment> comments = Arrays.asList(
                newComment(201L, TENANT_ID, "c-a"),
                newComment(202L, TENANT_ID, "c-b"));
        when(communityPostRepository.findByAuthor_Id(USER_ID)).thenReturn(posts);
        when(communityCommentRepository.findByAuthor_Id(USER_ID)).thenReturn(comments);

        service.anonymizeCommunityRecords(USER_ID, TENANT_ID, REASON, null, "SYSTEM");

        ArgumentCaptor<CommunityAnonymizationAudit> captor =
                ArgumentCaptor.forClass(CommunityAnonymizationAudit.class);
        verify(auditRepository, org.mockito.Mockito.times(5)).save(captor.capture());
        for (CommunityAnonymizationAudit audit : captor.getAllValues()) {
            assertThat(audit.getBodyHash()).hasSize(64);
            assertThat(audit.getBodyHash()).matches("^[0-9a-f]{64}$");
            assertThat(audit.getTenantId()).isEqualTo(TENANT_ID);
            assertThat(audit.getOriginalUserId()).isEqualTo(USER_ID);
            assertThat(audit.getAnonymizationReason()).isEqualTo(REASON);
            assertThat(audit.getActorRole()).isEqualTo("SYSTEM");
            assertThat(audit.getActorUserId()).isNull();
        }
    }

    @Test
    @DisplayName("disabled (enabled=false): SKIPPED 결과 + 어떤 호출도 발생하지 않음")
    void disabled_returnsSkipped() {
        CommunityAnonymizationServiceImpl disabled = new CommunityAnonymizationServiceImpl(
                communityPostRepository,
                communityCommentRepository,
                auditRepository,
                false,
                CommunityAnonymizationServiceImpl.DEFAULT_TABLES_CSV);

        CommunityAnonymizationService.Result result =
                disabled.anonymizeCommunityRecords(
                        USER_ID, TENANT_ID, REASON, 99L, "ADMIN");

        assertThat(result).isEqualTo(CommunityAnonymizationService.Result.SKIPPED);
        verify(communityPostRepository, never()).findByAuthor_Id(anyLong());
        verify(communityCommentRepository, never()).findByAuthor_Id(anyLong());
        verify(auditRepository, never()).save(any());
    }

    @Test
    @DisplayName("tenantId 격리: 다른 테넌트 행은 익명화 대상 외 + audit 미기록")
    void tenantIdIsolation_filtersOutOtherTenants() {
        CommunityPost myPost = newPost(301L, TENANT_ID, "내 글");
        CommunityPost otherTenantPost = newPost(302L, OTHER_TENANT_ID, "타 테넌트 글");
        when(communityPostRepository.findByAuthor_Id(USER_ID))
                .thenReturn(Arrays.asList(myPost, otherTenantPost));
        when(communityCommentRepository.findByAuthor_Id(USER_ID))
                .thenReturn(Collections.emptyList());

        CommunityAnonymizationService.Result result =
                service.anonymizeCommunityRecords(
                        USER_ID, TENANT_ID, REASON, 99L, "ADMIN");

        assertThat(result.postsAnonymized()).isEqualTo(1);
        assertThat(result.auditRecordsCreated()).isEqualTo(1);
        assertThat(myPost.isAuthorAnonymized()).isTrue();
        assertThat(otherTenantPost.isAuthorAnonymized()).isFalse();
        assertThat(otherTenantPost.getBody()).isEqualTo("타 테넌트 글");
    }

    @Test
    @DisplayName("멱등성: 이미 author_anonymized=true 인 행은 SKIP (재차 audit 미기록)")
    void idempotent_alreadyAnonymized_isSkipped() {
        CommunityPost p1 = newPost(401L, TENANT_ID, "이미 익명");
        p1.setAuthorAnonymized(true);
        CommunityPost p2 = newPost(402L, TENANT_ID, "신규 익명");
        when(communityPostRepository.findByAuthor_Id(USER_ID))
                .thenReturn(Arrays.asList(p1, p2));
        when(communityCommentRepository.findByAuthor_Id(USER_ID))
                .thenReturn(Collections.emptyList());

        CommunityAnonymizationService.Result result =
                service.anonymizeCommunityRecords(
                        USER_ID, TENANT_ID, REASON, 99L, "ADMIN");

        assertThat(result.postsAnonymized()).isEqualTo(1);
        assertThat(result.auditRecordsCreated()).isEqualTo(1);
        assertThat(p2.isAuthorAnonymized()).isTrue();
    }

    @Test
    @DisplayName("validation: userId/tenantId/reason 누락 시 IllegalArgumentException")
    void validation_nulls_throw() {
        assertThatThrownBy(() -> service.anonymizeCommunityRecords(
                null, TENANT_ID, REASON, 1L, "ADMIN"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.anonymizeCommunityRecords(
                USER_ID, "", REASON, 1L, "ADMIN"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.anonymizeCommunityRecords(
                USER_ID, TENANT_ID, " ", 1L, "ADMIN"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("parseTables: CSV 파싱 — 공백/빈 토큰 제거 + 소문자 정규화")
    void parseTables_csvNormalization() {
        java.util.Set<String> tables = CommunityAnonymizationServiceImpl
                .parseTables(" Community_Posts ,community_comments,, ");
        assertThat(tables).containsExactlyInAnyOrder(
                "community_posts", "community_comments");
    }

    @Test
    @DisplayName("sha256Hex: 동일 입력 동일 출력 + null 입력 안전 처리")
    void sha256Hex_deterministic_and_nullSafe() {
        String a = CommunityAnonymizationServiceImpl.sha256Hex("hello");
        String b = CommunityAnonymizationServiceImpl.sha256Hex("hello");
        String n = CommunityAnonymizationServiceImpl.sha256Hex(null);
        assertThat(a).isEqualTo(b).hasSize(64);
        assertThat(n).hasSize(64);
        assertThat(a).isNotEqualTo(n);
    }

    private static CommunityPost newPost(Long id, String tenantId, String body) {
        CommunityPost p = new CommunityPost();
        p.setId(id);
        p.setTenantId(tenantId);
        p.setBody(body);
        return p;
    }

    private static CommunityComment newComment(Long id, String tenantId, String body) {
        CommunityComment c = new CommunityComment();
        c.setId(id);
        c.setTenantId(tenantId);
        c.setBody(body);
        return c;
    }
}

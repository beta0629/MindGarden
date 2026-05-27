package com.coresolution.consultation.service.impl;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import com.coresolution.consultation.entity.CommunityAnonymizationAudit;
import com.coresolution.consultation.entity.CommunityComment;
import com.coresolution.consultation.entity.CommunityPost;
import com.coresolution.consultation.repository.CommunityAnonymizationAuditRepository;
import com.coresolution.consultation.repository.CommunityCommentRepository;
import com.coresolution.consultation.repository.CommunityPostRepository;
import com.coresolution.consultation.service.CommunityAnonymizationService;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link CommunityAnonymizationService} 기본 구현 — Phase 4 옵션 b
 * (USER_LIFECYCLE_TERMINATION_POLICY v1.2 §10.12 Q12).
 *
 * <p>옵션 b 핵심: 본문은 절대 변경하지 않고 {@code author_anonymized} 플래그만 토글한다.
 * UI 가 본 플래그를 기준으로 "[삭제된 사용자]" 노출 분기. audit 행은 행마다 1건 INSERT.</p>
 *
 * <p>토글: 호출자 흐름 단위 SKIP 은 {@code mindgarden.lifecycle.community-anonymization.enabled}
 * (default true) 로 application.yml 에서 제어. tables 토글
 * {@code mindgarden.lifecycle.community-anonymization.tables} 는 "community_posts" 또는
 * "community_comments" 가 포함된 경우에만 해당 테이블을 처리한다 (기본 둘 다).</p>
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
@Slf4j
@Service
@Transactional(propagation = Propagation.MANDATORY)
public class CommunityAnonymizationServiceImpl implements CommunityAnonymizationService {

    /** application.yml 토글 — feature flag 미설정 시 안전 default true. */
    static final String DEFAULT_TABLES_CSV = "community_posts,community_comments";

    /** body 가 null 일 때 hash 계산에 사용하는 fixed 표식 — body 컬럼 NOT NULL 이므로 도달 드묾. */
    static final String NULL_BODY_HASH_INPUT = "<null>";

    private final CommunityPostRepository communityPostRepository;
    private final CommunityCommentRepository communityCommentRepository;
    private final CommunityAnonymizationAuditRepository auditRepository;
    private final boolean enabled;
    private final Set<String> enabledTables;

    /**
     * 생성자 — application.yml 토글 주입.
     *
     * @param communityPostRepository      community_posts 저장소
     * @param communityCommentRepository   community_comments 저장소
     * @param auditRepository              audit 저장소
     * @param enabled                      전체 feature flag
     *                                     (mindgarden.lifecycle.community-anonymization.enabled)
     * @param tablesCsv                    처리 대상 테이블 콤마 구분 CSV
     *                                     (mindgarden.lifecycle.community-anonymization.tables)
     */
    public CommunityAnonymizationServiceImpl(
            CommunityPostRepository communityPostRepository,
            CommunityCommentRepository communityCommentRepository,
            CommunityAnonymizationAuditRepository auditRepository,
            @Value("${mindgarden.lifecycle.community-anonymization.enabled:true}") boolean enabled,
            @Value("${mindgarden.lifecycle.community-anonymization.tables:"
                    + DEFAULT_TABLES_CSV + "}") String tablesCsv) {
        this.communityPostRepository = communityPostRepository;
        this.communityCommentRepository = communityCommentRepository;
        this.auditRepository = auditRepository;
        this.enabled = enabled;
        this.enabledTables = parseTables(tablesCsv);
    }

    @Override
    public Result anonymizeCommunityRecords(
            Long userId, String tenantId, String reason, Long actorUserId, String actorRole) {
        if (userId == null) {
            throw new IllegalArgumentException("userId must not be null");
        }
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalArgumentException("tenantId must not be blank");
        }
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("reason must not be blank");
        }
        if (!enabled) {
            log.info("[CommunityAnonymization] feature disabled — SKIP userId={}, tenantId={}",
                    userId, tenantId);
            return Result.SKIPPED;
        }

        LocalDateTime now = LocalDateTime.now();
        int postsCount = 0;
        int commentsCount = 0;
        int auditCount = 0;

        if (enabledTables.contains(CommunityAnonymizationAudit.TABLE_COMMUNITY_POSTS)) {
            List<CommunityPost> posts = communityPostRepository.findByAuthor_Id(userId).stream()
                    .filter(p -> tenantId.equals(p.getTenantId()))
                    .filter(p -> !p.isAuthorAnonymized())
                    .collect(Collectors.toList());
            for (CommunityPost post : posts) {
                String bodyHash = sha256Hex(post.getBody());
                CommunityAnonymizationAudit audit = CommunityAnonymizationAudit.builder()
                        .tenantId(tenantId)
                        .originalUserId(userId)
                        .communityTable(CommunityAnonymizationAudit.TABLE_COMMUNITY_POSTS)
                        .recordId(post.getId())
                        .anonymizedAt(now)
                        .anonymizationReason(reason)
                        .bodyHash(bodyHash)
                        .actorUserId(actorUserId)
                        .actorRole(actorRole)
                        .build();
                auditRepository.save(audit);
                post.setAuthorAnonymized(true);
                post.setAuthorAnonymizedAt(now);
                postsCount++;
                auditCount++;
            }
            if (!posts.isEmpty()) {
                communityPostRepository.saveAll(posts);
            }
        }

        if (enabledTables.contains(CommunityAnonymizationAudit.TABLE_COMMUNITY_COMMENTS)) {
            List<CommunityComment> comments = communityCommentRepository.findByAuthor_Id(userId)
                    .stream()
                    .filter(c -> tenantId.equals(c.getTenantId()))
                    .filter(c -> !c.isAuthorAnonymized())
                    .collect(Collectors.toList());
            for (CommunityComment comment : comments) {
                String bodyHash = sha256Hex(comment.getBody());
                CommunityAnonymizationAudit audit = CommunityAnonymizationAudit.builder()
                        .tenantId(tenantId)
                        .originalUserId(userId)
                        .communityTable(CommunityAnonymizationAudit.TABLE_COMMUNITY_COMMENTS)
                        .recordId(comment.getId())
                        .anonymizedAt(now)
                        .anonymizationReason(reason)
                        .bodyHash(bodyHash)
                        .actorUserId(actorUserId)
                        .actorRole(actorRole)
                        .build();
                auditRepository.save(audit);
                comment.setAuthorAnonymized(true);
                comment.setAuthorAnonymizedAt(now);
                commentsCount++;
                auditCount++;
            }
            if (!comments.isEmpty()) {
                communityCommentRepository.saveAll(comments);
            }
        }

        log.info("[CommunityAnonymization] complete — userId={}, tenantId={}, reason={}, "
                        + "posts={}, comments={}, audit={}",
                userId, tenantId, reason, postsCount, commentsCount, auditCount);

        return new Result(postsCount, commentsCount, auditCount, false);
    }

    /**
     * tables CSV 파싱. 공백·빈 토큰 무시. 미식별 테이블명은 보존 (운영 정책에서 신규 테이블 추가
     * 시 코드 수정 없이 토글로 활성화 가능하도록).
     *
     * @param csv "community_posts,community_comments" 형식
     * @return 소문자 정규화된 테이블명 집합
     */
    static Set<String> parseTables(String csv) {
        if (csv == null || csv.isBlank()) {
            return Set.of();
        }
        return java.util.Arrays.stream(csv.split(","))
                .map(String::trim)
                .map(String::toLowerCase)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toUnmodifiableSet());
    }

    /**
     * SHA-256 hex digest — audit body hash 용. null 입력은 안전 표식 hash 반환.
     *
     * @param value 본문 (null 허용)
     * @return 64자 hex digest
     */
    static String sha256Hex(String value) {
        String input = value != null ? value : NULL_BODY_HASH_INPUT;
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(bytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}

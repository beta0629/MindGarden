package com.coresolution.consultation.service.impl;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

import com.coresolution.consultation.constant.AuditAction;
import com.coresolution.consultation.constant.DestructionType;
import com.coresolution.consultation.constant.LegalBasis;
import com.coresolution.consultation.constant.LifecycleState;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.lifecycle.Actor;
import com.coresolution.consultation.dto.lifecycle.AnonymizeResult;
import com.coresolution.consultation.dto.lifecycle.WithdrawalOptions;
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
import com.coresolution.consultation.service.UserAnonymizationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link UserAnonymizationService} 기본 구현.
 *
 * <p>단일 트랜잭션 보장 — PII 치환·email tombstone·audit_logs·destruction_logs 를 모두
 * {@code @Transactional} 안에서 수행한다. SHA-256 해시는 audit trail 만을 위해 destruction
 * log 에 적재되며 원본 PII 는 보존하지 않는다 (PIPA §16).</p>
 *
 * @author CoreSolution
 * @since 2026-06-05
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserAnonymizationServiceImpl implements UserAnonymizationService {

    /** 익명화 처리 영향 받는 users 컬럼 목록 — destruction log JSON 적재 SSOT. */
    static final List<String> AFFECTED_USER_COLUMNS = List.of(
            "user_id", "email", "password", "name", "nickname", "phone",
            "gender", "birth_date", "rrn_encrypted",
            "address", "address_detail", "postal_code",
            "profile_image_url", "memo", "notes",
            "social_provider", "social_provider_user_id", "is_social_account",
            "email_verification_token", "password_reset_token");

    /** Q12-b 본문도 삭제 옵션 적용 시 본문 자리에 적재되는 surrogate (운영 노출 안전). */
    static final String COMMUNITY_BODY_TOMBSTONE = "[작성자 탈퇴로 함께 삭제된 본문입니다.]";

    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final PersonalDataDestructionLogRepository personalDataDestructionLogRepository;
    private final CommunityPostRepository communityPostRepository;
    private final CommunityCommentRepository communityCommentRepository;

    @Override
    @Transactional
    public AnonymizeResult anonymize(Long userId, Actor actor, String reason) {
        if (userId == null) {
            throw new IllegalArgumentException("userId must not be null");
        }
        if (actor == null) {
            throw new IllegalArgumentException("actor must not be null");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        if (UserAnonymizationService.isAlreadyTerminal(user)) {
            log.info("UserAnonymizationService: user {} already terminal ({}) — idempotent skip",
                    userId, user.getLifecycleState());
            return AnonymizeResult.builder()
                    .userId(userId)
                    .emailTombstone(user.getEmail())
                    .anonymizedAt(LocalDateTime.now())
                    .build();
        }

        LocalDateTime now = LocalDateTime.now();
        long epochSeconds = now.toEpochSecond(ZoneOffset.UTC);

        String beforeEmail = user.getEmail();
        String beforeName = user.getName();
        String beforePhone = user.getPhone();
        String beforeEmailHash = sha256Hex(beforeEmail);
        String beforeNameHash = sha256Hex(beforeName);
        String beforePhoneHash = sha256Hex(beforePhone);

        // Q12-b 본인 옵션 — community body 처리 분기 (PII 매트릭스 적용 전 시점에 분리 적용)
        WithdrawalOptions options =
                WithdrawalOptions.fromJsonOrDefaults(user.getWithdrawalOptionsJson());
        CommunitySweepResult communitySweep = applyCommunityBodyOption(userId, options, now);

        // PII 매트릭스 적용 — §3.2 users 표
        applyUsersPiiMatrix(user, epochSeconds);
        // 보관된 옵션 정리 — ANONYMIZED 후에는 더 이상 필요 없음
        user.setWithdrawalOptionsJson(null);

        userRepository.save(user);

        // audit_logs 기록 (W1 SSOT)
        AuditLog auditEntry = AuditLog.builder()
                .tenantId(user.getTenantId())
                .actorUserId(actor.getActorUserId())
                .actorRole(actor.getActorRole())
                .targetUserId(userId)
                .action(AuditAction.USER_ANONYMIZE)
                .entityType("USER")
                .entityId(userId)
                .build();
        AuditLog savedAudit = auditLogRepository.save(auditEntry);

        // personal_data_destruction_logs 기록 (PIPA §16)
        PersonalDataDestructionLog destruction = PersonalDataDestructionLog.builder()
                .tenantId(user.getTenantId())
                .targetUserId(userId)
                .destructionType(DestructionType.ANONYMIZE)
                .piiColumnsAffected(buildAffectedColumnsJson())
                .beforeEmailHash(beforeEmailHash)
                .beforeNameHash(beforeNameHash)
                .beforePhoneHash(beforePhoneHash)
                .executedByUserId(actor.getActorUserId())
                .executionReason(reason)
                .legalBasis(resolveLegalBasis(reason))
                .executedAt(now)
                .build();
        PersonalDataDestructionLog savedDestruction =
                personalDataDestructionLogRepository.save(destruction);

        log.info("[Lifecycle] anonymize complete: userId={}, actor={}, reason={}, "
                        + "communityPostsAnonymized={}, communityCommentsAnonymized={}",
                userId, actor, reason,
                communitySweep.posts, communitySweep.comments);

        return AnonymizeResult.builder()
                .userId(userId)
                .emailTombstone(user.getEmail())
                .piiColumnsAffected(AFFECTED_USER_COLUMNS)
                .auditLogId(savedAudit.getId())
                .destructionLogId(savedDestruction.getId())
                .anonymizedAt(now)
                .build();
    }

    /**
     * Q12-b — 본인 옵션 "본문도 삭제" 처리.
     *
     * <p>{@code deleteCommunityBody=false} (default) 인 경우 author 익명화만 수행 (본 service 가
     * users 테이블의 PII 만 처리하므로 자식 author 참조는 자동 해소). 본문은 KEEP.</p>
     *
     * <p>{@code deleteCommunityBody=true} 인 경우 본인이 작성한 모든 게시글·댓글의 body 를
     * {@link #COMMUNITY_BODY_TOMBSTONE} 으로 치환하고 soft-delete 처리한다. body 컬럼이
     * NOT NULL 이므로 NULL 대신 surrogate 사용.</p>
     *
     * @param userId  대상 users.id
     * @param options 본인 옵션
     * @param now     처리 시각 (deletedAt 적용용)
     * @return 본 회차에 처리된 community 행 수 (audit/log 용)
     */
    CommunitySweepResult applyCommunityBodyOption(
            Long userId, WithdrawalOptions options, LocalDateTime now) {
        if (options == null || !options.isDeleteCommunityBody()) {
            return CommunitySweepResult.NONE;
        }

        int postCount = 0;
        int commentCount = 0;

        List<CommunityPost> posts = communityPostRepository.findByAuthor_Id(userId);
        for (CommunityPost post : posts) {
            // 이미 isDeleted 인 행도 body 는 한 번 더 익명화 — idempotent 보장 + 잔존 PII 차단
            post.setBody(COMMUNITY_BODY_TOMBSTONE);
            if (!Boolean.TRUE.equals(post.getIsDeleted())) {
                post.setIsDeleted(true);
                post.setDeletedAt(now);
            }
            postCount++;
        }
        if (!posts.isEmpty()) {
            communityPostRepository.saveAll(posts);
        }

        List<CommunityComment> comments = communityCommentRepository.findByAuthor_Id(userId);
        for (CommunityComment comment : comments) {
            comment.setBody(COMMUNITY_BODY_TOMBSTONE);
            if (!Boolean.TRUE.equals(comment.getIsDeleted())) {
                comment.setIsDeleted(true);
                comment.setDeletedAt(now);
            }
            commentCount++;
        }
        if (!comments.isEmpty()) {
            communityCommentRepository.saveAll(comments);
        }

        return new CommunitySweepResult(postCount, commentCount);
    }

    /** community sweep 처리 결과 — log 용. */
    static final class CommunitySweepResult {
        static final CommunitySweepResult NONE = new CommunitySweepResult(0, 0);
        final int posts;
        final int comments;
        CommunitySweepResult(int posts, int comments) {
            this.posts = posts;
            this.comments = comments;
        }
    }

    /**
     * §3.2 users 표 PII 매트릭스 적용.
     *
     * <p>이 메서드는 단순 setter 만 호출하며 영속화 (save) 는 호출자가 수행한다.</p>
     *
     * @param user         대상 user (mutable)
     * @param epochSeconds W3 email tombstone 의 epoch (호출자가 단일 시각으로 결정)
     */
    void applyUsersPiiMatrix(User user, long epochSeconds) {
        String uuidShort = UUID.randomUUID().toString().replace("-", "");
        // ANONYMIZE — surrogate 치환 (UNIQUE 점유 회피)
        user.setUserId("anon-" + uuidShort);
        user.setEmail(UserAnonymizationService.buildEmailTombstone(user.getId(), epochSeconds));
        user.setName("이용종료-" + uuidShort.substring(0, 8));
        user.setPhone("000-0000-" + uuidShort.substring(0, 4));

        // TOMBSTONE — null/빈 값 (UNIQUE 자동 해제)
        user.setPassword(null);
        user.setNickname(null);
        user.setGender(null);
        user.setBirthDate(null);
        user.setRrnEncrypted(null);
        user.setAddress(null);
        user.setAddressDetail(null);
        user.setPostalCode(null);
        user.setProfileImageUrl(null);
        user.setMemo(null);
        user.setNotes(null);

        // 소셜 토큰류 TOMBSTONE
        user.setSocialProvider(null);
        user.setSocialProviderUserId(null);
        user.setSocialLinkedAt(null);
        user.setIsSocialAccount(false);

        // 이메일 / 비밀번호 토큰 무효화
        user.setEmailVerificationToken(null);
        user.setEmailVerificationExpiresAt(null);
        user.setPasswordResetToken(null);
        user.setPasswordResetExpiresAt(null);

        // Q7 — CONSULTANT specialization KEEP (통계 우선)
        if (user.getRole() != UserRole.CONSULTANT) {
            user.setSpecialization(null);
            user.setSpecialty(null);
        }

        // SSOT 상태 전이 — ANONYMIZED 종착
        user.setLifecycleState(LifecycleState.ANONYMIZED);
        // is_active=false 도 동기 (운영적 정지 의미는 별개지만 익명화 사용자 로그인 차단 강제)
        user.setActive(false);
        // 자발 탈퇴 신청 시각 정리 (재가입 시 신규 stamp)
        user.setWithdrawalRequestedAt(null);
        user.setUpdatedAt(LocalDateTime.now());
    }

    /**
     * SHA-256 hex digest. {@code null} 입력은 {@code null} 반환 (해시 불가).
     *
     * @param value 원본
     * @return 64자 hex 또는 null
     */
    static String sha256Hex(String value) {
        if (value == null) {
            return null;
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(bytes);
        } catch (NoSuchAlgorithmException e) {
            // SHA-256 은 표준 — 도달 불가 경로
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    /**
     * 사유에 따른 legal_basis 매핑 (§5).
     */
    static LegalBasis resolveLegalBasis(String reason) {
        if (reason == null) {
            return LegalBasis.PIPA_36;
        }
        String upper = reason.toUpperCase();
        if (upper.contains("ADMIN") || upper.contains("FORCED")) {
            return LegalBasis.ADMIN_FORCED;
        }
        if (upper.contains("DORMANT")) {
            return LegalBasis.PIPA_39_6;
        }
        if (upper.contains("HARD_DELETE")) {
            return LegalBasis.PIPA_39_7;
        }
        if (upper.contains("GDPR")) {
            return LegalBasis.GDPR_17;
        }
        return LegalBasis.PIPA_36;
    }

    /**
     * destruction_logs.pii_columns_affected JSON 본문 빌드.
     *
     * <p>JSON-builder 라이브러리 의존을 피하기 위해 단순 string 조립. SQL JSON 컬럼은
     * MySQL 8 이 자체 검증한다.</p>
     */
    static String buildAffectedColumnsJson() {
        StringBuilder sb = new StringBuilder("[");
        boolean first = true;
        for (String column : AFFECTED_USER_COLUMNS) {
            if (!first) {
                sb.append(",");
            }
            sb.append("\"").append(column).append("\"");
            first = false;
        }
        sb.append("]");
        return sb.toString();
    }

    /** 호출자 검증용 affected columns 게터. */
    List<String> affectedColumns() {
        return new ArrayList<>(AFFECTED_USER_COLUMNS);
    }
}

package com.coresolution.consultation.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.coresolution.consultation.entity.CommunityAnonymizationAudit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link CommunityAnonymizationAuditRepository} 통합 회귀 — Phase 4.
 *
 * <p>H2 (MySQL 모드) 위에서 Flyway V20260606_005 가 생성한 {@code
 * community_anonymization_audit} 테이블에 audit 행이 정상 저장/조회되며 tenant 격리가
 * 보장됨을 검증한다. ddl-auto=update 가 Hibernate 매핑 ↔ Flyway 스키마 정합도 함께
 * 검증한다.</p>
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@Transactional
@ActiveProfiles("test")
@DisplayName("CommunityAnonymizationAudit Repository 회귀")
class CommunityAnonymizationAuditRepositoryTest {

    @Autowired
    private CommunityAnonymizationAuditRepository repository;

    @Test
    @DisplayName("save + findByTenantIdAndOriginalUserId + tenant 격리")
    void save_find_tenant_isolation() {
        String tenantA = UUID.randomUUID().toString();
        String tenantB = UUID.randomUUID().toString();
        Long userId = 9090L;
        LocalDateTime now = LocalDateTime.now();

        CommunityAnonymizationAudit a1 = CommunityAnonymizationAudit.builder()
                .tenantId(tenantA)
                .originalUserId(userId)
                .communityTable(CommunityAnonymizationAudit.TABLE_COMMUNITY_POSTS)
                .recordId(1001L)
                .anonymizedAt(now)
                .anonymizationReason("SELF_WITHDRAWAL")
                .bodyHash("a".repeat(64))
                .actorUserId(userId)
                .actorRole("CLIENT")
                .build();
        CommunityAnonymizationAudit a2 = CommunityAnonymizationAudit.builder()
                .tenantId(tenantA)
                .originalUserId(userId)
                .communityTable(CommunityAnonymizationAudit.TABLE_COMMUNITY_COMMENTS)
                .recordId(2002L)
                .anonymizedAt(now)
                .anonymizationReason("SELF_WITHDRAWAL")
                .bodyHash("b".repeat(64))
                .actorUserId(userId)
                .actorRole("CLIENT")
                .build();
        CommunityAnonymizationAudit other = CommunityAnonymizationAudit.builder()
                .tenantId(tenantB)
                .originalUserId(userId)
                .communityTable(CommunityAnonymizationAudit.TABLE_COMMUNITY_POSTS)
                .recordId(3003L)
                .anonymizedAt(now)
                .anonymizationReason("ADMIN_FORCED")
                .bodyHash("c".repeat(64))
                .actorRole("ADMIN")
                .build();

        repository.save(a1);
        repository.save(a2);
        repository.save(other);

        List<CommunityAnonymizationAudit> tenantARecords =
                repository.findByTenantIdAndOriginalUserId(tenantA, userId);
        assertThat(tenantARecords).hasSize(2);
        assertThat(tenantARecords).extracting(CommunityAnonymizationAudit::getRecordId)
                .containsExactlyInAnyOrder(1001L, 2002L);

        long countA = repository.countByTenantIdAndOriginalUserId(tenantA, userId);
        long countB = repository.countByTenantIdAndOriginalUserId(tenantB, userId);
        assertThat(countA).isEqualTo(2L);
        assertThat(countB).isEqualTo(1L);
    }
}

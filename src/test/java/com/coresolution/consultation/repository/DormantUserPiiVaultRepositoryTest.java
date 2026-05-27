package com.coresolution.consultation.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.coresolution.consultation.entity.DormantUserPiiVault;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link DormantUserPiiVaultRepository} JPA 매핑 + tenant 격리 회귀 — Phase 3.
 *
 * <p>H2 (MySQL 모드, Hibernate ddl-auto=update) 위에서 vault 행 저장·조회·UNIQUE 가드를
 * 검증한다. encrypted_pii JSON 컬럼·인덱스 매핑은 Flyway 적용 없이 ddl-auto 가
 * 엔티티에서 생성한 컬럼 정의를 통해 직접 검증된다.</p>
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@Transactional
@ActiveProfiles("test")
@DisplayName("DormantUserPiiVault Repository 회귀")
class DormantUserPiiVaultRepositoryTest {

    @Autowired
    private DormantUserPiiVaultRepository repository;

    @Test
    @DisplayName("save + findByUserIdAndTenantId + tenant 격리")
    void save_find_tenant_filter() {
        String tenantA = UUID.randomUUID().toString();
        String tenantB = UUID.randomUUID().toString();
        Long userId = 7777L;
        LocalDateTime now = LocalDateTime.now();

        DormantUserPiiVault vaultA = DormantUserPiiVault.builder()
                .userId(userId)
                .encryptedPii("{\"v\":1,\"nonce\":\"a\"}")
                .dormantEnteredAt(now)
                .anonymizeScheduledAt(now.plusYears(4))
                .build();
        vaultA.setTenantId(tenantA);
        repository.save(vaultA);

        DormantUserPiiVault vaultB = DormantUserPiiVault.builder()
                .userId(userId)  // 동일 user_id 지만 tenant 다름 → UNIQUE 허용
                .encryptedPii("{\"v\":1,\"nonce\":\"b\"}")
                .dormantEnteredAt(now)
                .anonymizeScheduledAt(now.plusYears(4))
                .build();
        vaultB.setTenantId(tenantB);
        repository.save(vaultB);

        assertThat(repository.findByUserIdAndTenantId(userId, tenantA))
                .isPresent()
                .get()
                .extracting(DormantUserPiiVault::getEncryptedPii)
                .isEqualTo("{\"v\":1,\"nonce\":\"a\"}");

        assertThat(repository.findByUserIdAndTenantId(userId, tenantB))
                .isPresent()
                .get()
                .extracting(DormantUserPiiVault::getEncryptedPii)
                .isEqualTo("{\"v\":1,\"nonce\":\"b\"}");
    }

    @Test
    @DisplayName("findDueForAnonymization: anonymize_scheduled_at < cutoff 만 조회")
    void findDueForAnonymization_returns_only_expired() {
        String tenantA = UUID.randomUUID().toString();
        LocalDateTime now = LocalDateTime.now();

        DormantUserPiiVault expired = DormantUserPiiVault.builder()
                .userId(2001L)
                .encryptedPii("{\"v\":1}")
                .dormantEnteredAt(now.minusYears(5))
                .anonymizeScheduledAt(now.minusDays(1))
                .build();
        expired.setTenantId(tenantA);
        repository.save(expired);

        DormantUserPiiVault future = DormantUserPiiVault.builder()
                .userId(2002L)
                .encryptedPii("{\"v\":1}")
                .dormantEnteredAt(now.minusYears(1))
                .anonymizeScheduledAt(now.plusYears(3))
                .build();
        future.setTenantId(tenantA);
        repository.save(future);

        List<DormantUserPiiVault> due = repository.findDueForAnonymization(now);
        assertThat(due)
                .extracting(DormantUserPiiVault::getUserId)
                .as("만료된 vault 만 반환 — 미래 anonymize 행은 제외")
                .contains(2001L)
                .doesNotContain(2002L);
    }

    @Test
    @DisplayName("findDueForPreNotice: pre_notice_sent_at IS NULL + 30일 임계만 조회")
    void findDueForPreNotice_returns_only_unsent_within_window() {
        String tenantA = UUID.randomUUID().toString();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime preNoticeCutoff = now.plusDays(30);

        DormantUserPiiVault dueSoon = DormantUserPiiVault.builder()
                .userId(3001L)
                .encryptedPii("{\"v\":1}")
                .dormantEnteredAt(now.minusYears(4))
                .anonymizeScheduledAt(now.plusDays(15))  // 30일 이내
                .build();
        dueSoon.setTenantId(tenantA);
        repository.save(dueSoon);

        DormantUserPiiVault alreadySent = DormantUserPiiVault.builder()
                .userId(3002L)
                .encryptedPii("{\"v\":1}")
                .dormantEnteredAt(now.minusYears(4))
                .anonymizeScheduledAt(now.plusDays(20))
                .preNoticeSentAt(now.minusDays(5))  // 이미 발송됨
                .preNoticeChannel("EMAIL")
                .build();
        alreadySent.setTenantId(tenantA);
        repository.save(alreadySent);

        DormantUserPiiVault tooFar = DormantUserPiiVault.builder()
                .userId(3003L)
                .encryptedPii("{\"v\":1}")
                .dormantEnteredAt(now.minusYears(1))
                .anonymizeScheduledAt(now.plusYears(3))  // 30일 초과
                .build();
        tooFar.setTenantId(tenantA);
        repository.save(tooFar);

        List<DormantUserPiiVault> due = repository.findDueForPreNotice(preNoticeCutoff);
        assertThat(due)
                .extracting(DormantUserPiiVault::getUserId)
                .as("30일 이내 + 미발송 vault 만 반환")
                .contains(3001L)
                .doesNotContain(3002L, 3003L);
    }

    @Test
    @DisplayName("UNIQUE (user_id, tenant_id) 위반 시 DataIntegrityViolationException")
    void uniqueConstraint_violation_throws() {
        String tenantA = UUID.randomUUID().toString();
        Long userId = 4001L;
        LocalDateTime now = LocalDateTime.now();

        DormantUserPiiVault first = DormantUserPiiVault.builder()
                .userId(userId)
                .encryptedPii("{\"v\":1,\"nonce\":\"first\"}")
                .dormantEnteredAt(now)
                .anonymizeScheduledAt(now.plusYears(4))
                .build();
        first.setTenantId(tenantA);
        repository.saveAndFlush(first);

        DormantUserPiiVault duplicate = DormantUserPiiVault.builder()
                .userId(userId)
                .encryptedPii("{\"v\":1,\"nonce\":\"second\"}")
                .dormantEnteredAt(now)
                .anonymizeScheduledAt(now.plusYears(4))
                .build();
        duplicate.setTenantId(tenantA);

        assertThatThrownBy(() -> repository.saveAndFlush(duplicate))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("countByTenantIdActive: tenant 별 격리 카운트")
    void countByTenantIdActive_isolates_tenants() {
        String tenantA = UUID.randomUUID().toString();
        String tenantB = UUID.randomUUID().toString();
        LocalDateTime now = LocalDateTime.now();

        for (long userId = 5001L; userId <= 5003L; userId++) {
            DormantUserPiiVault v = DormantUserPiiVault.builder()
                    .userId(userId)
                    .encryptedPii("{\"v\":1}")
                    .dormantEnteredAt(now)
                    .anonymizeScheduledAt(now.plusYears(4))
                    .build();
            v.setTenantId(tenantA);
            repository.save(v);
        }
        DormantUserPiiVault tenantBVault = DormantUserPiiVault.builder()
                .userId(5999L)
                .encryptedPii("{\"v\":1}")
                .dormantEnteredAt(now)
                .anonymizeScheduledAt(now.plusYears(4))
                .build();
        tenantBVault.setTenantId(tenantB);
        repository.save(tenantBVault);

        assertThat(repository.countByTenantIdActive(tenantA)).isEqualTo(3L);
        assertThat(repository.countByTenantIdActive(tenantB)).isEqualTo(1L);
    }
}

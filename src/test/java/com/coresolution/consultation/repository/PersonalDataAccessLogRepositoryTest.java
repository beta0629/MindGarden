package com.coresolution.consultation.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.coresolution.consultation.entity.PersonalDataAccessLog;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

/**
 * W2 P0 회귀 — {@link PersonalDataAccessLog#getTargetUserId()} 의 {@code String → Long} 정착.
 *
 * <p>V20260604_002 적용으로 운영 DB 의 {@code personal_data_access_logs.target_user_id} 컬럼이
 * VARCHAR(255) → BIGINT 로 정착되었고, 본 entity 도 동일하게 {@code Long} 으로 정합화되었다.
 * 본 테스트는 (1) 새 시그니처로 save·조회가 가능한지 (2) {@link PersonalDataAccessLogRepository}
 * 의 새 시그니처 메서드가 Long 으로 정확히 동작하는지를 확인한다.</p>
 *
 * @author CoreSolution
 * @since 2026-06-04
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@Transactional
@ActiveProfiles("test")
@DisplayName("PersonalDataAccessLog targetUserId Long 정착 회귀 (W2 P0)")
class PersonalDataAccessLogRepositoryTest {

    @Autowired
    private PersonalDataAccessLogRepository repository;

    @Test
    @DisplayName("targetUserId 가 Long 으로 저장·조회된다")
    void save_long_targetUserId_roundtrip() {
        String tenantA = UUID.randomUUID().toString();
        Long targetUserId = 8008L;

        PersonalDataAccessLog log = PersonalDataAccessLog.builder()
                .accessorId("accessor-1")
                .accessorName("Tester")
                .dataType("USER_INFO")
                .accessType("READ")
                .targetUserId(targetUserId)
                .targetUserName("Target")
                .reason("Compliance audit")
                .result("SUCCESS")
                .build();
        log.setTenantId(tenantA);
        PersonalDataAccessLog saved = repository.save(log);

        PersonalDataAccessLog found = repository.findById(saved.getId()).orElseThrow();
        assertThat(found.getTargetUserId())
                .as("targetUserId 는 Long 타입이며 동일한 값으로 round-trip")
                .isEqualTo(targetUserId);
    }

    @Test
    @DisplayName("findByTenantIdAndTargetUserIdAndAccessTimeBetween 는 Long 시그니처로 동작")
    void findByTenantAndTargetUserId_long_signature() {
        String tenantA = UUID.randomUUID().toString();
        Long targetUserId = 9009L;
        LocalDateTime now = LocalDateTime.now();

        PersonalDataAccessLog log = PersonalDataAccessLog.builder()
                .accessorId("accessor-2")
                .dataType("CONSULTATION_RECORD")
                .accessType("EXPORT")
                .targetUserId(targetUserId)
                .result("SUCCESS")
                .build();
        log.setTenantId(tenantA);
        repository.save(log);

        List<PersonalDataAccessLog> rows = repository.findByTenantIdAndTargetUserIdAndAccessTimeBetween(
                tenantA, targetUserId, now.minusDays(1), now.plusDays(1));

        assertThat(rows)
                .as("Long 시그니처로 tenantId + targetUserId 범위 검색 정상")
                .hasSize(1)
                .first()
                .extracting(PersonalDataAccessLog::getTargetUserId)
                .isEqualTo(targetUserId);
    }
}

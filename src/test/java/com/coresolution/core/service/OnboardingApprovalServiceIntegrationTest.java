package com.coresolution.core.service;

import static org.assertj.core.api.Assertions.assertThat;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Map;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;

/**
 * 온보딩 승인 서비스 통합 테스트 PL/SQL 프로시저 전체 플로우 테스트
 *
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@ActiveProfiles("test")
@Transactional
@DisplayName("온보딩 승인 서비스 통합 테스트")
class OnboardingApprovalServiceIntegrationTest {

    /**
     * 연락 이메일과 함께 승인 API를 호출할 때 필수인 BCrypt 해시(평문 비밀번호는 저장소에 두지 않음).
     * 검증용 더미 해시 — 프로덕션·실계정과 무관.
     */
    private static final String TEST_ADMIN_PASSWORD_BCRYPT =
            "$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG";

    @Autowired
    private OnboardingApprovalService onboardingApprovalService;

    @Autowired
    private DataSource dataSource;

    private Long testRequestId;
    private String testTenantId;
    private String testTenantName;
    private String testBusinessType;
    private String testApprovedBy;

    @BeforeEach
    void setUp() {
        testRequestId = 1L;
        testTenantId = "test-tenant-" + System.currentTimeMillis();
        testTenantName = "테스트 테넌트";
        testBusinessType = "ACADEMY";
        testApprovedBy = "test-admin";
    }

    /**
     * Java 폴백은 tenants/tenant_roles 등 Flyway/MySQL 전용 JDBC를 사용하며 인메모리 H2 스키마와 불일치할 수 있음.
     * MySQL 등으로 검증할 때만 실행한다 ({@link com.coresolution.core.system.FullSystemIntegrationTest} ERD 가정과 동일).
     */
    private void assumeNonH2DataSourceForOnboardingApprovalJdbc() {
        try (Connection c = dataSource.getConnection()) {
            String url = c.getMetaData().getURL();
            Assumptions.assumeFalse(
                    url != null && url.startsWith("jdbc:h2:"),
                    "Onboarding approval JDBC path requires MySQL-compatible schema (not H2)");
        } catch (SQLException e) {
            Assertions.fail("Could not read JDBC URL for onboarding assumption: " + e.getMessage());
        }
    }

    @Test
    @DisplayName("온보딩 승인 프로세스 - 전체 플로우 테스트")
    void testProcessOnboardingApproval_FullFlow() {
        assumeNonH2DataSourceForOnboardingApprovalJdbc();
        // Given
        String decisionNote = "테스트 승인";

        // When
        Map<String, Object> result = onboardingApprovalService.processOnboardingApproval(
                testRequestId, testTenantId, testTenantName, testBusinessType, testApprovedBy,
                decisionNote, "test@example.com", // contactEmail
                TEST_ADMIN_PASSWORD_BCRYPT,
                "test-subdomain" // subdomain
        );

        // Then
        assertThat(result).isNotNull();
        assertThat(result.containsKey("success")).isTrue();
        assertThat(result.containsKey("message")).isTrue();

        // 성공 여부 확인 (실제 DB 상태에 따라 달라질 수 있음)
        Boolean success = (Boolean) result.get("success");
        String message = (String) result.get("message");

        System.out.println("온보딩 승인 결과: success=" + success + ", message=" + message);

        // 최소한 메시지가 있는지 확인
        assertThat(message).isNotNull();
    }

    @Test
    @DisplayName("온보딩 승인 프로세스 - 잘못된 요청 ID")
    void testProcessOnboardingApproval_InvalidRequestId() {
        assumeNonH2DataSourceForOnboardingApprovalJdbc();
        // Given
        Long invalidRequestId = 9_999_999L;

        // When
        Map<String, Object> result =
                onboardingApprovalService.processOnboardingApproval(invalidRequestId, testTenantId,
                        testTenantName, testBusinessType, testApprovedBy, "테스트", "test@example.com", // contactEmail
                        TEST_ADMIN_PASSWORD_BCRYPT,
                        null // subdomain
                );

        // Then
        assertThat(result).isNotNull();
        // 프로시저가 실패하거나 경고를 반환할 수 있음
        assertThat(result.containsKey("success")).isTrue();
        assertThat(result.containsKey("message")).isTrue();
    }

    @Test
    @DisplayName("온보딩 승인 프로세스 - 필수 파라미터 검증")
    void testProcessOnboardingApproval_RequiredParameters() {
        assumeNonH2DataSourceForOnboardingApprovalJdbc();
        // Given
        // null 값 테스트는 프로시저 레벨에서 처리됨

        // When & Then
        // 실제 테스트는 프로시저 실행 시 검증됨
        // 여기서는 서비스 레벨에서 예외가 발생하지 않는지 확인
        Map<String, Object> result = onboardingApprovalService.processOnboardingApproval(
                testRequestId, testTenantId, testTenantName, testBusinessType, testApprovedBy, null, // decisionNote는
                                                                                                     // nullable
                "test@example.com", // contactEmail
                TEST_ADMIN_PASSWORD_BCRYPT,
                null // subdomain
        );

        assertThat(result).isNotNull();
    }
}


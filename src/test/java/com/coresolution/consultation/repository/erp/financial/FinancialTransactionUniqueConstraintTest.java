package com.coresolution.consultation.repository.erp.financial;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * V20260606_010 마이그레이션 — financial_transactions UNIQUE 인덱스 H2 idempotent 검증.
 *
 * <p>운영(MySQL 8) 은 INFORMATION_SCHEMA.STATISTICS + PREPARE/EXECUTE 패턴(V65 동일) 으로
 * 멱등 가드를 두지만, H2 (MODE=MySQL) 는 application-test.yml 의 spring.flyway.enabled=false
 * 로 V20260606_010 SQL 을 직접 실행하지 않는다. 본 테스트는 동일 H2 환경에서 인덱스의
 * <b>논리적</b> 멱등성과 partial-unique 의미론 (is_deleted=0 만 충돌, is_deleted=1 다중 허용)
 * 을 JDBC 레벨에서 검증한다.
 *
 * <p>인벤토리 §G3, DB M2 (ERP_AUTOMATION_DB_MEASUREMENT 2026-05-28) 참조.
 *
 * @author MindGarden
 * @since 2026-05-28
 */
@DisplayName("V20260606_010 — financial_transactions UNIQUE 인덱스 H2 idempotent")
class FinancialTransactionUniqueConstraintTest {

    private static final String JDBC_URL =
            "jdbc:h2:mem:financial_transactions_uk_test;MODE=MySQL;DB_CLOSE_DELAY=-1";
    private static final String INDEX_NAME = "uk_financial_transactions_dedupe";
    private static final String CREATE_INDEX_DDL =
            "CREATE UNIQUE INDEX IF NOT EXISTS " + INDEX_NAME + " "
                    + "ON financial_transactions (tenant_id, related_entity_id, related_entity_type, "
                    + "transaction_type, is_deleted)";

    private Connection connection;

    @BeforeEach
    void initSchema() throws SQLException {
        connection = DriverManager.getConnection(JDBC_URL, "sa", "");
        try (Statement stmt = connection.createStatement()) {
            stmt.execute("DROP TABLE IF EXISTS financial_transactions");
            stmt.execute(
                    "CREATE TABLE financial_transactions ("
                            + "  id BIGINT PRIMARY KEY AUTO_INCREMENT,"
                            + "  tenant_id VARCHAR(36) NOT NULL,"
                            + "  related_entity_id BIGINT NULL,"
                            + "  related_entity_type VARCHAR(50) NULL,"
                            + "  transaction_type VARCHAR(20) NOT NULL,"
                            + "  amount DECIMAL(15,2) NOT NULL,"
                            + "  is_deleted TINYINT NOT NULL DEFAULT 0"
                            + ")");
        }
    }

    @AfterEach
    void closeSchema() throws SQLException {
        try (Statement stmt = connection.createStatement()) {
            stmt.execute("DROP TABLE IF EXISTS financial_transactions");
        }
        connection.close();
    }

    @Test
    @DisplayName("UNIQUE 인덱스 생성은 멱등하다 — 두 번 실행해도 예외 없음")
    void createUniqueIndexIsIdempotent() throws SQLException {
        try (Statement stmt = connection.createStatement()) {
            stmt.execute(CREATE_INDEX_DDL);
            stmt.execute(CREATE_INDEX_DDL);
        }

        assertThat(indexExists(INDEX_NAME)).isTrue();
    }

    @Test
    @DisplayName("동일 (tenant, related, type, INCOME) 에 is_deleted=0 두 건은 충돌")
    void activeDuplicateRejectedAfterIndex() throws SQLException {
        try (Statement stmt = connection.createStatement()) {
            stmt.execute(CREATE_INDEX_DDL);
        }
        String tenantId = UUID.randomUUID().toString();
        insertTransaction(tenantId, 9001L, "CONSULTANT_CLIENT_MAPPING", "INCOME", "800000", 0);

        assertThatThrownBy(() -> insertTransaction(
                tenantId, 9001L, "CONSULTANT_CLIENT_MAPPING", "INCOME", "800000", 0))
                .isInstanceOf(SQLException.class)
                .hasMessageContaining(INDEX_NAME.toUpperCase());
    }

    @Test
    @DisplayName("partial-unique 의미론 — is_deleted=1 행은 활성 행과 공존 가능")
    void softDeletedRowDoesNotCollideWithActive() throws SQLException {
        try (Statement stmt = connection.createStatement()) {
            stmt.execute(CREATE_INDEX_DDL);
        }
        String tenantId = UUID.randomUUID().toString();

        // 과거 soft-deleted 분개 1건
        insertTransaction(tenantId, 9001L, "CONSULTANT_CLIENT_MAPPING", "INCOME", "800000", 1);
        // 신규 활성 분개 1건 — 동일 (tenant, related, type) 이지만 is_deleted=0 으로 충돌 없어야 함
        insertTransaction(tenantId, 9001L, "CONSULTANT_CLIENT_MAPPING", "INCOME", "800000", 0);

        assertThat(rowCount(tenantId, 9001L)).isEqualTo(2);
    }

    private void insertTransaction(
            String tenantId, long relatedEntityId, String relatedEntityType,
            String transactionType, String amount, int isDeleted) throws SQLException {
        try (var ps = connection.prepareStatement(
                "INSERT INTO financial_transactions "
                        + "(tenant_id, related_entity_id, related_entity_type, transaction_type, amount, is_deleted) "
                        + "VALUES (?, ?, ?, ?, ?, ?)")) {
            ps.setString(1, tenantId);
            ps.setLong(2, relatedEntityId);
            ps.setString(3, relatedEntityType);
            ps.setString(4, transactionType);
            ps.setBigDecimal(5, new java.math.BigDecimal(amount));
            ps.setInt(6, isDeleted);
            ps.executeUpdate();
        }
    }

    private boolean indexExists(String indexName) throws SQLException {
        try (var ps = connection.prepareStatement(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.INDEXES "
                        + "WHERE UPPER(TABLE_NAME) = 'FINANCIAL_TRANSACTIONS' "
                        + "AND UPPER(INDEX_NAME) = UPPER(?)")) {
            ps.setString(1, indexName);
            try (var rs = ps.executeQuery()) {
                return rs.next() && rs.getInt(1) > 0;
            }
        }
    }

    private int rowCount(String tenantId, long relatedEntityId) throws SQLException {
        try (var ps = connection.prepareStatement(
                "SELECT COUNT(*) FROM financial_transactions "
                        + "WHERE tenant_id = ? AND related_entity_id = ?")) {
            ps.setString(1, tenantId);
            ps.setLong(2, relatedEntityId);
            try (var rs = ps.executeQuery()) {
                return rs.next() ? rs.getInt(1) : 0;
            }
        }
    }
}

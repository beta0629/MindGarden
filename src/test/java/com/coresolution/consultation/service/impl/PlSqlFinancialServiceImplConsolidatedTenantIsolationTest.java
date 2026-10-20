package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabase;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseBuilder;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseType;

/**
 * {@code GET /api/v1/hq/erp/consolidated} 집계의 테넌트 격리 회귀 가드.
 *
 * <p>두 테넌트의 거래를 같은 기간에 넣고, 테넌트 A 컨텍스트의 집계가 B 의 금액·건수·지점·
 * 카테고리를 절대 포함하지 않는지 확인한다. 집계 전에는 {@code tenant_id} 조건이 없어
 * 전 테넌트 합계가 노출됐다.</p>
 *
 * <p>폐기된 {@code branches} 테이블(2026-06-12 {@code branches_dropped_20260612} 로 RENAME)
 * 을 만들지 않고도 조회가 성공해야 한다 — 개발 DB 에서 그 이름으로 남은 타 계정 DEFINER 뷰가
 * MySQL 1045 를 던져 500 이 났던 원인이다.</p>
 *
 * @author MindGarden
 * @since 2026-10-03
 */
@DisplayName("통합 재무 현황 — 테넌트 격리 (다른 테넌트 데이터 미포함)")
class PlSqlFinancialServiceImplConsolidatedTenantIsolationTest {

    private static final String TENANT_A = "tenant-a-consolidated-001";
    private static final String TENANT_B = "tenant-b-consolidated-002";
    private static final LocalDate START = LocalDate.of(2026, 9, 1);
    private static final LocalDate END = LocalDate.of(2026, 9, 30);

    private EmbeddedDatabase database;
    private PlSqlFinancialServiceImpl service;

    @BeforeEach
    void setUp() {
        database = new EmbeddedDatabaseBuilder()
                .setType(EmbeddedDatabaseType.H2)
                .setName("consolidated-tenant-isolation-" + System.nanoTime())
                .build();
        JdbcTemplate jdbcTemplate = new JdbcTemplate(database);
        jdbcTemplate.execute("""
                CREATE TABLE financial_transactions (
                    id BIGINT PRIMARY KEY,
                    tenant_id VARCHAR(100) NOT NULL,
                    transaction_type VARCHAR(20) NOT NULL,
                    category VARCHAR(50),
                    amount DECIMAL(15,2) NOT NULL,
                    transaction_date DATE NOT NULL,
                    branch_code VARCHAR(20),
                    status VARCHAR(20),
                    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
                )
                """);
        insert(jdbcTemplate, 1L, TENANT_A, "INCOME", "CONSULTATION", 100_000L, START, "A-BRANCH", false);
        insert(jdbcTemplate, 2L, TENANT_A, "EXPENSE", "RENT", 30_000L, END, "A-BRANCH", false);
        insert(jdbcTemplate, 3L, TENANT_A, "INCOME", "CONSULTATION", 7_000L, START, "A-BRANCH", true);
        insert(jdbcTemplate, 4L, TENANT_B, "INCOME", "CONSULTATION", 900_000L, START, "B-BRANCH", false);
        insert(jdbcTemplate, 5L, TENANT_B, "EXPENSE", "SALARY", 500_000L, END, "B-BRANCH", false);

        service = new PlSqlFinancialServiceImpl(jdbcTemplate);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
        database.shutdown();
    }

    @Test
    @DisplayName("테넌트 A 컨텍스트의 총계는 A 거래만 합산한다")
    void totals_onlyIncludeCurrentTenant() {
        TenantContextHolder.setTenantId(TENANT_A);

        Map<String, Object> result = service.getConsolidatedFinancialData(START, END);

        assertThat(number(result.get("totalRevenue"))).isEqualTo(100_000L);
        assertThat(number(result.get("totalExpenses"))).isEqualTo(30_000L);
        assertThat(number(result.get("netProfit"))).isEqualTo(70_000L);
        // is_deleted=TRUE 1건 제외, 테넌트 B 2건 제외
        assertThat(number(result.get("totalTransactions"))).isEqualTo(2L);
    }

    @Test
    @DisplayName("두 테넌트 결과를 더해야 전체 합계가 된다 — 어느 쪽도 전체를 보지 않는다")
    void eachTenantSeesOnlyItsOwnAmounts() {
        TenantContextHolder.setTenantId(TENANT_A);
        Map<String, Object> forA = service.getConsolidatedFinancialData(START, END);

        TenantContextHolder.setTenantId(TENANT_B);
        Map<String, Object> forB = service.getConsolidatedFinancialData(START, END);

        long revenueA = number(forA.get("totalRevenue"));
        long revenueB = number(forB.get("totalRevenue"));
        assertThat(revenueA).isEqualTo(100_000L);
        assertThat(revenueB).isEqualTo(900_000L);
        assertThat(revenueA + revenueB)
                .as("두 테넌트 합계(1,000,000)를 한쪽이 그대로 보면 테넌트 격리 위반")
                .isEqualTo(1_000_000L);
        assertThat(revenueA).isNotEqualTo(1_000_000L);
        assertThat(revenueB).isNotEqualTo(1_000_000L);
    }

    @Test
    @DisplayName("지점별·카테고리별 분해에도 다른 테넌트의 코드가 나오지 않는다")
    void breakdowns_excludeOtherTenant() {
        TenantContextHolder.setTenantId(TENANT_A);

        Map<String, Object> result = service.getConsolidatedFinancialData(START, END);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> branchBreakdown =
                (List<Map<String, Object>>) result.get("branchBreakdown");
        assertThat(branchBreakdown).extracting(row -> row.get("branchCode"))
                .containsExactly("A-BRANCH");
        assertThat(branchBreakdown).singleElement()
                .satisfies(row -> assertThat(number(row.get("revenue"))).isEqualTo(100_000L));

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> categoryBreakdown =
                (List<Map<String, Object>>) result.get("categoryBreakdown");
        assertThat(categoryBreakdown).extracting(row -> row.get("category"))
                .containsExactly("RENT")
                .doesNotContain("SALARY");
    }

    @Test
    @DisplayName("테넌트 컨텍스트가 없으면 전 테넌트 합계 대신 실패한다")
    void missingTenantContext_fails() {
        TenantContextHolder.clear();

        assertThatThrownBy(() -> service.getConsolidatedFinancialData(START, END))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Tenant ID is not set");
    }

    @Test
    @DisplayName("연도별 보고서(/reports?reportType=yearly)도 같은 테넌트만 집계한다")
    void yearlyReport_onlyIncludesCurrentTenant() {
        TenantContextHolder.setTenantId(TENANT_A);

        Map<String, Object> result = service.generateYearlyFinancialReport(2026, null);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> reportData = (List<Map<String, Object>>) result.get("reportData");
        assertThat(reportData).singleElement().satisfies(row -> {
            assertThat(row).containsEntry("branchCode", "A-BRANCH");
            assertThat(number(row.get("totalRevenue"))).isEqualTo(100_000L);
            assertThat(number(row.get("totalExpenses"))).isEqualTo(30_000L);
        });
    }

    @Test
    @DisplayName("연도별 보고서도 테넌트 컨텍스트 없이는 실패한다")
    void yearlyReport_missingTenantContext_fails() {
        TenantContextHolder.clear();

        assertThatThrownBy(() -> service.generateYearlyFinancialReport(2026, null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Tenant ID is not set");
    }

    private void insert(JdbcTemplate jdbcTemplate, long id, String tenantId, String type,
            String category, long amount, LocalDate date, String branchCode, boolean deleted) {
        jdbcTemplate.update("""
                INSERT INTO financial_transactions
                    (id, tenant_id, transaction_type, category, amount, transaction_date,
                     branch_code, status, is_deleted)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'COMPLETED', ?)
                """, id, tenantId, type, category, amount, date, branchCode, deleted);
    }

    private long number(Object value) {
        return ((Number) value).longValue();
    }
}

package com.coresolution.core.config;

import javax.sql.DataSource;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

/**
 * DataSource / JPA 자동구성 단독 조건 검증.
 */
class DataSourceAutoConfigProbeTest {

    private static final String H2_URL =
            "jdbc:h2:mem:probe_ds;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1";

    @Test
    void dataSourceAutoConfigurationCreatesSingleDataSource() {
        new ApplicationContextRunner()
                .withConfiguration(AutoConfigurations.of(DataSourceAutoConfiguration.class))
                .withPropertyValues(
                        "spring.datasource.url=" + H2_URL,
                        "spring.datasource.driver-class-name=org.h2.Driver",
                        "spring.datasource.username=sa",
                        "spring.datasource.password=",
                        "spring.datasource.connection-init-sql=")
                .run(ctx -> org.assertj.core.api.Assertions.assertThat(ctx.getBeanNamesForType(DataSource.class))
                        .hasSize(1));
    }

    @Test
    void hibernateJpaAutoConfigurationLoadsWithSingleDataSource() {
        new ApplicationContextRunner()
                .withConfiguration(AutoConfigurations.of(
                        DataSourceAutoConfiguration.class,
                        HibernateJpaAutoConfiguration.class))
                .withPropertyValues(
                        "spring.datasource.url=" + H2_URL,
                        "spring.datasource.driver-class-name=org.h2.Driver",
                        "spring.datasource.username=sa",
                        "spring.datasource.password=",
                        "spring.datasource.connection-init-sql=",
                        "spring.jpa.hibernate.ddl-auto=create-drop",
                        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect")
                .run(ctx -> org.assertj.core.api.Assertions.assertThat(ctx).hasBean("entityManagerFactory"));
    }
}

package com.coresolution.consultation.service.impl;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;
import java.util.List;

import com.coresolution.consultation.dto.BranchResponse;
import com.coresolution.consultation.service.BranchService;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * {@code branches} 테이블이 사라진 환경(.dev 와 동일 조건)을 실제 리포지토리 프록시로 재현한다.
 *
 * <p>운영/개발에서는 {@code V20260612_002} 가 {@code branches} 를
 * {@code branches_dropped_20260612} 로 RENAME 했고, .dev 에는 definer 가 깨진 호환 VIEW 만
 * 남아 조회가 실패한다(BRANCH_DEPRECATION.md). 여기서는 H2 테스트 스키마에서 같은 이름으로
 * RENAME 해 조회 실패를 만든다 — 테스트 전용 인메모리 스키마이므로 실제 데이터와 무관하다.</p>
 *
 * <p>핵심: {@code BranchService} 를 모킹하지 않고 <b>실제 Spring Data 프록시</b>를 태운다.
 * 참여 트랜잭션이 실패하면서 공유 트랜잭션을 rollback-only 로 표시하는 동작까지 재현해야
 * .dev 500 과 같은 조건이 되기 때문이다.</p>
 */
@SpringBootTest
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
@DisplayName("지점 목록 - branches 테이블 부재 재현")
class BranchServiceMissingTableReproTest {

    @Autowired
    private BranchService branchService;

    @Autowired
    private DataSource dataSource;

    @BeforeEach
    void renameBranchesAway() throws Exception {
        execute("ALTER TABLE branches RENAME TO branches_dropped_20260612");
    }

    @AfterEach
    void restoreBranches() throws Exception {
        execute("ALTER TABLE branches_dropped_20260612 RENAME TO branches");
        TenantContextHolder.clear();
    }

    private void execute(String sql) throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.execute(sql);
        }
    }

    @Test
    @DisplayName("branches 가 없어도 예외 없이 빈 목록을 돌려준다")
    void returnsEmptyListWhenBranchesTableIsGone() {
        TenantContextHolder.setTenantId("tenant-under-test");

        List<BranchResponse> result = branchService.getAllActiveBranches();

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("테넌트 컨텍스트가 없어도 예외 없이 빈 목록을 돌려준다")
    void returnsEmptyListWithoutTenantContext() {
        TenantContextHolder.clear();

        assertThat(branchService.getAllActiveBranches()).isEmpty();
    }
}

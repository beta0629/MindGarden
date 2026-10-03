package com.coresolution.consultation.service.impl;

import java.util.List;

import com.coresolution.consultation.dto.BranchResponse;
import com.coresolution.consultation.entity.Branch;
import com.coresolution.consultation.repository.BranchRepository;
import com.coresolution.consultation.service.BranchService;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.dao.InvalidDataAccessResourceUsageException;
import org.springframework.orm.jpa.JpaSystemException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.interceptor.TransactionAspectSupport;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willAnswer;

/**
 * 사용 중단된 {@code branches} 저장소를 읽을 수 없을 때 지점 목록이 500 대신 빈 목록으로
 * 축퇴하는지 검증한다.
 *
 * <p>MockMvc 에서 {@code BranchService} 자체를 모킹하면 트랜잭션 프록시를 전혀 타지 않아
 * 이 회귀를 잡지 못한다(.dev 에서 500 이 재현된 이유). 그래서 여기서는 실제 서비스 빈과
 * 실제 트랜잭션 매니저를 쓰고 저장소만 모킹한다.</p>
 */
@SpringBootTest
@ActiveProfiles("test")
@DisplayName("지점 목록 - 사용 중단 저장소 축퇴")
class BranchServiceDeprecatedStoreDegradeTest {

    /** Spring Data 가 definer 가 깨진 VIEW 를 읽을 때 올라오는 형태의 예외. */
    private static final JpaSystemException ACCESS_DENIED = new JpaSystemException(
            new org.hibernate.exception.GenericJDBCException(
                    "Access denied for the application user",
                    new java.sql.SQLException("Access denied for the application user")));

    @Autowired
    private BranchService branchService;

    @MockBean
    private BranchRepository branchRepository;

    @AfterEach
    void clearTenant() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("조회 실패가 공유 트랜잭션을 rollback-only 로 표시해도 빈 목록을 돌려준다")
    void returnsEmptyListWhenDeprecatedStoreMarksRollbackOnly() {
        TenantContextHolder.setTenantId("tenant-under-test");

        // Spring Data 의 참여 트랜잭션이 실패 시 하는 일을 그대로 재현한다:
        // 공유 트랜잭션을 rollback-only 로 표시한 뒤 DataAccessException 을 다시 던진다.
        willAnswer(invocation -> {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            throw ACCESS_DENIED;
        }).given(branchRepository).findByTenantIdAndIsDeletedFalseOrderByBranchName(anyString());

        List<BranchResponse> result = branchService.getAllActiveBranches();

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("테넌트 컨텍스트가 없을 때도 조회 실패를 빈 목록으로 축퇴시킨다")
    void returnsEmptyListWithoutTenantContext() {
        TenantContextHolder.clear();

        willAnswer(invocation -> {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            throw new InvalidDataAccessResourceUsageException("branches 객체를 읽을 수 없음");
        }).given(branchRepository).findByIsDeletedFalseOrderByBranchName();

        assertThat(branchService.getAllActiveBranches()).isEmpty();
    }

    @Test
    @DisplayName("저장소가 정상이면 테넌트 범위 목록을 그대로 반환한다")
    void returnsTenantScopedBranchesWhenStoreIsHealthy() {
        TenantContextHolder.setTenantId("tenant-under-test");
        Branch branch = new Branch();
        branch.setId(7L);
        branch.setBranchCode("BR-TEST");
        branch.setBranchName("검증용 지점");
        given(branchRepository.findByTenantIdAndIsDeletedFalseOrderByBranchName("tenant-under-test"))
                .willReturn(List.of(branch));

        List<BranchResponse> result = branchService.getAllActiveBranches();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getBranchName()).isEqualTo("검증용 지점");
    }
}

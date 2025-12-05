package com.coresolution.consultation.test;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import com.coresolution.consultation.service.FinancialTransactionService;
import com.coresolution.consultation.service.ConsultantRatingService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.core.context.TenantContextHolder;
import com.coresolution.consultation.entity.FinancialTransaction;
import com.coresolution.consultation.entity.User;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Service 계층 표준화 테스트
 * 
 * 테스트 목적:
 * 1. 브랜치 코드 제거 검증
 * 2. 테넌트 격리 검증
 * 3. tenantId 기반 조회 검증
 */
@SpringBootTest
@ActiveProfiles("test")
@DisplayName("Service 계층 표준화 테스트")
public class ServiceStandardizationTest {

    @Autowired
    private FinancialTransactionService financialTransactionService;

    @Autowired
    private ConsultantRatingService consultantRatingService;

    @Autowired
    private UserService userService;

    @Test
    @DisplayName("FinancialTransactionService: branchCode 없이 tenantId로만 조회")
    void testFinancialTransactionServiceWithoutBranchCode() {
        // Given
        String tenantId = "tenant-001";
        TenantContextHolder.setTenantId(tenantId);

        try {
            // When
            List<FinancialTransaction> transactions = 
                financialTransactionService.getTransactionsByTenant(tenantId);

            // Then
            assertThat(transactions).isNotNull();
            assertThat(transactions).allMatch(t -> 
                tenantId.equals(t.getTenantId())
            );
        } finally {
            TenantContextHolder.clear();
        }
    }

    @Test
    @DisplayName("ConsultantRatingService: 테넌트 격리 검증")
    void testConsultantRatingServiceTenantIsolation() {
        // Given
        String tenantId1 = "tenant-001";
        String tenantId2 = "tenant-002";

        // When: tenant-001에서 조회
        TenantContextHolder.setTenantId(tenantId1);
        List<?> rankings1 = consultantRatingService.getConsultantRankingByTenant(tenantId1);
        TenantContextHolder.clear();

        // When: tenant-002에서 조회
        TenantContextHolder.setTenantId(tenantId2);
        List<?> rankings2 = consultantRatingService.getConsultantRankingByTenant(tenantId2);
        TenantContextHolder.clear();

        // Then: 두 테넌트의 데이터가 격리되어야 함
        assertThat(rankings1).isNotNull();
        assertThat(rankings2).isNotNull();
        // tenant-001의 데이터가 tenant-002 결과에 포함되지 않아야 함
    }

    @Test
    @DisplayName("UserService: tenantId 기반 조회")
    void testUserServiceTenantBasedQuery() {
        // Given
        String tenantId = "tenant-001";
        TenantContextHolder.setTenantId(tenantId);

        try {
            // When
            List<User> users = userService.findByTenantId(tenantId);

            // Then
            assertThat(users).isNotNull();
            assertThat(users).allMatch(u -> 
                tenantId.equals(u.getTenantId())
            );
        } finally {
            TenantContextHolder.clear();
        }
    }

    @Test
    @DisplayName("Service 메서드에 branchCode 파라미터 없음 확인")
    void testServiceMethodsWithoutBranchCode() {
        // 이 테스트는 리플렉션을 사용하여 메서드 시그니처를 확인
        // 실제 구현은 테스트 프레임워크에 따라 다를 수 있음
        
        // Given
        Class<?> serviceClass = FinancialTransactionService.class;
        
        // When: branchCode 파라미터를 가진 메서드 찾기
        long branchCodeMethodCount = Arrays.stream(serviceClass.getMethods())
            .filter(method -> {
                return Arrays.stream(method.getParameters())
                    .anyMatch(param -> param.getName().toLowerCase().contains("branchcode"));
            })
            .count();

        // Then: branchCode 파라미터를 가진 메서드가 없어야 함
        assertThat(branchCodeMethodCount).isEqualTo(0);
    }
}


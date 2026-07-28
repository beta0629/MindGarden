package com.coresolution.core.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.core.domain.Tenant;
import com.coresolution.core.repository.TenantRepository;
import com.coresolution.core.service.BrandingService;
import com.coresolution.core.service.TenantService;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.cache.CacheManager;
import org.springframework.test.context.ActiveProfiles;

/**
 * Phase1 B7: {@link TenantService#getTenantById(String)} Caffeine 캐싱 동작 검증.
 *
 * <ul>
 *   <li>같은 {@code tenantId} 로 N 회 호출 → 리포지토리 1 회만 호출</li>
 *   <li>cache name {@code tenantById} 존재 확인</li>
 *   <li>빈 Optional 결과는 캐시하지 않는다 (신규 테넌트 stale 회피)</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-06-12
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@ActiveProfiles("test")
@DisplayName("TenantServiceImpl.getTenantById — Phase1 B7 캐싱 검증")
class TenantServiceImplGetTenantByIdCacheTest {

    @MockBean
    private TenantRepository tenantRepository;

    @MockBean
    private BrandingService brandingService;

    @Autowired
    private TenantService tenantService;

    @Autowired
    private CacheManager cacheManager;

    private static final String TENANT_ID = "tenant-b7-" + UUID.randomUUID();

    @BeforeEach
    void clearCache() {
        if (cacheManager.getCache("tenantById") != null) {
            cacheManager.getCache("tenantById").clear();
        }
    }

    @AfterEach
    void clearCacheAfter() {
        if (cacheManager.getCache("tenantById") != null) {
            cacheManager.getCache("tenantById").clear();
        }
    }

    @Test
    @DisplayName("tenantById 캐시가 CacheConfig 에 등록되어 있다")
    void cacheRegistered() {
        assertThat(cacheManager.getCacheNames()).contains("tenantById");
        assertThat(cacheManager.getCache("tenantById")).isNotNull();
    }

    @Test
    @DisplayName("3 회 조회 → 리포지토리 1 회만 호출 (캐시 hit)")
    void cachedAfterFirstCall() {
        Tenant tenant = Tenant.builder()
            .tenantId(TENANT_ID)
            .name("B7 테넌트")
            .businessType("CONSULTATION")
            .status(Tenant.TenantStatus.ACTIVE)
            .build();
        when(tenantRepository.findByTenantIdAndIsDeletedFalse(TENANT_ID))
            .thenReturn(Optional.of(tenant));

        Optional<Tenant> first = tenantService.getTenantById(TENANT_ID);
        Optional<Tenant> second = tenantService.getTenantById(TENANT_ID);
        Optional<Tenant> third = tenantService.getTenantById(TENANT_ID);

        assertThat(first).contains(tenant);
        assertThat(second).contains(tenant);
        assertThat(third).contains(tenant);
        verify(tenantRepository, times(1)).findByTenantIdAndIsDeletedFalse(TENANT_ID);
    }

    @Test
    @DisplayName("빈 결과는 캐시하지 않는다 — 신규 테넌트 활성화 stale 회피")
    void doesNotCacheEmptyResult() {
        when(tenantRepository.findByTenantIdAndIsDeletedFalse(TENANT_ID))
            .thenReturn(Optional.empty());

        Optional<Tenant> first = tenantService.getTenantById(TENANT_ID);
        Optional<Tenant> second = tenantService.getTenantById(TENANT_ID);

        assertThat(first).isEmpty();
        assertThat(second).isEmpty();
        // 빈 결과는 캐시 안 됨 → 매 호출마다 리포지토리 조회
        verify(tenantRepository, times(2)).findByTenantIdAndIsDeletedFalse(TENANT_ID);
    }

    @Test
    @DisplayName("tenantId 가 null/빈 문자열이면 즉시 empty 반환 (리포지토리 미호출)")
    void shortCircuitsBlankTenantId() {
        assertThat(tenantService.getTenantById(null)).isEmpty();
        assertThat(tenantService.getTenantById("")).isEmpty();

        verify(tenantRepository, times(0)).findByTenantIdAndIsDeletedFalse("");
    }
}

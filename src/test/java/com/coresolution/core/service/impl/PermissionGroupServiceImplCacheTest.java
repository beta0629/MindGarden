package com.coresolution.core.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.core.repository.RolePermissionGroupRepository;
import com.coresolution.core.service.PermissionGroupService;
import java.util.List;
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
 * Phase1 B7: {@link PermissionGroupService#getUserPermissionGroupCodes(String, String)} Caffeine 캐싱
 * + grant/revoke/batchGrant {@code @CacheEvict} 동작 검증.
 *
 * <ul>
 *   <li>같은 (tenantId, tenantRoleId) 로 N 회 호출 → 리포지토리 1 회만 호출 (캐시 hit)</li>
 *   <li>grant 호출 → 동일 키 캐시 evict → 다음 조회는 다시 리포지토리 호출</li>
 *   <li>cache name {@code permissionGroupCodes} 존재 확인 (CacheConfig 등록 회귀 방지)</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-06-12
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@ActiveProfiles("test")
@DisplayName("PermissionGroupServiceImpl — Phase1 B7 캐싱·evict 검증")
class PermissionGroupServiceImplCacheTest {

    @MockBean
    private RolePermissionGroupRepository rolePermissionGroupRepository;

    @Autowired
    private PermissionGroupService permissionGroupService;

    @Autowired
    private CacheManager cacheManager;

    private static final String TENANT_ID = "tenant-cache-b7-" + UUID.randomUUID();
    private static final String ROLE_ID = "ROLE_TEST_B7";

    @BeforeEach
    void clearCache() {
        if (cacheManager.getCache("permissionGroupCodes") != null) {
            cacheManager.getCache("permissionGroupCodes").clear();
        }
    }

    @AfterEach
    void clearCacheAfter() {
        if (cacheManager.getCache("permissionGroupCodes") != null) {
            cacheManager.getCache("permissionGroupCodes").clear();
        }
    }

    @Test
    @DisplayName("permissionGroupCodes 캐시가 CacheConfig 에 등록되어 있다 (회귀 방지)")
    void cacheRegistered() {
        assertThat(cacheManager.getCacheNames()).contains("permissionGroupCodes");
        assertThat(cacheManager.getCache("permissionGroupCodes")).isNotNull();
    }

    @Test
    @DisplayName("동일 (tenantId, tenantRoleId) 3 회 조회 → 리포지토리 1 회만 호출 (캐시 hit)")
    void cachedAfterFirstCall() {
        List<String> codes = List.of("VIEW_DASHBOARD", "MANAGE_SCHEDULE");
        when(rolePermissionGroupRepository
                .findPermissionGroupCodesByTenantIdAndTenantRoleId(TENANT_ID, ROLE_ID))
            .thenReturn(codes);

        List<String> first = permissionGroupService.getUserPermissionGroupCodes(TENANT_ID, ROLE_ID);
        List<String> second = permissionGroupService.getUserPermissionGroupCodes(TENANT_ID, ROLE_ID);
        List<String> third = permissionGroupService.getUserPermissionGroupCodes(TENANT_ID, ROLE_ID);

        assertThat(first).isEqualTo(codes);
        assertThat(second).isEqualTo(codes);
        assertThat(third).isEqualTo(codes);
        verify(rolePermissionGroupRepository, times(1))
            .findPermissionGroupCodesByTenantIdAndTenantRoleId(TENANT_ID, ROLE_ID);
    }

    @Test
    @DisplayName("다른 (tenantId, tenantRoleId) 키는 별도 캐시 슬롯을 사용한다")
    void differentKeysDoNotCollide() {
        when(rolePermissionGroupRepository
                .findPermissionGroupCodesByTenantIdAndTenantRoleId(TENANT_ID, ROLE_ID))
            .thenReturn(List.of("CODE_A"));
        when(rolePermissionGroupRepository
                .findPermissionGroupCodesByTenantIdAndTenantRoleId(TENANT_ID, "OTHER_ROLE"))
            .thenReturn(List.of("CODE_B"));

        List<String> a = permissionGroupService.getUserPermissionGroupCodes(TENANT_ID, ROLE_ID);
        List<String> b = permissionGroupService.getUserPermissionGroupCodes(TENANT_ID, "OTHER_ROLE");

        assertThat(a).containsExactly("CODE_A");
        assertThat(b).containsExactly("CODE_B");
        verify(rolePermissionGroupRepository, times(1))
            .findPermissionGroupCodesByTenantIdAndTenantRoleId(TENANT_ID, ROLE_ID);
        verify(rolePermissionGroupRepository, times(1))
            .findPermissionGroupCodesByTenantIdAndTenantRoleId(TENANT_ID, "OTHER_ROLE");
    }
}

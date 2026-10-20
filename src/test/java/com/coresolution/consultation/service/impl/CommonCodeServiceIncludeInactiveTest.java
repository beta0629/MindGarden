package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import com.coresolution.consultation.dto.CommonCodeListResponse;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * 관리자 목록(includeInactive=true)은 비활성 코드도 돌려주고, 기본 조회는 활성만 유지하는지 검증한다(#1559 B6).
 *
 * @author MindGarden
 * @since 2026-10-12
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("CommonCodeServiceImpl 비활성 포함 조회")
class CommonCodeServiceIncludeInactiveTest {

    private static final String TENANT = "tenant-inactive-svc";
    private static final String GROUP = "SAMPLE_GROUP";

    @Mock
    private CommonCodeRepository commonCodeRepository;

    @InjectMocks
    private CommonCodeServiceImpl service;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    private static CommonCode inactiveCode() {
        CommonCode code = CommonCode.builder().codeGroup(GROUP).codeValue("V").codeLabel("L")
            .koreanName("K").build();
        code.setTenantId(TENANT);
        code.setIsActive(false);
        return code;
    }

    @Test
    @DisplayName("findAll(group, true): 비활성 코드도 목록에 남고 isActive=false 로 내려간다")
    void findAll_includeInactive_keepsInactive() {
        when(commonCodeRepository.findCodesByGroupWithFallbackIncludingInactive(TENANT, GROUP))
            .thenReturn(List.of(inactiveCode()));

        CommonCodeListResponse res = service.findAll(GROUP, true);

        assertEquals(1, res.getCodes().size());
        assertEquals(Boolean.FALSE, res.getCodes().get(0).getIsActive());
        verify(commonCodeRepository, never()).findCodesByGroupWithFallback(anyString(), anyString());
    }

    @Test
    @DisplayName("findAll(group): 기본 조회는 기존 활성 전용 쿼리를 그대로 쓴다")
    void findAll_default_activeOnly() {
        when(commonCodeRepository.findCodesByGroupWithFallback(TENANT, GROUP)).thenReturn(List.of());

        service.findAll(GROUP);

        verify(commonCodeRepository).findCodesByGroupWithFallback(TENANT, GROUP);
        verify(commonCodeRepository, never()).findCodesByGroupWithFallbackIncludingInactive(anyString(), anyString());
    }

    @Test
    @DisplayName("getCurrentTenantCodesByGroup(group, true): 테넌트 비활성 포함 쿼리를 쓴다")
    void tenantGroup_includeInactive() {
        when(commonCodeRepository.findTenantCodesByGroupIncludingInactive(TENANT, GROUP))
            .thenReturn(List.of(inactiveCode()));

        assertEquals(1, service.getCurrentTenantCodesByGroup(GROUP, true).size());
    }
}

package com.coresolution.consultation.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.core.constant.OnboardingConstants;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * 공개 CONSULTATION_PACKAGE 목록 — publicVisible 필터 검증.
 *
 * @author CoreSolution
 * @since 2026-09-10
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("PublicConsultationPackageService — publicVisible")
class PublicConsultationPackageServiceTest {

    private static final String TENANT_ID = "tenant-clinic-a";
    private static final String CODE_GROUP =
            OnboardingConstants.TENANT_COMMON_CODE_GROUP_CONSULTATION_PACKAGE;

    @Mock
    private CommonCodeRepository commonCodeRepository;

    private PublicConsultationPackageService service;

    @BeforeEach
    void setUp() {
        service = new PublicConsultationPackageService(commonCodeRepository, new ObjectMapper());
    }

    @Test
    @DisplayName("publicVisible=false 패키지는 제외하고, 누락·true 는 포함한다")
    void buildPublicConsultationPackages_filtersByPublicVisible() {
        CommonCode visibleMissing = CommonCode.builder()
                .codeValue("BASIC")
                .codeLabel("BASIC")
                .koreanName("기본 10회")
                .codeDescription("기본 상담")
                .isActive(true)
                .extraData("{\"sessions\":10,\"price\":300000,\"remark\":\"인기\"}")
                .sortOrder(1)
                .build();
        CommonCode visibleTrue = CommonCode.builder()
                .codeValue("PREMIUM")
                .codeLabel("PREMIUM")
                .koreanName("프리미엄")
                .isActive(true)
                .extraData("{\"sessions\":20,\"price\":500000,\"publicVisible\":true}")
                .sortOrder(2)
                .build();
        CommonCode hidden = CommonCode.builder()
                .codeValue("INTERNAL")
                .codeLabel("INTERNAL")
                .koreanName("내부용")
                .isActive(true)
                .extraData("{\"sessions\":5,\"price\":100000,\"publicVisible\":false}")
                .sortOrder(3)
                .build();
        CommonCode emptyExtra = CommonCode.builder()
                .codeValue("SIMPLE")
                .codeLabel("SIMPLE")
                .koreanName("단회")
                .isActive(true)
                .extraData(null)
                .sortOrder(4)
                .build();

        when(commonCodeRepository.findByTenantIdAndCodeGroupAndIsActiveTrueOrderBySortOrderAsc(
                        eq(TENANT_ID), eq(CODE_GROUP)))
                .thenReturn(List.of(visibleMissing, visibleTrue, hidden, emptyExtra));

        List<Map<String, Object>> packages = service.buildPublicConsultationPackages(TENANT_ID);

        assertThat(packages).hasSize(3);
        assertThat(packages).extracting(m -> m.get("name"))
                .containsExactly("기본 10회", "프리미엄", "단회");
        assertThat(packages).extracting(m -> m.get("name")).doesNotContain("내부용");
    }

    @Test
    @DisplayName("tenantId 가 비어 있으면 빈 목록")
    void buildPublicConsultationPackages_blankTenant_returnsEmpty() {
        assertThat(service.buildPublicConsultationPackages(null)).isEmpty();
        assertThat(service.buildPublicConsultationPackages("  ")).isEmpty();
    }
}

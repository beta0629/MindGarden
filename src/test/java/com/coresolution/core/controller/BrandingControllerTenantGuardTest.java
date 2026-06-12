package com.coresolution.core.controller;

import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.dto.BrandingInfo;
import com.coresolution.core.dto.BrandingUpdateRequest;
import com.coresolution.core.service.BrandingService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

/**
 * {@link BrandingController} 의 {@code {tenantId}} PathVariable 안전망 회귀 방어 단위 테스트
 * (PR-2/9 4종 SSOT — Ops Portal 분리 전 안전망).
 *
 * <p>2026-06 4종 SSOT (PR-2) 후, {@link BrandingController#getBrandingInfoByTenantId(String)},
 * {@link BrandingController#uploadLogoForTenant(String, MultipartFile)},
 * {@link BrandingController#updateBrandingInfoForTenant(String, BrandingUpdateRequest)} 3종은
 * {@code hasRole('ADMIN')} 권한으로 단순화되었다. 권한 단순화 후에도 다른 테넌트의
 * 자원에 접근할 수 없어야 한다는 멀티테넌트 격리 요건을 검증한다.</p>
 *
 * <p>검증 시나리오 (각 메서드 × 자기/다른 테넌트 = 6건):</p>
 * <ul>
 *   <li>현재 컨텍스트와 다른 {@code tenantId} 호출 시 403 + 메시지 "다른 테넌트 접근 권한 없음" 반환,
 *       서비스 호출되지 않음 (가드 동작 보장)</li>
 *   <li>현재 컨텍스트와 동일한 {@code tenantId} 호출 시 200/서비스 호출, 응답 body 의 success=true</li>
 * </ul>
 *
 * <p>HQ_MASTER 17건은 본 PR 범위 외 (별도 후속 PR — {@code ops-portal-migration}).</p>
 *
 * @author MindGarden
 * @since 2026-06-12
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("BrandingController — {tenantId} 안전망 회귀 방어 (PR-2/9 4종 SSOT)")
class BrandingControllerTenantGuardTest {

    private static final String SELF_TENANT_ID = "tenant-A";
    private static final String OTHER_TENANT_ID = "tenant-B";

    @Mock
    private BrandingService brandingService;

    @InjectMocks
    private BrandingController brandingController;

    @BeforeEach
    void setUpTenantContext() {
        TenantContextHolder.setTenantId(SELF_TENANT_ID);
    }

    @AfterEach
    void clearTenantContext() {
        TenantContextHolder.clear();
    }

    @Nested
    @DisplayName("GET /api/v1/admin/branding/{tenantId} — getBrandingInfoByTenantId")
    class GetBrandingInfoByTenantId {

        @Test
        @DisplayName("다른 테넌트 ID 요청 시 403 + 메시지 반환, 서비스 호출 0회")
        void otherTenant_returnsForbidden() {
            ResponseEntity<ApiResponse<BrandingInfo>> response =
                    brandingController.getBrandingInfoByTenantId(OTHER_TENANT_ID);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().isSuccess()).isFalse();
            assertThat(response.getBody().getMessage()).isEqualTo("다른 테넌트 접근 권한 없음");
            verify(brandingService, never()).getBrandingInfo(any());
        }

        @Test
        @DisplayName("자기 테넌트 ID 요청 시 200 + 서비스 호출 1회")
        void selfTenant_returnsOk() {
            BrandingInfo info = BrandingInfo.builder().companyName("회사A").build();
            given(brandingService.getBrandingInfo(SELF_TENANT_ID)).willReturn(info);

            ResponseEntity<ApiResponse<BrandingInfo>> response =
                    brandingController.getBrandingInfoByTenantId(SELF_TENANT_ID);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().isSuccess()).isTrue();
            assertThat(response.getBody().getData()).isSameAs(info);
            verify(brandingService).getBrandingInfo(SELF_TENANT_ID);
        }
    }

    @Nested
    @DisplayName("POST /api/v1/admin/branding/{tenantId}/logo — uploadLogoForTenant")
    class UploadLogoForTenant {

        @Test
        @DisplayName("다른 테넌트 ID 요청 시 403 + 메시지 반환, 서비스 호출 0회")
        void otherTenant_returnsForbidden() {
            MockMultipartFile logo = newLogoFile();

            ResponseEntity<ApiResponse<BrandingInfo>> response =
                    brandingController.uploadLogoForTenant(OTHER_TENANT_ID, logo);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().isSuccess()).isFalse();
            assertThat(response.getBody().getMessage()).isEqualTo("다른 테넌트 접근 권한 없음");
            verify(brandingService, never()).uploadLogo(any(), any());
        }

        @Test
        @DisplayName("자기 테넌트 ID 요청 시 200 + 서비스 호출 1회")
        void selfTenant_returnsOk() {
            MockMultipartFile logo = newLogoFile();
            BrandingInfo info = BrandingInfo.builder().companyName("회사A").build();
            given(brandingService.uploadLogo(eq(SELF_TENANT_ID), any(MultipartFile.class)))
                    .willReturn(info);

            ResponseEntity<ApiResponse<BrandingInfo>> response =
                    brandingController.uploadLogoForTenant(SELF_TENANT_ID, logo);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().isSuccess()).isTrue();
            assertThat(response.getBody().getData()).isSameAs(info);
            verify(brandingService).uploadLogo(eq(SELF_TENANT_ID), any(MultipartFile.class));
        }

        private MockMultipartFile newLogoFile() {
            return new MockMultipartFile(
                    "logo", "logo.png", "image/png", new byte[]{1, 2, 3});
        }
    }

    @Nested
    @DisplayName("PUT /api/v1/admin/branding/{tenantId} — updateBrandingInfoForTenant")
    class UpdateBrandingInfoForTenant {

        @Test
        @DisplayName("다른 테넌트 ID 요청 시 403 + 메시지 반환, 서비스 호출 0회")
        void otherTenant_returnsForbidden() {
            BrandingUpdateRequest request = new BrandingUpdateRequest();

            ResponseEntity<ApiResponse<BrandingInfo>> response =
                    brandingController.updateBrandingInfoForTenant(OTHER_TENANT_ID, request);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().isSuccess()).isFalse();
            assertThat(response.getBody().getMessage()).isEqualTo("다른 테넌트 접근 권한 없음");
            verify(brandingService, never()).updateBrandingInfo(any(), any());
        }

        @Test
        @DisplayName("자기 테넌트 ID 요청 시 200 + 서비스 호출 1회")
        void selfTenant_returnsOk() {
            BrandingUpdateRequest request = new BrandingUpdateRequest();
            BrandingInfo info = BrandingInfo.builder().companyName("회사A").build();
            given(brandingService.updateBrandingInfo(eq(SELF_TENANT_ID), any(BrandingUpdateRequest.class)))
                    .willReturn(info);

            ResponseEntity<ApiResponse<BrandingInfo>> response =
                    brandingController.updateBrandingInfoForTenant(SELF_TENANT_ID, request);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().isSuccess()).isTrue();
            assertThat(response.getBody().getData()).isSameAs(info);
            verify(brandingService).updateBrandingInfo(eq(SELF_TENANT_ID),
                    any(BrandingUpdateRequest.class));
        }
    }
}

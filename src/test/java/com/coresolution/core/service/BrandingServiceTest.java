package com.coresolution.core.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.coresolution.core.domain.Tenant;
import com.coresolution.core.dto.BrandingInfo;
import com.coresolution.core.repository.TenantRepository;
import com.coresolution.core.util.TenantLogoFileUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.FileTime;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link BrandingService} 로고 URL 폴백 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-05-19
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("BrandingService — 로고 URL 폴백")
class BrandingServiceTest {

    private static final String TENANT_ID = "tenant-incheon-counseling-001";
    private static final String MISSING_FILE =
            "tenant-incheon-counseling-001_853135b9-d696-444b-8a1b-8e752ef4c914.svg";
    private static final String LATEST_FILE =
            "tenant-incheon-counseling-001_c6a6d5db-ddc7-4ff0-848a-2a99b02a7335.svg";

    @Mock
    private TenantRepository tenantRepository;

    @InjectMocks
    private BrandingService brandingService;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private Path uploadDir;

    @BeforeEach
    void setUp() throws IOException {
        brandingService = new BrandingService(tenantRepository, objectMapper);
        uploadDir = TenantLogoFileUtils.uploadBasePath();
        Files.createDirectories(uploadDir);
    }

    @AfterEach
    void tearDown() throws IOException {
        deleteIfExists(MISSING_FILE);
        deleteIfExists(LATEST_FILE);
    }

    @Test
    @DisplayName("디스크에 없는 업로드 URL → 테넌트 최신 파일 URL로 대체")
    void getBrandingInfo_missingFile_fallsBackToLatestTenantLogo() throws Exception {
        writeLogoFile(LATEST_FILE, "<svg></svg>");
        String brokenUrl = TenantLogoFileUtils.LOGO_URL_PREFIX + MISSING_FILE;
        Tenant tenant = tenantWithBrandingJson(brokenUrl);

        when(tenantRepository.findByTenantIdAndIsDeletedFalse(TENANT_ID)).thenReturn(Optional.of(tenant));

        BrandingInfo result = brandingService.getBrandingInfo(TENANT_ID);

        assertThat(result.getLogo().getUrl())
                .isEqualTo(TenantLogoFileUtils.buildLogoUrl(LATEST_FILE));
        assertThat(result.getLogo().getDataUri()).isNotBlank();
    }

    @Test
    @DisplayName("디스크에 없는 업로드 URL, 테넌트 파일도 없음 → 기본 로고 URL")
    void getBrandingInfo_missingFile_noTenantFiles_fallsBackToDefaultLogo() throws Exception {
        String brokenUrl = TenantLogoFileUtils.LOGO_URL_PREFIX + MISSING_FILE;
        Tenant tenant = tenantWithBrandingJson(brokenUrl);

        when(tenantRepository.findByTenantIdAndIsDeletedFalse(TENANT_ID)).thenReturn(Optional.of(tenant));

        BrandingInfo result = brandingService.getBrandingInfo(TENANT_ID);

        assertThat(result.getLogo().getUrl()).isEqualTo(TenantLogoFileUtils.DEFAULT_LOGO_URL);
        assertThat(result.getLogo().getDataUri()).isNull();
    }

    @Test
    @DisplayName("업로드 URL 파일 존재 → URL 유지 및 dataUri 채움")
    void getBrandingInfo_existingFile_keepsUrlAndEnrichesDataUri() throws Exception {
        writeLogoFile(MISSING_FILE, "<svg></svg>");
        String logoUrl = TenantLogoFileUtils.LOGO_URL_PREFIX + MISSING_FILE;
        Tenant tenant = tenantWithBrandingJson(logoUrl);

        when(tenantRepository.findByTenantIdAndIsDeletedFalse(TENANT_ID)).thenReturn(Optional.of(tenant));

        BrandingInfo result = brandingService.getBrandingInfo(TENANT_ID);

        assertThat(result.getLogo().getUrl()).isEqualTo(logoUrl);
        assertThat(result.getLogo().getDataUri()).startsWith("data:image/svg+xml;base64,");
    }

    private Tenant tenantWithBrandingJson(String logoUrl) {
        String brandingJson = String.format(
                "{\"logo\":{\"url\":\"%s\",\"format\":\"svg\",\"alt\":\"Test\"},\"companyName\":\"인천상담\"}",
                logoUrl);
        return Tenant.builder()
                .tenantId(TENANT_ID)
                .name("인천상담")
                .brandingJson(brandingJson)
                .build();
    }

    private void writeLogoFile(String fileName, String content) throws IOException {
        Path filePath = uploadDir.resolve(fileName);
        Files.writeString(filePath, content);
        Files.setLastModifiedTime(filePath, FileTime.fromMillis(System.currentTimeMillis()));
    }

    private void deleteIfExists(String fileName) throws IOException {
        Path filePath = uploadDir.resolve(fileName);
        Files.deleteIfExists(filePath);
    }
}

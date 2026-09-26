package com.coresolution.core.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.service.ProfileImageStorageService;
import com.coresolution.consultation.service.ShopCatalogSkuThumbnailService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

/**
 * {@link FileController#getShopCatalogThumbnail(String)} path traversal·정상 서빙 회귀.
 *
 * @author MindGarden
 * @since 2026-09-26
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FileController#getShopCatalogThumbnail — path traversal + 서빙")
class FileControllerShopCatalogThumbnailServingTest {

    @Mock
    private ProfileImageStorageService profileImageStorageService;

    @Mock
    private ShopCatalogSkuThumbnailService shopCatalogSkuThumbnailService;

    @InjectMocks
    private FileController controller;

    @Test
    @DisplayName("정상 파일 요청 시 200")
    void getShopCatalogThumbnail_existing_returns200() {
        Resource resource = new ByteArrayResource(new byte[] {1, 2, 3});
        when(shopCatalogSkuThumbnailService.loadAsResource("tenant_1_uuid.png")).thenReturn(resource);

        ResponseEntity<Resource> response = controller.getShopCatalogThumbnail("tenant_1_uuid.png");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getHeaders().getContentType()).isEqualTo(MediaType.IMAGE_PNG);
    }

    @Test
    @DisplayName("path traversal 입력은 400")
    void getShopCatalogThumbnail_pathTraversal_returns400() {
        ResponseEntity<Resource> response = controller.getShopCatalogThumbnail("../etc/passwd");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("미존재 파일은 404")
    void getShopCatalogThumbnail_missing_returns404() {
        when(shopCatalogSkuThumbnailService.loadAsResource("missing.png")).thenReturn(null);

        ResponseEntity<Resource> response = controller.getShopCatalogThumbnail("missing.png");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }
}

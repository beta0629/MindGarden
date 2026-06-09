package com.coresolution.core.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.service.ProfileImageStorageService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

/**
 * {@link FileController#getProfileImage(String)} 의 path traversal 차단 및 정상 서빙 회귀 검증.
 *
 * <p>P0 영구 대책 Phase 2 — 2026-06-09.</p>
 *
 * @author MindGarden
 * @since 2026-06-09
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FileController#getProfileImage — path traversal 차단 + 정상 서빙")
class FileControllerProfileImageServingTest {

    @Mock
    private ProfileImageStorageService profileImageStorageService;

    @InjectMocks
    private FileController controller;

    @Test
    @DisplayName("정상 파일 요청 시 200 + Cache-Control 헤더 포함")
    void getProfileImage_existing_returns200() {
        Resource resource = new ByteArrayResource(new byte[] {1, 2, 3});
        when(profileImageStorageService.loadAsResource("tenantA_1_uuid.png")).thenReturn(resource);

        ResponseEntity<Resource> response = controller.getProfileImage("tenantA_1_uuid.png");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getHeaders().getContentType()).isEqualTo(MediaType.IMAGE_PNG);
        assertThat(response.getHeaders().getFirst(HttpHeaders.CACHE_CONTROL))
            .isEqualTo("public, max-age=86400");
    }

    @Test
    @DisplayName("path traversal 입력은 400 Bad Request")
    void getProfileImage_pathTraversal_returns400() {
        ResponseEntity<Resource> response = controller.getProfileImage("../etc/passwd");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("/ 포함 입력은 400 Bad Request")
    void getProfileImage_slashInName_returns400() {
        ResponseEntity<Resource> response = controller.getProfileImage("sub/dir.png");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("존재하지 않는 파일은 404 Not Found")
    void getProfileImage_missing_returns404() {
        when(profileImageStorageService.loadAsResource("missing.png")).thenReturn(null);

        ResponseEntity<Resource> response = controller.getProfileImage("missing.png");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }
}

package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.coresolution.consultation.constant.ShopCatalogSkuConstants;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.Resource;
import org.springframework.mock.web.MockMultipartFile;

/**
 * {@link ShopCatalogSkuThumbnailServiceImpl} — base-dir 주입·path traversal 가드 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-09-26
 */
@DisplayName("ShopCatalogSkuThumbnailServiceImpl — shared base-dir + path traversal")
class ShopCatalogSkuThumbnailServiceImplTest {

    @TempDir
    Path tempDir;

    private ShopCatalogSkuThumbnailServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new ShopCatalogSkuThumbnailServiceImpl(tempDir.toString());
    }

    @Test
    @DisplayName("저장 성공 시 URL prefix + base-dir 하위 파일 생성")
    void storeThumbnail_writesUnderBaseDir() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "thumb.png",
                "image/png",
                new byte[] {(byte) 0x89, 'P', 'N', 'G'});

        String url = service.storeThumbnail("tenant-a", 42L, file);

        assertThat(url).startsWith(ShopCatalogSkuConstants.THUMBNAIL_URL_PREFIX_V1);
        String fileName = url.substring(ShopCatalogSkuConstants.THUMBNAIL_URL_PREFIX_V1.length());
        assertThat(Files.isRegularFile(tempDir.resolve(fileName))).isTrue();
    }

    @Test
    @DisplayName("loadAsResource — 정상 파일은 Resource 반환")
    void loadAsResource_existing_returnsResource() throws IOException {
        Path target = tempDir.resolve("ok.png");
        Files.writeString(target, "png", StandardCharsets.UTF_8);

        Resource resource = service.loadAsResource("ok.png");

        assertThat(resource).isNotNull();
        assertThat(resource.exists()).isTrue();
    }

    @Test
    @DisplayName("loadAsResource — path traversal 은 null")
    void loadAsResource_pathTraversal_returnsNull() {
        assertThat(service.loadAsResource("../etc/passwd")).isNull();
        assertThat(service.loadAsResource("sub/dir.png")).isNull();
        assertThat(service.loadAsResource("a\\b.png")).isNull();
    }

    @Test
    @DisplayName("빈 파일은 검증 실패")
    void validate_empty_throws() {
        MockMultipartFile empty = new MockMultipartFile("file", "a.png", "image/png", new byte[0]);

        assertThatThrownBy(() -> service.validateThumbnailFile(empty))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(ShopCatalogSkuConstants.THUMBNAIL_FILE_EMPTY_MESSAGE);
    }
}

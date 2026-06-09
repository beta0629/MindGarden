package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.coresolution.consultation.constant.ProfileImageStorageConstants;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.Resource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

/**
 * {@link ProfileImageStorageServiceImpl} 단위 테스트.
 *
 * <p>커버:
 * <ul>
 *   <li>store: 매직바이트(PNG/JPEG/WEBP) 검증, MIME 거부, 사이즈 초과 거부, 파일명 패턴, 디렉터리 자동 생성</li>
 *   <li>deleteByUrl: 우리 prefix 만 처리, 외부 URL/path traversal no-op</li>
 *   <li>loadAsResource: 정상 / path traversal / 미존재</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-06-09
 */
@DisplayName("ProfileImageStorageServiceImpl — 로컬 디스크 업로드 단위")
class ProfileImageStorageServiceImplTest {

    private static final String TENANT_ID = "tenant-x";
    private static final Long USER_ID = 42L;

    @TempDir
    Path tempDir;

    private ProfileImageStorageServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new ProfileImageStorageServiceImpl(tempDir.toString());
    }

    @Test
    @DisplayName("정상 PNG 업로드 시 파일이 저장되고 URL 이 prefix 와 정합")
    void store_validPng_writesAndReturnsUrl() throws IOException {
        MultipartFile file = new MockMultipartFile("file", "avatar.png", "image/png", pngBytes());

        String url = service.store(TENANT_ID, USER_ID, file);

        assertThat(url).startsWith(ProfileImageStorageConstants.URL_PREFIX);
        String fileName = url.substring(ProfileImageStorageConstants.URL_PREFIX.length());
        assertThat(fileName).startsWith(TENANT_ID + "_" + USER_ID + "_");
        assertThat(fileName).endsWith(".png");
        try (Stream<Path> walk = Files.list(tempDir)) {
            assertThat(walk).hasSize(1);
        }
    }

    @Test
    @DisplayName("정상 JPEG 업로드 시 확장자 jpg 로 정규화")
    void store_validJpeg_extensionNormalized() {
        MultipartFile file = new MockMultipartFile("file", "photo.jpeg", "image/jpeg", jpegBytes());

        String url = service.store(TENANT_ID, USER_ID, file);

        assertThat(url).endsWith(".jpg");
    }

    @Test
    @DisplayName("정상 WEBP 업로드 OK")
    void store_validWebp_ok() {
        MultipartFile file = new MockMultipartFile("file", "pic.webp", "image/webp", webpBytes());

        String url = service.store(TENANT_ID, USER_ID, file);

        assertThat(url).endsWith(".webp");
    }

    @Test
    @DisplayName("빈 파일은 IllegalArgumentException")
    void store_emptyFile_rejected() {
        MultipartFile file = new MockMultipartFile("file", "x.png", "image/png", new byte[0]);

        assertThatThrownBy(() -> service.store(TENANT_ID, USER_ID, file))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage(ProfileImageStorageConstants.MSG_FILE_REQUIRED);
    }

    @Test
    @DisplayName("5MB 초과 입력은 IllegalArgumentException")
    void store_oversize_rejected() {
        byte[] big = new byte[(int) ProfileImageStorageConstants.MAX_FILE_SIZE_BYTES + 1];
        byte[] pngHeader = pngBytes();
        System.arraycopy(pngHeader, 0, big, 0, pngHeader.length);
        MultipartFile file = new MockMultipartFile("file", "big.png", "image/png", big);

        assertThatThrownBy(() -> service.store(TENANT_ID, USER_ID, file))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage(ProfileImageStorageConstants.MSG_FILE_TOO_LARGE);
    }

    @Test
    @DisplayName("허용되지 않은 MIME (image/gif) 거부")
    void store_unsupportedMime_rejected() {
        MultipartFile file = new MockMultipartFile("file", "anim.gif", "image/gif", new byte[] {1, 2, 3});

        assertThatThrownBy(() -> service.store(TENANT_ID, USER_ID, file))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage(ProfileImageStorageConstants.MSG_UNSUPPORTED_MIME);
    }

    @Test
    @DisplayName("허용되지 않은 확장자(.gif) 거부 — MIME 만 image/png 라도 차단")
    void store_unsupportedExtension_rejected() {
        MultipartFile file = new MockMultipartFile("file", "anim.gif", "image/png", pngBytes());

        assertThatThrownBy(() -> service.store(TENANT_ID, USER_ID, file))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage(ProfileImageStorageConstants.MSG_UNSUPPORTED_EXTENSION);
    }

    @Test
    @DisplayName("MIME 와 매직바이트 불일치 시 거부 — .png 라고 했는데 본문이 JPEG")
    void store_magicBytesMismatch_rejected() {
        MultipartFile file = new MockMultipartFile("file", "fake.png", "image/png", jpegBytes());

        assertThatThrownBy(() -> service.store(TENANT_ID, USER_ID, file))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage(ProfileImageStorageConstants.MSG_MAGIC_BYTES_MISMATCH);
    }

    @Test
    @DisplayName("deleteByUrl 은 우리 prefix 파일만 unlink; 다른 prefix 는 no-op")
    void deleteByUrl_removesOnlyOwnedFiles() throws IOException {
        MultipartFile file = new MockMultipartFile("file", "avatar.png", "image/png", pngBytes());
        String url = service.store(TENANT_ID, USER_ID, file);
        String fileName = url.substring(ProfileImageStorageConstants.URL_PREFIX.length());
        Path stored = tempDir.resolve(fileName);
        assertThat(Files.exists(stored)).isTrue();

        service.deleteByUrl("https://cdn.example.com/u/9.png");
        assertThat(Files.exists(stored)).isTrue();

        service.deleteByUrl(url);
        assertThat(Files.exists(stored)).isFalse();
    }

    @Test
    @DisplayName("deleteByUrl path traversal 입력은 no-op")
    void deleteByUrl_pathTraversal_noop() throws IOException {
        Path outside = tempDir.getParent().resolve("outside.png");
        Files.write(outside, pngBytes());
        try {
            service.deleteByUrl(ProfileImageStorageConstants.URL_PREFIX + "../outside.png");
            assertThat(Files.exists(outside)).isTrue();
        } finally {
            Files.deleteIfExists(outside);
        }
    }

    @Test
    @DisplayName("loadAsResource 는 path traversal 입력에 대해 null 반환")
    void loadAsResource_pathTraversal_null() {
        Resource resource = service.loadAsResource("../etc/passwd");
        assertThat(resource).isNull();
    }

    @Test
    @DisplayName("loadAsResource 는 존재하지 않으면 null 반환")
    void loadAsResource_missing_null() {
        Resource resource = service.loadAsResource("missing.png");
        assertThat(resource).isNull();
    }

    @Test
    @DisplayName("loadAsResource 는 정상 파일은 readable Resource 반환")
    void loadAsResource_existing_ok() {
        MultipartFile file = new MockMultipartFile("file", "avatar.png", "image/png", pngBytes());
        String url = service.store(TENANT_ID, USER_ID, file);
        String fileName = url.substring(ProfileImageStorageConstants.URL_PREFIX.length());

        Resource resource = service.loadAsResource(fileName);

        assertThat(resource).isNotNull();
        assertThat(resource.exists()).isTrue();
        assertThat(resource.isReadable()).isTrue();
    }

    private static byte[] pngBytes() {
        return new byte[] {
            (byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A,
            0, 0, 0, 13
        };
    }

    private static byte[] jpegBytes() {
        return new byte[] {
            (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0,
            0, 0x10, 'J', 'F', 'I', 'F', 0, 0x01
        };
    }

    private static byte[] webpBytes() {
        return new byte[] {
            'R', 'I', 'F', 'F',
            0x24, 0, 0, 0,
            'W', 'E', 'B', 'P'
        };
    }
}

package com.coresolution.core.util;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

/**
 * {@link TenantLogoFileUtils} base-dir 주입·path traversal 가드 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-09-26
 */
@DisplayName("TenantLogoFileUtils — shared base-dir + path traversal")
class TenantLogoFileUtilsTest {

    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() {
        TenantLogoFileUtils.configureBaseDir(tempDir.toString());
    }

    @AfterEach
    void tearDown() {
        TenantLogoFileUtils.resetBaseDirForTests();
    }

    @Test
    @DisplayName("configureBaseDir 후 uploadBasePath 는 주입 경로")
    void uploadBasePath_usesConfiguredDir() {
        assertThat(TenantLogoFileUtils.uploadBasePath().normalize())
                .isEqualTo(tempDir.toAbsolutePath().normalize());
    }

    @Test
    @DisplayName("resolveExistingLogoFile — 정상 파일")
    void resolveExistingLogoFile_ok() throws IOException {
        String fileName = "tenant-a_853135b9-d696-444b-8a1b-8e752ef4c914.svg";
        Files.writeString(tempDir.resolve(fileName), "<svg/>", StandardCharsets.UTF_8);

        Optional<Path> resolved = TenantLogoFileUtils.resolveExistingLogoFile(fileName);

        assertThat(resolved).isPresent();
        assertThat(resolved.get().getFileName().toString()).isEqualTo(fileName);
    }

    @Test
    @DisplayName("resolveExistingLogoFile — path traversal 은 empty")
    void resolveExistingLogoFile_pathTraversal_empty() {
        assertThat(TenantLogoFileUtils.resolveExistingLogoFile("../etc/passwd")).isEmpty();
        assertThat(TenantLogoFileUtils.resolveExistingLogoFile("a/b.svg")).isEmpty();
    }
}

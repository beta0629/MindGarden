package com.coresolution.core.util;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.attribute.FileTime;
import java.util.Comparator;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;
import lombok.extern.slf4j.Slf4j;

/**
 * 테넌트 로고 업로드 디렉터리·URL 해석 유틸.
 *
 * @author CoreSolution
 * @since 2026-05-19
 */
@Slf4j
public final class TenantLogoFileUtils {

    public static final String LOGO_UPLOAD_DIR = "uploads/logos/";
    public static final String LOGO_URL_PREFIX = "/api/files/logos/";
    public static final String LOGO_URL_PREFIX_V1 = "/api/v1/files/logos/";
    public static final String DEFAULT_LOGO_URL = "/images/core-solution-logo.png";

    private static final Pattern LOGO_FILE_NAME_PATTERN = Pattern.compile(
            "^(.+)_[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\\.[^.]+$");

    private TenantLogoFileUtils() {
    }

    /**
     * 업로드 API 경로로 서빙되는 로고 URL인지 확인합니다.
     *
     * @param url 로고 URL
     * @return 업로드 로고 URL이면 true
     */
    public static boolean isUploadLogoUrl(String url) {
        if (url == null || url.isBlank()) {
            return false;
        }
        String trimmed = url.trim();
        return trimmed.startsWith(LOGO_URL_PREFIX) || trimmed.startsWith(LOGO_URL_PREFIX_V1);
    }

    /**
     * 로고 서빙 URL에서 파일명만 추출합니다.
     *
     * @param url 로고 URL
     * @return 파일명 또는 해당 없으면 null
     */
    public static String extractFileNameFromLogoUrl(String url) {
        if (url == null || url.isBlank()) {
            return null;
        }
        String trimmed = url.trim();
        if (trimmed.startsWith(LOGO_URL_PREFIX_V1)) {
            return trimmed.substring(LOGO_URL_PREFIX_V1.length());
        }
        if (trimmed.startsWith(LOGO_URL_PREFIX)) {
            return trimmed.substring(LOGO_URL_PREFIX.length());
        }
        return null;
    }

    /**
     * 로고 파일명({@code tenantId_uuid.ext})에서 tenantId를 추출합니다.
     *
     * @param fileName 로고 파일명
     * @return tenantId 또는 추출 불가 시 empty
     */
    public static Optional<String> extractTenantIdFromLogoFileName(String fileName) {
        if (fileName == null || fileName.isBlank()) {
            return Optional.empty();
        }
        Matcher matcher = LOGO_FILE_NAME_PATTERN.matcher(fileName.trim());
        if (!matcher.matches()) {
            return Optional.empty();
        }
        return Optional.of(matcher.group(1));
    }

    /**
     * 업로드 디렉터리 기준 절대 경로를 반환합니다.
     *
     * @return uploads/logos 절대 경로
     */
    public static Path uploadBasePath() {
        return Paths.get(LOGO_UPLOAD_DIR).toAbsolutePath().normalize();
    }

    /**
     * 파일명에 해당하는 로고 파일 경로를 반환합니다. 존재·읽기 가능할 때만 non-empty.
     *
     * @param fileName 로고 파일명
     * @return 존재하는 파일 경로
     */
    public static Optional<Path> resolveExistingLogoFile(String fileName) {
        if (fileName == null || fileName.isBlank()) {
            return Optional.empty();
        }
        Path uploadBase = uploadBasePath();
        Path filePath = uploadBase.resolve(fileName).normalize();
        if (!filePath.startsWith(uploadBase)) {
            return Optional.empty();
        }
        if (!Files.isRegularFile(filePath) || !Files.isReadable(filePath)) {
            return Optional.empty();
        }
        return Optional.of(filePath);
    }

    /**
     * {@code {tenantId}_*} 패턴 중 수정 시각이 가장 최신인 로고 파일을 찾습니다.
     *
     * @param tenantId 테넌트 ID
     * @return 최신 로고 파일 경로
     */
    public static Optional<Path> findLatestTenantLogoFile(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            return Optional.empty();
        }
        Path uploadDir = uploadBasePath();
        if (!Files.isDirectory(uploadDir)) {
            return Optional.empty();
        }
        String prefix = tenantId.trim() + "_";
        try (Stream<Path> files = Files.list(uploadDir)) {
            return files
                    .filter(Files::isRegularFile)
                    .filter(path -> path.getFileName().toString().startsWith(prefix))
                    .max(Comparator.comparing(TenantLogoFileUtils::lastModifiedOrEpoch));
        } catch (IOException e) {
            log.warn("테넌트 로고 디렉터리 조회 실패: tenantId={}, error={}", tenantId, e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * 업로드 로고 API URL을 생성합니다.
     *
     * @param fileName 파일명
     * @return /api/files/logos/{fileName}
     */
    public static String buildLogoUrl(String fileName) {
        return LOGO_URL_PREFIX + fileName;
    }

    private static FileTime lastModifiedOrEpoch(Path path) {
        try {
            return Files.getLastModifiedTime(path);
        } catch (IOException e) {
            return FileTime.fromMillis(0L);
        }
    }
}

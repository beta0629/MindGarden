package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.ProfileImageStorageConstants;
import com.coresolution.consultation.service.ProfileImageStorageService;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Base64;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

/**
 * {@link ProfileImageStorageService} 구현체. blue/green 공용 폴더(운영) 또는 로컬 작업폴더(개발) 에
 * 사용자 프로필 이미지를 저장하고 URL 을 반환한다.
 *
 * <p>저장 정책 (사용자 결정 D1~D5, 2026-06-09):
 * <ul>
 *   <li>D1 저장소: {@code mindgarden.upload.profile-image.base-dir} 절대경로 (기본 dev=./uploads/profile-images/)</li>
 *   <li>D2/D3: 최대 5MB, MIME image/jpeg | image/png | image/webp + 매직바이트 검증</li>
 *   <li>D4: 권한 검증은 controller 책임 (본인 + admin override)</li>
 *   <li>D5: 새 업로드 성공 시 호출부가 deleteByUrl 로 이전 파일을 즉시 unlink</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-06-09
 */
@Slf4j
@Service
public class ProfileImageStorageServiceImpl implements ProfileImageStorageService {

    /**
     * base64 dataURI prefix 정규식. P0 핫픽스 — 2026-06-09.
     * 그룹 1: MIME subtype ({@code jpeg|jpg|png|webp}). 정규화 후 MIME 검증과 매핑한다.
     */
    private static final Pattern DATA_URI_PATTERN = Pattern.compile(
        "^data:image/(jpeg|jpg|png|webp);base64,(.+)$",
        Pattern.DOTALL);

    private final String baseDir;

    public ProfileImageStorageServiceImpl(
            @Value("${mindgarden.upload.profile-image.base-dir:./uploads/profile-images/}") String baseDir) {
        this.baseDir = baseDir;
    }

    @Override
    public String store(String tenantId, Long userId, MultipartFile file) {
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalArgumentException("tenantId 가 비어 있습니다.");
        }
        if (userId == null || userId <= 0L) {
            throw new IllegalArgumentException("userId 가 유효하지 않습니다.");
        }
        validate(file);

        String extension = resolveSafeExtension(file);
        String savedFileName = tenantId + "_" + userId + "_" + UUID.randomUUID() + "." + extension;

        Path uploadBase = uploadBasePath();
        try {
            if (!Files.exists(uploadBase)) {
                Files.createDirectories(uploadBase);
            }
            Path target = uploadBase.resolve(savedFileName).normalize();
            if (!target.startsWith(uploadBase)) {
                log.warn("profile image 저장 경로가 허용 범위를 벗어남: tenantId={}, userId={}", tenantId, userId);
                throw new IllegalArgumentException(ProfileImageStorageConstants.MSG_INVALID_FILE_NAME);
            }
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            log.error("profile image 저장 실패: tenantId={}, userId={}", tenantId, userId, e);
            throw new UncheckedIOException(ProfileImageStorageConstants.MSG_STORAGE_FAILED, e);
        }

        String url = ProfileImageStorageConstants.URL_PREFIX + savedFileName;
        log.info("profile image 저장: tenantId={}, userId={}, url={}, size={}",
            tenantId, userId, url, file.getSize());
        return url;
    }

    @Override
    public String storeFromDataUri(String tenantId, Long userId, String dataUri) {
        if (dataUri == null) {
            return null;
        }
        String trimmed = dataUri.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalArgumentException("tenantId 가 비어 있습니다.");
        }
        if (userId == null || userId <= 0L) {
            throw new IllegalArgumentException("userId 가 유효하지 않습니다.");
        }

        Matcher matcher = DATA_URI_PATTERN.matcher(trimmed);
        if (!matcher.matches()) {
            log.warn("profile image base64 dataURI 형식 거부: tenantId={}, userId={}, length={}",
                tenantId, userId, trimmed.length());
            throw new IllegalArgumentException(ProfileImageStorageConstants.MSG_UNSUPPORTED_MIME);
        }

        String mimeSubtype = matcher.group(1).toLowerCase(Locale.ROOT);
        String base64Payload = matcher.group(2);
        String mime = "image/" + ("jpg".equals(mimeSubtype) ? "jpeg" : mimeSubtype);
        if (!ProfileImageStorageConstants.ALLOWED_MIME_TYPES.contains(mime)) {
            throw new IllegalArgumentException(ProfileImageStorageConstants.MSG_UNSUPPORTED_MIME);
        }

        byte[] decoded;
        try {
            decoded = Base64.getDecoder().decode(base64Payload);
        } catch (IllegalArgumentException e) {
            log.warn("profile image base64 디코드 실패: tenantId={}, userId={}", tenantId, userId);
            throw new IllegalArgumentException(ProfileImageStorageConstants.MSG_UNSUPPORTED_MIME);
        }
        if (decoded.length == 0) {
            throw new IllegalArgumentException(ProfileImageStorageConstants.MSG_FILE_REQUIRED);
        }
        if (decoded.length > ProfileImageStorageConstants.MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException(ProfileImageStorageConstants.MSG_FILE_TOO_LARGE);
        }
        if (!matchesMagicBytes(headOf(decoded), mime)) {
            throw new IllegalArgumentException(ProfileImageStorageConstants.MSG_MAGIC_BYTES_MISMATCH);
        }

        String extension = mimeToDefaultExtension(mime);
        String savedFileName = tenantId + "_" + userId + "_" + UUID.randomUUID() + "." + extension;
        Path uploadBase = uploadBasePath();
        try {
            if (!Files.exists(uploadBase)) {
                Files.createDirectories(uploadBase);
            }
            Path target = uploadBase.resolve(savedFileName).normalize();
            if (!target.startsWith(uploadBase)) {
                log.warn("profile image dataURI 저장 경로가 허용 범위를 벗어남: tenantId={}, userId={}",
                    tenantId, userId);
                throw new IllegalArgumentException(ProfileImageStorageConstants.MSG_INVALID_FILE_NAME);
            }
            Files.write(target, decoded);
        } catch (IOException e) {
            log.error("profile image dataURI 저장 실패: tenantId={}, userId={}", tenantId, userId, e);
            throw new UncheckedIOException(ProfileImageStorageConstants.MSG_STORAGE_FAILED, e);
        }

        String url = ProfileImageStorageConstants.URL_PREFIX + savedFileName;
        log.info("profile image dataURI 자동 변환 저장: tenantId={}, userId={}, url={}, size={}",
            tenantId, userId, url, decoded.length);
        return url;
    }

    @Override
    public void deleteByUrl(String url) {
        if (url == null || url.isBlank()) {
            return;
        }
        String trimmed = url.trim();
        if (!trimmed.startsWith(ProfileImageStorageConstants.URL_PREFIX)) {
            return;
        }
        String fileName = trimmed.substring(ProfileImageStorageConstants.URL_PREFIX.length());
        if (!isSafeFileName(fileName)) {
            log.warn("profile image deleteByUrl 차단 — 허용되지 않는 파일명: url={}", trimmed);
            return;
        }
        Path uploadBase = uploadBasePath();
        Path target = uploadBase.resolve(fileName).normalize();
        if (!target.startsWith(uploadBase)) {
            log.warn("profile image deleteByUrl 차단 — 경로 이탈: url={}", trimmed);
            return;
        }
        try {
            boolean deleted = Files.deleteIfExists(target);
            if (deleted) {
                log.info("profile image 삭제 (이전 파일 unlink): fileName={}", fileName);
            }
        } catch (IOException e) {
            log.warn("profile image 삭제 실패 (무시): fileName={}, error={}", fileName, e.getMessage());
        }
    }

    @Override
    public Resource loadAsResource(String fileName) {
        if (!isSafeFileName(fileName)) {
            return null;
        }
        Path uploadBase = uploadBasePath();
        Path target = uploadBase.resolve(fileName).normalize();
        if (!target.startsWith(uploadBase)) {
            return null;
        }
        try {
            Resource resource = new UrlResource(target.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
        } catch (MalformedURLException e) {
            log.warn("profile image 리소스 URL 변환 실패: fileName={}", fileName, e);
        }
        return null;
    }

    /**
     * 업로드 파일 검증: 비어있음 → 사이즈 → MIME → 확장자 → 매직바이트.
     */
    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException(ProfileImageStorageConstants.MSG_FILE_REQUIRED);
        }
        if (file.getSize() > ProfileImageStorageConstants.MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException(ProfileImageStorageConstants.MSG_FILE_TOO_LARGE);
        }
        String mime = file.getContentType();
        if (mime == null || !ProfileImageStorageConstants.ALLOWED_MIME_TYPES.contains(mime.toLowerCase(Locale.ROOT))) {
            throw new IllegalArgumentException(ProfileImageStorageConstants.MSG_UNSUPPORTED_MIME);
        }
        String extension = extractExtensionOrNull(file.getOriginalFilename());
        if (extension == null
                || !ProfileImageStorageConstants.ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException(ProfileImageStorageConstants.MSG_UNSUPPORTED_EXTENSION);
        }
        try {
            byte[] head = readMagicBytes(file);
            if (!matchesMagicBytes(head, mime)) {
                throw new IllegalArgumentException(ProfileImageStorageConstants.MSG_MAGIC_BYTES_MISMATCH);
            }
        } catch (IOException e) {
            throw new UncheckedIOException(ProfileImageStorageConstants.MSG_STORAGE_FAILED, e);
        }
    }

    private String resolveSafeExtension(MultipartFile file) {
        String extension = extractExtensionOrNull(file.getOriginalFilename());
        if (extension == null) {
            return mimeToDefaultExtension(file.getContentType());
        }
        if ("jpeg".equals(extension)) {
            return "jpg";
        }
        return extension;
    }

    private static String mimeToDefaultExtension(String mime) {
        if (mime == null) {
            return "jpg";
        }
        switch (mime.toLowerCase(Locale.ROOT)) {
            case "image/png":
                return "png";
            case "image/webp":
                return "webp";
            case "image/jpeg":
            default:
                return "jpg";
        }
    }

    private static String extractExtensionOrNull(String fileName) {
        if (!StringUtils.hasText(fileName)) {
            return null;
        }
        int dot = fileName.lastIndexOf('.');
        if (dot < 0 || dot >= fileName.length() - 1) {
            return null;
        }
        return fileName.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    /**
     * byte[] 의 head(최대 12 바이트) 를 안전하게 추출한다. dataURI 디코드 결과 매직바이트 검증에 사용.
     */
    private static byte[] headOf(byte[] bytes) {
        if (bytes == null || bytes.length == 0) {
            return new byte[0];
        }
        int len = Math.min(bytes.length, 12);
        byte[] head = new byte[len];
        System.arraycopy(bytes, 0, head, 0, len);
        return head;
    }

    private static byte[] readMagicBytes(MultipartFile file) throws IOException {
        try (var input = file.getInputStream()) {
            byte[] buffer = new byte[12];
            int read = input.read(buffer);
            if (read <= 0) {
                return new byte[0];
            }
            if (read == buffer.length) {
                return buffer;
            }
            byte[] truncated = new byte[read];
            System.arraycopy(buffer, 0, truncated, 0, read);
            return truncated;
        }
    }

    /**
     * 매직바이트 vs MIME 정합성 검증. PNG / JPEG / WEBP(RIFF + WEBP) 3종.
     */
    private static boolean matchesMagicBytes(byte[] head, String mime) {
        if (head == null || mime == null) {
            return false;
        }
        String lowerMime = mime.toLowerCase(Locale.ROOT);
        if ("image/png".equals(lowerMime)) {
            return head.length >= 8
                    && (head[0] & 0xFF) == 0x89
                    && head[1] == 'P'
                    && head[2] == 'N'
                    && head[3] == 'G'
                    && (head[4] & 0xFF) == 0x0D
                    && (head[5] & 0xFF) == 0x0A
                    && (head[6] & 0xFF) == 0x1A
                    && (head[7] & 0xFF) == 0x0A;
        }
        if ("image/jpeg".equals(lowerMime)) {
            return head.length >= 3
                    && (head[0] & 0xFF) == 0xFF
                    && (head[1] & 0xFF) == 0xD8
                    && (head[2] & 0xFF) == 0xFF;
        }
        if ("image/webp".equals(lowerMime)) {
            return head.length >= 12
                    && head[0] == 'R' && head[1] == 'I' && head[2] == 'F' && head[3] == 'F'
                    && head[8] == 'W' && head[9] == 'E' && head[10] == 'B' && head[11] == 'P';
        }
        return false;
    }

    private static boolean isSafeFileName(String fileName) {
        if (!StringUtils.hasText(fileName)) {
            return false;
        }
        if (fileName.contains("..") || fileName.contains("/") || fileName.contains("\\")) {
            return false;
        }
        return true;
    }

    private Path uploadBasePath() {
        return Paths.get(baseDir).toAbsolutePath().normalize();
    }
}

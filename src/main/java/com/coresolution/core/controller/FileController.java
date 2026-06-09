package com.coresolution.core.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.coresolution.consultation.constant.ShopCatalogSkuConstants;
import com.coresolution.consultation.service.ProfileImageStorageService;
import com.coresolution.core.util.TenantLogoFileUtils;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Optional;
import lombok.RequiredArgsConstructor;

/**
 * 파일 서빙 컨트롤러
 * 업로드된 파일들을 서빙하는 REST API
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-26
 */
@Slf4j
@RestController
@RequestMapping({"/api/v1/files", "/api/files"}) // v1 경로 추가, 레거시 경로 유지
@Tag(name = "File", description = "파일 서빙 API")
@RequiredArgsConstructor
public class FileController {

    private final ProfileImageStorageService profileImageStorageService;

    /**
     * 로고 파일 서빙
     */
    @GetMapping("/logos/{fileName}")
    @Operation(summary = "로고 파일 조회", description = "업로드된 로고 파일을 조회합니다")
    public ResponseEntity<Resource> getLogoFile(
            @Parameter(description = "파일명") @PathVariable String fileName) {
        try {
            Optional<Path> resolvedPath = TenantLogoFileUtils.resolveExistingLogoFile(fileName);
            if (resolvedPath.isEmpty()) {
                resolvedPath = resolveFallbackLogoPath(fileName);
            }
            if (resolvedPath.isEmpty()) {
                log.warn("로고 파일을 찾을 수 없음: fileName={}", fileName);
                return ResponseEntity.notFound().build();
            }

            Path filePath = resolvedPath.get();
            Resource resource = new UrlResource(filePath.toUri());
            
            if (!resource.exists() || !resource.isReadable()) {
                log.warn("로고 파일을 읽을 수 없음: fileName={}", fileName);
                return ResponseEntity.notFound().build();
            }
            
            // 파일 확장자에 따른 Content-Type 설정
            String contentType = getContentType(filePath.getFileName().toString());
            
            log.debug("로고 파일 서빙: fileName={}, contentType={}", filePath.getFileName(), contentType);
            
            return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                    "inline; filename=\"" + filePath.getFileName() + "\"")
                .body(resource);
                
        } catch (MalformedURLException e) {
            log.error("로고 파일 경로 오류: fileName={}", fileName, e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * 요청 파일이 없을 때 동일 tenantId prefix 최신 로고 파일을 반환합니다.
     */
    private Optional<Path> resolveFallbackLogoPath(String fileName) {
        Optional<String> tenantId = TenantLogoFileUtils.extractTenantIdFromLogoFileName(fileName);
        if (tenantId.isEmpty()) {
            return Optional.empty();
        }
        Optional<Path> latest = TenantLogoFileUtils.findLatestTenantLogoFile(tenantId.get());
        if (latest.isPresent()) {
            log.info("로고 파일 없음, 테넌트 최신 파일로 서빙: requested={}, fallback={}",
                fileName, latest.get().getFileName());
        }
        return latest;
    }

    /**
     * 쇼핑 카탈로그 SKU 썸네일 서빙.
     */
    @GetMapping("/shop-catalog-thumbnails/{fileName}")
    @Operation(summary = "카탈로그 썸네일 조회", description = "업로드된 SKU 썸네일 이미지를 조회합니다")
    public ResponseEntity<Resource> getShopCatalogThumbnail(
            @Parameter(description = "파일명") @PathVariable String fileName) {
        try {
            Path uploadBase = Paths.get(ShopCatalogSkuConstants.THUMBNAIL_UPLOAD_DIR).toAbsolutePath().normalize();
            Path filePath = uploadBase.resolve(fileName).normalize();
            if (!filePath.startsWith(uploadBase)) {
                log.warn("썸네일 파일 경로가 허용 범위를 벗어남: fileName={}", fileName);
                return ResponseEntity.badRequest().build();
            }
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                Resource placeholder = resolveShopCatalogPlaceholderThumbnail(fileName);
                if (placeholder != null) {
                    resource = placeholder;
                } else {
                    log.warn("썸네일 파일을 찾을 수 없음: fileName={}", fileName);
                    return ResponseEntity.notFound().build();
                }
            }
            String contentType = getContentType(fileName);
            log.debug("썸네일 파일 서빙: fileName={}, contentType={}", fileName, contentType);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                    .body(resource);
        } catch (MalformedURLException e) {
            log.error("썸네일 파일 경로 오류: fileName={}", fileName, e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * 프로필 이미지 서빙.
     *
     * <p>P0 영구 대책 Phase 2 — 2026-06-09. {@link ProfileImageStorageService} 가 로컬 디스크
     * (운영: {@code /var/mindgarden/uploads/profile-images/}) 에 저장한 파일을 서빙한다.
     * path traversal·미존재 파일은 400/404 로 응답하고, 정상 파일은 1일 캐시 헤더와 함께 200 반환.</p>
     */
    @GetMapping("/profile-images/{fileName:.+}")
    @Operation(summary = "프로필 이미지 조회", description = "업로드된 사용자 프로필 이미지를 조회합니다")
    public ResponseEntity<Resource> getProfileImage(
            @Parameter(description = "파일명") @PathVariable String fileName) {
        if (!isSafeProfileImageFileName(fileName)) {
            log.warn("프로필 이미지 잘못된 파일명: fileName={}", fileName);
            return ResponseEntity.badRequest().build();
        }
        Resource resource = profileImageStorageService.loadAsResource(fileName);
        if (resource == null) {
            log.debug("프로필 이미지 파일 없음: fileName={}", fileName);
            return ResponseEntity.notFound().build();
        }
        String contentType = getContentType(fileName);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                .body(resource);
    }

    /**
     * 프로필 이미지 파일명 화이트리스트 — path traversal 차단.
     */
    private static boolean isSafeProfileImageFileName(String fileName) {
        if (fileName == null || fileName.isBlank()) {
            return false;
        }
        return !fileName.contains("..") && !fileName.contains("/") && !fileName.contains("\\");
    }

    /**
     * 업로드 디렉터리에 없을 때 OPS 시드용 classpath placeholder를 반환한다.
     */
    private Resource resolveShopCatalogPlaceholderThumbnail(String fileName) {
        if (!ShopCatalogSkuConstants.SEED_PLACEHOLDER_THUMBNAIL_FILE_NAME.equals(fileName)) {
            return null;
        }
        Resource classpathResource =
                new ClassPathResource(ShopCatalogSkuConstants.SEED_PLACEHOLDER_THUMBNAIL_CLASSPATH);
        try (InputStream ignored = classpathResource.getInputStream()) {
            log.debug("썸네일 placeholder classpath 서빙: fileName={}", fileName);
            return classpathResource;
        } catch (IOException e) {
            log.warn("썸네일 placeholder classpath 리소스 없음: path={}",
                    ShopCatalogSkuConstants.SEED_PLACEHOLDER_THUMBNAIL_CLASSPATH, e);
            return null;
        }
    }

    /**
     * 파일 확장자에 따른 Content-Type 반환
     */
    private String getContentType(String fileName) {
        String extension = getFileExtension(fileName);
        
        switch (extension.toLowerCase()) {
            case "png":
                return "image/png";
            case "jpg":
            case "jpeg":
                return "image/jpeg";
            case "svg":
                return "image/svg+xml";
            case "gif":
                return "image/gif";
            case "webp":
                return "image/webp";
            default:
                return "application/octet-stream";
        }
    }
    
    /**
     * 파일 확장자 추출
     */
    private String getFileExtension(String fileName) {
        if (fileName == null || fileName.lastIndexOf('.') == -1) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf('.') + 1);
    }
}

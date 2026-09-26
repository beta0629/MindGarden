package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.ShopCatalogSkuConstants;
import com.coresolution.consultation.service.ShopCatalogSkuThumbnailService;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

/**
 * Branding 로고·프로필 이미지와 동일한 로컬 디스크·MIME 검증 패턴.
 *
 * <p>운영(blue/green 공용): {@code SHOP_CATALOG_THUMBNAIL_UPLOAD_DIR}
 * (예: {@code /var/mindgarden/uploads/shop-catalog-thumbnails/}).
 * 개발 기본값: {@code ./uploads/shop-catalog-thumbnails/}.</p>
 *
 * @author MindGarden
 * @since 2026-05-23
 */
@Slf4j
@Service
public class ShopCatalogSkuThumbnailServiceImpl implements ShopCatalogSkuThumbnailService {

    private final String baseDir;

    public ShopCatalogSkuThumbnailServiceImpl(
            @Value("${mindgarden.upload.shop-catalog-thumbnail.base-dir:./uploads/shop-catalog-thumbnails/}")
            String baseDir) {
        this.baseDir = baseDir;
    }

    @Override
    public void validateThumbnailFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException(ShopCatalogSkuConstants.THUMBNAIL_FILE_EMPTY_MESSAGE);
        }
        if (file.getSize() > ShopCatalogSkuConstants.THUMBNAIL_MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException(ShopCatalogSkuConstants.THUMBNAIL_FILE_TOO_LARGE_MESSAGE);
        }
        String contentType = file.getContentType();
        boolean supported = false;
        for (String allowed : ShopCatalogSkuConstants.THUMBNAIL_SUPPORTED_CONTENT_TYPES) {
            if (allowed.equals(contentType)) {
                supported = true;
                break;
            }
        }
        if (!supported) {
            throw new IllegalArgumentException(ShopCatalogSkuConstants.THUMBNAIL_UNSUPPORTED_TYPE_MESSAGE);
        }
    }

    @Override
    public String storeThumbnail(String tenantId, Long skuId, MultipartFile file) {
        validateThumbnailFile(file);
        try {
            Path uploadBase = uploadBasePath();
            if (!Files.exists(uploadBase)) {
                Files.createDirectories(uploadBase);
            }
            String extension = extractExtension(file.getOriginalFilename());
            String savedFileName = tenantId + "_" + skuId + "_" + UUID.randomUUID() + "." + extension;
            if (!isSafeFileName(savedFileName)) {
                throw new IllegalArgumentException(ShopCatalogSkuConstants.THUMBNAIL_INVALID_FILE_NAME_MESSAGE);
            }
            Path filePath = uploadBase.resolve(savedFileName).normalize();
            if (!filePath.startsWith(uploadBase)) {
                log.warn("SKU 썸네일 저장 경로가 허용 범위를 벗어남: tenantId={}, skuId={}", tenantId, skuId);
                throw new IllegalArgumentException(ShopCatalogSkuConstants.THUMBNAIL_INVALID_FILE_NAME_MESSAGE);
            }
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            String url = ShopCatalogSkuConstants.THUMBNAIL_URL_PREFIX_V1 + savedFileName;
            log.info("SKU 썸네일 저장: tenantId={}, skuId={}, url={}", tenantId, skuId, url);
            return url;
        } catch (IOException e) {
            log.error("SKU 썸네일 저장 실패: tenantId={}, skuId={}", tenantId, skuId, e);
            throw new RuntimeException("썸네일 업로드 중 오류가 발생했습니다.", e);
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
            log.warn("SKU 썸네일 리소스 URL 변환 실패: fileName={}", fileName, e);
        }
        return null;
    }

    private Path uploadBasePath() {
        return Paths.get(baseDir).toAbsolutePath().normalize();
    }

    private static boolean isSafeFileName(String fileName) {
        if (!StringUtils.hasText(fileName)) {
            return false;
        }
        return !fileName.contains("..") && !fileName.contains("/") && !fileName.contains("\\");
    }

    private static String extractExtension(String fileName) {
        if (!StringUtils.hasText(fileName) || fileName.lastIndexOf('.') == -1) {
            return "png";
        }
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
    }
}

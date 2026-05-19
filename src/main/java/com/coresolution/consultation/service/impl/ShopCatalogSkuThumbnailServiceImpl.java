package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.ShopCatalogSkuConstants;
import com.coresolution.consultation.service.ShopCatalogSkuThumbnailService;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

/**
 * Branding 로고 업로드와 동일한 로컬 디스크·MIME 검증 패턴.
 *
 * @author MindGarden
 * @since 2026-05-23
 */
@Slf4j
@Service
public class ShopCatalogSkuThumbnailServiceImpl implements ShopCatalogSkuThumbnailService {

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
            Path uploadDir = Paths.get(ShopCatalogSkuConstants.THUMBNAIL_UPLOAD_DIR);
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }
            String extension = extractExtension(file.getOriginalFilename());
            String savedFileName = tenantId + "_" + skuId + "_" + UUID.randomUUID() + "." + extension;
            Path filePath = uploadDir.resolve(savedFileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            String url = ShopCatalogSkuConstants.THUMBNAIL_URL_PREFIX_V1 + savedFileName;
            log.info("SKU 썸네일 저장: tenantId={}, skuId={}, url={}", tenantId, skuId, url);
            return url;
        } catch (IOException e) {
            log.error("SKU 썸네일 저장 실패: tenantId={}, skuId={}", tenantId, skuId, e);
            throw new RuntimeException("썸네일 업로드 중 오류가 발생했습니다.", e);
        }
    }

    private static String extractExtension(String fileName) {
        if (!StringUtils.hasText(fileName) || fileName.lastIndexOf('.') == -1) {
            return "png";
        }
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
    }
}

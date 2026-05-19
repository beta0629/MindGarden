package com.coresolution.consultation.service;

import org.springframework.web.multipart.MultipartFile;

/**
 * 카탈로그 SKU 썸네일 파일 저장·검증.
 *
 * @author MindGarden
 * @since 2026-05-23
 */
public interface ShopCatalogSkuThumbnailService {

    /**
     * 썸네일 파일을 저장하고 공개 URL을 반환합니다.
     *
     * @param tenantId 테넌트 ID
     * @param skuId SKU ID
     * @param file 업로드 파일
     * @return {@code /api/v1/files/shop-catalog-thumbnails/...} 형태 URL
     */
    String storeThumbnail(String tenantId, Long skuId, MultipartFile file);

    /**
     * MIME·크기 검증.
     *
     * @param file 업로드 파일
     */
    void validateThumbnailFile(MultipartFile file);
}

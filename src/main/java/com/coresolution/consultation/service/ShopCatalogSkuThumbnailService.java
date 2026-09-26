package com.coresolution.consultation.service;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

/**
 * 카탈로그 SKU 썸네일 파일 저장·검증·서빙 리소스 로드.
 *
 * <p>저장 디렉터리는 blue/green 공용 절대경로
 * ({@code mindgarden.upload.shop-catalog-thumbnail.base-dir}) 로 주입한다.</p>
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

    /**
     * 파일명으로 디스크 리소스를 로드한다. path traversal·미존재 시 null.
     *
     * @param fileName 파일명(경로 구분 문자·{@code ..} 불가)
     * @return 존재·가독 리소스 또는 null
     */
    Resource loadAsResource(String fileName);
}

package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.shop.admin.ShopCatalogSkuAdminDetail;
import com.coresolution.consultation.dto.shop.admin.ShopCatalogSkuAdminItem;
import com.coresolution.consultation.dto.shop.admin.ShopCatalogSkuPriceHistoryItem;
import com.coresolution.consultation.dto.shop.admin.ShopCatalogSkuUpsertRequest;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;

/**
 * 어드민 카탈로그 SKU CRUD·노출.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
public interface AdminShopCatalogSkuService {

    List<ShopCatalogSkuAdminItem> listAllForTenant(String tenantId);

    ShopCatalogSkuAdminDetail getForAdmin(String tenantId, Long id);

    ShopCatalogSkuAdminDetail create(String tenantId, ShopCatalogSkuUpsertRequest request);

    ShopCatalogSkuAdminDetail update(String tenantId, Long id, ShopCatalogSkuUpsertRequest request);

    void patchCatalogVisible(String tenantId, Long id, boolean catalogVisible);

    /**
     * SKU 단가 변경 이력(최근 N건).
     *
     * @param tenantId 테넌트 ID
     * @param skuId SKU ID
     * @param limit 최대 건수
     * @return 변경 이력(최신순)
     */
    List<ShopCatalogSkuPriceHistoryItem> listPriceHistory(String tenantId, Long skuId, int limit);

    /**
     * SKU 대표 썸네일 multipart 업로드 후 URL 반영.
     *
     * @param tenantId 테넌트 ID
     * @param id SKU ID
     * @param file 이미지 파일
     * @return 갱신된 SKU 상세
     */
    ShopCatalogSkuAdminDetail uploadThumbnail(String tenantId, Long id, MultipartFile file);
}

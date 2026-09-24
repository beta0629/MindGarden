package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.shop.admin.ShopCatalogPackageContentRequest;
import com.coresolution.consultation.dto.shop.admin.ShopCatalogPackageFeeItem;
import com.coresolution.consultation.dto.shop.admin.ShopCatalogPackageFeeListResponse;
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

    /**
     * 패키지 요금 관리 행과 연결된 온라인 노출 상태.
     *
     * @param tenantId 테넌트 ID
     * @return 요금 행과 미연결 기존 SKU
     */
    ShopCatalogPackageFeeListResponse listPackageFees(String tenantId);

    /**
     * 패키지 코드 한 건의 온라인 내용.
     *
     * @param tenantId 테넌트 ID
     * @param packageCode 패키지 코드
     * @return 요금 값과 카탈로그 내용
     */
    ShopCatalogPackageFeeItem getPackageFee(String tenantId, String packageCode);

    /**
     * 설명·노출·정렬만 저장한다. 상품명·단가·회기는 요금 관리 값으로 덮어쓴다.
     *
     * @param tenantId 테넌트 ID
     * @param packageCode 패키지 코드
     * @param request 내용
     * @return 저장 결과
     */
    ShopCatalogPackageFeeItem updatePackageContent(
            String tenantId,
            String packageCode,
            ShopCatalogPackageContentRequest request);

    /**
     * 패키지 요금 행의 온라인 노출만 바꾼다. 없으면 연결 행을 만든다.
     *
     * @param tenantId 테넌트 ID
     * @param packageCode 패키지 코드
     * @param catalogVisible 노출 여부
     */
    void patchPackageCatalogVisible(String tenantId, String packageCode, boolean catalogVisible);

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

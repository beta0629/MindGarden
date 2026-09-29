package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.shop.admin.ShopAdminProductItem;
import com.coresolution.consultation.dto.shop.admin.ShopAdminProductListResponse;
import com.coresolution.consultation.dto.shop.admin.ShopAdminProductSaleStatusRequest;

/**
 * 어드민 「상품」 통합 목록·판매 상태. 기존 구매·결제·환불·ERP 행은 건드리지 않는다.
 *
 * @author MindGarden
 * @since 2026-09-29
 */
public interface AdminShopProductService {

    /**
     * 공통코드·패키지 요금 SKU·직접 등록 SKU 를 합친 목록.
     *
     * @param tenantId 테넌트 ID
     * @param page     0-based 페이지
     * @param size     페이지 크기
     * @param segment  ALL|ON_SALE|STOPPED
     * @param query    상품명·코드 검색어
     * @return 페이지 + 세그먼트 건수
     */
    ShopAdminProductListResponse listProducts(String tenantId, int page, int size, String segment, String query);

    /**
     * 판매 상태 변경. 중지 = 판매 사용·홈 공개·몰 노출 off (한 트랜잭션). 재개 = 판매 사용 on 만.
     *
     * @param tenantId 테넌트 ID
     * @param request  대상·다음 상태
     * @return 갱신된 행
     * @throws IllegalArgumentException 대상이 없거나 구분이 틀릴 때
     */
    ShopAdminProductItem updateSaleStatus(String tenantId, ShopAdminProductSaleStatusRequest request);
}

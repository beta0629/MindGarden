package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.publicapi.PublicConsultationProductResponse;
import java.util.List;

/**
 * 센터 홈페이지용 공개 상담 상품 조회.
 *
 * @author MindGarden
 * @since 2026-11-11
 */
public interface PublicTenantConsultationProductService {

    /**
     * 테넌트 슬러그(서브도메인)로 공개 상담 상품 목록을 반환한다.
     * <p>테넌트 없음·비활성이면 빈 목록. 해당 테넌트 SKU만 반환한다.</p>
     *
     * @param tenantSlug 테넌트 서브도메인(슬러그)
     * @return 공개 상품 목록
     */
    List<PublicConsultationProductResponse> listByTenantSlug(String tenantSlug);
}

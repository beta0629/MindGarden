package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.content.ContentReorderRequest;
import com.coresolution.consultation.dto.content.PsychoEducationArticleAdminDetail;
import com.coresolution.consultation.dto.content.PsychoEducationArticleAdminItem;
import com.coresolution.consultation.dto.content.PsychoEducationArticleUpsertRequest;
import java.util.List;

/**
 * 심리교육 마스터 어드민 CRUD·노출·순서.
 *
 * @author MindGarden
 * @since 2026-05-15
 */
public interface PsychoEducationAdminService {

    /**
     * 테넌트 전체(삭제 제외) 목록 — 노출 여부 무관.
     *
     * @param tenantId 테넌트 ID
     * @return 목록
     */
    List<PsychoEducationArticleAdminItem> listAllForTenant(String tenantId);

    /**
     * 상세(어드민).
     *
     * @param tenantId 테넌트 ID
     * @param id       PK
     * @return 상세
     */
    PsychoEducationArticleAdminDetail getForAdmin(String tenantId, Long id);

    /**
     * 생성.
     *
     * @param tenantId 테넌트 ID
     * @param request  요청
     * @return 저장 결과
     */
    PsychoEducationArticleAdminDetail create(String tenantId, PsychoEducationArticleUpsertRequest request);

    /**
     * 수정.
     *
     * @param tenantId 테넌트 ID
     * @param id       PK
     * @param request  요청
     * @return 저장 결과
     */
    PsychoEducationArticleAdminDetail update(String tenantId, Long id, PsychoEducationArticleUpsertRequest request);

    /**
     * 소프트 삭제.
     *
     * @param tenantId 테넌트 ID
     * @param id       PK
     */
    void softDelete(String tenantId, Long id);

    /**
     * 노출(클라이언트) 토글.
     *
     * @param tenantId  테넌트 ID
     * @param id        PK
     * @param published 노출 여부
     */
    void patchPublished(String tenantId, Long id, boolean published);

    /**
     * 표시 순서 일괄 반영.
     *
     * @param tenantId 테넌트 ID
     * @param request  정렬된 ID 목록
     */
    void reorder(String tenantId, ContentReorderRequest request);
}

package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.AdminListPageResult;
import com.coresolution.consultation.dto.request.AdminHomepageInquiryStatusUpdateRequest;
import com.coresolution.consultation.dto.request.PublicHomepageInquiryCreateRequest;
import com.coresolution.consultation.dto.response.AdminHomepageInquiryDetailResponse;
import com.coresolution.consultation.dto.response.AdminHomepageInquiryListItemResponse;
import com.coresolution.consultation.dto.response.AdminHomepageInquiryNewCountResponse;
import com.coresolution.consultation.entity.User;
import jakarta.servlet.http.HttpServletRequest;

/**
 * 홈페이지 문의 공개 접수·관리자 조회 서비스.
 *
 * @author CoreSolution
 * @since 2026-11-11
 */
public interface HomepageInquiryService {

    /**
     * 공개 문의 접수. 허니팟이면 저장하지 않고 정상 완료로 취급한다.
     *
     * @param tenantSlug 테넌트 서브도메인(슬러그)
     * @param request    요청 본문
     * @param httpRequest HTTP 요청(IP·캡차)
     */
    void submitPublicInquiry(String tenantSlug, PublicHomepageInquiryCreateRequest request,
            HttpServletRequest httpRequest);

    /**
     * 관리자 목록(마스킹).
     *
     * @param tenantId 테넌트 ID
     * @param status   상태 필터(null 허용)
     * @param page     page
     * @param size     size
     * @return 페이지 결과
     */
    AdminListPageResult<AdminHomepageInquiryListItemResponse> listForAdmin(
            String tenantId, String status, Integer page, Integer size);

    /**
     * 관리자 상세(복호화) + 개인정보 접근 로그.
     *
     * @param tenantId 테넌트 ID
     * @param id       문의 PK
     * @param viewer   조회 관리자
     * @param httpRequest HTTP 요청
     * @return 상세
     */
    AdminHomepageInquiryDetailResponse getDetailForAdmin(
            String tenantId, Long id, User viewer, HttpServletRequest httpRequest);

    /**
     * 상태 변경.
     *
     * @param tenantId 테넌트 ID
     * @param id       문의 PK
     * @param request  상태
     * @param actor    변경자
     * @return 상세(마스킹 없이 상태 확인용 — 전화·이름은 마스킹 목록과 동일하게 상세 재조회 권장)
     */
    AdminHomepageInquiryDetailResponse updateStatus(
            String tenantId, Long id, AdminHomepageInquiryStatusUpdateRequest request, User actor);

    /**
     * 신규(NEW) 건수.
     *
     * @param tenantId 테넌트 ID
     * @return 건수 DTO
     */
    AdminHomepageInquiryNewCountResponse countNew(String tenantId);
}

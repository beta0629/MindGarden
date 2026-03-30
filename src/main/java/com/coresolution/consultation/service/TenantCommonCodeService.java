package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.CommonCodeCreateRequest;
import com.coresolution.consultation.dto.CommonCodeResponse;
import com.coresolution.consultation.dto.CommonCodeUpdateRequest;
import com.coresolution.consultation.entity.CodeGroupMetadata;

import java.util.List;

/**
 * 테넌트 공통코드 관리 서비스
 * 
 * 테넌트 관리자가 자신의 테넌트 전용 공통코드를 관리합니다.
 * - CONSULTATION_PACKAGE (상담 패키지 - 금액 포함)
 * - PAYMENT_METHOD (결제 방법)
 * - SPECIALTY (전문 분야)
 * - CONSULTATION_TYPE (상담 유형)
 * - FINANCIAL_CATEGORY (재무 카테고리)
 * 등
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-12-03
 */
public interface TenantCommonCodeService {

    /**
     * 테넌트 공통코드 그룹 목록 조회
     * 
     * @param tenantId 테넌트 ID
     * @return 테넌트 공통코드 그룹 메타데이터 목록
     */
    List<CodeGroupMetadata> getTenantCodeGroups(String tenantId);

    /**
     * 특정 그룹의 테넌트 공통코드 목록 조회
     * 
     * @param tenantId 테넌트 ID
     * @param codeGroup 코드 그룹명 (예: CONSULTATION_PACKAGE)
     * @return 공통코드 목록
     */
    List<CommonCodeResponse> getTenantCodesByGroup(String tenantId, String codeGroup);

    /**
     * 테넌트 공통코드 생성
     * 
     * @param tenantId 테넌트 ID
     * @param request 생성 요청 DTO
     * @return 생성된 공통코드
     */
    CommonCodeResponse createTenantCode(String tenantId, CommonCodeCreateRequest request);

    /**
     * 테넌트 공통코드 수정
     * 
     * @param tenantId 테넌트 ID
     * @param codeId 코드 ID
     * @param request 수정 요청 DTO
     * @return 수정된 공통코드
     */
    CommonCodeResponse updateTenantCode(String tenantId, Long codeId, CommonCodeUpdateRequest request);

    /**
     * 테넌트 공통코드 삭제 (소프트 삭제)
     * 
     * @param tenantId 테넌트 ID
     * @param codeId 코드 ID
     */
    void deleteTenantCode(String tenantId, Long codeId);

    /**
     * 테넌트 공통코드 활성화/비활성화
     * 
     * @param tenantId 테넌트 ID
     * @param codeId 코드 ID
     * @param isActive 활성 여부
     * @return 수정된 공통코드
     */
    CommonCodeResponse toggleTenantCodeActive(String tenantId, Long codeId, boolean isActive);

    /**
     * 테넌트 공통코드 정렬 순서 변경
     * 
     * @param tenantId 테넌트 ID
     * @param codeId 코드 ID
     * @param newOrder 새로운 정렬 순서
     * @return 수정된 공통코드
     */
    CommonCodeResponse updateTenantCodeOrder(String tenantId, Long codeId, int newOrder);

    /**
     * 상담 패키지 생성 (금액 포함)
     * 
     * @param tenantId 테넌트 ID
     * @param packageName 패키지명
     * @param price 금액
     * @param duration 기간 (분)
     * @param sessions 회기 수
     * @param description 설명
     * @return 생성된 상담 패키지
     */
    CommonCodeResponse createConsultationPackage(
        String tenantId,
        String packageName,
        Integer price,
        Integer duration,
        Integer sessions,
        String description
    );

    /**
     * 평가 유형 생성 (금액 포함)
     * 
     * @param tenantId 테넌트 ID
     * @param assessmentName 평가명
     * @param price 금액
     * @param duration 소요 시간 (분)
     * @param description 설명
     * @return 생성된 평가 유형
     */
    CommonCodeResponse createAssessmentType(
        String tenantId,
        String assessmentName,
        Integer price,
        Integer duration,
        String description
    );

    /**
     * 테넌트 공통코드 검증
     * - 해당 코드가 테넌트 소유인지 확인
     * - 시스템 공통코드는 수정 불가
     * 
     * @param tenantId 테넌트 ID
     * @param codeId 코드 ID
     * @return 검증 성공 여부
     */
    boolean validateTenantCodeOwnership(String tenantId, Long codeId);
}


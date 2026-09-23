package com.coresolution.core.service;

import com.coresolution.core.domain.enums.ApprovalStatus;
import com.coresolution.core.domain.enums.PgConfigurationStatus;
import com.coresolution.core.domain.enums.PgProvider;
import com.coresolution.core.dto.*;

import java.util.List;

/**
 * 테넌트 PG 설정 서비스 인터페이스
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public interface TenantPgConfigurationService {
    
    // ==================== 테넌트 PG 설정 관리 ====================
    
    /**
     * 테넌트 PG 설정 목록 조회
     */
    List<TenantPgConfigurationResponse> getConfigurations(String tenantId, PgConfigurationStatus status, ApprovalStatus approvalStatus);
    
    /**
     * 테넌트 PG 설정 상세 조회
     */
    TenantPgConfigurationDetailResponse getConfigurationDetail(String tenantId, String configId);
    
    /**
     * 테넌트 PG 설정 생성
     */
    TenantPgConfigurationResponse createConfiguration(String tenantId, TenantPgConfigurationRequest request, String requestedBy);
    
    /**
     * 테넌트 PG 설정 수정
     */
    TenantPgConfigurationResponse updateConfiguration(String tenantId, String configId, TenantPgConfigurationRequest request);

    /**
     * 포트원(IAMPORT) 채널 키·테스트모드만 부분 수정한다.
     * status / approvalStatus 는 변경하지 않는다(재승인 없음).
     *
     * @param tenantId 테넌트 ID
     * @param configId PG 설정 ID
     * @param request  채널 키·테스트모드 부분 수정 요청
     * @return 수정된 PG 설정
     * @throws IllegalArgumentException 설정 없음·IAMPORT 아님·필수 채널 키 누락
     */
    TenantPgConfigurationResponse updatePortoneSettings(
            String tenantId,
            String configId,
            TenantPgPortoneSettingsUpdateRequest request);
    
    /**
     * 테넌트 PG 설정 삭제
     */
    void deleteConfiguration(String tenantId, String configId);
    
    // ==================== 운영 포털 승인 관리 ====================
    
    /**
     * 승인 대기 중인 PG 설정 목록 조회
     */
    List<TenantPgConfigurationResponse> getPendingApprovals(String tenantId, PgProvider pgProvider);
    
    /**
     * PG 설정 승인
     */
    TenantPgConfigurationResponse approveConfiguration(String configId, PgConfigurationApproveRequest request);
    
    /**
     * PG 설정 거부
     */
    TenantPgConfigurationResponse rejectConfiguration(String configId, PgConfigurationRejectRequest request);
    
    /**
     * PG 설정 활성화
     */
    TenantPgConfigurationResponse activateConfiguration(String configId, String activatedBy);
    
    /**
     * PG 설정 비활성화
     */
    TenantPgConfigurationResponse deactivateConfiguration(String configId, String deactivatedBy);
    
    // ==================== PG 연결 테스트 ====================
    
    /**
     * PG 연결 테스트
     */
    ConnectionTestResponse testConnection(String tenantId, String configId);
    
    /**
     * PG 연결 테스트 (승인 전)
     */
    ConnectionTestResponse testConnectionBeforeApproval(String configId);
    
    // ==================== 결제 시스템 통합용 ====================
    
    /**
     * 테넌트의 활성화된 PG 설정 목록 조회
     * 결제 시스템에서 사용할 활성화되고 승인된 PG 설정을 조회
     * 
     * @param tenantId 테넌트 ID
     * @param pgProvider PG 제공자 (선택적, null이면 모든 활성화된 설정 반환)
     * @return 활성화된 PG 설정 목록
     */
    List<TenantPgConfigurationResponse> getActiveConfigurations(String tenantId, PgProvider pgProvider);
    
    /**
     * 테넌트의 특정 PG 제공자에 대한 활성화된 설정 조회
     * 결제 시스템에서 특정 PG 제공자의 설정을 사용할 때 호출
     * 
     * @param tenantId 테넌트 ID
     * @param pgProvider PG 제공자
     * @return 활성화된 PG 설정 상세 (없으면 null)
     */
    TenantPgConfigurationDetailResponse getActiveConfigurationByProvider(String tenantId, PgProvider pgProvider);

    /**
     * 포트원 V2 브라우저 SDK 용 공개 클라이언트 설정(시크릿 제외).
     * ACTIVE+APPROVED IAMPORT 설정이 필요하며, testMode 에 맞는 channelKey 가 없으면 예외.
     *
     * @param tenantId 테넌트 ID
     * @return 클라이언트 설정
     * @throws IllegalStateException ACTIVE IAMPORT 없거나 channelKey/storeId 누락
     */
    PortOneClientConfigResponse getActivePortOneClientConfig(String tenantId);
}


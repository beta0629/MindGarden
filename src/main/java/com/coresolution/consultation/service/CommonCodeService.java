package com.coresolution.consultation.service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.dto.CommonCodeDto;
import com.coresolution.consultation.dto.CommonCodeCreateRequest;
import com.coresolution.consultation.dto.CommonCodeUpdateRequest;
import com.coresolution.consultation.dto.CommonCodeResponse;
import com.coresolution.consultation.dto.CommonCodeListResponse;
import com.coresolution.consultation.entity.CommonCode;

/**
 * 공통코드 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
public interface CommonCodeService {
    
    // 모든 공통코드 조회
    List<CommonCode> getAllCommonCodes();
    
    // 코드 그룹별 조회
    List<CommonCode> getCommonCodesByGroup(String codeGroup);
    
    // 활성 코드만 조회
    List<CommonCode> getActiveCommonCodesByGroup(String codeGroup);
    
    // 활성 코드를 Map 형태로 조회 (프론트엔드용)
    List<Map<String, Object>> getActiveCodesByGroup(String codeGroup);
    
    // ID로 조회
    CommonCode getCommonCodeById(Long id);
    
    // 코드 그룹과 값으로 조회
    CommonCode getCommonCodeByGroupAndValue(String codeGroup, String codeValue);
    
    // ==================== 표준화된 CRUD 메서드 ====================
    
    /**
     * 공통코드 생성 (표준화)
     * 
     * @param request 생성 요청 DTO
     * @param createdBy 생성자
     * @return 생성된 공통코드 응답
     */
    CommonCodeResponse create(CommonCodeCreateRequest request, String createdBy);
    
    /**
     * 공통코드 수정 (표준화)
     * 
     * @param id 공통코드 ID
     * @param request 수정 요청 DTO
     * @param updatedBy 수정자
     * @return 수정된 공통코드 응답
     */
    CommonCodeResponse update(Long id, CommonCodeUpdateRequest request, String updatedBy);
    
    /**
     * 공통코드 삭제 (표준화, 소프트 삭제)
     * 
     * @param id 공통코드 ID
     * @param deletedBy 삭제자
     */
    void delete(Long id, String deletedBy);
    
    /**
     * 공통코드 상세 조회 (표준화)
     * 
     * @param id 공통코드 ID
     * @return 공통코드 응답
     */
    CommonCodeResponse findById(Long id);
    
    /**
     * 공통코드 목록 조회 (표준화)
     * 
     * @param codeGroup 코드 그룹 (선택)
     * @return 공통코드 목록 응답
     */
    CommonCodeListResponse findAll(String codeGroup);
    
    // ==================== 기존 메서드 (하위 호환성) ====================
    
    // 공통코드 생성 (하위 호환성)
    CommonCode createCommonCode(CommonCodeDto dto);
    
    // 공통코드 수정 (하위 호환성)
    CommonCode updateCommonCode(Long id, CommonCodeDto dto);
    
    // 공통코드 삭제 (하위 호환성)
    void deleteCommonCode(Long id);
    
    // 공통코드 활성화/비활성화
    CommonCode toggleCommonCodeStatus(Long id);
    
    // 모든 코드 그룹 목록 조회
    List<String> getAllCodeGroups();
    
    // 코드 그룹별 통계 조회
    Map<String, Object> getCodeGroupStatistics(String codeGroup);
    
    // 공통코드 일괄 생성
    List<CommonCode> createCommonCodesBatch(List<CommonCodeDto> dtos);
    
    // 코드 그룹과 값으로 코드명 조회
    String getCodeName(String codeGroup, String codeValue);
    
    // 코드 그룹과 값으로 코드 값 조회 (통계 설정용)
    String getCodeValue(String codeGroup, String codeValue);
    
    // 코드 그룹과 값으로 한글명 조회
    String getCodeKoreanName(String codeGroup, String codeValue);
    
    // 공통 코드의 추가 데이터 업데이트
    void updateCodeExtraData(String codeGroup, String codeValue, String extraData);
    
    // 단일 공통 코드 조회
    CommonCode getCode(String groupCode, String codeValue);
    
    // 코드 그룹별 조회 (별칭 메서드)
    List<CommonCode> getCodesByGroup(String codeGroup);
    
    // 여러 그룹의 공통코드 조회
    Map<String, List<CommonCode>> getCommonCodesByGroups(String[] groups);
    
    // 여러 그룹의 활성 공통코드 조회
    Map<String, List<CommonCode>> getActiveCommonCodesByGroups(String[] groups);
    
    // 공통코드 그룹 목록 조회
    List<String> getCommonCodeGroups();
    
    // 특정 그룹과 값으로 공통코드 조회
    CommonCode getCommonCode(String groupCode, String codeValue);
    
    // 공통코드 비활성화
    int deactivateCommonCodes(List<String> codeValues);
    
    // ==================== 코어솔루션 코드 조회 ====================
    
    /**
     * 코어솔루션 코드 그룹별 조회
     */
    List<CommonCode> getCoreCodesByGroup(String codeGroup);
    
    /**
     * 코어솔루션 코드 그룹과 값으로 조회
     */
    Optional<CommonCode> getCoreCodeByGroupAndValue(String codeGroup, String codeValue);
    
    // ==================== 테넌트별 코드 조회 ====================
    
    /**
     * 테넌트별 코드 그룹별 조회
     */
    List<CommonCode> getTenantCodesByGroup(String tenantId, String codeGroup);
    
    /**
     * 현재 테넌트의 코드 그룹별 조회
     */
    List<CommonCode> getCurrentTenantCodesByGroup(String codeGroup);
    
    /**
     * 테넌트별 코드 그룹과 값으로 조회
     */
    Optional<CommonCode> getTenantCodeByGroupAndValue(String tenantId, String codeGroup, String codeValue);
    
    // ==================== 통합 조회 (우선순위: 테넌트 > 코어) ====================
    
    /**
     * 코드 조회 (테넌트 코드 우선, 없으면 코어 코드)
     * 코드 그룹 타입은 공통코드에서 동적으로 조회
     */
    List<CommonCode> getCodesByGroupWithFallback(String tenantId, String codeGroup);
    
    /**
     * 현재 테넌트 컨텍스트 기반 코드 조회
     * 코드 그룹 타입은 공통코드에서 동적으로 조회
     */
    List<CommonCode> getCodesByGroupWithCurrentTenant(String codeGroup);
    
    /**
     * 코드 그룹이 코어솔루션 코드인지 확인 (공통코드에서 조회)
     * 하드코딩 금지
     */
    boolean isCoreCodeGroup(String codeGroup);
}

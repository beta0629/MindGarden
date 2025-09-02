package com.mindgarden.consultation.service;

import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.dto.CodeGroupDto;
import com.mindgarden.consultation.dto.CodeValueDto;

/**
 * 코드 관리 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
public interface CodeManagementService {
    
    // ==================== 코드 그룹 관리 ====================
    
    /**
     * 모든 코드 그룹 조회
     */
    List<CodeGroupDto> getAllCodeGroups();
    
    /**
     * 코드 그룹 생성
     */
    CodeGroupDto createCodeGroup(CodeGroupDto dto);
    
    /**
     * 코드 그룹 수정
     */
    CodeGroupDto updateCodeGroup(Long id, CodeGroupDto dto);
    
    /**
     * 코드 그룹 삭제
     */
    void deleteCodeGroup(Long id);
    
    // ==================== 코드 값 관리 ====================
    
    /**
     * 코드 그룹별 코드 값 조회
     */
    List<CodeValueDto> getCodeValuesByGroup(String groupCode);
    
    /**
     * 코드 값 생성
     */
    CodeValueDto createCodeValue(CodeValueDto dto);
    
    /**
     * 코드 값 수정
     */
    CodeValueDto updateCodeValue(Long id, CodeValueDto dto);
    
    /**
     * 코드 값 삭제
     */
    void deleteCodeValue(Long id);
    
    // ==================== 코드 조회 (캐시) ====================
    
    /**
     * 코드 그룹별 코드 값들을 Map으로 조회 (캐시)
     */
    Map<String, String> getCodeValueMap(String groupCode);
    
    /**
     * 특정 코드의 한글명 조회
     */
    String getCodeName(String groupCode, String code);
    
    /**
     * 상담 유형별 상담 시간 조회
     */
    Integer getConsultationDuration(String consultationType);
    
    /**
     * 코드 값 상세 정보 조회
     */
    CodeValueDto getCodeValue(String groupCode, String code);
}

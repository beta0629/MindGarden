package com.mindgarden.consultation.service;

import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.dto.CommonCodeDto;
import com.mindgarden.consultation.entity.CommonCode;

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
    
    // ID로 조회
    CommonCode getCommonCodeById(Long id);
    
    // 코드 그룹과 값으로 조회
    CommonCode getCommonCodeByGroupAndValue(String codeGroup, String codeValue);
    
    // 공통코드 생성
    CommonCode createCommonCode(CommonCodeDto dto);
    
    // 공통코드 수정
    CommonCode updateCommonCode(Long id, CommonCodeDto dto);
    
    // 공통코드 삭제
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
}

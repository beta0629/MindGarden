package com.mindgarden.consultation.service;

import com.mindgarden.consultation.entity.CommonCode;
import java.util.List;
import java.util.Map;

/**
 * 지점 관련 공통코드 서비스
 * 기존 공통코드 시스템을 활용한 지점 관리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-16
 */
public interface BranchCommonCodeService {
    
    /**
     * 지점 상태 공통코드 조회
     * @return 지점 상태 코드 목록
     */
    List<CommonCode> getBranchStatusCodes();
    
    /**
     * 지점 유형 공통코드 조회
     * @return 지점 유형 코드 목록
     */
    List<CommonCode> getBranchTypeCodes();
    
    /**
     * 지점별 권한 공통코드 조회
     * @return 지점별 권한 코드 목록
     */
    List<CommonCode> getBranchPermissionCodes();
    
    /**
     * 지점 통계 항목 공통코드 조회
     * @return 지점 통계 항목 코드 목록
     */
    List<CommonCode> getBranchStatisticsCodes();
    
    /**
     * 지점 설정 공통코드 조회
     * @return 지점 설정 코드 목록
     */
    List<CommonCode> getBranchSettingCodes();
    
    /**
     * 지점 관련 모든 공통코드 조회
     * @return 지점 관련 코드 목록
     */
    Map<String, List<CommonCode>> getAllBranchCodes();
    
    /**
     * 지점 코드명 조회
     * @param codeGroup 코드 그룹
     * @param codeValue 코드 값
     * @return 코드명
     */
    String getBranchCodeName(String codeGroup, String codeValue);
    
    /**
     * 지점 상태 코드명 조회
     * @param status 상태 값
     * @return 상태명
     */
    String getBranchStatusName(String status);
    
    /**
     * 지점 유형 코드명 조회
     * @param type 유형 값
     * @return 유형명
     */
    String getBranchTypeName(String type);
}

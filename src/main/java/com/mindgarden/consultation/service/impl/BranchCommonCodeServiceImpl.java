package com.mindgarden.consultation.service.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.entity.CommonCode;
import com.mindgarden.consultation.service.BranchCommonCodeService;
import com.mindgarden.consultation.service.CommonCodeService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 지점 관련 공통코드 서비스 구현체
 * 기존 공통코드 시스템을 활용한 지점 관리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-16
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BranchCommonCodeServiceImpl implements BranchCommonCodeService {
    
    private final CommonCodeService commonCodeService;
    
    // 지점 관련 공통코드 그룹 상수 (기존 동적 시스템 활용)
    private static final String BRANCH_STATUS_GROUP = "BRANCH_STATUS";
    private static final String BRANCH_TYPE_GROUP = "BRANCH_TYPE";
    private static final String BRANCH_PERMISSION_GROUP = "BRANCH_PERMISSION";
    private static final String BRANCH_STATISTICS_GROUP = "BRANCH_STATISTICS";
    private static final String BRANCH_SETTING_GROUP = "BRANCH_SETTING";
    
    // 기존 동적 시스템의 코드 그룹들 활용
    private static final String ROLE_PERMISSION_GROUP = "ROLE_PERMISSION";
    private static final String MENU_GROUP = "MENU";
    private static final String USER_ROLE_GROUP = "USER_ROLE";
    
    @Override
    public List<CommonCode> getBranchStatusCodes() {
        log.debug("지점 상태 공통코드 조회");
        return commonCodeService.getActiveCommonCodesByGroup(BRANCH_STATUS_GROUP);
    }
    
    @Override
    public List<CommonCode> getBranchTypeCodes() {
        log.debug("지점 유형 공통코드 조회");
        return commonCodeService.getActiveCommonCodesByGroup(BRANCH_TYPE_GROUP);
    }
    
    @Override
    public List<CommonCode> getBranchPermissionCodes() {
        log.debug("지점별 권한 공통코드 조회");
        return commonCodeService.getActiveCommonCodesByGroup(BRANCH_PERMISSION_GROUP);
    }
    
    @Override
    public List<CommonCode> getBranchStatisticsCodes() {
        log.debug("지점 통계 항목 공통코드 조회");
        return commonCodeService.getActiveCommonCodesByGroup(BRANCH_STATISTICS_GROUP);
    }
    
    @Override
    public List<CommonCode> getBranchSettingCodes() {
        log.debug("지점 설정 공통코드 조회");
        return commonCodeService.getActiveCommonCodesByGroup(BRANCH_SETTING_GROUP);
    }
    
    @Override
    public Map<String, List<CommonCode>> getAllBranchCodes() {
        log.debug("지점 관련 모든 공통코드 조회");
        
        Map<String, List<CommonCode>> allCodes = new HashMap<>();
        allCodes.put("status", getBranchStatusCodes());
        allCodes.put("type", getBranchTypeCodes());
        allCodes.put("permission", getBranchPermissionCodes());
        allCodes.put("statistics", getBranchStatisticsCodes());
        allCodes.put("setting", getBranchSettingCodes());
        
        return allCodes;
    }
    
    @Override
    public String getBranchCodeName(String codeGroup, String codeValue) {
        try {
            CommonCode code = commonCodeService.getCommonCodeByGroupAndValue(codeGroup, codeValue);
            return code.getCodeLabel();
        } catch (Exception e) {
            log.warn("공통코드 조회 실패: 그룹={}, 값={}", codeGroup, codeValue);
            return codeValue; // 기본값으로 원본 값 반환
        }
    }
    
    @Override
    public String getBranchStatusName(String status) {
        return getBranchCodeName(BRANCH_STATUS_GROUP, status);
    }
    
    @Override
    public String getBranchTypeName(String type) {
        return getBranchCodeName(BRANCH_TYPE_GROUP, type);
    }
}

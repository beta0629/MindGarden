package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.entity.CodeGroupMetadata;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.repository.CodeGroupMetadataRepository;
import com.coresolution.consultation.service.CodeGroupMetadataService;
import com.coresolution.consultation.service.CommonCodeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * 코드 그룹 메타데이터 서비스 구현체
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class CodeGroupMetadataServiceImpl implements CodeGroupMetadataService {
    
    private final CommonCodeService commonCodeService;
    private final CodeGroupMetadataRepository codeGroupMetadataRepository;
    
    @Override
    @Transactional(readOnly = true)
    public boolean isCoreCodeGroup(String codeGroup) {
        CodeGroupMetadata metadata = codeGroupMetadataRepository.findByGroupName(codeGroup)
            .orElse(null);
        
        if (metadata == null) {
            // 메타데이터가 없으면 기본값: 테넌트별로 간주
            log.debug("코드 그룹 메타데이터 없음, 테넌트별로 간주: {}", codeGroup);
            return false;
        }
        
        if (metadata.getCodeType() == null || metadata.getCodeType().isEmpty()) {
            log.debug("코드 그룹 타입 없음, 테넌트별로 간주: {}", codeGroup);
            return false;
        }
        
        // 공통코드에서 CODE_GROUP_TYPE 조회 (하드코딩 금지)
        Optional<CommonCode> codeType = commonCodeService.getCoreCodeByGroupAndValue(
            "CODE_GROUP_TYPE",
            metadata.getCodeType()
        );
        
        // 공통코드에서 'CORE' 값 조회
        Optional<CommonCode> coreType = commonCodeService.getCoreCodeByGroupAndValue(
            "CODE_GROUP_TYPE",
            "CORE"
        );
        
        boolean isCore = codeType.isPresent() && coreType.isPresent() 
            && codeType.get().getCodeValue().equals(coreType.get().getCodeValue());
        
        log.debug("코드 그룹 타입 확인: {} = {}", codeGroup, isCore ? "CORE" : "TENANT");
        return isCore;
    }
    
    @Override
    @Transactional(readOnly = true)
    public String getCodeGroupType(String codeGroup) {
        CodeGroupMetadata metadata = codeGroupMetadataRepository.findByGroupName(codeGroup)
            .orElse(null);
        
        if (metadata == null) {
            // 기본값도 공통코드에서 조회
            Optional<CommonCode> defaultType = commonCodeService.getCoreCodeByGroupAndValue(
                "CODE_GROUP_TYPE",
                "TENANT"
            );
            return defaultType.map(CommonCode::getCodeValue).orElse("TENANT");
        }
        
        if (metadata.getCodeType() == null || metadata.getCodeType().isEmpty()) {
            // 기본값도 공통코드에서 조회
            Optional<CommonCode> defaultType = commonCodeService.getCoreCodeByGroupAndValue(
                "CODE_GROUP_TYPE",
                "TENANT"
            );
            return defaultType.map(CommonCode::getCodeValue).orElse("TENANT");
        }
        
        // 메타데이터의 code_type도 공통코드에서 검증
        Optional<CommonCode> codeType = commonCodeService.getCoreCodeByGroupAndValue(
            "CODE_GROUP_TYPE",
            metadata.getCodeType()
        );
        
        return codeType.map(CommonCode::getCodeValue)
            .orElse(metadata.getCodeType());
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<CodeGroupMetadata> getCodeGroupMetadata(String codeGroup) {
        return codeGroupMetadataRepository.findByGroupName(codeGroup);
    }
}


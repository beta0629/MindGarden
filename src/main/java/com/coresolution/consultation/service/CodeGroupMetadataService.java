package com.coresolution.consultation.service;

import com.coresolution.consultation.entity.CodeGroupMetadata;
import java.util.Optional;

/**
 * 코드 그룹 메타데이터 서비스 인터페이스
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public interface CodeGroupMetadataService {
    
    /**
     * 코드 그룹이 코어솔루션 코드인지 확인 (공통코드에서 조회)
     * 하드코딩 절대 금지 - 모든 것은 공통코드에서 조회
     */
    boolean isCoreCodeGroup(String codeGroup);
    
    /**
     * 코드 그룹 타입 조회 (공통코드에서)
     * 하드코딩 절대 금지
     */
    String getCodeGroupType(String codeGroup);
    
    /**
     * 코드 그룹 메타데이터 조회
     */
    Optional<CodeGroupMetadata> getCodeGroupMetadata(String codeGroup);
}


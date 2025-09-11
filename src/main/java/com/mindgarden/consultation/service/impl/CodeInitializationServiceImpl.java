package com.mindgarden.consultation.service.impl;

import java.util.List;
import com.mindgarden.consultation.entity.CommonCode;
import com.mindgarden.consultation.repository.CommonCodeRepository;
import com.mindgarden.consultation.service.CodeInitializationService;
import com.mindgarden.consultation.service.CommonCodeService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 코드 초기화 서비스 구현체
 * 애플리케이션 시작 시 기본 코드 그룹과 코드 값들을 자동 생성
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
// @Service  // 기존 테이블 삭제로 인해 비활성화
@RequiredArgsConstructor
@Transactional
public class CodeInitializationServiceImpl implements CodeInitializationService, CommandLineRunner {
    
    private final CommonCodeRepository commonCodeRepository;
    private final CommonCodeService commonCodeService;
    
    @Override
    public void run(String... args) throws Exception {
        log.info("⏭️ 코드 초기화 서비스 비활성화됨 (마이그레이션 완료)");
        // initializeDefaultCodes(); // 마이그레이션 완료로 인해 비활성화
    }
    
    @Override
    public void initializeDefaultCodes() {
        log.info("⏭️ 기본 코드 초기화 비활성화됨 (마이그레이션 완료)");
        // 마이그레이션 완료로 인해 비활성화
    }
    
    @Override
    public boolean isCodeGroupExists(String groupCode) {
        try {
            List<CommonCode> commonCodes = commonCodeService.getCommonCodesByGroup(groupCode);
            return commonCodes != null && !commonCodes.isEmpty();
        } catch (Exception e) {
            log.debug("코드 그룹 존재 확인 실패: {} - {}", groupCode, e.getMessage());
            return false;
        }
    }
}

package com.coresolution.consultation.service.impl;

import java.util.List;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.service.CodeInitializationService;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;
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
@Service  // 급여 시스템 데이터 초기화를 위해 활성화
@RequiredArgsConstructor
@Transactional
public class CodeInitializationServiceImpl implements CodeInitializationService, CommandLineRunner {
    
    private final CommonCodeRepository commonCodeRepository;
    private final CommonCodeService commonCodeService;
    
    @Override
    public void run(String... args) throws Exception {
        log.info("🚀 급여 시스템 코드 초기화 시작");
        initializeSalarySystemCodes();
        initializePackageCodes();
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
    
    /**
     * 급여 시스템 코드 초기화
     */
    private void initializeSalarySystemCodes() {
        try {
            // 급여 지급일 옵션 초기화
            initializeSalaryPayDayOptions();
            
            // 상담사 등급 초기화
            initializeConsultantGrades();
            
            // 급여 유형 초기화
            initializeSalaryTypes();
            
            // 급여 옵션 유형 초기화
            initializeSalaryOptionTypes();
            
            // 상담사 등급별 기본급 초기화
            initializeConsultantGradeSalaries();
            
            // 프리랜서 기본 상담료 초기화
            initializeFreelanceBaseRates();
            
            log.info("✅ 급여 시스템 코드 초기화 완료");
        } catch (Exception e) {
            log.error("❌ 급여 시스템 코드 초기화 실패", e);
        }
    }
    
    /**
     * 급여 지급일 옵션 초기화
     */
    private void initializeSalaryPayDayOptions() {
        String groupCode = "SALARY_PAY_DAY";
        
        // 이미 존재하는지 확인
        if (isCodeGroupExists(groupCode)) {
            log.info("📋 급여 지급일 옵션이 이미 존재합니다: {}", groupCode);
            return;
        }
        
        log.info("🔧 급여 지급일 옵션 초기화 시작");
        
        // 급여 지급일 옵션들 생성
        createCommonCode(groupCode, "TENTH", "10일 지급", "매월 10일에 급여 지급 (기본)", 1, 
            "{\"dayOfMonth\": 10, \"description\": \"매월 10일 지급\", \"isDefault\": true}");
        createCommonCode(groupCode, "FIFTEENTH", "15일 지급", "매월 15일에 급여 지급", 2, 
            "{\"dayOfMonth\": 15, \"description\": \"매월 15일 지급\", \"isDefault\": false}");
        createCommonCode(groupCode, "TWENTIETH", "20일 지급", "매월 20일에 급여 지급", 3, 
            "{\"dayOfMonth\": 20, \"description\": \"매월 20일 지급\", \"isDefault\": false}");
        createCommonCode(groupCode, "TWENTY_FIFTH", "25일 지급", "매월 25일에 급여 지급", 4, 
            "{\"dayOfMonth\": 25, \"description\": \"매월 25일 지급\", \"isDefault\": false}");
        createCommonCode(groupCode, "LAST_DAY", "말일 지급", "매월 말일에 급여 지급", 5, 
            "{\"dayOfMonth\": 0, \"description\": \"매월 말일 지급\", \"isDefault\": false}");
        createCommonCode(groupCode, "FIRST_DAY", "1일 지급", "매월 1일에 급여 지급", 6, 
            "{\"dayOfMonth\": 1, \"description\": \"매월 1일 지급\", \"isDefault\": false}");
        
        log.info("✅ 급여 지급일 옵션 초기화 완료");
    }
    
    /**
     * 상담사 등급 초기화
     */
    private void initializeConsultantGrades() {
        String groupCode = "CONSULTANT_GRADE";
        
        if (isCodeGroupExists(groupCode)) {
            log.info("📋 상담사 등급이 이미 존재합니다: {}", groupCode);
            return;
        }
        
        log.info("🔧 상담사 등급 초기화 시작");
        
        createCommonCode(groupCode, "CONSULTANT_JUNIOR", "주니어 상담사", "신입 상담사 (1-2년 경력)", 1, 
            "{\"level\": 1, \"experience\": \"1-2년\", \"description\": \"신입 상담사\", \"multiplier\": 1.0}");
        createCommonCode(groupCode, "CONSULTANT_SENIOR", "시니어 상담사", "중급 상담사 (3-5년 경력)", 2, 
            "{\"level\": 2, \"experience\": \"3-5년\", \"description\": \"중급 상담사\", \"multiplier\": 1.2}");
        createCommonCode(groupCode, "CONSULTANT_EXPERT", "엑스퍼트 상담사", "고급 상담사 (6-10년 경력)", 3, 
            "{\"level\": 3, \"experience\": \"6-10년\", \"description\": \"고급 상담사\", \"multiplier\": 1.4}");
        createCommonCode(groupCode, "CONSULTANT_MASTER", "마스터 상담사", "최고급 상담사 (10년 이상 경력)", 4, 
            "{\"level\": 4, \"experience\": \"10년 이상\", \"description\": \"최고급 상담사\", \"multiplier\": 1.6}");
        
        log.info("✅ 상담사 등급 초기화 완료");
    }
    
    /**
     * 급여 유형 초기화
     */
    private void initializeSalaryTypes() {
        String groupCode = "SALARY_TYPE";
        
        if (isCodeGroupExists(groupCode)) {
            log.info("📋 급여 유형이 이미 존재합니다: {}", groupCode);
            return;
        }
        
        log.info("🔧 급여 유형 초기화 시작");
        
        createCommonCode(groupCode, "FREELANCE", "프리랜서", "프리랜서 상담사 급여", 1, 
            "{\"type\": \"FREELANCE\", \"description\": \"프리랜서 상담사\", \"taxType\": \"WITHHOLDING\"}");
        createCommonCode(groupCode, "REGULAR", "정규직", "정규직 상담사 급여", 2, 
            "{\"type\": \"REGULAR\", \"description\": \"정규직 상담사\", \"taxType\": \"INCOME_TAX\"}");
        
        log.info("✅ 급여 유형 초기화 완료");
    }
    
    /**
     * 급여 옵션 유형 초기화
     */
    private void initializeSalaryOptionTypes() {
        String groupCode = "SALARY_OPTION_TYPE";
        
        if (isCodeGroupExists(groupCode)) {
            log.info("📋 급여 옵션 유형이 이미 존재합니다: {}", groupCode);
            return;
        }
        
        log.info("🔧 급여 옵션 유형 초기화 시작");
        
        createCommonCode(groupCode, "FAMILY_CONSULTATION", "가족상담", "가족상담 시 추가 급여", 1, 
            "{\"type\": \"FAMILY_CONSULTATION\", \"baseAmount\": 3000, \"description\": \"가족상담 추가 급여\"}");
        createCommonCode(groupCode, "INITIAL_CONSULTATION", "초기상담", "초기상담 시 추가 급여", 2, 
            "{\"type\": \"INITIAL_CONSULTATION\", \"baseAmount\": 5000, \"description\": \"초기상담 추가 급여\"}");
        createCommonCode(groupCode, "WEEKEND_CONSULTATION", "주말상담", "주말상담 시 추가 급여", 3, 
            "{\"type\": \"WEEKEND_CONSULTATION\", \"baseAmount\": 2000, \"description\": \"주말상담 추가 급여\"}");
        createCommonCode(groupCode, "ONLINE_CONSULTATION", "온라인상담", "온라인상담 시 추가 급여", 4, 
            "{\"type\": \"ONLINE_CONSULTATION\", \"baseAmount\": 1000, \"description\": \"온라인상담 추가 급여\"}");
        createCommonCode(groupCode, "PHONE_CONSULTATION", "전화상담", "전화상담 시 추가 급여", 5, 
            "{\"type\": \"PHONE_CONSULTATION\", \"baseAmount\": 1500, \"description\": \"전화상담 추가 급여\"}");
        createCommonCode(groupCode, "TRAUMA_CONSULTATION", "트라우마상담", "트라우마상담 시 추가 급여", 6, 
            "{\"type\": \"TRAUMA_CONSULTATION\", \"baseAmount\": 4000, \"description\": \"트라우마상담 추가 급여\"}");
        
        log.info("✅ 급여 옵션 유형 초기화 완료");
    }
    
    /**
     * 상담사 등급별 기본급 초기화
     */
    private void initializeConsultantGradeSalaries() {
        String groupCode = "CONSULTANT_GRADE_SALARY";
        
        if (isCodeGroupExists(groupCode)) {
            log.info("📋 상담사 등급별 기본급이 이미 존재합니다: {}", groupCode);
            return;
        }
        
        log.info("🔧 상담사 등급별 기본급 초기화 시작");
        
        createCommonCode(groupCode, "JUNIOR_BASE", "주니어 기본급", "주니어 상담사 기본 급여", 1, 
            "{\"baseAmount\": 3000000, \"grade\": \"CONSULTANT_JUNIOR\", \"level\": 1}");
        createCommonCode(groupCode, "SENIOR_BASE", "시니어 기본급", "시니어 상담사 기본 급여", 2, 
            "{\"baseAmount\": 4000000, \"grade\": \"CONSULTANT_SENIOR\", \"level\": 2}");
        createCommonCode(groupCode, "EXPERT_BASE", "엑스퍼트 기본급", "엑스퍼트 상담사 기본 급여", 3, 
            "{\"baseAmount\": 5000000, \"grade\": \"CONSULTANT_EXPERT\", \"level\": 3}");
        createCommonCode(groupCode, "MASTER_BASE", "마스터 기본급", "마스터 상담사 기본 급여", 4, 
            "{\"baseAmount\": 6000000, \"grade\": \"CONSULTANT_MASTER\", \"level\": 4}");
        
        log.info("✅ 상담사 등급별 기본급 초기화 완료");
    }
    
    /**
     * 프리랜서 기본 상담료 초기화
     */
    private void initializeFreelanceBaseRates() {
        String groupCode = "FREELANCE_BASE_RATE";
        
        if (isCodeGroupExists(groupCode)) {
            log.info("📋 프리랜서 기본 상담료가 이미 존재합니다: {}", groupCode);
            return;
        }
        
        log.info("🔧 프리랜서 기본 상담료 초기화 시작");
        
        createCommonCode(groupCode, "JUNIOR_RATE", "주니어 기본상담료", "주니어 프리랜서 기본 상담료", 1, 
            "{\"rate\": 30000, \"grade\": \"CONSULTANT_JUNIOR\", \"duration\": 50, \"level\": 1}");
        createCommonCode(groupCode, "SENIOR_RATE", "시니어 기본상담료", "시니어 프리랜서 기본 상담료", 2, 
            "{\"rate\": 35000, \"grade\": \"CONSULTANT_SENIOR\", \"duration\": 50, \"level\": 2}");
        createCommonCode(groupCode, "EXPERT_RATE", "엑스퍼트 기본상담료", "엑스퍼트 프리랜서 기본 상담료", 3, 
            "{\"rate\": 40000, \"grade\": \"CONSULTANT_EXPERT\", \"duration\": 50, \"level\": 3}");
        createCommonCode(groupCode, "MASTER_RATE", "마스터 기본상담료", "마스터 프리랜서 기본 상담료", 4, 
            "{\"rate\": 45000, \"grade\": \"CONSULTANT_MASTER\", \"duration\": 50, \"level\": 4}");
        
        log.info("✅ 프리랜서 기본 상담료 초기화 완료");
    }
    
    /**
     * 패키지 코드 초기화
     */
    private void initializePackageCodes() {
        try {
            log.info("📦 패키지 코드 초기화 시작");
            
            // Multi-Session 패키지들 초기화
            initializeMultiSessionPackages();
            
            // Single-Session 패키지들 초기화
            initializeSingleSessionPackages();
            
            log.info("✅ 패키지 코드 초기화 완료");
        } catch (Exception e) {
            log.error("❌ 패키지 코드 초기화 실패", e);
        }
    }
    
    /**
     * Multi-Session 패키지들 초기화
     */
    private void initializeMultiSessionPackages() {
        String groupCode = "PACKAGE";
        
        if (isCodeGroupExists(groupCode)) {
            log.info("📋 패키지 코드가 이미 존재합니다: {}", groupCode);
            return;
        }
        
        log.info("🔧 Multi-Session 패키지 초기화 시작");
        
        // 기본 패키지 (20회기, 200,000원)
        createCommonCode(groupCode, "BASIC_20", "기본 패키지", "기본 상담 패키지 (20회기)", 1, "20회기");
        
        // 표준 패키지 (20회기, 400,000원)
        createCommonCode(groupCode, "STANDARD_20", "표준 패키지", "표준 상담 패키지 (20회기)", 2, "20회기");
        
        // 프리미엄 패키지 (20회기, 600,000원)
        createCommonCode(groupCode, "PREMIUM_20", "프리미엄 패키지", "프리미엄 상담 패키지 (20회기)", 3, "20회기");
        
        // VIP 패키지 (20회기, 1,000,000원)
        createCommonCode(groupCode, "VIP_20", "VIP 패키지", "VIP 상담 패키지 (20회기)", 4, "20회기");
        
        log.info("✅ Multi-Session 패키지 초기화 완료");
    }
    
    /**
     * Single-Session 패키지들 초기화 (30,000원부터 100,000원까지)
     */
    private void initializeSingleSessionPackages() {
        String groupCode = "PACKAGE";
        int sortOrder = 5; // Multi-Session 패키지 다음부터 시작
        
        log.info("🔧 Single-Session 패키지 초기화 시작");
        
        // 30,000원부터 100,000원까지 5,000원 단위로 생성
        for (int price = 30000; price <= 100000; price += 5000) {
            String codeValue = "SINGLE_" + price;
            String codeLabel = "SINGLE_" + price;
            String description = "단일 회기 상담 패키지 (" + price + "원)";
            
            createCommonCode(groupCode, codeValue, codeLabel, description, sortOrder++, "1회기");
        }
        
        log.info("✅ Single-Session 패키지 초기화 완료");
    }

    /**
     * 공통코드 생성 헬퍼 메서드
     */
    private void createCommonCode(String groupCode, String codeValue, String codeLabel, 
                                String description, Integer sortOrder, String extraData) {
        try {
            // 이미 존재하는지 확인
            if (commonCodeRepository.findByCodeGroupAndCodeValue(groupCode, codeValue).isPresent()) {
                log.debug("⏭️ 공통코드 이미 존재: {}:{}", groupCode, codeValue);
                return;
            }
            
            CommonCode commonCode = CommonCode.builder()
                .codeGroup(groupCode)
                .codeValue(codeValue)
                .codeLabel(codeLabel)
                .codeDescription(description)
                .sortOrder(sortOrder)
                .isActive(true)
                .extraData(extraData)
                .build();
                
            commonCodeRepository.save(commonCode);
            log.debug("✅ 공통코드 생성: {} - {}", groupCode, codeValue);
        } catch (Exception e) {
            log.error("❌ 공통코드 생성 실패: {} - {}", groupCode, codeValue, e);
        }
    }
}

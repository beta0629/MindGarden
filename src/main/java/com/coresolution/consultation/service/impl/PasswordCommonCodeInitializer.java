package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.repository.CommonCodeRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 비밀번호 관련 공통코드 초기화 서비스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordCommonCodeInitializer implements CommandLineRunner {

    private final CommonCodeRepository commonCodeRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        initializePasswordCommonCodes();
    }

    /**
     * 비밀번호 관련 공통코드 초기화
     */
    private void initializePasswordCommonCodes() {
        log.info("🔐 비밀번호 관련 공통코드 초기화 시작");

        // 1. 비밀번호 정책 설정
        initializePasswordPolicy();
        
        // 2. 이메일 설정
        initializeEmailConfig();
        
        // 3. 비밀번호 재설정 설정
        initializePasswordResetConfig();

        log.info("✅ 비밀번호 관련 공통코드 초기화 완료");
    }

    /**
     * 비밀번호 정책 설정 초기화
     */
    private void initializePasswordPolicy() {
        log.info("📋 비밀번호 정책 설정 초기화");
        
        // 기본 정책 설정
        createCommonCode("PASSWORD_POLICY", "MIN_LENGTH", "최소 길이", "비밀번호 최소 길이", 1, "{\"value\":8}");
        createCommonCode("PASSWORD_POLICY", "MAX_LENGTH", "최대 길이", "비밀번호 최대 길이", 2, "{\"value\":128}");
        createCommonCode("PASSWORD_POLICY", "REQUIRE_UPPERCASE", "대문자 필수", "대문자 포함 여부", 3, "{\"value\":true}");
        createCommonCode("PASSWORD_POLICY", "REQUIRE_LOWERCASE", "소문자 필수", "소문자 포함 여부", 4, "{\"value\":true}");
        createCommonCode("PASSWORD_POLICY", "REQUIRE_DIGITS", "숫자 필수", "숫자 포함 여부", 5, "{\"value\":true}");
        createCommonCode("PASSWORD_POLICY", "REQUIRE_SPECIAL_CHARS", "특수문자 필수", "특수문자 포함 여부", 6, "{\"value\":true}");
        createCommonCode("PASSWORD_POLICY", "MAX_CONSECUTIVE", "최대 연속 문자", "연속된 문자의 최대 허용 개수", 7, "{\"value\":2}");
        createCommonCode("PASSWORD_POLICY", "MAX_REPEATED", "최대 반복 문자", "동일한 문자의 최대 허용 개수", 8, "{\"value\":2}");
        createCommonCode("PASSWORD_POLICY", "CHECK_COMMON_PATTERNS", "일반 패턴 검사", "일반적인 패턴 검사 여부", 9, "{\"value\":true}");
        createCommonCode("PASSWORD_POLICY", "HISTORY_COUNT", "이력 개수", "비밀번호 이력 저장 개수", 10, "{\"value\":5}");
        createCommonCode("PASSWORD_POLICY", "CHANGE_COOLDOWN_HOURS", "변경 쿨다운", "비밀번호 변경 쿨다운 시간(시간)", 11, "{\"value\":1}");
        
        // 정책 메시지
        createCommonCode("PASSWORD_POLICY", "MSG_REQUIRED", "필수 입력 메시지", "비밀번호 필수 입력 메시지", 20, "{\"value\":\"비밀번호를 입력해주세요.\"}");
        createCommonCode("PASSWORD_POLICY", "MSG_TOO_SHORT", "길이 부족 메시지", "비밀번호 길이 부족 메시지", 21, "{\"value\":\"비밀번호는 최소 {minLength}자 이상이어야 합니다.\"}");
        createCommonCode("PASSWORD_POLICY", "MSG_TOO_LONG", "길이 초과 메시지", "비밀번호 길이 초과 메시지", 22, "{\"value\":\"비밀번호는 최대 {maxLength}자 이하여야 합니다.\"}");
        createCommonCode("PASSWORD_POLICY", "MSG_UPPERCASE_REQUIRED", "대문자 필수 메시지", "대문자 포함 필수 메시지", 23, "{\"value\":\"비밀번호는 최소 1개의 대문자를 포함해야 합니다.\"}");
        createCommonCode("PASSWORD_POLICY", "MSG_LOWERCASE_REQUIRED", "소문자 필수 메시지", "소문자 포함 필수 메시지", 24, "{\"value\":\"비밀번호는 최소 1개의 소문자를 포함해야 합니다.\"}");
        createCommonCode("PASSWORD_POLICY", "MSG_DIGIT_REQUIRED", "숫자 필수 메시지", "숫자 포함 필수 메시지", 25, "{\"value\":\"비밀번호는 최소 1개의 숫자를 포함해야 합니다.\"}");
        createCommonCode("PASSWORD_POLICY", "MSG_SPECIAL_REQUIRED", "특수문자 필수 메시지", "특수문자 포함 필수 메시지", 26, "{\"value\":\"비밀번호는 최소 1개의 특수문자를 포함해야 합니다.\"}");
        createCommonCode("PASSWORD_POLICY", "MSG_CONSECUTIVE_FORBIDDEN", "연속 문자 금지 메시지", "연속 문자 사용 금지 메시지", 27, "{\"value\":\"비밀번호에 연속된 3개 이상의 문자는 사용할 수 없습니다.\"}");
        createCommonCode("PASSWORD_POLICY", "MSG_REPEATED_FORBIDDEN", "반복 문자 금지 메시지", "반복 문자 사용 금지 메시지", 28, "{\"value\":\"비밀번호에 동일한 문자가 3개 이상 연속으로 사용될 수 없습니다.\"}");
        createCommonCode("PASSWORD_POLICY", "MSG_COMMON_PATTERN", "일반 패턴 금지 메시지", "일반 패턴 사용 금지 메시지", 29, "{\"value\":\"일반적인 패턴의 비밀번호는 사용할 수 없습니다.\"}");
        createCommonCode("PASSWORD_POLICY", "MSG_VALIDATION_SUCCESS", "검증 성공 메시지", "비밀번호 검증 성공 메시지", 30, "{\"value\":\"비밀번호가 정책을 만족합니다.\"}");
    }

    /**
     * 이메일 설정 초기화
     */
    private void initializeEmailConfig() {
        log.info("📧 이메일 설정 초기화");
        
        createCommonCode("EMAIL_CONFIG", "FROM_EMAIL", "발신자 이메일", "시스템 발신자 이메일 주소", 1, "{\"value\":\"noreply@mindgarden.com\"}");
        createCommonCode("EMAIL_CONFIG", "FROM_NAME", "발신자 이름", "시스템 발신자 이름", 2, "{\"value\":\"마인드가든\"}");
        createCommonCode("EMAIL_CONFIG", "REPLY_TO_EMAIL", "회신 이메일", "회신 받을 이메일 주소", 3, "{\"value\":\"support@mindgarden.com\"}");
        createCommonCode("EMAIL_CONFIG", "SUPPORT_EMAIL", "지원 이메일", "고객 지원 이메일 주소", 4, "{\"value\":\"support@mindgarden.com\"}");
        createCommonCode("EMAIL_CONFIG", "RESET_PASSWORD_URL", "재설정 URL", "비밀번호 재설정 페이지 URL", 5, "{\"value\":\"http://localhost:3000/reset-password\"}");
        createCommonCode("EMAIL_CONFIG", "COMPANY_NAME", "회사명", "회사 또는 서비스명", 6, "{\"value\":\"마인드가든\"}");
    }

    /**
     * 비밀번호 재설정 설정 초기화
     */
    private void initializePasswordResetConfig() {
        log.info("🔄 비밀번호 재설정 설정 초기화");
        
        createCommonCode("PASSWORD_RESET", "TOKEN_EXPIRY_HOURS", "토큰 만료 시간", "재설정 토큰 만료 시간(시간)", 1, "{\"value\":24}");
        createCommonCode("PASSWORD_RESET", "MAX_ATTEMPTS", "최대 시도 횟수", "재설정 요청 최대 시도 횟수", 2, "{\"value\":3}");
        createCommonCode("PASSWORD_RESET", "COOLDOWN_MINUTES", "쿨다운 시간", "재설정 요청 쿨다운 시간(분)", 3, "{\"value\":15}");
        createCommonCode("PASSWORD_RESET", "ENABLE_EMAIL_RESET", "이메일 재설정 활성화", "이메일을 통한 재설정 활성화 여부", 4, "{\"value\":true}");
        createCommonCode("PASSWORD_RESET", "ENABLE_SMS_RESET", "SMS 재설정 활성화", "SMS를 통한 재설정 활성화 여부", 5, "{\"value\":false}");
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
            log.debug("✅ 공통코드 생성: {}:{} = {}", groupCode, codeValue, codeLabel);
        } catch (Exception e) {
            log.error("❌ 공통코드 생성 실패: {}:{}", groupCode, codeValue, e);
        }
    }
}

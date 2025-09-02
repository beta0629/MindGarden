package com.mindgarden.consultation.service.impl;

import java.util.Arrays;
import java.util.List;
import com.mindgarden.consultation.dto.CodeGroupDto;
import com.mindgarden.consultation.dto.CodeValueDto;
import com.mindgarden.consultation.service.CodeInitializationService;
import com.mindgarden.consultation.service.CodeManagementService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;
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
@Service
@RequiredArgsConstructor
public class CodeInitializationServiceImpl implements CodeInitializationService, CommandLineRunner {
    
    private final CodeManagementService codeManagementService;
    
    @Override
    public void run(String... args) throws Exception {
        log.info("🚀 코드 초기화 서비스 시작");
        initializeDefaultCodes();
    }
    
    @Override
    public void initializeDefaultCodes() {
        log.info("📋 기본 코드 그룹 및 코드 값 초기화 시작");
        
        try {
            // 1. 스케줄 상태 코드 그룹
            initializeScheduleStatusCodes();
            
            // 2. 스케줄 타입 코드 그룹
            initializeScheduleTypeCodes();
            
            // 3. 상담 유형 코드 그룹
            initializeConsultationTypeCodes();
            
            log.info("✅ 기본 코드 초기화 완료");
        } catch (Exception e) {
            log.error("❌ 기본 코드 초기화 실패", e);
        }
    }
    
    @Override
    public boolean isCodeGroupExists(String groupCode) {
        try {
            codeManagementService.getCodeValuesByGroup(groupCode);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * 스케줄 상태 코드 초기화
     */
    private void initializeScheduleStatusCodes() {
        String groupCode = "SCHEDULE_STATUS";
        
        if (isCodeGroupExists(groupCode)) {
            log.info("⏭️ 스케줄 상태 코드 그룹이 이미 존재합니다: {}", groupCode);
            return;
        }
        
        log.info("➕ 스케줄 상태 코드 그룹 생성: {}", groupCode);
        
        // 코드 그룹 생성
        CodeGroupDto groupDto = CodeGroupDto.builder()
            .code(groupCode)
            .name("스케줄 상태")
            .description("스케줄의 현재 상태를 나타내는 코드")
            .sortOrder(1)
            .isActive(true)
            .build();
        
        codeManagementService.createCodeGroup(groupDto);
        
        // 코드 값들 생성
        List<CodeValueDto> statusCodes = Arrays.asList(
            CodeValueDto.builder()
                .codeGroupCode(groupCode)
                .code("AVAILABLE")
                .name("예약 가능")
                .description("예약이 가능한 상태")
                .sortOrder(1)
                .isActive(true)
                .colorCode("#e5e7eb")
                .icon("🟢")
                .build(),
            CodeValueDto.builder()
                .codeGroupCode(groupCode)
                .code("BOOKED")
                .name("예약됨")
                .description("예약이 완료된 상태")
                .sortOrder(2)
                .isActive(true)
                .colorCode("#3b82f6")
                .icon("📅")
                .build(),
            CodeValueDto.builder()
                .codeGroupCode(groupCode)
                .code("CONFIRMED")
                .name("확정됨")
                .description("관리자가 입금 확인 후 확정한 상태")
                .sortOrder(3)
                .isActive(true)
                .colorCode("#f59e0b")
                .icon("✅")
                .build(),
            CodeValueDto.builder()
                .codeGroupCode(groupCode)
                .code("IN_PROGRESS")
                .name("진행중")
                .description("상담이 진행 중인 상태")
                .sortOrder(4)
                .isActive(true)
                .colorCode("#10b981")
                .icon("🔄")
                .build(),
            CodeValueDto.builder()
                .codeGroupCode(groupCode)
                .code("COMPLETED")
                .name("완료됨")
                .description("상담이 완료된 상태")
                .sortOrder(5)
                .isActive(true)
                .colorCode("#059669")
                .icon("✅")
                .build(),

            CodeValueDto.builder()
                .codeGroupCode(groupCode)
                .code("CANCELLED")
                .name("취소")
                .description("상담이 취소된 상태")
                .sortOrder(6)
                .isActive(true)
                .colorCode("#ef4444")
                .icon("❌")
                .build(),
            CodeValueDto.builder()
                .codeGroupCode(groupCode)
                .code("BLOCKED")
                .name("차단")
                .description("예약이 차단된 상태")
                .sortOrder(7)
                .isActive(true)
                .colorCode("#f59e0b")
                .icon("🚫")
                .build(),
            CodeValueDto.builder()
                .codeGroupCode(groupCode)
                .code("BREAK")
                .name("휴식")
                .description("휴식 시간")
                .sortOrder(8)
                .isActive(true)
                .colorCode("#8b5cf6")
                .icon("☕")
                .build()
        );
        
        for (CodeValueDto codeValue : statusCodes) {
            codeManagementService.createCodeValue(codeValue);
        }
        
        log.info("✅ 스케줄 상태 코드 초기화 완료: {}개", statusCodes.size());
    }
    
    /**
     * 스케줄 타입 코드 초기화
     */
    private void initializeScheduleTypeCodes() {
        String groupCode = "SCHEDULE_TYPE";
        
        if (isCodeGroupExists(groupCode)) {
            log.info("⏭️ 스케줄 타입 코드 그룹이 이미 존재합니다: {}", groupCode);
            return;
        }
        
        log.info("➕ 스케줄 타입 코드 그룹 생성: {}", groupCode);
        
        // 코드 그룹 생성
        CodeGroupDto groupDto = CodeGroupDto.builder()
            .code(groupCode)
            .name("스케줄 타입")
            .description("스케줄의 유형을 나타내는 코드")
            .sortOrder(2)
            .isActive(true)
            .build();
        
        codeManagementService.createCodeGroup(groupDto);
        
        // 코드 값들 생성
        List<CodeValueDto> typeCodes = Arrays.asList(
            CodeValueDto.builder()
                .codeGroupCode(groupCode)
                .code("CONSULTATION")
                .name("상담")
                .description("심리 상담")
                .sortOrder(1)
                .isActive(true)
                .colorCode("#3b82f6")
                .icon("💬")
                .build(),
            CodeValueDto.builder()
                .codeGroupCode(groupCode)
                .code("MEETING")
                .name("회의")
                .description("팀 회의")
                .sortOrder(2)
                .isActive(true)
                .colorCode("#10b981")
                .icon("👥")
                .build(),
            CodeValueDto.builder()
                .codeGroupCode(groupCode)
                .code("TRAINING")
                .name("교육")
                .description("교육 및 훈련")
                .sortOrder(3)
                .isActive(true)
                .colorCode("#f59e0b")
                .icon("📚")
                .build(),
            CodeValueDto.builder()
                .codeGroupCode(groupCode)
                .code("BREAK")
                .name("휴식")
                .description("휴식 시간")
                .sortOrder(4)
                .isActive(true)
                .colorCode("#8b5cf6")
                .icon("☕")
                .build(),
            CodeValueDto.builder()
                .codeGroupCode(groupCode)
                .code("BLOCKED")
                .name("차단")
                .description("예약 불가 시간")
                .sortOrder(5)
                .isActive(true)
                .colorCode("#ef4444")
                .icon("🚫")
                .build()
        );
        
        for (CodeValueDto codeValue : typeCodes) {
            codeManagementService.createCodeValue(codeValue);
        }
        
        log.info("✅ 스케줄 타입 코드 초기화 완료: {}개", typeCodes.size());
    }
    
    /**
     * 상담 유형 코드 초기화
     */
    private void initializeConsultationTypeCodes() {
        String groupCode = "CONSULTATION_TYPE";
        
        if (isCodeGroupExists(groupCode)) {
            log.info("⏭️ 상담 유형 코드 그룹이 이미 존재합니다: {}", groupCode);
            return;
        }
        
        log.info("➕ 상담 유형 코드 그룹 생성: {}", groupCode);
        
        // 코드 그룹 생성
        CodeGroupDto groupDto = CodeGroupDto.builder()
            .code(groupCode)
            .name("상담 유형")
            .description("심리 상담의 유형을 나타내는 코드")
            .sortOrder(3)
            .isActive(true)
            .build();
        
        codeManagementService.createCodeGroup(groupDto);
        
        // 코드 값들 생성
        List<CodeValueDto> consultationTypes = Arrays.asList(
            CodeValueDto.builder()
                .codeGroupCode(groupCode)
                .code("INDIVIDUAL")
                .name("개인상담")
                .description("1:1 개인 심리 상담")
                .sortOrder(1)
                .isActive(true)
                .colorCode("#3b82f6")
                .icon("👤")
                .durationMinutes(50)
                .build(),
            CodeValueDto.builder()
                .codeGroupCode(groupCode)
                .code("FAMILY")
                .name("가족상담")
                .description("가족 구성원을 대상으로 한 상담")
                .sortOrder(2)
                .isActive(true)
                .colorCode("#10b981")
                .icon("👨‍👩‍👧‍👦")
                .durationMinutes(100)
                .build(),
            CodeValueDto.builder()
                .codeGroupCode(groupCode)
                .code("COUPLE")
                .name("부부상담")
                .description("부부를 대상으로 한 상담")
                .sortOrder(3)
                .isActive(true)
                .colorCode("#f59e0b")
                .icon("💑")
                .durationMinutes(80)
                .build(),
            CodeValueDto.builder()
                .codeGroupCode(groupCode)
                .code("GROUP")
                .name("집단상담")
                .description("여러 명이 함께하는 집단 상담")
                .sortOrder(4)
                .isActive(true)
                .colorCode("#8b5cf6")
                .icon("👥")
                .durationMinutes(90)
                .build(),
            CodeValueDto.builder()
                .codeGroupCode(groupCode)
                .code("INITIAL")
                .name("초기상담")
                .description("첫 번째 상담 (평가 및 계획)")
                .sortOrder(5)
                .isActive(true)
                .colorCode("#06b6d4")
                .icon("🎯")
                .durationMinutes(60)
                .build(),
            CodeValueDto.builder()
                .codeGroupCode(groupCode)
                .code("FOLLOW_UP")
                .name("후속상담")
                .description("이전 상담의 후속 상담")
                .sortOrder(6)
                .isActive(true)
                .colorCode("#84cc16")
                .icon("🔄")
                .durationMinutes(50)
                .build(),
            CodeValueDto.builder()
                .codeGroupCode(groupCode)
                .code("CRISIS")
                .name("위기상담")
                .description("위기 상황에 대한 긴급 상담")
                .sortOrder(7)
                .isActive(true)
                .colorCode("#ef4444")
                .icon("🚨")
                .durationMinutes(60)
                .build(),
            CodeValueDto.builder()
                .codeGroupCode(groupCode)
                .code("ASSESSMENT")
                .name("심리평가")
                .description("심리 상태 평가 및 진단")
                .sortOrder(8)
                .isActive(true)
                .colorCode("#6366f1")
                .icon("📊")
                .durationMinutes(90)
                .build()
        );
        
        for (CodeValueDto codeValue : consultationTypes) {
            codeManagementService.createCodeValue(codeValue);
        }
        
        log.info("✅ 상담 유형 코드 초기화 완료: {}개", consultationTypes.size());
    }
}

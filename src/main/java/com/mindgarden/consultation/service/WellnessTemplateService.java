package com.mindgarden.consultation.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import com.mindgarden.consultation.entity.WellnessTemplate;
import com.mindgarden.consultation.repository.WellnessTemplateRepository;
import com.mindgarden.consultation.service.OpenAIWellnessService.WellnessContent;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 웰니스 템플릿 관리 서비스
 * - DB에서 템플릿 조회
 * - 없으면 AI로 생성하여 저장
 * - 재사용 관리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-21
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WellnessTemplateService {
    
    private final WellnessTemplateRepository wellnessTemplateRepository;
    private final OpenAIWellnessService openAIWellnessService;
    private final Random random = new Random();
    
    /**
     * 오늘에 맞는 웰니스 템플릿 가져오기
     * - DB에서 먼저 찾기 (최근 7일 이내 사용하지 않은 것)
     * - 없으면 AI로 생성하여 저장
     */
    @Transactional
    public WellnessTemplate getTodayTemplate(Integer dayOfWeek, String season) {
        log.info("📋 웰니스 템플릿 조회 시작 - 요일: {}, 계절: {}", dayOfWeek, season);
        
        // 1. DB에서 최근 7일 이내 사용하지 않은 템플릿 찾기
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        List<WellnessTemplate> templates = wellnessTemplateRepository
            .findUnusedTemplatesByConditions(dayOfWeek, season, sevenDaysAgo);
        
        if (!templates.isEmpty()) {
            // 랜덤 선택
            WellnessTemplate selected = templates.get(random.nextInt(templates.size()));
            selected.setLastUsedAt(LocalDateTime.now());
            selected.setUsageCount(selected.getUsageCount() + 1);
            wellnessTemplateRepository.save(selected);
            
            log.info("✅ 기존 템플릿 사용: {}", selected.getTitle());
            return selected;
        }
        
        // 2. AI로 새 템플릿 생성
        log.info("🤖 AI로 새 템플릿 생성 중...");
        WellnessContent content = openAIWellnessService.generateWellnessContent(dayOfWeek, season, "GENERAL", "SYSTEM");
        
        // 3. DB에 저장
        WellnessTemplate newTemplate = WellnessTemplate.builder()
            .title(content.getTitle())
            .content(content.getContent())
            .dayOfWeek(dayOfWeek)
            .season(season)
            .category("GENERAL")
            .isActive(true)
            .lastUsedAt(LocalDateTime.now())
            .usageCount(1)
            .createdBy("SYSTEM")
            .build();
        
        wellnessTemplateRepository.save(newTemplate);
        log.info("💾 새 템플릿 저장: {}", newTemplate.getTitle());
        
        return newTemplate;
    }
    
    /**
     * 템플릿 목록 조회
     */
    public List<WellnessTemplate> getAllTemplates() {
        return wellnessTemplateRepository.findAll();
    }
    
    /**
     * 활성 템플릿 목록 조회
     */
    public List<WellnessTemplate> getActiveTemplates() {
        return wellnessTemplateRepository.findRecentTemplates();
    }
    
    /**
     * 모든 활성 템플릿 조회
     */
    public List<WellnessTemplate> getAllActiveTemplates() {
        return wellnessTemplateRepository.findRecentTemplates();
    }
    
    /**
     * 템플릿 비활성화
     */
    @Transactional
    public void deactivateTemplate(Long templateId) {
        wellnessTemplateRepository.findById(templateId).ifPresent(template -> {
            template.setIsActive(false);
            wellnessTemplateRepository.save(template);
            log.info("🔒 템플릿 비활성화: {}", template.getTitle());
        });
    }
    
    /**
     * 통계 조회
     */
    public long getActiveTemplateCount() {
        return wellnessTemplateRepository.countByIsActiveTrue();
    }
    
    /**
     * 웰니스 컨텐츠 생성 (테스트용)
     */
    public WellnessContent generateWellnessContent(Integer dayOfWeek, String season, String category, String requestedBy) {
        return openAIWellnessService.generateWellnessContent(dayOfWeek, season, category, requestedBy);
    }
}
package com.mindgarden.consultation.service;

import com.mindgarden.consultation.service.OpenAIWellnessService.HealingContent;

/**
 * 힐링 컨텐츠 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-22
 */
public interface HealingContentService {
    
    /**
     * 힐링 컨텐츠 조회 (캐시된 것 또는 새로 생성)
     */
    HealingContent getHealingContent(String userRole, String category);
    
    /**
     * 새로운 힐링 컨텐츠 생성
     */
    HealingContent generateNewHealingContent(String userRole, String category);
}

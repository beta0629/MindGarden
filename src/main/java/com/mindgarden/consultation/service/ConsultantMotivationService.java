package com.mindgarden.consultation.service;

import com.mindgarden.consultation.entity.DailyHumor;
import com.mindgarden.consultation.entity.WarmWords;

/**
 * 상담사 동기부여 서비스 인터페이스
 */
public interface ConsultantMotivationService {
    
    /**
     * 오늘의 유머 조회
     * @param category 카테고리 (선택사항)
     * @return 랜덤 유머
     */
    DailyHumor getTodayHumor(String category);
    
    /**
     * 따뜻한 말 조회
     * @param targetRole 대상 역할 (선택사항)
     * @return 랜덤 따뜻한 말
     */
    WarmWords getWarmWords(String targetRole);
}

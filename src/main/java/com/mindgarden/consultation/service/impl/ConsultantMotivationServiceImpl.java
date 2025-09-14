package com.mindgarden.consultation.service.impl;

import java.util.Optional;
import com.mindgarden.consultation.entity.DailyHumor;
import com.mindgarden.consultation.entity.WarmWords;
import com.mindgarden.consultation.repository.DailyHumorRepository;
import com.mindgarden.consultation.repository.WarmWordsRepository;
import com.mindgarden.consultation.service.ConsultantMotivationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * 상담사 동기부여 서비스 구현체
 */
@Service
public class ConsultantMotivationServiceImpl implements ConsultantMotivationService {
    
    private static final String DEFAULT_HUMOR_CATEGORY = "GENERAL";
    private static final String DEFAULT_CONSULTANT_ROLE = "CLIENT";
    
    @Autowired
    private DailyHumorRepository dailyHumorRepository;
    
    @Autowired
    private WarmWordsRepository warmWordsRepository;
    
    @Override
    public DailyHumor getTodayHumor(String category) {
        if (category == null || category.trim().isEmpty()) {
            category = DEFAULT_HUMOR_CATEGORY;
        }
        
        // 카테고리별 랜덤 유머 조회 시도
        Optional<DailyHumor> humor = Optional.ofNullable(dailyHumorRepository.findRandomByCategory(category));
        
        // 카테고리에 해당하는 유머가 없으면 전체에서 랜덤 선택
        if (humor.isEmpty()) {
            humor = Optional.ofNullable(dailyHumorRepository.findRandom());
        }
        
        // 데이터가 없으면 기본 메시지 반환
        if (humor.isEmpty()) {
            DailyHumor defaultHumor = new DailyHumor();
            defaultHumor.setContent("오늘도 힘내세요! 😊");
            defaultHumor.setCategory(DEFAULT_HUMOR_CATEGORY);
            return defaultHumor;
        }
        
        return humor.get();
    }
    
    @Override
    public WarmWords getWarmWords(String targetRole) {
        if (targetRole == null || targetRole.trim().isEmpty()) {
            targetRole = DEFAULT_CONSULTANT_ROLE;
        }
        
        // 역할별 랜덤 따뜻한 말 조회 시도
        Optional<WarmWords> warmWords = Optional.ofNullable(warmWordsRepository.findRandomByTargetRole(targetRole));
        
        // 해당 역할에 맞는 말이 없으면 전체에서 랜덤 선택
        if (warmWords.isEmpty()) {
            warmWords = Optional.ofNullable(warmWordsRepository.findRandom());
        }
        
        // 데이터가 없으면 기본 메시지 반환
        if (warmWords.isEmpty()) {
            WarmWords defaultWords = WarmWords.builder()
                .content("당신의 마음이 소중합니다 💙")
                .consultantRole(DEFAULT_CONSULTANT_ROLE)
                .build();
            return defaultWords;
        }
        
        return warmWords.get();
    }
}

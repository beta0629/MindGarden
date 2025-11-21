package com.coresolution.consultation.service.impl;

import java.util.Optional;
import com.coresolution.consultation.entity.DailyHumor;
import com.coresolution.consultation.entity.WarmWords;
import com.coresolution.consultation.repository.DailyHumorRepository;
import com.coresolution.consultation.repository.WarmWordsRepository;
import com.coresolution.consultation.service.ConsultantMotivationService;
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
        
        // 데이터가 없으면 기본 메시지 반환 (랜덤하게 선택)
        if (humor.isEmpty()) {
            String[] defaultHumorMessages = {
                "오늘도 힘내세요! 😊",
                "웃음은 최고의 약이에요! 😄",
                "작은 기쁨도 소중한 하루가 될 거예요! 🌟",
                "긍정적인 마음으로 하루를 시작해보세요! ☀️",
                "당신의 미소가 세상을 밝게 만들어요! 😊",
                "오늘 하루도 화이팅! 💪",
                "작은 행복도 큰 기쁨이 될 수 있어요! 🎉",
                "매일이 새로운 시작이에요! 🌱"
            };
            
            DailyHumor defaultHumor = new DailyHumor();
            defaultHumor.setContent(defaultHumorMessages[(int) (Math.random() * defaultHumorMessages.length)]);
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
        
        // 데이터가 없으면 기본 메시지 반환 (랜덤하게 선택)
        if (warmWords.isEmpty()) {
            String[] defaultWarmWords = {
                "당신의 마음이 소중합니다 💙",
                "오늘도 수고하셨어요! 🌸",
                "당신은 충분히 잘하고 있어요! ✨",
                "작은 걸음도 큰 진전이에요! 🚀",
                "당신의 노력이 빛을 발할 거예요! ⭐",
                "힘든 시간도 지나갈 거예요! 🌈",
                "당신은 소중한 사람이에요! 💕",
                "오늘 하루도 의미 있는 하루였어요! 🌺"
            };
            
            WarmWords defaultWords = WarmWords.builder()
                .content(defaultWarmWords[(int) (Math.random() * defaultWarmWords.length)])
                .consultantRole(DEFAULT_CONSULTANT_ROLE)
                .build();
            return defaultWords;
        }
        
        return warmWords.get();
    }
}

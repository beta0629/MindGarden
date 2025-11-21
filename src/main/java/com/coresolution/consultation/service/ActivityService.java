package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.ActivityResponse;

import java.util.List;
import java.util.Map;

/**
 * 활동 내역 서비스 인터페이스
 */
public interface ActivityService {
    
    /**
     * 사용자 활동 내역 조회
     */
    List<ActivityResponse> getUserActivities(Long userId, String type, String dateRange);
    
    /**
     * 사용자 활동 통계 조회
     */
    Map<String, Object> getActivityStatistics(Long userId);
    
    /**
     * 활동 내역 생성
     */
    void createActivity(Long userId, String activityType, String title, String description, 
                       String status, String icon, String color, Long relatedId, String relatedType);
}

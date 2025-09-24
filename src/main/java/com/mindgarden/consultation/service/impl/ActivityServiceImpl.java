package com.mindgarden.consultation.service.impl;

import com.mindgarden.consultation.dto.ActivityResponse;
import com.mindgarden.consultation.entity.UserActivity;
import com.mindgarden.consultation.repository.UserActivityRepository;
import com.mindgarden.consultation.service.ActivityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 활동 내역 서비스 구현체
 */
@Service
public class ActivityServiceImpl implements ActivityService {
    
    @Autowired
    private UserActivityRepository userActivityRepository;
    
    @Override
    public List<ActivityResponse> getUserActivities(Long userId, String type, String dateRange) {
        Pageable pageable = PageRequest.of(0, 50); // 최대 50개
        
        List<UserActivity> activities;
        
        if (type != null && !type.equals("all")) {
            activities = userActivityRepository.findByUserIdAndActivityTypeOrderByCreatedAtDesc(
                userId, type, pageable
            ).getContent();
        } else {
            activities = userActivityRepository.findByUserIdOrderByCreatedAtDesc(
                userId, pageable
            ).getContent();
        }
        
        // 날짜 범위 필터링
        if (dateRange != null && !dateRange.equals("all")) {
            LocalDateTime startDate = getStartDate(dateRange);
            if (startDate != null) {
                activities = activities.stream()
                    .filter(activity -> activity.getCreatedAt().isAfter(startDate))
                    .collect(Collectors.toList());
            }
        }
        
        return activities.stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }
    
    @Override
    public Map<String, Object> getActivityStatistics(Long userId) {
        Map<String, Object> statistics = new HashMap<>();
        
        // 활동 타입별 통계
        List<Object[]> typeStats = userActivityRepository.findActivityStatisticsByUserId(userId);
        Map<String, Long> typeCounts = new HashMap<>();
        for (Object[] stat : typeStats) {
            typeCounts.put((String) stat[0], (Long) stat[1]);
        }
        
        statistics.put("consultation", typeCounts.getOrDefault("CONSULTATION", 0L));
        statistics.put("payment", typeCounts.getOrDefault("PAYMENT", 0L));
        statistics.put("system", typeCounts.getOrDefault("SYSTEM", 0L));
        statistics.put("profile", typeCounts.getOrDefault("PROFILE", 0L));
        
        // 완료된 활동 수
        Long completedCount = userActivityRepository.countCompletedActivitiesByUserId(userId);
        statistics.put("completed", completedCount);
        
        // 전체 활동 수
        long totalCount = typeCounts.values().stream().mapToLong(Long::longValue).sum();
        statistics.put("total", totalCount);
        
        return statistics;
    }
    
    @Override
    public void createActivity(Long userId, String activityType, String title, String description, 
                              String status, String icon, String color, Long relatedId, String relatedType) {
        UserActivity activity = UserActivity.builder()
            .userId(userId)
            .activityType(activityType)
            .title(title)
            .description(description)
            .status(status)
            .icon(icon)
            .color(color)
            .relatedId(relatedId)
            .relatedType(relatedType)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();
        
        userActivityRepository.save(activity);
    }
    
    private ActivityResponse convertToResponse(UserActivity activity) {
        return ActivityResponse.builder()
            .id(activity.getId())
            .activityType(activity.getActivityType())
            .title(activity.getTitle())
            .description(activity.getDescription())
            .status(activity.getStatus())
            .icon(activity.getIcon())
            .color(activity.getColor())
            .relatedId(activity.getRelatedId())
            .relatedType(activity.getRelatedType())
            .createdAt(activity.getCreatedAt())
            .timeAgo(getTimeAgo(activity.getCreatedAt()))
            .build();
    }
    
    private String getTimeAgo(LocalDateTime dateTime) {
        LocalDateTime now = LocalDateTime.now();
        long days = ChronoUnit.DAYS.between(dateTime, now);
        
        if (days == 0) {
            return "오늘";
        } else if (days == 1) {
            return "1일 전";
        } else if (days < 7) {
            return days + "일 전";
        } else if (days < 30) {
            return (days / 7) + "주 전";
        } else {
            return (days / 30) + "개월 전";
        }
    }
    
    private LocalDateTime getStartDate(String dateRange) {
        LocalDateTime now = LocalDateTime.now();
        switch (dateRange) {
            case "week":
                return now.minusWeeks(1);
            case "month":
                return now.minusMonths(1);
            case "year":
                return now.minusYears(1);
            default:
                return null;
        }
    }
}

package com.coresolution.core.service.billing;

import java.time.LocalDate;
import java.util.List;

/**
 * 구독 만료 처리 서비스
 * 만료된 구독을 자동으로 처리하는 배치 작업
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public interface SubscriptionExpirationService {
    
    /**
     * 만료된 구독 처리
     * effectiveTo가 오늘 이전인 ACTIVE 구독을 SUSPENDED로 변경
     * 
     * @return 처리된 구독 개수
     */
    int processExpiredSubscriptions();
    
    /**
     * 만료 예정 구독 조회 (N일 이내)
     * 
     * @param days 만료 예정 일수
     * @return 만료 예정 구독 목록
     */
    List<String> findSubscriptionsExpiringWithin(int days);
    
    /**
     * 특정 날짜 기준 만료된 구독 조회
     * 
     * @param date 기준 날짜 (null이면 오늘)
     * @return 만료된 구독 ID 목록
     */
    List<String> findExpiredSubscriptions(LocalDate date);
}


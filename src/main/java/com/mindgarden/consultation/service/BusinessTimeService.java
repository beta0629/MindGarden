package com.mindgarden.consultation.service;

import java.time.LocalTime;
import java.util.Map;

/**
 * 업무 시간 및 정책 관리 서비스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-27
 */
public interface BusinessTimeService {
    
    /**
     * 업무 시작 시간 조회
     * @return 업무 시작 시간 (예: 10:00)
     */
    LocalTime getBusinessStartTime();
    
    /**
     * 업무 종료 시간 조회
     * @return 업무 종료 시간 (예: 20:00)
     */
    LocalTime getBusinessEndTime();
    
    /**
     * 점심 시작 시간 조회
     * @return 점심 시작 시간 (예: 12:00)
     */
    LocalTime getLunchStartTime();
    
    /**
     * 점심 종료 시간 조회
     * @return 점심 종료 시간 (예: 13:00)
     */
    LocalTime getLunchEndTime();
    
    /**
     * 시간 슬롯 간격 조회 (분 단위)
     * @return 슬롯 간격 (예: 30분)
     */
    int getSlotIntervalMinutes();
    
    /**
     * 최소 취소 통지 시간 조회 (시간 단위)
     * @return 최소 통지 시간 (예: 24시간)
     */
    int getMinNoticeHours();
    
    /**
     * 최대 사전 예약 일수 조회
     * @return 최대 예약 일수 (예: 30일)
     */
    int getMaxAdvanceBookingDays();
    
    /**
     * 세션간 휴식 시간 조회 (분 단위)
     * @return 휴식 시간 (예: 10분)
     */
    int getBreakTimeMinutes();
    
    /**
     * 모든 업무 시간 설정 조회
     * @return 업무 시간 설정 맵
     */
    Map<String, Object> getAllBusinessTimeSettings();
    
    /**
     * 업무 시간 설정 업데이트
     * @param settings 업데이트할 설정 맵
     */
    void updateBusinessTimeSettings(Map<String, Object> settings);
    
    /**
     * 특정 시간이 업무 시간 내인지 확인
     * @param time 확인할 시간
     * @return 업무 시간 내 여부
     */
    boolean isBusinessTime(LocalTime time);
    
    /**
     * 특정 시간이 점심 시간인지 확인
     * @param time 확인할 시간
     * @return 점심 시간 여부
     */
    boolean isLunchTime(LocalTime time);
}

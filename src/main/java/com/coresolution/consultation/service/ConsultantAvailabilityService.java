package com.coresolution.consultation.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.dto.ConsultantAvailabilityDto;

/**
 * 상담사 상담 가능 시간 서비스 인터페이스
 */
public interface ConsultantAvailabilityService {
    
    /**
     * 상담사별 상담 가능 시간 목록 조회
     */
    List<ConsultantAvailabilityDto> getAvailabilityByConsultantId(Long consultantId);
    
    /**
     * 상담 가능 시간 추가
     */
    ConsultantAvailabilityDto addAvailability(ConsultantAvailabilityDto dto);
    
    /**
     * 상담 가능 시간 수정
     */
    ConsultantAvailabilityDto updateAvailability(Long id, ConsultantAvailabilityDto dto);
    
    /**
     * 상담 가능 시간 삭제
     */
    void deleteAvailability(Long id);
    
    /**
     * 상담사별 상담 가능 시간 전체 삭제
     */
    void deleteAllByConsultantId(Long consultantId);
    
    // === 휴무 관리 ===
    
    /**
     * 상담사 휴무 설정
     */
    Map<String, Object> setVacation(Long consultantId, String date, String type, String reason, String startTime, String endTime);
    
    /**
     * 상담사 휴무 조회
     */
    List<Map<String, Object>> getVacations(Long consultantId, String startDate, String endDate);
    
    /**
     * 상담사 휴무 삭제
     */
    void deleteVacation(Long consultantId, String date);
    
    /**
     * 상담사가 특정 날짜와 시간에 휴무 상태인지 확인
     */
    boolean isConsultantOnVacation(Long consultantId, LocalDate date, LocalTime startTime, LocalTime endTime);
    
    /**
     * 모든 상담사의 휴무 정보 조회 (관리자용)
     */
    Map<String, Object> getAllConsultantsVacations(String date);
}

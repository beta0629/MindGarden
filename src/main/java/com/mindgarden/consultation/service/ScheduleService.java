package com.mindgarden.consultation.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.constant.ConsultationType;
import com.mindgarden.consultation.dto.ScheduleDto;
import com.mindgarden.consultation.entity.Schedule;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * 스케줄 관리 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
public interface ScheduleService {

    // ==================== 기본 CRUD 메서드 ====================
    
    /**
     * 스케줄 생성
     */
    Schedule createSchedule(Schedule schedule);
    
    /**
     * 스케줄 수정
     */
    Schedule updateSchedule(Long id, Schedule updateData);
    
    /**
     * 스케줄 삭제
     */
    void deleteSchedule(Long id);
    
    /**
     * 스케줄 조회
     */
    Schedule findById(Long id);
    
    /**
     * 모든 스케줄 조회
     */
    List<Schedule> findAll();
    
    /**
     * 페이징 스케줄 조회
     */
    Page<Schedule> findAll(Pageable pageable);

    // ==================== 상담사별 스케줄 관리 ====================
    
    /**
     * 상담사 스케줄 등록 (매핑 상태 검증 포함)
     */
    Schedule createConsultantSchedule(Long consultantId, Long clientId, LocalDate date, 
                                    LocalTime startTime, LocalTime endTime, String title, String description);
    
    /**
     * 상담사 스케줄 등록 (상담 유형 포함)
     */
    Schedule createConsultantSchedule(Long consultantId, Long clientId, LocalDate date, 
                                    LocalTime startTime, LocalTime endTime, String title, String description, String consultationType, String branchCode);
    
    /**
     * 상담사 스케줄 등록 (상담 유형 기반, 자동 종료 시간 계산)
     */
    Schedule createConsultantScheduleWithType(Long consultantId, Long clientId, LocalDate date, 
                                           LocalTime startTime, ConsultationType consultationType, 
                                           String title, String description);
    
    /**
     * 상담사별 스케줄 조회
     */
    List<Schedule> findByConsultantId(Long consultantId);
    
    /**
     * 상담사별 특정 날짜 스케줄 조회
     */
    List<Schedule> findByConsultantIdAndDate(Long consultantId, LocalDate date);
    
    /**
     * 상담사별 날짜 범위 스케줄 조회
     */
    List<Schedule> findByConsultantIdAndDateBetween(Long consultantId, LocalDate startDate, LocalDate endDate);

    // ==================== 내담자별 스케줄 관리 ====================
    
    /**
     * 내담자별 스케줄 조회
     */
    List<Schedule> findByClientId(Long clientId);
    
    /**
     * 내담자별 특정 날짜 스케줄 조회
     */
    List<Schedule> findByClientIdAndDate(Long clientId, LocalDate date);
    
    /**
     * 내담자별 날짜 범위 스케줄 조회
     */
    List<Schedule> findByClientIdAndDateBetween(Long clientId, LocalDate startDate, LocalDate endDate);

    // ==================== 스케줄 상태 관리 ====================
    
    /**
     * 스케줄 예약
     */
    Schedule bookSchedule(Long scheduleId, Long consultationId, Long clientId);
    
    /**
     * 스케줄 취소
     */
    Schedule cancelSchedule(Long scheduleId, String reason);
    
    /**
     * 예약 확정 (관리자가 입금 확인 후)
     */
    Schedule confirmSchedule(Long scheduleId, String adminNote);
    
    /**
     * 스케줄 완료
     */
    Schedule completeSchedule(Long scheduleId);
    
    /**
     * 스케줄 차단
     */
    Schedule blockSchedule(Long scheduleId, String reason);

    // ==================== 스케줄 검증 및 검사 ====================
    
    /**
     * 스케줄 시간 충돌 검사 (기본)
     */
    boolean hasTimeConflict(Long consultantId, LocalDate date, LocalTime startTime, LocalTime endTime, Long excludeScheduleId);
    
    /**
     * 스케줄 시간 충돌 검사 (상담 유형 기반, 쉬는 시간 포함)
     */
    boolean hasTimeConflictWithType(Long consultantId, LocalDate date, LocalTime startTime, 
                                  ConsultationType consultationType, Long excludeScheduleId);
    
    /**
     * 상담사-내담자 매핑 상태 검증
     */
    boolean validateMappingForSchedule(Long consultantId, Long clientId);
    
    /**
     * 회기 수 검증
     */
    boolean validateRemainingSessions(Long consultantId, Long clientId);

    // ==================== 시간 관리 ====================
    
    /**
     * 상담 시작 시간으로부터 종료 시간 계산 (상담 유형 + 쉬는 시간)
     */
    LocalTime calculateEndTime(LocalTime startTime, ConsultationType consultationType);
    
    /**
     * 상담 시작 시간으로부터 종료 시간 계산 (커스텀 시간 + 쉬는 시간)
     */
    LocalTime calculateEndTime(LocalTime startTime, int durationMinutes);
    
    /**
     * 상담사별 하루 최대 상담 가능 시간 계산
     */
    int calculateMaxConsultationTimePerDay(Long consultantId, LocalDate date);

    // ==================== 스케줄 통계 및 분석 ====================
    
    /**
     * 상담사별 스케줄 통계
     */
    Map<String, Object> getConsultantScheduleStats(Long consultantId, LocalDate startDate, LocalDate endDate);
    
    /**
     * 내담자별 스케줄 통계
     */
    Map<String, Object> getClientScheduleStats(Long clientId, LocalDate startDate, LocalDate endDate);
    
    /**
     * 전체 스케줄 통계
     */
    Map<String, Object> getOverallScheduleStats(LocalDate startDate, LocalDate endDate);

    // ==================== 권한 기반 스케줄 조회 ====================
    
    /**
     * 권한 기반 스케줄 조회 (상담사: 자신의 일정만, 관리자: 모든 일정)
     */
    List<Schedule> findSchedulesByUserRole(Long userId, String userRole);
    
    /**
     * 권한 기반 스케줄 조회 (상담사 이름 포함)
     */
    List<ScheduleDto> findSchedulesWithNamesByUserRole(Long userId, String userRole);
    
    /**
     * 권한 기반 페이지네이션 스케줄 조회 (상담사 이름 포함)
     */
    Page<ScheduleDto> findSchedulesWithNamesByUserRolePaged(Long userId, String userRole, Pageable pageable);
    
    // ==================== 지점별 스케줄 관리 ====================
    
    /**
     * 지점별 스케줄 조회
     * @param branchId 지점 ID
     * @param startDate 시작일
     * @param endDate 종료일
     * @return 지점별 스케줄 목록
     */
    List<Schedule> getBranchSchedules(Long branchId, LocalDate startDate, LocalDate endDate);
    
    /**
     * 지점별 상담사 스케줄 조회
     * @param branchId 지점 ID
     * @param consultantId 상담사 ID
     * @param startDate 시작일
     * @param endDate 종료일
     * @return 상담사 스케줄 목록
     */
    List<Schedule> getBranchConsultantSchedules(Long branchId, Long consultantId, LocalDate startDate, LocalDate endDate);
    
    /**
     * 지점별 스케줄 통계 조회
     * @param branchId 지점 ID
     * @param startDate 시작일
     * @param endDate 종료일
     * @return 스케줄 통계
     */
    Map<String, Object> getBranchScheduleStatistics(Long branchId, LocalDate startDate, LocalDate endDate);
    
    /**
     * 지점별 상담사별 스케줄 현황 조회
     * @param branchId 지점 ID
     * @param date 조회일
     * @return 상담사별 스케줄 현황
     */
    Map<String, Object> getBranchConsultantScheduleStatus(Long branchId, LocalDate date);
    
    /**
     * 지점별 스케줄 생성
     * @param branchId 지점 ID
     * @param schedule 스케줄 정보
     * @return 생성된 스케줄
     */
    Schedule createBranchSchedule(Long branchId, Schedule schedule);
    
    /**
     * 지점별 스케줄 수정
     * @param branchId 지점 ID
     * @param scheduleId 스케줄 ID
     * @param schedule 수정할 스케줄 정보
     * @return 수정된 스케줄
     */
    Schedule updateBranchSchedule(Long branchId, Long scheduleId, Schedule schedule);
    
    /**
     * 지점별 스케줄 삭제
     * @param branchId 지점 ID
     * @param scheduleId 스케줄 ID
     */
    void deleteBranchSchedule(Long branchId, Long scheduleId);
    
    /**
     * 지점별 스케줄 중복 확인
     * @param branchId 지점 ID
     * @param consultantId 상담사 ID
     * @param startTime 시작 시간
     * @param endTime 종료 시간
     * @return 중복 여부
     */
    boolean isScheduleConflict(Long branchId, Long consultantId, LocalDateTime startTime, LocalDateTime endTime);
    
    /**
     * 지점별 스케줄 가능 시간 조회
     * @param branchId 지점 ID
     * @param consultantId 상담사 ID
     * @param date 조회일
     * @return 가능한 시간대 목록
     */
    List<Map<String, Object>> getAvailableTimeSlots(Long branchId, Long consultantId, LocalDate date);
    
    /**
     * 권한 기반 특정 날짜 스케줄 조회
     */
    List<Schedule> findSchedulesByUserRoleAndDate(Long userId, String userRole, LocalDate date);
    
    /**
     * 권한 기반 날짜 범위 스케줄 조회
     */
    List<Schedule> findSchedulesByUserRoleAndDateBetween(Long userId, String userRole, LocalDate startDate, LocalDate endDate);
    
    /**
     * 관리자용 전체 스케줄 통계 조회
     */
    Map<String, Object> getScheduleStatisticsForAdmin(String startDate, String endDate);
    
    /**
     * 오늘의 스케줄 통계 조회
     */
    Map<String, Object> getTodayScheduleStatistics();

    // ==================== 자동 완료 처리 ====================
    
    /**
     * 시간이 지난 확정된 스케줄을 자동으로 완료 처리
     */
    void autoCompleteExpiredSchedules();
    
    /**
     * 특정 스케줄이 시간이 지났는지 확인
     */
    boolean isScheduleExpired(Schedule schedule);

    // ==================== 한글 변환 메서드 ====================
    
    /**
     * 스케줄 상태를 한글로 변환
     */
    String getStatusInKorean(String status);
    
    /**
     * 스케줄 타입을 한글로 변환
     */
    String getScheduleTypeInKorean(String scheduleType);
    
    /**
     * 상담 유형을 한글로 변환
     */
    String getConsultationTypeInKorean(String consultationType);
}

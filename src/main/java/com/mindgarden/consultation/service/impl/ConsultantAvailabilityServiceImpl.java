package com.mindgarden.consultation.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.mindgarden.consultation.dto.ConsultantAvailabilityDto;
import com.mindgarden.consultation.entity.ConsultantAvailability;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.entity.Vacation;
import com.mindgarden.consultation.repository.ConsultantAvailabilityRepository;
import com.mindgarden.consultation.repository.UserRepository;
import com.mindgarden.consultation.repository.VacationRepository;
import com.mindgarden.consultation.service.CommonCodeService;
import com.mindgarden.consultation.service.ConsultantAvailabilityService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 상담사 상담 가능 시간 서비스 구현체
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ConsultantAvailabilityServiceImpl implements ConsultantAvailabilityService {
    
    private final ConsultantAvailabilityRepository availabilityRepository;
    private final VacationRepository vacationRepository;
    private final UserRepository userRepository;
    private final CommonCodeService commonCodeService;
    
    // 휴무 정보는 데이터베이스(vacationRepository)에 저장
    
    // 테스트용 휴무 데이터 초기화 (데이터베이스 사용)
    public void initializeTestVacationData() {
        log.info("테스트용 휴무 데이터 초기화 시작 (데이터베이스 저장)");
        
        try {
            // 상담사 43번의 9월 26일 휴무 설정
            Long consultantId = 43L;
            LocalDate vacationDate = LocalDate.of(2025, 9, 26);
            
            // 기존 휴가 데이터가 있는지 확인
            Vacation existingVacation = vacationRepository.findByConsultantIdAndVacationDateAndIsDeletedFalse(consultantId, vacationDate);
            
            if (existingVacation == null) {
                // 새 휴가 데이터 생성
                Vacation vacation = Vacation.builder()
                    .consultantId(consultantId)
                    .vacationDate(vacationDate)
                    .vacationType(Vacation.VacationType.FULL_DAY)
                    .reason("개인 사정")
                    .startTime(LocalTime.of(9, 0))
                    .endTime(LocalTime.of(18, 0))
                    .isApproved(true)
                    .isDeleted(false)
                    .build();
                
                vacationRepository.save(vacation);
                log.info("테스트용 휴무 데이터 생성 완료: 상담사 {}, 휴무일 {}", consultantId, vacationDate);
            } else {
                log.info("테스트용 휴무 데이터 이미 존재: 상담사 {}, 휴무일 {}", consultantId, vacationDate);
            }
        } catch (Exception e) {
            log.error("테스트용 휴무 데이터 초기화 실패: {}", e.getMessage(), e);
        }
    }
    
    // 휴무 데이터 직접 설정 (데이터베이스 사용)
    public void setVacationData(Long consultantId, String date, Map<String, Object> vacationData) {
        log.info("휴무 데이터 직접 설정: consultantId={}, date={}, data={}", consultantId, date, vacationData);
        
        try {
            LocalDate vacationDate = LocalDate.parse(date);
            String type = (String) vacationData.get("type");
            String reason = (String) vacationData.get("reason");
            String startTimeStr = (String) vacationData.get("startTime");
            String endTimeStr = (String) vacationData.get("endTime");
            Boolean isApproved = (Boolean) vacationData.get("isApproved");
            
            // 기존 휴가 데이터 확인
            Vacation existingVacation = vacationRepository.findByConsultantIdAndVacationDateAndIsDeletedFalse(consultantId, vacationDate);
            
            Vacation vacation;
            if (existingVacation != null) {
                // 기존 휴가 수정
                vacation = existingVacation;
                vacation.setVacationType(Vacation.VacationType.valueOf(type));
                vacation.setReason(reason);
                vacation.setStartTime(startTimeStr != null ? LocalTime.parse(startTimeStr) : null);
                vacation.setEndTime(endTimeStr != null ? LocalTime.parse(endTimeStr) : null);
                vacation.setIsApproved(isApproved != null ? isApproved : true);
                vacation.setUpdatedAt(LocalDateTime.now());
            } else {
                // 새 휴가 생성
                vacation = Vacation.builder()
                    .consultantId(consultantId)
                    .vacationDate(vacationDate)
                    .vacationType(Vacation.VacationType.valueOf(type))
                    .reason(reason)
                    .startTime(startTimeStr != null ? LocalTime.parse(startTimeStr) : null)
                    .endTime(endTimeStr != null ? LocalTime.parse(endTimeStr) : null)
                    .isApproved(isApproved != null ? isApproved : true)
                    .isDeleted(false)
                    .build();
            }
            
            vacationRepository.save(vacation);
            log.info("휴무 데이터 설정 완료: consultantId={}, date={}, id={}", consultantId, date, vacation.getId());
            
        } catch (Exception e) {
            log.error("휴무 데이터 설정 실패: consultantId={}, date={}, error={}", consultantId, date, e.getMessage(), e);
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ConsultantAvailabilityDto> getAvailabilityByConsultantId(Long consultantId) {
        log.info("상담사 상담 가능 시간 조회: consultantId={}", consultantId);
        
        List<ConsultantAvailability> availabilities = availabilityRepository
                .findByConsultantIdAndIsActiveTrueOrderByDayOfWeekAscStartTimeAsc(consultantId);
        
        return availabilities.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional
    public ConsultantAvailabilityDto addAvailability(ConsultantAvailabilityDto dto) {
        log.info("상담 가능 시간 추가: consultantId={}, dayOfWeek={}, startTime={}, endTime={}", 
                dto.getConsultantId(), dto.getDayOfWeek(), dto.getStartTime(), dto.getEndTime());
        
        ConsultantAvailability availability = ConsultantAvailability.builder()
                .consultantId(dto.getConsultantId())
                .dayOfWeek(dto.getDayOfWeek())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .durationMinutes(dto.getDurationMinutes())
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .notes(dto.getNotes())
                .build();
        
        ConsultantAvailability saved = availabilityRepository.save(availability);
        log.info("상담 가능 시간 추가 완료: id={}", saved.getId());
        
        return convertToDto(saved);
    }
    
    @Override
    @Transactional
    public ConsultantAvailabilityDto updateAvailability(Long id, ConsultantAvailabilityDto dto) {
        log.info("상담 가능 시간 수정: id={}", id);
        
        ConsultantAvailability availability = availabilityRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("상담 가능 시간을 찾을 수 없습니다: " + id));
        
        availability.setDayOfWeek(dto.getDayOfWeek());
        availability.setStartTime(dto.getStartTime());
        availability.setEndTime(dto.getEndTime());
        availability.setDurationMinutes(dto.getDurationMinutes());
        availability.setIsActive(dto.getIsActive());
        availability.setNotes(dto.getNotes());
        
        ConsultantAvailability saved = availabilityRepository.save(availability);
        log.info("상담 가능 시간 수정 완료: id={}", saved.getId());
        
        return convertToDto(saved);
    }
    
    @Override
    @Transactional
    public void deleteAvailability(Long id) {
        log.info("상담 가능 시간 삭제: id={}", id);
        
        if (!availabilityRepository.existsById(id)) {
            throw new IllegalArgumentException("상담 가능 시간을 찾을 수 없습니다: " + id);
        }
        
        availabilityRepository.deleteById(id);
        log.info("상담 가능 시간 삭제 완료: id={}", id);
    }
    
    @Override
    @Transactional
    public void deleteAllByConsultantId(Long consultantId) {
        log.info("상담사별 상담 가능 시간 전체 삭제: consultantId={}", consultantId);
        
        availabilityRepository.deleteByConsultantId(consultantId);
        log.info("상담사별 상담 가능 시간 전체 삭제 완료: consultantId={}", consultantId);
    }
    
    // === 휴무 관리 ===
    
    @Override
    @Transactional
    public Map<String, Object> setVacation(Long consultantId, String date, String type, String reason, String startTime, String endTime) {
        log.info("상담사 휴무 설정: consultantId={}, date={}, type={}, reason={}, startTime={}, endTime={}", 
                consultantId, date, type, reason, startTime, endTime);
        
        // 기존 휴가 데이터 확인
        LocalDate vacationDate = LocalDate.parse(date);
        Vacation existingVacation = vacationRepository.findByConsultantIdAndVacationDateAndIsDeletedFalse(consultantId, vacationDate);
        
        Vacation vacation;
        if (existingVacation != null) {
            // 기존 휴가 수정
            vacation = existingVacation;
            vacation.setVacationType(Vacation.VacationType.valueOf(type));
            vacation.setReason(reason);
            vacation.setStartTime(startTime != null && !startTime.trim().isEmpty() ? LocalTime.parse(startTime) : null);
            vacation.setEndTime(endTime != null && !endTime.trim().isEmpty() ? LocalTime.parse(endTime) : null);
            vacation.setUpdatedAt(LocalDateTime.now());
        } else {
            // 새 휴가 생성
            vacation = Vacation.builder()
                .consultantId(consultantId)
                .vacationDate(vacationDate)
                .vacationType(Vacation.VacationType.valueOf(type))
                .reason(reason)
                .startTime(startTime != null && !startTime.trim().isEmpty() ? LocalTime.parse(startTime) : null)
                .endTime(endTime != null && !endTime.trim().isEmpty() ? LocalTime.parse(endTime) : null)
                .isApproved(true) // 기본적으로 승인된 상태로 설정
                .isDeleted(false)
                .build();
        }
        
        vacation = vacationRepository.save(vacation);
        
        log.info("휴무 설정 완료: consultantId={}, date={}, id={}", consultantId, date, vacation.getId());
        
        Map<String, Object> result = new HashMap<>();
        result.put("id", vacation.getId());
        result.put("consultantId", consultantId);
        result.put("date", date);
        result.put("type", type);
        result.put("typeName", getVacationTypeName(type));
        result.put("reason", reason);
        result.put("startTime", startTime);
        result.put("endTime", endTime);
        result.put("isApproved", vacation.getIsApproved());
        result.put("status", getVacationStatusName(vacation.getIsApproved()));
        result.put("createdAt", vacation.getCreatedAt());
        
        return result;
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getVacations(Long consultantId, String startDate, String endDate) {
        log.info("상담사 휴무 조회: consultantId={}, startDate={}, endDate={}", consultantId, startDate, endDate);
        
        try {
            List<Vacation> vacations;
            
            if (startDate != null && endDate != null) {
                // 날짜 범위로 조회
                LocalDate start = LocalDate.parse(startDate);
                LocalDate end = LocalDate.parse(endDate);
                vacations = vacationRepository.findByConsultantIdAndDateRange(consultantId, start, end);
            } else {
                // 전체 조회
                vacations = vacationRepository.findByConsultantIdAndIsDeletedFalseOrderByVacationDateAsc(consultantId);
            }
            
            List<Map<String, Object>> result = new ArrayList<>();
            for (Vacation vacation : vacations) {
                Map<String, Object> vacationData = new HashMap<>();
                vacationData.put("id", vacation.getId());
                vacationData.put("consultantId", vacation.getConsultantId());
                vacationData.put("date", vacation.getVacationDate().toString());
                vacationData.put("type", vacation.getVacationType().name());
                vacationData.put("typeName", getVacationTypeName(vacation.getVacationType().name()));
                vacationData.put("reason", vacation.getReason());
                vacationData.put("startTime", vacation.getStartTime() != null ? vacation.getStartTime().toString() : null);
                vacationData.put("endTime", vacation.getEndTime() != null ? vacation.getEndTime().toString() : null);
                vacationData.put("isApproved", vacation.getIsApproved());
                vacationData.put("status", getVacationStatusName(vacation.getIsApproved()));
                vacationData.put("createdAt", vacation.getCreatedAt());
                
                result.add(vacationData);
            }
            
            log.info("휴무 조회 완료: {}개", result.size());
            return result;
        } catch (Exception e) {
            log.error("휴무 조회 중 오류 발생: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }
    
    @Override
    public Map<String, Object> getAllConsultantsVacations(String date) {
        log.info("모든 상담사 휴무 정보 조회: date={}", date);
        
        try {
            List<Vacation> vacations;
            
            if (date != null) {
                // 특정 날짜의 휴가 조회
                LocalDate vacationDate = LocalDate.parse(date);
                vacations = vacationRepository.findByVacationDate(vacationDate);
            } else {
                // 모든 휴가 조회
                vacations = vacationRepository.findByIsDeletedFalseOrderByVacationDateAsc();
            }
            
            Map<String, Object> result = new HashMap<>();
            Map<String, Map<String, Object>> consultantVacations = new HashMap<>();
            
            for (Vacation vacation : vacations) {
                String consultantId = vacation.getConsultantId().toString();
                String vacationDate = vacation.getVacationDate().toString();
                
                // 상담사 이름 조회
                String consultantName = "알 수 없음";
                try {
                    User consultant = userRepository.findById(vacation.getConsultantId()).orElse(null);
                    if (consultant != null) {
                        consultantName = consultant.getName();
                    }
                } catch (Exception e) {
                    log.warn("상담사 이름 조회 실패: consultantId={}, error={}", consultantId, e.getMessage());
                }
                
                Map<String, Object> vacationData = new HashMap<>();
                vacationData.put("type", vacation.getVacationType().name());
                vacationData.put("typeName", getVacationTypeName(vacation.getVacationType().name()));
                vacationData.put("reason", vacation.getReason());
                vacationData.put("startTime", vacation.getStartTime() != null ? vacation.getStartTime().toString() : null);
                vacationData.put("endTime", vacation.getEndTime() != null ? vacation.getEndTime().toString() : null);
                vacationData.put("isApproved", vacation.getIsApproved());
                vacationData.put("status", getVacationStatusName(vacation.getIsApproved()));
                vacationData.put("consultantName", consultantName);
                
                consultantVacations.computeIfAbsent(consultantId, k -> new HashMap<>())
                    .put(vacationDate, vacationData);
            }
            
            result.putAll(consultantVacations);
            
            log.info("모든 상담사 휴무 정보 조회 완료: {}명", result.size());
            return result;
        } catch (Exception e) {
            log.error("모든 상담사 휴무 정보 조회 중 오류 발생: {}", e.getMessage(), e);
            return new HashMap<>();
        }
    }
    
    @Override
    @Transactional
    public void deleteVacation(Long consultantId, String date) {
        log.info("상담사 휴무 삭제: consultantId={}, date={}", consultantId, date);
        
        try {
            LocalDate vacationDate = LocalDate.parse(date);
            Vacation vacation = vacationRepository.findByConsultantIdAndVacationDateAndIsDeletedFalse(consultantId, vacationDate);
            
            if (vacation != null) {
                vacation.setIsDeleted(true);
                vacation.setDeletedAt(LocalDateTime.now());
                vacationRepository.save(vacation);
                log.info("휴무 삭제 완료: consultantId={}, date={}, id={}", consultantId, date, vacation.getId());
            } else {
                log.warn("휴무 데이터 없음: consultantId={}, date={}", consultantId, date);
            }
        } catch (Exception e) {
            log.error("휴무 삭제 실패: consultantId={}, date={}, error={}", consultantId, date, e.getMessage(), e);
            throw new RuntimeException("휴무 삭제에 실패했습니다: " + e.getMessage());
        }
    }
    
    /**
     * 엔티티를 DTO로 변환
     */
    private ConsultantAvailabilityDto convertToDto(ConsultantAvailability availability) {
        return ConsultantAvailabilityDto.builder()
                .id(availability.getId())
                .consultantId(availability.getConsultantId())
                .dayOfWeek(availability.getDayOfWeek())
                .startTime(availability.getStartTime())
                .endTime(availability.getEndTime())
                .durationMinutes(availability.getDurationMinutes())
                .isActive(availability.getIsActive())
                .notes(availability.getNotes())
                .build();
    }
    
    /**
     * 상담사가 특정 날짜와 시간에 휴무 상태인지 확인
     */
    @Override
    public boolean isConsultantOnVacation(Long consultantId, LocalDate date, java.time.LocalTime startTime, java.time.LocalTime endTime) {
        try {
            log.info(getVacationLogMessage("CHECK_START", consultantId, date, startTime, endTime));
            
            // 데이터베이스에서 휴가 정보 조회
            Vacation vacation = vacationRepository.findByConsultantIdAndVacationDateAndIsDeletedFalse(consultantId, date);
            
            if (vacation == null) {
                log.info("✅ 휴무 정보 없음: 상담사 {}, 날짜 {}", consultantId, date);
                return false;
            }
            
            Vacation.VacationType vacationType = vacation.getVacationType();
            LocalTime vacationStartTime = vacation.getStartTime();
            LocalTime vacationEndTime = vacation.getEndTime();
            
            log.info("🏖️ 휴무 정보 확인: 타입 {}, 시작 {}, 종료 {}", vacationType, vacationStartTime, vacationEndTime);
            
            // 휴무 타입별 확인
            switch (vacationType) {
                case ALL_DAY:
                case FULL_DAY:
                    log.warn("🚫 하루 종일 휴무: 상담사 {}, 날짜 {}", consultantId, date);
                    return true;
                    
                case MORNING:
                    // 오전 휴가: 09:00-13:00
                    if (startTime.isBefore(java.time.LocalTime.of(13, 0))) {
                        log.warn("🚫 오전 휴가: 상담사 {}, 날짜 {}, 시간 {}", consultantId, date, startTime);
                        return true;
                    }
                    break;
                    
                case MORNING_HALF_DAY:
                    // 오전반차: 09:00-14:00
                    if (startTime.isBefore(java.time.LocalTime.of(14, 0))) {
                        log.warn("🚫 오전반차: 상담사 {}, 날짜 {}, 시간 {}", consultantId, date, startTime);
                        return true;
                    }
                    break;
                    
                case MORNING_HALF_1:
                    // 오전 반반차 1: 09:00-11:00
                    if (startTime.isBefore(java.time.LocalTime.of(11, 0))) {
                        log.warn("🚫 오전 반반차 1: 상담사 {}, 날짜 {}, 시간 {}", consultantId, date, startTime);
                        return true;
                    }
                    break;
                    
                case MORNING_HALF_2:
                    // 오전 반반차 2: 11:00-13:00
                    if (!startTime.isBefore(java.time.LocalTime.of(11, 0)) && startTime.isBefore(java.time.LocalTime.of(13, 0))) {
                        log.warn("🚫 오전 반반차 2: 상담사 {}, 날짜 {}, 시간 {}", consultantId, date, startTime);
                        return true;
                    }
                    break;
                    
                case AFTERNOON:
                    // 오후 휴가: 14:00-18:00
                    if (!startTime.isBefore(java.time.LocalTime.of(14, 0))) {
                        log.warn("🚫 오후 휴가: 상담사 {}, 날짜 {}, 시간 {}", consultantId, date, startTime);
                        return true;
                    }
                    break;
                    
                case AFTERNOON_HALF_DAY:
                    // 오후반차: 14:00-18:00
                    if (!startTime.isBefore(java.time.LocalTime.of(14, 0))) {
                        log.warn("🚫 오후반차: 상담사 {}, 날짜 {}, 시간 {}", consultantId, date, startTime);
                        return true;
                    }
                    break;
                    
                case AFTERNOON_HALF_1:
                    // 오후 반반차 1: 14:00-16:00
                    if (!startTime.isBefore(java.time.LocalTime.of(14, 0)) && startTime.isBefore(java.time.LocalTime.of(16, 0))) {
                        log.warn("🚫 오후 반반차 1: 상담사 {}, 날짜 {}, 시간 {}", consultantId, date, startTime);
                        return true;
                    }
                    break;
                    
                case AFTERNOON_HALF_2:
                    // 오후 반반차 2: 16:00-18:00
                    if (!startTime.isBefore(java.time.LocalTime.of(16, 0))) {
                        log.warn("🚫 오후 반반차 2: 상담사 {}, 날짜 {}, 시간 {}", consultantId, date, startTime);
                        return true;
                    }
                    break;
                    
                case CUSTOM_TIME:
                    if (vacationStartTime != null && vacationEndTime != null) {
                        // 스케줄 시간이 휴무 시간과 겹치는지 확인
                        if ((startTime.isBefore(vacationEndTime) && endTime.isAfter(vacationStartTime))) {
                            log.warn("🚫 사용자 정의 휴무 시간 겹침: 상담사 {}, 날짜 {}, 스케줄 {} - {}, 휴무 {} - {}", 
                                consultantId, date, startTime, endTime, vacationStartTime, vacationEndTime);
                            return true;
                        }
                    }
                    break;
            }
            
            log.info("✅ 휴무 상태 아님: 상담사 {}, 날짜 {}, 시간 {} - {}", consultantId, date, startTime, endTime);
            return false;
            
        } catch (Exception e) {
            log.error("❌ 휴무 상태 확인 오류: 상담사 {}, 날짜 {}, 시간 {} - {}, 오류: {}", 
                consultantId, date, startTime, endTime, e.getMessage());
            return false; // 오류 시 휴무가 아닌 것으로 처리
        }
    }
    
    /**
     * 휴가 타입 한글명 조회 (데이터베이스 코드 사용)
     */
    private String getVacationTypeName(String typeCode) {
        try {
            // 데이터베이스에서 휴가 타입 코드 조회
            String typeName = commonCodeService.getCodeName("VACATION_TYPE", typeCode);
            if (!typeName.equals(typeCode)) {
                return typeName; // 데이터베이스에서 찾은 한글명 반환
            }
        } catch (Exception e) {
            log.warn("휴가 타입 코드 조회 실패: {} -> 기본값 사용", typeCode);
        }
        
        // 데이터베이스에서 찾지 못한 경우 기본값 사용 (카테고리명으로 직접 반환)
        switch (typeCode) {
            // 반반차
            case "MORNING_HALF_1":
            case "MORNING_HALF_2":
            case "AFTERNOON_HALF_1":
            case "AFTERNOON_HALF_2":
                return "반반차";
                
            // 반차
            case "MORNING":
            case "AFTERNOON":
            case "MORNING_HALF_DAY":
            case "AFTERNOON_HALF_DAY":
                return "반차";
                
            // 개인사정
            case "CUSTOM_TIME":
                return "개인사정";
                
            // 연차 (종일)
            case "ALL_DAY":
            case "FULL_DAY":
            default:
                return "연차";
        }
    }
    
    /**
     * 휴가 상태 한글명 조회 (데이터베이스 코드 사용)
     */
    private String getVacationStatusName(Boolean isApproved) {
        try {
            String statusCode = isApproved ? "APPROVED" : "PENDING";
            // 데이터베이스에서 휴가 상태 코드 조회
            String statusName = commonCodeService.getCodeName("VACATION_STATUS", statusCode);
            if (!statusName.equals(statusCode)) {
                return statusName; // 데이터베이스에서 찾은 한글명 반환
            }
        } catch (Exception e) {
            log.warn("휴가 상태 코드 조회 실패: {} -> 기본값 사용", isApproved);
        }
        
        // 데이터베이스에서 찾지 못한 경우 기본값 사용
        return isApproved ? "승인" : "대기중";
    }
    
    /**
     * 휴가 관련 로그 메시지 조회 (데이터베이스 코드 사용)
     */
    private String getVacationLogMessage(String messageType, Long consultantId, LocalDate date, java.time.LocalTime startTime, java.time.LocalTime endTime) {
        try {
            // 데이터베이스에서 휴가 관련 로그 메시지 조회
            String message = commonCodeService.getCodeName("VACATION_LOG", messageType);
            if (!message.equals(messageType)) {
                return message.replace("{consultantId}", consultantId.toString())
                             .replace("{date}", date.toString())
                             .replace("{startTime}", startTime != null ? startTime.toString() : "")
                             .replace("{endTime}", endTime != null ? endTime.toString() : "");
            }
        } catch (Exception e) {
            log.warn("휴가 로그 메시지 조회 실패: {} -> 기본값 사용", e.getMessage());
        }
        
        // 데이터베이스에서 찾지 못한 경우 기본값 사용
        switch (messageType) {
            case "CHECK_START":
                return "🏖️ 휴무 상태 확인: 상담사 {}, 날짜 {}, 시간 {} - {}";
            case "NOT_FOUND":
                return "✅ 휴무 정보 없음: 상담사 {}, 날짜 {}";
            case "FOUND":
                return "🏖️ 휴무 정보 확인: 타입 {}, 시작 {}, 종료 {}";
            case "CONFLICT":
                return "🚫 휴무 중인 상담사: 상담사 {}, 날짜 {}";
            case "NOT_CONFLICT":
                return "✅ 휴무 상태 아님: 상담사 {}, 날짜 {}, 시간 {} - {}";
            case "ERROR":
                return "❌ 휴무 상태 확인 오류: 상담사 {}, 날짜 {}, 시간 {} - {}, 오류: {}";
            default:
                return "🏖️ 휴무 관련 로그: 상담사 {}, 날짜 {}";
        }
    }
}

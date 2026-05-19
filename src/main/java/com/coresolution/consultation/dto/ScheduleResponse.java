package com.coresolution.consultation.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import com.coresolution.consultation.entity.Schedule;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Builder.Default;

/**
 * 스케줄 응답 DTO
 * 상담 유형을 한글로 변환하여 반환
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-11-20
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleResponse {
    
    private Long id;
    private Long consultantId;
    private String consultantName;
    /** 관리자 통합 캘린더 등 목록용 상담사 연락처(복호화·포맷 정책은 Admin 목록과 동일). */
    private String consultantPhone;
    private String consultantEmail;
    /** 상담사 전문가 유형(professionalProviderTypeCode). 공통코드 PROFESSIONAL_PROVIDER_TYPE의 code_value. */
    private String consultantProfessionalProviderTypeCode;
    private Long clientId;
    private String clientName;
    private String clientPhone;
    private String clientEmail;
    /** 상담사 프로필 이미지 URL (일반적으로 평문 URL; 앱·웹 아바타용) */
    private String consultantProfileImageUrl;
    /** 내담자 프로필 이미지 URL */
    private String clientProfileImageUrl;
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    private String status;
    private String scheduleType;
    private String consultationType; // 한글로 변환된 상담 유형
    private String vacationType; // 휴가 유형 (VACATION 스케줄용)
    private String title;
    private String description;
    private String notes;
    private Long consultationId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * 해당 스케줄에 연결된 내담자 특이사항 중 미해소({@code resolvedAt} 없음) 건수. 항상 0 이상.
     */
    @Default
    private int clientScheduleNotesUnresolvedCount = 0;

    /**
     * 해당 내담자({@code clientId}) 기준 미해소 특이사항 전체 건수(다른 일정·매칭 포함).
     * {@code clientId}가 없으면 0.
     */
    @Default
    private int clientScheduleNotesClientWideUnresolvedCount = 0;

    /** 일정 예약·차감 시점 매칭 ID ({@code schedules.mapping_id}). 없으면 null. */
    private Long mappingId;

    /** 일정 시점 매칭 총 회기 수(단회기=1 → 캘린더 표기 없음). 없으면 null. */
    private Integer totalSessions;

    /** 현재 ACTIVE/SESSIONS_EXHAUSTED 매칭 남은 회기(미래 일정 SSOT). 없으면 null. */
    private Integer remainingSessions;

    /** 예약 시점 회차(1-based). 미설정·가예약·단회기 미차감 시 null. */
    private Integer sessionSequence;

    /**
     * Schedule 엔티티를 ScheduleResponse로 변환
     * 상담 유형을 한글로 변환
     */
    public static ScheduleResponse from(Schedule schedule, String koreanConsultationType) {
        return ScheduleResponse.builder()
                .id(schedule.getId())
                .consultantId(schedule.getConsultantId())
                .date(schedule.getDate())
                .startTime(schedule.getStartTime())
                .endTime(schedule.getEndTime())
                .status(schedule.getStatus().name())
                .scheduleType(schedule.getScheduleType())
                .consultationType(koreanConsultationType)
                .title(schedule.getTitle())
                .description(schedule.getDescription())
                .consultationId(schedule.getConsultationId())
                .clientId(schedule.getClientId())
                .sessionSequence(schedule.getSessionSequence())
                .createdAt(schedule.getCreatedAt())
                .updatedAt(schedule.getUpdatedAt())
                .clientScheduleNotesUnresolvedCount(0)
                .clientScheduleNotesClientWideUnresolvedCount(0)
                .build();
    }
    
    /**
     * ScheduleResponseDto에서 ScheduleResponse로 변환 (하위 호환성)
     * @deprecated Use from(Schedule, String) instead
     */
    @Deprecated
    public static ScheduleResponse fromDto(ScheduleResponseDto dto) {
        if (dto == null) {
            return null;
        }
        
        return ScheduleResponse.builder()
                .id(dto.getId())
                .consultantId(dto.getConsultantId())
                .date(dto.getDate())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .status(dto.getStatus())
                .scheduleType(dto.getScheduleType())
                .consultationType(dto.getConsultationType())
                .title(dto.getTitle())
                .description(dto.getDescription())
                .consultationId(dto.getConsultationId())
                .clientId(dto.getClientId())
                .clientScheduleNotesUnresolvedCount(0)
                .clientScheduleNotesClientWideUnresolvedCount(0)
                .build();
    }
    
    /**
     * ScheduleDto에서 ScheduleResponse로 변환 (하위 호환성)
     * @deprecated Use from(Schedule, String) instead
     */
    @Deprecated
    public static ScheduleResponse fromScheduleDto(ScheduleDto dto) {
        if (dto == null) {
            return null;
        }
        
        return ScheduleResponse.builder()
                .id(dto.getId())
                .consultantId(dto.getConsultantId())
                .consultantName(dto.getConsultantName())
                .consultantProfessionalProviderTypeCode(dto.getConsultantProfessionalProviderTypeCode())
                .clientId(dto.getClientId())
                .clientName(dto.getClientName())
                .date(dto.getDate())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .status(dto.getStatus())
                .scheduleType(dto.getScheduleType())
                .consultationType(dto.getConsultationType())
                .vacationType(dto.getVacationType())
                .title(dto.getTitle())
                .description(dto.getDescription())
                .notes(dto.getNotes())
                .createdAt(dto.getCreatedAt())
                .updatedAt(dto.getUpdatedAt())
                .clientScheduleNotesUnresolvedCount(0)
                .clientScheduleNotesClientWideUnresolvedCount(0)
                .build();
    }
}


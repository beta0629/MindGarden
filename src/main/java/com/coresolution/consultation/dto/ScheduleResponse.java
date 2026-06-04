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
     * 내담자({@code clientId}) 의 외부 과거 회기수 ({@code users.past_session_count}).
     * NULL = 외부 이력 없음(신규 내담자).
     *
     * @since 2026-06-08
     */
    private Long pastSessionCount;

    /**
     * 합산 사용 회기수 = ({@link #pastSessionCount} ?? 0) + (매핑 사용 회기).
     *
     * <p>매핑 사용 회기 = {@link #sessionSequence} 우선, 없으면
     * ({@link #totalSessions} - {@link #remainingSessions}) fallback.
     * 단회기({@code totalSessions <= 1}) 또는 매핑 정보 부족 시 null. 모달은 null 시 회기 영역 비표시.</p>
     *
     * @since 2026-06-08
     */
    private Long combinedUsedSessions;

    /**
     * 합산 총 회기수 = ({@link #pastSessionCount} ?? 0) + {@link #totalSessions}.
     * 단회기({@code totalSessions <= 1}) 또는 매핑 정보 부족 시 null.
     *
     * @since 2026-06-08
     */
    private Long combinedTotalSessions;

    /**
     * 내담자 lifetime 누적 상담 회기수 = ({@link #pastSessionCount} ?? 0)
     * + (해당 내담자의 모든 매핑 {@code usedSessions} 합).
     *
     * <p>매핑 단회기/다회기 무관, 모든 일정에서 표시되는 lifetime 합산.
     * 기존 {@link #combinedUsedSessions}/{@link #combinedTotalSessions} 와 별개로
     * "누적 상담 N회" 라벨 SSOT 로 사용된다.</p>
     *
     * @since 2026-06-08
     */
    private Long clientLifetimeSessionCount;

    /**
     * {@link #pastSessionCount}, {@link #totalSessions}, {@link #remainingSessions},
     * {@link #sessionSequence} 를 기반으로 {@link #combinedUsedSessions},
     * {@link #combinedTotalSessions} 를 계산해 채운다.
     *
     * <p>매핑이 없으면({@code totalSessions == null}) 합산 값을 모두 null 로 두고, 그 외에는
     * 단회기 포함 모든 일정에서 합산 라벨이 표시되도록 한다. 사용자 요구: "누적과 잔여 둘 다 표시".</p>
     *
     * @param pastSessions 외부 이력 회기수 ({@code users.past_session_count}). null 허용.
     * @param totalSessions 일정 시점 매핑 총 회기.
     * @param remainingSessions 현재 매핑 잔여 회기.
     * @param sessionSequence 예약 시점 회차 (1-based).
     */
    public void applyCombinedSessions(
            Long pastSessions,
            Integer totalSessions,
            Integer remainingSessions,
            Integer sessionSequence) {
        this.pastSessionCount = pastSessions;
        if (totalSessions == null) {
            this.combinedUsedSessions = null;
            this.combinedTotalSessions = null;
            return;
        }
        long pastSafe = pastSessions != null && pastSessions > 0L ? pastSessions : 0L;
        Long usedFromMapping = resolveUsedFromMapping(totalSessions, remainingSessions, sessionSequence);
        long usedSafe = usedFromMapping != null ? usedFromMapping : 0L;
        this.combinedUsedSessions = pastSafe + usedSafe;
        this.combinedTotalSessions = pastSafe + totalSessions.longValue();
    }

    /**
     * 해당 일정 시점의 누적 상담 회기수 계산.
     *
     * <p>{@code lifetimeSessionCount = (pastSessions ?? 0) + (currentSessionSequence ?? 0)}.
     * 사용자 정의: "누적 상담 = 과거 N회 + 누적 M회 = 총 (N+M)회 진행" 의 M 은 그 일정의
     * {@code sessionSequence} (1-based 회차). 예) sessionSequence=1 + past=10 → 누적 11.
     * 매핑 외 진입(sessionSequence null) 이면 누적은 past 단독.</p>
     *
     * @param pastSessions {@code users.past_session_count}. null 허용.
     * @param currentSessionSequence 해당 일정의 1-based 회차. null/0 → 0 으로 처리.
     */
    public void applyClientLifetimeSession(Long pastSessions, Long currentSessionSequence) {
        this.pastSessionCount = pastSessions;
        long pastSafe = pastSessions != null && pastSessions > 0L ? pastSessions : 0L;
        long currentSafe = currentSessionSequence != null && currentSessionSequence > 0L
                ? currentSessionSequence
                : 0L;
        this.clientLifetimeSessionCount = pastSafe + currentSafe;
    }

    /**
     * 매핑 단위 사용 회기수 계산. {@code sessionSequence} 가 있으면 1-based 회차를 사용 회기로
     * 간주하고, 없으면 ({@code total - remaining}) 으로 fallback. 둘 다 부족하면 null.
     */
    private static Long resolveUsedFromMapping(
            Integer totalSessions,
            Integer remainingSessions,
            Integer sessionSequence) {
        if (sessionSequence != null && sessionSequence > 0) {
            return Math.min(sessionSequence.longValue(), totalSessions.longValue());
        }
        if (remainingSessions != null && remainingSessions >= 0 && remainingSessions <= totalSessions) {
            return (long) (totalSessions - remainingSessions);
        }
        return null;
    }

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


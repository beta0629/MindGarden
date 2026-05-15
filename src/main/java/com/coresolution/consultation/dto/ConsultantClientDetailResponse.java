package com.coresolution.consultation.dto;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 상담사 맥락 내담자 상세 API 응답. {@code sessionHistory}/{@code memos}는 항상 비-null 목록(빈 배열 가능).
 *
 * @author MindGarden
 * @since 2026-05-15
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ConsultantClientDetailResponse {

    private Long id;
    private String name;
    private String email;
    private String phone;
    private String registeredDate;
    private LocalDate lastSessionDate;
    /** Expo {@code ClientStatus}: ACTIVE, INACTIVE, AT_RISK */
    private String status;
    /** Expo {@code RiskLevel}: LOW, MEDIUM, HIGH, CRITICAL */
    private String riskLevel;
    /**
     * 목록·상세 공통: 매핑의 사용(소진) 회기 수({@link com.coresolution.consultation.entity.ConsultantClientMapping#getUsedSessions()})를
     * API 필드명 {@code totalSessions}로 노출한다 (완료 일정 건수와 다를 수 있음).
     */
    private Integer totalSessions;
    private String consultationPurpose;
    private String specialNotes;
    private LocalDate birthDate;
    private String gender;
    private String occupation;
    private String nickname;
    private String profileImageUrl;

    @Builder.Default
    private List<ConsultantClientSessionHistoryItemResponse> sessionHistory = new ArrayList<>();

    @Builder.Default
    private List<ConsultantClientMemoItemResponse> memos = new ArrayList<>();
}

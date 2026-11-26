package com.coresolution.consultation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 관리자 일정 배정 변경(회기 정정) 요청.
 *
 * <p>{@code POST /api/v1/admin/schedules/{id}/reassign-mapping}</p>
 *
 * @author MindGarden
 * @since 2026-11-26
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleReassignMappingRequest {

    @NotNull(message = "대상 배정 ID는 필수입니다.")
    private Long targetMappingId;

    @NotBlank(message = "배정 변경 사유를 입력해 주세요.")
    @Size(max = 255, message = "배정 변경 사유는 255자 이하여야 합니다.")
    private String reason;
}

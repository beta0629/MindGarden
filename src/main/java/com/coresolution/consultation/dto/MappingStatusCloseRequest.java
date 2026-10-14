package com.coresolution.consultation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 관리자 매칭 상태-only 종료 요청.
 *
 * <p>환불 terminate({@code POST .../terminate})와 분리된 경로.
 * 결제·환불·회기·ERP 변경 없이 status만 TERMINATED로 전이한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-14
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MappingStatusCloseRequest {

    @NotBlank(message = "종료 사유를 입력해 주세요.")
    @Size(max = 500, message = "종료 사유는 500자 이하여야 합니다.")
    private String reason;
}

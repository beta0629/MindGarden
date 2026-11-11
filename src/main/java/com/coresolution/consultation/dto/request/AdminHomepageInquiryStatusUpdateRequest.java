package com.coresolution.consultation.dto.request;

import com.coresolution.consultation.constant.HomepageInquiryConstants;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 관리자 홈페이지 문의 상태 변경 요청.
 *
 * @author CoreSolution
 * @since 2026-11-11
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminHomepageInquiryStatusUpdateRequest {

    @NotBlank
    @Size(max = 32)
    private String status;

    /**
     * 허용 상태인지(서비스에서도 재검증).
     *
     * @return 허용이면 true
     */
    public boolean isAllowedStatus() {
        return status != null && HomepageInquiryConstants.ALLOWED_STATUSES.contains(status);
    }
}

package com.coresolution.consultation.dto.response;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 관리자 홈페이지 문의 상세(이름·전화 복호화).
 *
 * @author CoreSolution
 * @since 2026-11-11
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminHomepageInquiryDetailResponse {

    private Long id;
    private String name;
    private String phone;
    private String inquiryType;
    private String content;
    private String status;
    private String consentVersion;
    private LocalDateTime privacyConsentAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

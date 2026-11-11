package com.coresolution.consultation.dto.response;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 관리자 홈페이지 문의 목록 항목(이름·전화 마스킹).
 *
 * @author CoreSolution
 * @since 2026-11-11
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminHomepageInquiryListItemResponse {

    private Long id;
    private String nameMasked;
    private String phoneMasked;
    private String inquiryType;
    private String status;
    private LocalDateTime createdAt;
}

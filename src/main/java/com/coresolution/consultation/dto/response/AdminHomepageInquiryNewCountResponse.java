package com.coresolution.consultation.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 관리자 사이드바 신규 문의 건수.
 *
 * @author CoreSolution
 * @since 2026-11-11
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminHomepageInquiryNewCountResponse {

    private long newCount;
}

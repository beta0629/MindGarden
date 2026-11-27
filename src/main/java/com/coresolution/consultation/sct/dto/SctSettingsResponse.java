package com.coresolution.consultation.sct.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * SCT 센터 설정 응답.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SctSettingsResponse {
    private Integer linkExpiryDays;
    private Integer retentionDays;
    private Boolean featureEnabled;
    /** 공개 문의 사무실 전화 (system_config sct.public.contact.office). */
    private String officePhone;
    /** 공개 문의 휴대폰 (system_config sct.public.contact.mobile). */
    private String mobilePhone;
}

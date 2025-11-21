package com.coresolution.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 상담사 등록 DTO
 * 
 * @deprecated Use ConsultantRegistrationRequest instead.
 * This class will be removed in version 2.0.0
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Deprecated
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultantRegistrationDto {
    private String username;
    private String email;
    private String password;
    private String name;
    private String phone;
    private String address;
    private String addressDetail;
    private String postalCode;
    private String role;
    private String specialization;
    private String qualifications;
    private String notes;
    private String branchCode;
}

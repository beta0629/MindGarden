package com.mindgarden.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
}

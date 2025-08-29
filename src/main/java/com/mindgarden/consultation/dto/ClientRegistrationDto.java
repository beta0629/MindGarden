package com.mindgarden.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientRegistrationDto {
    private String username;
    private String email;
    private String password;
    private String name;
    private String phone;
    private Integer age;
    private String address;
    private String addressDetail;
    private String postalCode;
    private String consultationPurpose;
    private String consultationHistory;
    private String emergencyContact;
    private String emergencyPhone;
    private String notes;
    private String registeredBy;
}

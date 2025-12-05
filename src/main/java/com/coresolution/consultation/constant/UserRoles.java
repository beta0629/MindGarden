package com.coresolution.consultation.constant;



    try {

        // 공통코드에서 관리자 역할 목록 조회 (codeGroup='ROLE', extraData에 isAdmin=true)

        List<CommonCode> roleCodes = commonCodeService.getActiveCommonCodesByGroup("ROLE");

        if (roleCodes == null || roleCodes.isEmpty()) {

            // 폴백: 표준 관리자 역할만 체크 (브랜치/HQ 개념 제거)

            return role == UserRole.ADMIN || 

                   role == UserRole.TENANT_ADMIN || 

                   role == UserRole.PRINCIPAL || 

                   role == UserRole.OWNER;

        }

        // 공통코드에서 관리자 역할인지 확인

        String roleName = role.name();

        return roleCodes.stream()

            .anyMatch(code -> code.getCodeValue().equals(roleName) && 

                          (code.getExtraData() != null && 

                           (code.getExtraData().contains("\"isAdmin\":true") || 

                            code.getExtraData().contains("\"roleType\":\"ADMIN\""))));

    } catch (Exception e) {

        log.warn("공통코드에서 관리자 역할 조회 실패, 폴백 사용: {}", role, e);

        // 폴백: 표준 관리자 역할만 체크

        return role == UserRole.ADMIN || 

               role == UserRole.TENANT_ADMIN || 

               role == UserRole.PRINCIPAL || 

               role == UserRole.OWNER;

    }

}




    try {

        // 공통코드에서 사무원 역할 목록 조회

        List<CommonCode> roleCodes = commonCodeService.getActiveCommonCodesByGroup("ROLE");

        if (roleCodes == null || roleCodes.isEmpty()) {

            return role == UserRole.STAFF;

        }

        // 공통코드에서 사무원 역할인지 확인

        String roleName = role.name();

        return roleCodes.stream()

            .anyMatch(code -> code.getCodeValue().equals(roleName) && 

                          (code.getExtraData() != null && 

                           (code.getExtraData().contains("\"isStaff\":true") || 

                            code.getExtraData().contains("\"roleType\":\"STAFF\""))));

    } catch (Exception e) {

        log.warn("공통코드에서 사무원 역할 조회 실패, 폴백 사용: {}", role, e);

        return role == UserRole.STAFF;

    }

}

}

package com.coresolution.consultation.constant;

import java.util.List;

/**
 * 테넌트 키 하나에 묶인 공개 /services 안내.
 *
 * @author CoreSolution
 * @since 2026-10-02
 */
public final class PublicCounselingTenantGuide {

    private final String centerName;
    private final String address;
    private final String phone;
    private final String hours;
    private final String counselorNameLine;
    private final String majorLine;
    private final String credentialLabel;
    private final List<String> credentials;
    private final String careerLabel;
    private final List<String> careers;
    private final String intro;
    private final String commonNotice;
    private final String processLine;
    private final List<String> counselingTypes;
    private final List<String> processSteps;

    /**
     * @param centerName 센터명
     * @param address 주소
     * @param phone 전화
     * @param hours 운영시간
     * @param counselorNameLine 상담사 이름 줄
     * @param majorLine 전공 줄
     * @param credentialLabel 전문자격 라벨
     * @param credentials 전문자격
     * @param careerLabel 주요 경력 라벨
     * @param careers 주요 경력
     * @param intro 소개 문구
     * @param commonNotice 공통 고지
     * @param processLine 절차 한 줄
     * @param counselingTypes 상담 종류
     * @param processSteps 절차 단계
     */
    public PublicCounselingTenantGuide(
            String centerName,
            String address,
            String phone,
            String hours,
            String counselorNameLine,
            String majorLine,
            String credentialLabel,
            List<String> credentials,
            String careerLabel,
            List<String> careers,
            String intro,
            String commonNotice,
            String processLine,
            List<String> counselingTypes,
            List<String> processSteps) {
        this.centerName = centerName;
        this.address = address;
        this.phone = phone;
        this.hours = hours;
        this.counselorNameLine = counselorNameLine;
        this.majorLine = majorLine;
        this.credentialLabel = credentialLabel;
        this.credentials = List.copyOf(credentials);
        this.careerLabel = careerLabel;
        this.careers = List.copyOf(careers);
        this.intro = intro;
        this.commonNotice = commonNotice;
        this.processLine = processLine;
        this.counselingTypes = List.copyOf(counselingTypes);
        this.processSteps = List.copyOf(processSteps);
    }

    public String getCenterName() {
        return centerName;
    }

    public String getAddress() {
        return address;
    }

    public String getPhone() {
        return phone;
    }

    public String getHours() {
        return hours;
    }

    public String getCounselorNameLine() {
        return counselorNameLine;
    }

    public String getMajorLine() {
        return majorLine;
    }

    public String getCredentialLabel() {
        return credentialLabel;
    }

    public List<String> getCredentials() {
        return credentials;
    }

    public String getCareerLabel() {
        return careerLabel;
    }

    public List<String> getCareers() {
        return careers;
    }

    public String getIntro() {
        return intro;
    }

    public String getCommonNotice() {
        return commonNotice;
    }

    public String getProcessLine() {
        return processLine;
    }

    public List<String> getCounselingTypes() {
        return counselingTypes;
    }

    public List<String> getProcessSteps() {
        return processSteps;
    }
}

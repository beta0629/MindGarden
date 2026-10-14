package com.coresolution.core.krpublic;

import org.springframework.stereotype.Component;

import com.coresolution.core.constant.KrPublicDataMessages;

import lombok.extern.slf4j.Slf4j;

/**
 * 국세청 사업자등록 진위확인·상태조회 결과의 온보딩 게이트·영속 코드 캡슐화.
 * HTTP 는 {@link KrPublicDataClient}, 조회·파싱은 {@link KrPublicDataService} 를 재사용한다.
 *
 * @author CoreSolution
 * @since 2026-10-14
 */
@Slf4j
@Component
public class BusinessRegistrationVerifier {

    /** 계속사업자 + 진위 일치. */
    public static final String STATUS_MATCH = "MATCH";
    /** 진위 불일치. */
    public static final String STATUS_MISMATCH = "MISMATCH";
    /** 키 미설정·타임아웃·파싱 실패 등. */
    public static final String STATUS_UNCONFIRMED = "UNCONFIRMED";
    /** 국세청 미등록. */
    public static final String STATUS_UNREGISTERED = "UNREGISTERED";
    /** 폐업. */
    public static final String STATUS_CLOSED = "CLOSED";
    /** 휴업(등록 허용·경고). */
    public static final String STATUS_SUSPENDED = "SUSPENDED";

    /**
     * 조회 결과에 게이트·영속 필드를 채운다. 예외는 던지지 않는다.
     *
     * @param result 조회 결과(가변)
     * @return 동일 인스턴스
     */
    public BusinessVerificationResult enrich(BusinessVerificationResult result) {
        if (result == null) {
            return null;
        }
        String verificationStatus = resolveVerificationStatus(result);
        result.setVerificationStatus(verificationStatus);
        result.setSuspendedWarning(STATUS_SUSPENDED.equals(verificationStatus)
                || KrPublicDataMessages.businessSuspended().equals(result.getBusinessStatus()));
        if (result.getSuspendedWarning() != null && result.getSuspendedWarning()
                && result.getOverallStatus() != null
                && KrPublicDataMessages.overallMatch().equals(result.getOverallStatus())) {
            // 휴업 경고는 FE·checklist 에 노출. overallStatus(일치)는 유지.
            log.info("nts suspended warning: verificationStatus={}", verificationStatus);
        }
        return result;
    }

    /**
     * 온보딩 등록 게이트. 불일치·폐업·미등록이면 차단한다.
     * 미확인·휴업(경고)·일치는 허용한다.
     *
     * @param result 조회 결과
     * @throws IllegalArgumentException 등록을 막아야 할 때(properties 문구)
     */
    public void assertOnboardingAllowed(BusinessVerificationResult result) {
        if (result == null) {
            return;
        }
        enrich(result);
        String status = result.getVerificationStatus();
        if (STATUS_MISMATCH.equals(status)
                || KrPublicDataMessages.overallMismatch().equals(result.getOverallStatus())) {
            throw new IllegalArgumentException(KrPublicDataMessages.gateMismatch());
        }
        if (STATUS_CLOSED.equals(status)
                || KrPublicDataMessages.businessClosed().equals(result.getBusinessStatus())) {
            throw new IllegalArgumentException(KrPublicDataMessages.gateClosed());
        }
        if (STATUS_UNREGISTERED.equals(status)
                || KrPublicDataMessages.overallUnregistered().equals(result.getOverallStatus())
                || KrPublicDataMessages.businessUnregistered().equals(result.getBusinessStatus())) {
            throw new IllegalArgumentException(KrPublicDataMessages.gateUnregistered());
        }
    }

    /**
     * overall·businessStatus 로부터 영속용 종합 코드를 계산한다.
     *
     * @param result 조회 결과
     * @return MATCH / MISMATCH / UNCONFIRMED / UNREGISTERED / CLOSED / SUSPENDED
     */
    public String resolveVerificationStatus(BusinessVerificationResult result) {
        if (result == null) {
            return STATUS_UNCONFIRMED;
        }
        if (KrPublicDataMessages.businessClosed().equals(result.getBusinessStatus())) {
            return STATUS_CLOSED;
        }
        if (KrPublicDataMessages.overallUnregistered().equals(result.getOverallStatus())
                || KrPublicDataMessages.businessUnregistered().equals(result.getBusinessStatus())) {
            return STATUS_UNREGISTERED;
        }
        if (KrPublicDataMessages.overallMismatch().equals(result.getOverallStatus())
                || Boolean.FALSE.equals(result.getAuthenticityMatch())) {
            return STATUS_MISMATCH;
        }
        if (KrPublicDataMessages.overallUnconfirmed().equals(result.getOverallStatus())
                || result.getOverallStatus() == null) {
            return STATUS_UNCONFIRMED;
        }
        if (KrPublicDataMessages.businessSuspended().equals(result.getBusinessStatus())
                && (Boolean.TRUE.equals(result.getAuthenticityMatch())
                        || KrPublicDataMessages.overallMatch().equals(result.getOverallStatus()))) {
            return STATUS_SUSPENDED;
        }
        if (KrPublicDataMessages.overallMatch().equals(result.getOverallStatus())
                || Boolean.TRUE.equals(result.getAuthenticityMatch())) {
            return STATUS_MATCH;
        }
        return STATUS_UNCONFIRMED;
    }

    /**
     * 국세청 원시 코드를 영속 문자열로 합친다.
     *
     * @param businessStatusCode b_stt_cd (01/02/03) 또는 빈 값
     * @param validCode          valid (01/02) 또는 빈 값
     * @return 예: b_stt_cd=01;valid=01. 둘 다 없으면 null
     */
    public static String composeResultCode(String businessStatusCode, String validCode) {
        StringBuilder sb = new StringBuilder();
        if (businessStatusCode != null && !businessStatusCode.isBlank()) {
            sb.append("b_stt_cd=").append(businessStatusCode.trim());
        }
        if (validCode != null && !validCode.isBlank()) {
            if (sb.length() > 0) {
                sb.append(';');
            }
            sb.append("valid=").append(validCode.trim());
        }
        return sb.length() == 0 ? null : sb.toString();
    }
}

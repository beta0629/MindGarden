package com.coresolution.consultation.sct.service;

import com.coresolution.consultation.entity.auth.PhoneOtpAttempt;
import com.coresolution.consultation.repository.auth.PhoneOtpAttemptRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * SCT 본인확인 OTP 오답·잠금 기록 — 호출 트랜잭션 롤백과 분리({@link Propagation#REQUIRES_NEW}).
 *
 * <p>자기 호출 프록시 우회를 위해 별도 빈으로 둔다. 오답 시 {@code confirmOtp} 가 예외를 던져도
 * attempts / FAILED 상태가 커밋되도록 한다.</p>
 *
 * @author MindGarden
 * @since 2026-11-27
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SctIdentityOtpAttemptRecorder {

    private final PhoneOtpAttemptRepository phoneOtpAttemptRepository;

    /**
     * 오답 1회를 독립 트랜잭션으로 반영한다. maxAttempts 도달 시 status=FAILED.
     *
     * @param otpId       phone_otp_attempts PK
     * @param tenantId    테넌트
     * @param maxAttempts 테넌트 설정 최대 시도({@link SctIdentityOtpSettings#maxAttempts})
     * @return 반영 결과(시도 횟수·잠금 여부)
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public WrongAttemptResult recordWrongAttempt(Long otpId, String tenantId, int maxAttempts) {
        PhoneOtpAttempt row = phoneOtpAttemptRepository
                .findByIdAndTenantIdForUpdate(otpId, tenantId)
                .orElse(null);
        if (row == null) {
            log.warn("SCT OTP wrong-attempt row missing: otpId present={}, tenant present={}",
                    otpId != null, tenantId != null && !tenantId.isBlank());
            return WrongAttemptResult.missing();
        }
        if (PhoneOtpAttempt.STATUS_FAILED.equals(row.getStatus())) {
            int attempts = row.getAttempts() == null ? 0 : row.getAttempts();
            return new WrongAttemptResult(attempts, true, row.getStatus());
        }
        int attempts = row.getAttempts() == null ? 0 : row.getAttempts();
        if (attempts >= maxAttempts) {
            row.setStatus(PhoneOtpAttempt.STATUS_FAILED);
            phoneOtpAttemptRepository.saveAndFlush(row);
            return new WrongAttemptResult(attempts, true, PhoneOtpAttempt.STATUS_FAILED);
        }
        attempts = attempts + 1;
        row.setAttempts(attempts);
        boolean locked = attempts >= maxAttempts;
        if (locked) {
            row.setStatus(PhoneOtpAttempt.STATUS_FAILED);
        }
        phoneOtpAttemptRepository.saveAndFlush(row);
        log.info("SCT identity OTP wrong attempt recorded: otpId={}, attempts={}, locked={}",
                otpId, attempts, locked);
        return new WrongAttemptResult(attempts, locked, row.getStatus());
    }

    /**
     * 이미 maxAttempts 이상이면 FAILED 로 고정(증가 없음).
     *
     * @param otpId       phone_otp_attempts PK
     * @param tenantId    테넌트
     * @param maxAttempts 최대 시도
     * @return 잠금 반영 여부
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean markFailedIfMaxed(Long otpId, String tenantId, int maxAttempts) {
        PhoneOtpAttempt row = phoneOtpAttemptRepository
                .findByIdAndTenantIdForUpdate(otpId, tenantId)
                .orElse(null);
        if (row == null) {
            return false;
        }
        if (PhoneOtpAttempt.STATUS_FAILED.equals(row.getStatus())) {
            return true;
        }
        int attempts = row.getAttempts() == null ? 0 : row.getAttempts();
        if (attempts < maxAttempts) {
            return false;
        }
        row.setStatus(PhoneOtpAttempt.STATUS_FAILED);
        phoneOtpAttemptRepository.saveAndFlush(row);
        return true;
    }

    /**
     * 오답 기록 결과.
     *
     * @param attempts 반영 후 시도 횟수
     * @param locked   잠금(FAILED) 여부
     * @param status   반영 후 status
     */
    public record WrongAttemptResult(int attempts, boolean locked, String status) {

        static WrongAttemptResult missing() {
            return new WrongAttemptResult(0, false, null);
        }
    }
}

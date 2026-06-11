package com.coresolution.consultation.service;

import com.coresolution.consultation.constant.OtpPurpose;
import com.coresolution.consultation.dto.OtpDeliveryResult;

/**
 * OTP 발송 SSOT — push-first 우선, SMS 폴백 정책의 단일 진입점.
 *
 * <p>2026-06-11 정책 (휴대전화 변경 운영 검수 결과 반영):
 * <ol>
 *   <li>호출자(컨트롤러)가 {@link com.coresolution.consultation.service.SmsOtpVerificationService}
 *       에 6자리 코드를 사전 저장한 뒤 본 메서드를 호출한다(또는 본 메서드 내부에서 저장).
 *       본 인터페이스는 발송 채널 결정만 책임지며, OTP 저장·검증은
 *       {@link com.coresolution.consultation.service.SmsOtpVerificationService} 가 SSOT 다.</li>
 *   <li>{@code userId != null} && {@code tenantId != null} && 사용자 expo-app 활성 push token 존재 시
 *       → Expo push 우선 발송({@link com.coresolution.consultation.constant.OtpDeliveryChannel#PUSH}).</li>
 *   <li>push token 부재 또는 발송 실패 시 → SMS 게이트웨이 폴백
 *       ({@link com.coresolution.consultation.constant.OtpDeliveryChannel#SMS} /
 *       {@link com.coresolution.consultation.constant.OtpDeliveryChannel#SMS_STUB}).</li>
 *   <li>모든 채널 실패 시 → {@link com.coresolution.consultation.constant.OtpDeliveryChannel#FAILED}.</li>
 * </ol></p>
 *
 * <p>중복 발송 방지: push 성공 시 SMS 는 발송하지 않는다(사용자 혼란 차단).</p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
public interface OtpDeliveryService {

    /**
     * OTP 코드 발송 — push-first → SMS 폴백.
     *
     * @param tenantId        테넌트 ID (push 분기에 필수, SMS 폴백 단독 사용 시 null 허용)
     * @param userId          로그인 사용자 PK (비로그인 흐름은 null → 무조건 SMS)
     * @param normalizedPhone 정규화된 휴대전화 번호 (SMS 폴백 시 사용)
     * @param code            6자리 OTP 코드 (SmsOtpVerificationService 에 사전 저장된 코드와 동일)
     * @param purpose         발송 목적 (push payload {@code data.purpose} · 본문 prefix 분류)
     * @return 채널/시각/사유를 담은 결과
     */
    OtpDeliveryResult deliver(
            String tenantId,
            Long userId,
            String normalizedPhone,
            String code,
            OtpPurpose purpose);
}

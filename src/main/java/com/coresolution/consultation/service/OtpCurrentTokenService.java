package com.coresolution.consultation.service;

import java.util.Optional;

/**
 * Push body 평문 OTP 노출 차단용 — OTP 코드 1회 조회 토큰 SSOT.
 *
 * <p>2026-06-11 PR #224 후속 (보안 강화): 휴대전화 OTP 발송 시 push body 에 평문 코드를 노출하지 않고,
 * push data 페이로드에 단기 {@code otpToken} 만 동봉한다. 사용자가 앱을 열어 인증 화면 진입 후
 * {@code /api/v1/auth/otp/current?otpToken=...} 를 호출하면 본 서비스가 토큰을 검증·소비하여
 * OTP 코드를 1회 반환한다.</p>
 *
 * <p>정책:
 * <ul>
 *   <li>TTL 5분(OTP 자체 TTL 과 동일) — 만료되면 fetch 실패.</li>
 *   <li>단일 사용 — fetch 성공 시 즉시 invalidate.</li>
 *   <li>userId 바인딩 — 발급 당시 userId 와 조회 호출자 userId 가 일치해야 OTP 반환.</li>
 *   <li>저장은 memory(ConcurrentHashMap) 기반 — Redis 백엔드는 후속 PR 에서 인터페이스 교체로 도입 가능.</li>
 * </ul></p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
public interface OtpCurrentTokenService {

    /**
     * Push 발송 직전 호출. 새 {@code otpToken} 을 발급하고 (userId, code) 와 함께 5분 TTL 저장.
     *
     * @param userId 수신 사용자 PK (조회 시 일치 검증용)
     * @param code   6자리 OTP 코드
     * @return 신규 발급된 otpToken (URL-safe 문자열)
     */
    String issue(Long userId, String code);

    /**
     * Push 핸들러가 인증 후 호출. 토큰 + userId 일치 + TTL 내면 OTP 코드 반환 후 즉시 invalidate.
     *
     * @param otpToken 발급된 토큰
     * @param userId   현재 인증 사용자 PK
     * @return TTL 내 + userId 일치하면 {@link Optional} OTP 코드. 그 외 {@link Optional#empty()}
     */
    Optional<String> fetchAndConsume(String otpToken, Long userId);

    /**
     * 만료 항목 정리 — 스케줄러/테스트 용도.
     */
    void evictExpired();
}

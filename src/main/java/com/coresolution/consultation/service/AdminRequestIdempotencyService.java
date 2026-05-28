package com.coresolution.consultation.service;

import com.coresolution.consultation.entity.AdminRequestIdempotency;
import com.coresolution.consultation.exception.MappingAlreadyProcessedException;

/**
 * 어드민 멱등성 가드 서비스 — 옵션 B v2.0 합의서 §4·§6 Q11 (2026-05-28).
 *
 * <p>클라이언트 요청 ID(Idempotency Key) 단위로 동일 요청 재실행을 차단한다.
 * 컨트롤러는 {@link #reserve(String, String, String, Long)} 으로 reservation 을 시도하고,
 * 동일 키 재사용 시 {@link MappingAlreadyProcessedException} 가 throw 된다.</p>
 *
 * <p>구현은 RDB UNIQUE 제약(tenant_id, request_id) 을 사용하여 race condition 을 데이터 계층에서 보장한다.
 * Redis 등 외부 캐시 도입은 v2.0 범위 밖.</p>
 *
 * @author MindGarden
 * @since 2026-05-28
 */
public interface AdminRequestIdempotencyService {

    /**
     * 5 분 TTL.
     * <p>v2.0 합의서 §4 (2026-05-28) — 사용자 재시도 윈도우 가정.
     */
    long DEFAULT_TTL_SECONDS = 5L * 60L;

    /**
     * 멱등성 reservation 을 시도한다.
     *
     * <p>같은 (tenantId, requestId, operation) 조합이 TTL 윈도우 내 이미 존재하면
     * {@link MappingAlreadyProcessedException} 을 throw 한다.</p>
     *
     * <p>{@code requestId} 가 {@code null} 또는 빈 문자열이면 멱등성 검사는 생략한다 (no-op 반환).
     * 컨트롤러에서 헤더 누락 시 UUID 를 자동 생성해 전달하는 책임을 가진다.</p>
     *
     * @param tenantId 테넌트 UUID (필수, 실패 시 IllegalStateException)
     * @param requestId 클라이언트 요청 ID. {@code null}/빈 문자열이면 검사 생략 후 {@code null} 반환.
     * @param operation 오퍼레이션 식별자 (예: {@code CHECKOUT_SAME_DAY})
     * @param mappingId 대상 매칭 ID (audit 용, null 허용)
     * @return reservation 성공 시 저장된 row, 검사 생략 시 {@code null}
     * @throws MappingAlreadyProcessedException 동일 요청 ID 가 이미 reservation 된 경우 (HTTP 409)
     * @throws IllegalStateException tenantId 미설정 시
     */
    AdminRequestIdempotency reserve(String tenantId, String requestId, String operation, Long mappingId);

    /**
     * reservation 의 결과 status 를 마킹한다 (audit 보강용). 실패는 무시한다.
     *
     * @param reservation {@link #reserve} 가 반환한 row (null 이면 no-op)
     * @param resultStatus 결과 status (예: {@code SUCCESS}, {@code FAILED})
     */
    void markResult(AdminRequestIdempotency reservation, String resultStatus);
}

package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.ClientEventRecordCommand;
import com.coresolution.consultation.dto.ClientEventResponse;
import com.coresolution.consultation.entity.ClientEvent;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * 내담자 관리용 타임라인({@code client_event}) Service.
 *
 * <p>조회는 테넌트·내담자 필수. {@link #record} 실패 시 예외를 전파한다(삼키지 않음).</p>
 *
 * @author MindGarden
 * @since 2026-11-26
 */
public interface ClientEventService {

    /**
     * 테넌트·내담자 기준 타임라인을 조회한다.
     *
     * @param tenantId 테넌트 ID (필수)
     * @param clientId 내담자 ID (필수)
     * @param pageable 페이지·정렬
     * @return 이벤트 응답 페이지
     * @throws IllegalArgumentException tenantId 또는 clientId 가 비어 있을 때
     */
    Page<ClientEventResponse> findTimeline(String tenantId, Long clientId, Pageable pageable);

    /**
     * 이벤트를 같은 트랜잭션에서 저장한다. idempotencyKey 가 있으면 기존 행을 반환(멱등).
     *
     * @param command 기록 커맨드
     * @return 저장(또는 기존) 엔티티
     * @throws IllegalArgumentException 필수 필드 누락
     * @throws RuntimeException 저장 실패 시 예외 전파
     */
    ClientEvent record(ClientEventRecordCommand command);
}

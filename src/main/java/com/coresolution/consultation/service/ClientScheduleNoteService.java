package com.coresolution.consultation.service;

import java.util.List;
import java.util.Map;
import com.coresolution.consultation.dto.ClientScheduleNoteCreateRequest;
import com.coresolution.consultation.dto.ClientScheduleNoteResponse;
import com.coresolution.consultation.dto.ClientScheduleNoteUpdateRequest;
import com.coresolution.consultation.entity.User;

/**
 * 내담자 스케줄 특이사항 비즈니스 로직.
 *
 * @author CoreSolution
 * @since 2026-04-29
 */
public interface ClientScheduleNoteService {

    /**
     * 목록 조회. clientId·scheduleId·mappingId 중 하나 이상 필수.
     *
     * @param tenantId 테넌트
     * @param clientId 내담자(선택)
     * @param scheduleId 스케줄(선택)
     * @param mappingId 매칭(선택)
     * @param includeDeleted 삭제 포함(ADMIN만 true 허용)
     * @param currentUser 호출자
     * @return notes, totalCount 맵
     */
    Map<String, Object> listNotes(
            String tenantId,
            Long clientId,
            Long scheduleId,
            Long mappingId,
            boolean includeDeleted,
            User currentUser);

    /**
     * 생성.
     *
     * @param tenantId 테넌트
     * @param request 본문
     * @param currentUser 호출자
     * @return 생성된 DTO
     */
    ClientScheduleNoteResponse create(String tenantId, ClientScheduleNoteCreateRequest request, User currentUser);

    /**
     * 수정.
     *
     * @param tenantId 테넌트
     * @param noteId 노트 ID
     * @param request 본문
     * @param currentUser 호출자
     * @return 갱신 DTO
     */
    ClientScheduleNoteResponse update(
            String tenantId, Long noteId, ClientScheduleNoteUpdateRequest request, User currentUser);

    /**
     * 소프트 삭제.
     *
     * @param tenantId 테넌트
     * @param noteId 노트 ID
     * @param currentUser 호출자
     */
    void softDelete(String tenantId, Long noteId, User currentUser);
}

package com.coresolution.consultation.service;

import java.util.List;
import java.util.Map;
import com.coresolution.consultation.entity.User;

/**
 * 내담자 통계 정보 조회 서비스
 * - 내담자 정보와 통계를 통합 조회
 * - 중앙화된 데이터 관리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-20
 */
public interface ClientStatsService {
    
    /**
     * 내담자 정보 + 통계 정보 통합 조회 (테넌트 스코프)
     *
     * @param tenantId 세션 또는 호출 컨텍스트의 테넌트 ID (필수)
     * @param clientId 내담자(User) ID
     * @return 내담자 정보 + 통계 정보 맵
     */
    Map<String, Object> getClientWithStats(String tenantId, Long clientId);

    /**
     * 매칭된 내담자에 한해 상담사(CONSULTANT)가 내담자 통계·연락처 등을 조회할 때 사용.
     * 활성·회기소진 매칭이 없으면 접근 거부.
     *
     * @param tenantId 테넌트 ID
     * @param clientId 내담자 사용자 ID
     * @param consultantUserId 로그인 상담사 사용자 ID
     * @return {@link #getClientWithStats(String, Long)} 와 동일 형태
     */
    Map<String, Object> getClientWithStatsForConsultant(String tenantId, Long clientId, Long consultantUserId);

    /**
     * 상담일지·프로필 맥락 SSOT — ADMIN/STAFF는 전권(FULL), CONSULTANT는 매칭·일정·상담기록 근거로 FULL/STANDARD 결정.
     *
     * @param tenantId 테넌트 ID
     * @param clientId 내담자 사용자 ID
     * @param caller   현재 로그인 사용자(역할·ID로 분기)
     * @return {@link #getClientWithStats(String, Long)} 와 동일 키 + {@code visibilityTier}, {@code accessReason}
     */
    Map<String, Object> getClientContextProfile(String tenantId, Long clientId, User caller);

    /**
     * 내담자 메모(notes) 갱신 — 맥락 프로필과 동일 접근 규칙, {@code FULL} 등급에서만 수정 가능.
     *
     * @param tenantId 테넌트 ID
     * @param clientId 내담자 사용자 ID
     * @param caller   현재 사용자
     * @param notes    저장할 메모(빈 문자열이면 null 저장)
     * @return 갱신 요약(clientId, notes 표시값)
     */
    Map<String, Object> updateClientContextNotes(String tenantId, Long clientId, User caller, String notes);

    /**
     * 내담자 목록 + 통계 정보 일괄 조회
     * 
     * @return 내담자 목록 + 통계 정보
     */
    List<Map<String, Object>> getAllClientsWithStats();
    
    /**
     * 테넌트별 내담자 목록 + 통계 정보 조회
     * 
     * @param tenantId 테넌트 ID
     * @return 테넌트별 내담자 목록 + 통계 정보
     */
    List<Map<String, Object>> getAllClientsWithStatsByTenant(String tenantId);
    
    /**
     * 활성 매칭(ACTIVE·PAYMENT_CONFIRMED)과 비삭제 일정의 distinct 상담사 ID 합집합 크기.
     *
     * @param clientId 내담자 ID
     * @return 고유 연결 상담사 수
     */
    Long calculateCurrentConsultants(Long clientId);
    
    /**
     * 내담자 통계 계산
     * 
     * @param clientId 내담자 ID
     * @return 통계 정보 맵
     */
    Map<String, Object> calculateClientStats(Long clientId);

    /**
     * 테넌트 단위 내담자 목록+통계 목록 캐시 무효화.
     * {@code GET /api/v1/admin/clients/with-stats} 등에서 사용하는
     * {@code clientsWithStats} 키 {@code 'tenant:' + tenantId} 및 레거시 {@code 'all'} 키를 제거한다.
     *
     * @param tenantId 테넌트 ID
     */
    void evictTenantClientsWithStatsListCache(String tenantId);

    /**
     * 단일 내담자 통계·연결 상담사 수 캐시 무효화.
     * {@link #getClientWithStats} 키 {@code tenant:{tenantId}:client:{clientId}} 및
     * {@code clientCurrentConsultants} 키 {@code client:{clientId}} 와 정합한다.
     *
     * @param tenantId 테넌트 ID
     * @param clientId 내담자 ID
     */
    void evictClientStatsCache(String tenantId, Long clientId);

    /**
     * 전체 내담자 통계 캐시 무효화
     */
    void evictAllClientStatsCache();
}


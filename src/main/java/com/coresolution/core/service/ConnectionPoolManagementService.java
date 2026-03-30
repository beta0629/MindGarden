package com.coresolution.core.service;

import java.util.Map;

/**
 * 데이터베이스 연결 풀 관리 서비스
 * 
 * 연결 풀의 생명주기 관리, 상태 모니터링, 정리 작업을 표준화합니다.
 * 
 * @author CoreSolution
 * @since 2025-12-22
 */
public interface ConnectionPoolManagementService {

    /**
     * 연결 풀 상태 정보 조회
     * 
     * @return 연결 풀 상태 정보 (active, idle, total, max 등)
     */
    Map<String, Object> getConnectionPoolStatus();

    /**
     * 연결 풀 정리 (애플리케이션 종료/실패 시)
     * 
     * @param reason 정리 사유 (예: "종료", "시작 실패")
     * @return 정리 성공 여부
     */
    boolean cleanupConnectionPool(String reason);

    /**
     * 연결 풀 상태 검증
     * 
     * @return 연결 풀이 정상 상태인지 여부
     */
    boolean validateConnectionPool();

    /**
     * 연결 누수 감지
     * 
     * @return 누수 의심 연결 수
     */
    int detectConnectionLeaks();
}


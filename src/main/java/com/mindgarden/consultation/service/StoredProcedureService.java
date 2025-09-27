package com.mindgarden.consultation.service;

import java.util.List;
import java.util.Map;

/**
 * 저장 프로시저 실행 서비스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-27
 */
public interface StoredProcedureService {
    
    /**
     * 업무 시간 설정 조회
     * @return 업무 시간 설정 맵
     */
    Map<String, Object> getBusinessTimeSettings();
    
    /**
     * 업무 시간 설정 업데이트
     * @param codeGroup 코드 그룹
     * @param codeValue 코드 값
     * @param newValue 새로운 값
     * @return 업데이트 성공 여부
     */
    boolean updateBusinessTimeSetting(String codeGroup, String codeValue, String newValue);
    
    /**
     * 시간 충돌 검사
     * @param consultantId 상담사 ID
     * @param date 날짜
     * @param startTime 시작 시간
     * @param endTime 종료 시간
     * @param excludeScheduleId 제외할 스케줄 ID
     * @return 충돌 검사 결과
     */
    Map<String, Object> checkTimeConflict(Long consultantId, String date, String startTime, String endTime, Long excludeScheduleId);
    
    /**
     * 일반적인 저장 프로시저 실행
     * @param procedureName 프로시저 이름
     * @param parameters 매개변수
     * @return 실행 결과
     */
    List<Map<String, Object>> executeProcedure(String procedureName, Map<String, Object> parameters);
}

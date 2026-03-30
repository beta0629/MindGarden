package com.coresolution.consultation.service;

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
    
    /**
     * 매핑 정보 수정 (ERP 연동)
     * @param mappingId 매핑 ID
     * @param newPackageName 새로운 패키지명
     * @param newPackagePrice 새로운 패키지 가격
     * @param newTotalSessions 새로운 총 세션 수
     * @param updatedBy 수정자
     * @return 수정 결과
     */
    Map<String, Object> updateMappingInfo(Long mappingId, String newPackageName, 
                                         Double newPackagePrice, Integer newTotalSessions, String updatedBy);
    
    /**
     * 매핑 수정 권한 확인
     * @param mappingId 매핑 ID
     * @param userId 사용자 ID
     * @param userRole 사용자 역할
     * @return 권한 확인 결과
     */
    Map<String, Object> checkMappingUpdatePermission(Long mappingId, Long userId, String userRole);
    
    // ==================== 동적 권한 관리 ====================
    
    /**
     * 사용자 권한 확인
     * @param roleName 역할명
     * @param permissionCode 권한 코드
     * @return 권한 확인 결과
     */
    Map<String, Object> checkUserPermission(String roleName, String permissionCode);
    
    /**
     * 사용자 권한 목록 조회
     * @param roleName 역할명
     * @return 권한 목록
     */
    List<Map<String, Object>> getUserPermissions(String roleName);
    
    /**
     * 권한 부여
     * @param roleName 역할명
     * @param permissionCode 권한 코드
     * @param grantedBy 부여자
     * @return 성공 여부
     */
    boolean grantPermission(String roleName, String permissionCode, String grantedBy);
    
    /**
     * 권한 회수
     * @param roleName 역할명
     * @param permissionCode 권한 코드
     * @return 성공 여부
     */
    boolean revokePermission(String roleName, String permissionCode);
    
    /**
     * 모든 권한 목록 조회
     * @return 권한 목록
     */
    List<Map<String, Object>> getAllPermissions();
    
    /**
     * 카테고리별 권한 목록 조회
     * @param category 카테고리
     * @return 권한 목록
     */
    List<Map<String, Object>> getPermissionsByCategory(String category);
}

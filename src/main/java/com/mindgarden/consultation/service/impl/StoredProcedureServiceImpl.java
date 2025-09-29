package com.mindgarden.consultation.service.impl;

import java.sql.ResultSet;
import java.sql.Types;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.service.StoredProcedureService;
import org.springframework.jdbc.core.CallableStatementCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 저장 프로시저 실행 서비스 구현
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-27
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StoredProcedureServiceImpl implements StoredProcedureService {
    
    private final JdbcTemplate jdbcTemplate;
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getBusinessTimeSettings() {
        log.info("🕐 PL/SQL 프로시저 호출: GetBusinessTimeSettings");
        
        try {
            return jdbcTemplate.execute(
                connection -> connection.prepareCall("{CALL GetBusinessTimeSettings()}"),
                (CallableStatementCallback<Map<String, Object>>) cs -> {
                    Map<String, Object> result = new HashMap<>();
                    List<Map<String, Object>> businessHours = new ArrayList<>();
                    List<Map<String, Object>> cancellationPolicy = new ArrayList<>();
                    
                    boolean hasResult = cs.execute();
                    int resultSetIndex = 0;
                    
                    do {
                        if (hasResult) {
                            try (ResultSet rs = cs.getResultSet()) {
                                List<Map<String, Object>> currentList = (resultSetIndex == 0) ? businessHours : cancellationPolicy;
                                
                                while (rs.next()) {
                                    Map<String, Object> row = new HashMap<>();
                                    row.put("codeGroup", rs.getString("code_group"));
                                    row.put("codeValue", rs.getString("code_value"));
                                    row.put("codeLabel", rs.getString("code_label"));
                                    row.put("koreanName", rs.getString("korean_name"));
                                    row.put("settingKey", rs.getString("setting_key"));
                                    row.put("settingValue", rs.getString("setting_value"));
                                    currentList.add(row);
                                }
                                resultSetIndex++;
                            }
                        }
                        hasResult = cs.getMoreResults();
                    } while (hasResult);
                    
                    result.put("businessHours", businessHours);
                    result.put("cancellationPolicy", cancellationPolicy);
                    
                    log.info("✅ 업무 시간 설정 조회 성공: 업무시간 {}개, 취소정책 {}개", 
                            businessHours.size(), cancellationPolicy.size());
                    
                    return result;
                }
            );
        } catch (Exception e) {
            log.error("❌ 업무 시간 설정 조회 실패", e);
            throw new RuntimeException("업무 시간 설정 조회에 실패했습니다: " + e.getMessage(), e);
        }
    }
    
    @Override
    @Transactional
    public boolean updateBusinessTimeSetting(String codeGroup, String codeValue, String newValue) {
        log.info("🕐 PL/SQL 프로시저 호출: UpdateBusinessTimeSetting - {}.{} = {}", codeGroup, codeValue, newValue);
        
        try {
            return jdbcTemplate.execute(
                connection -> connection.prepareCall("{CALL UpdateBusinessTimeSetting(?, ?, ?)}"),
                (CallableStatementCallback<Boolean>) cs -> {
                    cs.setString(1, codeGroup);
                    cs.setString(2, codeValue);
                    cs.setString(3, newValue);
                    
                    cs.execute();
                    
                    log.info("✅ 업무 시간 설정 업데이트 성공: {}.{} = {}", codeGroup, codeValue, newValue);
                    return true;
                }
            );
        } catch (Exception e) {
            log.error("❌ 업무 시간 설정 업데이트 실패: {}.{} = {}", codeGroup, codeValue, newValue, e);
            throw new RuntimeException("업무 시간 설정 업데이트에 실패했습니다: " + e.getMessage(), e);
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> checkTimeConflict(Long consultantId, String date, String startTime, String endTime, Long excludeScheduleId) {
        log.info("🕐 PL/SQL 프로시저 호출: CheckTimeConflict - 상담사: {}, 날짜: {}, 시간: {} - {}", 
                consultantId, date, startTime, endTime);
        
        try {
            return jdbcTemplate.execute(
                connection -> connection.prepareCall("{CALL CheckTimeConflict(?, ?, ?, ?, ?, ?, ?)}"),
                (CallableStatementCallback<Map<String, Object>>) cs -> {
                    cs.setLong(1, consultantId);
                    cs.setString(2, date);
                    cs.setString(3, startTime);
                    cs.setString(4, endTime);
                    cs.setObject(5, excludeScheduleId, Types.BIGINT);
                    cs.registerOutParameter(6, Types.BOOLEAN); // p_has_conflict
                    cs.registerOutParameter(7, Types.VARCHAR); // p_conflict_reason
                    
                    cs.execute();
                    
                    Map<String, Object> result = new HashMap<>();
                    result.put("hasConflict", cs.getBoolean(6));
                    result.put("conflictReason", cs.getString(7));
                    result.put("consultantId", consultantId);
                    result.put("date", date);
                    result.put("startTime", startTime);
                    result.put("endTime", endTime);
                    
                    log.info("✅ 시간 충돌 검사 완료: 충돌={}, 사유={}", 
                            result.get("hasConflict"), result.get("conflictReason"));
                    
                    return result;
                }
            );
        } catch (Exception e) {
            log.error("❌ 시간 충돌 검사 실패: 상담사={}, 날짜={}, 시간={}-{}", 
                    consultantId, date, startTime, endTime, e);
            throw new RuntimeException("시간 충돌 검사에 실패했습니다: " + e.getMessage(), e);
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> executeProcedure(String procedureName, Map<String, Object> parameters) {
        log.info("🕐 일반 프로시저 호출: {} with parameters: {}", procedureName, parameters);
        
        try {
            StringBuilder sql = new StringBuilder("{CALL ").append(procedureName).append("(");
            
            if (parameters != null && !parameters.isEmpty()) {
                for (int i = 0; i < parameters.size(); i++) {
                    if (i > 0) sql.append(", ");
                    sql.append("?");
                }
            }
            
            sql.append(")}");
            
            return jdbcTemplate.execute(
                connection -> connection.prepareCall(sql.toString()),
                (CallableStatementCallback<List<Map<String, Object>>>) cs -> {
                    if (parameters != null && !parameters.isEmpty()) {
                        int index = 1;
                        for (Map.Entry<String, Object> entry : parameters.entrySet()) {
                            cs.setObject(index++, entry.getValue());
                        }
                    }
                    
                    List<Map<String, Object>> results = new ArrayList<>();
                    boolean hasResult = cs.execute();
                    
                    do {
                        if (hasResult) {
                            try (ResultSet rs = cs.getResultSet()) {
                                while (rs.next()) {
                                    Map<String, Object> row = new HashMap<>();
                                    int columnCount = rs.getMetaData().getColumnCount();
                                    
                                    for (int i = 1; i <= columnCount; i++) {
                                        String columnName = rs.getMetaData().getColumnName(i);
                                        row.put(columnName, rs.getObject(i));
                                    }
                                    results.add(row);
                                }
                            }
                        }
                        hasResult = cs.getMoreResults();
                    } while (hasResult);
                    
                    log.info("✅ 프로시저 실행 성공: {} - 결과 {}개", procedureName, results.size());
                    return results;
                }
            );
        } catch (Exception e) {
            log.error("❌ 프로시저 실행 실패: {}", procedureName, e);
            throw new RuntimeException("프로시저 실행에 실패했습니다: " + e.getMessage(), e);
        }
    }
    
    @Override
    @Transactional
    public Map<String, Object> updateMappingInfo(Long mappingId, String newPackageName, 
                                                Double newPackagePrice, Integer newTotalSessions, String updatedBy) {
        log.info("🔄 매핑 정보 수정 프로시저 호출: mappingId={}, packageName={}, price={}, sessions={}, updatedBy={}", 
                mappingId, newPackageName, newPackagePrice, newTotalSessions, updatedBy);
        
        try {
            return jdbcTemplate.execute(
                connection -> connection.prepareCall("{CALL UpdateMappingInfo(?, ?, ?, ?, ?, ?, ?)}"),
                (CallableStatementCallback<Map<String, Object>>) cs -> {
                    cs.setLong(1, mappingId);
                    cs.setString(2, newPackageName);
                    cs.setDouble(3, newPackagePrice);
                    cs.setInt(4, newTotalSessions);
                    cs.setString(5, updatedBy);
                    cs.registerOutParameter(6, Types.BOOLEAN); // p_success
                    cs.registerOutParameter(7, Types.VARCHAR); // p_message
                    
                    cs.execute();
                    
                    Map<String, Object> result = new HashMap<>();
                    result.put("success", cs.getBoolean(6));
                    result.put("message", cs.getString(7));
                    result.put("mappingId", mappingId);
                    result.put("newPackageName", newPackageName);
                    result.put("newPackagePrice", newPackagePrice);
                    result.put("newTotalSessions", newTotalSessions);
                    result.put("updatedBy", updatedBy);
                    
                    log.info("✅ 매핑 정보 수정 완료: success={}, message={}", 
                            result.get("success"), result.get("message"));
                    
                    return result;
                }
            );
        } catch (Exception e) {
            log.error("❌ 매핑 정보 수정 실패: mappingId={}", mappingId, e);
            throw new RuntimeException("매핑 정보 수정에 실패했습니다: " + e.getMessage(), e);
        }
    }
    
    @Override
    @Transactional(readOnly = false)
    public Map<String, Object> checkMappingUpdatePermission(Long mappingId, Long userId, String userRole) {
        log.info("🔍 매핑 수정 권한 확인: mappingId={}, userId={}, userRole={}", 
                mappingId, userId, userRole);
        
        try {
            return jdbcTemplate.execute(
                connection -> connection.prepareCall("{CALL CheckMappingUpdatePermission(?, ?, ?, ?, ?)}"),
                (CallableStatementCallback<Map<String, Object>>) cs -> {
                    cs.setLong(1, mappingId);
                    cs.setLong(2, userId);
                    cs.setString(3, userRole);
                    cs.registerOutParameter(4, Types.BOOLEAN); // p_can_update
                    cs.registerOutParameter(5, Types.VARCHAR); // p_reason
                    
                    cs.execute();
                    
                    Map<String, Object> result = new HashMap<>();
                    result.put("canUpdate", cs.getBoolean(4));
                    result.put("reason", cs.getString(5));
                    result.put("mappingId", mappingId);
                    result.put("userId", userId);
                    result.put("userRole", userRole);
                    
                    log.info("✅ 매핑 수정 권한 확인 완료: canUpdate={}, reason={}", 
                            result.get("canUpdate"), result.get("reason"));
                    
                    return result;
                }
            );
        } catch (Exception e) {
            log.error("❌ 매핑 수정 권한 확인 실패: mappingId={}, userId={}", mappingId, userId, e);
            throw new RuntimeException("매핑 수정 권한 확인에 실패했습니다: " + e.getMessage(), e);
        }
    }
    
    // ==================== 동적 권한 관리 메서드들 ====================
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> checkUserPermission(String roleName, String permissionCode) {
        log.info("🔍 사용자 권한 확인: 역할={}, 권한={}", roleName, permissionCode);
        
        try {
            // 기본적으로 false 반환 (실제 구현은 DynamicPermissionService에서)
            Map<String, Object> result = new HashMap<>();
            result.put("hasPermission", false);
            result.put("roleName", roleName);
            result.put("permissionCode", permissionCode);
            result.put("message", "권한 확인은 DynamicPermissionService를 사용하세요");
            
            return result;
        } catch (Exception e) {
            log.error("❌ 사용자 권한 확인 실패: 역할={}, 권한={}", roleName, permissionCode, e);
            throw new RuntimeException("사용자 권한 확인에 실패했습니다: " + e.getMessage(), e);
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getUserPermissions(String roleName) {
        log.info("🔍 사용자 권한 목록 조회: 역할={}", roleName);
        
        try {
            // 빈 목록 반환 (실제 구현은 DynamicPermissionService에서)
            List<Map<String, Object>> permissions = new ArrayList<>();
            
            log.info("✅ 사용자 권한 목록 조회 완료: 역할={}, 권한 수=0", roleName);
            return permissions;
        } catch (Exception e) {
            log.error("❌ 사용자 권한 목록 조회 실패: 역할={}", roleName, e);
            throw new RuntimeException("사용자 권한 목록 조회에 실패했습니다: " + e.getMessage(), e);
        }
    }
    
    @Override
    @Transactional
    public boolean grantPermission(String roleName, String permissionCode, String grantedBy) {
        log.info("🔑 권한 부여: 역할={}, 권한={}, 부여자={}", roleName, permissionCode, grantedBy);
        
        try {
            // 권한 부여는 DynamicPermissionService에서 처리
            log.warn("⚠️ 권한 부여는 DynamicPermissionService를 사용하세요: 역할={}, 권한={}", roleName, permissionCode);
            return false;
        } catch (Exception e) {
            log.error("❌ 권한 부여 실패: 역할={}, 권한={}", roleName, permissionCode, e);
            throw new RuntimeException("권한 부여에 실패했습니다: " + e.getMessage(), e);
        }
    }
    
    @Override
    @Transactional
    public boolean revokePermission(String roleName, String permissionCode) {
        log.info("🔑 권한 회수: 역할={}, 권한={}", roleName, permissionCode);
        
        try {
            // 권한 회수는 DynamicPermissionService에서 처리
            log.warn("⚠️ 권한 회수는 DynamicPermissionService를 사용하세요: 역할={}, 권한={}", roleName, permissionCode);
            return false;
        } catch (Exception e) {
            log.error("❌ 권한 회수 실패: 역할={}, 권한={}", roleName, permissionCode, e);
            throw new RuntimeException("권한 회수에 실패했습니다: " + e.getMessage(), e);
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAllPermissions() {
        log.info("🔍 모든 권한 조회");
        
        try {
            // 빈 목록 반환 (실제 구현은 DynamicPermissionService에서)
            List<Map<String, Object>> permissions = new ArrayList<>();
            
            log.info("✅ 모든 권한 조회 완료: 권한 수=0");
            return permissions;
        } catch (Exception e) {
            log.error("❌ 모든 권한 조회 실패", e);
            throw new RuntimeException("모든 권한 조회에 실패했습니다: " + e.getMessage(), e);
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getPermissionsByCategory(String category) {
        log.info("🔍 카테고리별 권한 조회: 카테고리={}", category);
        
        try {
            // 빈 목록 반환 (실제 구현은 DynamicPermissionService에서)
            List<Map<String, Object>> permissions = new ArrayList<>();
            
            log.info("✅ 카테고리별 권한 조회 완료: 카테고리={}, 권한 수=0", category);
            return permissions;
        } catch (Exception e) {
            log.error("❌ 카테고리별 권한 조회 실패: 카테고리={}", category, e);
            throw new RuntimeException("카테고리별 권한 조회에 실패했습니다: " + e.getMessage(), e);
        }
    }
}

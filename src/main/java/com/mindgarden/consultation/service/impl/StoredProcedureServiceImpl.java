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
                    
                    boolean result = cs.execute();
                    
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
}

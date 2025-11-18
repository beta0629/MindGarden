package com.coresolution.core.service.impl;

import com.coresolution.core.service.OnboardingApprovalService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.CallableStatement;
import java.sql.Types;
import java.util.HashMap;
import java.util.Map;

/**
 * 온보딩 승인 서비스 구현체
 * PL/SQL 프로시저를 호출하여 온보딩 승인 프로세스 처리
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class OnboardingApprovalServiceImpl implements OnboardingApprovalService {
    
    private final JdbcTemplate jdbcTemplate;
    
    @Override
    public Map<String, Object> processOnboardingApproval(
            Long requestId,
            String tenantId,
            String tenantName,
            String businessType,
            String approvedBy,
            String decisionNote) {
        
        log.info("온보딩 승인 프로세스 시작: requestId={}, tenantId={}, tenantName={}", 
                requestId, tenantId, tenantName);
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            Map<String, Object> procedureResult = jdbcTemplate.call(
                    connection -> {
                        CallableStatement cs = connection.prepareCall(
                                "{CALL ProcessOnboardingApproval(?, ?, ?, ?, ?, ?, ?, ?)}"
                        );
                        cs.setLong(1, requestId);
                        cs.setString(2, tenantId);
                        cs.setString(3, tenantName);
                        cs.setString(4, businessType);
                        cs.setString(5, approvedBy);
                        cs.setString(6, decisionNote);
                        cs.registerOutParameter(7, Types.BOOLEAN);
                        cs.registerOutParameter(8, Types.VARCHAR);
                        return cs;
                    },
                    java.util.Arrays.asList(
                            new org.springframework.jdbc.core.SqlOutParameter("success", Types.BOOLEAN),
                            new org.springframework.jdbc.core.SqlOutParameter("message", Types.VARCHAR)
                    )
            );
            
            Boolean success = (Boolean) procedureResult.get("success");
            String message = (String) procedureResult.get("message");
            
            result.put("success", success != null && success);
            result.put("message", message != null ? message : "알 수 없는 오류");
            
            if (success != null && success) {
                log.info("온보딩 승인 프로세스 완료: {}", message);
            } else {
                log.error("온보딩 승인 프로세스 실패: {}", message);
            }
            
        } catch (Exception e) {
            log.error("온보딩 승인 프로세스 중 오류 발생: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("message", "온보딩 승인 프로세스 중 오류 발생: " + e.getMessage());
        }
        
        return result;
    }
}


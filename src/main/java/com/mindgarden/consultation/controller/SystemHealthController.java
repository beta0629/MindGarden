package com.mindgarden.consultation.controller;

import java.sql.Connection;
import java.util.HashMap;
import java.util.Map;
import javax.sql.DataSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
public class SystemHealthController {

    @Autowired
    private DataSource dataSource;

    @GetMapping("/server")
    public ResponseEntity<Map<String, Object>> checkServerHealth() {
        Map<String, Object> response = new HashMap<>();
        try {
            response.put("status", "healthy");
            response.put("message", "서버가 정상적으로 작동 중입니다");
            response.put("timestamp", System.currentTimeMillis());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", "서버 상태 확인 중 오류 발생: " + e.getMessage());
            response.put("timestamp", System.currentTimeMillis());
            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/database")
    public ResponseEntity<Map<String, Object>> checkDatabaseHealth() {
        Map<String, Object> response = new HashMap<>();
        try (Connection connection = dataSource.getConnection()) {
            if (connection.isValid(5)) {
                response.put("status", "healthy");
                response.put("message", "데이터베이스 연결이 정상입니다");
                response.put("timestamp", System.currentTimeMillis());
                return ResponseEntity.ok(response);
            } else {
                response.put("status", "error");
                response.put("message", "데이터베이스 연결이 유효하지 않습니다");
                response.put("timestamp", System.currentTimeMillis());
                return ResponseEntity.status(500).body(response);
            }
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", "데이터베이스 연결 확인 중 오류 발생: " + e.getMessage());
            response.put("timestamp", System.currentTimeMillis());
            return ResponseEntity.status(500).body(response);
        }
    }
}

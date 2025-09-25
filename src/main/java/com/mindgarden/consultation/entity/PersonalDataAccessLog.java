package com.mindgarden.consultation.entity;

import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 개인정보 접근 로그 엔티티
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Entity
@Table(name = "personal_data_access_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PersonalDataAccessLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * 접근자 ID
     */
    @Column(name = "accessor_id", nullable = false)
    private String accessorId;
    
    /**
     * 접근자 이름
     */
    @Column(name = "accessor_name")
    private String accessorName;
    
    /**
     * 접근한 개인정보 유형
     * - USER_INFO: 사용자 정보
     * - CONSULTATION_RECORD: 상담 기록
     * - PAYMENT_INFO: 결제 정보
     * - SALARY_INFO: 급여 정보
     * - MEDICAL_INFO: 의료 정보
     */
    @Column(name = "data_type", nullable = false)
    private String dataType;
    
    /**
     * 접근 유형
     * - READ: 조회
     * - CREATE: 생성
     * - UPDATE: 수정
     * - DELETE: 삭제
     * - EXPORT: 내보내기
     * - BACKUP: 백업
     */
    @Column(name = "access_type", nullable = false)
    private String accessType;
    
    /**
     * 대상 사용자 ID
     */
    @Column(name = "target_user_id")
    private String targetUserId;
    
    /**
     * 대상 사용자 이름
     */
    @Column(name = "target_user_name")
    private String targetUserName;
    
    /**
     * 접근 시간
     */
    @CreationTimestamp
    @Column(name = "access_time", nullable = false)
    private LocalDateTime accessTime;
    
    /**
     * IP 주소
     */
    @Column(name = "ip_address")
    private String ipAddress;
    
    /**
     * 접근 사유
     */
    @Column(name = "reason", length = 500)
    private String reason;
    
    /**
     * 처리 결과
     * - SUCCESS: 성공
     * - FAILED: 실패
     * - UNAUTHORIZED: 권한 없음
     * - ERROR: 오류
     */
    @Column(name = "result")
    private String result;
    
    /**
     * 오류 메시지
     */
    @Column(name = "error_message", length = 1000)
    private String errorMessage;
    
    /**
     * 접근한 데이터의 식별자
     * (예: 상담 기록 ID, 결제 ID 등)
     */
    @Column(name = "data_identifier")
    private String dataIdentifier;
    
    /**
     * 접근한 데이터의 상세 정보
     */
    @Column(name = "data_details", length = 1000)
    private String dataDetails;
    
    /**
     * 세션 ID
     */
    @Column(name = "session_id")
    private String sessionId;
    
    /**
     * 사용자 에이전트
     */
    @Column(name = "user_agent", length = 500)
    private String userAgent;
    
    /**
     * 추가 메타데이터 (JSON 형태)
     */
    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata;
}

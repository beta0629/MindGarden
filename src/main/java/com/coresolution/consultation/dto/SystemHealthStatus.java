package com.coresolution.consultation.dto;

import java.time.LocalDateTime;

/**
 * 시스템 헬스 상태 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-05
 */
public class SystemHealthStatus {
    private LocalDateTime timestamp;
    private String overallStatus; // HEALTHY, UNHEALTHY, WARNING
    private String databaseStatus;
    private String userServiceStatus;
    private String consultantServiceStatus;
    private String clientServiceStatus;
    private String scheduleServiceStatus;
    private String paymentServiceStatus;
    private String encryptionServiceStatus;
    private long userCount;
    private String message;

    public SystemHealthStatus() {
        this.timestamp = LocalDateTime.now();
    }

    // Getters and Setters
    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getOverallStatus() {
        return overallStatus;
    }

    public void setOverallStatus(String overallStatus) {
        this.overallStatus = overallStatus;
    }

    public String getDatabaseStatus() {
        return databaseStatus;
    }

    public void setDatabaseStatus(String databaseStatus) {
        this.databaseStatus = databaseStatus;
    }

    public String getUserServiceStatus() {
        return userServiceStatus;
    }

    public void setUserServiceStatus(String userServiceStatus) {
        this.userServiceStatus = userServiceStatus;
    }

    public String getConsultantServiceStatus() {
        return consultantServiceStatus;
    }

    public void setConsultantServiceStatus(String consultantServiceStatus) {
        this.consultantServiceStatus = consultantServiceStatus;
    }

    public String getClientServiceStatus() {
        return clientServiceStatus;
    }

    public void setClientServiceStatus(String clientServiceStatus) {
        this.clientServiceStatus = clientServiceStatus;
    }

    public String getScheduleServiceStatus() {
        return scheduleServiceStatus;
    }

    public void setScheduleServiceStatus(String scheduleServiceStatus) {
        this.scheduleServiceStatus = scheduleServiceStatus;
    }

    public String getPaymentServiceStatus() {
        return paymentServiceStatus;
    }

    public void setPaymentServiceStatus(String paymentServiceStatus) {
        this.paymentServiceStatus = paymentServiceStatus;
    }

    public String getEncryptionServiceStatus() {
        return encryptionServiceStatus;
    }

    public void setEncryptionServiceStatus(String encryptionServiceStatus) {
        this.encryptionServiceStatus = encryptionServiceStatus;
    }

    public long getUserCount() {
        return userCount;
    }

    public void setUserCount(long userCount) {
        this.userCount = userCount;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}

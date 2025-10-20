package com.mindgarden.consultation.entity;

import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * 시스템 공지사항 엔티티
 * 관리자가 전체 사용자, 상담사, 내담자에게 보내는 공지사항
 */
@Entity
@Table(name = "system_notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class SystemNotification extends BaseEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * 공지 대상 유형
     * ALL: 전체 사용자
     * CONSULTANT: 상담사만
     * CLIENT: 내담자만
     */
    @NotNull(message = "공지 대상 유형은 필수입니다.")
    @Column(name = "target_type", nullable = false, length = 20)
    private String targetType;
    
    /**
     * 공지 제목
     */
    @NotNull(message = "공지 제목은 필수입니다.")
    @Size(max = 200, message = "공지 제목은 200자 이하여야 합니다.")
    @Column(name = "title", nullable = false, length = 200)
    private String title;
    
    /**
     * 공지 내용
     */
    @NotNull(message = "공지 내용은 필수입니다.")
    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;
    
    /**
     * 공지 타입
     * GENERAL: 일반 공지
     * IMPORTANT: 중요 공지
     * URGENT: 긴급 공지
     * MAINTENANCE: 시스템 점검
     * UPDATE: 업데이트 안내
     */
    @Column(name = "notification_type", length = 50)
    private String notificationType = "GENERAL";
    
    /**
     * 중요 공지 여부
     */
    @Column(name = "is_important")
    private Boolean isImportant = false;
    
    /**
     * 긴급 공지 여부
     */
    @Column(name = "is_urgent")
    private Boolean isUrgent = false;
    
    /**
     * 공지 상태
     * DRAFT: 임시 저장
     * PUBLISHED: 게시됨
     * ARCHIVED: 보관됨
     */
    @Column(name = "status", length = 20)
    private String status = "DRAFT";
    
    /**
     * 작성자 ID (관리자)
     */
    @NotNull(message = "작성자 ID는 필수입니다.")
    @Column(name = "author_id", nullable = false)
    private Long authorId;
    
    /**
     * 작성자 이름
     */
    @Column(name = "author_name", length = 100)
    private String authorName;
    
    /**
     * 게시 시작 일시
     */
    @Column(name = "published_at")
    private LocalDateTime publishedAt;
    
    /**
     * 게시 종료 일시 (선택)
     */
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;
    
    /**
     * 삭제 여부
     */
    @Column(name = "is_deleted")
    private Boolean isDeleted = false;
    
    /**
     * 삭제 일시
     */
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
    
    /**
     * 조회수
     */
    @Column(name = "view_count")
    private Integer viewCount = 0;
    
    /**
     * 공지 게시
     */
    public void publish() {
        this.status = "PUBLISHED";
        this.publishedAt = LocalDateTime.now();
    }
    
    /**
     * 공지 보관
     */
    public void archive() {
        this.status = "ARCHIVED";
    }
    
    /**
     * 공지 삭제
     */
    public void delete() {
        this.isDeleted = true;
        this.deletedAt = LocalDateTime.now();
    }
    
    /**
     * 조회수 증가
     */
    public void incrementViewCount() {
        this.viewCount++;
    }
    
    /**
     * 공지가 유효한지 확인 (게시 기간 내인지)
     */
    public boolean isValid() {
        LocalDateTime now = LocalDateTime.now();
        
        // 게시되지 않은 공지는 유효하지 않음
        if (!"PUBLISHED".equals(this.status)) {
            return false;
        }
        
        // 게시 시작 시간 체크
        if (this.publishedAt != null && now.isBefore(this.publishedAt)) {
            return false;
        }
        
        // 게시 종료 시간 체크
        if (this.expiresAt != null && now.isAfter(this.expiresAt)) {
            return false;
        }
        
        return !this.isDeleted;
    }
}


package com.mindgarden.consultation.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 상담 노트 엔티티
 * 상담에 대한 노트 및 메모 정보를 저장
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-05
 */
@Entity
@Table(name = "notes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Note {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "consultation_id", nullable = false)
    private Long consultationId;
    
    @Column(name = "author_id", nullable = false)
    private String authorId;
    
    @Column(name = "author_type", nullable = false)
    private String authorType; // CONSULTANT, ADMIN, CLIENT
    
    @Column(name = "note_text", columnDefinition = "TEXT", nullable = false)
    private String noteText;
    
    @Column(name = "note_type")
    private String noteType; // CONSULTATION, PREPARATION, FOLLOW_UP, EMERGENCY
    
    @Column(name = "is_private")
    private Boolean isPrivate = false;
    
    @Column(name = "is_important")
    private Boolean isImportant = false;
    
    @Column(name = "is_deleted")
    private Boolean isDeleted = false;
    
    @Column(name = "created_at")
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    @UpdateTimestamp
    private LocalDateTime updatedAt;
    
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
    
    @Column(name = "version")
    private Long version = 1L;
    
    // 연관관계 매핑
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consultation_id", insertable = false, updatable = false)
    private Consultation consultation;
    
    // 비즈니스 메서드
    public void softDelete() {
        this.isDeleted = true;
        this.deletedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.version++;
    }
    
    public void restore() {
        this.isDeleted = false;
        this.deletedAt = null;
        this.updatedAt = LocalDateTime.now();
        this.version++;
    }
    
    public void updateNote(String noteText) {
        this.noteText = noteText;
        this.updatedAt = LocalDateTime.now();
        this.version++;
    }
    
    public void markAsImportant() {
        this.isImportant = true;
        this.updatedAt = LocalDateTime.now();
        this.version++;
    }
    
    public void unmarkAsImportant() {
        this.isImportant = false;
        this.updatedAt = LocalDateTime.now();
        this.version++;
    }
}

import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../constants/api';
import { useSession } from '../../contexts/SessionContext';
import csrfTokenManager from '../../utils/csrfTokenManager';
import notificationManager from '../../utils/notification';

/**
 * 상담사 하트 평가 모달 컴포넌트
 * - 내담자가 상담 후 상담사에게 하트 점수 부여
 * - 1-5 하트 점수 시스템
 * - 평가 태그 및 코멘트 지원
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-17
 */
const ConsultantRatingModal = ({ isOpen, onClose, schedule, onRatingComplete }) => {
    const { user } = useSession();
    const [heartScore, setHeartScore] = useState(0);
    const [hoveredScore, setHoveredScore] = useState(0);
    const [comment, setComment] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 평가 태그 옵션
    const ratingTags = [
        '친절해요', '전문적이에요', '도움이 되었어요', '경청을 잘해요',
        '이해하기 쉬워요', '신뢰가 가요', '편안해요', '따뜻해요',
        '시간을 잘 지켜요', '적극적이에요'
    ];

    useEffect(() => {
        if (isOpen) {
            // 모달이 열릴 때 상태 초기화
            setHeartScore(0);
            setHoveredScore(0);
            setComment('');
            setSelectedTags([]);
            setIsAnonymous(false);
        }
    }, [isOpen]);

    const handleTagToggle = (tag) => {
        setSelectedTags(prev => 
            prev.includes(tag) 
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    const handleSubmit = async () => {
        if (heartScore === 0) {
            notificationManager.show('하트 점수를 선택해주세요.', 'info');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await csrfTokenManager.post(`${API_BASE_URL}/api/ratings/create`, {
                scheduleId: schedule.scheduleId,
                clientId: user.id,
                heartScore: heartScore,
                comment: comment.trim() || null,
                ratingTags: selectedTags,
                isAnonymous: isAnonymous
            });

            const result = await response.json();

            if (result.success) {
                notificationManager.show('상담사 평가가 완료되었습니다. 감사합니다!', 'info');
                onRatingComplete && onRatingComplete(result.data);
                onClose();
            } else {
                notificationManager.show(result.message || '평가 등록에 실패했습니다.', 'error');
            }

        } catch (error) {
            console.error('평가 등록 오류:', error);
            notificationManager.show('평가 등록 중 오류가 발생했습니다.', 'info');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen || !schedule) {
        return null;
    }

    return (
        <>
            {/* 배경 오버레이 */}
            <div className="consultant-rating-modal-overlay"
                onClick={onClose}
            >
                {/* 모달 컨테이너 */}
                <div
                    style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '16px',
                        padding: '32px',
                        width: '500px',
                        maxWidth: '90vw',
                        maxHeight: '80vh',
                        overflowY: 'auto',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
                        fontFamily: "'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', sans-serif"
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* 헤더 */}
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <h2 style={{
                            fontSize: 'var(--font-size-xl)',
                            fontWeight: '600',
                            color: '#333',
                            marginBottom: '8px'
                        }}>
                            상담사 평가
                        </h2>
                        <p style={{
                            fontSize: 'var(--font-size-sm)',
                            color: '#666',
                            margin: 0
                        }}>
                            {schedule.consultantName}님과의 상담은 어떠셨나요?
                        </p>
                    </div>

                    {/* 상담 정보 */}
                    <div style={{
                        backgroundColor: '#f8f9fa',
                        padding: '16px',
                        borderRadius: '8px',
                        marginBottom: '24px'
                    }}>
                        <div style={{ fontSize: 'var(--font-size-sm)', color: '#495057', marginBottom: '4px' }}>
                            📅 상담일: {schedule.consultationDate} {schedule.consultationTime}
                        </div>
                        <div style={{ fontSize: 'var(--font-size-sm)', color: '#495057', marginBottom: '4px' }}>
                            👩‍⚕️ 상담사: {schedule.consultantName}님
                        </div>
                        <div style={{ fontSize: 'var(--font-size-sm)', color: '#495057' }}>
                            💼 상담 유형: {schedule.consultationType}
                        </div>
                    </div>

                    {/* 하트 점수 선택 */}
                    <div style={{ marginBottom: '24px' }}>
                        <h3 style={{
                            fontSize: 'var(--font-size-base)',
                            fontWeight: '600',
                            color: '#333',
                            marginBottom: '12px'
                        }}>
                            만족도를 하트로 표현해주세요
                        </h3>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '8px',
                            marginBottom: '8px'
                        }}>
                            {[1, 2, 3, 4, 5].map(score => (
                                <button
                                    key={score}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        fontSize: 'var(--font-size-xxxl)',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        transition: 'transform 0.2s ease',
                                        transform: (hoveredScore >= score || heartScore >= score) ? 'scale(1.1)' : 'scale(1)'
                                    }}
                                    onMouseEnter={() => setHoveredScore(score)}
                                    onMouseLeave={() => setHoveredScore(0)}
                                    onClick={() => setHeartScore(score)}
                                >
                                    {(hoveredScore >= score || heartScore >= score) ? '💖' : '🤍'}
                                </button>
                            ))}
                        </div>
                        <div style={{
                            textAlign: 'center',
                            fontSize: 'var(--font-size-sm)',
                            color: '#6c757d'
                        }}>
                            {heartScore > 0 && `${heartScore}개의 하트를 선택하셨습니다`}
                        </div>
                    </div>

                    {/* 평가 태그 */}
                    <div style={{ marginBottom: '24px' }}>
                        <h3 style={{
                            fontSize: 'var(--font-size-base)',
                            fontWeight: '600',
                            color: '#333',
                            marginBottom: '12px'
                        }}>
                            어떤 점이 좋았나요? (선택사항)
                        </h3>
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '8px'
                        }}>
                            {ratingTags.map(tag => (
                                <button
                                    key={tag}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: '20px',
                                        border: selectedTags.includes(tag) ? '2px solid #007bff' : '1px solid #dee2e6',
                                        backgroundColor: selectedTags.includes(tag) ? '#e7f3ff' : '#ffffff',
                                        color: selectedTags.includes(tag) ? '#007bff' : '#495057',
                                        fontSize: 'var(--font-size-sm)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onClick={() => handleTagToggle(tag)}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 코멘트 */}
                    <div style={{ marginBottom: '24px' }}>
                        <h3 style={{
                            fontSize: 'var(--font-size-base)',
                            fontWeight: '600',
                            color: '#333',
                            marginBottom: '12px'
                        }}>
                            추가 의견 (선택사항)
                        </h3>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="상담사님께 전하고 싶은 말씀이 있으시면 적어주세요..."
                            style={{
                                width: '100%',
                                height: '80px',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #dee2e6',
                                fontSize: 'var(--font-size-sm)',
                                fontFamily: "'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', sans-serif",
                                resize: 'none',
                                outline: 'none'
                            }}
                            maxLength={500}
                        />
                        <div style={{
                            textAlign: 'right',
                            fontSize: 'var(--font-size-xs)',
                            color: '#6c757d',
                            marginTop: '4px'
                        }}>
                            {comment.length}/500
                        </div>
                    </div>

                    {/* 익명 옵션 */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            fontSize: 'var(--font-size-sm)',
                            color: '#495057'
                        }}>
                            <input
                                type="checkbox"
                                checked={isAnonymous}
                                onChange={(e) => setIsAnonymous(e.target.checked)}
                                style={{ marginRight: '8px' }}
                            />
                            익명으로 평가하기
                        </label>
                    </div>

                    {/* 버튼 */}
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        justifyContent: 'flex-end'
                    }}>
                        <button
                            onClick={onClose}
                            disabled={isSubmitting}
                            style={{
                                padding: '12px 24px',
                                borderRadius: '8px',
                                border: '1px solid #dee2e6',
                                backgroundColor: '#ffffff',
                                color: '#495057',
                                fontSize: 'var(--font-size-sm)',
                                fontWeight: '500',
                                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                opacity: isSubmitting ? 0.6 : 1
                            }}
                        >
                            취소
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={heartScore === 0 || isSubmitting}
                            style={{
                                padding: '12px 24px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: heartScore === 0 ? '#dee2e6' : '#007bff',
                                color: heartScore === 0 ? '#6c757d' : '#ffffff',
                                fontSize: 'var(--font-size-sm)',
                                fontWeight: '500',
                                cursor: (heartScore === 0 || isSubmitting) ? 'not-allowed' : 'pointer',
                                opacity: isSubmitting ? 0.6 : 1
                            }}
                        >
                            {isSubmitting ? '평가 중...' : '평가 완료'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ConsultantRatingModal;

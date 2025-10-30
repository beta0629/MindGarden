import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import UnifiedLoading from '../common/UnifiedLoading';
import { Heart, XCircle, CheckCircle, Calendar, User, Briefcase } from 'lucide-react';
import { API_BASE_URL } from '../../constants/api';
import { useSession } from '../../contexts/SessionContext';
import csrfTokenManager from '../../utils/csrfTokenManager';
import notificationManager from '../../utils/notification';
import '../../styles/mindgarden-design-system.css';

/**
 * 상담사 하트 평가 모달 컴포넌트
 * - 내담자가 상담 후 상담사에게 하트 점수 부여
 * - 1-5 하트 점수 시스템
 * - 평가 태그 및 코멘트 지원
 * - 디자인 시스템 v2.0 적용
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-10-27
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
            setIsSubmitting(false);
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

    const isSubmitDisabled = heartScore === 0 || isSubmitting;
    
    const portalTarget = document.body || document.createElement('div');

    return ReactDOM.createPortal(
        <div className="mg-v2-modal-overlay" onClick={onClose}>
            <div className="mg-v2-modal mg-v2-modal-medium" onClick={(e) => e.stopPropagation()}>
                {/* 헤더 */}
                <div className="mg-v2-modal-header">
                    <div className="mg-v2-modal-title-wrapper">
                        <Heart size={28} className="mg-v2-modal-title-icon" />
                        <div>
                            <h2 className="mg-v2-modal-title">상담사 평가</h2>
                            <p className="mg-v2-modal-subtitle">{schedule.consultantName}님과의 상담은 어떠셨나요?</p>
                        </div>
                    </div>
                    <button className="mg-v2-modal-close" onClick={onClose} aria-label="닫기">
                        <XCircle size={24} />
                    </button>
                </div>

                <div className="mg-v2-modal-body">
                    {/* 상담 정보 */}
                    <div className="mg-v2-info-box mg-v2-mb-lg">
                        <div className="mg-v2-info-grid">
                            <div className="mg-v2-info-item">
                                <Calendar size={16} className="mg-v2-icon-inline" />
                                <span className="mg-v2-info-label">상담일:</span>
                                <span className="mg-v2-info-value">{schedule.consultationDate} {schedule.consultationTime}</span>
                            </div>
                            <div className="mg-v2-info-item">
                                <User size={16} className="mg-v2-icon-inline" />
                                <span className="mg-v2-info-label">상담사:</span>
                                <span className="mg-v2-info-value">{schedule.consultantName}님</span>
                            </div>
                            <div className="mg-v2-info-item">
                                <Briefcase size={16} className="mg-v2-icon-inline" />
                                <span className="mg-v2-info-label">상담 유형:</span>
                                <span className="mg-v2-info-value">{schedule.consultationType}</span>
                            </div>
                        </div>
                    </div>

                    {/* 하트 점수 선택 */}
                    <div className="mg-v2-form-group">
                        <label className="mg-v2-form-label">
                            <Heart size={20} className="mg-v2-form-label-icon" />
                            만족도를 하트로 표현해주세요 <span className="mg-v2-form-label-required">*</span>
                        </label>
                        <div className="mg-v2-heart-rating">
                            {[1, 2, 3, 4, 5].map(score => (
                                <button
                                    key={score}
                                    type="button"
                                    className={`mg-v2-heart-btn ${(hoveredScore >= score || heartScore >= score) ? 'mg-v2-heart-btn--active' : ''}`}
                                    onMouseEnter={() => setHoveredScore(score)}
                                    onMouseLeave={() => setHoveredScore(0)}
                                    onClick={() => setHeartScore(score)}
                                >
                                    {(hoveredScore >= score || heartScore >= score) ? '💖' : '🤍'}
                                </button>
                            ))}
                        </div>
                        {heartScore > 0 && (
                            <div className="mg-v2-text-center mg-v2-text-sm mg-v2-color-text-secondary mg-v2-mt-xs">
                                {heartScore}개의 하트를 선택하셨습니다
                            </div>
                        )}
                    </div>

                    {/* 평가 태그 */}
                    <div className="mg-v2-form-group">
                        <label className="mg-v2-form-label">어떤 점이 좋았나요? (선택사항)</label>
                        <div className="mg-v2-tag-group">
                            {ratingTags.map(tag => (
                                <button
                                    key={tag}
                                    type="button"
                                    className={`mg-v2-tag ${selectedTags.includes(tag) ? 'mg-v2-tag--selected' : ''}`}
                                    onClick={() => handleTagToggle(tag)}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 코멘트 */}
                    <div className="mg-v2-form-group">
                        <label className="mg-v2-form-label">추가 의견 (선택사항)</label>
                        <textarea
                            className="mg-v2-form-textarea"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="상담사님께 전하고 싶은 말씀이 있으시면 적어주세요..."
                            rows="4"
                            maxLength={500}
                        />
                        <div className="mg-v2-text-right mg-v2-text-xs mg-v2-color-text-secondary mg-v2-mt-xs">
                            {comment.length}/500
                        </div>
                    </div>

                    {/* 익명 옵션 */}
                    <div className="mg-v2-form-group">
                        <label className="mg-v2-form-checkbox">
                            <input
                                type="checkbox"
                                checked={isAnonymous}
                                onChange={(e) => setIsAnonymous(e.target.checked)}
                            />
                            익명으로 평가하기
                        </label>
                    </div>
                </div>

                {/* 푸터 */}
                <div className="mg-v2-modal-footer">
                    <button 
                        className="mg-v2-button mg-v2-button--secondary" 
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        <XCircle size={20} className="mg-v2-icon-inline" />
                        취소
                    </button>
                    <button 
                        className="mg-v2-button mg-v2-button--primary" 
                        onClick={handleSubmit}
                        disabled={isSubmitDisabled}
                    >
                        {isSubmitting ? (
                            <UnifiedLoading variant="dots" size="small" type="inline" />
                        ) : (
                            <>
                                <CheckCircle size={20} className="mg-v2-icon-inline" />
                                평가 완료
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        portalTarget
    );
};

export default ConsultantRatingModal;

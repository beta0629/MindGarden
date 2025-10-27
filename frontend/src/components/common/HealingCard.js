import React, { useState, useEffect } from 'react';
import { apiGet } from '../../utils/ajax';
import './HealingCard.css';

/**
 * 오늘의 힐링 카드 컴포넌트
 * GPT로 생성된 힐링 컨텐츠를 표시
 */
const HealingCard = ({ userRole = 'CLIENT', category = null }) => {
    const [healingData, setHealingData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 대상 역할 설정 (상담사/내담자에 따라)
    const targetRole = userRole === 'CONSULTANT' ? 'CONSULTANT' : 'CLIENT';

    useEffect(() => {
        fetchHealingData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userRole, category]);

    const fetchHealingData = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams();
            if (category) params.append('category', category);
            if (targetRole) params.append('userRole', targetRole);

            const response = await apiGet(`/api/healing/content?${params}`);

            if (response.success) {
                setHealingData(response.data);
            } else {
                setError(response.message || '힐링 컨텐츠를 불러오는데 실패했습니다.');
            }
        } catch (err) {
            console.error('힐링 컨텐츠 로딩 오류:', err);
            setError('서버와의 통신 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams();
            if (category) params.append('category', category);
            if (targetRole) params.append('userRole', targetRole);

            const response = await apiGet(`/api/healing/refresh?${params}`);

            if (response.success) {
                setHealingData(response.data);
            } else {
                setError(response.message || '새로운 힐링 컨텐츠를 불러오는데 실패했습니다.');
            }
        } catch (err) {
            console.error('힐링 컨텐츠 새로고침 오류:', err);
            setError('서버와의 통신 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="healing-card-wrapper">
                <div className="mg-card">
                    <div className="mg-card__content">
                        <div className="mg-loading">
                            <div className="mg-spinner"></div>
                            <p>힐링 컨텐츠를 불러오는 중...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="healing-card-wrapper">
                <div className="mg-card">
                    <div className="mg-card__content">
                        <div className="mg-error">
                            <p>{error}</p>
                            <button onClick={handleRefresh} className="mg-button mg-button--primary mg-button--sm">
                                다시 시도
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="healing-card-wrapper">
            <div className="mg-card">
                <div className="mg-card__header">
                    <div className="mg-card__title">
                        {healingData?.emoji && <span className="healing-emoji">{healingData.emoji}</span>}
                        {healingData?.title || '오늘의 힐링'}
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="mg-button mg-button--ghost mg-button--sm"
                        title="새로운 메시지 보기"
                        disabled={loading}
                    >
                        {loading ? '⏳' : '🔄'}
                    </button>
                </div>

                <div className="mg-card__content">
                    <div 
                        className="healing-content"
                        dangerouslySetInnerHTML={{
                            __html: healingData?.content || '마음의 평화를 찾는 하루가 되시길 바랍니다. 💚'
                        }}
                    />
                    {healingData?.category && (
                        <div className="healing-category">
                            <span className="mg-badge mg-badge--primary">
                                {healingData.category === 'HUMOR' && '유머'}
                                {healingData.category === 'WARM_WORDS' && '따뜻한 말'}
                                {healingData.category === 'MEDITATION' && '명상'}
                                {healingData.category === 'MOTIVATION' && '격려'}
                                {healingData.category === 'GENERAL' && '힐링'}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HealingCard;

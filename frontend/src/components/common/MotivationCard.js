import React, { useState, useEffect } from 'react';
import './MotivationCard.css';

/**
 * 동기부여 카드 컴포넌트
 * 오늘의 유머와 따뜻한 말을 표시
 */
const MotivationCard = ({ userRole = 'CLIENT', category = null }) => {
    const [motivationData, setMotivationData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 대상 역할 설정 (상담사/내담자에 따라)
    const targetRole = userRole === 'CONSULTANT' ? 'CONSULTANT' : 'CLIENT';

    useEffect(() => {
        fetchMotivationData();
    }, [userRole, category]);

    const fetchMotivationData = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams();
            if (category) params.append('category', category);
            if (targetRole) params.append('targetRole', targetRole);

            const response = await fetch(`/api/motivation/motivation?${params}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();

            if (result.success) {
                setMotivationData(result.data);
            } else {
                setError(result.message || '동기부여 메시지를 불러오는데 실패했습니다.');
            }
        } catch (err) {
            console.error('동기부여 데이터 로딩 오류:', err);
            setError('서버와의 통신 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        fetchMotivationData();
    };

    if (loading) {
        return (
            <div className="motivation-card">
                <div className="motivation-card__loading">
                    <div className="loading-spinner"></div>
                    <p>동기부여 메시지를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="motivation-card">
                <div className="motivation-card__error">
                    <p>{error}</p>
                    <button onClick={handleRefresh} className="retry-button">
                        다시 시도
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="motivation-card">
            <div className="motivation-card__header">
                <h3>오늘의 힐링</h3>
                <button 
                    onClick={handleRefresh} 
                    className="refresh-button"
                    title="새로운 메시지 보기"
                >
                    🔄
                </button>
            </div>

            <div className="motivation-card__content">
                {/* 오늘의 유머 */}
                <div className="motivation-item humor-item">
                    <div className="motivation-item__icon">😊</div>
                    <div className="motivation-item__content">
                        <h4>오늘의 유머</h4>
                        <p>{motivationData?.humor?.content || '오늘도 힘내세요! 😊'}</p>
                    </div>
                </div>

                {/* 따뜻한 말 한마디 */}
                <div className="motivation-item warm-words-item">
                    <div className="motivation-item__icon">💙</div>
                    <div className="motivation-item__content">
                        <h4>따뜻한 말 한마디</h4>
                        <p>{motivationData?.warmWords?.content || '당신의 마음이 소중합니다 💙'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MotivationCard;

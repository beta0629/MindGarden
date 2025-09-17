import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../constants/api';

/**
 * 관리자용 상담사 평가 통계 컴포넌트
 * - 전체 상담사 평가 현황 표시
 * - 평균 점수 랭킹 및 통계
 * - 최근 평가 동향 분석
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-17
 */
const ConsultantRatingStatistics = () => {
    const [loading, setLoading] = useState(true);
    const [statistics, setStatistics] = useState({
        totalRatings: 0,
        averageScore: 0,
        topConsultants: [],
        recentTrends: []
    });

    useEffect(() => {
        loadRatingStatistics();
    }, []);

    const loadRatingStatistics = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/consultant-rating-stats`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setStatistics(result.data);
                }
            }

        } catch (error) {
            console.error('평가 통계 조회 오류:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                marginBottom: '24px'
            }}>
                <div style={{ textAlign: 'center', color: '#666' }}>
                    평가 통계를 불러오는 중...
                </div>
            </div>
        );
    }

    return (
        <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            marginBottom: '24px',
            fontFamily: "'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', sans-serif"
        }}>
            {/* 섹션 헤더 */}
            <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#333',
                    margin: 0,
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    💖 상담사 평가 통계
                </h3>
                <p style={{
                    fontSize: '14px',
                    color: '#666',
                    margin: 0
                }}>
                    전체 상담사 평가 현황 및 만족도 지표
                </p>
            </div>

            {/* 전체 통계 요약 */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
            }}>
                <div style={{
                    backgroundColor: '#f8f9fa',
                    padding: '16px',
                    borderRadius: '8px',
                    textAlign: 'center'
                }}>
                    <div style={{
                        fontSize: '24px',
                        fontWeight: '700',
                        color: '#e91e63',
                        marginBottom: '4px'
                    }}>
                        {statistics.totalRatings}개
                    </div>
                    <div style={{
                        fontSize: '14px',
                        color: '#666'
                    }}>
                        총 평가 수
                    </div>
                </div>

                <div style={{
                    backgroundColor: '#f8f9fa',
                    padding: '16px',
                    borderRadius: '8px',
                    textAlign: 'center'
                }}>
                    <div style={{
                        fontSize: '24px',
                        fontWeight: '700',
                        color: '#ff6b6b',
                        marginBottom: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                    }}>
                        💖 {statistics.averageScore.toFixed(1)}
                    </div>
                    <div style={{
                        fontSize: '14px',
                        color: '#666'
                    }}>
                        전체 평균 점수
                    </div>
                </div>

                <div style={{
                    backgroundColor: '#f8f9fa',
                    padding: '16px',
                    borderRadius: '8px',
                    textAlign: 'center'
                }}>
                    <div style={{
                        fontSize: '24px',
                        fontWeight: '700',
                        color: '#4caf50',
                        marginBottom: '4px'
                    }}>
                        {statistics.topConsultants.length}명
                    </div>
                    <div style={{
                        fontSize: '14px',
                        color: '#666'
                    }}>
                        평가받은 상담사
                    </div>
                </div>
            </div>

            {/* 상담사 랭킹 */}
            <div style={{ marginBottom: '24px' }}>
                <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#333',
                    marginBottom: '12px'
                }}>
                    🏆 상담사 평가 랭킹 (TOP 5)
                </h4>
                
                {statistics.topConsultants.length > 0 ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                    }}>
                        {statistics.topConsultants.slice(0, 5).map((consultant, index) => (
                            <div key={consultant.consultantId} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px 16px',
                                backgroundColor: index === 0 ? '#fff3e0' : '#f8f9fa',
                                borderRadius: '8px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        backgroundColor: index === 0 ? '#ff9800' : index === 1 ? '#9e9e9e' : index === 2 ? '#795548' : '#e0e0e0',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '12px',
                                        fontWeight: '600'
                                    }}>
                                        {index + 1}
                                    </div>
                                    <div>
                                        <div style={{
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            color: '#333'
                                        }}>
                                            {consultant.consultantName}
                                        </div>
                                        <div style={{
                                            fontSize: '12px',
                                            color: '#666'
                                        }}>
                                            총 {consultant.totalRatingCount}개 평가
                                        </div>
                                    </div>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    <span style={{
                                        fontSize: '16px',
                                        fontWeight: '700',
                                        color: '#e91e63'
                                    }}>
                                        💖 {consultant.averageHeartScore}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{
                        textAlign: 'center',
                        padding: '32px',
                        color: '#666',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px'
                    }}>
                        아직 평가받은 상담사가 없습니다
                    </div>
                )}
            </div>

            {/* 최근 평가 동향 */}
            <div>
                <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#333',
                    marginBottom: '12px'
                }}>
                    📈 최근 평가 동향 (7일)
                </h4>
                
                {statistics.recentTrends.length > 0 ? (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        gap: '4px',
                        marginBottom: '12px'
                    }}>
                        {statistics.recentTrends.map((trend, index) => (
                            <div key={index} style={{
                                textAlign: 'center',
                                padding: '8px 4px'
                            }}>
                                <div style={{
                                    fontSize: '12px',
                                    color: '#666',
                                    marginBottom: '4px'
                                }}>
                                    {trend.date}
                                </div>
                                <div style={{
                                    height: `${Math.max(20, trend.count * 10)}px`,
                                    backgroundColor: trend.count > 0 ? '#e91e63' : '#e0e0e0',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'end',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '10px',
                                    fontWeight: '600'
                                }}>
                                    {trend.count > 0 ? trend.count : ''}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{
                        textAlign: 'center',
                        padding: '20px',
                        color: '#666',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px'
                    }}>
                        최근 7일간 평가 데이터가 없습니다
                    </div>
                )}
            </div>

            {/* 새로고침 버튼 */}
            <div style={{
                textAlign: 'right',
                marginTop: '16px'
            }}>
                <button
                    onClick={loadRatingStatistics}
                    style={{
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#0056b3'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#007bff'}
                >
                    🔄 새로고침
                </button>
            </div>
        </div>
    );
};

export default ConsultantRatingStatistics;

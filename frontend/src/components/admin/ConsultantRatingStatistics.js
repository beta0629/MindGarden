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
            <div className="consultant-rating-statistics-container">
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
                    fontSize: 'var(--font-size-xl)',
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
                    fontSize: 'var(--font-size-sm)',
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
                        fontSize: 'var(--font-size-xxl)',
                        fontWeight: '700',
                        color: '#e91e63',
                        marginBottom: '4px'
                    }}>
                        {statistics.totalRatings}개
                    </div>
                    <div style={{
                        fontSize: 'var(--font-size-sm)',
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
                        fontSize: 'var(--font-size-xxl)',
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
                        fontSize: 'var(--font-size-sm)',
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
                        fontSize: 'var(--font-size-xxl)',
                        fontWeight: '700',
                        color: '#4caf50',
                        marginBottom: '4px'
                    }}>
                        {statistics.topConsultants.length}명
                    </div>
                    <div style={{
                        fontSize: 'var(--font-size-sm)',
                        color: '#666'
                    }}>
                        평가받은 상담사
                    </div>
                </div>
            </div>

            {/* 상담사별 평가 상세 정보 */}
            <div style={{ marginBottom: '24px' }}>
                <h4 style={{
                    fontSize: 'var(--font-size-base)',
                    fontWeight: '600',
                    color: '#333',
                    marginBottom: '16px'
                }}>
                    👥 상담사별 평가 현황
                </h4>
                
                {statistics.topConsultants.length > 0 ? (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '16px'
                    }}>
                        {statistics.topConsultants.map((consultant, index) => {
                            const avgScore = consultant.averageScore || consultant.averageHeartScore || 0;
                            const ratingCount = consultant.ratingCount || consultant.totalRatingCount || 0;
                            
                            return (
                                <div key={consultant.consultantId || consultant.id} style={{
                                    backgroundColor: index === 0 ? '#fff3e0' : '#f8f9fa',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    position: 'relative',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                }}>
                                    {/* 랭킹 배지 */}
                                    <div style={{
                                        position: 'absolute',
                                        top: '-10px',
                                        left: '16px',
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        backgroundColor: index === 0 ? '#ff9800' : index === 1 ? '#9e9e9e' : index === 2 ? '#795548' : '#2196f3',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '14px',
                                        fontWeight: '700',
                                        border: '3px solid white',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                    }}>
                                        {index + 1}
                                    </div>

                                    {/* 상담사 정보 */}
                                    <div style={{ marginBottom: '16px', marginTop: '8px' }}>
                                        <div style={{
                                            fontSize: '18px',
                                            fontWeight: '700',
                                            color: '#333',
                                            marginBottom: '6px'
                                        }}>
                                            {consultant.consultantName || consultant.name || '상담사'}
                                        </div>
                                        <div style={{
                                            fontSize: '12px',
                                            color: '#666',
                                            backgroundColor: '#e9ecef',
                                            padding: '4px 8px',
                                            borderRadius: '12px',
                                            display: 'inline-block'
                                        }}>
                                            {consultant.branchCode || '본점'} 지점
                                        </div>
                                    </div>

                                    {/* 평가 통계 */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '12px',
                                        marginBottom: '16px'
                                    }}>
                                        <div style={{
                                            textAlign: 'center',
                                            padding: '12px',
                                            backgroundColor: 'white',
                                            borderRadius: '8px',
                                            border: '1px solid #e9ecef'
                                        }}>
                                            <div style={{
                                                fontSize: '20px',
                                                fontWeight: '700',
                                                color: '#e91e63',
                                                marginBottom: '4px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '4px'
                                            }}>
                                                💖 {avgScore.toFixed(1)}
                                            </div>
                                            <div style={{
                                                fontSize: '11px',
                                                color: '#666',
                                                fontWeight: '500'
                                            }}>
                                                평균 점수
                                            </div>
                                        </div>
                                        <div style={{
                                            textAlign: 'center',
                                            padding: '12px',
                                            backgroundColor: 'white',
                                            borderRadius: '8px',
                                            border: '1px solid #e9ecef'
                                        }}>
                                            <div style={{
                                                fontSize: '20px',
                                                fontWeight: '700',
                                                color: '#4caf50',
                                                marginBottom: '4px'
                                            }}>
                                                {ratingCount}
                                            </div>
                                            <div style={{
                                                fontSize: '11px',
                                                color: '#666',
                                                fontWeight: '500'
                                            }}>
                                                총 평가 수
                                            </div>
                                        </div>
                                    </div>

                                    {/* 하트 점수 시각화 */}
                                    <div style={{
                                        textAlign: 'center',
                                        backgroundColor: 'white',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid #e9ecef'
                                    }}>
                                        <div style={{
                                            fontSize: '12px',
                                            color: '#666',
                                            marginBottom: '8px',
                                            fontWeight: '500'
                                        }}>
                                            하트 점수 분포
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            gap: '3px'
                                        }}>
                                            {Array.from({ length: 5 }, (_, i) => (
                                                <span key={i} style={{
                                                    fontSize: '16px',
                                                    opacity: i < Math.round(avgScore) ? 1 : 0.3,
                                                    transform: i < Math.round(avgScore) ? 'scale(1.1)' : 'scale(1)',
                                                    transition: 'all 0.2s ease'
                                                }}>
                                                    💖
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div style={{
                        textAlign: 'center',
                        padding: '40px',
                        color: '#666',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '12px',
                        border: '2px dashed #dee2e6'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>💔</div>
                        <div style={{ fontSize: '16px', fontWeight: '500' }}>아직 평가받은 상담사가 없습니다</div>
                        <div style={{ fontSize: '12px', marginTop: '8px', color: '#999' }}>클라이언트가 평가를 남기면 여기에 표시됩니다</div>
                    </div>
                )}
            </div>

            {/* 상담사별 평가 요약 테이블 */}
            <div style={{ marginBottom: '24px' }}>
                <h4 style={{
                    fontSize: 'var(--font-size-base)',
                    fontWeight: '600',
                    color: '#333',
                    marginBottom: '12px'
                }}>
                    📊 상담사별 평가 요약
                </h4>
                
                {statistics.topConsultants.length > 0 ? (
                    <div style={{
                        backgroundColor: 'white',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '60px 1fr 80px 80px 100px',
                            gap: '12px',
                            padding: '12px 16px',
                            backgroundColor: '#f8f9fa',
                            borderBottom: '1px solid #e0e0e0',
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: '600',
                            color: '#666'
                        }}>
                            <div>순위</div>
                            <div>상담사명</div>
                            <div style={{ textAlign: 'center' }}>평균점수</div>
                            <div style={{ textAlign: 'center' }}>평가수</div>
                            <div style={{ textAlign: 'center' }}>하트점수</div>
                        </div>
                        {statistics.topConsultants.map((consultant, index) => (
                            <div key={consultant.consultantId} style={{
                                display: 'grid',
                                gridTemplateColumns: '60px 1fr 80px 80px 100px',
                                gap: '12px',
                                padding: '12px 16px',
                                borderBottom: index < statistics.topConsultants.length - 1 ? '1px solid #f0f0f0' : 'none',
                                alignItems: 'center'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <div style={{
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '50%',
                                        backgroundColor: index === 0 ? '#ff9800' : index === 1 ? '#9e9e9e' : index === 2 ? '#795548' : '#2196f3',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 'var(--font-size-xs)',
                                        fontWeight: '600'
                                    }}>
                                        {index + 1}
                                    </div>
                                </div>
                                <div>
                                    <div style={{
                                        fontSize: 'var(--font-size-sm)',
                                        fontWeight: '600',
                                        color: '#333',
                                        marginBottom: '2px'
                                    }}>
                                        {consultant.consultantName}
                                    </div>
                                    <div style={{
                                        fontSize: 'var(--font-size-xs)',
                                        color: '#666'
                                    }}>
                                        {consultant.branchCode || '본점'}
                                    </div>
                                </div>
                                <div style={{
                                    textAlign: 'center',
                                    fontSize: 'var(--font-size-sm)',
                                    fontWeight: '600',
                                    color: '#e91e63'
                                }}>
                                    {(consultant.averageScore || consultant.averageHeartScore || 0).toFixed(1)}
                                </div>
                                <div style={{
                                    textAlign: 'center',
                                    fontSize: 'var(--font-size-sm)',
                                    fontWeight: '600',
                                    color: '#4caf50'
                                }}>
                                    {consultant.ratingCount || consultant.totalRatingCount || 0}개
                                </div>
                                <div style={{
                                    textAlign: 'center'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        gap: '1px'
                                    }}>
                                        {Array.from({ length: 5 }, (_, i) => (
                                            <span key={i} style={{
                                                fontSize: 'var(--font-size-xs)',
                                                opacity: i < Math.round(consultant.averageScore || consultant.averageHeartScore) ? 1 : 0.3
                                            }}>
                                                💖
                                            </span>
                                        ))}
                                    </div>
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
                    fontSize: 'var(--font-size-base)',
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
                                    fontSize: 'var(--font-size-xs)',
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
                                    fontSize: 'var(--font-size-xs)',
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
                        fontSize: 'var(--font-size-xs)',
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

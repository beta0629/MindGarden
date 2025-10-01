import React, { useState, useEffect } from 'react';
import { apiGet } from '../../utils/ajax';

const ConsultationCompletionStats = () => {
    const [statistics, setStatistics] = useState([]);
    const [loading, setLoading] = useState(true);
    // 현재 월을 기본값으로 설정 (YYYY-MM 형식)
    const getCurrentPeriod = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    };
    
    const [selectedPeriod, setSelectedPeriod] = useState(getCurrentPeriod());
    const [error, setError] = useState(null);

    // 기간 옵션 생성 (최근 12개월)
    const generatePeriodOptions = () => {
        const options = [];
        const now = new Date();
        
        for (let i = 0; i < 12; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const period = `${year}-${month}`;
            const label = `${year}년 ${month}월`;
            options.push({ value: period, label });
        }
        
        return options;
    };

    const periodOptions = generatePeriodOptions();

    // 통계 데이터 로드
    const loadStatistics = async (period = '') => {
        try {
            setLoading(true);
            setError(null);
            
            const url = period 
                ? `/api/admin/statistics/consultation-completion?period=${period}`
                : '/api/admin/statistics/consultation-completion';
            
            const response = await apiGet(url);
            console.log('📊 상담 완료 통계 API 응답:', response);
            
            if (response && response.success) {
                console.log('📊 통계 데이터:', response.data);
                setStatistics(response.data || []);
            } else {
                console.error('❌ API 응답 실패:', response);
                setError('통계 데이터를 불러오는데 실패했습니다.');
            }
        } catch (err) {
            console.error('상담 완료 건수 통계 로드 실패:', err);
            setError('통계 데이터를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 컴포넌트 마운트 시 데이터 로드 (현재 기간으로)
    useEffect(() => {
        loadStatistics(selectedPeriod);
    }, []);

    // 기간 변경 핸들러
    const handlePeriodChange = (event) => {
        const period = event.target.value;
        setSelectedPeriod(period);
        loadStatistics(period);
    };

    // 등급을 한글로 변환
    const convertGradeToKorean = (grade) => {
        const gradeMap = {
            'CONSULTANT_JUNIOR': '주니어',
            'CONSULTANT_SENIOR': '시니어',
            'CONSULTANT_EXPERT': '엑스퍼트',
            'CONSULTANT_MASTER': '마스터'
        };
        return gradeMap[grade] || grade;
    };

    // 전문분야를 한글로 변환
    const convertSpecialtyToKorean = (specialty) => {
        if (!specialty) return '전문분야 미설정';
        
        const specialtyMap = {
            'DEPRESSION': '우울증',
            'ANXIETY': '불안장애',
            'TRAUMA': '트라우마',
            'RELATIONSHIP': '관계상담',
            'FAMILY': '가족상담',
            'COUPLE': '부부상담',
            'CHILD': '아동상담',
            'ADOLESCENT': '청소년상담',
            'ADDICTION': '중독상담',
            'EATING_DISORDER': '섭식장애',
            'PERSONALITY': '성격장애',
            'BIPOLAR': '양극성장애',
            'OCD': '강박장애',
            'PTSD': '외상후스트레스장애',
            'GRIEF': '상실상담',
            'CAREER': '진로상담',
            'STRESS': '스트레스관리',
            'SLEEP': '수면장애',
            'ANGER': '분노조절',
            'SELF_ESTEEM': '자존감',
            'INDIVIDUAL': '개인상담',
            'GROUP': '그룹상담',
            'INITIAL': '초기상담'
        };
        
        // 콤마로 구분된 여러 전문분야 처리
        if (specialty.includes(',')) {
            const specialties = specialty.split(',').map(s => s.trim());
            const koreanSpecialties = specialties.map(s => specialtyMap[s] || s);
            return koreanSpecialties.join(', ');
        }
        
        return specialtyMap[specialty] || specialty;
    };

    if (loading) {
        return (
            <div style={{ 
                padding: '20px', 
                textAlign: 'center',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #dee2e6'
            }}>
                <div style={{ 
                    display: 'inline-block',
                    width: '20px',
                    height: '20px',
                    border: '2px solid #007bff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <p style={{ margin: '10px 0 0 0', color: '#6c757d' }}>상담 완료 건수 통계를 불러오는 중...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ 
                padding: '20px', 
                textAlign: 'center',
                backgroundColor: '#f8d7da',
                borderRadius: '8px',
                border: '1px solid #f5c6cb',
                color: '#721c24'
            }}>
                <p>{error}</p>
                <button 
                    onClick={() => loadStatistics(selectedPeriod)}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    다시 시도
                </button>
            </div>
        );
    }

    return (
        <div style={{ 
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #dee2e6',
            overflow: 'hidden'
        }}>
            {/* 헤더 */}
            <div style={{
                padding: '20px',
                backgroundColor: '#fff',
                borderBottom: '1px solid #dee2e6'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px'
                }}>
                    <h3 style={{ 
                        margin: 0, 
                        color: '#495057',
                        fontSize: '1.25rem',
                        fontWeight: '600'
                    }}>
                        상담사별 상담 완료 건수
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <label style={{ 
                            fontSize: 'var(--font-size-sm)',
                            color: '#6c757d',
                            fontWeight: '500'
                        }}>
                            기간:
                        </label>
                        <select
                            value={selectedPeriod}
                            onChange={handlePeriodChange}
                            style={{
                                padding: '6px 12px',
                                border: '1px solid #ced4da',
                                borderRadius: '4px',
                                fontSize: 'var(--font-size-sm)',
                                backgroundColor: '#fff'
                            }}
                        >
                            <option value="">전체</option>
                            {periodOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                
            {/* 요약 정보 카드 */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
                marginTop: '20px'
            }}>
                <div style={{
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '12px',
                    padding: '24px',
                    textAlign: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        backgroundColor: '#007bff',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        fontSize: 'var(--font-size-xxl)',
                        color: 'white'
                    }}>
                        👥
                    </div>
                    <div style={{ 
                        fontSize: 'var(--font-size-xxxl)',
                        fontWeight: 'bold',
                        color: '#007bff',
                        marginBottom: '8px'
                    }}>
                        {statistics.length}
                    </div>
                    <div style={{ 
                        fontSize: 'var(--font-size-sm)',
                        color: '#6c757d',
                        fontWeight: '500'
                    }}>
                        총 상담사
                    </div>
                </div>
                
                <div style={{
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '12px',
                    padding: '24px',
                    textAlign: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        backgroundColor: '#28a745',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        fontSize: 'var(--font-size-xxl)',
                        color: 'white'
                    }}>
                        ✅
                    </div>
                    <div style={{ 
                        fontSize: 'var(--font-size-xxxl)',
                        fontWeight: 'bold',
                        color: '#28a745',
                        marginBottom: '8px'
                    }}>
                        {statistics.reduce((sum, stat) => sum + stat.completedCount, 0)}
                    </div>
                    <div style={{ 
                        fontSize: 'var(--font-size-sm)',
                        color: '#6c757d',
                        fontWeight: '500'
                    }}>
                        완료 건수
                    </div>
                </div>
                
                <div style={{
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '12px',
                    padding: '24px',
                    textAlign: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        backgroundColor: '#ffc107',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        fontSize: 'var(--font-size-xxl)',
                        color: 'white'
                    }}>
                        📊
                    </div>
                    <div style={{ 
                        fontSize: 'var(--font-size-xxxl)',
                        fontWeight: 'bold',
                        color: '#ffc107',
                        marginBottom: '8px'
                    }}>
                        {statistics.length > 0 
                            ? Math.round(statistics.reduce((sum, stat) => sum + stat.completedCount, 0) / statistics.length)
                            : 0
                        }
                    </div>
                    <div style={{ 
                        fontSize: 'var(--font-size-sm)',
                        color: '#6c757d',
                        fontWeight: '500'
                    }}>
                        평균 건수
                    </div>
                </div>
            </div>
            </div>

            {/* 상담사별 통계 카드 그리드 */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '20px',
                marginTop: '20px'
            }}>
                {statistics.map((stat, index) => (
                    <div key={stat.consultantId} style={{
                        backgroundColor: '#fff',
                        border: '1px solid #dee2e6',
                        borderRadius: '12px',
                        padding: '20px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                    }}>
                        {/* 상담사 헤더 */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '16px'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                            }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    backgroundColor: index < 3 ? '#007bff' : '#6c757d',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: 'var(--font-size-base)'
                                }}>
                                    {index + 1}
                                </div>
                                <div>
                                    <div style={{
                                        fontSize: 'var(--font-size-lg)',
                                        fontWeight: '600',
                                        color: '#495057',
                                        marginBottom: '4px'
                                    }}>
                                        {stat.consultantName}
                                    </div>
                                    <div style={{
                                        fontSize: 'var(--font-size-xs)',
                                        color: '#6c757d'
                                    }}>
                                        {stat.consultantPhone}
                                    </div>
                                </div>
                            </div>
                            
                            {/* 등급 배지 */}
                            <div style={{
                                padding: '6px 12px',
                                backgroundColor: stat.grade ? '#e9ecef' : '#f8f9fa',
                                borderRadius: '20px',
                                fontSize: 'var(--font-size-xs)',
                                fontWeight: '500',
                                color: stat.grade ? '#495057' : '#6c757d'
                            }}>
                                {stat.grade ? convertGradeToKorean(stat.grade) : '미설정'}
                            </div>
                        </div>

                        {/* 전문분야 */}
                        <div style={{
                            marginBottom: '16px'
                        }}>
                            <div style={{
                                fontSize: 'var(--font-size-xs)',
                                color: '#6c757d',
                                marginBottom: '6px',
                                fontWeight: '500'
                            }}>
                                전문분야
                            </div>
                            <div style={{
                                fontSize: 'var(--font-size-sm)',
                                color: '#495057',
                                lineHeight: '1.4'
                            }}>
                                {stat.specialization ? convertSpecialtyToKorean(stat.specialization) : '미설정'}
                            </div>
                        </div>

                        {/* 통계 정보 */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1fr',
                            gap: '16px',
                            padding: '16px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px'
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    fontSize: 'var(--font-size-xxl)',
                                    fontWeight: 'bold',
                                    color: '#28a745',
                                    marginBottom: '4px'
                                }}>
                                    {stat.completedCount}
                                </div>
                                <div style={{
                                    fontSize: 'var(--font-size-xs)',
                                    color: '#6c757d',
                                    fontWeight: '500'
                                }}>
                                    완료 건수
                                </div>
                            </div>
                            
                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    fontSize: 'var(--font-size-xxl)',
                                    fontWeight: 'bold',
                                    color: '#6c757d',
                                    marginBottom: '4px'
                                }}>
                                    {stat.totalCount}
                                </div>
                                <div style={{
                                    fontSize: 'var(--font-size-xs)',
                                    color: '#6c757d',
                                    fontWeight: '500'
                                }}>
                                    총 건수
                                </div>
                            </div>
                            
                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    fontSize: 'var(--font-size-xxl)',
                                    fontWeight: 'bold',
                                    color: stat.completionRate >= 80 ? '#28a745' : 
                                           stat.completionRate >= 60 ? '#ffc107' : '#dc3545',
                                    marginBottom: '4px'
                                }}>
                                    {stat.completionRate}%
                                </div>
                                <div style={{
                                    fontSize: 'var(--font-size-xs)',
                                    color: '#6c757d',
                                    fontWeight: '500'
                                }}>
                                    완료율
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {statistics.length === 0 && (
                <div style={{
                    backgroundColor: '#fff',
                    border: '1px solid #dee2e6',
                    borderRadius: '12px',
                    padding: '60px 40px',
                    textAlign: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    marginTop: '20px'
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px',
                        fontSize: 'var(--font-size-xxxl)',
                        color: '#6c757d'
                    }}>
                        📊
                    </div>
                    <h3 style={{
                        fontSize: 'var(--font-size-lg)',
                        fontWeight: '600',
                        color: '#495057',
                        marginBottom: '8px'
                    }}>
                        상담 완료 건수 데이터가 없습니다
                    </h3>
                    <p style={{
                        fontSize: 'var(--font-size-sm)',
                        color: '#6c757d',
                        margin: 0
                    }}>
                        상담사들이 상담을 완료하면 여기에 통계가 표시됩니다.
                    </p>
                </div>
            )}
        </div>
    );
};

export default ConsultationCompletionStats;

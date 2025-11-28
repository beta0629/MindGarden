import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FaChartLine, 
    FaArrowLeft, 
    FaEnvelope, 
    FaPrint, 
    FaDownload,
    FaArrowUp,
    FaArrowDown,
    FaBuilding,
    FaChartBar
} from 'react-icons/fa';
import SimpleLayout from '../layout/SimpleLayout';
import UnifiedLoading from '../common/UnifiedLoading';
import Chart from '../common/Chart';
import './FinancialReports.css';

// 필터 카드 컴포넌트
const ReportFilterCard = ({
    reportPeriod,
    onPeriodChange,
    activeTab,
    onLoadData
}) => {
    return (
        <div className="financial-reports-card">
            <div className="financial-reports-card-header">
                <h5 className="financial-reports-title">보고서 필터</h5>
            </div>
            <div className="financial-reports-card-body">
                <div className="financial-reports-grid">
                    <div>
                        <label className="financial-form-label">시작일</label>
                        <input
                            type="date"
                            className="financial-form-input"
                            value={reportPeriod.startDate}
                            onChange={(e) => onPeriodChange({ ...reportPeriod, startDate: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="financial-form-label">종료일</label>
                        <input
                            type="date"
                            className="financial-form-input"
                            value={reportPeriod.endDate}
                            onChange={(e) => onPeriodChange({ ...reportPeriod, endDate: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="financial-form-label">보고서 유형</label>
                        <select
                            className="financial-form-select"
                            value={activeTab}
                            onChange={(e) => onLoadData(e.target.value)}
                        >
                            <option value="monthly">월별 보고서</option>
                            <option value="yearly">연별 보고서</option>
                        </select>
                    </div>
                    <div>
                        <button className="financial-button financial-button--primary" onClick={() => onLoadData(activeTab)}>
                            데이터 새로고침
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const FinancialReports = ({ user }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('monthly');
    const [reportPeriod, setReportPeriod] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [reportData, setReportData] = useState({
        monthly: {
            summary: {
                totalRevenue: 0,
                totalExpense: 0,
                netIncome: 0,
                growthRate: 0
            },
            dailyTrend: [],
            branchPerformance: [],
            categoryAnalysis: [],
            growthAnalysis: []
        },
        yearly: {
            summary: {
                totalRevenue: 0,
                totalExpense: 0,
                netIncome: 0,
                growthRate: 0
            },
            monthlyTrend: [],
            branchComparison: [],
            growthAnalysis: []
        }
    });

    // 차트 데이터 생성
    const getChartData = useCallback(() => {
        const currentData = activeTab === 'monthly' ? reportData.monthly : reportData.yearly;
        const trendData = activeTab === 'monthly' ? currentData.dailyTrend : currentData.monthlyTrend;
        
        if (!trendData || trendData.length === 0) {
            return {
                labels: ['데이터 없음'],
                datasets: [{
                    label: '수익',
                    data: [0],
                    borderColor: 'var(--color-primary)',
                    backgroundColor: 'var(--color-primary-light)',
                    tension: 0.1
                }, {
                    label: '지출',
                    data: [0],
                    borderColor: 'var(--status-error)',
                    backgroundColor: 'var(--status-error-light)',
                    tension: 0.1
                }]
            };
        }

        const chartData = {
            labels: trendData.map(item => item.date),
            datasets: [{
                label: '수익',
                data: trendData.map(item => item.revenue),
                borderColor: 'var(--color-primary)',
                backgroundColor: 'var(--color-primary-light)',
                tension: 0.1
            }, {
                label: '지출',
                data: trendData.map(item => item.expense),
                borderColor: 'var(--status-error)',
                backgroundColor: 'var(--status-error-light)',
                tension: 0.1
            }]
        };

        return chartData;
    }, [activeTab, reportData]);

    // 보고서 데이터 로드
    const loadReportData = useCallback(async (tab = activeTab) => {
        setLoading(true);
        setError(null);
        
        try {
            // 실제 API 호출 (현재는 더미 데이터)
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 더미 데이터 생성
            const dummyData = {
                monthly: {
                    summary: {
                        totalRevenue: 125000000,
                        totalExpense: 98000000,
                        netIncome: 27000000,
                        growthRate: 12.5
                    },
                    dailyTrend: Array.from({ length: 30 }, (_, i) => ({
                        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        revenue: Math.floor(Math.random() * 5000000) + 3000000,
                        expense: Math.floor(Math.random() * 4000000) + 2000000
                    })),
                    branchPerformance: [
                        { branch: '강남점', revenue: 45000000, expense: 35000000, profit: 10000000 },
                        { branch: '서초점', revenue: 38000000, expense: 28000000, profit: 10000000 },
                        { branch: '송파점', revenue: 32000000, expense: 25000000, profit: 7000000 },
                        { branch: '영등포점', revenue: 10000000, expense: 10000000, profit: 0 }
                    ],
                    categoryAnalysis: [
                        { category: '상담비', amount: 60000000, percentage: 61.2, trend: 'up' },
                        { category: '임대료', amount: 25000000, percentage: 25.5, trend: 'stable' },
                        { category: '인건비', amount: 10000000, percentage: 10.2, trend: 'down' },
                        { category: '기타', amount: 3000000, percentage: 3.1, trend: 'stable' }
                    ],
                    growthAnalysis: [
                        { branch: '강남점', percentage: 15.2, trend: 'up', description: '신규 고객 증가' },
                        { branch: '서초점', percentage: 8.7, trend: 'up', description: '기존 고객 유지' },
                        { branch: '송파점', percentage: -2.1, trend: 'down', description: '경쟁 심화' },
                        { branch: '영등포점', percentage: 0, trend: 'stable', description: '안정적 운영' }
                    ]
                },
                yearly: {
                    summary: {
                        totalRevenue: 1500000000,
                        totalExpense: 1200000000,
                        netIncome: 300000000,
                        growthRate: 18.3
                    },
                    monthlyTrend: Array.from({ length: 12 }, (_, i) => ({
                        date: `${i + 1}월`,
                        revenue: Math.floor(Math.random() * 150000000) + 100000000,
                        expense: Math.floor(Math.random() * 120000000) + 80000000
                    })),
                    branchComparison: [
                        { branch: '강남점', revenue: 540000000, expense: 420000000, profit: 120000000 },
                        { branch: '서초점', revenue: 456000000, expense: 336000000, profit: 120000000 },
                        { branch: '송파점', revenue: 384000000, expense: 300000000, profit: 84000000 },
                        { branch: '영등포점', revenue: 120000000, expense: 120000000, profit: 0 }
                    ],
                    growthAnalysis: [
                        { branch: '강남점', percentage: 22.5, trend: 'up', description: '프리미엄 서비스 확장' },
                        { branch: '서초점', percentage: 15.8, trend: 'up', description: '기업 고객 증가' },
                        { branch: '송파점', percentage: 5.2, trend: 'up', description: '점진적 성장' },
                        { branch: '영등포점', percentage: -8.3, trend: 'down', description: '경쟁 심화' }
                    ]
                }
            };
            
            setReportData(dummyData);
            setActiveTab(tab);
        } catch (err) {
            setError('보고서 데이터를 불러오는 중 오류가 발생했습니다.');
            console.error('보고서 로드 오류:', err);
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    // 이벤트 핸들러
    const handleEmailReport = () => {
        console.log('이메일 보고서 전송');
    };

    const handlePrintReport = () => {
        window.print();
    };

    const handleDownloadReport = () => {
        console.log('보고서 다운로드');
    };

    // 유틸리티 함수
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW'
        }).format(amount);
    };

    // 컴포넌트 마운트 시 데이터 로드
    useEffect(() => {
        loadReportData();
    }, []);

    if (loading) {
        return (
            <SimpleLayout title="재무 보고서">
                <div className="financial-reports-container">
                    <UnifiedLoading text="보고서를 생성하는 중..." size="large" type="inline" />
                </div>
            </SimpleLayout>
        );
    }

    const currentData = activeTab === 'monthly' ? reportData.monthly : reportData.yearly;

    return (
        <SimpleLayout title="재무 보고서">
            <div className="financial-reports-container">
                {/* 헤더 */}
                <div className="financial-reports-header">
                    <div>
                        <button 
                            className="financial-button financial-button--outline"
                            onClick={() => navigate('/hq/dashboard')}
                        >
                            <FaArrowLeft />
                            본사 대시보드
                        </button>
                        <h2 className="financial-reports-title">
                            <FaChartLine />
                            재무 보고서
                        </h2>
                    </div>
                    <div className="financial-reports-actions">
                        <button className="financial-button financial-button--outline" onClick={handleEmailReport}>
                            <FaEnvelope />
                            이메일
                        </button>
                        <button className="financial-button financial-button--outline" onClick={handlePrintReport}>
                            <FaPrint />
                            인쇄
                        </button>
                        <button className="financial-button financial-button--success" onClick={handleDownloadReport}>
                            <FaDownload />
                            다운로드
                        </button>
                    </div>
                </div>

                {/* 기간 선택 */}
                <ReportFilterCard
                    reportPeriod={reportPeriod}
                    onPeriodChange={setReportPeriod}
                    activeTab={activeTab}
                    onLoadData={loadReportData}
                />

                {/* 탭 메뉴 */}
                <div className="financial-tabs">
                    <button 
                        className={`financial-tab-button ${activeTab === 'monthly' ? 'financial-tab-button--active' : ''}`}
                        onClick={() => setActiveTab('monthly')}
                    >
                        월별 보고서
                    </button>
                    <button 
                        className={`financial-tab-button ${activeTab === 'yearly' ? 'financial-tab-button--active' : ''}`}
                        onClick={() => setActiveTab('yearly')}
                    >
                        연별 보고서
                    </button>
                </div>

                {/* 요약 통계 */}
                <div className="financial-reports-grid financial-reports-grid--stats">
                    <div className="financial-stat-card financial-stat-card--success">
                        <div className="financial-stat-card-header">
                            <FaArrowUp className="financial-icon-large financial-icon-success" />
                            <h5 className="financial-stat-label">총 수익</h5>
                        </div>
                        <div className="financial-stat-card-body">
                            <div className="financial-stat-value financial-stat-value-success">
                                {formatCurrency(currentData.summary.totalRevenue)}
                            </div>
                            <p className="financial-description">
                                {activeTab === 'monthly' ? '이번 달' : '올해'} 총 수익
                            </p>
                        </div>
                    </div>

                    <div className="financial-stat-card financial-stat-card--danger">
                        <div className="financial-stat-card-header">
                            <FaArrowDown className="financial-icon-large financial-icon-danger" />
                            <h5 className="financial-stat-label">총 지출</h5>
                        </div>
                        <div className="financial-stat-card-body">
                            <div className="financial-stat-value financial-stat-value-danger">
                                {formatCurrency(currentData.summary.totalExpense)}
                            </div>
                            <p className="financial-description">
                                {activeTab === 'monthly' ? '이번 달' : '올해'} 총 지출
                            </p>
                        </div>
                    </div>

                    <div className="financial-stat-card financial-stat-card--primary">
                        <div className="financial-stat-card-header">
                            <FaChartLine className="financial-icon-large financial-icon-primary" />
                            <h5 className="financial-stat-label">순이익</h5>
                        </div>
                        <div className="financial-stat-card-body">
                            <div className="financial-stat-value financial-stat-value-primary">
                                {formatCurrency(currentData.summary.netIncome)}
                            </div>
                            <p className="financial-description">
                                {activeTab === 'monthly' ? '이번 달' : '올해'} 순이익
                            </p>
                        </div>
                    </div>

                    <div className="financial-stat-card financial-stat-card--info">
                        <div className="financial-stat-card-header">
                            <FaChartBar className="financial-icon-large financial-icon-info" />
                            <h5 className="financial-stat-label">성장률</h5>
                        </div>
                        <div className="financial-stat-card-body">
                            <div className="financial-stat-value financial-stat-value-info">
                                +{currentData.summary.growthRate}%
                            </div>
                            <p className="financial-description">
                                전년 대비 성장률
                            </p>
                        </div>
                    </div>
                </div>

                {/* 월별 보고서 내용 */}
                {activeTab === 'monthly' && (
                    <div>
                        {/* 일별 트렌드 차트 */}
                        <div className="financial-reports-card">
                            <div className="financial-reports-card-header">
                                <h5 className="financial-reports-title">
                                    <FaChartBar className="financial-icon-large financial-icon-primary" />
                                    일별 수익/지출 트렌드
                                </h5>
                            </div>
                            <div className="financial-reports-card-body">
                                <Chart
                                    type="line"
                                    data={getChartData()}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                position: 'top',
                                            },
                                            title: {
                                                display: true,
                                                text: '일별 수익/지출 추이'
                                            }
                                        },
                                        scales: {
                                            y: {
                                                beginAtZero: true,
                                                ticks: {
                                                    callback: function(value) {
                                                        return formatCurrency(value);
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {/* 지점별 성과 */}
                        <div className="financial-reports-card">
                            <div className="financial-reports-card-header">
                                <h5 className="financial-reports-title">
                                    <FaBuilding className="financial-icon-large financial-icon-primary" />
                                    지점별 월간 성과
                                </h5>
                            </div>
                            <div className="financial-reports-card-body">
                                <div className="financial-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>지점명</th>
                                                <th>수익</th>
                                                <th>지출</th>
                                                <th>순이익</th>
                                                <th>수익률</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentData.branchPerformance.map((branch, index) => (
                                                <tr key={index}>
                                                    <td>{branch.branch}</td>
                                                    <td className="financial-value-success">{formatCurrency(branch.revenue)}</td>
                                                    <td className="financial-value-danger">{formatCurrency(branch.expense)}</td>
                                                    <td className={branch.profit > 0 ? 'financial-value-success' : 'financial-value-danger'}>
                                                        {formatCurrency(branch.profit)}
                                                    </td>
                                                    <td className={branch.profit > 0 ? 'financial-value-success' : 'financial-value-danger'}>
                                                        {branch.revenue > 0 ? ((branch.profit / branch.revenue) * 100).toFixed(1) : 0}%
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* 카테고리별 분석 */}
                        <div className="financial-reports-card">
                            <div className="financial-reports-card-header">
                                <h5 className="financial-reports-title">
                                    <FaChartLine className="financial-icon-large financial-icon-primary" />
                                    카테고리별 지출 분석
                                </h5>
                            </div>
                            <div className="financial-reports-card-body">
                                {currentData.categoryAnalysis && currentData.categoryAnalysis.length > 0 ? (
                                    <div className="financial-reports-grid">
                                        {currentData.categoryAnalysis.map((item, index) => (
                                            <div key={index} className="financial-stat-card">
                                                <div className="financial-stat-card-header">
                                                    <h6 className="financial-stat-label">{item.category}</h6>
                                                    <div className="financial-badge financial-badge--primary">{item.percentage}%</div>
                                                </div>
                                                <div className="financial-stat-card-body">
                                                    <div className="financial-stat-value">
                                                        {item.trend === 'up' && <FaArrowUp className="financial-icon-success" />}
                                                        {item.trend === 'down' && <FaArrowDown className="financial-icon-danger" />}
                                                        {item.trend === 'stable' && <span className="financial-icon-muted">→</span>}
                                                        {formatCurrency(item.amount)}
                                                    </div>
                                                    <div className="financial-progress">
                                                        <div 
                                                            className="financial-progress-bar" 
                                                            style={{ width: `${item.percentage}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="financial-empty-state">
                                        <FaChartLine className="financial-icon-large financial-icon-muted" />
                                        <h5 className="financial-empty-state-text">분석 데이터가 없습니다</h5>
                                        <p className="financial-empty-state-description">카테고리별 지출 분석 데이터가 없습니다.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 성장률 분석 */}
                        <div className="financial-reports-card">
                            <div className="financial-reports-card-header">
                                <h5 className="financial-reports-title">
                                    <FaChartLine className="financial-icon-large financial-icon-primary" />
                                    전년 대비 성장률 분석
                                </h5>
                            </div>
                            <div className="financial-reports-card-body">
                                {currentData.growthAnalysis && currentData.growthAnalysis.length > 0 ? (
                                    <div className="financial-reports-grid">
                                        {currentData.growthAnalysis.map((item, index) => (
                                            <div key={index} className="financial-stat-card">
                                                <div className="financial-stat-card-header">
                                                    <div className="financial-stat-value">
                                                        {item.trend === 'up' && <FaArrowUp className="financial-icon-success" />}
                                                        {item.trend === 'down' && <FaArrowDown className="financial-icon-danger" />}
                                                        <span className={item.percentage >= 0 ? 'financial-value-success' : 'financial-value-danger'}>
                                                            {item.percentage > 0 ? '+' : ''}{item.percentage.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="financial-stat-card-body">
                                                    <h6 className="financial-stat-label">{item.branch}</h6>
                                                    <p className="financial-description">{item.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="financial-empty-state">
                                        <FaChartLine className="financial-icon-large financial-icon-muted" />
                                        <h5 className="financial-empty-state-text">성장률 데이터가 없습니다</h5>
                                        <p className="financial-empty-state-description">전년 대비 성장률 분석 데이터가 없습니다.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 연별 보고서 내용 */}
                {activeTab === 'yearly' && (
                    <div>
                        {/* 월별 트렌드 차트 */}
                        <div className="financial-reports-card">
                            <div className="financial-reports-card-header">
                                <h5 className="financial-reports-title">
                                    <FaChartBar className="financial-icon-large financial-icon-primary" />
                                    월별 수익/지출 트렌드
                                </h5>
                            </div>
                            <div className="financial-reports-card-body">
                                <Chart
                                    type="line"
                                    data={getChartData()}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                position: 'top',
                                            },
                                            title: {
                                                display: true,
                                                text: '월별 수익/지출 추이'
                                            }
                                        },
                                        scales: {
                                            y: {
                                                beginAtZero: true,
                                                ticks: {
                                                    callback: function(value) {
                                                        return formatCurrency(value);
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {/* 지점별 연간 비교 */}
                        <div className="financial-reports-card">
                            <div className="financial-reports-card-header">
                                <h5 className="financial-reports-title">
                                    <FaBuilding className="financial-icon-large financial-icon-primary" />
                                    지점별 연간 성과 비교
                                </h5>
                            </div>
                            <div className="financial-reports-card-body">
                                <div className="financial-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>지점명</th>
                                                <th>수익</th>
                                                <th>지출</th>
                                                <th>순이익</th>
                                                <th>수익률</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentData.branchComparison.map((branch, index) => (
                                                <tr key={index}>
                                                    <td>{branch.branch}</td>
                                                    <td className="financial-value-success">{formatCurrency(branch.revenue)}</td>
                                                    <td className="financial-value-danger">{formatCurrency(branch.expense)}</td>
                                                    <td className={branch.profit > 0 ? 'financial-value-success' : 'financial-value-danger'}>
                                                        {formatCurrency(branch.profit)}
                                                    </td>
                                                    <td className={branch.profit > 0 ? 'financial-value-success' : 'financial-value-danger'}>
                                                        {branch.revenue > 0 ? ((branch.profit / branch.revenue) * 100).toFixed(1) : 0}%
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* 성장률 분석 */}
                        <div className="financial-reports-card">
                            <div className="financial-reports-card-header">
                                <h5 className="financial-reports-title">
                                    <FaChartLine className="financial-icon-large financial-icon-primary" />
                                    전년 대비 성장률 분석
                                </h5>
                            </div>
                            <div className="financial-reports-card-body">
                                {currentData.growthAnalysis && currentData.growthAnalysis.length > 0 ? (
                                    <div className="financial-reports-grid">
                                        {currentData.growthAnalysis.map((item, index) => (
                                            <div key={index} className="financial-stat-card">
                                                <div className="financial-stat-card-header">
                                                    <div className="financial-stat-value">
                                                        {item.trend === 'up' && <FaArrowUp className="financial-icon-success" />}
                                                        {item.trend === 'down' && <FaArrowDown className="financial-icon-danger" />}
                                                        <span className={item.percentage >= 0 ? 'financial-value-success' : 'financial-value-danger'}>
                                                            {item.percentage > 0 ? '+' : ''}{item.percentage.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="financial-stat-card-body">
                                                    <h6 className="financial-stat-label">{item.branch}</h6>
                                                    <p className="financial-description">{item.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="financial-empty-state">
                                        <FaChartLine className="financial-icon-large financial-icon-muted" />
                                        <h5 className="financial-empty-state-text">성장률 데이터가 없습니다</h5>
                                        <p className="financial-empty-state-description">전년 대비 성장률 분석 데이터가 없습니다.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 로딩 상태 */}
                {loading && (
                    <div className="text-center py-5">
                        <UnifiedLoading />
                        <p className="mt-3">데이터를 불러오는 중...</p>
                    </div>
                )}

                {/* 에러 상태 */}
                {error && (
                    <div className="financial-reports-card">
                        <div className="financial-reports-card-header">
                            <h4>오류 발생</h4>
                        </div>
                        <div className="financial-reports-card-body">
                            <p>{error}</p>
                            <button className="financial-button financial-button--primary" onClick={loadReportData}>
                                다시 시도
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </SimpleLayout>
    );
};

export default FinancialReports;
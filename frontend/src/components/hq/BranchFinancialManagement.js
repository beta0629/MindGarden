import React, { useState, useEffect, useCallback } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import MGCard from '../common/MGCard';
import { 
    Building2, DollarSign, TrendingUp, Calendar, 
    Filter, Download, Eye, ArrowUp, ArrowDown,
    PiggyBank, CreditCard, Receipt, BarChart3
} from 'lucide-react';
import { useSession } from '../../contexts/SessionContext';
import { apiGet } from '../../utils/ajax';
import { showNotification } from '../../utils/notification';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { DEFAULT_MENU_ITEMS } from '../dashboard-v2/constants/menuItems';
import './BranchFinancialManagement.css';

/**
 * 지점별 재무관리 필터 카드 컴포넌트
 */
const BranchFilterCard = ({
    branches,
    selectedBranch,
    onBranchChange,
    filters,
    onFilterChange,
    onApplyFilters
}) => {
    return (
        <div className="mg-v2-card">
            <div className="mg-v2-card__header">
                <h3 className="mg-v2-card__title">
                    <Filter className="mg-icon mg-icon--title" />
                    지점 선택 및 필터
                </h3>
            </div>
            <div className="mg-v2-card__content">
                <div className="mg-v2-form-grid">
                    <div className="mg-v2-form-group">
                        <label className="mg-v2-form-label">지점 선택</label>
                        <select 
                            className="mg-v2-form-select"
                            value={selectedBranch?.branchCode || ''}
                            onChange={(e) => {
                                const branch = branches.find(b => b.branchCode === e.target.value);
                                onBranchChange(branch);
                            }}
                        >
                            <option value="">지점을 선택하세요</option>
                            {branches.map(branch => (
                                <option key={branch.branchCode} value={branch.branchCode}>
                                    {branch.branchName}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="mg-v2-form-group">
                        <label className="mg-v2-form-label">시작일</label>
                        <input 
                            type="date" 
                            className="mg-v2-form-input"
                            value={filters.startDate}
                            onChange={(e) => onFilterChange('startDate', e.target.value)}
                        />
                    </div>
                    
                    <div className="mg-v2-form-group">
                        <label className="mg-v2-form-label">종료일</label>
                        <input 
                            type="date" 
                            className="mg-v2-form-input"
                            value={filters.endDate}
                            onChange={(e) => onFilterChange('endDate', e.target.value)}
                        />
                    </div>
                    
                    <div className="mg-v2-form-group">
                        <label className="mg-v2-form-label">카테고리</label>
                        <select 
                            className="mg-v2-form-select"
                            value={filters.category}
                            onChange={(e) => onFilterChange('category', e.target.value)}
                        >
                            <option value="">전체</option>
                            <option value="REVENUE">수입</option>
                            <option value="EXPENSE">지출</option>
                        </select>
                    </div>
                    
                    <div className="mg-v2-form-group">
                        <label className="mg-v2-form-label">거래 유형</label>
                        <select 
                            className="mg-v2-form-select"
                            value={filters.transactionType}
                            onChange={(e) => onFilterChange('transactionType', e.target.value)}
                        >
                            <option value="">전체</option>
                            <option value="CONSULTATION">상담비</option>
                            <option value="SALARY">급여</option>
                            <option value="RENT">임대료</option>
                            <option value="UTILITY">공과금</option>
                            <option value="MARKETING">마케팅</option>
                            <option value="OTHER">기타</option>
                        </select>
                    </div>
                    
                    <div className="mg-v2-form-group mg-v2-form-group--button">
                        <button 
                            className="mg-v2-button mg-v2-button--primary mg-v2-button--lg"
                            onClick={onApplyFilters}
                        >
                            <Filter className="mg-icon mg-icon--button" />
                            필터 적용
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * 재무 요약 카드 컴포넌트
 */
const FinancialSummaryCard = ({ title, value, icon: Icon, color = 'primary', trend = null }) => {
    return (
        <div className={`mg-v2-card mg-v2-card--stat mg-v2-card--${color}`}>
            <div className="mg-v2-card__content">
                <div className="mg-stat">
                    <div className="mg-stat__icon">
                        <Icon className="mg-icon mg-icon--stat" />
                    </div>
                    <div className="mg-stat__content">
                        <div className="mg-stat__number">{value}</div>
                        <div className="mg-stat__label">{title}</div>
                        {trend && (
                            <div className={`mg-stat__trend mg-stat__trend--${trend.type}`}>
                                {trend.type === 'up' ? (
                                    <ArrowUp className="mg-icon mg-icon--small" />
                                ) : (
                                    <ArrowDown className="mg-icon mg-icon--small" />
                                )}
                                {trend.value}%
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * 거래 내역 테이블 컴포넌트
 */
const TransactionTable = ({ transactions, loading }) => {
    if (loading) {
        return (
            <div className="mg-v2-card">
                <div className="mg-v2-card__content">
                    <UnifiedLoading type="inline" text="로딩 중..." />
                </div>
            </div>
        );
    }

    if (!transactions || transactions.length === 0) {
        return (
            <div className="mg-v2-card">
                <div className="mg-v2-card__content">
                    <div className="mg-empty-state">
                        <div className="mg-empty-state__icon">
                            <Receipt className="mg-icon mg-icon--empty" />
                        </div>
                        <div className="mg-empty-state__text">거래 내역이 없습니다.</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mg-v2-card">
            <div className="mg-v2-card__header">
                <h3 className="mg-v2-card__title">
                    <Receipt className="mg-icon mg-icon--title" />
                    거래 내역
                </h3>
                <button className="mg-v2-button mg-v2-button--ghost mg-v2-button--sm">
                    <Download className="mg-icon mg-icon--small" />
                    내보내기
                </button>
            </div>
            <div className="mg-v2-card__content">
                {/* 거래 내역 카드 그리드 (표준화 원칙: 테이블 → 카드 전환) */}
                <div className="mg-transaction-cards-grid">
                    {transactions.map((transaction, index) => (
                        <MGCard 
                            key={index}
                            variant="default"
                            className="mg-transaction-card"
                        >
                            <div className="mg-transaction-card__header">
                                <div className="mg-transaction-card__date">{transaction.date}</div>
                                <div className="mg-transaction-card__badges">
                                    <span className={`mg-badge mg-badge--${transaction.category === 'REVENUE' ? 'success' : 'warning'}`}>
                                        {transaction.category === 'REVENUE' ? '수입' : '지출'}
                                    </span>
                                    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                                    <span className={`mg-badge mg-badge--${transaction.status === 'CONFIRMED' ? 'success' : 'secondary'}`}>
                                        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                                        {transaction.status === 'CONFIRMED' ? '확정' : '대기'}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="mg-transaction-card__body">
                                <div className="mg-transaction-card__field">
                                    <span className="mg-transaction-card__label">거래 유형</span>
                                    <span className="mg-transaction-card__value">{transaction.transactionType}</span>
                                </div>
                                <div className="mg-transaction-card__field">
                                    <span className="mg-transaction-card__label">설명</span>
                                    <span className="mg-transaction-card__value">{transaction.description}</span>
                                </div>
                                <div className="mg-transaction-card__field">
                                    <span className="mg-transaction-card__label">금액</span>
                                    <span className={`mg-transaction-card__value mg-transaction-card__value--${transaction.category === 'REVENUE' ? 'success' : 'danger'}`}>
                                        {transaction.category === 'REVENUE' ? '+' : '-'}{transaction.amount?.toLocaleString()}원
                                    </span>
                                </div>
                            </div>
                        </MGCard>
                    ))}
                </div>
            </div>
        </div>
    );
};

/**
 * 지점별 재무관리 메인 컴포넌트
 */
const BranchFinancialManagement = () => {
    const { user, isLoggedIn } = useSession();
    const [loading, setLoading] = useState(false);
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [financialData, setFinancialData] = useState(null);
    const [filters, setFilters] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        category: '',
        transactionType: ''
    });

    const loadBranches = useCallback(async () => {
        try {
            const response = await apiGet('/api/v1/hq/branch-management/branches');
            if (response.success) {
                setBranches(response.data || []);
                if (response.data && response.data.length > 0) {
                    setSelectedBranch(response.data[0]);
                }
            }
        } catch (error) {
            console.error('지점 목록 로드 실패:', error);
            showNotification('지점 목록을 불러오는데 실패했습니다.', 'error');
        }
    }, []);

    const loadFinancialData = useCallback(async () => {
        if (!selectedBranch) return;

        setLoading(true);
        try {
            const params = new URLSearchParams({
                branchCode: selectedBranch.branchCode,
                startDate: filters.startDate,
                endDate: filters.endDate
            });

            if (filters.category) params.append('category', filters.category);
            if (filters.transactionType) params.append('transactionType', filters.transactionType);

            const response = await apiGet(`/api/hq/erp/branch-financial?${params}`);
            
            if (response.success) {
                setFinancialData(response.data);
            } else {
                showNotification('재무 데이터를 불러오는데 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('재무 데이터 로드 실패:', error);
            showNotification('재무 데이터를 불러오는데 실패했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    }, [selectedBranch, filters]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleApplyFilters = () => {
        loadFinancialData();
    };

    useEffect(() => {
        if (isLoggedIn && user) {
            loadBranches();
        }
    }, [isLoggedIn, user, loadBranches]);

    useEffect(() => {
        if (selectedBranch) {
            loadFinancialData();
        }
    }, [selectedBranch, loadFinancialData]);

    if (!isLoggedIn || !user) {
        return (
            <AdminCommonLayout menuItems={DEFAULT_MENU_ITEMS} title="지점별 재무관리">
                <div className="mg-empty-state">
                    <div className="mg-empty-state__icon">
                        <Building2 className="mg-icon mg-icon--empty" />
                    </div>
                    <div className="mg-empty-state__text">로그인이 필요합니다.</div>
                </div>
            </AdminCommonLayout>
        );
    }

    return (
        <AdminCommonLayout menuItems={DEFAULT_MENU_ITEMS} title="지점별 재무관리">
            <div className="branch-financial-management">
                {/* 필터 카드 */}
                <BranchFilterCard
                    branches={branches}
                    selectedBranch={selectedBranch}
                    onBranchChange={setSelectedBranch}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onApplyFilters={handleApplyFilters}
                />

                {/* 재무 요약 */}
                {financialData && (
                    <div className="mg-stats-grid">
                        <FinancialSummaryCard
                            title="총 수입"
                            value={`${financialData.summary?.totalRevenue?.toLocaleString() || 0}원`}
                            icon={DollarSign}
                            color="success"
                        />
                        <FinancialSummaryCard
                            title="총 지출"
                            value={`${financialData.summary?.totalExpenses?.toLocaleString() || 0}원`}
                            icon={CreditCard}
                            color="danger"
                        />
                        <FinancialSummaryCard
                            title="순이익"
                            value={`${financialData.summary?.netProfit?.toLocaleString() || 0}원`}
                            icon={TrendingUp}
                            color={financialData.summary?.netProfit >= 0 ? 'success' : 'danger'}
                        />
                        <FinancialSummaryCard
                            title="거래 건수"
                            value={`${financialData.summary?.transactionCount || 0}건`}
                            icon={BarChart3}
                            color="info"
                        />
                    </div>
                )}

                {/* 거래 내역 테이블 */}
                <TransactionTable 
                    transactions={financialData?.transactions || []} 
                    loading={loading}
                />
            </div>
        </AdminCommonLayout>
    );
};

export default BranchFinancialManagement;
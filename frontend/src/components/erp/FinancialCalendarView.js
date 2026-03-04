import React, { useState, useEffect } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import { apiGet } from '../../utils/ajax';
import {
  Calendar,
  DollarSign,
  TrendingDown,
  Link2,
  BarChart3,
  X,
  Gem,
  ClipboardList,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

/**
 * 재무 거래 달력 뷰 컴포넌트
 * 수입/지출을 달력 형태로 한눈에 표시
 */
const FinancialCalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayDetail, setDayDetail] = useState(null);

  useEffect(() => {
    loadCalendarData();
  }, [currentDate]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      // 해당 월의 시작일과 종료일 계산
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      
      // 해당 월의 모든 거래 조회
      const response = await apiGet(`/api/v1/admin/financial-transactions?startDate=${startDate}&endDate=${endDate}&size=1000`);
      console.log('📅 달력 뷰 API 응답:', response);
      
      // apiGet이 {success, data} 형태면 data만 반환하므로, 배열인지 객체인지 확인
      let transactions = [];
      
      if (Array.isArray(response)) {
        // apiGet이 data 배열만 반환한 경우
        transactions = response;
        console.log('📅 달력 뷰 거래 데이터 (배열):', transactions.length, '건');
      } else if (response && typeof response === 'object') {
        // apiGet이 전체 응답 객체를 반환한 경우
        if (response.success && response.data) {
          transactions = response.data;
          console.log('📅 달력 뷰 거래 데이터 (객체):', transactions.length, '건');
        } else {
          console.warn('⚠️ 달력 뷰 응답 형식 오류:', response);
        }
      }
      
      // 날짜별로 거래 그룹화
      const groupedByDate = {};
      transactions.forEach(transaction => {
        const date = transaction.transactionDate;
        if (!date) return; // 날짜가 없으면 스킵
        
        if (!groupedByDate[date]) {
          groupedByDate[date] = {
            income: 0,
            expense: 0,
            transactions: []
          };
        }
        
        if (transaction.transactionType === 'INCOME') {
          groupedByDate[date].income += Number(transaction.amount) || 0;
        } else {
          groupedByDate[date].expense += Number(transaction.amount) || 0;
        }
        
        groupedByDate[date].transactions.push(transaction);
      });
      
      console.log('📅 달력 뷰 그룹화 완료:', Object.keys(groupedByDate).length, '일');
      setCalendarData(groupedByDate);
    } catch (err) {
      console.error('달력 데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0';
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days = [];
    
    // 이전 달의 빈 칸들
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // 현재 달의 날짜들
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const handleDateClick = async (day) => {
    if (!day) return;
    
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateStr = clickedDate.toISOString().split('T')[0];
    
    setSelectedDate(dateStr);
    setDayDetail(calendarData[dateStr] || { income: 0, expense: 0, transactions: [] });
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const days = getDaysInMonth(currentDate);
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="financial-calendar-view-container">
      {/* 헤더 */}
      <div className="financial-calendar-view-header">
        <h2 className="financial-calendar-view-title">
          <Calendar size={24} aria-hidden /> 재무 달력
        </h2>

        <div className="mg-v2-form-group mg-financial-calendar-nav">
          <button
            type="button"
            onClick={() => navigateMonth(-1)}
            className="mg-v2-button mg-v2-button-secondary"
          >
            <ChevronLeft size={18} aria-hidden /> 이전
          </button>
          <h3 className="mg-v2-text-lg mg-v2-text-center mg-financial-calendar-nav__title">
            {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
          </h3>
          <button
            type="button"
            onClick={() => navigateMonth(1)}
            className="mg-v2-button mg-v2-button-secondary"
          >
            다음 <ChevronRight size={18} aria-hidden />
          </button>
        </div>
      </div>

      {/* 범례 */}
      <div className="mg-v2-legend-container">
        <div className="mg-v2-legend-item">
          <div className="mg-v2-legend-color mg-v2-legend-color--success" />
          <span><DollarSign size={14} aria-hidden /> 수입</span>
        </div>
        <div className="mg-v2-legend-item">
          <div className="mg-v2-legend-color mg-v2-legend-color--danger" />
          <span><TrendingDown size={14} aria-hidden /> 지출</span>
        </div>
        <div className="mg-v2-legend-item">
          <div className="mg-v2-legend-color mg-v2-legend-color--info" />
          <span><Link2 size={14} aria-hidden /> 매핑연동</span>
        </div>
      </div>

      {/* 달력 */}
      <div className="mg-v2-calendar-grid">
        {/* 요일 헤더 */}
        {['일', '월', '화', '수', '목', '금', '토'].map((dayName, index) => (
          <div
            key={dayName}
            className="mg-v2-calendar-header"
          >
            {dayName}
          </div>
        ))}

        {/* 날짜 셀들 */}
        {days.map((day, index) => {
          if (!day) {
            return (
              <div
                key={`empty-${index}`}
                className="mg-financial-calendar-cell-empty"
              />
            );
          }

          const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
            .toISOString().split('T')[0];
          const dayData = calendarData[dateStr] || { income: 0, expense: 0, transactions: [] };
          const isToday = dateStr === today;
          const hasTransactions = dayData.transactions.length > 0;

          return (
            <div
              key={day}
              role="button"
              tabIndex={hasTransactions ? 0 : -1}
              onClick={() => handleDateClick(day)}
              onKeyDown={(e) => {
                if (hasTransactions && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  handleDateClick(day);
                }
              }}
              className={`mg-financial-calendar-cell-day ${isToday ? 'mg-financial-calendar-cell-day--today' : ''} ${hasTransactions ? 'mg-financial-calendar-cell-day--clickable' : ''}`}
            >
              <div className={`mg-financial-calendar-cell-day-num ${isToday ? 'mg-financial-calendar-cell-day-num--today' : ''}`}>
                {day}
              </div>

              {hasTransactions && (
                <div className="mg-financial-calendar-cell-summary">
                  {dayData.income > 0 && (
                    <div className="mg-financial-calendar-cell-income">
                      <DollarSign size={12} aria-hidden /> {formatCurrency(dayData.income)}
                    </div>
                  )}
                  {dayData.expense > 0 && (
                    <div className="mg-financial-calendar-cell-expense">
                      <TrendingDown size={12} aria-hidden /> {formatCurrency(dayData.expense)}
                    </div>
                  )}
                  <div className="mg-financial-calendar-cell-count">
                    {dayData.transactions.length}건
                  </div>
                  {dayData.transactions.some(t =>
                    t.relatedEntityType === 'CONSULTANT_CLIENT_MAPPING' ||
                    t.description?.includes('상담료 입금 확인')
                  ) && (
                    <div className="mg-financial-calendar-cell-mapping-dot" aria-hidden />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 선택된 날짜 상세 정보 */}
      {selectedDate && dayDetail && (
        <div className="mg-financial-calendar-detail-panel">
          <div className="mg-financial-calendar-detail-header">
            <h3 className="mg-financial-calendar-detail-title">
              <BarChart3 size={20} aria-hidden /> {selectedDate} 거래 상세
            </h3>
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className="mg-financial-calendar-detail-close"
              aria-label="닫기"
            >
              <X size={20} aria-hidden />
            </button>
          </div>

          <div className="mg-financial-calendar-detail-summary-grid">
            <div className="mg-financial-calendar-detail-summary mg-financial-calendar-detail-summary--income">
              <div className="mg-financial-calendar-detail-summary-value">+{formatCurrency(dayDetail.income)}원</div>
              <div className="mg-financial-calendar-detail-summary-label"><DollarSign size={12} aria-hidden /> 총 수입</div>
            </div>
            <div className="mg-financial-calendar-detail-summary mg-financial-calendar-detail-summary--expense">
              <div className="mg-financial-calendar-detail-summary-value">-{formatCurrency(dayDetail.expense)}원</div>
              <div className="mg-financial-calendar-detail-summary-label"><TrendingDown size={12} aria-hidden /> 총 지출</div>
            </div>
            <div className="mg-financial-calendar-detail-summary mg-financial-calendar-detail-summary--profit">
              <div className="mg-financial-calendar-detail-summary-value">{formatCurrency(dayDetail.income - dayDetail.expense)}원</div>
              <div className="mg-financial-calendar-detail-summary-label"><Gem size={12} aria-hidden /> 순이익</div>
            </div>
          </div>

          <div>
            <h4 className="mg-financial-calendar-detail-list-title">
              <ClipboardList size={16} aria-hidden /> 거래 내역 ({dayDetail.transactions.length}건)
            </h4>

            {dayDetail.transactions.length > 0 ? (
              <div className="mg-financial-calendar-detail-list">
                {dayDetail.transactions.map((transaction, index) => (
                  <div
                    key={transaction.id}
                    className={`mg-financial-calendar-detail-item ${index % 2 === 0 ? 'mg-financial-calendar-detail-item--even' : 'mg-financial-calendar-detail-item--odd'}`}
                  >
                    <div style={{ flex: 1 }}>
                      <div className="mg-financial-calendar-detail-item-top">
                        <span className={`mg-financial-calendar-detail-type-badge ${transaction.transactionType === 'INCOME' ? 'mg-financial-calendar-detail-type-badge--income' : 'mg-financial-calendar-detail-type-badge--expense'}`}>
                          #{transaction.id}
                        </span>
                        {(transaction.relatedEntityType === 'CONSULTANT_CLIENT_MAPPING' ||
                          transaction.description?.includes('상담료 입금 확인')) && (
                          <span className="mg-financial-calendar-detail-item-mapping">
                            <Link2 size={12} aria-hidden /> 매핑연동
                          </span>
                        )}
                      </div>
                      <div className="mg-financial-calendar-detail-item-category">
                        {transaction.category} - {transaction.subcategory || ''}
                      </div>
                      <div className="mg-financial-calendar-detail-item-desc">
                        {transaction.description || '-'}
                      </div>
                    </div>
                    <div className={`mg-financial-calendar-detail-item-amount ${transaction.transactionType === 'INCOME' ? 'mg-financial-calendar-detail-item-amount--income' : 'mg-financial-calendar-detail-item-amount--expense'}`}>
                      {transaction.transactionType === 'INCOME' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}원
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mg-financial-calendar-detail-empty">
                이 날짜에는 거래가 없습니다.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 월간 통계 */}
      <div className="mg-financial-calendar-monthly-stats">
        <h3 className="mg-financial-calendar-monthly-stats-title">
          <BarChart3 size={20} aria-hidden /> {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월 통계
        </h3>

        {(() => {
          const monthlyIncome = Object.values(calendarData).reduce((sum, day) => sum + day.income, 0);
          const monthlyExpense = Object.values(calendarData).reduce((sum, day) => sum + day.expense, 0);
          const monthlyProfit = monthlyIncome - monthlyExpense;
          const totalTransactions = Object.values(calendarData).reduce((sum, day) => sum + day.transactions.length, 0);

          return (
            <div className="mg-financial-calendar-monthly-grid">
              <div className="mg-financial-calendar-monthly-card mg-financial-calendar-monthly-card--income">
                <div className="mg-financial-calendar-monthly-value">+{formatCurrency(monthlyIncome)}원</div>
                <div className="mg-financial-calendar-monthly-label"><DollarSign size={14} aria-hidden /> 월 총 수입</div>
              </div>
              <div className="mg-financial-calendar-monthly-card mg-financial-calendar-monthly-card--expense">
                <div className="mg-financial-calendar-monthly-value">-{formatCurrency(monthlyExpense)}원</div>
                <div className="mg-financial-calendar-monthly-label"><TrendingDown size={14} aria-hidden /> 월 총 지출</div>
              </div>
              <div className={`mg-financial-calendar-monthly-card ${monthlyProfit >= 0 ? 'mg-financial-calendar-monthly-card--profit' : 'mg-financial-calendar-monthly-card--profit-negative'}`}>
                <div className="mg-financial-calendar-monthly-value">{formatCurrency(monthlyProfit)}원</div>
                <div className="mg-financial-calendar-monthly-label"><Gem size={14} aria-hidden /> 월 순이익</div>
              </div>
              <div className="mg-financial-calendar-monthly-card mg-financial-calendar-monthly-card--total">
                <div className="mg-financial-calendar-monthly-value">{totalTransactions}건</div>
                <div className="mg-financial-calendar-monthly-label"><BarChart3 size={14} aria-hidden /> 총 거래</div>
              </div>
            </div>
          );
        })()}
      </div>

      {loading && (
        <div className="mg-financial-calendar-loading-overlay">
          <UnifiedLoading type="page" text="달력 데이터를 불러오는 중..." />
        </div>
      )}
    </div>
  );
};

export default FinancialCalendarView;

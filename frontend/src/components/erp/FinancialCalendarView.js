import React, { useState, useEffect } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import StandardizedApi from '../../utils/standardizedApi';
import {
  DollarSign,
  TrendingDown,
  Link2,
  BarChart3,
  X,
  CircleDollarSign,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

/**
 * 재무 거래 달력 뷰 컴포넌트
 * 공통 달력(mg-calendar) 구조·클래스 사용. 수입/지출을 달력 형태로 표시.
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
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      const response = await StandardizedApi.get('/api/v1/admin/financial-transactions', {
        startDate,
        endDate,
        size: 1000
      });

      let transactions = [];
      if (Array.isArray(response)) {
        transactions = response;
      } else if (response && typeof response === 'object' && response.success && response.data) {
        transactions = response.data;
      }

      // 안전장치: 해당 월 범위 밖 거래 제외 후 집계
      const inRange = (dateStr) => dateStr >= startDate && dateStr <= endDate;
      transactions = transactions.filter((t) => t.transactionDate && inRange(t.transactionDate));

      const groupedByDate = {};
      transactions.forEach((transaction) => {
        const date = transaction.transactionDate;
        if (!date) return;
        if (!groupedByDate[date]) {
          groupedByDate[date] = { income: 0, expense: 0, transactions: [] };
        }
        if (transaction.transactionType === 'INCOME') {
          groupedByDate[date].income += Number(transaction.amount) || 0;
        } else {
          groupedByDate[date].expense += Number(transaction.amount) || 0;
        }
        groupedByDate[date].transactions.push(transaction);
      });
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
    for (let i = 0; i < startDayOfWeek; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++) days.push(day);
    return days;
  };

  const handleDateClick = (day) => {
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
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="financial-calendar-view-container">
      <div className="mg-calendar">
        <div className="mg-calendar-header">
          <button
            type="button"
            onClick={() => navigateMonth(-1)}
            className="mg-calendar-nav-btn"
            aria-label="이전 달"
          >
            <ChevronLeft size={20} aria-hidden />
          </button>
          <h3 className="mg-calendar-title">
            {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
          </h3>
          <button
            type="button"
            onClick={() => navigateMonth(1)}
            className="mg-calendar-nav-btn"
            aria-label="다음 달"
          >
            <ChevronRight size={20} aria-hidden />
          </button>
        </div>

        <div className="mg-financial-calendar-legend">
          <div className="mg-financial-calendar-legend-item">
            <span className="mg-financial-calendar-legend-dot mg-financial-calendar-legend-dot--income" aria-hidden />
            <span><TrendingUp size={14} aria-hidden /> 수입</span>
          </div>
          <div className="mg-financial-calendar-legend-item">
            <span className="mg-financial-calendar-legend-dot mg-financial-calendar-legend-dot--expense" aria-hidden />
            <span><TrendingDown size={14} aria-hidden /> 지출</span>
          </div>
          <div className="mg-financial-calendar-legend-item">
            <span className="mg-financial-calendar-legend-dot mg-financial-calendar-legend-dot--mapping" aria-hidden />
            <span><Link2 size={14} aria-hidden /> 매핑연동</span>
          </div>
        </div>

        <div className="mg-calendar-grid">
          {dayNames.map((dayName) => (
            <div key={dayName} className="mg-calendar-day-header">
              {dayName}
            </div>
          ))}
          {days.map((day, index) => {
            if (!day) {
              return (
                <div key={`empty-${index}`} className="mg-calendar-day mg-calendar-day--empty" aria-hidden />
              );
            }
            const dateStr = new Date(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              day
            )
              .toISOString()
              .split('T')[0];
            const dayData = calendarData[dateStr] || { income: 0, expense: 0, transactions: [] };
            const isToday = dateStr === today;
            const isSelected = selectedDate === dateStr;
            const hasTransactions = dayData.transactions.length > 0;
            const hasMapping = dayData.transactions.some(
              (t) =>
                t.relatedEntityType === 'CONSULTANT_CLIENT_MAPPING' ||
                t.description?.includes('상담료 입금 확인')
            );

            return (
              <div
                key={day}
                role="button"
                tabIndex={0}
                onClick={() => handleDateClick(day)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleDateClick(day);
                  }
                }}
                className={`mg-calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasTransactions ? 'has-event' : ''}`}
              >
                <span className="mg-calendar-day-num">{day}</span>
                {hasTransactions && (
                  <div className="mg-calendar-day-summary">
                    {dayData.income > 0 && (
                      <span className="mg-calendar-day-income">
                        <TrendingUp size={10} aria-hidden /> +{formatCurrency(dayData.income)}
                      </span>
                    )}
                    {dayData.expense > 0 && (
                      <span className="mg-calendar-day-expense">
                        <TrendingDown size={10} aria-hidden /> -{formatCurrency(dayData.expense)}
                      </span>
                    )}
                    {dayData.transactions.length > 0 && (
                      <span className="mg-calendar-day-count">{dayData.transactions.length}건</span>
                    )}
                    {hasMapping && <span className="mg-calendar-day-mapping-dot" aria-hidden />}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

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
              <div className="mg-financial-calendar-detail-summary-label">
                <DollarSign size={12} aria-hidden /> 총 수입
              </div>
            </div>
            <div className="mg-financial-calendar-detail-summary mg-financial-calendar-detail-summary--expense">
              <div className="mg-financial-calendar-detail-summary-value">-{formatCurrency(dayDetail.expense)}원</div>
              <div className="mg-financial-calendar-detail-summary-label">
                <TrendingDown size={12} aria-hidden /> 총 지출
              </div>
            </div>
            <div className="mg-financial-calendar-detail-summary mg-financial-calendar-detail-summary--profit">
              <div className="mg-financial-calendar-detail-summary-value">
                {formatCurrency(dayDetail.income - dayDetail.expense)}원
              </div>
              <div className="mg-financial-calendar-detail-summary-label">
                <CircleDollarSign size={12} aria-hidden /> 순이익
              </div>
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
                        <span
                          className={`mg-financial-calendar-detail-type-badge ${transaction.transactionType === 'INCOME' ? 'mg-financial-calendar-detail-type-badge--income' : 'mg-financial-calendar-detail-type-badge--expense'}`}
                        >
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
                    <div
                      className={`mg-financial-calendar-detail-item-amount ${transaction.transactionType === 'INCOME' ? 'mg-financial-calendar-detail-item-amount--income' : 'mg-financial-calendar-detail-item-amount--expense'}`}
                    >
                      {transaction.transactionType === 'INCOME' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}원
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mg-financial-calendar-detail-empty">이 날짜에는 거래가 없습니다.</div>
            )}
          </div>
        </div>
      )}

      <section className="mg-financial-calendar-monthly-stats" aria-label="월 통계">
        <h3 className="mg-financial-calendar-monthly-stats-title">
          <BarChart3 size={20} aria-hidden /> {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월 통계
        </h3>
        {(() => {
          const monthlyIncome = Object.values(calendarData).reduce((sum, day) => sum + day.income, 0);
          const monthlyExpense = Object.values(calendarData).reduce((sum, day) => sum + day.expense, 0);
          const monthlyProfit = monthlyIncome - monthlyExpense;
          const totalTransactions = Object.values(calendarData).reduce(
            (sum, day) => sum + day.transactions.length,
            0
          );
          return (
            <div className="mg-financial-calendar-monthly-stats__grid mg-v2-erp-dashboard-kpi-grid">
              <div className="mg-v2-ad-b0kla__card mg-v2-ad-b0kla__card--accent-success">
                <div className="mg-v2-ad-b0kla__chart-header">
                  <span className="mg-v2-ad-b0kla__chart-title">수입 합계</span>
                  <TrendingUp size={24} aria-hidden className="mg-financial-calendar-monthly-stats__icon" />
                </div>
                <div className="mg-v2-ad-b0kla__chart-body">
                  <div className="mg-v2-ad-b0kla__kpi-value">+{formatCurrency(monthlyIncome)}원</div>
                  <span className="mg-v2-ad-b0kla__kpi-label">이번 달</span>
                </div>
              </div>
              <div className="mg-v2-ad-b0kla__card mg-v2-ad-b0kla__card--accent-error">
                <div className="mg-v2-ad-b0kla__chart-header">
                  <span className="mg-v2-ad-b0kla__chart-title">지출 합계</span>
                  <TrendingDown size={24} aria-hidden className="mg-financial-calendar-monthly-stats__icon" />
                </div>
                <div className="mg-v2-ad-b0kla__chart-body">
                  <div className="mg-v2-ad-b0kla__kpi-value">-{formatCurrency(monthlyExpense)}원</div>
                  <span className="mg-v2-ad-b0kla__kpi-label">이번 달</span>
                </div>
              </div>
              <div
                className={`mg-v2-ad-b0kla__card ${monthlyProfit >= 0 ? 'mg-v2-ad-b0kla__card--accent-primary' : 'mg-v2-ad-b0kla__card--accent-error'}`}
              >
                <div className="mg-v2-ad-b0kla__chart-header">
                  <span className="mg-v2-ad-b0kla__chart-title">순이익</span>
                  <CircleDollarSign size={24} aria-hidden className="mg-financial-calendar-monthly-stats__icon" />
                </div>
                <div className="mg-v2-ad-b0kla__chart-body">
                  <div className="mg-v2-ad-b0kla__kpi-value">{formatCurrency(monthlyProfit)}원</div>
                  <span className="mg-v2-ad-b0kla__kpi-label">이번 달</span>
                </div>
              </div>
              <div className="mg-v2-ad-b0kla__card mg-v2-ad-b0kla__card--accent-secondary">
                <div className="mg-v2-ad-b0kla__chart-header">
                  <span className="mg-v2-ad-b0kla__chart-title">거래 건수</span>
                  <BarChart3 size={24} aria-hidden className="mg-financial-calendar-monthly-stats__icon" />
                </div>
                <div className="mg-v2-ad-b0kla__chart-body">
                  <div className="mg-v2-ad-b0kla__kpi-value">{totalTransactions}건</div>
                  <span className="mg-v2-ad-b0kla__kpi-label">이번 달</span>
                </div>
              </div>
            </div>
          );
        })()}
      </section>

      {loading && (
        <div className="mg-financial-calendar-loading-overlay">
          <UnifiedLoading type="page" text="달력 데이터를 불러오는 중..." />
        </div>
      )}
    </div>
  );
};

export default FinancialCalendarView;

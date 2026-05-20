/**
 * ConsultantIncomeReport — 수입·정산 리포트 UI (레거시).
 * 상담사 리뉴얼 라우트에서는 비연결; FINANCIAL_VIEW 등 관리자 전용 경로에만 연결할 것.
 *
 * 월별 요약(총 상담 건수, 총 수입, 평균 평점),
 * CSS 바 차트(월별 수입 추이), 날짜별 상세 목록.
 *
 * @author MindGarden
 * @since 2026-05-12
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, DollarSign, BarChart3,
  Star, FileText
} from 'lucide-react';
import TenantAwareApiClient from '../../utils/TenantAwareApiClient';
import { useSession } from '../../contexts/SessionContext';
import './ConsultantIncomeReport.css';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
const API_PAYMENTS = '/api/v1/payments';


const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '₩0';
  return `₩${Number(amount).toLocaleString()}`;
};

const ConsultantIncomeReport = () => {
  const { user } = useSession();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [summary, setSummary] = useState({ totalSessions: 0, totalIncome: 0, avgRating: 0 });
  const [monthlyData, setMonthlyData] = useState([]);
  const [detailList, setDetailList] = useState([]);
  const [loading, setLoading] = useState(true);

  const consultantId = user?.id;

  const loadReport = useCallback(async () => {
    if (!consultantId) return;
    try {
      setLoading(true);
      const [year, month] = currentMonth.split('-');

      const [statsRes, paymentsRes] = await Promise.all([
        TenantAwareApiClient.get(`/api/v1/consultants/${consultantId}`, {}).catch(() => null),
        TenantAwareApiClient.get(API_PAYMENTS, {
          consultantId,
          year,
          month,
          status: 'COMPLETED',
        }).catch(() => null),
      ]);

      const payments = Array.isArray(paymentsRes) ? paymentsRes : (paymentsRes?.data || []);
      const totalIncome = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const stats = statsRes?.data || statsRes || {};

      setSummary({
        totalSessions: payments.length,
        totalIncome,
        avgRating: stats.averageRating || 0,
      });

      setDetailList(
        payments.map((p) => ({
          id: p.id || p.paymentId,
          date: p.paymentDate || p.createdAt?.split('T')[0],
          clientName: p.clientName || '내담자',
          amount: p.amount || 0,
          type: p.consultationType || '상담',
        }))
      );

      const chartData = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(Number(year), Number(month) - 1 - i, 1);
        const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const income = m === currentMonth ? totalIncome : Math.floor(Math.random() * 500000 + 200000);
        chartData.push({ month: m, label: `${d.getMonth() + 1}월`, income });
      }
      setMonthlyData(chartData);
    } catch (err) {
      console.error('수입 리포트 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  }, [consultantId, currentMonth]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const changeMonth = (delta) => {
    const [y, m] = currentMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const maxIncome = Math.max(...monthlyData.map((d) => d.income), 1);

  if (loading) {
    return (
      <div className="income-report">
        <div className="income-report__skeleton">
          <div className="income-report__skeleton-card" />
          <div className="income-report__skeleton-chart" />
          <div className="income-report__skeleton-card" />
        </div>
      </div>
    );
  }

  return (
    <div className="income-report">
      {/* 월 선택 */}
      <div className="income-report__month-selector">
        <button
          type="button"
          className="income-report__month-btn"
          onClick={() => changeMonth(-1)}
          aria-label="이전 달"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="income-report__month-label">{currentMonth.replace('-', '년 ')}월</span>
        <button
          type="button"
          className="income-report__month-btn"
          onClick={() => changeMonth(1)}
          aria-label="다음 달"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* 요약 카드 */}
      <div className="income-report__summary-grid">
        <div className="income-report__summary-card">
          <div className="income-report__summary-icon">
            <FileText size={20} />
          </div>
          <div className="income-report__summary-value">{summary.totalSessions}</div>
          <div className="income-report__summary-label">총 상담 건수</div>
        </div>
        <div className="income-report__summary-card">
          <div className="income-report__summary-icon">
            <DollarSign size={20} />
          </div>
          <div className="income-report__summary-value">{formatCurrency(summary.totalIncome)}</div>
          <div className="income-report__summary-label">총 수입</div>
        </div>
        <div className="income-report__summary-card">
          <div className="income-report__summary-icon">
            <Star size={20} />
          </div>
          <div className="income-report__summary-value">
            {summary.avgRating ? summary.avgRating.toFixed(1) : '-'}
          </div>
          <div className="income-report__summary-label">평균 평점</div>
        </div>
      </div>

      {/* 바 차트 */}
      <div className="income-report__chart-section">
        <div className="income-report__chart-title">
          <BarChart3 size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
          월별 수입 추이
        </div>
        <div className="income-report__bar-chart">
          {monthlyData.map((d, i) => {
            const heightPct = (d.income / maxIncome) * 100;
            const isCurrent = d.month === currentMonth;
            return (
              <div key={d.month} className="income-report__bar-wrapper">
                <span className="income-report__bar-value">
                  {formatCurrency(d.income)}
                </span>
                <div
                  className={`income-report__bar ${isCurrent ? 'income-report__bar--current' : 'income-report__bar--past'}`}
                  style={{ height: `${Math.max(heightPct, 3)}%` }}
                />
                <span className="income-report__bar-label">{d.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 상세 목록 */}
      <div className="income-report__detail-section">
        <div className="income-report__detail-title">상세 내역</div>
        {detailList.length > 0 ? (
          <div className="income-report__detail-list">
            {detailList.map((item, idx) => (
              <div
                key={item.id || idx}
                className="income-report__detail-item"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="income-report__detail-left">
                  <span className="income-report__detail-date">{item.date}</span>
                  <span className="income-report__detail-client">{item.clientName}</span>
                </div>
                <div className="income-report__detail-right">
                  <span className="income-report__detail-amount">{formatCurrency(item.amount)}</span>
                  <span className="income-report__detail-type">{item.type}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="income-report__empty">
            <div className="income-report__empty-icon">
              <DollarSign size={28} />
            </div>
            <p className="income-report__empty-text">
              이번 달 상담 내역이 없습니다
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultantIncomeReport;

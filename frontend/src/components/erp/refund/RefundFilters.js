import React from 'react';
import ErpCard from '../common/ErpCard';
import ErpButton from '../common/ErpButton';
import { FaSync, FaDownload } from 'react-icons/fa';
import './RefundFilters.css';

/**
 * 환불 필터 및 제어 컴포넌트
 */
const RefundFilters = ({ 
    selectedPeriod, 
    selectedStatus, 
    onPeriodChange, 
    onStatusChange, 
    onRefresh,
    onExportExcel 
}) => {
    return (
        <ErpCard title="필터 및 제어">
            <div className="refund-filters-container">
                <div className="refund-filter-group">
                    <label className="refund-filter-label">기간:</label>
                    <select 
                        value={selectedPeriod} 
                        onChange={(e) => onPeriodChange(e.target.value)}
                        className="refund-filter-select"
                    >
                        <option value="today">오늘</option>
                        <option value="week">최근 7일</option>
                        <option value="month">최근 1개월</option>
                        <option value="quarter">최근 3개월</option>
                        <option value="year">최근 1년</option>
                    </select>
                </div>

                <div className="refund-filter-group">
                    <label className="refund-filter-label">상태:</label>
                    <select 
                        value={selectedStatus} 
                        onChange={(e) => onStatusChange(e.target.value)}
                        className="refund-filter-select"
                    >
                        <option value="all">전체</option>
                        <option value="completed">완료</option>
                        <option value="pending">대기</option>
                        <option value="failed">실패</option>
                    </select>
                </div>

                <ErpButton
                    variant="info"
                    onClick={onRefresh}
                    icon={<FaSync />}
                >
                    새로고침
                </ErpButton>

                <ErpButton
                    variant="success"
                    onClick={onExportExcel}
                    icon={<FaDownload />}
                >
                    엑셀 다운로드
                </ErpButton>
            </div>
        </ErpCard>
    );
};

export default RefundFilters;

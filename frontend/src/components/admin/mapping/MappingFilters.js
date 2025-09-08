import React from 'react';
import { MAPPING_FILTER_OPTIONS } from '../../../constants/mapping';

/**
 * 매핑 필터 컴포넌트
 * - 상태별 필터링
 * - 검색 기능
 * - 필터 초기화
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const MappingFilters = ({ 
    filterStatus, 
    searchTerm, 
    onStatusChange, 
    onSearchChange, 
    onReset 
}) => {
    const statusOptions = MAPPING_FILTER_OPTIONS;

    return (
        <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            marginBottom: '24px',
            border: '1px solid #e1e8ed',
            overflow: 'hidden'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                borderBottom: '1px solid #e1e8ed'
            }}>
                <h3 style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#2c3e50'
                }}>🔍 필터 및 검색</h3>
                <button 
                    style={{
                        padding: '6px 12px',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: '#6c757d',
                        color: 'white'
                    }}
                    onClick={onReset}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#5a6268';
                        e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#6c757d';
                        e.target.style.transform = 'translateY(0)';
                    }}
                >
                    <i className="bi bi-arrow-clockwise"></i> 초기화
                </button>
            </div>
            
            <div style={{
                padding: '20px',
                display: 'flex',
                gap: '20px',
                alignItems: 'end'
            }}>
                <div style={{ flex: 1 }}>
                    <label style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#6c757d',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        <i className="bi bi-funnel"></i>
                        {' '}상태 필터
                    </label>
                    <select 
                        value={filterStatus} 
                        onChange={(e) => onStatusChange(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #e1e8ed',
                            borderRadius: '6px',
                            fontSize: '14px',
                            backgroundColor: 'white',
                            color: '#2c3e50',
                            cursor: 'pointer'
                        }}
                    >
                        {statusOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
                
                <div style={{ flex: 2 }}>
                    <label style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#6c757d',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        <i className="bi bi-search"></i>
                        {' '}검색
                    </label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            placeholder="상담사 또는 내담자 이름으로 검색..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                paddingRight: searchTerm ? '40px' : '12px',
                                border: '1px solid #e1e8ed',
                                borderRadius: '6px',
                                fontSize: '14px',
                                backgroundColor: 'white',
                                color: '#2c3e50'
                            }}
                        />
                        {searchTerm && (
                            <button 
                                style={{
                                    position: 'absolute',
                                    right: '8px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: '#6c757d',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                onClick={() => onSearchChange('')}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#f8f9fa';
                                    e.target.style.color = '#dc3545';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = 'transparent';
                                    e.target.style.color = '#6c757d';
                                }}
                            >
                                <i className="bi bi-x"></i>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MappingFilters;

import React from 'react';
import { 
    MAPPING_STATUS_LABELS, 
    MAPPING_STATUS_COLORS 
} from '../../../constants/mapping';

/**
 * 매핑 카드 컴포넌트
 * - 개별 매핑 정보를 카드 형태로 표시
 * - 매핑 상태, 참여자 정보, 세션 정보 등 표시
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const MappingCard = ({ 
    mapping, 
    onApprove, 
    onReject, 
    onConfirmPayment,
    onEdit, 
    onView,
    onTransfer,
    onViewTransferHistory
}) => {
    // 상태별 색상
    const getStatusColor = (status) => {
        return MAPPING_STATUS_COLORS[status] || '#6c757d';
    };

    // 상태별 한글명
    const getStatusLabel = (status) => {
        return MAPPING_STATUS_LABELS[status] || status;
    };

    return (
        <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            border: '1px solid #e1e8ed'
        }}
        onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.15)';
        }}
        onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                borderBottom: '1px solid #e1e8ed'
            }}>
                <div>
                    <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        backgroundColor: getStatusColor(mapping.status)
                    }}>
                        {getStatusLabel(mapping.status)}
                    </span>
                </div>
                <div style={{
                    fontSize: '12px',
                    color: '#6c757d',
                    fontWeight: '500'
                }}>
                    {mapping.startDate ? 
                        (() => {
                            try {
                                return new Date(mapping.startDate).toLocaleDateString('ko-KR');
                            } catch (error) {
                                return '날짜 정보 없음';
                            }
                        })() : 
                        '날짜 정보 없음'
                    }
                </div>
            </div>

            <div style={{ padding: '20px' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    marginBottom: '20px',
                    padding: '16px',
                    background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
                    borderRadius: '8px',
                    border: '1px solid #e1e8ed'
                }}>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{
                            fontSize: '11px',
                            color: '#6c757d',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '4px'
                        }}>상담사</div>
                        <div style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#2c3e50',
                            marginBottom: '2px'
                        }}>
                            {mapping.consultant?.name || mapping.consultantName || '상담사 정보 없음'}
                        </div>
                        <div style={{
                            fontSize: '12px',
                            color: '#6c757d'
                        }}>
                            {mapping.consultant?.email || ''}
                        </div>
                    </div>
                    <div style={{
                        fontSize: '20px',
                        color: '#007bff',
                        fontWeight: 'bold'
                    }}>→</div>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{
                            fontSize: '11px',
                            color: '#6c757d',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '4px'
                        }}>내담자</div>
                        <div style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#2c3e50',
                            marginBottom: '2px'
                        }}>
                            {mapping.client?.name || mapping.clientName || '내담자 정보 없음'}
                        </div>
                        <div style={{
                            fontSize: '12px',
                            color: '#6c757d'
                        }}>
                            {mapping.client?.email || ''}
                        </div>
                    </div>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    marginBottom: '16px'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        background: '#f8f9fa',
                        borderRadius: '6px',
                        border: '1px solid #e9ecef'
                    }}>
                        <span style={{
                            fontSize: '12px',
                            color: '#6c757d',
                            fontWeight: '500'
                        }}>패키지:</span>
                        <span style={{
                            fontSize: '14px',
                            color: '#2c3e50',
                            fontWeight: '600'
                        }}>{mapping.packageName || '기본 패키지'}</span>
                    </div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        background: '#f8f9fa',
                        borderRadius: '6px',
                        border: '1px solid #e9ecef'
                    }}>
                        <span style={{
                            fontSize: '12px',
                            color: '#6c757d',
                            fontWeight: '500'
                        }}>총 세션:</span>
                        <span style={{
                            fontSize: '14px',
                            color: '#2c3e50',
                            fontWeight: '600'
                        }}>{mapping.totalSessions}회</span>
                    </div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        background: '#f8f9fa',
                        borderRadius: '6px',
                        border: '1px solid #e9ecef'
                    }}>
                        <span style={{
                            fontSize: '12px',
                            color: '#6c757d',
                            fontWeight: '500'
                        }}>남은 세션:</span>
                        <span style={{
                            fontSize: '14px',
                            color: '#2c3e50',
                            fontWeight: '600'
                        }}>{mapping.remainingSessions}회</span>
                    </div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        background: '#f8f9fa',
                        borderRadius: '6px',
                        border: '1px solid #e9ecef'
                    }}>
                        <span style={{
                            fontSize: '12px',
                            color: '#6c757d',
                            fontWeight: '500'
                        }}>가격:</span>
                        <span style={{
                            fontSize: '14px',
                            color: '#2c3e50',
                            fontWeight: '600'
                        }}>
                            {mapping.packagePrice?.toLocaleString() || 0}원
                        </span>
                    </div>
                </div>

                {mapping.notes && (
                    <div style={{
                        padding: '12px',
                        background: '#fff3cd',
                        borderRadius: '6px',
                        border: '1px solid #ffeaa7',
                        marginBottom: '16px'
                    }}>
                        <span style={{
                            fontSize: '12px',
                            color: '#856404',
                            fontWeight: '600',
                            display: 'block',
                            marginBottom: '4px'
                        }}>메모:</span>
                        <span style={{
                            fontSize: '13px',
                            color: '#856404',
                            lineHeight: 1.4
                        }}>{mapping.notes}</span>
                    </div>
                )}
            </div>

            <div style={{
                display: 'flex',
                gap: '8px',
                padding: '16px 20px',
                background: '#f8f9fa',
                borderTop: '1px solid #e1e8ed',
                justifyContent: 'flex-end'
            }}>
                {/* 디버깅용 로그 */}
                {console.log('MappingCard Debug:', {
                    id: mapping.id,
                    status: mapping.status,
                    paymentStatus: mapping.paymentStatus,
                    consultantName: mapping.consultantName,
                    clientName: mapping.clientName
                })}
                
                {/* 입금 확인 버튼 - PENDING 상태일 때만 표시 */}
                {mapping.paymentStatus === 'PENDING' && (
                    <button 
                        style={{
                            padding: '4px 8px',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: '#007bff',
                            color: 'white'
                        }}
                        onClick={() => onConfirmPayment?.(mapping.id)}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#0056b3';
                            e.target.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#007bff';
                            e.target.style.transform = 'translateY(0)';
                        }}
                    >
                        <i className="bi bi-credit-card"></i> 입금 확인
                    </button>
                )}
                
                {/* 승인/거부 버튼 - CONFIRMED 상태일 때만 표시 */}
                {mapping.paymentStatus === 'CONFIRMED' && (
                    <>
                        <button 
                            style={{
                                padding: '4px 8px',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                backgroundColor: '#28a745',
                                color: 'white'
                            }}
                            onClick={() => onApprove?.(mapping.id)}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#218838';
                                e.target.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = '#28a745';
                                e.target.style.transform = 'translateY(0)';
                            }}
                        >
                            <i className="bi bi-check-circle"></i> 승인
                        </button>
                        <button 
                            style={{
                                padding: '4px 8px',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                backgroundColor: '#dc3545',
                                color: 'white'
                            }}
                            onClick={() => onReject?.(mapping.id)}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#c82333';
                                e.target.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = '#dc3545';
                                e.target.style.transform = 'translateY(0)';
                            }}
                        >
                            <i className="bi bi-x-circle"></i> 거부
                        </button>
                    </>
                )}
                {mapping.status === 'ACTIVE' && mapping.paymentStatus === 'APPROVED' && (
                    <>
                        <button 
                            style={{
                                padding: '4px 8px',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                backgroundColor: '#ffc107',
                                color: '#212529'
                            }}
                            onClick={() => onEdit?.(mapping)}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#e0a800';
                                e.target.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = '#ffc107';
                                e.target.style.transform = 'translateY(0)';
                            }}
                        >
                            <i className="bi bi-pencil"></i> 수정
                        </button>
                        <button 
                            style={{
                                padding: '4px 8px',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                backgroundColor: '#6c757d',
                                color: 'white'
                            }}
                            onClick={() => onTransfer?.(mapping)}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#5a6268';
                                e.target.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = '#6c757d';
                                e.target.style.transform = 'translateY(0)';
                            }}
                        >
                            <i className="bi bi-arrow-left-right"></i> 상담사 변경
                        </button>
                    </>
                )}
                <button 
                    style={{
                        padding: '4px 8px',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: '#17a2b8',
                        color: 'white'
                    }}
                    onClick={() => onView?.(mapping)}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#138496';
                        e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#17a2b8';
                        e.target.style.transform = 'translateY(0)';
                    }}
                >
                    <i className="bi bi-eye"></i> 상세보기
                </button>
                {mapping.clientId && (
                    <button 
                        style={{
                            padding: '4px 8px',
                            border: '1px solid #17a2b8',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: 'transparent',
                            color: '#17a2b8'
                        }}
                        onClick={() => onViewTransferHistory?.(mapping.clientId)}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#17a2b8';
                            e.target.style.color = 'white';
                            e.target.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.color = '#17a2b8';
                            e.target.style.transform = 'translateY(0)';
                        }}
                    >
                        <i className="bi bi-clock-history"></i> 변경 이력
                    </button>
                )}
            </div>
        </div>
    );
};

export default MappingCard;

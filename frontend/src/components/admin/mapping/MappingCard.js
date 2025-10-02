import React, { useState } from 'react';
import MappingPaymentModal from './MappingPaymentModal';
import MappingDepositModal from './MappingDepositModal';

/**
 * 매핑 카드 컴포넌트 (동적 처리 지원)
 * - 개별 매핑 정보를 카드 형태로 표시
 * - 매핑 상태, 참여자 정보, 세션 정보 등 표시
 * - 동적 색상/아이콘 조회
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2024-12-19
 * @updated 2025-09-14 - 동적 처리로 변경
 */
const MappingCard = ({ 
    mapping, 
    statusInfo = {
        label: mapping?.status || 'UNKNOWN',
        color: '#6c757d',
        icon: '📋'
    },
    onApprove, 
    onReject, 
    onConfirmPayment,
    onConfirmDeposit,
    onEdit, 
    onView,
    onTransfer,
    onViewTransferHistory,
    onRefund
}) => {
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showDepositModal, setShowDepositModal] = useState(false);
    
    // 모달 상태 초기화 (매핑이 변경될 때) - 제거
    // React.useEffect(() => {
    //     setShowPaymentModal(false);
    //     setShowDepositModal(false);
    // }, [mapping.id]);
    // 상태별 색상 (props에서 받은 데이터 사용)
    const getStatusColor = (status) => {
        return statusInfo.color;
    };

    // 상태별 한글명 (props에서 받은 데이터 사용)
    const getStatusLabel = (status) => {
        return statusInfo.label;
    };

    // 상태별 아이콘 (props에서 받은 데이터 사용)
    const getStatusIcon = (status) => {
        return statusInfo.icon;
    };

    return (
        <div className="mapping-card-mobile"
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
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        color: 'var(--color-text-inverse, #FFFFFF)',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        backgroundColor: getStatusColor(mapping.status)
                    }}>
                        {getStatusIcon(mapping.status)}
                        {getStatusLabel(mapping.status)}
                    </span>
                </div>
                <div style={{
                    fontSize: 'var(--font-size-xs)',
                    color: '#6c757d',
                    fontWeight: '500',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                }}>
                    {/* 시작일 */}
                    {mapping.startDate ? (
                        <div>
                            <span style={{ fontWeight: '600', color: '#495057' }}>시작일:</span> {
                                (() => {
                                    try {
                                        return new Date(mapping.startDate).toLocaleDateString('ko-KR');
                                    } catch (error) {
                                        return '날짜 오류';
                                    }
                                })()
                            }
                        </div>
                    ) : null}
                    
                    {/* 생성일 (매핑 생성일) */}
                    {mapping.createdAt ? (
                        <div>
                            <span style={{ fontWeight: '600', color: '#495057' }}>생성일:</span> {
                                (() => {
                                    try {
                                        return new Date(mapping.createdAt).toLocaleDateString('ko-KR');
                                    } catch (error) {
                                        return '날짜 오류';
                                    }
                                })()
                            }
                        </div>
                    ) : null}
                    
                    {/* 승인일 */}
                    {mapping.adminApprovalDate ? (
                        <div>
                            <span style={{ fontWeight: '600', color: '#28a745' }}>승인일:</span> {
                                (() => {
                                    try {
                                        return new Date(mapping.adminApprovalDate).toLocaleDateString('ko-KR');
                                    } catch (error) {
                                        return '날짜 오류';
                                    }
                                })()
                            }
                        </div>
                    ) : null}
                    
                    {/* 결제일 */}
                    {mapping.paymentDate ? (
                        <div>
                            <span style={{ fontWeight: '600', color: '#007bff' }}>결제일:</span> {
                                (() => {
                                    try {
                                        return new Date(mapping.paymentDate).toLocaleDateString('ko-KR');
                                    } catch (error) {
                                        return '날짜 오류';
                                    }
                                })()
                            }
                        </div>
                    ) : null}
                    
                    {/* 날짜 정보가 없는 경우 */}
                    {!mapping.startDate && !mapping.createdAt && !mapping.adminApprovalDate && !mapping.paymentDate && (
                        <div style={{ color: '#dc3545', fontStyle: 'italic' }}>
                            날짜 정보 없음
                        </div>
                    )}
                </div>
            </div>

            <div style={{ padding: '20px' }}>
                <div className="participant-info" style={{
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
                            fontSize: 'var(--font-size-xs)',
                            color: '#6c757d',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '4px'
                        }}>상담사</div>
                        <div style={{
                            fontSize: 'var(--font-size-base)',
                            fontWeight: '600',
                            color: '#2c3e50',
                            marginBottom: '2px'
                        }}>
                            {mapping.consultant?.name || mapping.consultantName || '상담사 정보 없음'}
                        </div>
                        <div style={{
                            fontSize: 'var(--font-size-xs)',
                            color: '#6c757d'
                        }}>
                            {mapping.consultant?.email || ''}
                        </div>
                    </div>
                    <div style={{
                        fontSize: 'var(--font-size-xl)',
                        color: '#007bff',
                        fontWeight: 'bold'
                    }}>→</div>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{
                            fontSize: 'var(--font-size-xs)',
                            color: '#6c757d',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '4px'
                        }}>내담자</div>
                        <div style={{
                            fontSize: 'var(--font-size-base)',
                            fontWeight: '600',
                            color: '#2c3e50',
                            marginBottom: '2px'
                        }}>
                            {mapping.client?.name || mapping.clientName || '내담자 정보 없음'}
                        </div>
                        <div style={{
                            fontSize: 'var(--font-size-xs)',
                            color: '#6c757d'
                        }}>
                            {mapping.client?.email || ''}
                        </div>
                    </div>
                </div>

                <div className="session-info" style={{
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
                            fontSize: 'var(--font-size-xs)',
                            color: '#6c757d',
                            fontWeight: '500'
                        }}>패키지:</span>
                        <span style={{
                            fontSize: 'var(--font-size-sm)',
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
                            fontSize: 'var(--font-size-xs)',
                            color: '#6c757d',
                            fontWeight: '500'
                        }}>총 세션:</span>
                        <span style={{
                            fontSize: 'var(--font-size-sm)',
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
                            fontSize: 'var(--font-size-xs)',
                            color: '#6c757d',
                            fontWeight: '500'
                        }}>남은 세션:</span>
                        <span style={{
                            fontSize: 'var(--font-size-sm)',
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
                            fontSize: 'var(--font-size-xs)',
                            color: '#6c757d',
                            fontWeight: '500'
                        }}>가격:</span>
                        <span style={{
                            fontSize: 'var(--font-size-sm)',
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
                            fontSize: 'var(--font-size-xs)',
                            color: '#856404',
                            fontWeight: '600',
                            display: 'block',
                            marginBottom: '4px'
                        }}>메모:</span>
                        <span style={{
                            fontSize: 'var(--font-size-sm)',
                            color: '#856404',
                            lineHeight: 1.4
                        }}>{mapping.notes}</span>
                    </div>
                )}
            </div>

            <div className="action-buttons" style={{
                display: 'flex',
                gap: '8px',
                padding: '16px 20px',
                background: '#f8f9fa',
                borderTop: '1px solid #e1e8ed',
                justifyContent: 'flex-end'
            }}>
                {/* 결제 확인 버튼 - PENDING 상태일 때만 표시 */}
                {mapping.paymentStatus === 'PENDING' && (
                    <button 
                        style={{
                            padding: '4px 8px',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: 'var(--color-success, #28A745)',
                            color: 'var(--color-text-inverse, #FFFFFF)'
                        }}
                        onClick={() => {
                            setShowPaymentModal(true);
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#1e7e34';
                            e.target.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#28a745';
                            e.target.style.transform = 'translateY(0)';
                        }}
                    >
                        <i className="bi bi-check-circle"></i> 결제 확인
                    </button>
                )}
                
                {/* 입금 확인 버튼 - CONFIRMED 상태일 때만 표시 */}
                {mapping.paymentStatus === 'CONFIRMED' && (
                    <button 
                        style={{
                            padding: '4px 8px',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: '#007bff',
                            color: 'var(--color-text-inverse, #FFFFFF)'
                        }}
                        onClick={() => {
                            setShowDepositModal(true);
                        }}
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
                
                {/* ERP 연동 상태 표시 - APPROVED 상태일 때 */}
                {mapping.paymentStatus === 'APPROVED' && (
                    <div style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: '600',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: 'var(--color-success, #28A745)',
                        color: 'var(--color-text-inverse, #FFFFFF)'
                    }}>
                        <i className="bi bi-check-circle"></i>
                        ERP 연동완료
                    </div>
                )}
                
                {/* 승인/거부 버튼 - APPROVED 상태일 때만 표시 (입금 확인 완료 후) */}
                {mapping.paymentStatus === 'APPROVED' && mapping.status !== 'ACTIVE' && (
                    <>
                        <button 
                            style={{
                                padding: '4px 8px',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: 'var(--font-size-xs)',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                backgroundColor: 'var(--color-success, #28A745)',
                                color: 'var(--color-text-inverse, #FFFFFF)'
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
                                fontSize: 'var(--font-size-xs)',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                backgroundColor: '#dc3545',
                                color: 'var(--color-text-inverse, #FFFFFF)'
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
                                fontSize: 'var(--font-size-xs)',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                backgroundColor: 'var(--color-warning, #FFC107)',
                                color: 'var(--color-text-primary, #1D1D1F)'
                            }}
                            onClick={() => onEdit?.(mapping)}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = 'var(--color-warning-dark, #e0a800)';
                                e.target.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'var(--color-warning, #FFC107)';
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
                                fontSize: 'var(--font-size-xs)',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                backgroundColor: 'var(--color-gray, #6c757d)',
                                color: 'var(--color-text-inverse, #FFFFFF)'
                            }}
                            onClick={() => onTransfer?.(mapping)}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = 'var(--color-gray-dark, #5a6268)';
                                e.target.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'var(--color-gray, #6c757d)';
                                e.target.style.transform = 'translateY(0)';
                            }}
                        >
                            <i className="bi bi-arrow-left-right"></i> 상담사 변경
                        </button>
                        {mapping.remainingSessions > 0 && (
                            <button 
                                style={{
                                    padding: '4px 8px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: 'var(--font-size-xs)',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    backgroundColor: 'var(--color-danger, #DC3545)',
                                    color: 'var(--color-text-inverse, #FFFFFF)'
                                }}
                                onClick={() => onRefund?.(mapping)}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = 'var(--color-danger-dark, #c82333)';
                                    e.target.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = 'var(--color-danger, #DC3545)';
                                    e.target.style.transform = 'translateY(0)';
                                }}
                            >
                                <i className="bi bi-cash-coin"></i> 환불 처리
                            </button>
                        )}
                    </>
                )}
                <button 
                    style={{
                        padding: '4px 8px',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: 'var(--color-info, #17A2B8)',
                        color: 'var(--color-text-inverse, #FFFFFF)'
                    }}
                    onClick={() => onView?.(mapping)}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = 'var(--color-info-dark, #138496)';
                        e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'var(--color-info, #17A2B8)';
                        e.target.style.transform = 'translateY(0)';
                    }}
                >
                    <i className="bi bi-eye"></i> 상세보기
                </button>
                {mapping.clientId && (
                    <button 
                        style={{
                            padding: '4px 8px',
                            border: '1px solid var(--color-info, #17A2B8)',
                            borderRadius: '6px',
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: 'transparent',
                            color: 'var(--color-info, #17A2B8)'
                        }}
                        onClick={() => onViewTransferHistory?.(mapping.clientId)}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'var(--color-info, #17A2B8)';
                            e.target.style.color = 'var(--color-text-inverse, #FFFFFF)';
                            e.target.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.color = 'var(--color-info, #17A2B8)';
                            e.target.style.transform = 'translateY(0)';
                        }}
                    >
                        <i className="bi bi-clock-history"></i> 변경 이력
                    </button>
                )}
            </div>

            {/* 결제 확인 모달 */}
            <MappingPaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                mapping={mapping}
                onPaymentConfirmed={(mappingId) => {
                    setShowPaymentModal(false);
                    onConfirmPayment?.(mappingId);
                }}
            />
            
            {/* 입금 확인 모달 */}
            <MappingDepositModal
                isOpen={showDepositModal}
                onClose={() => setShowDepositModal(false)}
                mapping={mapping}
                onDepositConfirmed={(mappingId) => {
                    setShowDepositModal(false);
                    onConfirmDeposit?.(mappingId);
                }}
            />
        </div>
    );
};

export default MappingCard;

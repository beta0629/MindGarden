import React, { useState, useEffect } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import MGButton from '../common/MGButton';
import { User, Package, Plus, PauseCircle, CheckCircle } from 'lucide-react';
import { getStatusColor, getStatusIcon, getMappingStatusKoreanName } from '../../utils/codeHelper';

const MappingCard = ({ 
    mapping, 
    onClick,
    actions = null 
}) => {
    const [statusInfo, setStatusInfo] = useState({
        color: 'var(--color-gray)',
        icon: '❓',
        label: '로딩 중...'
    });

    useEffect(() => {
        const loadStatusInfo = async() => {
            try {
                const [statusColor, statusIcon, statusLabel] = await Promise.all([
                    getStatusColor(mapping.status, 'MAPPING_STATUS'),
                    getStatusIcon(mapping.status, 'MAPPING_STATUS'),
                    getMappingStatusKoreanName(mapping.status)
                ]);
                
                setStatusInfo({
                    color: statusColor,
                    icon: statusIcon,
                    label: statusLabel
                });
            } catch (error) {
                console.error('❌ 상태 정보 로드 실패:', error);
                setStatusInfo({
                    color: 'var(--color-gray)',
                    icon: '❓',
                    label: mapping.status || '알 수 없음'
                });
            }
        };

        loadStatusInfo();
    }, [mapping.status]);

    return(
        <div 
            className="mapping-card"
            onClick={ onClick }
            style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease',
                marginBottom: '12px'
            }}
        >
            <div style={ { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={ { display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #98FB98, #B6E5D8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#2F2F2F'
                    }}>
                        { mapping.clientName?.charAt(0) || '?' }
                    </div>
                    <div>
                        <h5 style={{ 
                            margin: '0 0 4px 0', 
                            fontSize: '16px', 
                            fontWeight: '600',
                            color: '#2F2F2F'
                        }}>
                            { mapping.clientName || '알 수 없음' }
                        </h5>
                        <span style={{
                            background: '#f3f4f6',
                            color: '#6B6B6B',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px'
                        }}>
                            내담자
                        </span>
                    </div>
                </div>
                
                <div style={{
                    background: statusInfo.color,
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500'
                }}>
                    { statusInfo.icon } { statusInfo.label }
                </div>
            </div>

            <div style={ { marginBottom: '12px' }}>
                <div style={ { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '14px', color: '#6B6B6B' }}>
                    <User size={ 14 } />
                    { mapping.consultantName }
                </div>
                <div style={ { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#6B6B6B' }}>
                    <Package size={ 14 } />
                    { mapping.packageName }
                </div>
            </div>

            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr 1fr', 
                gap: '8px',
                marginBottom: '12px'
            }}>
                <div style={ { textAlign: 'center', padding: '8px', background: '#f9fafb', borderRadius: '6px' }}>
                    <div style={ { fontSize: '12px', color: '#6B6B6B', marginBottom: '2px' }}>총</div>
                    <div style={ { fontSize: '16px', fontWeight: '600', color: '#2F2F2F' }}>{ mapping.totalSessions }</div>
                </div>
                <div style={ { textAlign: 'center', padding: '8px', background: '#fef2f2', borderRadius: '6px' }}>
                    <div style={ { fontSize: '12px', color: '#6B6B6B', marginBottom: '2px' }}>사용</div>
                    <div style={ { fontSize: '16px', fontWeight: '600', color: '#dc2626' }}>{ mapping.usedSessions }</div>
                </div>
                <div style={ { textAlign: 'center', padding: '8px', background: '#f0fdf4', borderRadius: '6px' }}>
                    <div style={ { fontSize: '12px', color: '#6B6B6B', marginBottom: '2px' }}>남은</div>
                    <div style={ { fontSize: '16px', fontWeight: '600', color: '#16a34a' }}>{ mapping.remainingSessions }</div>
                </div>
            </div>

            {actions && (
                <div style={{ display: 'flex', gap: '8px' }}>
                    { actions }
                </div>
            )}
        </div>
    );
};

export default MappingCard;
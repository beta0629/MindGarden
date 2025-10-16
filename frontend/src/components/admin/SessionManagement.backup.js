import React, { useState, useEffect } from 'react';
import IPhone17Card from '../common/IPhone17Card';
import IPhone17Button from '../common/IPhone17Button';
import IPhone17Modal from '../common/IPhone17Modal';
import IPhone17PageHeader from '../common/IPhone17PageHeader';
// import { useMoodTheme } from '../../hooks/useMoodTheme';
import { useResponsive } from '../common';


const SessionManagement = () => {
    const { currentMood, setMood } = useMoodTheme();
    const { isMobile } = useResponsive();
    
    const [clients, setClients] = useState([]);
    const [mappings, setMappings] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [selectedMapping, setSelectedMapping] = useState(null);

    // 더미 데이터
    useEffect(() => {
        const dummyClients = [
            { id: 1, name: '김민수', email: 'minsu@example.com' },
            { id: 2, name: '이영희', email: 'younghee@example.com' },
            { id: 3, name: '박철수', email: 'chulsoo@example.com' },
            { id: 4, name: '최지영', email: 'jiyoung@example.com' }
        ];

        const dummyMappings = [
            { 
                id: 1, 
                clientId: 1, 
                status: 'ACTIVE',
                totalSessions: 12,
                usedSessions: 8,
                remainingSessions: 4,
                consultant: { name: '김상담사' }
            },
            { 
                id: 2, 
                clientId: 2, 
                status: 'PENDING',
                totalSessions: 10,
                usedSessions: 3,
                remainingSessions: 7,
                consultant: { name: '이상담사' }
            }
        ];

        setClients(dummyClients);
        setMappings(dummyMappings);
    }, []);

    const handleClientSelect = (client) => {
        setSelectedClient(client);
        const clientMapping = mappings.find(m => m.clientId === client.id);
        setSelectedMapping(clientMapping || null);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'ACTIVE': return '#34c759';
            case 'PENDING': return '#ff9500';
            case 'COMPLETED': return '#007aff';
            default: return '#8e8e93';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'ACTIVE': return '활성';
            case 'PENDING': return '대기';
            case 'COMPLETED': return '완료';
            default: return '알 수 없음';
        }
    };

    return (
        <>
            <style>
                {`
                    @keyframes fadeInUp {
                        from { opacity: 0; transform: translateY(30px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes slideInLeft {
                        from { opacity: 0; transform: translateX(-30px); }
                        to { opacity: 1; transform: translateX(0); }
                    }
                    @keyframes bounceIn {
                        0% { opacity: 0; transform: scale(0.3); }
                        50% { opacity: 1; transform: scale(1.05); }
                        100% { opacity: 1; transform: scale(1); }
                    }
                `}
            </style>
            
            <div 
                data-mood={currentMood}
                
            >
                {/* 헤더 */}
                <div 
                    
                >
                    <div >
                        <h1 
                            
                    >
                        📊 회기 관리
                        </h1>
                        <p 
                            
                        >
                            내담자와 상담사의 회기 매칭을 관리합니다.
                        </p>
                    </div>
                    <div >
                        {['default', 'warm', 'cool', 'elegant', 'energetic'].map((mood, index) => (
                    <button 
                                key={mood}
                                onClick={() => setMood(mood)} 
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    border: 'none',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    animation: `bounceIn 0.6s ease-out ${0.5 + index * 0.1}s both`,
                                    background: currentMood === mood ? 'var(--mood-accent)' : 'rgba(142, 142, 147, 0.12)',
                                    color: currentMood === mood ? 'white' : 'var(--mood-accent)',
                                    transform: currentMood === mood ? 'scale(1.05)' : 'scale(1)'
                                }}
                            >
                                {mood.charAt(0).toUpperCase() + mood.slice(1)}
                    </button>
                        ))}
                </div>
            </div>

                {/* 통계 카드 */}
                <div 
                    
                >
                    {[
                        { icon: '👥', value: clients.length, label: '전체 내담자', color: '#007aff' },
                        { icon: '🤝', value: mappings.length, label: '활성 매칭', color: '#34c759' },
                        { icon: '⏳', value: mappings.filter(m => m.status === 'PENDING').length, label: '대기 중', color: '#ff9500' },
                        { icon: '✅', value: mappings.filter(m => m.status === 'COMPLETED').length, label: '완료됨', color: '#5856d6' }
                    ].map((stat, index) => (
                        <div
                            key={index}
                            style={{
                                background: 'var(--mood-card-bg)',
                                borderRadius: '16px',
                                padding: '24px',
                                boxShadow: 'var(--mood-shadow)',
                                border: '1px solid rgba(0, 0, 0, 0.04)',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                animation: `slideInLeft 0.6s ease-out ${0.6 + index * 0.1}s both`
                            }}
                        >
                            <div >
                                <div
                                    style={{
                                        width: '56px',
                                        height: '56px',
                                        borderRadius: '12px',
                                        background: `linear-gradient(135deg, ${stat.color}, ${stat.color}cc)`,
                        display: 'flex',
                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '24px',
                                        marginRight: '16px',
                                        boxShadow: `0 4px 12px ${stat.color}40`
                                    }}
                                >
                                    {stat.icon}
                        </div>
                                <div >
                                    <h3 
                            
                                    >
                                        {stat.value}
                                    </h3>
                                    <p 
                                        
                                    >
                                        {stat.label}
                                    </p>
                    </div>
                </div>
                        </div>
                    ))}
                </div>

                {/* 메인 컨텐츠 */}
                {isMobile ? (
                    // 모바일 레이아웃
                    <div >
                        {clients.map((client, index) => {
                        const clientMappings = mappings.filter(mapping => mapping.clientId === client.id);
                        const activeMappings = clientMappings.filter(mapping => mapping.status === 'ACTIVE');
                        
                        return (
                            <div 
                                key={client.id}
                                    style={{
                                        background: 'var(--mood-card-bg)',
                                        borderRadius: '16px',
                                        padding: '20px',
                                        boxShadow: 'var(--mood-shadow)',
                                        border: '1px solid rgba(0, 0, 0, 0.04)',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        animation: `slideInLeft 0.6s ease-out ${0.8 + index * 0.1}s both`,
                                        transform: selectedClient?.id === client.id ? 'scale(1.02)' : 'scale(1)'
                                    }}
                                onClick={() => handleClientSelect(client)}
                            >
                                    <div >
                                        <div
                                            
                                        >
                                            {client.name.charAt(0)}
                                    </div>
                                        <div >
                                            <h3 
                                                
                                            >
                                                {client.name}
                                            </h3>
                                            <p 
                                                
                                            >
                                                {client.email}
                                            </p>
                                </div>
                                        <div
                                            
                                        >
                                            매칭 {clientMappings.length}개
                                </div>
                            </div>
                            
                                    <div >
                                        <div >
                                            <span>✅</span>
                                            <span>활성: {activeMappings.length}개</span>
                            </div>
                                        <div >
                                            <span>📊</span>
                                            <span>총: {clientMappings.length}개</span>
                        </div>
                        </div>
                </div>
                            );
                        })}

                            {selectedClient && (
                            <div 
                                
                            >
                                <h3 
                                    
                                >
                                    선택된 내담자: {selectedClient.name}
                        </h3>
                                
                                {selectedMapping ? (
                                    <div >
                                        {[
                                            { label: '상담사', value: selectedMapping.consultant?.name || '알 수 없음' },
                                            { label: '총 회기', value: `${selectedMapping.totalSessions || 0}회` },
                                            { label: '사용 회기', value: `${selectedMapping.usedSessions || 0}회` },
                                            { label: '남은 회기', value: `${selectedMapping.remainingSessions || 0}회` },
                                            { label: '상태', value: getStatusText(selectedMapping.status), isStatus: true }
                                        ].map((item, index) => (
                                            <div
                                                key={index}
                                                
                                            >
                                                <span >
                                                    {item.label}:
                                                </span>
                                                {item.isStatus ? (
                                                    <span 
                                
                                                    >
                                                        {item.value}
                                </span>
                                                ) : (
                                                    <span >
                                                        {item.value}
                                        </span>
                                                )}
                                    </div>
                                        ))}
                                        
                                <button 
                                            
                                        >
                                            <span>➕</span>
                                            회기 추가 요청
                                </button>
                                    </div>
                                ) : (
                                    <div >
                                        <p >
                                            이 내담자에 대한 상담사 매칭이 없습니다.
                                        </p>
                                <button 
                                            
                                        >
                                            <span>➕</span>
                                    회기 추가 요청
                                </button>
                            </div>
                                )}
                        </div>
                        )}
                </div>
                ) : (
                    // 데스크탑 레이아웃
                    <div >
                        {/* 사이드바 */}
                        <div 
                            
                        >
                            <h3 
                                
                            >
                                내담자 목록
                            </h3>
                            
                            <div >
                                {clients.map((client, index) => {
                                    const clientMappings = mappings.filter(mapping => mapping.clientId === client.id);
                                    const activeMappings = clientMappings.filter(mapping => mapping.status === 'ACTIVE');
                                    
                                    return (
                                        <div
                                            key={client.id}
                                            
                                            onClick={() => handleClientSelect(client)}
                                        >
                                            <div >
                                                <div
                                                    
                                                >
                                                    {client.name.charAt(0)}
                        </div>
                                                <div >
                                                    <div >
                                                        {client.name}
                    </div>
                                                    <div >
                                                        매칭 {clientMappings.length}개 (활성 {activeMappings.length}개)
                </div>
                    </div>
                                        </div>
                                </div>
                                    );
                                })}
                                    </div>
                                    </div>
                                    
                        {/* 메인 컨텐츠 */}
                        <div 
                            
                        >
                            {selectedClient ? (
                                <div>
                                    <h3 
                                        
                                    >
                                        {selectedClient.name} - 상담 매칭 정보
                                    </h3>
                                    
                                    {selectedMapping ? (
                                        <div >
                                            {[
                                                { label: '상담사', value: selectedMapping.consultant?.name || '알 수 없음' },
                                                { label: '총 회기', value: `${selectedMapping.totalSessions || 0}회` },
                                                { label: '사용 회기', value: `${selectedMapping.usedSessions || 0}회` },
                                                { label: '남은 회기', value: `${selectedMapping.remainingSessions || 0}회` }
                                            ].map((item, index) => (
                                                <div
                                                    key={index}
                                                    
                                                >
                                                    <div >
                                                        {item.label}
                                </div>
                                                    <div >
                                                        {item.value}
                            </div>
                    </div>
                                            ))}
                                            
                                            <div
                                                
                                            >
                                                <div >상태</div>
                                                <div >
                                                    {getStatusText(selectedMapping.status)}
                            </div>
                            </div>
                        </div>
                                    ) : (
                                        <div >
                                            <p >
                                                이 내담자에 대한 상담사 매칭이 없습니다.
                                            </p>
                            <button 
                                                
                                            >
                                                회기 추가 요청
                            </button>
                        </div>
                                    )}
                    </div>
                            ) : (
                                <div >
                                    <div >👈</div>
                                    <p >
                                        왼쪽에서 내담자를 선택하세요
                                    </p>
                </div>
            )}
                    </div>
                </div>
            )}
                </div>
        </>
    );
};

export default SessionManagement;

import React, { useState, useEffect, useRef } from 'react';
import { apiPost, apiGet } from '../../utils/ajax';
import { TRAINING_API } from '../../constants/trainingApi';
import { TRAINING_CSS } from '../../constants/trainingCss';
import './VirtualClientSimulator.css';

/**
 * 가상 내담자 시뮬레이터 컴포넌트
 *
 * 초보 상담사가 다양한 시나리오로 연습할 수 있는 시뮬레이터
 *
 * @param {Object} props
 * @param {number} props.consultantId - 상담사 ID
 */
const VirtualClientSimulator = ({ consultantId }) => {
    const [session, setSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isSessionActive, setIsSessionActive] = useState(false);
    const messagesEndRef = useRef(null);

    // 시나리오 선택
    const [selectedScenario, setSelectedScenario] = useState('');
    const [difficultyLevel, setDifficultyLevel] = useState('MEDIUM');

    const scenarios = [
        { value: '우울증', label: '우울증 내담자' },
        { value: '불안장애', label: '불안장애 내담자' },
        { value: '성격장애', label: '성격장애 내담자' },
        { value: '자살위기', label: '자살 위기 내담자 (고난이도)' },
        { value: '가족갈등', label: '가족 갈등 내담자' },
    ];

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    /**
     * 시뮬레이션 시작
     */
    const startSimulation = async () => {
        if (!selectedScenario) {
            alert('시나리오를 선택해주세요');
            return;
        }

        try {
            const data = await apiPost('/api/v1/training/virtual-client/create', {
                consultantId,
                scenarioType: selectedScenario,
                difficultyLevel,
            });

            if (data && data.success) {
                setSession(data.session);
                setIsSessionActive(true);

                // 가상 내담자의 첫 인사
                const openingMessage = data.session.presentingProblem || '안녕하세요...';
                setMessages([{
                    role: 'client',
                    message: openingMessage,
                    timestamp: new Date().toLocaleTimeString('ko-KR'),
                }]);
            }

        } catch (error) {
            console.error('시뮬레이션 시작 실패:', error);
            alert('시뮬레이션을 시작할 수 없습니다');
        }
    };

    /**
     * 메시지 전송
     */
    const sendMessage = async () => {
        if (!currentMessage.trim() || !session) return;

        // 상담사 메시지 추가
        const counselorMsg = {
            role: 'counselor',
            message: currentMessage,
            timestamp: new Date().toLocaleTimeString('ko-KR'),
        };

        setMessages(prev => [...prev, counselorMsg]);
        setCurrentMessage('');
        setIsTyping(true);

        try {
            const data = await apiPost(
                `/api/v1/training/virtual-client/${session.id}/message`,
                { message: currentMessage }
            );

            if (data && data.success) {
                // 가상 내담자 응답 추가
                setTimeout(() => {
                    setMessages(prev => [...prev, {
                        role: 'client',
                        message: data.clientResponse,
                        timestamp: new Date().toLocaleTimeString('ko-KR'),
                    }]);
                    setIsTyping(false);
                }, 1000);
            }

        } catch (error) {
            console.error('메시지 전송 실패:', error);
            setIsTyping(false);
        }
    };

    /**
     * 세션 종료
     */
    const endSession = async () => {
        if (!session) return;

        try {
            const data = await apiPost(
                `/api/v1/training/virtual-client/${session.id}/complete`
            );

            if (data && data.success) {
                setIsSessionActive(false);
                alert(`시뮬레이션 완료!\n\n평가 점수: ${(data.performanceScore * 100).toFixed(0)}점\n턴 수: ${data.turnCount}\n\n${data.evaluation}`);
            }

        } catch (error) {
            console.error('세션 종료 실패:', error);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="virtual-client-simulator">
            {!isSessionActive ? (
                <div className="simulator-setup">
                    <h2>🤖 가상 내담자 시뮬레이터</h2>
                    <p>다양한 시나리오로 상담 기술을 연습하세요</p>

                    <div className="setup-form">
                        <div className="form-group">
                            <label>시나리오 선택</label>
                            <select
                                value={selectedScenario}
                                onChange={(e) => setSelectedScenario(e.target.value)}
                                className="form-control"
                            >
                                <option value="">선택하세요</option>
                                {scenarios.map(s => (
                                    <option key={s.value} value={s.value}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>난이도</label>
                            <select
                                value={difficultyLevel}
                                onChange={(e) => setDifficultyLevel(e.target.value)}
                                className="form-control"
                            >
                                <option value="BEGINNER">초급</option>
                                <option value="INTERMEDIATE">중급</option>
                                <option value="ADVANCED">고급</option>
                            </select>
                        </div>

                        <button
                            className="btn btn-primary btn-lg"
                            onClick={startSimulation}
                            disabled={!selectedScenario}
                        >
                            시뮬레이션 시작
                        </button>
                    </div>
                </div>
            ) : (
                <div className="simulator-active">
                    <div className="simulator-header">
                        <div className="session-info">
                            <h3>시나리오: {session.scenarioType}</h3>
                            <span className="turn-count">턴: {messages.length / 2}</span>
                        </div>
                        <button
                            className="btn btn-danger"
                            onClick={endSession}
                        >
                            세션 종료 및 평가
                        </button>
                    </div>

                    <div className="chat-container">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`chat-message ${msg.role === 'counselor' ? 'counselor' : 'client'}`}
                            >
                                <div className="message-header">
                                    <span className="role-label">
                                        {msg.role === 'counselor' ? '상담사' : '내담자'}
                                    </span>
                                    <span className="message-time">{msg.timestamp}</span>
                                </div>
                                <div className="message-content">
                                    {msg.message}
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="chat-message client typing">
                                <div className="typing-indicator">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chat-input-container">
                        <textarea
                            value={currentMessage}
                            onChange={(e) => setCurrentMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="상담사로서 응답하세요... (Enter: 전송, Shift+Enter: 줄바꿈)"
                            className="chat-input"
                            rows="3"
                            disabled={isTyping}
                        />
                        <button
                            className="btn btn-primary"
                            onClick={sendMessage}
                            disabled={!currentMessage.trim() || isTyping}
                        >
                            전송
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VirtualClientSimulator;

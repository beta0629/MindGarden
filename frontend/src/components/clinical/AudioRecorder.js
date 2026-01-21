import React, { useState, useRef, useEffect } from 'react';
import { apiPostFormData } from '../../utils/ajax';
import { CLINICAL_API } from '../../constants/clinicalApi';
import { CLINICAL_CSS } from '../../constants/clinicalCss';
import './AudioRecorder.css';

/**
 * 음성 녹음 컴포넌트
 * MediaRecorder API를 사용한 실시간 음성 녹음 및 업로드
 *
 * @param {Object} props
 * @param {number} props.consultationId - 상담 ID
 * @param {number} props.consultationRecordId - 상담 기록 ID
 * @param {Function} props.onRecordingComplete - 녹음 완료 콜백
 */
export const AudioRecorder = ({
    consultationId,
    consultationRecordId,
    onRecordingComplete
}) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState(null);

    const mediaRecorder = useRef(null);
    const audioChunks = useRef([]);
    const timerInterval = useRef(null);
    const audioContext = useRef(null);
    const analyser = useRef(null);
    const canvasRef = useRef(null);
    const animationId = useRef(null);

    // 컴포넌트 언마운트 시 정리
    useEffect(() => {
        return () => {
            if (timerInterval.current) {
                clearInterval(timerInterval.current);
            }
            if (animationId.current) {
                cancelAnimationFrame(animationId.current);
            }
            if (audioContext.current) {
                audioContext.current.close();
            }
        };
    }, []);

    /**
     * 녹음 시작
     */
    const startRecording = async () => {
        try {
            setError(null);

            // 마이크 권한 요청
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });

            // MediaRecorder 설정
            const options = {
                mimeType: 'audio/webm;codecs=opus',
                audioBitsPerSecond: 128000
            };

            mediaRecorder.current = new MediaRecorder(stream, options);
            audioChunks.current = [];

            // 데이터 수신 이벤트
            mediaRecorder.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.current.push(event.data);
                }
            };

            // 녹음 완료 이벤트
            mediaRecorder.current.onstop = () => {
                const audioBlob = new Blob(audioChunks.current, {
                    type: 'audio/webm;codecs=opus'
                });
                setAudioBlob(audioBlob);

                // 스트림 정리
                stream.getTracks().forEach(track => track.stop());
            };

            // 녹음 시작
            mediaRecorder.current.start();
            setIsRecording(true);
            setIsPaused(false);
            setRecordingTime(0);

            // 타이머 시작
            timerInterval.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

            // 파형 시각화 시작
            setupAudioVisualization(stream);

            console.log('🎤 녹음 시작');

        } catch (error) {
            console.error('녹음 시작 실패:', error);
            setError('마이크 접근 권한이 필요합니다.');
        }
    };

    /**
     * 녹음 일시정지/재개
     */
    const togglePause = () => {
        if (!mediaRecorder.current) return;

        if (isPaused) {
            mediaRecorder.current.resume();
            setIsPaused(false);

            // 타이머 재개
            timerInterval.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } else {
            mediaRecorder.current.pause();
            setIsPaused(true);

            // 타이머 일시정지
            if (timerInterval.current) {
                clearInterval(timerInterval.current);
            }
        }
    };

    /**
     * 녹음 중지
     */
    const stopRecording = () => {
        if (!mediaRecorder.current) return;

        mediaRecorder.current.stop();
        setIsRecording(false);
        setIsPaused(false);

        // 타이머 정지
        if (timerInterval.current) {
            clearInterval(timerInterval.current);
        }

        // 시각화 정지
        if (animationId.current) {
            cancelAnimationFrame(animationId.current);
        }

        console.log('⏹️ 녹음 중지');
    };

    /**
     * 녹음 파일 업로드
     */
    const uploadRecording = async () => {
        if (!audioBlob) return;

        try {
            setIsUploading(true);
            setUploadProgress(0);
            setError(null);

            // FormData 생성
            const formData = new FormData();
            const filename = `recording_${Date.now()}.webm`;
            formData.append('file', audioBlob, filename);

            // 표준화된 API 호출 사용
            const endpoint = consultationRecordId
                ? `${CLINICAL_API.UPLOAD_AUDIO(consultationId)}?consultationRecordId=${consultationRecordId}`
                : CLINICAL_API.UPLOAD_AUDIO(consultationId);

            const data = await apiPostFormData(endpoint, formData);

            if (!data || !data.success) {
                throw new Error(data?.message || '업로드 실패');
            }

            setUploadProgress(100);
            setIsUploading(false);

            console.log('✅ 업로드 완료:', data);

            // 콜백 호출
            if (onRecordingComplete) {
                onRecordingComplete(data);
            }

            // 초기화
            setAudioBlob(null);
            setRecordingTime(0);

        } catch (error) {
            console.error('❌ 업로드 실패:', error);
            setError('음성 파일 업로드에 실패했습니다.');
            setIsUploading(false);
        }
    };

    /**
     * 녹음 취소
     */
    const cancelRecording = () => {
        setAudioBlob(null);
        setRecordingTime(0);
        audioChunks.current = [];
    };

    /**
     * 파형 시각화 설정
     */
    const setupAudioVisualization = (stream) => {
        try {
            audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
            analyser.current = audioContext.current.createAnalyser();

            const source = audioContext.current.createMediaStreamSource(stream);
            source.connect(analyser.current);

            analyser.current.fftSize = 256;
            const bufferLength = analyser.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            // 캔버스에 파형 그리기
            const canvas = canvasRef.current;
            if (!canvas) return;

            const canvasCtx = canvas.getContext('2d');
            const WIDTH = canvas.width;
            const HEIGHT = canvas.height;

            const draw = () => {
                animationId.current = requestAnimationFrame(draw);

                analyser.current.getByteFrequencyData(dataArray);

                canvasCtx.fillStyle = 'rgb(240, 240, 240)';
                canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

                const barWidth = (WIDTH / bufferLength) * 2.5;
                let barHeight;
                let x = 0;

                for (let i = 0; i < bufferLength; i++) {
                    barHeight = (dataArray[i] / 255) * HEIGHT * 0.8;

                    const gradient = canvasCtx.createLinearGradient(0, HEIGHT - barHeight, 0, HEIGHT);
                    gradient.addColorStop(0, '#4a90e2');
                    gradient.addColorStop(1, '#2563eb');

                    canvasCtx.fillStyle = gradient;
                    canvasCtx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);

                    x += barWidth + 1;
                }
            };

            draw();

        } catch (error) {
            console.error('파형 시각화 설정 실패:', error);
        }
    };

    /**
     * 시간 포맷팅 (초 -> MM:SS)
     */
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className={CLINICAL_CSS.AUDIO_RECORDER}>
            <div className="audio-recorder-header">
                <h3>🎤 음성 녹음</h3>
                {recordingTime > 0 && (
                    <div className="recording-time">
                        {isRecording && <span className="recording-indicator">●</span>}
                        <span className="time-display">{formatTime(recordingTime)}</span>
                    </div>
                )}
            </div>

            {/* 파형 시각화 */}
            <div className="waveform-container">
                <canvas
                    ref={canvasRef}
                    width="600"
                    height="100"
                    className="waveform-canvas"
                />
                {!isRecording && !audioBlob && (
                    <div className="waveform-placeholder">
                        <p>녹음 버튼을 눌러 시작하세요</p>
                    </div>
                )}
            </div>

            {/* 에러 메시지 */}
            {error && (
                <div className="error-message">
                    ⚠️ {error}
                </div>
            )}

            {/* 컨트롤 버튼 */}
            <div className="audio-recorder-controls">
                {!isRecording && !audioBlob && (
                    <button
                        className="btn btn-primary btn-start-recording"
                        onClick={startRecording}
                    >
                        🎤 녹음 시작
                    </button>
                )}

                {isRecording && (
                    <>
                        <button
                            className="btn btn-secondary"
                            onClick={togglePause}
                        >
                            {isPaused ? '▶️ 재개' : '⏸️ 일시정지'}
                        </button>
                        <button
                            className="btn btn-danger"
                            onClick={stopRecording}
                        >
                            ⏹️ 중지
                        </button>
                    </>
                )}

                {audioBlob && !isUploading && (
                    <>
                        <button
                            className="btn btn-success btn-upload"
                            onClick={uploadRecording}
                        >
                            ⬆️ 업로드 및 전사 시작
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={cancelRecording}
                        >
                            ❌ 취소
                        </button>
                    </>
                )}

                {isUploading && (
                    <div className="upload-progress">
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                        <p>업로드 중... {uploadProgress}%</p>
                    </div>
                )}
            </div>

            {/* 녹음 안내 */}
            {!isRecording && !audioBlob && (
                <div className="recording-tips">
                    <p><strong>녹음 팁:</strong></p>
                    <ul>
                        <li>조용한 환경에서 녹음하세요</li>
                        <li>마이크와 적절한 거리를 유지하세요</li>
                        <li>최대 녹음 시간: 60분</li>
                        <li>지원 형식: WAV, MP3, M4A</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default AudioRecorder;

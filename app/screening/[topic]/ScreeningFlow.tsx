'use client';

import { useState } from 'react';
import { ScreeningData, TargetGroup } from '@/lib/screening-data';

interface Props {
  data: ScreeningData;
}

type Step = 'target' | 'quiz' | 'result';

export default function ScreeningFlow({ data }: Props) {
  const [step, setStep] = useState<Step>('target');
  const [target, setTarget] = useState<TargetGroup | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);

  const questions = target ? data.questions[target] : [];

  const handleTargetSelect = (t: TargetGroup) => {
    setTarget(t);
    setStep('quiz');
    setCurrentIndex(0);
    setScore(0);
  };

  const handleAnswer = (points: number) => {
    setScore((prev) => prev + points);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setStep('result');
    }
  };

  const openConsultation = () => {
    window.dispatchEvent(new Event('open-consultation-bottom-sheet'));
  };

  const resetFlow = () => {
    setStep('target');
    setTarget(null);
    setCurrentIndex(0);
    setScore(0);
  };

  // 결과 판정 (임의 로직: 문항당 최대 3점, 총점 기반 3단계 밴드)
  const maxScore = questions.length * 3;
  const getResultBand = () => {
    const ratio = score / maxScore;
    if (ratio < 0.33) return { level: '양호', desc: '현재 특별한 증상이 관찰되지 않습니다. 일상적인 스트레스 관리로 충분해 보입니다.' };
    if (ratio < 0.66) return { level: '주의', desc: '일부 증상이 관찰되며 일상생활에 약간의 불편함이 있을 수 있습니다. 전문가와의 상담을 고려해 보시는 것을 권장합니다.' };
    return { level: '심각', desc: '증상의 정도가 높아 일상생활에 상당한 어려움이 예상됩니다. 가급적 빠른 시일 내에 전문가의 도움을 받으시길 권장합니다.' };
  };

  return (
    <>
      <div className="screening-flow-header">
        <h1 className="screening-flow-title">{data.title}</h1>
      </div>

      {step === 'target' && (
        <div className="screening-target-select">
          <p style={{ textAlign: 'center', marginBottom: '16px', color: 'var(--text-sub)' }}>
            검사를 진행할 대상군을 선택해 주세요.
          </p>
          <button className="screening-target-btn" onClick={() => handleTargetSelect('adult')}>
            일반 성인
          </button>
          <button className="screening-target-btn" onClick={() => handleTargetSelect('child')}>
            아동·청소년
          </button>
          <button className="screening-target-btn" onClick={() => handleTargetSelect('woman')}>
            여성
          </button>
        </div>
      )}

      {step === 'quiz' && target && (
        <div className="screening-question-container">
          <div className="screening-progress">
            <span>진행 상황</span>
            <span>{currentIndex + 1} / {questions.length}</span>
          </div>
          <div className="screening-progress-bar">
            <div 
              className="screening-progress-fill" 
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>

          <h3 className="screening-question-text">{questions[currentIndex].text}</h3>

          <div className="screening-options">
            <button className="screening-option-btn" onClick={() => handleAnswer(0)}>전혀 그렇지 않다</button>
            <button className="screening-option-btn" onClick={() => handleAnswer(1)}>가끔 그렇다</button>
            <button className="screening-option-btn" onClick={() => handleAnswer(2)}>자주 그렇다</button>
            <button className="screening-option-btn" onClick={() => handleAnswer(3)}>매우 자주 그렇다</button>
          </div>
        </div>
      )}

      {step === 'result' && (
        <div className="screening-result">
          <div className="screening-result-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h2 className="screening-result-title">검사 결과: {getResultBand().level}</h2>
          <p className="screening-result-desc">{getResultBand().desc}</p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
            <button className="screening-btn-primary" onClick={openConsultation}>
              상담 예약하기
            </button>
            <button 
              className="screening-btn-primary" 
              style={{ background: 'var(--surface-2)', color: 'var(--text-main)', border: '1px solid var(--border-soft)' }}
              onClick={resetFlow}
            >
              다시 검사하기
            </button>
          </div>

          <div className="screening-disclaimer">
            <p>본 자가진단 테스트는 귀하의 현재 심리적 상태를 간단히 점검해 보기 위한 목적으로 제공됩니다. 이 결과는 의학적 진단이나 전문적인 심리 평가를 대신할 수 없습니다.</p>
            <p>테스트 결과가 귀하의 모든 심리적 어려움이나 질환을 완벽하게 반영하는 것은 아니며, 결과에 관계없이 일상생활에서 지속적인 불편함을 느끼신다면 반드시 전문가의 도움을 받으셔야 합니다.</p>
            <p>본 센터는 이 자가진단 테스트의 결과로 인해 발생하는 어떠한 결정이나 행동, 그리고 그에 따른 결과에 대해 법적 또는 의학적 책임을 지지 않습니다.</p>
            <p>정확한 진단과 맞춤형 치료 계획을 위해서는 정신건강의학과 전문의 또는 임상심리전문가와의 대면 상담 및 정식 심리검사가 필수적임을 알려드립니다.</p>
          </div>
        </div>
      )}
    </>
  );
}

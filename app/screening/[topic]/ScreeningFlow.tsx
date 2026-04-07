'use client';

import Link from 'next/link';
import { useState } from 'react';
import { checklistLegalNotice } from '@/lib/checklist-legal-notice';
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
    if (ratio < 0.33)
      return {
        level: '양호에 가까운 응답',
        desc: '응답만으로는 어려움의 정도를 알 수 없습니다. 일상에서 불편이 거의 없다면 참고용으로만 활용하시면 됩니다.',
      };
    if (ratio < 0.66)
      return {
        level: '추가로 살펴볼 응답',
        desc: '여러 영역에서 어려움을 느끼신다면 전문가와 이야기 나누는 것이 도움이 될 수 있습니다.',
      };
    return {
      level: '전문 상담을 권하는 응답',
      desc: '응답이 높은 편입니다. 정확한 이해를 위해 전문가와 상담·평가를 고려해 보시길 권합니다.',
    };
  };

  return (
    <>
      <div className="screening-flow-header">
        <h1 className="screening-flow-title">{data.title}</h1>
      </div>

      {step === 'target' && (
        <div className="screening-target-select">
          <p style={{ textAlign: 'center', marginBottom: '16px', color: 'var(--text-sub)' }}>
            점검을 진행할 대상군을 선택해 주세요.
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
          <h2 className="screening-result-title">응답 요약: {getResultBand().level}</h2>
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
              다시 점검하기
            </button>
          </div>

          <div className="screening-disclaimer" role="note">
            {checklistLegalNotice.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            <p>
              {checklistLegalNotice.psychoExamBeforeLink}
              <Link href="/programs/test" className="adhd-self-check-inline-link">
                심리검사
              </Link>
              {checklistLegalNotice.psychoExamAfterLink}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

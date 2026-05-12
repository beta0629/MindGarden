/**
 * SelfAssessment — 자가 심리검사 상세 (웰니스 하위)
 *
 * PHQ-9(우울) / GAD-7(불안) / PSS(스트레스) 문항 UI + 점수 계산 + 해석 카드
 * 백엔드 API 미구축 → localStorage 목업으로 대체.
 * ClientAppShell 레이아웃 내에서 렌더링.
 *
 * @author MindGarden
 * @since 2026-05-12
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Heart, Brain, Activity, ChevronRight } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import './SelfAssessment.css';

const STORAGE_KEY = 'mg_self_assessment';

const OPTION_LABELS = [
  { score: 0, label: '전혀 아니다' },
  { score: 1, label: '며칠 동안' },
  { score: 2, label: '절반 이상' },
  { score: 3, label: '거의 매일' },
];

const ASSESSMENTS = {
  PHQ9: {
    name: 'PHQ-9 우울 검사',
    desc: '지난 2주 동안의 우울 증상을 평가합니다.',
    questions: [
      '일에 대한 흥미나 즐거움이 거의 없다.',
      '기분이 가라앉거나, 우울하거나, 희망이 없다고 느꼈다.',
      '잠들기 어렵거나, 자주 깼다, 또는 너무 많이 잤다.',
      '피곤하거나 기력이 없다고 느꼈다.',
      '식욕이 줄었거나 과식을 했다.',
      '자신이 나쁜 사람이라고 느끼거나, 실패자라고 느꼈다.',
      '신문을 읽거나 TV를 볼 때 집중하기 어려웠다.',
      '다른 사람들이 눈치챌 정도로 느리게 움직이거나 반대로 안절부절했다.',
      '차라리 죽는 것이 낫겠다는 생각을 했다.',
    ],
    interpret: (score) => {
      if (score <= 4) return { level: '정상', severity: 'minimal', desc: '현재 우울 증상이 거의 없습니다. 건강한 심리 상태를 유지하고 계세요.' };
      if (score <= 9) return { level: '경미한 우울', severity: 'mild', desc: '약간의 우울 증상이 있습니다. 자기 돌봄에 신경 쓰시고, 지속되면 전문가 상담을 권합니다.' };
      if (score <= 14) return { level: '중등도 우울', severity: 'moderate', desc: '중등도의 우울 증상이 있습니다. 전문 상담사와 상담을 받아보시는 것을 권합니다.' };
      return { level: '심한 우울', severity: 'severe', desc: '심한 우울 증상이 있습니다. 가능한 빨리 전문가 상담을 받으시길 강력히 권합니다.' };
    },
  },
  GAD7: {
    name: 'GAD-7 불안 검사',
    desc: '지난 2주 동안의 불안 증상을 평가합니다.',
    questions: [
      '초조하거나 불안하거나 조마조마하게 느꼈다.',
      '걱정하는 것을 멈추거나 조절할 수 없었다.',
      '여러 가지 것들에 대해 지나치게 걱정했다.',
      '편하게 있기가 어려웠다.',
      '너무 안절부절해서 가만히 있기 어려웠다.',
      '쉽게 짜증이 나거나 화가 났다.',
      '마치 끔찍한 일이 일어날 것 같은 두려움을 느꼈다.',
    ],
    interpret: (score) => {
      if (score <= 4) return { level: '정상', severity: 'minimal', desc: '현재 불안 증상이 거의 없습니다.' };
      if (score <= 9) return { level: '경미한 불안', severity: 'mild', desc: '약간의 불안 증상이 있습니다. 이완 기법이나 호흡법을 시도해보세요.' };
      if (score <= 14) return { level: '중등도 불안', severity: 'moderate', desc: '중등도의 불안 증상이 있습니다. 전문 상담을 권합니다.' };
      return { level: '심한 불안', severity: 'severe', desc: '심한 불안 증상이 있습니다. 전문가 상담을 강력히 권합니다.' };
    },
  },
  PSS: {
    name: 'PSS 스트레스 검사',
    desc: '지난 한 달 동안의 스트레스 수준을 평가합니다.',
    questions: [
      '예상치 못한 일이 생겨서 기분이 상한 적이 있다.',
      '중요한 일을 통제할 수 없다고 느낀 적이 있다.',
      '초조하거나 스트레스를 받고 있다고 느낀 적이 있다.',
      '개인적 문제를 다루는 능력에 자신감을 느낀 적이 있다.',
      '일이 자기 뜻대로 진행되고 있다고 느낀 적이 있다.',
      '해야 할 일에 대처할 수 없다고 느낀 적이 있다.',
      '일상의 짜증을 잘 다룰 수 있었다.',
      '자신이 상황을 잘 통제하고 있다고 느낀 적이 있다.',
      '통제 밖의 일 때문에 화가 난 적이 있다.',
      '어려운 일이 쌓여서 극복할 수 없다고 느낀 적이 있다.',
    ],
    interpret: (score) => {
      if (score <= 13) return { level: '낮은 스트레스', severity: 'minimal', desc: '스트레스 수준이 낮습니다. 현재 상태를 잘 유지하세요.' };
      if (score <= 26) return { level: '보통 스트레스', severity: 'mild', desc: '보통 수준의 스트레스를 느끼고 있습니다. 스트레스 관리 기법을 활용해보세요.' };
      return { level: '높은 스트레스', severity: 'moderate', desc: '높은 수준의 스트레스를 느끼고 있습니다. 전문 상담을 권합니다.' };
    },
  },
};

const SELECT_CARDS = [
  { key: 'PHQ9', name: 'PHQ-9 우울 검사', desc: '9문항 · 약 3분', iconClass: 'self-assess__select-icon--phq9', IconComp: Heart },
  { key: 'GAD7', name: 'GAD-7 불안 검사', desc: '7문항 · 약 2분', iconClass: 'self-assess__select-icon--gad7', IconComp: Brain },
  { key: 'PSS', name: 'PSS 스트레스 검사', desc: '10문항 · 약 4분', iconClass: 'self-assess__select-icon--pss', IconComp: Activity },
];

const getHistory = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveResult = (type, score, interpretation) => {
  const history = getHistory();
  history.unshift({
    type,
    score,
    level: interpretation.level,
    severity: interpretation.severity,
    date: new Date().toISOString(),
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 50)));
};

const SelfAssessment = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get('type');

  const [selectedType, setSelectedType] = useState(typeParam || null);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [history, setHistory] = useState([]);

  const assessment = selectedType ? ASSESSMENTS[selectedType] : null;
  const questionCount = assessment?.questions?.length || 0;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questionCount;
  const progressPercent = questionCount > 0 ? (answeredCount / questionCount) * 100 : 0;

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  useEffect(() => {
    if (typeParam && ASSESSMENTS[typeParam]) {
      setSelectedType(typeParam);
      setAnswers({});
      setShowResult(false);
    }
  }, [typeParam]);

  const totalScore = useMemo(() => {
    return Object.values(answers).reduce((sum, v) => sum + v, 0);
  }, [answers]);

  const interpretation = useMemo(() => {
    if (!assessment || !allAnswered) return null;
    return assessment.interpret(totalScore);
  }, [assessment, allAnswered, totalScore]);

  const handleAnswer = (qIdx, score) => {
    setAnswers((prev) => ({ ...prev, [qIdx]: score }));
  };

  const handleSubmit = () => {
    if (!allAnswered || !interpretation) return;
    saveResult(selectedType, totalScore, interpretation);
    setHistory(getHistory());
    setShowResult(true);
    showToast({ message: '검사 결과가 저장되었습니다.', type: 'success' });
  };

  const handleReset = () => {
    setSelectedType(null);
    setAnswers({});
    setShowResult(false);
  };

  const handleSelectType = (type) => {
    setSelectedType(type);
    setAnswers({});
    setShowResult(false);
  };

  if (!selectedType) {
    return (
      <div className="self-assess">
        <div className="self-assess__select">
          <h2 className="self-assess__select-title">자가 심리검사</h2>
          <div className="self-assess__select-list">
            {SELECT_CARDS.map((card) => {
              const IconComp = card.IconComp;
              return (
                <div
                  key={card.key}
                  className="self-assess__select-card"
                  role="button"
                  onClick={() => handleSelectType(card.key)}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSelectType(card.key)}
                >
                  <div className={`self-assess__select-icon ${card.iconClass}`}>
                    <IconComp size={24} aria-hidden />
                  </div>
                  <div className="self-assess__select-info">
                    <h3 className="self-assess__select-name">{card.name}</h3>
                    <p className="self-assess__select-desc">{card.desc}</p>
                  </div>
                  <ChevronRight size={20} color="var(--mg-warm-gray-400)" aria-hidden />
                </div>
              );
            })}
          </div>

          {history.length > 0 && (
            <div className="self-assess__history">
              <h3 className="self-assess__history-title">이전 검사 이력</h3>
              <div className="self-assess__history-list">
                {history.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="self-assess__history-item">
                    <div>
                      <span className="self-assess__history-date">
                        {new Date(item.date).toLocaleDateString('ko-KR')}
                      </span>
                      {' · '}
                      <span>{ASSESSMENTS[item.type]?.name || item.type}</span>
                    </div>
                    <span className="self-assess__history-score">
                      {item.score}점 ({item.level})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (showResult && interpretation) {
    const severityClass = `self-assess__result-score-circle--${interpretation.severity}`;
    return (
      <div className="self-assess">
        <div className="self-assess__content">
          <div className="self-assess__result">
            <div className={`self-assess__result-score-circle ${severityClass}`}>
              <span className="self-assess__result-score-num">{totalScore}</span>
              <span className="self-assess__result-score-label">점</span>
            </div>

            <div className="self-assess__result-card">
              <h2 className="self-assess__result-level">{interpretation.level}</h2>
              <p className="self-assess__result-desc">{interpretation.desc}</p>
            </div>

            <div className="self-assess__result-actions">
              <button
                className="self-assess__result-btn self-assess__result-btn--primary"
                onClick={() => navigate('/client/booking')}
              >
                전문 상담 예약하기
              </button>
              <button
                className="self-assess__result-btn self-assess__result-btn--outline"
                onClick={handleReset}
              >
                다른 검사 하기
              </button>
              <button
                className="self-assess__result-btn self-assess__result-btn--outline"
                onClick={() => navigate('/client/wellness')}
              >
                웰니스로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="self-assess">
      <div className="self-assess__header">
        <h1 className="self-assess__title">{assessment.name}</h1>
        <p className="self-assess__subtitle">{assessment.desc}</p>
        <div className="self-assess__progress">
          <div
            className="self-assess__progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="self-assess__content">
        {assessment.questions.map((q, idx) => (
          <div key={idx} className="self-assess__question-card">
            <p className="self-assess__question-num">
              {idx + 1} / {questionCount}
            </p>
            <p className="self-assess__question-text">{q}</p>
            <div
              className="self-assess__options"
              role="radiogroup"
              aria-label={`문항 ${idx + 1}`}
            >
              {OPTION_LABELS.map((opt) => (
                <button
                  key={opt.score}
                  className={`self-assess__option ${
                    answers[idx] === opt.score
                      ? 'self-assess__option--selected'
                      : ''
                  }`}
                  role="radio"
                  aria-checked={answers[idx] === opt.score}
                  onClick={() => handleAnswer(idx, opt.score)}
                >
                  <span className="self-assess__option-score">{opt.score}</span>
                  <span className="self-assess__option-text">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="self-assess__footer">
        <button
          className="self-assess__footer-btn"
          disabled={!allAnswered}
          onClick={handleSubmit}
        >
          {allAnswered
            ? '결과 확인하기'
            : `${answeredCount} / ${questionCount} 답변 완료`}
        </button>
      </div>
    </div>
  );
};

export default SelfAssessment;

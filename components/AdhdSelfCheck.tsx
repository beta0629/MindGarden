'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import {
  adhdSelfCheckIntro,
  adhdSelfCheckItems,
  adhdSelfCheckLabels,
  adhdSelfCheckLegalNotice,
  getAdhdSelfCheckBand,
  SCORE_IF_OFTEN,
} from '@/lib/adhd-self-check';

type Phase = 'intro' | 'quiz' | 'result';

function SelfCheckLegalNotice({
  variant = 'default',
}: {
  variant?: 'default' | 'quiz';
}) {
  const { paragraphs, psychoExamBeforeLink, psychoExamAfterLink } =
    adhdSelfCheckLegalNotice;
  const cls =
    variant === 'quiz'
      ? 'adhd-self-check-notice adhd-self-check-notice--quiz-persistent'
      : 'adhd-self-check-notice';
  return (
    <div className={cls} role="note">
      <p>{paragraphs[0]}</p>
      <p>{paragraphs[1]}</p>
      <p>{paragraphs[2]}</p>
      <p>
        {psychoExamBeforeLink}
        <Link href="/programs/test" className="adhd-self-check-inline-link">
          심리검사
        </Link>
        {psychoExamAfterLink}
      </p>
    </div>
  );
}

function openConsultationSheet() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('open-consultation-bottom-sheet'));
  }
}

export default function AdhdSelfCheck() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);

  const max = adhdSelfCheckItems.length;

  const totalScore = useMemo(
    () => answers.filter(Boolean).length * SCORE_IF_OFTEN,
    [answers],
  );

  const band = useMemo(
    () => getAdhdSelfCheckBand(totalScore, max),
    [totalScore, max],
  );

  const startQuiz = useCallback(() => {
    setAnswers([]);
    setIndex(0);
    setPhase('quiz');
  }, []);

  const answerQuestion = useCallback(
    (often: boolean) => {
      setAnswers((prev) => {
        const next = [...prev];
        next[index] = often;
        return next;
      });
      if (index + 1 >= max) {
        setPhase('result');
      } else {
        setIndex((i) => i + 1);
      }
    },
    [index, max],
  );

  const goBack = useCallback(() => {
    if (index <= 0) return;
    setIndex((i) => i - 1);
    setAnswers((prev) => prev.slice(0, -1));
  }, [index]);

  const restart = useCallback(() => {
    setPhase('intro');
    setIndex(0);
    setAnswers([]);
  }, []);

  const currentItem = adhdSelfCheckItems[index];
  const progressLabel =
    phase === 'quiz' ? `${index + 1} / ${max}` : null;

  return (
    <div className="adhd-self-check">
      <div className="adhd-self-check-inner">
        <h2 className="adhd-self-check-title">{adhdSelfCheckIntro.title}</h2>

        {phase === 'intro' && <SelfCheckLegalNotice />}

        {phase === 'intro' && (
          <div className="adhd-self-check-actions">
            <button
              type="button"
              className="adhd-self-check-btn adhd-self-check-btn-primary"
              onClick={startQuiz}
            >
              점검 시작하기
            </button>
          </div>
        )}

        {phase === 'quiz' && currentItem && (
          <div className="adhd-self-check-quiz">
            <SelfCheckLegalNotice variant="quiz" />
            <div className="adhd-self-check-progress" aria-live="polite">
              <span className="adhd-self-check-progress-label">진행</span>
              <span className="adhd-self-check-progress-value">{progressLabel}</span>
            </div>

            <p className="adhd-self-check-question-index" aria-hidden="true">
              {index + 1}.
            </p>
            <p className="adhd-self-check-question">{currentItem.prompt}</p>

            <div className="adhd-self-check-options">
              <button
                type="button"
                className="adhd-self-check-option"
                onClick={() => answerQuestion(false)}
              >
                {adhdSelfCheckLabels.rarely}
              </button>
              <button
                type="button"
                className="adhd-self-check-option"
                onClick={() => answerQuestion(true)}
              >
                {adhdSelfCheckLabels.often}
              </button>
            </div>

            <p className="adhd-self-check-hint">{currentItem.hint}</p>

            {index > 0 && (
              <button
                type="button"
                className="adhd-self-check-back"
                onClick={goBack}
              >
                이전 문항
              </button>
            )}
          </div>
        )}

        {phase === 'result' && (
          <div className="adhd-self-check-result">
            <p className="adhd-self-check-result-score" aria-live="polite">
              응답 요약: <strong>{totalScore}</strong> / {max}문항에서
              「{adhdSelfCheckLabels.often}」에 가까운 응답
            </p>
            <h3 className="adhd-self-check-result-title">{band.title}</h3>
            <p className="adhd-self-check-result-body">{band.body}</p>

            <SelfCheckLegalNotice />

            <div className="adhd-self-check-actions adhd-self-check-actions--stack">
              <button
                type="button"
                className="adhd-self-check-btn adhd-self-check-btn-primary"
                onClick={openConsultationSheet}
              >
                상담·문의하기
              </button>
              <Link
                href="/programs/test"
                className="adhd-self-check-btn adhd-self-check-btn-secondary"
              >
                전문 심리검사 안내 보기
              </Link>
              <button
                type="button"
                className="adhd-self-check-btn adhd-self-check-btn-ghost"
                onClick={restart}
              >
                처음으로 다시 점검
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

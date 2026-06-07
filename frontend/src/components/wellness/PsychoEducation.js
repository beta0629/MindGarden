/**
 * PsychoEducation — 심리 교육 콘텐츠
 *
 * 카테고리(불안 관리/인지행동 팁/관계 스킬/자존감 향상),
 * 카드뉴스형 리스트, 상세 카드 스와이프, 북마크, AI 추천, 읽기 완료.
 *
 * @author MindGarden
 * @since 2026-05-12
 */

import React, { useState, useEffect } from 'react';
import {
  BookOpen, Bookmark, Check, X, ChevronLeft, ChevronRight,
  Shield, Brain, Users, Heart, Sparkles
} from 'lucide-react';
import SegmentedTabs from '../common/SegmentedTabs';
import CitationBlock from '../common/CitationBlock';
import './PsychoEducation.css';
import { useTranslation } from 'react-i18next';

const CATEGORIES = [
  { key: 'all', label: '전체' },
  { key: 'anxiety', label: '불안 관리' },
  { key: 'cbt', label: '인지행동 팁' },
  { key: 'relationship', label: '관계 스킬' },
  { key: 'selfEsteem', label: '자존감 향상' },
  { key: 'bookmarks', label: '북마크' }
];

const GRADIENT_MAP = {
  anxiety: 'linear-gradient(135deg, var(--mg-client-primary), var(--mg-client-primary-light))',
  cbt: 'linear-gradient(135deg, var(--mg-consultant-primary), var(--mg-consultant-primary-light))',
  relationship: 'linear-gradient(135deg, var(--mg-client-primary-light), var(--mg-client-primary))',
  selfEsteem: 'linear-gradient(135deg, var(--mg-color-success), var(--mg-client-primary-light))'
};

const ICON_MAP = {
  anxiety: Shield,
  cbt: Brain,
  relationship: Users,
  selfEsteem: Heart
};

const MOCK_ARTICLES = [
  { id: 1, category: 'anxiety', categoryLabel: '불안 관리', title: '불안을 다스리는 5가지 호흡법', summary: '긴장되는 순간, 간단한 호흡법으로 마음을 가라앉힐 수 있습니다.', readTime: 3, content: '불안은 누구나 경험하는 자연스러운 감정입니다.\n\n1. 4-7-8 호흡법: 코로 4초 들이쉬고, 7초 참고, 8초 내쉽니다.\n2. 복식호흡: 배에 손을 얹고 배가 부풀어 오르도록 깊이 호흡합니다.\n3. 박스 브리딩: 4초 흡입 → 4초 멈춤 → 4초 호출 → 4초 멈춤을 반복합니다.\n4. 교대 비강 호흡: 한쪽 콧구멍을 막고 교대로 호흡합니다.\n5. 이완 호흡: 내쉴 때 "쉬~" 소리를 내며 긴장을 풀어줍니다.\n\n하루 5분, 아침과 저녁에 꾸준히 연습하면 불안 수준이 크게 낮아질 수 있습니다.', source: { label: 'WHO Stress management & breathing guidance', url: 'https://www.who.int/news-room/questions-and-answers/item/stress', author: 'World Health Organization', publishedYear: 2023 } },
  { id: 2, category: 'anxiety', categoryLabel: '불안 관리', title: '사회 불안을 극복하는 단계별 접근', summary: '사람 많은 곳이 두려운 당신을 위한 실전 가이드.', readTime: 5, content: '사회 불안은 타인의 시선이나 평가에 대한 과도한 두려움입니다.\n\n단계 1: 자기 관찰 — 불안이 시작되는 상황과 신체 반응을 기록합니다.\n단계 2: 인지 재구성 — "모든 사람이 나를 판단한다"는 생각을 검증합니다.\n단계 3: 점진적 노출 — 작은 모임부터 시작하여 점차 범위를 넓힙니다.\n단계 4: 자기 격려 — 작은 성공에도 스스로를 칭찬합니다.\n\n전문 상담사와 함께하면 더 효과적으로 극복할 수 있습니다.' },
  { id: 3, category: 'anxiety', categoryLabel: '불안 관리', title: '수면 전 불안 해소 루틴', summary: '잠들기 전 마음을 편안하게 해주는 야간 루틴을 소개합니다.', readTime: 4, content: '밤에 유독 불안이 심해지는 분들을 위한 루틴입니다.\n\n1. 디지털 디톡스: 취침 1시간 전 스마트폰을 내려놓습니다.\n2. 감사 일기: 오늘 감사한 3가지를 적습니다.\n3. 보디 스캔: 발끝부터 머리끝까지 순서대로 이완합니다.\n4. 호흡 명상: 4-7-8 호흡법을 3회 반복합니다.\n5. 자연 소리: 빗소리나 파도소리를 잔잔하게 틀어놓습니다.' },
  { id: 4, category: 'cbt', categoryLabel: '인지행동 팁', title: '자동적 사고 잡아내기', summary: '무의식적으로 떠오르는 부정적 생각을 인식하고 바꾸는 방법.', readTime: 4, content: '인지행동치료(CBT)의 핵심은 자동적 사고를 인식하는 것입니다.\n\n자동적 사고란?\n- 상황에 대해 즉각적으로 떠오르는 생각\n- 대부분 부정적이고 왜곡된 패턴\n\n잡아내는 방법:\n1. 감정이 급격히 변할 때 "지금 무슨 생각을 했지?" 자문합니다.\n2. 사고 기록지에 상황-생각-감정-결과를 적습니다.\n3. 그 생각의 근거와 반증을 모두 찾아봅니다.\n4. 더 균형 잡힌 대안적 생각을 만들어봅니다.', source: { label: 'APA Clinical Practice Guideline for the Treatment of Depression', url: 'https://www.apa.org/depression-guideline', author: 'American Psychological Association', publishedYear: 2019 } },
  { id: 5, category: 'cbt', categoryLabel: '인지행동 팁', title: '인지 왜곡 10가지 유형', summary: '흑백논리, 과잉일반화, 독심술 등 흔한 인지 왜곡 패턴을 알아봅시다.', readTime: 6, content: '우리의 생각에는 다양한 왜곡이 존재합니다.\n\n1. 흑백논리: 모 아니면 도\n2. 과잉일반화: 한 번의 실패로 항상 그럴 거라 단정\n3. 정신적 필터링: 부정적인 것만 골라 보기\n4. 긍정 격하: 좋은 일도 대수롭지 않게 여기기\n5. 독심술: 타인의 생각을 마음대로 추측\n6. 점쟁이적 오류: 미래를 부정적으로 예측\n7. 파국화: 작은 문제를 크게 확대\n8. 축소: 좋은 점을 과소평가\n9. 감정적 추론: 느낌이 곧 사실이라 생각\n10. 당위적 사고: "~해야 한다"에 집착' },
  { id: 6, category: 'cbt', categoryLabel: '인지행동 팁', title: '행동 활성화로 우울 극복하기', summary: '의욕이 없을 때 작은 행동부터 시작하는 CBT 기법.', readTime: 4, content: '행동 활성화는 우울증에 매우 효과적인 CBT 기법입니다.\n\n원리: 활동 → 성취감/즐거움 → 기분 개선 → 더 많은 활동\n\n실천법:\n1. 활동 모니터링: 하루 활동과 기분을 0~10으로 기록합니다.\n2. 가치 기반 활동 목록: 당신에게 의미 있는 활동을 나열합니다.\n3. 점진적 실행: 가장 쉬운 것부터 시작합니다.\n4. 일정에 넣기: "할 수 있으면"이 아닌 구체적 시간을 정합니다.' },
  { id: 7, category: 'relationship', categoryLabel: '관계 스킬', title: '비폭력 대화(NVC) 4단계', summary: '갈등 없이 진심을 전하는 마샬 로젠버그의 대화법.', readTime: 5, content: '비폭력 대화(Nonviolent Communication)의 4단계:\n\n1. 관찰: 판단 없이 사실만 말합니다.\n   "네가 30분 늦었어" (O) vs "넌 항상 늦잖아" (X)\n\n2. 느낌: 자신의 감정을 표현합니다.\n   "나는 걱정이 되었어"\n\n3. 필요: 충족되지 않은 욕구를 말합니다.\n   "나는 약속이 지켜지면 안심이 돼"\n\n4. 부탁: 구체적인 행동을 요청합니다.\n   "다음에는 늦을 것 같으면 미리 연락해줄 수 있어?"', source: { label: 'Nonviolent Communication: A Language of Life (3rd ed.)', url: 'https://www.cnvc.org/learn/nvc-foundations', author: 'Marshall B. Rosenberg', publishedYear: 2015 } },
  { id: 8, category: 'relationship', categoryLabel: '관계 스킬', title: '경청의 기술: 진짜 듣기란', summary: '상대방이 이해받았다고 느끼는 대화의 비밀.', readTime: 3, content: '진정한 경청은 단순히 듣는 것이 아닙니다.\n\n적극적 경청의 요소:\n- 눈 맞춤: 자연스럽게 시선을 유지합니다.\n- 끄덕임: 비언어적으로 "듣고 있어"를 전합니다.\n- 반영: "그래서 ~했구나" 상대 말을 요약합니다.\n- 질문: 판단이 아닌 호기심으로 질문합니다.\n- 침묵: 적절한 침묵은 상대가 더 말할 수 있게 합니다.\n\n"충고하고 싶은 충동을 참는 것"이 경청의 시작입니다.' },
  { id: 9, category: 'relationship', categoryLabel: '관계 스킬', title: '건강한 경계 설정하기', summary: '나를 지키면서도 관계를 유지하는 경계의 기술.', readTime: 4, content: '건강한 경계는 관계를 해치는 것이 아니라 보호합니다.\n\n경계란?\n- "여기까지는 괜찮고, 여기부터는 불편해요"의 선\n- 자기 존중과 타인 존중의 균형\n\n설정 방법:\n1. 자기 인식: 불편함을 느끼는 상황을 파악합니다.\n2. 명확한 표현: "나는 ~할 때 불편해" I-message로 전합니다.\n3. 일관성: 한번 정한 경계는 일관되게 유지합니다.\n4. 결과 수용: 경계를 존중하지 않는 관계는 거리를 둡니다.' },
  { id: 10, category: 'selfEsteem', categoryLabel: '자존감 향상', title: '내면의 비판자 다루기', summary: '자기 비난의 목소리를 인식하고 자비로운 태도로 바꾸는 법.', readTime: 4, content: '우리 안에는 끊임없이 비판하는 목소리가 있습니다.\n\n내면의 비판자 특징:\n- "넌 그것도 못해?"\n- "다들 너를 이상하게 볼 거야"\n- "노력해봤자 소용없어"\n\n다루는 법:\n1. 인식: "아, 지금 내면의 비판자가 말하고 있구나"\n2. 거리두기: 그 목소리를 3인칭으로 바라봅니다.\n3. 자기 자비: 친한 친구에게 하듯 나에게 말합니다.\n4. 반증: 비판의 근거를 객관적으로 검증합니다.' },
  { id: 11, category: 'selfEsteem', categoryLabel: '자존감 향상', title: '작은 성공 수집하기', summary: '일상의 작은 성취를 모아 자신감을 키우는 실용적 방법.', readTime: 3, content: '자존감은 하루아침에 바뀌지 않습니다. 작은 성공을 모으세요.\n\n방법:\n1. 성공 저널: 매일 3가지 "잘한 것"을 적습니다.\n2. 기준 낮추기: "밥을 챙겨 먹었다"도 충분한 성공입니다.\n3. 완료 리스트: To-Do 대신 Done 리스트를 만듭니다.\n4. 과거 회상: 이미 극복한 어려움을 떠올립니다.\n5. 칭찬 수용: "별거 아니에요" 대신 "감사합니다"로 답합니다.\n\n6개월 후, 당신의 성공 컬렉션은 놀라울 것입니다.' },
  { id: 12, category: 'selfEsteem', categoryLabel: '자존감 향상', title: '완벽주의에서 벗어나기', summary: '완벽하지 않아도 충분하다는 것을 받아들이는 여정.', readTime: 5, content: '완벽주의는 높은 기준이 아니라, 실패에 대한 두려움입니다.\n\n완벽주의의 함정:\n- "100점이 아니면 0점이다" (흑백논리)\n- "실수하면 사람들이 나를 싫어할 거야"\n- 끊임없는 자기 비교와 부족함\n\n벗어나는 방법:\n1. "충분히 좋은" 기준 세우기: 80%도 훌륭합니다.\n2. 실수를 학습으로: "실패"를 "피드백"으로 재명명합니다.\n3. 과정 즐기기: 결과보다 과정에서의 성장에 집중합니다.\n4. 자기 자비 명상: 매일 5분, 자신에게 따뜻하게 말합니다.' },
  { id: 13, category: 'anxiety', categoryLabel: '불안 관리', title: '그라운딩 기법: 5-4-3-2-1', summary: '지금 이 순간으로 돌아오는 감각 기반 안정화 기법.', readTime: 3, content: '패닉이나 강한 불안 시 5-4-3-2-1 기법을 사용하세요.\n\n5가지 — 보이는 것 5개를 말합니다.\n4가지 — 만질 수 있는 것 4개를 느낍니다.\n3가지 — 들리는 소리 3개에 집중합니다.\n2가지 — 냄새 2가지를 맡습니다.\n1가지 — 맛 1가지를 느낍니다.\n\n감각에 집중하면 "지금 여기"로 돌아올 수 있습니다. 불안은 미래의 걱정이고, 이 기법은 현재로 앵커링합니다.', source: { label: 'DBT Skills Training Manual (2nd ed.)', url: 'https://www.guilford.com/books/DBT-Skills-Training-Manual/Marsha-Linehan/9781462516995', author: 'Marsha M. Linehan', publishedYear: 2014 } },
  { id: 14, category: 'cbt', categoryLabel: '인지행동 팁', title: '걱정 시간 정하기', summary: '걱정을 특정 시간에 몰아서 하는 역설적 기법.', readTime: 3, content: '걱정이 하루를 지배하나요? "걱정 시간"을 정해보세요.\n\n방법:\n1. 하루 중 15~30분을 "걱정 시간"으로 정합니다.\n2. 그 외 시간에 걱정이 떠오르면 메모만 하고 미룹니다.\n3. 걱정 시간에 메모를 꺼내 하나씩 검토합니다.\n4. 통제 가능/불가능을 분류합니다.\n5. 통제 가능한 것은 행동 계획을, 불가능한 것은 수용합니다.\n\n놀랍게도, 걱정 시간이 되면 대부분의 걱정은 이미 사라져 있습니다.' },
  { id: 15, category: 'relationship', categoryLabel: '관계 스킬', title: '갈등 해결의 윈-윈 접근법', summary: '이기고 지는 것이 아닌 함께 해결하는 대화법.', readTime: 5, content: '갈등은 관계의 적이 아니라 성장의 기회입니다.\n\n윈-윈 접근법:\n1. 문제와 사람을 분리합니다.\n2. 입장이 아닌 욕구에 집중합니다.\n   예) "늦은 귀가"(입장) → "안전에 대한 걱정"(욕구)\n3. 창의적 대안을 함께 브레인스토밍합니다.\n4. 객관적 기준으로 합의합니다.\n5. 합의 후 실행과 피드백을 합니다.\n\n핵심: "나 vs 너"가 아닌 "우리 vs 문제"로 프레임을 바꿉니다.' }
];

const PsychoEducation = () => {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState('all');
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mg_psycho_bookmarks') || '[]');
    } catch { return []; }
  });
  const [completed, setCompleted] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mg_psycho_completed') || '[]');
    } catch { return []; }
  });
  const [detailArticle, setDetailArticle] = useState(null);
  const [detailIndex, setDetailIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('mg_psycho_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    localStorage.setItem('mg_psycho_completed', JSON.stringify(completed));
  }, [completed]);

  const getFilteredArticles = () => {
    if (activeCategory === 'all') return MOCK_ARTICLES;
    if (activeCategory === 'bookmarks') return MOCK_ARTICLES.filter((a) => bookmarks.includes(a.id));
    return MOCK_ARTICLES.filter((a) => a.category === activeCategory);
  };
  const filteredArticles = getFilteredArticles();

  const toggleBookmark = (id, e) => {
    e.stopPropagation();
    setBookmarks((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  const openDetail = (article, idx) => {
    setDetailArticle(article);
    setDetailIndex(idx);
    if (!completed.includes(article.id)) {
      setCompleted((prev) => [...prev, article.id]);
    }
  };

  const closeDetail = () => {
    setDetailArticle(null);
  };

  const navigateDetail = (delta) => {
    const newIdx = detailIndex + delta;
    if (newIdx >= 0 && newIdx < filteredArticles.length) {
      const article = filteredArticles[newIdx];
      setDetailArticle(article);
      setDetailIndex(newIdx);
      if (!completed.includes(article.id)) {
        setCompleted((prev) => [...prev, article.id]);
      }
    }
  };

  if (loading) {
    return (
      <div className="psycho-edu">
        <div className="psycho-edu__skeleton">
          <div className="psycho-edu__skeleton-block" />
          <div className="psycho-edu__skeleton-block" />
          <div className="psycho-edu__skeleton-block" />
        </div>
      </div>
    );
  }

  return (
    <div className="psycho-edu">
      {/* AI 추천 */}
      <div className="psycho-edu__recommend">
        <div className="psycho-edu__recommend-title">
          <Sparkles size={18} className="psycho-edu__recommend-icon" />
          추천 콘텐츠
          <span className="psycho-edu__recommend-badge">AI</span>
        </div>
      </div>

      {/* 카테고리 — MGButton SSOT */}
      <SegmentedTabs
        ariaLabel="심리 교육 카테고리"
        items={CATEGORIES.map((cat) => ({ value: cat.key, label: cat.label }))}
        activeValue={activeCategory}
        onChange={setActiveCategory}
        size="sm"
        className="psycho-edu__categories"
      />

      {/* 카드 리스트 */}
      {filteredArticles.length > 0 ? (
        <div className="psycho-edu__list">
          {filteredArticles.map((article, idx) => {
            const IconComp = ICON_MAP[article.category] || BookOpen;
            const gradient = GRADIENT_MAP[article.category] || GRADIENT_MAP.anxiety;
            const isCompleted = completed.includes(article.id);
            const isBookmarked = bookmarks.includes(article.id);

            return (
              <div
                key={article.id}
                className="psycho-edu__card"
                onClick={() => openDetail(article, idx)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && openDetail(article, idx)}
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <div
                  className="psycho-edu__card-image"
                  style={{ background: gradient }}
                >
                  <IconComp size={36} className="psycho-edu__card-image-icon" />
                  {isCompleted && (
                    <div className="psycho-edu__card-completed">
                      <Check size={16} />
                    </div>
                  )}
                </div>
                <div className="psycho-edu__card-body">
                  <div className="psycho-edu__card-title">{article.title}</div>
                  <div className="psycho-edu__card-summary">{article.summary}</div>
                  <div className="psycho-edu__card-footer">
                    <div className="psycho-edu__card-meta">
                      <span className="psycho-edu__card-tag">{article.categoryLabel}</span>
                      <span className="psycho-edu__card-time">{article.readTime}분 읽기</span>
                    </div>
                    <button
                      type="button"
                      className={`psycho-edu__card-bookmark${isBookmarked ? ' psycho-edu__card-bookmark--active' : ''}`}
                      onClick={(e) => toggleBookmark(article.id, e)}
                      aria-label={isBookmarked ? '북마크 해제' : '북마크'}
                    >
                      <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="psycho-edu__empty">
          <div className="psycho-edu__empty-icon">
            <BookOpen size={28} />
          </div>
          <p className="psycho-edu__empty-text">
            {activeCategory === 'bookmarks'
              ? '북마크한 콘텐츠가 없어요'
              : '콘텐츠를 준비 중이에요'}
          </p>
        </div>
      )}

      {/* 상세 뷰 */}
      {detailArticle && (
        <div
          className="psycho-edu__detail-overlay"
          onClick={closeDetail}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="psycho-edu__detail-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="psycho-edu__detail-header"
              style={{ background: GRADIENT_MAP[detailArticle.category] || GRADIENT_MAP.anxiety }}
            >
              {(() => {
                const DIcon = ICON_MAP[detailArticle.category] || BookOpen;
                return <DIcon size={48} className="psycho-edu__detail-header-icon" />;
              })()}
              <button
                type="button"
                className="psycho-edu__detail-close"
                onClick={closeDetail}
                aria-label={t('common.actions.close')}
              >
                <X size={18} />
              </button>
            </div>

            <div className="psycho-edu__detail-body">
              <div className="psycho-edu__detail-title">{detailArticle.title}</div>
              <div className="psycho-edu__detail-meta">
                <span className="psycho-edu__card-tag">{detailArticle.categoryLabel}</span>
                <span className="psycho-edu__card-time">{detailArticle.readTime}분 읽기</span>
              </div>
              <div className="psycho-edu__detail-content">{detailArticle.content}</div>
              <CitationBlock
                source={detailArticle.source}
                testId="psycho-edu-citation"
                className="psycho-edu__citation"
              />
            </div>

            {/* 인디케이터 */}
            <div className="psycho-edu__detail-indicator">
              {filteredArticles.slice(
                Math.max(0, detailIndex - 1),
                Math.min(filteredArticles.length, detailIndex + 2)
              ).map((a, i) => (
                <div
                  key={a.id}
                  className={`psycho-edu__indicator-dot${a.id === detailArticle.id ? ' psycho-edu__indicator-dot--active' : ''}`}
                />
              ))}
            </div>

            <div className="psycho-edu__detail-nav">
              <button
                type="button"
                className="psycho-edu__detail-nav-btn"
                onClick={() => navigateDetail(-1)}
                disabled={detailIndex === 0}
              >
                <ChevronLeft size={16} className="psycho-edu__detail-nav-icon" />
                {t('common.actions.prev')}
              </button>
              <button
                type="button"
                className="psycho-edu__detail-nav-btn"
                onClick={() => navigateDetail(1)}
                disabled={detailIndex >= filteredArticles.length - 1}
              >
                다음
                <ChevronRight size={16} className="psycho-edu__detail-nav-icon" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PsychoEducation;

/**
 * LandingTestimonials — 사회적 증명 Carousel (Organism)
 *
 * Phase C-2 G3: Stats + 자동 슬라이드 Carousel.
 * 키보드 nav (좌우 화살표) + 일시정지/재생 + aria-live="polite".
 * 모든 후기·지표 데이터는 운영팀 슬롯 props로 주입.
 * mg-v2-* 토큰 한정, 하드코딩 0.
 *
 * @author MindGarden
 * @since 2026-06-15
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import './LandingTestimonials.css';

const DEFAULT_STATS = [
  { label: '도입 센터', value: '500+' },
  { label: '활성 사용자', value: '12,000+' },
  { label: '누적 예약 건수', value: '1,200,000+' },
  { label: '고객 만족도', value: '98%' },
];

const DEFAULT_TESTIMONIALS = [
  {
    content: '코어 솔루션 도입 후 행정 업무가 절반으로 줄었습니다.',
    author: 'A 심리상담센터 원장',
    avatar: null,
  },
  {
    content: '예약 관리와 정산이 자동화되어 상담에만 집중할 수 있게 되었어요.',
    author: 'B 상담소 대표',
    avatar: null,
  },
  {
    content: '내담자 관리 시스템이 정말 직관적이고 안전합니다.',
    author: 'C 클리닉 실장',
    avatar: null,
  },
];

const LandingTestimonials = ({
  statsSlot = DEFAULT_STATS,
  testimonialsSlot = DEFAULT_TESTIMONIALS,
  autoPlayMs = 5000,
  pauseOnHover = true,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);
  const carouselRef = useRef(null);

  const totalSlides = testimonialsSlot.length;

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  useEffect(() => {
    if (isPaused || totalSlides <= 1) {
      clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(goToNext, autoPlayMs);
    return () => clearInterval(intervalRef.current);
  }, [isPaused, autoPlayMs, goToNext, totalSlides]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goToPrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goToNext();
    }
  }, [goToNext, goToPrev]);

  const handleMouseEnter = () => {
    if (pauseOnHover) setIsPaused(true);
  };

  const handleMouseLeave = () => {
    if (pauseOnHover) setIsPaused(false);
  };

  const getAuthorInitial = (author) => {
    if (!author) return '?';
    return author.charAt(0);
  };

  const trackTransform = `translateX(-${currentIndex * (100 / totalSlides)}%)`;

  return (
    <section className="mg-v2-landing-testimonials" aria-label="Testimonials">
      {statsSlot.length > 0 && (
        <div className="mg-v2-landing-testimonials__stats">
          {statsSlot.map((stat, idx) => (
            <div key={idx} className="mg-v2-landing-testimonials__stat">
              <span className="mg-v2-landing-testimonials__stat-value">
                {stat.value}
              </span>
              <span className="mg-v2-landing-testimonials__stat-label">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      )}

      <div
        ref={carouselRef}
        className="mg-v2-landing-testimonials__carousel"
        role="region"
        aria-roledescription="carousel"
        aria-label="고객 후기"
        onKeyDown={handleKeyDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        tabIndex="0"
      >
        <div
          className="mg-v2-landing-testimonials__track"
          aria-live="polite"
          style={{ transform: trackTransform }}
        >
          {testimonialsSlot.map((testimonial, idx) => (
            <div
              key={idx}
              className="mg-v2-landing-testimonials__slide"
              role="group"
              aria-roledescription="slide"
              aria-label={`${idx + 1} / ${totalSlides}`}
            >
              <div className="mg-v2-landing-testimonials__card">
                <p className="mg-v2-landing-testimonials__card-content">
                  &ldquo;{testimonial.content}&rdquo;
                </p>
                <div className="mg-v2-landing-testimonials__card-author">
                  <div className="mg-v2-landing-testimonials__card-avatar">
                    {testimonial.avatar ? (
                      <img src={testimonial.avatar} alt={testimonial.author} />
                    ) : (
                      <span className="mg-v2-landing-testimonials__card-avatar-placeholder">
                        {getAuthorInitial(testimonial.author)}
                      </span>
                    )}
                  </div>
                  <span className="mg-v2-landing-testimonials__card-name">
                    {testimonial.author}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mg-v2-landing-testimonials__controls">
          <button
            type="button"
            className="mg-v2-landing-testimonials__control-btn"
            onClick={goToPrev}
            aria-label="이전 후기"
          >
            &#8249;
          </button>
          <button
            type="button"
            className="mg-v2-landing-testimonials__control-btn"
            onClick={togglePause}
            aria-label={isPaused ? '자동 재생' : '일시정지'}
          >
            {isPaused ? '▶' : '⏸'}
          </button>
          <button
            type="button"
            className="mg-v2-landing-testimonials__control-btn"
            onClick={goToNext}
            aria-label="다음 후기"
          >
            &#8250;
          </button>
        </div>
      </div>
    </section>
  );
};

LandingTestimonials.propTypes = {
  statsSlot: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
    })
  ),
  testimonialsSlot: PropTypes.arrayOf(
    PropTypes.shape({
      content: PropTypes.string.isRequired,
      author: PropTypes.string.isRequired,
      avatar: PropTypes.string,
    })
  ),
  autoPlayMs: PropTypes.number,
  pauseOnHover: PropTypes.bool,
};

export default LandingTestimonials;

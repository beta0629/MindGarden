'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const NAVER_MAP_URL = `https://map.naver.com/v5/search/${encodeURIComponent('송도 마인드가든 심리상담센터')}`;

export default function Footer() {
  const [bottomSheetHeight, setBottomSheetHeight] = useState(80);

  useEffect(() => {
    const checkBottomSheetHeight = () => {
      const bottomSheet = document.querySelector('[data-bottom-sheet]') as HTMLElement;
      if (bottomSheet) {
        const height = parseInt(window.getComputedStyle(bottomSheet).height) || 80;
        setBottomSheetHeight(height);
      }
    };

    checkBottomSheetHeight();

    const observer = new MutationObserver(checkBottomSheetHeight);
    const bottomSheet = document.querySelector('[data-bottom-sheet]');
    if (bottomSheet) {
      observer.observe(bottomSheet, {
        attributes: true,
        attributeFilter: ['style'],
      });
    }

    const interval = setInterval(checkBottomSheetHeight, 100);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  return (
    <footer
      className="footer-simple"
      style={{
        paddingBottom: `${bottomSheetHeight}px`,
        transition: 'padding-bottom 0.3s ease',
      }}
    >
      <div className="footer-simple__inner">
        <div className="footer-simple__grid">
          <div className="footer-simple__col footer-simple__col--brand">
            <div className="footer-simple__brand-head">
              <Image
                src="/assets/images/logo/mindgarden-mark.svg"
                alt=""
                width={252}
                height={268}
                unoptimized
                className="footer-simple__brand-logo"
              />
              <h2 className="footer-simple__brand-title">마인드가든</h2>
            </div>
            <p className="footer-simple__brand-tagline">
              나를 소중히 돌보고 가꾸는 시간,
              <br />
              당신의 마음이 정원이 됩니다.
            </p>
          </div>

          <div className="footer-simple__col footer-simple__col--contact">
            <h3 className="footer-simple__col-title">Contact Us</h3>
            <p className="footer-simple__contact-line">
              <span className="footer-simple__label">상담문의:</span>{' '}
              <a href="tel:0327248501">032-724-8501</a> /{' '}
              <a href="tel:01079238501">010-7923-8501</a>
            </p>
            <p className="footer-simple__contact-line">
              <span className="footer-simple__label">운영시간:</span> 주중 10:00 – 20:00 · 토요일 10:00 – 17:00 · 일요일 정기휴무
            </p>
            <p className="footer-simple__contact-line">
              <span className="footer-simple__label">오시는 길:</span> 인천광역시 연수구 해돋이로120번길 23 아크리아2 2층 204호
            </p>
            <p className="footer-simple__contact-line footer-simple__contact-line--link">
              <Link href="/location">센터 위치 상세 보기</Link>
            </p>
          </div>

          <div className="footer-simple__col footer-simple__col--actions">
            <a
              href={NAVER_MAP_URL}
              className="footer-simple__cta"
              target="_blank"
              rel="noopener noreferrer"
            >
              네이버 플레이스 예약하기
            </a>
            <ul className="footer-simple__links">
              <li>
                <Link href="/screening">
                  <span aria-hidden="true">👉</span> ADHD·공존질환 체크리스트 살펴보기
                </Link>
              </li>
              <li>
                <Link href="/counseling/counseling-areas">
                  <span aria-hidden="true">👉</span> 부부·가족 상담 분야 보기
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-simple__divider">
          <p className="footer-simple__copyright">
            © 2026 Mind Garden Counseling Center. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

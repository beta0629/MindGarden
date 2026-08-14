/**
 * 로그인 히어로 Lottie 오버레이 (모션 SSOT)
 * /login 히어로에서만 lazy 로드. prefers-reduced-motion 시 미마운트.
 *
 * @author CoreSolution
 * @since 2026-08-14
 */

import { useEffect, useState } from 'react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * @returns {boolean}
 */
const getPrefersReducedMotion = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
};

const LoginHeroLottieOverlay = () => {
  const [Lottie, setLottie] = useState(null);
  const [animationData, setAnimationData] = useState(null);
  const [reducedMotion, setReducedMotion] = useState(getPrefersReducedMotion);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }
    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    const handleChange = (event) => {
      setReducedMotion(event.matches);
    };
    setReducedMotion(mediaQuery.matches);
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setLottie(null);
      setAnimationData(null);
      return undefined;
    }

    let cancelled = false;

    Promise.all([
      import('lottie-react'),
      import('../../assets/lottie/auth/login-hero-soft-glow.json')
    ]).then(([lottieModule, jsonModule]) => {
      if (cancelled) {
        return;
      }
      setLottie(() => lottieModule.default);
      setAnimationData(jsonModule.default || jsonModule);
    }).catch(() => {
      if (!cancelled) {
        setLottie(null);
        setAnimationData(null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [reducedMotion]);

  if (reducedMotion || !Lottie || !animationData) {
    return null;
  }

  return (
    <div className="mg-v2-login-hero-lottie" aria-hidden="true">
      <Lottie
        animationData={animationData}
        loop
        autoplay
        className="mg-v2-login-hero-lottie__canvas"
      />
    </div>
  );
};

export default LoginHeroLottieOverlay;

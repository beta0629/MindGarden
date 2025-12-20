'use client';

import { useEffect, useRef, useState } from 'react';

interface HeroSectionProps {
  slogan?: {
    sub?: string;
    main?: string;
  };
  videoUrl?: string; // 코어솔루션 API에서 가져온 비디오 URL
}

export default function HeroSection({ slogan, videoUrl }: HeroSectionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState(false);
  
  const defaultSlogan = {
    sub: '임상경험이 풍부한 검증된 전문가 . ADHD 특화.차별화된 프로그램',
    main: 'ADHD 전문.심리상담센터'
  };

  const finalSlogan = slogan || defaultSlogan;
  
  // 비디오 소스 우선순위: 1. API에서 가져온 비디오, 2. 로컬 비디오, 3. 기본 비디오
  const getVideoSources = () => {
    if (videoUrl) {
      return [videoUrl];
    }
    
    // 로컬 비디오 파일 (public/assets/videos/ 폴더에 비디오를 넣으면 자동으로 사용)
    const localVideo = '/assets/videos/hero-video.mp4';
    
    // 기본 비디오 (어린이들이 웃고 즐거워하는 모습 - Pexels 무료 스톡 비디오)
    // 실제 어린이 비디오가 없을 경우 편안한 느낌의 비디오 사용
    return [
      localVideo, // 로컬 비디오 우선
      // Pexels에서 어린이 관련 비디오 검색: https://www.pexels.com/search/videos/children%20happy/
      'https://videos.pexels.com/video-files/3045163/3045163-hd_1920_1080_30fps.mp4', // 부드러운 자연 (편안한 느낌)
      'https://videos.pexels.com/video-files/2491284/2491284-hd_1920_1080_30fps.mp4', // 밝고 따뜻한 느낌
      'https://videos.pexels.com/video-files/3044089/3044089-hd_1920_1080_25fps.mp4', // 따뜻한 조명
    ];
  };

  const videoSources = getVideoSources();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let playAttempts = 0;
    const maxAttempts = 5;

    // 비디오 강제 재생을 위한 더 적극적인 접근
    const playVideo = async () => {
      if (playAttempts >= maxAttempts) {
        console.log('Max play attempts reached');
        return;
      }
      playAttempts++;

      try {
        // 비디오 속성 강제 설정
        video.muted = true;
        video.volume = 0;
        video.playsInline = true;
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
        video.setAttribute('muted', '');
        
        // 재생 시도
        const playPromise = video.play();
        if (playPromise !== undefined) {
          await playPromise;
          setVideoError(false);
          console.log('Video playing successfully');
        }
      } catch (error) {
        console.log(`Video play attempt ${playAttempts} failed:`, error);
        
        // 잠시 후 재시도
        if (playAttempts < maxAttempts) {
          setTimeout(() => playVideo(), 500);
        } else {
          setVideoError(true);
          // 사용자 상호작용 후 재생 시도
          const tryPlayOnInteraction = () => {
            video.play().then(() => {
              setVideoError(false);
              document.removeEventListener('click', tryPlayOnInteraction);
              document.removeEventListener('touchstart', tryPlayOnInteraction);
            }).catch(() => {
              setVideoError(true);
            });
          };
          document.addEventListener('click', tryPlayOnInteraction, { once: true });
          document.addEventListener('touchstart', tryPlayOnInteraction, { once: true });
        }
      }
    };

    const handleCanPlay = () => {
      console.log('Video can play');
      playVideo();
    };

    const handleError = (e: Event) => {
      console.error('Video loading failed:', e);
      setVideoError(true);
    };

    const handleLoadedData = () => {
      console.log('Video data loaded');
      playVideo();
    };

    const handlePlaying = () => {
      console.log('Video is playing');
      setVideoError(false);
    };

    // 비디오 속성 초기 설정
    video.muted = true;
    video.volume = 0;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('muted', '');

    // 이벤트 리스너 추가
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('canplaythrough', handleCanPlay);
    video.addEventListener('error', handleError);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('loadedmetadata', () => {
      console.log('Video metadata loaded');
      playVideo();
    });
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('play', handlePlaying);

    // 즉시 재생 시도
    setTimeout(() => playVideo(), 100);

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('canplaythrough', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('play', handlePlaying);
    };
  }, []);


  return (
    <section className="hero-section">
      <div className="video-container">
        <video 
          ref={videoRef}
          autoPlay 
          muted 
          loop 
          playsInline 
          className="bg-video"
          poster="/assets/images/hero.png"
          preload="auto"
          webkit-playsinline="true"
          x-webkit-airplay="allow"
        >
          {videoSources.map((src, index) => (
            <source key={index} src={src} type="video/mp4" />
          ))}
          Your browser does not support the video tag.
        </video>
        {videoError && (
          <div className="video-fallback" style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, var(--accent-sky) 0%, var(--accent-peach) 100%)',
            zIndex: 1
          }} />
        )}
        <div className="video-overlay"></div>
      </div>

      <div className="hero-text">
        <p className="slogan-sub">{finalSlogan.sub}</p>
        <h1 className="slogan-main">
          {finalSlogan.main?.split('\n').map((line, i) => (
            <span key={i} className="slogan-line" style={{ animationDelay: `${0.5 + i * 0.3}s` }}>
              {line}
              {i < finalSlogan.main!.split('\n').length - 1 && <br />}
            </span>
          ))}
        </h1>
        <div className="hero-info" style={{ animationDelay: '1.5s' }}>
        
          <p className="info-subtext"><span style={{ fontSize: '1.4em', fontWeight: '600' }}>마인드 가든</span>이 , 여러분의 성장과 변화를 위해 함께 하겠습니다.</p>
        </div>
      </div>

      <div className="scroll-down">
        <span className="scroll-text">Scroll</span>
        <span className="scroll-line"></span>
      </div>
    </section>
  );
}


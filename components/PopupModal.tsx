'use client';

import { useState, useEffect } from 'react';

// 모바일 감지 훅
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

interface PopupModalProps {
  popup: {
    id: number;
    title: string;
    content: string | null;
    linkUrl: string | null;
  };
  onClose: () => void;
}

export default function PopupModal({ popup, onClose }: PopupModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    // 애니메이션을 위한 지연
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleClose = () => {
    if (dontShowAgain) {
      // 24시간 동안 보지 않기 쿠키 설정
      const expires = new Date();
      expires.setTime(expires.getTime() + 24 * 60 * 60 * 1000); // 24시간 후
      document.cookie = `popup_hidden_${popup.id}=true; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    }
    onClose();
  };

  // content에 이미지가 포함되어 있는지 확인
  const hasImageInContent = popup.content?.includes('<img') || false;
  // content에 텍스트가 있는지 확인 (이미지 태그 제외)
  const hasTextInContent = popup.content ? popup.content.replace(/<img[^>]*>/gi, '').trim().length > 0 : false;
  // 텍스트만 있으면 기본 디자인 적용
  const hasTextOnly = !hasImageInContent && (popup.title || hasTextInContent);

  // HTML 콘텐츠의 이미지를 반응형으로 처리하는 함수
  const processContent = (content: string | null) => {
    if (!content) return '';
    
    // 이미지 태그에 반응형 스타일 추가
    return content.replace(
      /<img([^>]*?)src="([^"]+)"([^>]*?)>/gi,
      (match, before, src, after) => {
        const styleMatch = before.match(/style="([^"]*)"/i) || after.match(/style="([^"]*)"/i);
        const existingStyle = styleMatch ? styleMatch[1] : '';
        const newStyle = `max-width: 100%; height: auto; border-radius: var(--radius-sm); margin: 12px 0; ${existingStyle}`;
        
        if (before.includes('style=') || after.includes('style=')) {
          return match.replace(/style="[^"]*"/i, `style="${newStyle}"`);
        } else {
          return `<img${before} style="${newStyle}" src="${src}"${after}>`;
        }
      }
    );
  };

  return (
    <div
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease',
        padding: '20px',
      }}
    >
      <div
        onClick={handleContentClick}
        style={{
          backgroundColor: 'transparent',
          borderRadius: 'var(--radius-md)',
          maxWidth: hasImageInContent ? (isMobile ? '95vw' : 'min(95vw, 1200px)') : (isMobile ? '95vw' : 'min(95vw, 600px)'),
          width: 'fit-content',
          minWidth: isMobile ? '90vw' : 'min(90vw, 320px)',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
          transform: isVisible ? 'scale(1)' : 'scale(0.9)',
          transition: 'transform 0.3s ease',
          boxShadow: 'var(--shadow-2)',
          margin: '0 auto',
        }}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: isMobile ? '8px' : '12px',
            right: isMobile ? '8px' : '12px',
            width: isMobile ? '32px' : '36px',
            height: isMobile ? '32px' : '36px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isMobile ? '20px' : '24px',
            color: 'var(--text-main)',
            zIndex: 10,
            transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            backdropFilter: 'blur(8px)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
          }}
        >
          ×
        </button>

        {/* content에 이미지가 포함된 경우: 홈페이지와 일체감 있는 디자인 적용 */}
        {hasImageInContent && (
          <div 
            style={{ 
              position: 'relative',
              padding: isMobile ? '20px' : '40px',
              paddingBottom: isMobile ? '70px' : '90px',
              background: 'linear-gradient(135deg, var(--bg-pastel-1) 0%, var(--bg-pastel-2) 100%)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-soft)',
              width: 'fit-content',
              minWidth: isMobile ? '90vw' : 'min(90vw, 320px)',
              maxWidth: '100%',
            }}
          >
            {/* 제목이 있으면 표시 */}
            {popup.title && (
              <h2
                style={{
                  fontSize: isMobile ? '1.25rem' : '1.75rem',
                  fontWeight: '700',
                  marginBottom: isMobile ? '16px' : '24px',
                  color: 'var(--text-main)',
                  background: 'linear-gradient(135deg, var(--accent-sky) 0%, var(--accent-lavender) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textAlign: 'center',
                }}
              >
                {popup.title}
              </h2>
            )}
            
            {/* 이미지와 텍스트를 담는 컨테이너 */}
            <div
              style={{
                padding: isMobile ? '16px' : '24px',
                backgroundColor: 'white',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-1)',
                border: '1px solid var(--border-soft)',
                overflow: 'hidden',
                width: 'fit-content',
                maxWidth: '100%',
              }}
            >
              <div
                style={{
                  lineHeight: '1.8',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                }}
                dangerouslySetInnerHTML={{ __html: processContent(popup.content) }}
              />
            </div>
            
            {/* 링크가 있으면 버튼 표시 */}
            {popup.linkUrl && (
              <div style={{ textAlign: 'center', marginTop: isMobile ? '16px' : '24px' }}>
                <a
                  href={popup.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    padding: isMobile ? '12px 20px' : '14px 28px',
                    background: 'linear-gradient(135deg, var(--accent-sky) 0%, var(--accent-mint) 100%)',
                    color: 'var(--text-main)',
                    textDecoration: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: '600',
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(184, 212, 227, 0.3)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(184, 212, 227, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(184, 212, 227, 0.3)';
                  }}
                >
                  자세히 보기
                </a>
              </div>
            )}
          </div>
        )}

        {/* 텍스트만 있을 때: 기본 디자인 템플릿 적용 */}
        {hasTextOnly && (
          <div
            style={{
              padding: isMobile ? '20px' : '40px',
              paddingBottom: isMobile ? '70px' : '90px',
              background: 'linear-gradient(135deg, var(--bg-pastel-1) 0%, var(--bg-pastel-2) 100%)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-soft)',
              marginBottom: '0',
            }}
          >
            <div
              style={{
                padding: isMobile ? '16px' : '24px',
                paddingBottom: '24px',
                backgroundColor: 'white',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-1)',
                border: '1px solid var(--border-soft)',
                marginBottom: '0',
              }}
            >
              <h2
                style={{
                  fontSize: isMobile ? '1.25rem' : '1.75rem',
                  fontWeight: '700',
                  marginBottom: isMobile ? '12px' : '16px',
                  color: 'var(--text-main)',
                  background: 'linear-gradient(135deg, var(--accent-sky) 0%, var(--accent-lavender) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {popup.title}
              </h2>
              {popup.content && (
                <div
                  style={{
                    fontSize: isMobile ? '0.9rem' : '1.05rem',
                    color: 'var(--text-sub)',
                    lineHeight: '1.8',
                    marginBottom: isMobile ? '16px' : '24px',
                    whiteSpace: 'pre-wrap',
                  }}
                  dangerouslySetInnerHTML={{ __html: processContent(popup.content) }}
                />
              )}
              {popup.linkUrl && (
                <a
                  href={popup.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    padding: isMobile ? '12px 20px' : '14px 28px',
                    background: 'linear-gradient(135deg, var(--accent-sky) 0%, var(--accent-mint) 100%)',
                    color: 'var(--text-main)',
                    textDecoration: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: '600',
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(184, 212, 227, 0.3)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(184, 212, 227, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(184, 212, 227, 0.3)';
                  }}
                >
                  자세히 보기
                </a>
              )}
            </div>
          </div>
        )}

        {/* 24시간 동안 보지 않기 체크박스 */}
        <div
          style={{
            position: 'absolute',
            bottom: hasTextOnly ? (isMobile ? '10px' : '15px') : (isMobile ? '15px' : '20px'),
            left: isMobile ? '10px' : '20px',
            right: isMobile ? '10px' : 'auto',
            transform: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '6px' : '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            padding: isMobile ? '8px 12px' : '10px 16px',
            borderRadius: 'var(--radius-sm)',
            fontSize: isMobile ? '12px' : '14px',
            fontWeight: '500',
            zIndex: 100,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
          }}
        >
          <input
            type="checkbox"
            id={`popup-dont-show-${popup.id}`}
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            style={{
              width: isMobile ? '16px' : '18px',
              height: isMobile ? '16px' : '18px',
              cursor: 'pointer',
              accentColor: 'var(--accent-sky)',
            }}
          />
          <label
            htmlFor={`popup-dont-show-${popup.id}`}
            style={{
              cursor: 'pointer',
              color: 'var(--text-main)',
              userSelect: 'none',
            }}
          >
            24시간 동안 보지 않기
          </label>
        </div>
      </div>
    </div>
  );
}

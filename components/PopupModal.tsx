'use client';

import { useState, useEffect } from 'react';

interface PopupModalProps {
  popup: {
    id: number;
    title: string;
    content: string | null;
    imageUrl: string | null;
    linkUrl: string | null;
  };
  onClose: () => void;
}

export default function PopupModal({ popup, onClose }: PopupModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

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

  // 이미지가 있으면 기본 디자인 없이 이미지만 표시
  const hasImage = !!popup.imageUrl;
  // 텍스트만 있으면 기본 디자인 적용
  const hasTextOnly = !hasImage && (popup.title || popup.content);

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
          backgroundColor: hasImage ? 'transparent' : 'white',
          borderRadius: hasImage ? 0 : 'var(--radius-md)',
          maxWidth: hasImage ? '90vw' : '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
          transform: isVisible ? 'scale(1)' : 'scale(0.9)',
          transition: 'transform 0.3s ease',
          boxShadow: hasImage ? 'none' : '0 10px 40px rgba(0, 0, 0, 0.2)',
        }}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: hasImage ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.1)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            color: hasImage ? 'var(--text-main)' : 'var(--text-main)',
            zIndex: 10,
            transition: 'all 0.2s',
            boxShadow: hasImage ? '0 2px 8px rgba(0, 0, 0, 0.15)' : 'none',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = hasImage ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 0.2)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = hasImage ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.1)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          ×
        </button>

        {/* 이미지가 있을 때: 이미지만 표시 */}
        {hasImage && (
          <div style={{ position: 'relative' }}>
            <img
              src={popup.imageUrl!}
              alt={popup.title}
              style={{
                width: '100%',
                maxHeight: '90vh',
                objectFit: 'contain',
                display: 'block',
              }}
            />
            {popup.linkUrl && (
              <a
                href={popup.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  position: 'absolute',
                  bottom: '20px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'inline-block',
                  padding: '12px 32px',
                  backgroundColor: 'rgba(184, 212, 227, 0.95)',
                  color: 'var(--text-main)',
                  textDecoration: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(184, 212, 227, 1)';
                  e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(184, 212, 227, 0.95)';
                  e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
                }}
              >
                자세히 보기
              </a>
            )}
          </div>
        )}

        {/* 텍스트만 있을 때: 기본 디자인 템플릿 적용 */}
        {hasTextOnly && (
          <div
            style={{
              padding: '40px',
              background: 'linear-gradient(135deg, var(--bg-pastel-1) 0%, var(--bg-pastel-2) 100%)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-soft)',
            }}
          >
            <div
              style={{
                padding: '24px',
                backgroundColor: 'white',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-1)',
                border: '1px solid var(--border-soft)',
              }}
            >
              <h2
                style={{
                  fontSize: '1.75rem',
                  fontWeight: '700',
                  marginBottom: '16px',
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
                    fontSize: '1.05rem',
                    color: 'var(--text-sub)',
                    lineHeight: '1.8',
                    marginBottom: '24px',
                    whiteSpace: 'pre-wrap',
                  }}
                  dangerouslySetInnerHTML={{ __html: popup.content }}
                />
              )}
              {popup.linkUrl && (
                <a
                  href={popup.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    padding: '14px 28px',
                    background: 'linear-gradient(135deg, var(--accent-sky) 0%, var(--accent-mint) 100%)',
                    color: 'var(--text-main)',
                    textDecoration: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: '600',
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
            bottom: '20px',
            left: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            padding: '10px 16px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '14px',
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
              width: '18px',
              height: '18px',
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

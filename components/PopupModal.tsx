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

  useEffect(() => {
    // 애니메이션을 위한 지연
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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
          backgroundColor: 'white',
          borderRadius: 'var(--radius-md)',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
          transform: isVisible ? 'scale(1)' : 'scale(0.9)',
          transition: 'transform 0.3s ease',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        }}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            color: 'var(--text-main)',
            zIndex: 10,
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
          }}
        >
          ×
        </button>

        {/* 팝업 내용 */}
        <div style={{ padding: '24px' }}>
          {popup.imageUrl && (
            <img
              src={popup.imageUrl}
              alt={popup.title}
              style={{
                width: '100%',
                maxHeight: '400px',
                objectFit: 'contain',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '16px',
              }}
            />
          )}
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            marginBottom: '12px',
            color: 'var(--text-main)',
          }}>
            {popup.title}
          </h2>
          {popup.content && (
            <div
              style={{
                fontSize: '1rem',
                color: 'var(--text-sub)',
                lineHeight: '1.6',
                marginBottom: '16px',
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
                padding: '12px 24px',
                backgroundColor: 'var(--accent-sky)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: 'var(--radius-sm)',
                fontWeight: '600',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              자세히 보기
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Check } from 'lucide-react';

const ColorPaletteShowcase = () => {
  const [copiedColor, setCopiedColor] = useState(null);

  const colors = [
    { name: 'Cream', var: '--cream', hex: '#F5F5DC', usage: '메인 배경색' },
    { name: 'Light Beige', var: '--light-beige', hex: '#FDF5E6', usage: '보조 배경색' },
    { name: 'Cocoa', var: '--cocoa', hex: '#8B4513', usage: '텍스트 및 강조색' },
    { name: 'Olive Green', var: '--olive-green', hex: '#808000', usage: '버튼 및 액센트' },
    { name: 'Mint Green', var: '--mint-green', hex: '#98FB98', usage: '포인트 색상' },
    { name: 'Soft Mint', var: '--soft-mint', hex: '#B6E5D8', usage: '부드러운 액센트' },
    { name: 'Dark Gray', var: '--dark-gray', hex: '#2F2F2F', usage: '주 텍스트' },
    { name: 'Medium Gray', var: '--medium-gray', hex: '#6B6B6B', usage: '보조 텍스트' },
    { name: 'Light Cream', var: '--light-cream', hex: '#FFFEF7', usage: '밝은 배경' }
  ];

  const handleCopyColor = (color) => {
    navigator.clipboard.writeText(color.hex);
    setCopiedColor(color.var);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  return (
    <section className="mg-section">
      <h2 className="mg-h2 mg-text-center mg-mb-lg">색상 팔레트</h2>
      
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-lg)' }}>
          {colors.map((color) => (
            <div 
              key={color.var}
              className="mg-card"
              style={{ 
                cursor: 'pointer',
                transition: 'transform 0.2s ease',
                position: 'relative'
              }}
              onClick={() => handleCopyColor(color)}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              {/* Color Preview */}
              <div style={{
                width: '100%',
                height: '100px',
                backgroundColor: color.hex,
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--spacing-md)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {copiedColor === color.var && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 600,
                    gap: 'var(--spacing-sm)'
                  }}>
                    <Check size={20} />
                    복사됨!
                  </div>
                )}
              </div>

              {/* Color Info */}
              <h4 className="mg-h4 mg-mb-xs">{color.name}</h4>
              <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                <code style={{ 
                  fontSize: '0.875rem', 
                  color: 'var(--medium-gray)',
                  background: 'var(--light-beige)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  display: 'inline-block'
                }}>
                  {color.hex}
                </code>
              </div>
              <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                <code style={{ 
                  fontSize: '0.75rem', 
                  color: 'var(--medium-gray)',
                  background: 'var(--light-cream)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  display: 'inline-block'
                }}>
                  var({color.var})
                </code>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--medium-gray)' }}>
                {color.usage}
              </p>
            </div>
          ))}
        </div>

        {/* Usage Example */}
        <div className="mg-card" style={{ marginTop: 'var(--spacing-xl)', background: 'var(--light-cream)' }}>
          <h4 className="mg-h4 mg-mb-md">사용 방법</h4>
          <div style={{ 
            background: 'var(--dark-gray)', 
            color: 'var(--light-cream)',
            padding: 'var(--spacing-lg)',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            lineHeight: 1.8
          }}>
            <div>/* CSS에서 사용 */</div>
            <div style={{ color: 'var(--mint-green)' }}>.button {'{'}</div>
            <div style={{ paddingLeft: '1rem' }}>
              background: <span style={{ color: '#F5F5DC' }}>var(--mint-green)</span>;
            </div>
            <div style={{ paddingLeft: '1rem' }}>
              color: <span style={{ color: '#F5F5DC' }}>var(--dark-gray)</span>;
            </div>
            <div style={{ color: 'var(--mint-green)' }}>{'}'}</div>
          </div>

          <p className="mg-text-sm" style={{ marginTop: 'var(--spacing-md)', color: 'var(--medium-gray)', textAlign: 'center' }}>
            각 색상 카드를 클릭하면 HEX 코드가 클립보드에 복사됩니다
          </p>
        </div>
      </div>
    </section>
  );
};

export default ColorPaletteShowcase;


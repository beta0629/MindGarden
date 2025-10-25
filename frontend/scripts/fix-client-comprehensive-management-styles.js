const fs = require('fs');
const path = require('path');

/**
 * ClientComprehensiveManagement.js의 인라인 스타일을 CSS 클래스로 변환
 */

const filePath = path.join(__dirname, '../src/components/admin/ClientComprehensiveManagement.js');

function updateClientComprehensiveManagement() {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;

    // 인라인 스타일을 CSS 클래스로 변환
    const replacements = [
      // 카드 헤더
      {
        from: /style=\{\s*{\s*width:\s*'48px',\s*height:\s*'48px',\s*background:\s*'linear-gradient\(135deg,\s*#a8e6a3\s*0%,\s*#7dd87a\s*100%\)',\s*borderRadius:\s*'50%',\s*display:\s*'flex',\s*alignItems:\s*'center',\s*justifyContent:\s*'center',\s*color:\s*'white',\s*fontSize:\s*'var\(--font-size-lg\)',\s*marginRight:\s*'var\(--spacing-md\)'\s*}\s*\}/g,
        to: 'className="mg-v2-client-avatar-large"'
      },
      {
        from: /style=\s*\{\s*{\s*flex:\s*'1'\s*}\s*\}/g,
        to: 'className="mg-v2-client-info"'
      },
      {
        from: /style=\{\s*{\s*margin:\s*'0\s*0\s*4px\s*0',\s*fontSize:\s*'var\(--font-size-lg\)',\s*fontWeight:\s*'600',\s*color:\s*'var\(--color-text-primary\)'\s*}\s*\}/g,
        to: 'className="mg-v2-client-name-large"'
      },
      {
        from: /style=\{\s*{\s*margin:\s*'0',\s*fontSize:\s*'var\(--font-size-sm\)',\s*color:\s*'#6c757d'\s*}\s*\}/g,
        to: 'className="mg-v2-client-email-large"'
      },
      {
        from: /style=\s*\{\s*{\s*marginBottom:\s*'16px'\s*}\s*\}/g,
        to: 'className="mg-v2-client-card-content"'
      },
      // 디테일 행들
      {
        from: /style=\{\s*{\s*display:\s*'flex',\s*justifyContent:\s*'space-between',\s*alignItems:\s*'center',\s*marginBottom:\s*'12px'\s*}\s*\}/g,
        to: 'className="mg-v2-client-detail-row"'
      },
      {
        from: /style=\{\s*{\s*fontSize:\s*'var\(--font-size-sm\)',\s*color:\s*'#6c757d',\s*fontWeight:\s*'500'\s*}\s*\}/g,
        to: 'className="mg-v2-client-label"'
      },
      {
        from: /style=\{\s*{\s*fontSize:\s*'var\(--font-size-sm\)',\s*color:\s*'#2c3e50',\s*fontWeight:\s*'500'\s*}\s*\}/g,
        to: 'className="mg-v2-client-value"'
      },
      {
        from: /style=\{\s*{\s*fontSize:\s*'var\(--font-size-base\)',\s*color:\s*'#2c3e50',\s*fontWeight:\s*'600'\s*}\s*\}/g,
        to: 'className="mg-v2-client-value-large"'
      },
      // 배지들
      {
        from: /style=\{\s*{\s*display:\s*'inline-block',\s*padding:\s*'4px\s*12px',\s*borderRadius:\s*'16px',\s*fontSize:\s*'var\(--font-size-xs\)',\s*fontWeight:\s*'600',\s*textTransform:\s*'uppercase',\s*letterSpacing:\s*'0\.5px',\s*backgroundColor:\s*'#e3f2fd',\s*color:\s*'#1976d2'\s*}\s*\}/g,
        to: 'className="mg-v2-client-grade-badge"'
      },
      {
        from: /style=\{\s*{\s*display:\s*'inline-block',\s*padding:\s*'4px\s*12px',\s*borderRadius:\s*'16px',\s*fontSize:\s*'var\(--font-size-xs\)',\s*fontWeight:\s*'600',\s*textTransform:\s*'uppercase',\s*letterSpacing:\s*'0\.5px',\s*backgroundColor:\s*'#e8f5e8',\s*color:\s*'#2e7d32'\s*}\s*\}/g,
        to: 'className="mg-v2-client-status-badge"'
      },
      {
        from: /style=\{\s*{\s*display:\s*'inline-block',\s*padding:\s*'4px\s*12px',\s*borderRadius:\s*'16px',\s*fontSize:\s*'var\(--font-size-xs\)',\s*fontWeight:\s*'600',\s*textTransform:\s*'uppercase',\s*letterSpacing:\s*'0\.5px',\s*backgroundColor:\s*'#f8f9fa',\s*color:\s*'#6c757d'\s*}\s*\}/g,
        to: 'className="mg-v2-client-status-no-mapping"'
      }
    ];

    replacements.forEach(({ from, to }) => {
      const newContent = content.replace(from, to);
      if (newContent !== content) {
        content = newContent;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('✅ ClientComprehensiveManagement.js 인라인 스타일 변환 완료');
      return true;
    } else {
      console.log('⏭️  변경사항 없음: ClientComprehensiveManagement.js');
      return false;
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    return false;
  }
}

updateClientComprehensiveManagement();

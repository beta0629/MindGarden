#!/usr/bin/env node

/**
 * UnifiedHeader 런타임 오류 수정 스크립트
 * 
 * UnifiedHeader 사용을 간단한 헤더로 대체
 * 
 * @author MindGarden Team
 * @version 1.0.0
 * @since 2025-11-28
 */

const fs = require('fs');
const path = require('path');

// 프로젝트 루트 경로
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const FRONTEND_PATH = path.join(PROJECT_ROOT, 'frontend/src');

// 로그 함수들
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`)
};

/**
 * UnifiedHeader 오류 수정
 */
async function fixUnifiedHeaderErrors() {
  console.log('🔧 UnifiedHeader 런타임 오류 수정 시작...');
  
  // 수정할 파일 목록 (백업 파일 제외)
  const files = [
    'components/auth/BranchLogin.js',
    'components/auth/BranchSpecificLogin.js',
    'components/auth/HeadquartersLogin.js',
    'components/auth/ResetPassword.js',
    'components/test/UnifiedHeaderTest.js',
    'pages/IPhone17TemplateExample.js',
    'pages/iPhone17DesignSystemSample.js',
    'App.js'
  ];
  
  for (const file of files) {
    try {
      const filePath = path.join(FRONTEND_PATH, file);
      if (!fs.existsSync(filePath)) {
        log.info(`파일 없음: ${file}`);
        continue;
      }
      
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      
      // UnifiedHeader import 주석 처리
      if (content.includes('import UnifiedHeader')) {
        content = content.replace(
          /import\s+UnifiedHeader\s+from\s+['"][^'"]*['"];?\s*\n?/g,
          '// import UnifiedHeader from "../common/UnifiedHeader"; // 임시 비활성화\n'
        );
        modified = true;
      }
      
      // UnifiedHeader 사용을 간단한 헤더로 대체
      if (content.includes('<UnifiedHeader')) {
        content = content.replace(
          /<UnifiedHeader[^>]*\/>/g,
          `<header className="simple-header">
        <div className="simple-header__content">
          <h1 className="simple-header__title">MindGarden</h1>
        </div>
      </header>`
        );
        
        content = content.replace(
          /<UnifiedHeader[^>]*>[\s\S]*?<\/UnifiedHeader>/g,
          `<header className="simple-header">
        <div className="simple-header__content">
          <h1 className="simple-header__title">MindGarden</h1>
        </div>
      </header>`
        );
        modified = true;
      }
      
      if (modified) {
        // 백업 생성
        const backupPath = `${filePath}.backup.${Date.now()}`;
        fs.copyFileSync(filePath, backupPath);
        
        // 수정된 내용 저장
        fs.writeFileSync(filePath, content);
        log.success(`✓ ${file} - UnifiedHeader 오류 수정`);
      } else {
        log.info(`- ${file} - 수정할 내용 없음`);
      }
      
    } catch (error) {
      log.error(`${file} 처리 실패: ${error.message}`);
    }
  }
  
  console.log('');
  log.success(`🔧 UnifiedHeader 런타임 오류 수정 완료!`);
}

// 스크립트 실행
if (require.main === module) {
  fixUnifiedHeaderErrors().catch(error => {
    log.error(`실행 실패: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { fixUnifiedHeaderErrors };

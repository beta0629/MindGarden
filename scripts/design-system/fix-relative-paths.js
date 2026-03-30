#!/usr/bin/env node

/**
 * 상대 경로 수정 스크립트
 * 
 * 잘못된 상대 경로들을 올바른 경로로 수정
 * 
 * @author MindGarden Team
 * @version 1.0.0
 * @since 2025-11-28
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 프로젝트 루트 경로
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const FRONTEND_PATH = path.join(PROJECT_ROOT, 'frontend/src');

// 로그 함수들
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  warning: (msg) => console.log(`⚠️  ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`)
};

/**
 * 상대 경로 수정
 */
async function fixRelativePaths() {
  console.log('🔧 상대 경로 수정 시작...');
  
  // 모든 JS/JSX 파일 검색
  const files = glob.sync('**/*.{js,jsx}', { 
    cwd: FRONTEND_PATH,
    ignore: ['**/*.backup.*', '**/node_modules/**', '**/build/**']
  });
  
  let fixedFiles = 0;
  
  for (const file of files) {
    const filePath = path.join(FRONTEND_PATH, file);
    
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      
      // 잘못된 경로들 수정
      const pathFixes = [
        // 'ui' → '../ui' (components 하위에서)
        { from: /from\s+['"]ui['"];?/g, to: "from '../ui';" },
        { from: /from\s+['"]layout['"];?/g, to: "from '../layout';" },
        
        // 더 구체적인 패턴들
        { from: /import\s+([^}]+)\s+from\s+['"]ui['"];?/g, to: "import $1 from '../ui';" },
        { from: /import\s+([^}]+)\s+from\s+['"]layout['"];?/g, to: "import $1 from '../layout';" },
        
        // Named imports
        { from: /import\s*\{([^}]+)\}\s*from\s+['"]ui['"];?/g, to: "import { $1 } from '../ui';" },
        { from: /import\s*\{([^}]+)\}\s*from\s+['"]layout['"];?/g, to: "import { $1 } from '../layout';" }
      ];
      
      for (const fix of pathFixes) {
        if (fix.from.test(content)) {
          content = content.replace(fix.from, fix.to);
          modified = true;
        }
      }
      
      // 파일이 수정되었으면 저장
      if (modified) {
        // 백업 생성
        const backupPath = `${filePath}.backup.${Date.now()}`;
        fs.copyFileSync(filePath, backupPath);
        
        // 수정된 내용 저장
        fs.writeFileSync(filePath, content);
        fixedFiles++;
        
        log.success(`✓ ${file} - 상대 경로 수정`);
      }
      
    } catch (error) {
      log.error(`${file} 처리 실패: ${error.message}`);
    }
  }
  
  console.log('');
  log.success(`✅ 상대 경로 수정 완료: ${fixedFiles}개 파일`);
}

// 스크립트 실행
if (require.main === module) {
  fixRelativePaths().catch(error => {
    log.error(`실행 실패: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { fixRelativePaths };

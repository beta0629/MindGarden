#!/usr/bin/env node

/**
 * 작동하는 Import로 되돌리기 스크립트
 * 
 * 통합된 컴포넌트에 문제가 있으므로 기존 작동하는 경로로 되돌림
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
 * 작동하는 Import로 되돌리기
 */
async function revertToWorkingImports() {
  console.log('🔄 작동하는 Import 경로로 되돌리기 시작...');
  
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
      
      // 문제가 있는 import들을 기존 작동하는 경로로 되돌리기
      const reverts = [
        // Button 관련
        { from: /import\s*\{\s*Button\s+as\s+MGButton\s*\}\s*from\s*['"][^'"]*ui['"];?/g, to: "import MGButton from '../common/MGButton';" },
        { from: /import\s+MGButton\s+from\s+['"][^'"]*ui['"];?/g, to: "import MGButton from '../common/MGButton';" },
        
        // Card 관련
        { from: /import\s*\{\s*Card\s+as\s+MGCard\s*\}\s*from\s*['"][^'"]*ui['"];?/g, to: "import MGCard from '../common/MGCard';" },
        { from: /import\s+MGCard\s+from\s+['"][^'"]*ui['"];?/g, to: "import MGCard from '../common/MGCard';" },
        
        // Loading 관련
        { from: /import\s*\{\s*Loading\s+as\s+UnifiedLoading\s*\}\s*from\s*['"][^'"]*ui['"];?/g, to: "import UnifiedLoading from '../common/UnifiedLoading';" },
        { from: /import\s+UnifiedLoading\s+from\s+['"][^'"]*ui['"];?/g, to: "import UnifiedLoading from '../common/UnifiedLoading';" },
        
        // Modal 관련
        { from: /import\s*\{\s*Modal\s+as\s+UnifiedModal\s*\}\s*from\s*['"][^'"]*ui['"];?/g, to: "import UnifiedModal from '../common/modals/UnifiedModal';" },
        { from: /import\s+UnifiedModal\s+from\s+['"][^'"]*ui['"];?/g, to: "import UnifiedModal from '../common/modals/UnifiedModal';" },
        
        // Header 관련
        { from: /import\s*\{\s*Header\s+as\s+UnifiedHeader\s*\}\s*from\s*['"][^'"]*layout['"];?/g, to: "import UnifiedHeader from '../common/UnifiedHeader';" },
        { from: /import\s+UnifiedHeader\s+from\s+['"][^'"]*layout['"];?/g, to: "import UnifiedHeader from '../common/UnifiedHeader';" }
      ];
      
      for (const revert of reverts) {
        if (revert.from.test(content)) {
          content = content.replace(revert.from, revert.to);
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
        
        log.success(`✓ ${file} - Import 경로 되돌리기`);
      }
      
    } catch (error) {
      log.error(`${file} 처리 실패: ${error.message}`);
    }
  }
  
  console.log('');
  log.success(`✅ Import 경로 되돌리기 완료: ${fixedFiles}개 파일`);
}

// 스크립트 실행
if (require.main === module) {
  revertToWorkingImports().catch(error => {
    log.error(`실행 실패: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { revertToWorkingImports };

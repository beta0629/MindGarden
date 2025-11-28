#!/usr/bin/env node

/**
 * 최종 경로 수정 스크립트
 * 
 * 모든 상대 경로를 올바르게 수정
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
 * 최종 경로 수정
 */
async function finalPathFix() {
  console.log('🔧 최종 경로 수정 시작...');
  
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
      
      // 파일 위치에 따른 올바른 경로 계산
      const relativePath = path.relative(FRONTEND_PATH, filePath);
      const depth = relativePath.split(path.sep).length - 1;
      const commonPath = '../'.repeat(depth) + 'components/common/';
      
      // 잘못된 경로들을 올바른 경로로 수정
      const fixes = [
        // MGButton 경로 수정
        { from: /import\s+MGButton\s+from\s+['"][^'"]*common\/MGButton['"];?/g, to: `import MGButton from '${commonPath}MGButton';` },
        { from: /import\s+MGButton\s+from\s+['"]\.\.\/common\/MGButton['"];?/g, to: `import MGButton from '${commonPath}MGButton';` },
        
        // MGCard 경로 수정
        { from: /import\s+MGCard\s+from\s+['"][^'"]*common\/MGCard['"];?/g, to: `import MGCard from '${commonPath}MGCard';` },
        { from: /import\s+MGCard\s+from\s+['"]\.\.\/common\/MGCard['"];?/g, to: `import MGCard from '${commonPath}MGCard';` },
        
        // UnifiedLoading 경로 수정
        { from: /import\s+UnifiedLoading\s+from\s+['"][^'"]*common\/UnifiedLoading['"];?/g, to: `import UnifiedLoading from '${commonPath}UnifiedLoading';` },
        { from: /import\s+UnifiedLoading\s+from\s+['"]\.\.\/common\/UnifiedLoading['"];?/g, to: `import UnifiedLoading from '${commonPath}UnifiedLoading';` },
        
        // UnifiedModal 경로 수정
        { from: /import\s+UnifiedModal\s+from\s+['"][^'"]*common\/modals\/UnifiedModal['"];?/g, to: `import UnifiedModal from '${commonPath}modals/UnifiedModal';` },
        { from: /import\s+UnifiedModal\s+from\s+['"]\.\.\/common\/modals\/UnifiedModal['"];?/g, to: `import UnifiedModal from '${commonPath}modals/UnifiedModal';` },
        
        // UnifiedHeader 경로 수정
        { from: /import\s+UnifiedHeader\s+from\s+['"][^'"]*common\/UnifiedHeader['"];?/g, to: `import UnifiedHeader from '${commonPath}UnifiedHeader';` },
        { from: /import\s+UnifiedHeader\s+from\s+['"]\.\.\/common\/UnifiedHeader['"];?/g, to: `import UnifiedHeader from '${commonPath}UnifiedHeader';` }
      ];
      
      for (const fix of fixes) {
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
        
        log.success(`✓ ${file} - 경로 수정`);
      }
      
    } catch (error) {
      log.error(`${file} 처리 실패: ${error.message}`);
    }
  }
  
  console.log('');
  log.success(`✅ 최종 경로 수정 완료: ${fixedFiles}개 파일`);
}

// 스크립트 실행
if (require.main === module) {
  finalPathFix().catch(error => {
    log.error(`실행 실패: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { finalPathFix };

#!/usr/bin/env node

/**
 * 중복 CSS 파일 정리 스크립트
 * 
 * 통합 CSS 변수 시스템 적용 후 기존 중복 파일들을 정리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-11-28
 */

const fs = require('fs');
const path = require('path');

// 로그 함수들
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  warning: (msg) => console.log(`⚠️  ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  phase: (msg) => console.log(`🚀 ${msg}`),
  highlight: (msg) => console.log(`🎯 ${msg}`)
};

// 프로젝트 루트 경로
const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const FRONTEND_PATH = path.join(PROJECT_ROOT, 'frontend/src');

// 정리할 중복 CSS 파일들
const DUPLICATE_CSS_FILES = [
  // 기존 CSS 변수 파일들 (통합됨)
  'styles/variables.css',
  'styles/css-variables.css',
  'styles/design-system.css', // 부분적으로 통합됨
  
  // 중복된 테마 파일들
  'styles/08-themes/mobile-theme.css', // styles/themes/mobile-theme.css와 중복
  'styles/08-themes/light-theme.css',
  'styles/08-themes/ios-theme.css',
  'styles/08-themes/high-contrast-theme.css',
  'styles/08-themes/dark-theme.css',
  
  // 중복된 컴포넌트 스타일들
  'styles/06-components/_base/_notifications.css', // 다른 곳에 통합됨
];

// 백업할 파일들 (완전히 삭제하지 않고 백업)
const BACKUP_FILES = [
  'styles/design-system.css', // 일부 고유 스타일이 있을 수 있음
  'styles/mindgarden-design-system.css', // 메인 디자인 시스템
];

// 정리 실행
async function cleanupDuplicateFiles() {
  console.log('🧹 중복 CSS 파일 정리 시작...');
  console.log('');

  // 백업 디렉토리 생성
  const backupDir = path.join(PROJECT_ROOT, 'backup/css-cleanup-' + new Date().toISOString().slice(0, 10));
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    log.info(`백업 디렉토리 생성: ${backupDir}`);
  }

  let processedFiles = 0;
  let backedupFiles = 0;
  let removedFiles = 0;

  // Phase 1: 백업이 필요한 파일들 처리
  log.phase('Phase 1: 중요 파일 백업 중...');
  
  for (const filePath of BACKUP_FILES) {
    const fullPath = path.join(FRONTEND_PATH, filePath);
    
    if (fs.existsSync(fullPath)) {
      const backupPath = path.join(backupDir, filePath);
      const backupDirPath = path.dirname(backupPath);
      
      // 백업 디렉토리 생성
      if (!fs.existsSync(backupDirPath)) {
        fs.mkdirSync(backupDirPath, { recursive: true });
      }
      
      // 파일 백업
      fs.copyFileSync(fullPath, backupPath);
      log.success(`백업 완료: ${filePath}`);
      backedupFiles++;
    } else {
      log.warning(`파일 없음: ${filePath}`);
    }
    
    processedFiles++;
  }

  console.log('');

  // Phase 2: 중복 파일들 제거
  log.phase('Phase 2: 중복 파일 제거 중...');
  
  for (const filePath of DUPLICATE_CSS_FILES) {
    const fullPath = path.join(FRONTEND_PATH, filePath);
    
    if (fs.existsSync(fullPath)) {
      // 백업 먼저 생성
      const backupPath = path.join(backupDir, filePath);
      const backupDirPath = path.dirname(backupPath);
      
      if (!fs.existsSync(backupDirPath)) {
        fs.mkdirSync(backupDirPath, { recursive: true });
      }
      
      fs.copyFileSync(fullPath, backupPath);
      
      // 파일 제거
      fs.unlinkSync(fullPath);
      log.success(`제거 완료: ${filePath}`);
      removedFiles++;
    } else {
      log.warning(`파일 없음: ${filePath}`);
    }
    
    processedFiles++;
  }

  console.log('');

  // Phase 3: import 문 정리
  log.phase('Phase 3: CSS import 문 정리 중...');
  
  await cleanupCSSImports();

  console.log('');

  // 결과 요약
  console.log('🎉 중복 CSS 파일 정리 완료!');
  console.log('');
  console.log('📊 정리 결과:');
  console.log(`  📁 처리된 파일: ${processedFiles}개`);
  console.log(`  💾 백업된 파일: ${backedupFiles}개`);
  console.log(`  🗑️  제거된 파일: ${removedFiles}개`);
  console.log(`  📂 백업 위치: ${backupDir}`);
  console.log('');
  console.log('🎯 다음 단계:');
  console.log('  1. npm run build (빌드 테스트)');
  console.log('  2. 브라우저에서 스타일 확인');
  console.log('  3. 문제 발생 시 백업에서 복원');
  console.log('');
}

// CSS import 문 정리
async function cleanupCSSImports() {
  const cssFiles = [
    'styles/main.css',
    'styles/common/index.css',
    'styles/index.css'
  ];

  for (const filePath of cssFiles) {
    const fullPath = path.join(FRONTEND_PATH, filePath);
    
    if (fs.existsSync(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;

      // 제거된 파일들의 import 문 제거
      const importPatterns = [
        /@import\s+['"]\.\/(08-themes\/[^'"]+)['"]\s*;/g,
        /@import\s+['"]\.\/(06-components\/_base\/[^'"]+)['"]\s*;/g,
        /@import\s+['"]\.\/(variables\.css)['"]\s*;/g,
        /@import\s+['"]\.\/(css-variables\.css)['"]\s*;/g,
      ];

      for (const pattern of importPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          content = content.replace(pattern, '');
          modified = true;
          log.info(`import 문 제거: ${matches.join(', ')} (${filePath})`);
        }
      }

      if (modified) {
        // 빈 줄 정리
        content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
        fs.writeFileSync(fullPath, content);
        log.success(`import 문 정리 완료: ${filePath}`);
      }
    }
  }
}

// 스크립트 실행
if (require.main === module) {
  cleanupDuplicateFiles().catch(error => {
    console.log(`❌ 스크립트 실행 실패: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { cleanupDuplicateFiles };

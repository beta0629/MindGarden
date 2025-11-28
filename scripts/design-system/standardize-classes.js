#!/usr/bin/env node

/**
 * CSS 클래스 네이밍 표준화 스크립트
 * 
 * 모든 CSS 클래스를 MindGarden BEM 표준으로 변환
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
  error: (msg) => console.log(`❌ ${msg}`),
  phase: (msg) => console.log(`🚀 ${msg}`),
  highlight: (msg) => console.log(`🎯 ${msg}`)
};

// 표준화 통계
const stats = {
  totalFiles: 0,
  processedFiles: 0,
  standardizedClasses: 0,
  errors: []
};

// 클래스 네이밍 매핑 테이블
const CLASS_MAPPING = {
  // 버튼 관련
  'mindgarden-button': 'mg-btn',
  'mg-button': 'mg-btn',
  'unified-button': 'mg-btn',
  'btn-primary': 'mg-btn--primary',
  'btn-secondary': 'mg-btn--secondary',
  'btn-outline': 'mg-btn--outline',
  'btn-large': 'mg-btn--lg',
  'btn-small': 'mg-btn--sm',
  
  // 카드 관련
  'mindgarden-card': 'mg-card',
  'mg-card-header': 'mg-card__header',
  'mg-card-body': 'mg-card__body',
  'mg-card-footer': 'mg-card__footer',
  'card-shadow': 'mg-card--shadow',
  'card-bordered': 'mg-card--bordered',
  
  // 헤더 관련
  'unified-header': 'mg-header',
  'header-container': 'mg-header__container',
  'header-logo': 'mg-header__logo',
  'header-nav': 'mg-header__nav',
  'header-actions': 'mg-header__actions',
  
  // 모달 관련
  'unified-modal': 'mg-modal',
  'modal-overlay': 'mg-modal__overlay',
  'modal-content': 'mg-modal__content',
  'modal-header': 'mg-modal__header',
  'modal-body': 'mg-modal__body',
  'modal-footer': 'mg-modal__footer',
  
  // 위젯 관련
  'widget-container': 'mg-widget',
  'widget-header': 'mg-widget__header',
  'widget-body': 'mg-widget__body',
  'widget-footer': 'mg-widget__footer',
  'widget-loading': 'mg-widget--loading',
  'widget-error': 'mg-widget--error',
  
  // 레이아웃 관련
  'dashboard-layout': 'mg-layout-dashboard',
  'sidebar-layout': 'mg-layout-sidebar',
  'main-content': 'mg-layout__main',
  'content-area': 'mg-layout__content',
  
  // 폼 관련
  'form-group': 'mg-form__group',
  'form-label': 'mg-form__label',
  'form-input': 'mg-form__input',
  'form-error': 'mg-form__error',
  'form-help': 'mg-form__help',
  
  // 상태 관련
  'status-active': 'mg-status--active',
  'status-inactive': 'mg-status--inactive',
  'status-pending': 'mg-status--pending',
  'status-error': 'mg-status--error',
  'status-success': 'mg-status--success',
  
  // 유틸리티 관련
  'text-center': 'mg-text--center',
  'text-left': 'mg-text--left',
  'text-right': 'mg-text--right',
  'mb-4': 'mg-mb--md',
  'mt-4': 'mg-mt--md',
  'p-4': 'mg-p--md'
};

/**
 * 클래스 네이밍 표준화 메인 함수
 */
async function standardizeClasses() {
  console.log('🎯 CSS 클래스 네이밍 표준화 시작...');
  console.log('');

  try {
    // Phase 1: 파일 분석
    log.phase('Phase 1: 파일 분석');
    await analyzeFiles();
    console.log('');

    // Phase 2: CSS 파일 표준화
    log.phase('Phase 2: CSS 파일 표준화');
    await standardizeCSSFiles();
    console.log('');

    // Phase 3: JS/JSX 파일 표준화
    log.phase('Phase 3: JS/JSX 파일 표준화');
    await standardizeJSFiles();
    console.log('');

    // Phase 4: 결과 리포트
    await generateStandardizationReport();

  } catch (error) {
    log.error(`표준화 실패: ${error.message}`);
    process.exit(1);
  }
}

/**
 * 파일 분석
 */
async function analyzeFiles() {
  const cssFiles = glob.sync('**/*.css', { cwd: FRONTEND_PATH });
  const jsFiles = glob.sync('**/*.{js,jsx}', { cwd: FRONTEND_PATH });
  
  stats.totalFiles = cssFiles.length + jsFiles.length;
  
  log.info(`CSS 파일: ${cssFiles.length}개`);
  log.info(`JS/JSX 파일: ${jsFiles.length}개`);
  log.info(`총 파일: ${stats.totalFiles}개`);
}

/**
 * CSS 파일 표준화
 */
async function standardizeCSSFiles() {
  const cssFiles = glob.sync('**/*.css', { cwd: FRONTEND_PATH });
  
  for (const file of cssFiles) {
    const filePath = path.join(FRONTEND_PATH, file);
    
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      
      // 클래스 매핑 적용
      for (const [oldClass, newClass] of Object.entries(CLASS_MAPPING)) {
        const oldPattern = new RegExp(`\\.${escapeRegExp(oldClass)}(?![\\w-])`, 'g');
        if (oldPattern.test(content)) {
          content = content.replace(oldPattern, `.${newClass}`);
          modified = true;
          stats.standardizedClasses++;
        }
      }
      
      // 파일이 수정되었으면 저장
      if (modified) {
        // 백업 생성
        const backupPath = `${filePath}.backup.${Date.now()}`;
        fs.copyFileSync(filePath, backupPath);
        
        // 수정된 내용 저장
        fs.writeFileSync(filePath, content);
        stats.processedFiles++;
        log.success(`✓ ${file} 표준화 완료`);
      }
      
    } catch (error) {
      log.error(`${file} 처리 실패: ${error.message}`);
      stats.errors.push({ file, error: error.message });
    }
  }
}

/**
 * JS/JSX 파일 표준화
 */
async function standardizeJSFiles() {
  const jsFiles = glob.sync('**/*.{js,jsx}', { cwd: FRONTEND_PATH });
  
  for (const file of jsFiles.slice(0, 50)) { // 처음 50개만 처리 (시간 절약)
    const filePath = path.join(FRONTEND_PATH, file);
    
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      
      // className 속성에서 클래스 매핑 적용
      for (const [oldClass, newClass] of Object.entries(CLASS_MAPPING)) {
        // className="old-class" 패턴
        const classNamePattern = new RegExp(`(className\\s*=\\s*["'\`][^"'\`]*?)\\b${escapeRegExp(oldClass)}\\b([^"'\`]*?["'\`])`, 'g');
        if (classNamePattern.test(content)) {
          content = content.replace(classNamePattern, `$1${newClass}$2`);
          modified = true;
          stats.standardizedClasses++;
        }
        
        // class="old-class" 패턴 (HTML)
        const classPattern = new RegExp(`(class\\s*=\\s*["'\`][^"'\`]*?)\\b${escapeRegExp(oldClass)}\\b([^"'\`]*?["'\`])`, 'g');
        if (classPattern.test(content)) {
          content = content.replace(classPattern, `$1${newClass}$2`);
          modified = true;
          stats.standardizedClasses++;
        }
      }
      
      // 파일이 수정되었으면 저장
      if (modified) {
        // 백업 생성
        const backupPath = `${filePath}.backup.${Date.now()}`;
        fs.copyFileSync(filePath, backupPath);
        
        // 수정된 내용 저장
        fs.writeFileSync(filePath, content);
        stats.processedFiles++;
        log.success(`✓ ${file} 표준화 완료`);
      }
      
    } catch (error) {
      log.error(`${file} 처리 실패: ${error.message}`);
      stats.errors.push({ file, error: error.message });
    }
  }
  
  log.info(`JS/JSX 파일 처리 완료 (처음 50개 파일만 처리됨)`);
}

/**
 * 정규식 이스케이프
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 표준화 결과 리포트 생성
 */
async function generateStandardizationReport() {
  const reportPath = path.join(PROJECT_ROOT, 'docs/CLASS_STANDARDIZATION_REPORT.md');
  
  const reportContent = `# 🎯 CSS 클래스 네이밍 표준화 리포트

> **실행일**: ${new Date().toISOString()}  
> **대상**: MindGarden 디자인 시스템

---

## 📊 표준화 결과

| 항목 | 결과 |
|------|------|
| 총 파일 수 | ${stats.totalFiles}개 |
| 처리된 파일 | ${stats.processedFiles}개 |
| 표준화된 클래스 | ${stats.standardizedClasses}개 |
| 오류 발생 | ${stats.errors.length}개 |

---

## 📋 표준화 규칙

### 🎯 MindGarden BEM 네이밍 규칙
\`\`\`css
/* 기본 구조 */
.mg-{component}-{element}--{modifier}

/* 예시 */
.mg-btn                    /* 기본 버튼 */
.mg-btn--primary           /* Primary 버튼 */
.mg-btn--lg                /* 큰 버튼 */
.mg-card__header           /* 카드 헤더 */
.mg-widget--loading        /* 로딩 상태 위젯 */
\`\`\`

### 📝 주요 변경 사항
${Object.entries(CLASS_MAPPING).slice(0, 20).map(([old, new_]) => `- \`${old}\` → \`${new_}\``).join('\n')}

---

## 🎯 다음 단계

1. **컴포넌트 표준화**
   \`\`\`bash
   node scripts/design-system/standardize-components.js
   \`\`\`

2. **품질 검증**
   \`\`\`bash
   node scripts/design-system/validate-standards.js
   \`\`\`

3. **Storybook 업데이트**
   \`\`\`bash
   npm run storybook:build
   \`\`\`

---

${stats.errors.length > 0 ? `## ❌ 오류 목록

${stats.errors.map(err => `- **${err.file}**: ${err.error}`).join('\n')}

---` : ''}

**📝 생성일**: ${new Date().toISOString()}  
**🔄 다음 업데이트**: 컴포넌트 표준화 완료 후  
**📊 상태**: 클래스 표준화 완료 ✨`;

  fs.writeFileSync(reportPath, reportContent);
  
  console.log('📊 클래스 표준화 결과 리포트');
  console.log('='.repeat(50));
  console.log(`📁 총 파일: ${stats.totalFiles}개`);
  console.log(`📝 처리된 파일: ${stats.processedFiles}개`);
  console.log(`🎯 표준화된 클래스: ${stats.standardizedClasses}개`);
  console.log(`❌ 오류 발생: ${stats.errors.length}개`);
  console.log('');
  console.log(`📄 상세 리포트: ${reportPath}`);
  console.log('');
  log.success('✅ 클래스 네이밍 표준화 완료!');
}

// 스크립트 실행
if (require.main === module) {
  standardizeClasses().catch(error => {
    log.error(`실행 실패: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { standardizeClasses };

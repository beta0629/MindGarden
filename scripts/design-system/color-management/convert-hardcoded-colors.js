#!/usr/bin/env node

/**
 * 하드코딩된 색상값 자동 변환 도구
 * 
 * CI/BI 변경 대비 하드코딩된 색상을 CSS 변수로 자동 변환
 * 
 * @author MindGarden Team
 * @version 1.0.0
 * @since 2025-11-28
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 색상 매핑 테이블 (하드코딩 → CSS 변수)
const COLOR_MAPPING = {
  // Primary Colors
  '#007aff': 'var(--mg-primary-500)',
  '#007bff': 'var(--mg-primary-500)', 
  '#2196F3': 'var(--mg-primary-500)',
  '#3b82f6': 'var(--mg-primary-500)',
  '#6c5ce7': 'var(--mg-primary-500)',
  '#667eea': 'var(--mg-primary-500)',
  
  // Success Colors  
  '#28a745': 'var(--mg-success-500)',
  '#34c759': 'var(--mg-success-500)',
  '#4CAF50': 'var(--mg-success-500)',
  '#00b894': 'var(--mg-success-500)',
  '#10b981': 'var(--mg-success-500)',
  
  // Error/Danger Colors
  '#dc3545': 'var(--mg-error-500)',
  '#ff3b30': 'var(--mg-error-500)',
  '#F44336': 'var(--mg-error-500)',
  '#ff6b6b': 'var(--mg-error-500)',
  '#ef4444': 'var(--mg-error-500)',
  
  // Warning Colors
  '#ffc107': 'var(--mg-warning-500)',
  '#ff9500': 'var(--mg-warning-500)',
  '#FF9800': 'var(--mg-warning-500)',
  '#f59e0b': 'var(--mg-warning-500)',
  '#f093fb': 'var(--mg-warning-500)',
  
  // Info Colors
  '#17a2b8': 'var(--mg-info-500)',
  '#74b9ff': 'var(--mg-info-500)',
  
  // Secondary Colors
  '#6c757d': 'var(--mg-secondary-500)',
  '#1976D2': 'var(--mg-secondary-600)',
  
  // Gray Scale
  '#333333': 'var(--mg-gray-800)',
  '#666666': 'var(--mg-gray-600)', 
  '#999999': 'var(--mg-gray-500)',
  '#e0e0e0': 'var(--mg-gray-300)',
  '#f8f9fa': 'var(--mg-gray-100)',
  '#f5f5f5': 'var(--mg-gray-100)',
  
  // Background Colors
  '#ffffff': 'var(--mg-white)',
  '#000000': 'var(--mg-black)',
  
  // Brand Specific Colors (MindGarden)
  '#F5F5DC': 'var(--mg-cream)',
  '#FDF5E6': 'var(--mg-light-beige)',
  '#8B4513': 'var(--mg-cocoa)',
  '#808000': 'var(--mg-olive-green)',
  '#98FB98': 'var(--mg-mint-green)',
  '#B6E5D8': 'var(--mg-soft-mint)',
  
  // Purple Colors
  '#5856d6': 'var(--mg-purple-500)',
  '#8b5cf6': 'var(--mg-purple-500)',
  '#a29bfe': 'var(--mg-purple-400)',
  
  // Consultant Colors
  '#a29bfe': 'var(--mg-consultant-primary)',
  '#6c5ce7': 'var(--mg-consultant-dark)',
  
  // Finance Colors
  '#f39c12': 'var(--mg-finance-primary)',
  '#e67e22': 'var(--mg-finance-dark)'
};

// RGB/RGBA 색상 매핑
const RGB_MAPPING = {
  'rgb(0, 123, 255)': 'var(--mg-primary-500)',
  'rgb(40, 167, 69)': 'var(--mg-success-500)',
  'rgb(220, 53, 69)': 'var(--mg-error-500)',
  'rgb(255, 193, 7)': 'var(--mg-warning-500)',
  'rgb(23, 162, 184)': 'var(--mg-info-500)',
  'rgb(108, 117, 125)': 'var(--mg-secondary-500)',
  'rgba(255, 255, 255, 0.25)': 'var(--mg-glass-bg-light)',
  'rgba(255, 255, 255, 0.35)': 'var(--mg-glass-bg-medium)',
  'rgba(255, 255, 255, 0.45)': 'var(--mg-glass-bg-strong)',
  'rgba(0, 0, 0, 0.1)': 'var(--mg-shadow-light)',
  'rgba(0, 0, 0, 0.15)': 'var(--mg-shadow-medium)',
  'rgba(0, 0, 0, 0.5)': 'var(--mg-overlay)'
};

// 제외할 파일 패턴
const EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/build/**',
  '**/dist/**',
  '**/.git/**',
  '**/coverage/**',
  '**/*.min.js',
  '**/*.min.css'
];

// 백업할 파일들
const BACKUP_EXTENSIONS = ['.css', '.scss', '.js', '.jsx', '.ts', '.tsx'];

class HardcodedColorConverter {
  constructor(options = {}) {
    this.options = {
      dryRun: options.dryRun || false,
      backup: options.backup !== false,
      verbose: options.verbose || false,
      criticalOnly: options.criticalOnly || false,
      ...options
    };
    
    this.stats = {
      filesProcessed: 0,
      filesModified: 0,
      colorsConverted: 0,
      backupsCreated: 0,
      errors: []
    };
  }

  /**
   * 메인 실행 함수
   */
  async run() {
    console.log('🔄 하드코딩된 색상값 자동 변환 시작...\n');
    
    if (this.options.dryRun) {
      console.log('🧪 DRY RUN 모드 - 실제 파일은 수정되지 않습니다.\n');
    }

    const startTime = Date.now();

    // 파일 검색
    const files = await this.findFiles();
    console.log(`📁 처리 대상 파일: ${files.length}개\n`);

    // 각 파일 처리
    for (const file of files) {
      await this.processFile(file);
    }

    // 결과 리포트
    this.generateReport();

    const endTime = Date.now();
    console.log(`\n✅ 변환 완료 (${endTime - startTime}ms)`);
  }

  /**
   * 처리할 파일들 찾기
   */
  async findFiles() {
    const patterns = [
      'frontend/src/**/*.css',
      'frontend/src/**/*.scss',
      'frontend/src/**/*.js',
      'frontend/src/**/*.jsx',
      'frontend/src/**/*.ts',
      'frontend/src/**/*.tsx'
    ];

    let allFiles = [];
    
    for (const pattern of patterns) {
      const files = glob.sync(pattern, {
        ignore: EXCLUDE_PATTERNS,
        cwd: process.cwd()
      });
      allFiles = allFiles.concat(files);
    }

    // 중요 파일만 처리하는 옵션
    if (this.options.criticalOnly) {
      allFiles = allFiles.filter(file => this.isCriticalFile(file));
    }

    return [...new Set(allFiles)]; // 중복 제거
  }

  /**
   * 중요 파일 여부 확인
   */
  isCriticalFile(filePath) {
    const criticalPatterns = [
      /branding/i,
      /design-system/i,
      /theme/i,
      /color/i,
      /css-variables/i,
      /constants.*css/i,
      /mindgarden.*css/i
    ];

    return criticalPatterns.some(pattern => pattern.test(filePath));
  }

  /**
   * 개별 파일 처리
   */
  async processFile(filePath) {
    try {
      this.stats.filesProcessed++;
      
      const originalContent = fs.readFileSync(filePath, 'utf8');
      let modifiedContent = originalContent;
      let changeCount = 0;

      // HEX 색상 변환
      Object.entries(COLOR_MAPPING).forEach(([hexColor, cssVar]) => {
        const regex = new RegExp(hexColor.replace('#', '#'), 'gi');
        const matches = modifiedContent.match(regex);
        if (matches) {
          modifiedContent = modifiedContent.replace(regex, cssVar);
          changeCount += matches.length;
          
          if (this.options.verbose) {
            console.log(`  🎨 ${hexColor} → ${cssVar} (${matches.length}개)`);
          }
        }
      });

      // RGB/RGBA 색상 변환
      Object.entries(RGB_MAPPING).forEach(([rgbColor, cssVar]) => {
        const regex = new RegExp(rgbColor.replace(/[()]/g, '\\$&'), 'gi');
        const matches = modifiedContent.match(regex);
        if (matches) {
          modifiedContent = modifiedContent.replace(regex, cssVar);
          changeCount += matches.length;
          
          if (this.options.verbose) {
            console.log(`  🎨 ${rgbColor} → ${cssVar} (${matches.length}개)`);
          }
        }
      });

      // 변경사항이 있는 경우 처리
      if (changeCount > 0) {
        this.stats.filesModified++;
        this.stats.colorsConverted += changeCount;

        console.log(`📝 ${filePath} - ${changeCount}개 색상 변환`);

        if (!this.options.dryRun) {
          // 백업 생성
          if (this.options.backup) {
            await this.createBackup(filePath, originalContent);
          }

          // 파일 저장
          fs.writeFileSync(filePath, modifiedContent, 'utf8');
        }
      }

    } catch (error) {
      this.stats.errors.push({
        file: filePath,
        error: error.message
      });
      console.error(`❌ 파일 처리 실패: ${filePath} - ${error.message}`);
    }
  }

  /**
   * 백업 파일 생성
   */
  async createBackup(filePath, content) {
    const backupPath = `${filePath}.backup.${Date.now()}`;
    
    try {
      fs.writeFileSync(backupPath, content, 'utf8');
      this.stats.backupsCreated++;
      
      if (this.options.verbose) {
        console.log(`💾 백업 생성: ${backupPath}`);
      }
    } catch (error) {
      console.warn(`⚠️  백업 생성 실패: ${backupPath} - ${error.message}`);
    }
  }

  /**
   * 결과 리포트 생성
   */
  generateReport() {
    console.log('\n📊 변환 결과 리포트');
    console.log('='.repeat(50));
    
    console.log(`📁 처리된 파일: ${this.stats.filesProcessed}개`);
    console.log(`📝 수정된 파일: ${this.stats.filesModified}개`);
    console.log(`🎨 변환된 색상: ${this.stats.colorsConverted}개`);
    console.log(`💾 생성된 백업: ${this.stats.backupsCreated}개`);
    console.log(`❌ 오류 발생: ${this.stats.errors.length}개`);

    if (this.stats.errors.length > 0) {
      console.log('\n❌ 오류 목록:');
      this.stats.errors.forEach(({ file, error }) => {
        console.log(`  - ${file}: ${error}`);
      });
    }

    // 상세 리포트 파일 생성
    this.generateDetailedReport();
  }

  /**
   * 상세 리포트 파일 생성
   */
  generateDetailedReport() {
    const reportPath = 'docs/COLOR_CONVERSION_REPORT.md';
    
    const report = `# 🎨 색상 변환 리포트

> **생성일**: ${new Date().toISOString()}  
> **모드**: ${this.options.dryRun ? 'DRY RUN' : 'ACTUAL'}  
> **대상**: ${this.options.criticalOnly ? '중요 파일만' : '전체 파일'}

---

## 📊 변환 결과

| 구분 | 수량 |
|------|------|
| 처리된 파일 | ${this.stats.filesProcessed}개 |
| 수정된 파일 | ${this.stats.filesModified}개 |
| 변환된 색상 | ${this.stats.colorsConverted}개 |
| 생성된 백업 | ${this.stats.backupsCreated}개 |
| 오류 발생 | ${this.stats.errors.length}개 |

---

## 🎯 변환 규칙

### HEX 색상 변환
${Object.entries(COLOR_MAPPING).map(([hex, cssVar]) => 
  `- \`${hex}\` → \`${cssVar}\``
).join('\n')}

### RGB/RGBA 색상 변환  
${Object.entries(RGB_MAPPING).map(([rgb, cssVar]) => 
  `- \`${rgb}\` → \`${cssVar}\``
).join('\n')}

---

## 📋 다음 단계

1. **검증**: 변환된 파일들이 정상 동작하는지 확인
2. **테스트**: 전체 시스템 빌드 및 테스트 실행
3. **CSS 변수 정의**: 새로운 CSS 변수들이 실제로 정의되어 있는지 확인
4. **시각적 검토**: UI가 기존과 동일하게 표시되는지 확인

---

## 🚨 오류 목록

${this.stats.errors.length > 0 ? 
  this.stats.errors.map(({ file, error }) => `- \`${file}\`: ${error}`).join('\n') :
  '오류 없음 ✅'
}

---

**💡 다음 실행**: \`node scripts/validate-css-variables.js\`로 CSS 변수 정의 확인
`;

    fs.writeFileSync(reportPath, report);
    console.log(`\n📄 상세 리포트 생성: ${reportPath}`);
  }
}

// CLI 인터페이스
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  args.forEach(arg => {
    if (arg === '--dry-run') options.dryRun = true;
    if (arg === '--no-backup') options.backup = false;
    if (arg === '--verbose') options.verbose = true;
    if (arg === '--critical-only') options.criticalOnly = true;
  });

  return options;
}

// 스크립트 실행
if (require.main === module) {
  const options = parseArgs();
  const converter = new HardcodedColorConverter(options);
  
  console.log('사용법:');
  console.log('  node scripts/convert-hardcoded-colors.js [옵션]');
  console.log('');
  console.log('옵션:');
  console.log('  --dry-run        실제 파일 수정 없이 미리보기');
  console.log('  --no-backup      백업 파일 생성 안함');
  console.log('  --verbose        상세 로그 출력');
  console.log('  --critical-only  중요 파일만 처리');
  console.log('');
  
  converter.run().catch(console.error);
}

module.exports = HardcodedColorConverter;
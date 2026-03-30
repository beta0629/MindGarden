#!/usr/bin/env node

/**
 * 하드코딩된 색상값 탐지 도구
 * 
 * CI/BI 변경 대비 모든 하드코딩된 색상값을 탐지하고 리포트 생성
 * 
 * @author MindGarden Team
 * @version 1.0.0
 * @since 2025-11-28
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 색상 패턴 정의
const COLOR_PATTERNS = {
  HEX_3: /#[0-9a-fA-F]{3}(?![0-9a-fA-F])/g,           // #fff
  HEX_6: /#[0-9a-fA-F]{6}(?![0-9a-fA-F])/g,           // #ffffff
  RGB: /rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/g,       // rgb(255, 255, 255)
  RGBA: /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)/g, // rgba(255, 255, 255, 0.5)
  HSL: /hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)/g,     // hsl(0, 100%, 50%)
  HSLA: /hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[\d.]+\s*\)/g // hsla(0, 100%, 50%, 0.5)
};

// 제외할 파일/폴더 패턴
const EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/build/**',
  '**/dist/**',
  '**/.git/**',
  '**/coverage/**',
  '**/*.min.js',
  '**/*.min.css'
];

// 제외할 색상값 (일반적인 색상)
const EXCLUDE_COLORS = new Set([
  '#fff', '#ffffff', '#000', '#000000',
  '#transparent', 'transparent',
  'rgb(0, 0, 0)', 'rgb(255, 255, 255)',
  'rgba(0, 0, 0, 0)', 'rgba(255, 255, 255, 0)'
]);

// 파일 유형별 분류
const FILE_TYPES = {
  CSS: ['.css', '.scss', '.sass', '.less'],
  JS: ['.js', '.jsx', '.ts', '.tsx'],
  JSON: ['.json'],
  OTHER: []
};

class HardcodedColorDetector {
  constructor() {
    this.results = {
      totalFiles: 0,
      affectedFiles: 0,
      totalColors: 0,
      colorsByType: {},
      filesByType: {},
      criticalFiles: [],
      allFindings: []
    };
  }

  /**
   * 메인 실행 함수
   */
  async run() {
    console.log('🔍 하드코딩된 색상값 탐지 시작...\n');

    const startTime = Date.now();

    // 파일 검색
    const files = await this.findFiles();
    console.log(`📁 검사 대상 파일: ${files.length}개\n`);

    // 각 파일 검사
    for (const file of files) {
      await this.analyzeFile(file);
    }

    // 결과 리포트 생성
    this.generateReport();
    this.generateDetailedReport();
    this.generateCIBIActionPlan();

    const endTime = Date.now();
    console.log(`\n✅ 검사 완료 (${endTime - startTime}ms)`);
  }

  /**
   * 검사할 파일들 찾기
   */
  async findFiles() {
    const patterns = [
      'frontend/src/**/*.css',
      'frontend/src/**/*.scss',
      'frontend/src/**/*.js',
      'frontend/src/**/*.jsx',
      'frontend/src/**/*.ts',
      'frontend/src/**/*.tsx',
      'frontend/src/**/*.json'
    ];

    let allFiles = [];
    
    for (const pattern of patterns) {
      const files = glob.sync(pattern, {
        ignore: EXCLUDE_PATTERNS,
        cwd: process.cwd()
      });
      allFiles = allFiles.concat(files);
    }

    return [...new Set(allFiles)]; // 중복 제거
  }

  /**
   * 개별 파일 분석
   */
  async analyzeFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const fileType = this.getFileType(filePath);
      
      this.results.totalFiles++;
      
      if (!this.results.filesByType[fileType]) {
        this.results.filesByType[fileType] = 0;
      }
      this.results.filesByType[fileType]++;

      const findings = this.findColorsInContent(content, filePath);
      
      if (findings.length > 0) {
        this.results.affectedFiles++;
        this.results.allFindings.push({
          file: filePath,
          type: fileType,
          findings: findings,
          isCritical: this.isCriticalFile(filePath)
        });

        if (this.isCriticalFile(filePath)) {
          this.results.criticalFiles.push(filePath);
        }
      }

    } catch (error) {
      console.warn(`⚠️  파일 읽기 실패: ${filePath} - ${error.message}`);
    }
  }

  /**
   * 파일 내용에서 색상값 찾기
   */
  findColorsInContent(content, filePath) {
    const findings = [];
    const lines = content.split('\n');

    Object.entries(COLOR_PATTERNS).forEach(([patternName, pattern]) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const colorValue = match[0];
        
        // 제외할 색상인지 확인
        if (EXCLUDE_COLORS.has(colorValue.toLowerCase())) {
          continue;
        }

        // 라인 번호 찾기
        const lineNumber = this.getLineNumber(content, match.index);
        const lineContent = lines[lineNumber - 1]?.trim() || '';

        findings.push({
          type: patternName,
          value: colorValue,
          line: lineNumber,
          lineContent: lineContent,
          context: this.getContext(lines, lineNumber - 1)
        });

        this.results.totalColors++;
        
        if (!this.results.colorsByType[patternName]) {
          this.results.colorsByType[patternName] = 0;
        }
        this.results.colorsByType[patternName]++;
      }
    });

    return findings;
  }

  /**
   * 파일 타입 결정
   */
  getFileType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    for (const [type, extensions] of Object.entries(FILE_TYPES)) {
      if (extensions.includes(ext)) {
        return type;
      }
    }
    
    return 'OTHER';
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
   * 라인 번호 계산
   */
  getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }

  /**
   * 컨텍스트 정보 가져오기
   */
  getContext(lines, lineIndex, contextSize = 2) {
    const start = Math.max(0, lineIndex - contextSize);
    const end = Math.min(lines.length, lineIndex + contextSize + 1);
    
    return lines.slice(start, end).map((line, idx) => ({
      lineNumber: start + idx + 1,
      content: line,
      isCurrent: start + idx === lineIndex
    }));
  }

  /**
   * 요약 리포트 생성
   */
  generateReport() {
    console.log('📊 하드코딩된 색상값 탐지 결과\n');
    console.log('='.repeat(50));
    
    console.log(`📁 총 검사 파일: ${this.results.totalFiles}개`);
    console.log(`🚨 하드코딩 발견 파일: ${this.results.affectedFiles}개`);
    console.log(`🎨 총 하드코딩 색상: ${this.results.totalColors}개`);
    console.log(`🔥 중요 파일: ${this.results.criticalFiles.length}개`);
    
    console.log('\n📈 파일 유형별 분포:');
    Object.entries(this.results.filesByType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}개`);
    });

    console.log('\n🎨 색상 유형별 분포:');
    Object.entries(this.results.colorsByType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}개`);
    });

    console.log('\n🔥 중요 파일 목록:');
    this.results.criticalFiles.forEach(file => {
      console.log(`  - ${file}`);
    });
  }

  /**
   * 상세 리포트 생성
   */
  generateDetailedReport() {
    const reportPath = 'docs/HARDCODED_COLORS_DETAILED_REPORT.md';
    
    let report = `# 🎨 하드코딩된 색상값 상세 리포트

> **생성일**: ${new Date().toISOString()}  
> **총 검사 파일**: ${this.results.totalFiles}개  
> **하드코딩 발견 파일**: ${this.results.affectedFiles}개  
> **총 하드코딩 색상**: ${this.results.totalColors}개

---

## 📊 요약 통계

| 구분 | 수량 | 비율 |
|------|------|------|
| 총 파일 | ${this.results.totalFiles}개 | 100% |
| 영향받는 파일 | ${this.results.affectedFiles}개 | ${((this.results.affectedFiles / this.results.totalFiles) * 100).toFixed(1)}% |
| 중요 파일 | ${this.results.criticalFiles.length}개 | ${((this.results.criticalFiles.length / this.results.totalFiles) * 100).toFixed(1)}% |

### 색상 유형별 분포
${Object.entries(this.results.colorsByType).map(([type, count]) => 
  `- **${type}**: ${count}개`
).join('\n')}

---

## 🔥 중요 파일 (즉시 수정 필요)

${this.results.criticalFiles.map(file => `- \`${file}\``).join('\n')}

---

## 📋 파일별 상세 내역

`;

    // 중요 파일부터 정렬
    const sortedFindings = this.results.allFindings.sort((a, b) => {
      if (a.isCritical && !b.isCritical) return -1;
      if (!a.isCritical && b.isCritical) return 1;
      return b.findings.length - a.findings.length;
    });

    sortedFindings.forEach(({ file, type, findings, isCritical }) => {
      report += `### ${isCritical ? '🔥' : '📁'} \`${file}\` (${type})\n\n`;
      report += `**하드코딩 색상**: ${findings.length}개${isCritical ? ' - **즉시 수정 필요**' : ''}\n\n`;
      
      findings.forEach((finding, index) => {
        report += `${index + 1}. **${finding.type}**: \`${finding.value}\` (라인 ${finding.line})\n`;
        report += `   \`\`\`\n   ${finding.lineContent}\n   \`\`\`\n\n`;
      });
      
      report += '---\n\n';
    });

    fs.writeFileSync(reportPath, report);
    console.log(`\n📄 상세 리포트 생성: ${reportPath}`);
  }

  /**
   * CI/BI 대응 액션 플랜 생성
   */
  generateCIBIActionPlan() {
    const planPath = 'docs/CI_BI_ACTION_PLAN.md';
    
    const criticalCount = this.results.criticalFiles.length;
    const totalAffected = this.results.affectedFiles;
    const urgencyLevel = criticalCount > 10 ? '🚨 매우 긴급' : 
                        criticalCount > 5 ? '🔥 긴급' : 
                        '⚠️ 중요';

    let plan = `# 🎯 CI/BI 변경 대응 액션 플랜

> **생성일**: ${new Date().toISOString()}  
> **긴급도**: ${urgencyLevel}  
> **예상 작업 시간**: ${this.estimateWorkTime()}

---

## 📊 현황 요약

- **총 영향 파일**: ${totalAffected}개
- **중요 파일**: ${criticalCount}개  
- **총 하드코딩 색상**: ${this.results.totalColors}개

---

## 🚀 단계별 실행 계획

### Phase 1: 긴급 대응 (1-2일) 🔥
**중요 파일 ${criticalCount}개 우선 처리**

${this.results.criticalFiles.map((file, index) => 
  `${index + 1}. \`${file}\``
).join('\n')}

**작업 내용**:
- [ ] CSS 변수로 변환
- [ ] 중복 색상 통합  
- [ ] 네이밍 규칙 적용

### Phase 2: 전체 적용 (3-5일) ⚠️
**나머지 ${totalAffected - criticalCount}개 파일 처리**

**작업 내용**:
- [ ] 컴포넌트별 색상 변수화
- [ ] JavaScript 로직 수정
- [ ] 테스트 및 검증

### Phase 3: 자동화 (1-2일) 📈
**재발 방지 시스템 구축**

**작업 내용**:
- [ ] 하드코딩 탐지 CI/CD 통합
- [ ] 자동 변환 스크립트
- [ ] 코드 리뷰 가이드라인

---

## 🛠️ 실행 스크립트

\`\`\`bash
# 1. 현재 상태 재검사
node scripts/detect-hardcoded-colors.js

# 2. 중요 파일 자동 변환
node scripts/convert-critical-files.js

# 3. 전체 파일 변환
node scripts/convert-all-hardcoded.js

# 4. 검증
node scripts/validate-no-hardcoding.js
\`\`\`

---

## ⏰ 타임라인

| 단계 | 기간 | 완료 기준 |
|------|------|-----------|
| Phase 1 | 1-2일 | 중요 파일 ${criticalCount}개 변수화 완료 |
| Phase 2 | 3-5일 | 전체 ${totalAffected}개 파일 변수화 완료 |  
| Phase 3 | 1-2일 | 자동화 시스템 구축 완료 |
| **총 기간** | **5-9일** | **CI/BI 적용 준비 완료** |

---

## 🎯 성공 기준

- [ ] 하드코딩된 색상 **0개** 달성
- [ ] CI/BI 색상 **1회 변경**으로 전체 적용
- [ ] 자동 탐지 시스템으로 **재발 방지**

**💡 CI/BI 작업 시작 전 Phase 1-2 완료 필수!**
`;

    fs.writeFileSync(planPath, plan);
    console.log(`📋 액션 플랜 생성: ${planPath}`);
  }

  /**
   * 예상 작업 시간 계산
   */
  estimateWorkTime() {
    const criticalCount = this.results.criticalFiles.length;
    const totalCount = this.results.affectedFiles;
    
    if (criticalCount > 10 || totalCount > 40) {
      return '1-2주';
    } else if (criticalCount > 5 || totalCount > 20) {
      return '5-9일';
    } else {
      return '3-5일';
    }
  }
}

// 스크립트 실행
if (require.main === module) {
  const detector = new HardcodedColorDetector();
  detector.run().catch(console.error);
}

module.exports = HardcodedColorDetector;

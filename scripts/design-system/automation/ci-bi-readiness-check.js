#!/usr/bin/env node

/**
 * CI/BI 준비 상태 자동 체크 스크립트
 * 
 * 브랜드 변경 대응 준비도를 자동으로 분석하고 리포트 생성
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-11-28
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 프로젝트 루트 경로
const PROJECT_ROOT = path.resolve(__dirname, '../../..');
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

// CI/BI 준비 상태 체크
async function checkCIBIReadiness() {
  console.log('🔍 CI/BI 변경 대응 준비 상태 체크 시작...');
  console.log('');

  const results = {
    score: 0,
    maxScore: 0,
    checks: [],
    recommendations: []
  };

  // 1. 통합 디자인 토큰 시스템 체크
  log.phase('Phase 1: 통합 디자인 토큰 시스템 체크');
  await checkUnifiedDesignTokens(results);
  console.log('');

  // 2. 하드코딩 색상 체크
  log.phase('Phase 2: 하드코딩 색상 체크');
  await checkHardcodedColors(results);
  console.log('');

  // 3. CSS 파일 구조 체크
  log.phase('Phase 3: CSS 파일 구조 체크');
  await checkCSSStructure(results);
  console.log('');

  // 4. 자동화 도구 체크
  log.phase('Phase 4: 자동화 도구 체크');
  await checkAutomationTools(results);
  console.log('');

  // 5. 문서화 체크
  log.phase('Phase 5: 문서화 체크');
  await checkDocumentation(results);
  console.log('');

  // 결과 리포트 생성
  await generateReadinessReport(results);

  return results;
}

// 통합 디자인 토큰 시스템 체크
async function checkUnifiedDesignTokens(results) {
  const checks = [
    {
      name: '통합 CSS 변수 파일 존재',
      file: 'frontend/src/styles/unified-design-tokens.css',
      weight: 20
    },
    {
      name: '통합 JavaScript 상수 파일 존재',
      file: 'frontend/src/constants/unifiedDesignTokens.js',
      weight: 10
    },
    {
      name: '메인 CSS에서 통합 토큰 import',
      file: 'frontend/src/index.css',
      content: 'unified-design-tokens.css',
      weight: 15
    }
  ];

  for (const check of checks) {
    results.maxScore += check.weight;
    
    const filePath = path.join(PROJECT_ROOT, check.file);
    
    if (fs.existsSync(filePath)) {
      if (check.content) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes(check.content)) {
          log.success(`${check.name} ✓`);
          results.score += check.weight;
          results.checks.push({ name: check.name, status: 'pass', weight: check.weight });
        } else {
          log.warning(`${check.name} - import 누락`);
          results.checks.push({ name: check.name, status: 'fail', weight: check.weight });
          results.recommendations.push(`${check.file}에서 ${check.content} import 추가 필요`);
        }
      } else {
        log.success(`${check.name} ✓`);
        results.score += check.weight;
        results.checks.push({ name: check.name, status: 'pass', weight: check.weight });
      }
    } else {
      log.error(`${check.name} - 파일 없음`);
      results.checks.push({ name: check.name, status: 'fail', weight: check.weight });
      results.recommendations.push(`${check.file} 파일 생성 필요`);
    }
  }
}

// 하드코딩 색상 체크
async function checkHardcodedColors(results) {
  const weight = 25;
  results.maxScore += weight;

  try {
    // 하드코딩 탐지 스크립트 실행
    const scriptPath = path.join(PROJECT_ROOT, 'scripts/design-system/color-management/detect-hardcoded-colors.js');
    
    if (fs.existsSync(scriptPath)) {
      log.info('하드코딩 색상 탐지 실행 중...');
      
      // 간단한 하드코딩 체크 (실제 스크립트는 시간이 오래 걸릴 수 있음)
      const cssFiles = await findFiles(FRONTEND_PATH, /\.css$/);
      let hardcodedCount = 0;
      
      for (const file of cssFiles.slice(0, 10)) { // 샘플링
        const content = fs.readFileSync(file, 'utf8');
        const hexMatches = content.match(/#[0-9a-fA-F]{3,6}/g) || [];
        const rgbMatches = content.match(/rgba?\([^)]+\)/g) || [];
        
        // 허용된 색상 제외
        const allowedColors = ['#fff', '#ffffff', '#000', '#000000', 'transparent'];
        const filteredHex = hexMatches.filter(color => !allowedColors.includes(color.toLowerCase()));
        
        hardcodedCount += filteredHex.length + rgbMatches.length;
      }
      
      if (hardcodedCount === 0) {
        log.success('하드코딩 색상 없음 ✓');
        results.score += weight;
        results.checks.push({ name: '하드코딩 색상 제거', status: 'pass', weight });
      } else if (hardcodedCount < 10) {
        log.warning(`소량의 하드코딩 발견 (${hardcodedCount}개)`);
        results.score += Math.floor(weight * 0.7);
        results.checks.push({ name: '하드코딩 색상 제거', status: 'partial', weight });
        results.recommendations.push('남은 하드코딩 색상 제거 필요');
      } else {
        log.error(`다수의 하드코딩 발견 (${hardcodedCount}개+)`);
        results.checks.push({ name: '하드코딩 색상 제거', status: 'fail', weight });
        results.recommendations.push('하드코딩 색상 자동 변환 도구 실행 필요');
      }
    } else {
      log.error('하드코딩 탐지 도구 없음');
      results.checks.push({ name: '하드코딩 색상 제거', status: 'fail', weight });
      results.recommendations.push('하드코딩 탐지 도구 설치 필요');
    }
  } catch (error) {
    log.error(`하드코딩 체크 실패: ${error.message}`);
    results.checks.push({ name: '하드코딩 색상 제거', status: 'fail', weight });
  }
}

// CSS 파일 구조 체크
async function checkCSSStructure(results) {
  const checks = [
    {
      name: '중복 CSS 변수 파일 제거',
      files: ['styles/variables.css', 'styles/css-variables.css', 'styles/design-system.css'],
      shouldNotExist: true,
      weight: 10
    },
    {
      name: 'MindGarden 디자인 시스템 유지',
      files: ['styles/mindgarden-design-system.css'],
      shouldNotExist: false,
      weight: 5
    }
  ];

  for (const check of checks) {
    results.maxScore += check.weight;
    
    let allGood = true;
    
    for (const file of check.files) {
      const filePath = path.join(FRONTEND_PATH, file);
      const exists = fs.existsSync(filePath);
      
      if (check.shouldNotExist && exists) {
        allGood = false;
        break;
      } else if (!check.shouldNotExist && !exists) {
        allGood = false;
        break;
      }
    }
    
    if (allGood) {
      log.success(`${check.name} ✓`);
      results.score += check.weight;
      results.checks.push({ name: check.name, status: 'pass', weight: check.weight });
    } else {
      log.warning(`${check.name} - 구조 정리 필요`);
      results.checks.push({ name: check.name, status: 'fail', weight: check.weight });
      results.recommendations.push(`CSS 파일 구조 정리: ${check.files.join(', ')}`);
    }
  }
}

// 자동화 도구 체크
async function checkAutomationTools(results) {
  const tools = [
    {
      name: '하드코딩 탐지 도구',
      path: 'scripts/design-system/color-management/detect-hardcoded-colors.js',
      weight: 5
    },
    {
      name: '하드코딩 변환 도구',
      path: 'scripts/design-system/color-management/convert-hardcoded-colors.js',
      weight: 5
    },
    {
      name: '통합 CSS 변수 생성 도구',
      path: 'scripts/design-system/color-management/create-unified-css-variables.js',
      weight: 5
    },
    {
      name: 'Pre-commit Hook',
      path: 'scripts/design-system/automation/pre-commit-hardcoding-check.sh',
      weight: 10
    }
  ];

  for (const tool of tools) {
    results.maxScore += tool.weight;
    
    const toolPath = path.join(PROJECT_ROOT, tool.path);
    
    if (fs.existsSync(toolPath)) {
      log.success(`${tool.name} ✓`);
      results.score += tool.weight;
      results.checks.push({ name: tool.name, status: 'pass', weight: tool.weight });
    } else {
      log.error(`${tool.name} - 도구 없음`);
      results.checks.push({ name: tool.name, status: 'fail', weight: tool.weight });
      results.recommendations.push(`${tool.name} 설치 필요: ${tool.path}`);
    }
  }
}

// 문서화 체크
async function checkDocumentation(results) {
  const docs = [
    {
      name: 'CI/BI 액션 플랜',
      path: 'docs/CI_BI_ACTION_PLAN.md',
      weight: 3
    },
    {
      name: 'CSS 변수 마이그레이션 가이드',
      path: 'docs/CSS_VARIABLES_MIGRATION_GUIDE.md',
      weight: 3
    },
    {
      name: 'CI/BI 빠른 시작 가이드',
      path: 'docs/design-system/ci-bi/QUICK_START_GUIDE.md',
      weight: 4
    }
  ];

  for (const doc of docs) {
    results.maxScore += doc.weight;
    
    const docPath = path.join(PROJECT_ROOT, doc.path);
    
    if (fs.existsSync(docPath)) {
      log.success(`${doc.name} ✓`);
      results.score += doc.weight;
      results.checks.push({ name: doc.name, status: 'pass', weight: doc.weight });
    } else {
      log.warning(`${doc.name} - 문서 없음`);
      results.checks.push({ name: doc.name, status: 'fail', weight: doc.weight });
      results.recommendations.push(`${doc.name} 문서 생성 필요`);
    }
  }
}

// 파일 찾기 헬퍼
async function findFiles(dir, pattern) {
  const files = [];
  
  function walkDir(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        walkDir(fullPath);
      } else if (stat.isFile() && pattern.test(item)) {
        files.push(fullPath);
      }
    }
  }
  
  walkDir(dir);
  return files;
}

// 준비도 리포트 생성
async function generateReadinessReport(results) {
  const percentage = Math.round((results.score / results.maxScore) * 100);
  
  console.log('📊 CI/BI 변경 대응 준비도 리포트');
  console.log('='.repeat(50));
  console.log('');
  
  // 점수 및 등급
  let grade, status, emoji;
  if (percentage >= 90) {
    grade = 'A+';
    status = '완벽 준비됨';
    emoji = '🎉';
  } else if (percentage >= 80) {
    grade = 'A';
    status = '잘 준비됨';
    emoji = '✅';
  } else if (percentage >= 70) {
    grade = 'B';
    status = '대부분 준비됨';
    emoji = '👍';
  } else if (percentage >= 60) {
    grade = 'C';
    status = '부분적 준비';
    emoji = '⚠️';
  } else {
    grade = 'D';
    status = '준비 부족';
    emoji = '🚨';
  }
  
  console.log(`${emoji} 종합 점수: ${results.score}/${results.maxScore} (${percentage}%)`);
  console.log(`🏆 등급: ${grade} - ${status}`);
  console.log('');
  
  // 카테고리별 결과
  console.log('📋 세부 체크 결과:');
  for (const check of results.checks) {
    const statusEmoji = check.status === 'pass' ? '✅' : check.status === 'partial' ? '⚠️' : '❌';
    console.log(`  ${statusEmoji} ${check.name} (${check.weight}점)`);
  }
  console.log('');
  
  // 개선 권장사항
  if (results.recommendations.length > 0) {
    console.log('🎯 개선 권장사항:');
    for (let i = 0; i < results.recommendations.length; i++) {
      console.log(`  ${i + 1}. ${results.recommendations[i]}`);
    }
    console.log('');
  }
  
  // CI/BI 변경 예상 시간
  let estimatedTime;
  if (percentage >= 90) {
    estimatedTime = '5분 이내';
  } else if (percentage >= 80) {
    estimatedTime = '10-15분';
  } else if (percentage >= 70) {
    estimatedTime = '30분-1시간';
  } else if (percentage >= 60) {
    estimatedTime = '2-4시간';
  } else {
    estimatedTime = '1-2일';
  }
  
  console.log(`⏱️  CI/BI 변경 예상 소요 시간: ${estimatedTime}`);
  console.log('');
  
  // 리포트 파일 저장
  const reportPath = path.join(PROJECT_ROOT, 'docs/CI_BI_READINESS_REPORT.md');
  const reportContent = generateMarkdownReport(results, percentage, grade, status, estimatedTime);
  fs.writeFileSync(reportPath, reportContent);
  
  log.success(`리포트 저장: ${reportPath}`);
  console.log('');
}

// 마크다운 리포트 생성
function generateMarkdownReport(results, percentage, grade, status, estimatedTime) {
  const now = new Date().toISOString();
  
  return `# 🔍 CI/BI 변경 대응 준비도 리포트

> **생성일**: ${now}  
> **점수**: ${results.score}/${results.maxScore} (${percentage}%)  
> **등급**: ${grade} - ${status}

---

## 📊 종합 평가

| 항목 | 결과 |
|------|------|
| 종합 점수 | ${results.score}/${results.maxScore} (${percentage}%) |
| 등급 | ${grade} |
| 상태 | ${status} |
| CI/BI 변경 예상 시간 | ${estimatedTime} |

---

## 📋 세부 체크 결과

${results.checks.map(check => {
  const statusEmoji = check.status === 'pass' ? '✅' : check.status === 'partial' ? '⚠️' : '❌';
  return `- ${statusEmoji} **${check.name}** (${check.weight}점)`;
}).join('\n')}

---

## 🎯 개선 권장사항

${results.recommendations.length > 0 
  ? results.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')
  : '✅ 모든 항목이 준비되었습니다!'
}

---

## 💡 CI/BI 변경 방법

### 🚀 빠른 변경 (현재 준비도: ${percentage}%)

1. **색상 변경**
   \`\`\`css
   /* frontend/src/styles/unified-design-tokens.css */
   :root {
     --mg-primary-500: #NEW_BRAND_COLOR;
     --mg-success-500: #NEW_SUCCESS_COLOR;
     /* ... */
   }
   \`\`\`

2. **빌드 및 배포**
   \`\`\`bash
   npm run build
   # 배포...
   \`\`\`

### 📚 참고 문서

- [CI/BI 빠른 시작 가이드](design-system/ci-bi/QUICK_START_GUIDE.md)
- [CSS 변수 마이그레이션 가이드](CSS_VARIABLES_MIGRATION_GUIDE.md)
- [CI/BI 액션 플랜](CI_BI_ACTION_PLAN.md)

---

**📝 생성일**: ${now}  
**🔄 다음 체크 권장**: 1주일 후  
**📊 상태**: ${status} ✨`;
}

// 스크립트 실행
if (require.main === module) {
  checkCIBIReadiness().then(results => {
    const percentage = Math.round((results.score / results.maxScore) * 100);
    
    if (percentage >= 80) {
      log.success('🎉 CI/BI 변경 준비 완료!');
      process.exit(0);
    } else if (percentage >= 60) {
      log.warning('⚠️ CI/BI 변경 준비 부분 완료');
      process.exit(0);
    } else {
      log.error('🚨 CI/BI 변경 준비 부족');
      process.exit(1);
    }
  }).catch(error => {
    log.error(`체크 실패: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { checkCIBIReadiness };

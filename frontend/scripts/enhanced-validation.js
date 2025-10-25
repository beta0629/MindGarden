#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * 강화된 검증 시스템
 * - 구조 변경 전 사전 검증
 * - 컴포넌트 인터페이스 검증
 * - 디자인-로직 분리 원칙 검증
 */

class EnhancedValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.componentInterfaces = new Map();
  }

  // 1. 컴포넌트 인터페이스 분석
  analyzeComponentInterface(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const componentName = path.basename(filePath, '.js');
    
    // props 추출
    const propsRegex = /(\w+)\s*[:=]\s*{([^}]+)}/g;
    const props = [];
    let match;
    
    while ((match = propsRegex.exec(content)) !== null) {
      props.push(match[1]);
    }
    
    // 함수 시그니처 추출
    const functionRegex = /function\s+(\w+)\s*\([^)]*\)/g;
    const functions = [];
    while ((match = functionRegex.exec(content)) !== null) {
      functions.push(match[1]);
    }
    
    this.componentInterfaces.set(componentName, {
      props,
      functions,
      filePath
    });
    
    return { props, functions };
  }

  // 2. 구조 변경 전 검증
  validateStructureChange(filePath, changes) {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    // 기존 컴포넌트 사용 패턴 분석
    const componentUsageRegex = /<(\w+)\s+([^>]+)>/g;
    const usages = [];
    let match;
    
    while ((match = componentUsageRegex.exec(content)) !== null) {
      const componentName = match[1];
      const props = match[2];
      
      // prop 변경 검증
      if (changes.props) {
        changes.props.forEach(change => {
          if (props.includes(change.old) && !props.includes(change.new)) {
            issues.push({
              type: 'BREAKING_CHANGE',
              message: `컴포넌트 ${componentName}의 prop '${change.old}'이 '${change.new}'로 변경됨`,
              line: content.substring(0, match.index).split('\n').length,
              severity: 'ERROR'
            });
          }
        });
      }
    }
    
    return issues;
  }

  // 3. 디자인-로직 분리 원칙 검증
  validateDesignLogicSeparation(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    // JS 파일에서 직접 아이콘 사용 검증
    const directIconUsage = /<(\w+Icon|\w+)\s*\/>/g;
    let match;
    
    while ((match = directIconUsage.exec(content)) !== null) {
      issues.push({
        type: 'DESIGN_LOGIC_VIOLATION',
        message: `JS 파일에서 아이콘을 직접 사용: ${match[1]}`,
        line: content.substring(0, match.index).split('\n').length,
        severity: 'WARNING',
        suggestion: 'CSS 클래스나 Icon 컴포넌트를 사용하세요'
      });
    }
    
    // 인라인 스타일 사용 검증
    const inlineStyleUsage = /style\s*=\s*{/g;
    while ((match = inlineStyleUsage.exec(content)) !== null) {
      issues.push({
        type: 'DESIGN_LOGIC_VIOLATION',
        message: '인라인 스타일 사용',
        line: content.substring(0, match.index).split('\n').length,
        severity: 'ERROR',
        suggestion: 'CSS 클래스나 CSS Variables를 사용하세요'
      });
    }
    
    return issues;
  }

  // 4. 컴포넌트 의존성 검증
  validateDependencies(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    // import 문 분석
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    const imports = [];
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    // 상대 경로 import 검증
    const relativeImports = imports.filter(imp => imp.startsWith('./') || imp.startsWith('../'));
    
    relativeImports.forEach(imp => {
      const fullPath = path.resolve(path.dirname(filePath), imp);
      if (!fs.existsSync(fullPath) && !fs.existsSync(fullPath + '.js')) {
        issues.push({
          type: 'MISSING_DEPENDENCY',
          message: `존재하지 않는 파일을 import: ${imp}`,
          severity: 'ERROR'
        });
      }
    });
    
    return issues;
  }

  // 5. 변경 사항 검증
  validateChanges(filePath, proposedChanges) {
    const allIssues = [];
    
    // 구조 변경 검증
    if (proposedChanges.structure) {
      allIssues.push(...this.validateStructureChange(filePath, proposedChanges.structure));
    }
    
    // 디자인-로직 분리 검증
    allIssues.push(...this.validateDesignLogicSeparation(filePath));
    
    // 의존성 검증
    allIssues.push(...this.validateDependencies(filePath));
    
    return allIssues;
  }

  // 6. 안전한 변경 제안
  suggestSafeChanges(filePath, issues) {
    const suggestions = [];
    
    issues.forEach(issue => {
      if (issue.type === 'DESIGN_LOGIC_VIOLATION') {
        if (issue.message.includes('아이콘을 직접 사용')) {
          suggestions.push({
            type: 'REPLACEMENT',
            old: issue.message.split(': ')[1],
            new: 'Icon 컴포넌트 사용',
            example: '<Icon name="ICON_NAME" size="sm" />'
          });
        }
      }
    });
    
    return suggestions;
  }

  // 7. 전체 검증 실행
  runFullValidation(filePath) {
    console.log(`🔍 ${filePath} 검증 시작...`);
    
    const issues = this.validateDesignLogicSeparation(filePath);
    const dependencies = this.validateDependencies(filePath);
    
    const allIssues = [...issues, ...dependencies];
    
    if (allIssues.length === 0) {
      console.log('✅ 검증 통과!');
      return true;
    }
    
    console.log(`❌ ${allIssues.length}개 문제 발견:`);
    allIssues.forEach(issue => {
      console.log(`  ${issue.severity}: ${issue.message}`);
      if (issue.suggestion) {
        console.log(`    💡 제안: ${issue.suggestion}`);
      }
    });
    
    return false;
  }
}

// 사용 예시
if (require.main === module) {
  const validator = new EnhancedValidator();
  const filePath = process.argv[2];
  
  if (!filePath) {
    console.log('사용법: node enhanced-validation.js <파일경로>');
    process.exit(1);
  }
  
  validator.runFullValidation(filePath);
}

module.exports = EnhancedValidator;

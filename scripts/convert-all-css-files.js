#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 색상 매핑 테이블 (확장 버전)
const colorMap = {
  // Success colors
  '#10b981': 'var(--status-success)',
  '#28a745': 'var(--status-success)',
  '#4caf50': 'var(--status-success)',
  '#155724': 'var(--status-success-dark)',
  '#d1fae5': 'var(--status-success-bg)',
  '#c3e6cb': 'var(--status-success-border)',
  
  // Error colors
  '#ef4444': 'var(--status-error)',
  '#dc3545': 'var(--status-error)',
  '#f44336': 'var(--status-error)',
  '#e53e3e': 'var(--status-error)',
  '#c82333': 'var(--status-error-dark)',
  '#fee2e2': 'var(--status-error-bg)',
  '#f8d7da': 'var(--status-error-bg)',
  '#fecaca': 'var(--status-error-border)',
  '#f5c6cb': 'var(--status-error-border)',
  
  // Warning colors
  '#f59e0b': 'var(--status-warning)',
  '#ffc107': 'var(--status-warning)',
  '#ff9800': 'var(--status-warning)',
  '#fbbf24': 'var(--status-warning-light)',
  '#ffeaa7': 'var(--status-warning-light)',
  '#fef3c7': 'var(--status-warning-bg)',
  '#fff3cd': 'var(--status-warning-bg)',
  '#856404': 'var(--color-warning-dark)',
  
  // Info colors
  '#3b82f6': 'var(--status-info)',
  '#2196f3': 'var(--status-info)',
  '#17a2b8': 'var(--status-info)',
  '#1976d2': 'var(--color-primary-dark)',
  '#dbeafe': 'var(--status-info-bg)',
  '#e3f2fd': 'var(--status-info-bg)',
  '#bbdefb': 'var(--status-info-light)',
  
  // Primary colors
  '#007bff': 'var(--color-primary)',
  '#0056b3': 'var(--color-primary-dark)',
  '#66b3ff': 'var(--color-primary-light)',
  
  // Background colors
  '#ffffff': 'var(--color-bg-surface)',
  '#fafafa': 'var(--color-bg-secondary)',
  '#f8f9fa': 'var(--color-bg-secondary)',
  '#f5f5f5': 'var(--color-bg-secondary)',
  '#e9ecef': 'var(--color-bg-secondary)',
  
  // Text colors
  '#000000': 'var(--color-text-primary)',
  '#2f2f2f': 'var(--color-text-primary)',
  '#333333': 'var(--color-text-primary)',
  '#333': 'var(--color-text-primary)',
  '#666666': 'var(--color-text-secondary)',
  '#6c757d': 'var(--color-secondary)',
  '#999999': 'var(--color-text-muted)',
  '#2c3e50': 'var(--color-text-primary)',
  
  // Border colors
  '#e5e7eb': 'var(--color-border)',
  '#dee2e6': 'var(--color-border)',
  '#e9ecef': 'var(--color-border)',
  '#e0e0e0': 'var(--color-border)',
  '#ddd': 'var(--color-border)',
  '#ccc': 'var(--color-border-light)',
  '#3498db': 'var(--color-primary)',
  '#2980b9': 'var(--color-primary-dark)',
  
  // Special colors
  '#e91e63': 'var(--color-accent)',
  '#7b1fa2': 'var(--color-purple)',
  '#f3e5f5': 'var(--color-purple-light)',
  '#e65100': 'var(--color-orange)',
  '#fff3e0': 'var(--color-orange-light)',
  '#c2185b': 'var(--color-pink)',
  '#fce4ec': 'var(--color-pink-light)',
  '#6d3410': 'var(--color-brown-dark)',
  '#795548': 'var(--color-brown)',
  '#9e9e9e': 'var(--color-gray)',
  '#95a5a6': 'var(--color-gray-light)',
  '#7f8c8d': 'var(--color-gray-dark)',
  '#f39c12': 'var(--color-orange)',
  '#e67e22': 'var(--color-orange-dark)',
  '#138496': 'var(--status-info-dark)',
  '#e74c3c': 'var(--status-error)',
  '#c0392b': 'var(--status-error-dark)',
  '#34495e': 'var(--color-text-primary)',
  '#495057': 'var(--color-text-secondary)',
  '#721c24': 'var(--status-error-dark)',
  '#f1f1f1': 'var(--color-bg-secondary)',
  '#c1c1c1': 'var(--color-border)',
  '#a8a8a8': 'var(--color-border-dark)',
  '#1d1d1f': 'var(--color-text-primary)',
  '#86868b': 'var(--color-text-muted)',
};

function convertFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changeCount = 0;
  let originalContent = content;
  
  // 모든 색상 변환
  Object.entries(colorMap).forEach(([hardcoded, variable]) => {
    // 대소문자 구분 없이 변환
    const patterns = [
      `color:\\s*${hardcoded}`,
      `background:\\s*${hardcoded}`,
      `background-color:\\s*${hardcoded}`,
      `border:\\s*1px solid ${hardcoded}`,
      `border:\\s*2px solid ${hardcoded}`,
      `border-left:\\s*3px solid ${hardcoded}`,
      `border-left:\\s*4px solid ${hardcoded}`,
      `border-right:\\s*3px solid ${hardcoded}`,
      `border-top:\\s*1px solid ${hardcoded}`,
      `border-bottom:\\s*1px solid ${hardcoded}`,
      `border-color:\\s*${hardcoded}`,
      `box-shadow:.*${hardcoded}`,
    ];
    
    patterns.forEach(pattern => {
      const regex = new RegExp(pattern.replace(/#/g, '\\#'), 'gi');
      const matches = content.match(regex);
      if (matches) {
        matches.forEach(match => {
          const property = match.split(':')[0];
          let replacement;
          if (match.includes('box-shadow')) {
            replacement = match.replace(new RegExp(hardcoded, 'gi'), variable);
          } else if (match.includes('border-left') || match.includes('border-right') || match.includes('border-top') || match.includes('border-bottom')) {
            const width = match.match(/\d+px/)[0];
            replacement = `${property}: ${width} solid ${variable}`;
          } else if (match.includes('border:')) {
            const width = match.match(/\d+px/)[0];
            replacement = `border: ${width} solid ${variable}`;
          } else {
            replacement = `${property}: ${variable}`;
          }
          content = content.replace(match, replacement);
          changeCount++;
        });
      }
    });
  });
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    return changeCount;
  }
  
  return 0;
}

// CSS 파일 찾기
const directories = [
  path.join(__dirname, '../frontend/src/components/admin'),
  path.join(__dirname, '../frontend/src/components/schedule'),
  path.join(__dirname, '../frontend/src/components/common'),
];

console.log('🎨 모든 CSS 파일의 하드코딩을 변수로 변환합니다...\n');

let totalChanges = 0;
let totalFiles = 0;

directories.forEach(dir => {
  console.log(`\n📁 ${path.basename(dir)} 처리 중...`);
  
  try {
    const files = execSync(`find ${dir} -name "*.css" -type f`).toString().trim().split('\n').filter(f => f);
    
    files.forEach(file => {
      const changes = convertFile(file);
      if (changes > 0) {
        console.log(`  ✅ ${path.basename(file)}: ${changes}개 변환`);
        totalChanges += changes;
        totalFiles++;
      }
    });
  } catch (error) {
    console.log(`  ⚠️  디렉토리를 찾을 수 없습니다: ${dir}`);
  }
});

console.log(`\n✨ 완료! ${totalFiles}개 파일에서 총 ${totalChanges}개 색상이 변환되었습니다.`);


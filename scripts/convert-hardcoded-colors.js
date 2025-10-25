#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 색상 매핑 테이블
const colorMap = {
  // Success colors
  '#10b981': 'var(--status-success)',
  '#059669': 'var(--status-success-dark)',
  '#28a745': 'var(--status-success)',
  '#28A745': 'var(--status-success)',
  '#4caf50': 'var(--status-success)',
  
  // Error colors
  '#ef4444': 'var(--status-error)',
  '#dc3545': 'var(--status-error)',
  '#dc2626': 'var(--status-error-dark)',
  '#f44336': 'var(--status-error)',
  '#721c24': 'var(--status-error-dark)',
  
  // Warning colors
  '#f59e0b': 'var(--status-warning)',
  '#ffc107': 'var(--status-warning)',
  '#FFC107': 'var(--status-warning)',
  '#ff9800': 'var(--status-warning)',
  '#fbbf24': 'var(--status-warning-light)',
  
  // Info colors
  '#3b82f6': 'var(--status-info)',
  '#007bff': 'var(--color-primary)',
  '#1976d2': 'var(--color-primary-dark)',
  
  // Background colors
  '#ffffff': 'var(--color-bg-surface)',
  '#FFFFFF': 'var(--color-bg-surface)',
  '#f8f9fa': 'var(--color-bg-secondary)',
  '#fafafa': 'var(--color-bg-secondary)',
  '#FAFAFA': 'var(--color-bg-secondary)',
  
  // Text colors
  '#000000': 'var(--color-text-primary)',
  '#2f2f2f': 'var(--color-text-primary)',
  '#666666': 'var(--color-text-secondary)',
  '#6c757d': 'var(--color-secondary)',
  '#999999': 'var(--color-text-muted)',
  
  // Border colors
  '#e5e7eb': 'var(--color-border)',
  '#dee2e6': 'var(--color-border)',
  '#e0e0e0': 'var(--color-border)',
  
  // Special colors
  '#e91e63': 'var(--color-accent)',
  '#6d3410': 'var(--color-brown-dark)',
  '#795548': 'var(--color-brown)',
  '#9e9e9e': 'var(--color-gray)',
};

// 배경색 매핑
const bgColorMap = {
  '#f8d7da': 'var(--status-error-bg)',
  '#e3f2fd': 'var(--status-info-bg)',
  '#d1fae5': 'var(--status-success-bg)',
  '#fef3c7': 'var(--status-warning-bg)',
};

// Border 색상 매핑
const borderColorMap = {
  '#f5c6cb': 'var(--status-error-border)',
  '#dee2e6': 'var(--color-border)',
  '#c3e6cb': 'var(--status-success-border)',
  '#2196f3': 'var(--status-info)',
};

// 추가 배경색 매핑
const additionalBgColorMap = {
  '#f3e5f5': 'var(--color-purple-light)',
  '#fff3e0': 'var(--color-orange-light)',
  '#fce4ec': 'var(--color-pink-light)',
  '#f5f5f5': 'var(--color-bg-secondary)',
  '#e3f2fd': 'var(--status-info-bg)',
  '#d4edda': 'var(--status-success-bg)',
};

// 추가 텍스트 색상 매핑
const additionalTextColorMap = {
  '#7b1fa2': 'var(--color-purple)',
  '#e65100': 'var(--color-orange)',
  '#c2185b': 'var(--color-pink)',
  '#155724': 'var(--status-success-dark)',
};

function convertFile(filePath) {
  console.log(`\n🔄 처리 중: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changeCount = 0;
  
  // 일반 색상 변환
  Object.entries(colorMap).forEach(([hardcoded, variable]) => {
    const regex = new RegExp(`(color|background|border-color):\\s*${hardcoded.replace('#', '\\#')}`, 'gi');
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, `$1: ${variable}`);
      changeCount += matches.length;
    }
  });
  
  // 배경색 변환
  Object.entries(bgColorMap).forEach(([hardcoded, variable]) => {
    const regex = new RegExp(`background-color:\\s*${hardcoded.replace('#', '\\#')}`, 'gi');
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, `background-color: ${variable}`);
      changeCount += matches.length;
    }
  });
  
  // Border 색상 변환
  Object.entries(borderColorMap).forEach(([hardcoded, variable]) => {
    const regex = new RegExp(`border:\\s*1px solid ${hardcoded.replace('#', '\\#')}`, 'gi');
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, `border: 1px solid ${variable}`);
      changeCount += matches.length;
    }
    
    // border-left, border-right 등도 변환
    const borderLeftRegex = new RegExp(`border-left:\\s*4px solid ${hardcoded.replace('#', '\\#')}`, 'gi');
    const borderLeftMatches = content.match(borderLeftRegex);
    if (borderLeftMatches) {
      content = content.replace(borderLeftRegex, `border-left: 4px solid ${variable}`);
      changeCount += borderLeftMatches.length;
    }
  });
  
  // 추가 배경색 변환
  Object.entries(additionalBgColorMap).forEach(([hardcoded, variable]) => {
    const regex = new RegExp(`background-color:\\s*${hardcoded.replace('#', '\\#')}`, 'gi');
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, `background-color: ${variable}`);
      changeCount += matches.length;
    }
    
    const bgRegex = new RegExp(`background:\\s*${hardcoded.replace('#', '\\#')}`, 'gi');
    const bgMatches = content.match(bgRegex);
    if (bgMatches) {
      content = content.replace(bgRegex, `background: ${variable}`);
      changeCount += bgMatches.length;
    }
  });
  
  // 추가 텍스트 색상 변환
  Object.entries(additionalTextColorMap).forEach(([hardcoded, variable]) => {
    const regex = new RegExp(`color:\\s*${hardcoded.replace('#', '\\#')}`, 'gi');
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, `color: ${variable}`);
      changeCount += matches.length;
    }
  });
  
  if (changeCount > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${changeCount}개 색상 변환 완료`);
  } else {
    console.log(`⏭️  변환할 색상 없음`);
  }
  
  return changeCount;
}

// 메인 CSS 파일 변환
const cssFile = path.join(__dirname, '../frontend/src/styles/mindgarden-design-system.css');

console.log('🎨 하드코딩된 색상을 CSS 변수로 변환합니다...\n');

const totalChanges = convertFile(cssFile);

console.log(`\n✨ 완료! 총 ${totalChanges}개 색상이 변환되었습니다.`);


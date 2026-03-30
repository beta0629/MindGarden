#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const cssFile = path.join(__dirname, '../frontend/src/styles/mindgarden-design-system.css');

console.log('🎨 남은 하드코딩 색상을 CSS 변수로 변환합니다...\n');

let content = fs.readFileSync(cssFile, 'utf8');
let changeCount = 0;

// 단순 색상 변환
const simpleReplacements = [
  // Error colors
  { from: 'color: #e53e3e', to: 'color: var(--status-error)' },
  { from: 'color: #856404', to: 'color: var(--color-warning-dark)' },
  { from: 'color: #2c3e50', to: 'color: var(--color-text-primary)' },
  { from: 'color: #333', to: 'color: var(--color-text-primary)' },
  
  // Background colors
  { from: 'background: #f8d7da', to: 'background: var(--status-error-bg)' },
  { from: 'background-color: #e9ecef', to: 'background-color: var(--color-bg-secondary)' },
  { from: 'background-color: #fff3cd', to: 'background-color: var(--status-warning-bg)' },
  { from: 'background-color: #ffeaa7', to: 'background-color: var(--status-warning-light)' },
  { from: 'background-color: #f5c6cb', to: 'background-color: var(--status-error-border)' },
  
  // Border colors
  { from: 'border-bottom: 1px solid #dee2e6', to: 'border-bottom: 1px solid var(--color-border)' },
  { from: 'border: 1px solid #ffeaa7', to: 'border: 1px solid var(--status-warning-light)' },
  { from: 'border-color: #c3e6cb', to: 'border-color: var(--status-success-border)' },
  { from: 'border-color: #f5c6cb', to: 'border-color: var(--status-error-border)' },
  { from: 'border: 1px solid #bbdefb', to: 'border: 1px solid var(--status-info-light)' },
];

simpleReplacements.forEach(({ from, to }) => {
  const regex = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  const matches = content.match(regex);
  if (matches) {
    content = content.replace(regex, to);
    changeCount += matches.length;
    console.log(`✅ "${from}" → "${to}" (${matches.length}개)`);
  }
});

// Gradient 변환 (주석으로 표시만)
const gradients = [
  'linear-gradient(135deg, #10b981, #059669)',
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(135deg, #3f51b5 0%, #1e3a8a 100%)',
  'linear-gradient(135deg, #a8e6a3 0%, #7dd87a 100%)',
];

console.log('\n⚠️  Gradient는 수동 변환이 필요합니다:');
gradients.forEach(gradient => {
  const regex = new RegExp(gradient.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  const matches = content.match(regex);
  if (matches) {
    console.log(`   - ${gradient} (${matches.length}개)`);
  }
});

if (changeCount > 0) {
  fs.writeFileSync(cssFile, content, 'utf8');
  console.log(`\n✨ 완료! 총 ${changeCount}개 색상이 변환되었습니다.`);
} else {
  console.log('\n⏭️  변환할 색상이 없습니다.');
}


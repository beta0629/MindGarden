#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

/**
 * React 18에서 불필요한 React import 제거 스크립트
 * JSX Transform이 기본적으로 활성화되어 있어서 React import가 불필요함
 */

const SRC_DIR = path.join(__dirname, '../src');
const JS_FILES = glob.sync(`${SRC_DIR}/**/*.{js,jsx}`, { 
  ignore: [
    '**/node_modules/**',
    '**/build/**',
    '**/dist/**',
    '**/*.test.js',
    '**/*.test.jsx',
    '**/*.spec.js',
    '**/*.spec.jsx'
  ]
});

let processedCount = 0;
let removedCount = 0;

console.log('🔍 React import 제거 스크립트 시작...');
console.log(`📁 처리할 파일 수: ${JS_FILES.length}`);

JS_FILES.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    let modified = false;
    const newLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // React import 패턴들
      const reactImportPatterns = [
        /^import\s+React\s+from\s+['"]react['"];?\s*$/,
        /^import\s+React,\s*\{([^}]+)\}\s+from\s+['"]react['"];?\s*$/,
        /^import\s+\{([^}]*React[^}]*)\}\s+from\s+['"]react['"];?\s*$/
      ];
      
      let shouldRemove = false;
      let replacementLine = '';
      
      // 패턴 1: import React from 'react';
      if (reactImportPatterns[0].test(line)) {
        shouldRemove = true;
        replacementLine = '';
      }
      // 패턴 2: import React, { useState, useEffect } from 'react';
      else if (reactImportPatterns[1].test(line)) {
        const match = line.match(/^import\s+React,\s*\{([^}]+)\}\s+from\s+['"]react['"];?\s*$/);
        if (match) {
          const hooks = match[1].trim();
          if (hooks) {
            replacementLine = `import { ${hooks} } from 'react';`;
            shouldRemove = true;
          }
        }
      }
      // 패턴 3: import { React, useState } from 'react';
      else if (reactImportPatterns[2].test(line)) {
        const match = line.match(/^import\s+\{([^}]+)\}\s+from\s+['"]react['"];?\s*$/);
        if (match) {
          const imports = match[1].trim();
          const filteredImports = imports
            .split(',')
            .map(imp => imp.trim())
            .filter(imp => imp !== 'React')
            .join(', ');
          
          if (filteredImports) {
            replacementLine = `import { ${filteredImports} } from 'react';`;
            shouldRemove = true;
          } else {
            replacementLine = '';
            shouldRemove = true;
          }
        }
      }
      
      if (shouldRemove) {
        if (replacementLine) {
          newLines.push(replacementLine);
        }
        // 빈 줄이 아닌 경우에만 제거 (빈 줄은 유지)
        removedCount++;
        modified = true;
      } else {
        newLines.push(line);
      }
    }
    
    if (modified) {
      const newContent = newLines.join('\n');
      fs.writeFileSync(filePath, newContent, 'utf8');
      processedCount++;
      console.log(`✅ 처리됨: ${path.relative(SRC_DIR, filePath)}`);
    }
    
  } catch (error) {
    console.error(`❌ 오류 발생: ${filePath}`, error.message);
  }
});

console.log('\n📊 처리 결과:');
console.log(`- 처리된 파일: ${processedCount}개`);
console.log(`- 제거된 React import: ${removedCount}개`);
console.log('🎉 React import 제거 완료!');

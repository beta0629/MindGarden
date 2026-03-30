#!/usr/bin/env node

/**
 * iPhone 17 디자인 시스템 전체 마이그레이션 스크립트
 * 모든 컴포넌트를 iPhone 17 디자인 시스템으로 일괄 변환
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-10-04
 */

const fs = require('fs');
const path = require('path');

// 마이그레이션 대상 파일 패턴
const TARGET_PATTERNS = [
    'frontend/src/components/**/*.js',
    'frontend/src/components/**/*.css',
    'frontend/src/pages/**/*.js',
    'frontend/src/pages/**/*.css'
];

// iPhone 17 컴포넌트 import 추가
const IPHONE17_IMPORTS = `// iPhone 17 디자인 시스템 컴포넌트
import IPhone17Card from '../common/IPhone17Card';
import IPhone17Button from '../common/IPhone17Button';
import IPhone17Modal from '../common/IPhone17Modal';
import IPhone17PageHeader from '../common/IPhone17PageHeader';`;

// 공통 레이아웃 import
const COMMON_LAYOUT_IMPORTS = `// 공통 레이아웃 시스템
import CommonPageTemplate from '../common/CommonPageTemplate';
import UnifiedHeader from '../common/UnifiedHeader';
import UnifiedNotification from '../common/UnifiedNotification';`;

// 컴포넌트 변환 규칙
const COMPONENT_REPLACEMENTS = [
    // SimpleLayout → CommonPageTemplate
    {
        from: /SimpleLayout/g,
        to: 'CommonPageTemplate'
    },
    // div 컨테이너 → IPhone17Card
    {
        from: /<div\s+className="([^"]*)"\s+style={{\s*backgroundColor:\s*['"]#ffffff['"],\s*borderRadius:\s*['"][^'"]*['"],\s*padding:\s*['"][^'"]*['"],\s*boxShadow:\s*['"][^'"]*['"],\s*marginBottom:\s*['"][^'"]*['"]/g,
        to: '<IPhone17Card variant="content" className="$1"'
    },
    // button → IPhone17Button
    {
        from: /<button\s+([^>]*?)style={{\s*backgroundColor:\s*['"][^'"]*['"],\s*color:\s*['"]white['"],\s*border:\s*['"]none['"],\s*padding:\s*['"][^'"]*['"],\s*borderRadius:\s*['"][^'"]*['"],\s*fontSize:\s*['"][^'"]*['"],\s*cursor:\s*['"]pointer['"],\s*transition:\s*['"][^'"]*['"]\s*}}\s*([^>]*?)>/g,
        to: '<IPhone17Button variant="primary" size="md" $1 $2>'
    },
    // 인라인 스타일 제거
    {
        from: /style={{\s*[^}]*\s*}}/g,
        to: ''
    }
];

// CSS 변환 규칙
const CSS_REPLACEMENTS = [
    // 하드코딩된 색상 → iPhone 17 토큰
    {
        from: /#ffffff/g,
        to: 'var(--glass-bg-primary)'
    },
    {
        from: /#f8f9fa/g,
        to: 'var(--glass-bg-secondary)'
    },
    {
        from: /#007bff/g,
        to: 'var(--color-primary)'
    },
    {
        from: /#e91e63/g,
        to: 'var(--color-danger)'
    },
    {
        from: /#4caf50/g,
        to: 'var(--color-success)'
    },
    {
        from: /#ff9800/g,
        to: 'var(--color-warning)'
    },
    // 하드코딩된 간격 → iPhone 17 토큰
    {
        from: /12px/g,
        to: 'var(--border-radius-lg)'
    },
    {
        from: /8px/g,
        to: 'var(--border-radius-md)'
    },
    {
        from: /24px/g,
        to: 'var(--spacing-xl)'
    },
    {
        from: /16px/g,
        to: 'var(--spacing-lg)'
    },
    {
        from: /8px/g,
        to: 'var(--spacing-md)'
    }
];

// 파일 찾기 함수
function findFiles(dir, pattern) {
    const files = [];
    
    function traverse(currentDir) {
        const items = fs.readdirSync(currentDir);
        
        for (const item of items) {
            const fullPath = path.join(currentDir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                traverse(fullPath);
            } else if (stat.isFile() && item.match(pattern)) {
                files.push(fullPath);
            }
        }
    }
    
    traverse(dir);
    return files;
}

// JavaScript 파일 마이그레이션
function migrateJSFile(filePath) {
    console.log(`🔄 마이그레이션 중: ${filePath}`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // iPhone 17 컴포넌트 import 추가
    if (content.includes('import React') && !content.includes('IPhone17Card')) {
        content = content.replace(
            /import React[^;]+;/,
            `$&\n${IPHONE17_IMPORTS}`
        );
        hasChanges = true;
    }
    
    // CommonPageTemplate import 추가
    if (content.includes('SimpleLayout') && !content.includes('CommonPageTemplate')) {
        content = content.replace(
            /import React[^;]+;/,
            `$&\n${COMMON_LAYOUT_IMPORTS}`
        );
        hasChanges = true;
    }
    
    // 컴포넌트 변환 적용
    COMPONENT_REPLACEMENTS.forEach(replacement => {
        const newContent = content.replace(replacement.from, replacement.to);
        if (newContent !== content) {
            content = newContent;
            hasChanges = true;
        }
    });
    
    // 변경사항이 있으면 파일 저장
    if (hasChanges) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ 완료: ${filePath}`);
        return true;
    } else {
        console.log(`⏭️  변경사항 없음: ${filePath}`);
        return false;
    }
}

// CSS 파일 마이그레이션
function migrateCSSFile(filePath) {
    console.log(`🎨 CSS 마이그레이션 중: ${filePath}`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // CSS 변환 적용
    CSS_REPLACEMENTS.forEach(replacement => {
        const newContent = content.replace(replacement.from, replacement.to);
        if (newContent !== content) {
            content = newContent;
            hasChanges = true;
        }
    });
    
    // iPhone 17 스타일 추가
    if (hasChanges && !content.includes('/* iPhone 17 디자인 시스템 적용 */')) {
        const header = `/* iPhone 17 디자인 시스템 적용 */\n/* 이 파일은 자동으로 마이그레이션되었습니다 */\n\n`;
        content = header + content;
    }
    
    // 변경사항이 있으면 파일 저장
    if (hasChanges) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ CSS 완료: ${filePath}`);
        return true;
    } else {
        console.log(`⏭️  CSS 변경사항 없음: ${filePath}`);
        return false;
    }
}

// 메인 마이그레이션 함수
function runMassMigration() {
    console.log('🚀 iPhone 17 디자인 시스템 전체 마이그레이션 시작...\n');
    
    const projectRoot = path.join(__dirname, '..');
    const componentsDir = path.join(projectRoot, 'frontend/src/components');
    const pagesDir = path.join(projectRoot, 'frontend/src/pages');
    
    let totalFiles = 0;
    let migratedFiles = 0;
    
    // JavaScript 파일 마이그레이션
    console.log('📝 JavaScript 파일 마이그레이션...');
    const jsFiles = [
        ...findFiles(componentsDir, /\.js$/),
        ...findFiles(pagesDir, /\.js$/)
    ];
    
    for (const file of jsFiles) {
        totalFiles++;
        if (migrateJSFile(file)) {
            migratedFiles++;
        }
    }
    
    // CSS 파일 마이그레이션
    console.log('\n🎨 CSS 파일 마이그레이션...');
    const cssFiles = [
        ...findFiles(componentsDir, /\.css$/),
        ...findFiles(pagesDir, /\.css$/)
    ];
    
    for (const file of cssFiles) {
        totalFiles++;
        if (migrateCSSFile(file)) {
            migratedFiles++;
        }
    }
    
    // 결과 출력
    console.log('\n📊 마이그레이션 완료!');
    console.log(`📁 총 파일 수: ${totalFiles}`);
    console.log(`✅ 마이그레이션된 파일: ${migratedFiles}`);
    console.log(`⏭️  변경사항 없는 파일: ${totalFiles - migratedFiles}`);
    console.log('\n🎉 iPhone 17 디자인 시스템 적용 완료!');
}

// 스크립트 실행
if (require.main === module) {
    runMassMigration();
}

module.exports = {
    runMassMigration,
    migrateJSFile,
    migrateCSSFile
};


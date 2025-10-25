#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * CSS 클래스명을 mg-v2- 접두사로 자동 수정하는 개선된 스크립트
 */

const SRC_DIR = path.join(__dirname, '../src');

// CSS 클래스명 매핑 규칙 (더 포괄적)
const CSS_CLASS_MAPPINGS = {
    // mg- 접두사 → mg-v2- 접두사
    'mg-': 'mg-v2-',
    
    // 일반적인 클래스명들
    'mapping-filters': 'mg-v2-mapping-filters',
    'mapping-filters-header': 'mg-v2-mapping-filters-header',
    'mapping-filters-title': 'mg-v2-mapping-filters-title',
    'mapping-filters-content': 'mg-v2-mapping-filters-content',
    'mapping-filters-status': 'mg-v2-mapping-filters-status',
    'mapping-filters-label': 'mg-v2-mapping-filters-label',
    'mapping-filters-select': 'mg-v2-mapping-filters-select',
    'mapping-filters-search': 'mg-v2-mapping-filters-search',
    'mapping-filters-search-wrapper': 'mg-v2-mapping-filters-search-wrapper',
    'mapping-filters-input': 'mg-v2-mapping-filters-input',
    'mapping-filters-clear-btn': 'mg-v2-mapping-filters-clear-btn',
    
    'mg-btn': 'mg-v2-btn',
    'mg-btn--sm': 'mg-v2-btn--sm',
    'mg-btn--secondary': 'mg-v2-btn--secondary',
    
    'mg-section-header': 'mg-v2-section-header',
    'mg-section-content': 'mg-v2-section-content',
    'mg-section-title-area': 'mg-v2-section-title-area',
    'mg-flex': 'mg-v2-flex',
    'mg-items-center': 'mg-v2-items-center',
    'mg-gap-sm': 'mg-v2-gap-sm',
    'mg-section-icon': 'mg-v2-section-icon',
    'mg-section-title': 'mg-v2-section-title',
    'mg-section-subtitle': 'mg-v2-section-subtitle',
    'mg-badge': 'mg-v2-badge',
    'mg-badge-info': 'mg-v2-badge-info',
    'mg-section-stats': 'mg-v2-section-stats',
    'mg-stat-item': 'mg-v2-stat-item',
    'mg-stat-label': 'mg-v2-stat-label',
    'mg-stat-value': 'mg-v2-stat-value',
    'mg-section-actions': 'mg-v2-section-actions'
};

/**
 * 파일에서 CSS 클래스명을 수정하는 함수
 */
function fixCssClassesInFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        // CSS 클래스명 매핑 적용
        for (const [oldClass, newClass] of Object.entries(CSS_CLASS_MAPPINGS)) {
            const regex = new RegExp(`className=["']([^"']*\\b${oldClass.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^"']*)["']`, 'g');
            const matches = content.match(regex);
            
            if (matches) {
                content = content.replace(regex, (match, className) => {
                    const newClassName = className.replace(new RegExp(`\\b${oldClass.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'), newClass);
                    return `className="${newClassName}"`;
                });
                modified = true;
            }
        }
        
        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ 수정 완료: ${filePath}`);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error(`❌ 오류 발생: ${filePath}`, error.message);
        return false;
    }
}

/**
 * 디렉토리를 재귀적으로 탐색하여 파일들을 수정
 */
function processDirectory(dirPath) {
    let totalFiles = 0;
    let modifiedFiles = 0;
    
    function walkDir(currentPath) {
        const items = fs.readdirSync(currentPath);
        
        for (const item of items) {
            const itemPath = path.join(currentPath, item);
            const stat = fs.statSync(itemPath);
            
            if (stat.isDirectory()) {
                if (!itemPath.includes('node_modules') && !itemPath.includes('build')) {
                    walkDir(itemPath);
                }
            } else if (stat.isFile() && (item.endsWith('.js') || item.endsWith('.jsx'))) {
                totalFiles++;
                if (fixCssClassesInFile(itemPath)) {
                    modifiedFiles++;
                }
            }
        }
    }
    
    walkDir(dirPath);
    
    return { totalFiles, modifiedFiles };
}

/**
 * 메인 실행 함수
 */
function main() {
    console.log('🚀 CSS 클래스명 mg-v2- 접두사 자동 수정 v2 시작...\n');
    
    if (!fs.existsSync(SRC_DIR)) {
        console.error('❌ src 디렉토리를 찾을 수 없습니다.');
        process.exit(1);
    }
    
    const { totalFiles, modifiedFiles } = processDirectory(SRC_DIR);
    
    console.log(`\n📊 수정 완료 통계:`);
    console.log(`   전체 파일: ${totalFiles}개`);
    console.log(`   수정된 파일: ${modifiedFiles}개`);
    console.log(`   수정률: ${((modifiedFiles / totalFiles) * 100).toFixed(1)}%`);
    
    if (modifiedFiles > 0) {
        console.log('\n🎉 CSS 클래스명 수정이 완료되었습니다!');
    } else {
        console.log('\nℹ️  수정할 파일이 없습니다.');
    }
}

// 스크립트 실행
if (require.main === module) {
    main();
}

module.exports = { fixCssClassesInFile, processDirectory };

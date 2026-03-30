#!/usr/bin/env node

/**
 * 남은 모든 경로 문제를 수정하는 스크립트
 */

const fs = require('fs');
const path = require('path');

function fixAllRemainingPaths(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let hasChanges = false;
    
    // 잘못된 경로 패턴들을 수정
    const pathFixes = [
        // erp/common 폴더의 경로 수정
        {
            pattern: /from '\.\.\/\.\.\/\.\.\/common\/([^']+)'/g,
            replacement: "from '../../common/$1'"
        },
        // admin/system 폴더의 경로 수정
        {
            pattern: /from '\.\.\/common\/([^']+)'/g,
            replacement: "from '../../common/$1'"
        },
        // 기타 잘못된 common 경로들
        {
            pattern: /from '\.\.\/layout\/CommonPageTemplate'/g,
            replacement: "from '../common/CommonPageTemplate'"
        }
    ];
    
    pathFixes.forEach(fix => {
        const newContentAfterFix = newContent.replace(fix.pattern, fix.replacement);
        if (newContentAfterFix !== newContent) {
            newContent = newContentAfterFix;
            hasChanges = true;
        }
    });
    
    if (hasChanges) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`✅ 경로 수정 완료: ${filePath}`);
        return true;
    }
    
    return false;
}

function fixAllRemainingPathsInProject() {
    console.log('🔧 남은 모든 경로 문제 수정 시작...\n');
    
    const srcDir = path.join(__dirname, '../frontend/src');
    let totalFiles = 0;
    let fixedFiles = 0;
    
    function processDirectory(dir) {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                processDirectory(fullPath);
            } else if (item.endsWith('.js')) {
                totalFiles++;
                if (fixAllRemainingPaths(fullPath)) {
                    fixedFiles++;
                }
            }
        }
    }
    
    processDirectory(srcDir);
    
    console.log(`\n📊 남은 경로 문제 수정 완료!`);
    console.log(`📁 총 파일 수: ${totalFiles}`);
    console.log(`✅ 수정된 파일: ${fixedFiles}`);
    console.log(`⏭️  변경사항 없는 파일: ${totalFiles - fixedFiles}`);
}

// 스크립트 실행
if (require.main === module) {
    fixAllRemainingPathsInProject();
}

module.exports = { fixAllRemainingPaths, fixAllRemainingPathsInProject };


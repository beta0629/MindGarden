#!/usr/bin/env node

/**
 * 모든 경로 문제를 최종적으로 해결하는 스크립트
 */

const fs = require('fs');
const path = require('path');

function getCorrectImportPath(filePath, targetFile) {
    const srcDir = path.join(__dirname, '../frontend/src');
    const relativePath = path.relative(srcDir, filePath);
    const fileDir = path.dirname(relativePath);
    
    // targetFile의 실제 위치 찾기
    const targetPath = path.join(srcDir, 'components/common', targetFile);
    if (fs.existsSync(targetPath + '.js')) {
        // 상대 경로 계산
        const fromDir = path.dirname(filePath);
        const toFile = path.join(srcDir, 'components/common', targetFile);
        const relative = path.relative(fromDir, toFile);
        return relative.startsWith('.') ? relative : './' + relative;
    }
    
    return null;
}

function fixAllPathsInFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let hasChanges = false;
    
    // 모든 잘못된 import 패턴을 수정
    const pathFixes = [
        // ../../../common/ -> 올바른 경로로
        {
            pattern: /from '\.\.\/\.\.\/\.\.\/common\/([^']+)'/g,
            replacement: (match, p1) => {
                const correctPath = getCorrectImportPath(filePath, p1);
                return correctPath ? `from '${correctPath}'` : match;
            }
        },
        // ../../common/ -> 올바른 경로로
        {
            pattern: /from '\.\.\/\.\.\/common\/([^']+)'/g,
            replacement: (match, p1) => {
                const correctPath = getCorrectImportPath(filePath, p1);
                return correctPath ? `from '${correctPath}'` : match;
            }
        },
        // ../common/ -> 올바른 경로로
        {
            pattern: /from '\.\.\/common\/([^']+)'/g,
            replacement: (match, p1) => {
                const correctPath = getCorrectImportPath(filePath, p1);
                return correctPath ? `from '${correctPath}'` : match;
            }
        },
        // ../layout/CommonPageTemplate -> ../common/CommonPageTemplate
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

function fixAllPathsInProject() {
    console.log('🔧 모든 경로 문제 최종 해결 시작...\n');
    
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
                if (fixAllPathsInFile(fullPath)) {
                    fixedFiles++;
                }
            }
        }
    }
    
    processDirectory(srcDir);
    
    console.log(`\n📊 모든 경로 문제 최종 해결 완료!`);
    console.log(`📁 총 파일 수: ${totalFiles}`);
    console.log(`✅ 수정된 파일: ${fixedFiles}`);
    console.log(`⏭️  변경사항 없는 파일: ${totalFiles - fixedFiles}`);
}

// 스크립트 실행
if (require.main === module) {
    fixAllPathsInProject();
}

module.exports = { fixAllPathsInFile, fixAllPathsInProject };


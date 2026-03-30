-- psych_assessment_documents.storage_path 확장: 이미지 N장 시 JSON 배열(경로 목록·순서) 저장
-- 기존 단일 PDF 경로 또는 JSON 배열 형식 지원

ALTER TABLE psych_assessment_documents
  MODIFY COLUMN storage_path TEXT NOT NULL;

'use client';

import { useState, useRef } from 'react';

interface ImageUploaderProps {
  onImageUploaded: (imageUrl: string) => void;
  onError?: (error: string) => void;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  uploading?: boolean;
  onUploadingChange?: (uploading: boolean) => void;
  altText?: string;
  displayOrder?: number;
}

export default function ImageUploader({
  onImageUploaded,
  onError,
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 0.9,
  uploading: externalUploading,
  onUploadingChange,
  altText,
  displayOrder
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [cropArea, setCropArea] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [showResizeOptions, setShowResizeOptions] = useState(false);
  const [resizeWidth, setResizeWidth] = useState(maxWidth);
  const [resizeHeight, setResizeHeight] = useState(maxHeight);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const originalFileRef = useRef<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const isUploading = externalUploading !== undefined ? externalUploading : uploading;

  // 이미지 리사이징 함수 (갤러리 이미지는 서버에서 자동 리사이징)
  const resizeImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      // 갤러리 페이지에서는 서버 사이드 리사이징 사용 (클라이언트 리사이징 스킵)
      const isGalleryUpload = window.location.pathname.includes('/gallery');
      if (isGalleryUpload) {
        // 서버에서 리사이징하므로 원본 파일 그대로 반환
        resolve(new Blob([file], { type: file.type }));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          imageRef.current = img;
          
          let width = img.width;
          let height = img.height;
          
          // 리사이징 옵션이 있으면 사용
          if (showResizeOptions) {
            width = resizeWidth;
            height = resizeHeight;
          } else {
            // 기본: 비율 유지하며 최대 크기로 리사이징
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            if (ratio < 1) {
              width = width * ratio;
              height = height * ratio;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Canvas context를 가져올 수 없습니다.'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('이미지 변환에 실패했습니다.'));
              }
            },
            file.type || 'image/jpeg',
            quality
          );
        };
        img.onerror = () => reject(new Error('이미지를 로드할 수 없습니다.'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다.'));
      reader.readAsDataURL(file);
    });
  };

  // 파일 처리
  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      onError?.('이미지 파일만 업로드 가능합니다.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      onError?.('이미지 크기는 10MB 이하여야 합니다.');
      return;
    }

    // 원본 파일 저장
    originalFileRef.current = file;
    setIsResizing(true);
    setShowResizeOptions(true);

    // 미리보기 표시
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        setResizeWidth(Math.min(img.width, maxWidth));
        setResizeHeight(Math.min(img.height, maxHeight));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // 리사이징 적용 및 업로드
  const handleResizeAndUpload = async () => {
    if (!preview || !imageRef.current) return;

    const currentUploading = externalUploading !== undefined ? externalUploading : uploading;
    if (currentUploading) return;

    if (externalUploading !== undefined && onUploadingChange) {
      onUploadingChange(true);
    } else {
      setUploading(true);
    }

    try {
      // 원본 파일 다시 가져오기 (간단한 방법: canvas에서 blob 생성)
      const canvas = document.createElement('canvas');
      canvas.width = resizeWidth;
      canvas.height = resizeHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Canvas context를 가져올 수 없습니다.');
      }

      ctx.drawImage(imageRef.current, 0, 0, resizeWidth, resizeHeight);
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          throw new Error('이미지 변환에 실패했습니다.');
        }

        // Blob을 File로 변환
        const file = new File([blob], 'resized-image.jpg', { type: 'image/jpeg' });

        // 업로드 (갤러리 이미지인 경우 /api/gallery 사용)
        const formData = new FormData();
        formData.append('image', file);
        
        // 갤러리 페이지에서 사용 중인지 확인 (URL 기반)
        const isGalleryUpload = window.location.pathname.includes('/gallery');
        if (isGalleryUpload) {
          // 갤러리 이미지인 경우 altText와 displayOrder도 함께 전달
          if (altText !== undefined) {
            formData.append('altText', altText || '');
          }
          if (displayOrder !== undefined) {
            formData.append('displayOrder', displayOrder.toString());
          }
        }
        
        const uploadUrl = isGalleryUpload ? '/api/gallery' : '/api/blog/images';

        const response = await fetch(uploadUrl, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('이미지 업로드에 실패했습니다.');
        }

        const result = await response.json();
        onImageUploaded(result.imageUrl || result.url);
        setPreview(null);
        setShowResizeOptions(false);
        setIsResizing(false);
        imageRef.current = null;
      }, 'image/jpeg', quality);
    } catch (error: any) {
      onError?.(error.message || '이미지 업로드에 실패했습니다.');
      console.error('Upload error:', error);
    } finally {
      if (externalUploading !== undefined && onUploadingChange) {
        onUploadingChange(false);
      } else {
        setUploading(false);
      }
    }
  };

  // 드래그 앤 드롭 핸들러
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    if (files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  // 비율 유지 계산
  const handleWidthChange = (newWidth: number) => {
    setResizeWidth(newWidth);
    if (maintainAspectRatio && imageRef.current) {
      const ratio = imageRef.current.height / imageRef.current.width;
      setResizeHeight(Math.round(newWidth * ratio));
    }
  };

  const handleHeightChange = (newHeight: number) => {
    setResizeHeight(newHeight);
    if (maintainAspectRatio && imageRef.current) {
      const ratio = imageRef.current.width / imageRef.current.height;
      setResizeWidth(Math.round(newHeight * ratio));
    }
  };

  return (
    <div>
      {!showResizeOptions ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${isDragging ? 'var(--accent-sky)' : 'var(--border-soft)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '60px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: isDragging ? 'rgba(184, 212, 227, 0.1)' : 'var(--bg-light)',
            transition: 'all 0.3s ease',
            position: 'relative'
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          {isDragging ? (
            <div style={{ color: 'var(--accent-sky)', fontSize: '18px', fontWeight: '600' }}>
              이미지를 여기에 놓으세요
            </div>
          ) : (
            <>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📷</div>
              <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-main)' }}>
                이미지를 드래그 앤 드롭하거나 클릭하여 선택
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-sub)' }}>
                PNG, JPG, GIF (최대 10MB)
              </div>
            </>
          )}
        </div>
      ) : (
        <div style={{
          border: '1px solid var(--border-soft)',
          borderRadius: 'var(--radius-md)',
          padding: '24px',
          backgroundColor: 'var(--surface-1)'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>이미지 리사이징</h4>
              <button
                type="button"
                onClick={() => {
                  setShowResizeOptions(false);
                  setPreview(null);
                  imageRef.current = null;
                  originalFileRef.current = null;
                }}
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'transparent',
                  color: 'var(--text-sub)',
                  border: '1px solid var(--border-soft)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                취소
              </button>
            </div>
            
            {preview && (
              <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <img
                  src={preview}
                  alt="미리보기"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '300px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-soft)'
                  }}
                />
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={maintainAspectRatio}
                    onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>비율 유지</span>
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                    너비 (px)
                  </label>
                  <input
                    type="number"
                    value={resizeWidth}
                    onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                    min="100"
                    max="4000"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid var(--border-soft)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                    높이 (px)
                  </label>
                  <input
                    type="number"
                    value={resizeHeight}
                    onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                    min="100"
                    max="4000"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid var(--border-soft)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={handleResizeAndUpload}
                  disabled={isUploading}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    backgroundColor: 'var(--accent-sky)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: isUploading ? 'not-allowed' : 'pointer',
                    opacity: isUploading ? 0.6 : 1
                  }}
                >
                  {isUploading ? '업로드 중...' : '리사이징 후 업로드'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


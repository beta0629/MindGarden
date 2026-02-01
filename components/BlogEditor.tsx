'use client';

import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { getApiService } from '@/lib/api';

// React Quill을 동적으로 로드
let ReactQuill: any = null;
let quillStylesLoaded = false;

interface BlogEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onImageUpload?: (file: File) => Promise<{ imageUrl: string }>;
}

export default function BlogEditor({ 
  value, 
  onChange, 
  placeholder = '내용을 입력하세요...', 
  onImageUpload 
}: BlogEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const quillInstanceRef = useRef<any>(null);
  const reactQuillRef = useRef<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isQuillLoaded, setIsQuillLoaded] = useState(false);

  // ReactQuill을 클라이언트에서만 동적으로 로드
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadQuill = async () => {
      if (ReactQuill) {
        setIsQuillLoaded(true);
        return;
      }

      try {
        // CSS 로드
        if (!quillStylesLoaded) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://cdn.quilljs.com/1.3.6/quill.snow.css';
          document.head.appendChild(link);
          quillStylesLoaded = true;
        }

        // ReactQuill 모듈 로드
        const ReactQuillModule = await import('react-quill');
        ReactQuill = ReactQuillModule.default;
        setIsQuillLoaded(true);
      } catch (error) {
        console.error('Failed to load ReactQuill:', error);
      }
    };

    loadQuill();
  }, []);

  // Quill 인스턴스를 찾는 헬퍼 함수
  const getQuillInstance = useCallback(() => {
    // 먼저 캐시된 인스턴스 확인
    if (quillInstanceRef.current) {
      return quillInstanceRef.current;
    }
    
    // ReactQuill ref에서 가져오기 시도
    if (reactQuillRef.current) {
      try {
        const quill = reactQuillRef.current.getEditor?.();
        if (quill) {
          quillInstanceRef.current = quill;
          return quill;
        }
      } catch (e) {
        // getEditor가 없을 수 있음
      }
    }
    
    // DOM에서 직접 Quill 인스턴스 찾기
    // 여러 방법으로 시도
    if (containerRef.current) {
      // 방법 1: .ql-container에서 __quill 속성 찾기
      const quillContainer = containerRef.current.querySelector('.ql-container') as HTMLElement;
      if (quillContainer) {
        const quill = (quillContainer as any).__quill;
        if (quill) {
          quillInstanceRef.current = quill;
          return quill;
        }
      }
      
      // 방법 2: .ql-editor의 부모 요소들에서 찾기
      const quillEditor = containerRef.current.querySelector('.ql-editor');
      if (quillEditor) {
        let element: HTMLElement | null = quillEditor.parentElement;
        while (element && element !== containerRef.current) {
          const quill = (element as any).__quill;
          if (quill) {
            quillInstanceRef.current = quill;
            return quill;
          }
          element = element.parentElement;
        }
      }
    }
    return null;
  }, []);

  // 이미지를 base64로 변환하는 헬퍼 함수 (공통 사용)
  const convertImageToBase64 = useCallback((file: File, maxWidth: number = 1920, maxHeight: number = 1080, quality: number = 0.9): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          
          // 비율 유지하며 최대 크기로 리사이징
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          if (ratio < 1) {
            width = width * ratio;
            height = height * ratio;
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
          
          // base64로 변환
          const base64 = canvas.toDataURL('image/jpeg', quality);
          resolve(base64);
        };
        img.onerror = () => reject(new Error('이미지를 로드할 수 없습니다.'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다.'));
      reader.readAsDataURL(file);
    });
  }, []);

    // 이미지 핸들러
    const imageHandler = useCallback(async () => {
      const input = document.createElement('input');
      input.setAttribute('type', 'file');
      input.setAttribute('accept', 'image/*');
      input.click();

      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;

        // 파일 크기 확인 (10MB 제한)
        if (file.size > 10 * 1024 * 1024) {
          alert('이미지 크기는 10MB 이하여야 합니다.');
          return;
        }

        try {
          let imageUrl: string;

          // onImageUpload가 제공되면 서버 업로드 사용, 아니면 base64 사용
          if (onImageUpload) {
            const result = await onImageUpload(file);
            imageUrl = result.imageUrl;
            if (!imageUrl) {
              throw new Error('이미지 URL을 받지 못했습니다.');
            }
          } else {
            // base64로 변환 (리사이징 포함)
            imageUrl = await convertImageToBase64(file, 1920, 1080, 0.9);
          }

          const quill = getQuillInstance();
          if (!quill) {
            throw new Error('에디터를 찾을 수 없습니다.');
          }

          // 현재 selection 가져오기 (null일 수 있음)
          const range = quill.getSelection();
          const index = range ? range.index : quill.getLength();
          
          // 이미지 삽입 (base64 또는 URL)
          quill.insertEmbed(index, 'image', imageUrl);
          
          // 이미지 삽입 후 커서를 이미지 다음으로 이동 (requestAnimationFrame 사용)
          requestAnimationFrame(() => {
            try {
              const newLength = quill.getLength();
              // 이미지가 삽입되었으므로 index + 1 위치로 이동
              const newIndex = Math.min(index + 1, newLength - 1);
              if (newIndex >= 0 && newIndex < newLength) {
                quill.setSelection(newIndex, 0, 'user');
              }
            } catch (error) {
              // selection 설정 실패는 무시 (에디터는 정상 작동)
              console.warn('Selection 설정 실패 (무시됨):', error);
            }
          });
        } catch (error) {
          console.error('Image upload error:', error);
          alert('이미지 업로드에 실패했습니다.');
        }
      };
    },
    [onImageUpload, getQuillInstance, convertImageToBase64]
  );

  // Quill 모듈 설정
  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ 'header': [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          [{ 'color': [] }, { 'background': [] }],
          ['link', 'image'],
          ['clean']
        ],
        handlers: {
          image: imageHandler
        }
      },
      clipboard: {
        matchVisual: false
      }
    }),
    [imageHandler]
  );

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

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    
    if (files.length === 0) {
      console.warn('드롭된 파일 중 이미지가 없습니다.');
      return;
    }

    // Quill 에디터가 준비될 때까지 대기
    let quill = getQuillInstance();
    
    // Quill이 준비되지 않았으면 최대 2초간 대기
    if (!quill) {
      for (let i = 0; i < 20; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        quill = getQuillInstance();
        if (quill) break;
      }
      
      if (!quill) {
        console.error('Quill 에디터를 찾을 수 없습니다.');
        alert('에디터가 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
        return;
      }
    }


    for (const file of files) {
      try {
        console.log('이미지 업로드 시작:', file.name, file.type, file.size);
        
        // 파일 크기 확인 (10MB 제한)
        if (file.size > 10 * 1024 * 1024) {
          alert(`${file.name}: 이미지 크기는 10MB 이하여야 합니다.`);
          continue;
        }

        let imageUrl: string;

        // onImageUpload가 제공되면 서버 업로드 사용, 아니면 base64 사용
        if (onImageUpload) {
          const result = await onImageUpload(file);
          imageUrl = result.imageUrl;
          if (!imageUrl) {
            throw new Error('이미지 URL을 받지 못했습니다.');
          }
        } else {
          // base64로 변환 (리사이징 포함)
          imageUrl = await convertImageToBase64(file, 1920, 1080, 0.9);
        }

        console.log('이미지 업로드 완료:', imageUrl.substring(0, 50) + '...');

        // 현재 selection 가져오기 (null일 수 있음)
        const range = quill.getSelection();
        const index = range ? range.index : quill.getLength();
        
        // 이미지 삽입 (base64 또는 URL)
        quill.insertEmbed(index, 'image', imageUrl);
        
        // 이미지 삽입 후 커서를 이미지 다음으로 이동 (requestAnimationFrame 사용)
        requestAnimationFrame(() => {
          try {
            const newLength = quill.getLength();
            // 이미지가 삽입되었으므로 index + 1 위치로 이동
            const newIndex = Math.min(index + 1, newLength - 1);
            if (newIndex >= 0 && newIndex < newLength) {
              quill.setSelection(newIndex, 0, 'user');
            }
          } catch (error) {
            // selection 설정 실패는 무시 (에디터는 정상 작동)
            console.warn('Selection 설정 실패 (무시됨):', error);
          }
        });
        
        console.log('이미지 삽입 완료');
      } catch (error: any) {
        console.error('Image upload error:', error);
        const errorMessage = error?.message || '이미지 업로드에 실패했습니다.';
        alert(`${file.name}: ${errorMessage}`);
      }
    }
  }, [onImageUpload, getQuillInstance, convertImageToBase64]);

  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{ position: 'relative' }}
    >
      {isDragging && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(184, 212, 227, 0.2)',
          border: '3px dashed var(--accent-sky)',
          borderRadius: 'var(--radius-sm)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          fontWeight: '600',
          color: 'var(--accent-sky)'
        }}>
          이미지를 여기에 놓으세요
        </div>
      )}
      {isQuillLoaded && ReactQuill ? (
        <ReactQuill
          ref={(el: any) => {
            reactQuillRef.current = el;
            // ref가 설정되면 즉시 Quill 인스턴스 가져오기 시도
            if (el) {
              setTimeout(() => {
                try {
                  const quill = el.getEditor?.();
                  if (quill) {
                    quillInstanceRef.current = quill;
                  }
                } catch (e) {
                  // 무시
                }
              }, 100);
            }
          }}
          theme="snow"
          value={value}
          onChange={(content: string, delta: any, source: any, editor: any) => {
            // onChange에서 editor 인스턴스를 받을 수 있음
            if (editor) {
              quillInstanceRef.current = editor;
            }
            // 'user' 소스만 onChange 호출 (내부 업데이트는 무시)
            if (source === 'user' || source === 'api') {
              onChange(content);
            }
          }}
          modules={modules}
          placeholder={placeholder}
          style={{
            backgroundColor: 'white',
            borderRadius: 'var(--radius-sm)',
            minHeight: '400px'
          }}
        />
      ) : (
        <div style={{ minHeight: '400px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-soft)' }}>
          에디터 로딩 중...
        </div>
      )}
      <style jsx global>{`
        .ql-container {
          font-family: var(--font-main);
          font-size: 16px;
          min-height: 400px;
        }
        .ql-editor {
          min-height: 400px;
          line-height: 1.8;
        }
        .ql-editor.ql-blank::before {
          color: var(--text-light);
          font-style: normal;
        }
        .ql-toolbar {
          border-top-left-radius: var(--radius-sm);
          border-top-right-radius: var(--radius-sm);
          border-bottom: 1px solid var(--border-soft);
          background: var(--bg-light);
        }
        .ql-container {
          border-bottom-left-radius: var(--radius-sm);
          border-bottom-right-radius: var(--radius-sm);
          border: 1px solid var(--border-soft);
        }
        .ql-snow .ql-stroke {
          stroke: var(--text-main);
        }
        .ql-snow .ql-fill {
          fill: var(--text-main);
        }
        .ql-snow .ql-picker-label {
          color: var(--text-main);
        }
        .ql-snow .ql-picker-options {
          background: white;
          border: 1px solid var(--border-soft);
          border-radius: var(--radius-sm);
        }
        .ql-editor img {
          max-width: 100%;
          height: auto;
          border-radius: var(--radius-sm);
          margin: 16px 0;
        }
      `}</style>
    </div>
  );
}


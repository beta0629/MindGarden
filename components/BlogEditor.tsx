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

    // 이미지 핸들러
    const imageHandler = useCallback(async () => {
      const input = document.createElement('input');
      input.setAttribute('type', 'file');
      input.setAttribute('accept', 'image/*');
      input.click();

      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;

        try {
          let result;
          if (onImageUpload) {
            result = await onImageUpload(file);
          } else {
            const apiService = getApiService();
            result = await apiService.uploadBlogImage(file);
          }
          const imageUrl = result.imageUrl || result.url;

          const quill = getQuillInstance();
          if (quill) {
            // 현재 selection 가져오기 (null일 수 있음)
            const range = quill.getSelection();
            const index = range ? range.index : quill.getLength();
            
            // 이미지 삽입
            quill.insertEmbed(index, 'image', imageUrl);
            
            // DOM 업데이트 후 selection 설정 (안전하게)
            setTimeout(() => {
              try {
                const newLength = quill.getLength();
                const newIndex = Math.min(index + 1, newLength - 1);
                if (newIndex >= 0 && newIndex < newLength) {
                  quill.setSelection(newIndex, 0);
                }
              } catch (error) {
                // selection 설정 실패는 무시 (경고만 발생)
                console.warn('Failed to set selection after image insert:', error);
              }
            }, 0);
          }
        } catch (error) {
          console.error('Image upload error:', error);
          alert('이미지 업로드에 실패했습니다.');
        }
      };
    },
    [onImageUpload, getQuillInstance]
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
        
        let result;
        if (onImageUpload) {
          result = await onImageUpload(file);
        } else {
          const apiService = getApiService();
          result = await apiService.uploadBlogImage(file);
        }
        
        const imageUrl = result.imageUrl || result.url;
        if (!imageUrl) {
          throw new Error('이미지 URL을 받지 못했습니다.');
        }

        console.log('이미지 업로드 완료:', imageUrl);

        // 현재 selection 가져오기 (null일 수 있음)
        const range = quill.getSelection();
        const index = range ? range.index : quill.getLength();
        
        // 이미지 삽입
        quill.insertEmbed(index, 'image', imageUrl);
        
        // DOM 업데이트 후 selection 설정 (안전하게)
        setTimeout(() => {
          try {
            const newLength = quill.getLength();
            const newIndex = Math.min(index + 1, newLength - 1);
            if (newIndex >= 0 && newIndex < newLength) {
              quill.setSelection(newIndex, 0);
            }
          } catch (error) {
            // selection 설정 실패는 무시 (경고만 발생)
            console.warn('Failed to set selection after image insert:', error);
          }
        }, 0);
        
        console.log('이미지 삽입 완료');
      } catch (error: any) {
        console.error('Image upload error:', error);
        const errorMessage = error?.message || '이미지 업로드에 실패했습니다.';
        alert(`${file.name}: ${errorMessage}`);
      }
    }
  }, [onImageUpload, getQuillInstance]);

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
            if (editor && !quillInstanceRef.current) {
              quillInstanceRef.current = editor;
            }
            onChange(content);
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


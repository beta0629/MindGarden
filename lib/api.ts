/**
 * 코어솔루션 API 서비스
 * Next.js 서버/클라이언트 양쪽에서 사용 가능
 */

import { CONFIG } from './config';
import { FALLBACK_GALLERY_IMAGES } from './site-fallback-visuals';

class ApiService {
  private baseURL: string;
  private endpoints: typeof CONFIG.ENDPOINTS;
  private timeout: number;

  constructor() {
    this.baseURL = CONFIG.API_BASE_URL;
    this.endpoints = CONFIG.ENDPOINTS;
    this.timeout = CONFIG.TIMEOUT;
  }

  /**
   * 기본 URL 가져오기 (서버/클라이언트 환경에 따라)
   */
  private getBaseUrl(): string {
    if (typeof window !== 'undefined') {
      // 클라이언트 사이드: 현재 origin 사용
      return window.location.origin;
    }
    
    // 서버 사이드: 환경 변수 또는 기본값 사용
    if (CONFIG.LOCAL_URL) {
      return CONFIG.LOCAL_URL;
    }
    
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    
    // 기본값: 로컬 개발 서버
    return `http://localhost:${CONFIG.LOCAL_PORT}`;
  }

  /**
   * 기본 fetch 래퍼 (에러 처리 및 타임아웃)
   */
  private async request(url: string, options: RequestInit = {}): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    const defaultOptions: RequestInit = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    };

    try {
      const response = await fetch(url, { ...defaultOptions, ...options });
      clearTimeout(timeoutId);

      if (!response.ok) {
        // 응답 본문 읽기 시도
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
          if (errorData.details) {
            console.error('API error details:', errorData.details);
          }
        } catch {
          // JSON 파싱 실패 시 텍스트로 읽기 시도
          try {
            const errorText = await response.text();
            if (errorText) {
              errorMessage = errorText.substring(0, 200);
            }
          } catch {
            // 무시
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * 홈페이지 메인 데이터 조회
   */
  async getHomeData() {
    try {
      const url = `${this.baseURL}${this.endpoints.HOME_DATA}`;
      return await this.request(url);
    } catch (error) {
      console.error('Failed to fetch home data:', error);
      // 오류 시 기본 데이터 반환
      return this.getDefaultHomeData();
    }
  }

  /**
   * 갤러리 이미지 조회
   */
  async getGalleryImages() {
    try {
      // 로컬 API 사용
      const response = await fetch('/api/gallery');
      const data = await response.json();
      return data.success && data.images ? data.images : null;
    } catch (error) {
      console.error('Failed to fetch gallery images:', error);
      return null;
    }
  }

  /**
   * 갤러리 이미지 추가
   */
  async addGalleryImage(imageData: {
    imageUrl: string;
    altText?: string;
    category?: string;
    displayOrder?: number;
  }) {
    try {
      const response = await fetch('/api/gallery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(imageData),
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to add gallery image:', error);
      throw error;
    }
  }

  /**
   * 갤러리 이미지 수정
   */
  async updateGalleryImage(id: number, imageData: {
    imageUrl?: string;
    altText?: string;
    category?: string;
    displayOrder?: number;
    isActive?: boolean;
  }) {
    try {
      const response = await fetch(`/api/gallery/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(imageData),
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to update gallery image:', error);
      throw error;
    }
  }

  /**
   * 갤러리 이미지 삭제
   */
  async deleteGalleryImage(id: number) {
    try {
      const response = await fetch(`/api/gallery/${id}`, {
        method: 'DELETE',
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to delete gallery image:', error);
      throw error;
    }
  }

  /**
   * 상담소 정보 조회
   */
  async getClinicInfo() {
    try {
      const url = `${this.baseURL}${this.endpoints.CLINIC_INFO}`;
      return await this.request(url);
    } catch (error) {
      console.error('Failed to fetch clinic info:', error);
      return null;
    }
  }

  /**
   * 공지사항 조회
   */
  async getNotices(limit: number = 5) {
    try {
      const url = `${this.baseURL}${this.endpoints.NOTICES}?limit=${limit}`;
      const data = await this.request(url);
      return data.notices || [];
    } catch (error) {
      console.error('Failed to fetch notices:', error);
      return [];
    }
  }

  /**
   * 프로그램 정보 조회
   */
  async getPrograms() {
    try {
      const url = `${this.baseURL}${this.endpoints.PROGRAMS}`;
      const data = await this.request(url);
      return data.programs || [];
    } catch (error) {
      console.error('Failed to fetch programs:', error);
      return [];
    }
  }

  /**
   * 히어로 비디오 URL 조회
   */
  async getHeroVideo() {
    try {
      const url = `${this.baseURL}${this.endpoints.HOME_DATA}`;
      const data = await this.request(url);
      return data.videoUrl || null;
    } catch (error) {
      console.error('Failed to fetch hero video:', error);
      return null;
    }
  }

  /**
   * 블로그 포스트 목록 조회
   */
  async getBlogPosts(page: number = 1, limit: number = 10, homepageOnly: boolean = false, includeAllStatus: boolean = false) {
    try {
      // Next.js API 라우트 사용 (서버/클라이언트 모두)
      const baseUrl = this.getBaseUrl();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (homepageOnly) {
        params.append('homepageOnly', 'true');
      }
      if (includeAllStatus) {
        params.append('includeAllStatus', 'true');
      }
      const url = `${baseUrl}/api/blog/posts?${params.toString()}`;
      console.log('getBlogPosts URL:', url);
      const data = await this.request(url);
      return data.posts || [];
    } catch (error) {
      console.error('Failed to fetch blog posts:', error);
      return [];
    }
  }

  /**
   * 블로그 포스트 상세 조회
   */
  async getBlogPost(postId: number) {
    try {
      // Next.js API 라우트 사용 (서버/클라이언트 모두)
      const baseUrl = this.getBaseUrl();
      const url = `${baseUrl}/api/blog/posts/${postId}`;
      return await this.request(url);
    } catch (error) {
      console.error('Failed to fetch blog post:', error);
      return null;
    }
  }

  /**
   * 블로그 포스트 작성
   */
  async createBlogPost(postData: {
    title: string;
    content: string;
    summary?: string;
    thumbnailImageUrl?: string;
    status?: 'draft' | 'published';
    isHomepageOnly?: boolean;
  }) {
    try {
      // Next.js API 라우트 사용 (서버/클라이언트 모두)
      const baseUrl = this.getBaseUrl();
      const url = `${baseUrl}/api/blog/posts`;
      return await this.request(url, {
        method: 'POST',
        body: JSON.stringify(postData),
      });
    } catch (error) {
      console.error('Failed to create blog post:', error);
      throw error;
    }
  }

  /**
   * 블로그 포스트 수정
   */
  async updateBlogPost(postId: number, postData: {
    title: string;
    content: string;
    summary?: string;
    thumbnailImageUrl?: string;
    status?: 'draft' | 'published';
    isHomepageOnly?: boolean;
  }) {
    try {
      // Next.js API 라우트 사용 (서버/클라이언트 모두)
      const baseUrl = this.getBaseUrl();
      const url = `${baseUrl}/api/blog/posts/${postId}`;
      return await this.request(url, {
        method: 'PUT',
        body: JSON.stringify(postData),
      });
    } catch (error) {
      console.error('Failed to update blog post:', error);
      throw error;
    }
  }

  /**
   * 블로그 포스트 삭제
   */
  async deleteBlogPost(postId: number) {
    try {
      // Next.js API 라우트 사용 (서버/클라이언트 모두)
      const baseUrl = this.getBaseUrl();
      const url = `${baseUrl}/api/blog/posts/${postId}`;
      return await this.request(url, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete blog post:', error);
      throw error;
    }
  }

  /**
   * 블로그 이미지 업로드
   */
  async uploadBlogImage(file: File) {
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      // Next.js API 라우트 사용 (서버/클라이언트 모두)
      const baseUrl = this.getBaseUrl();
      const url = `${baseUrl}/api/blog/images`;
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to upload blog image:', error);
      throw error;
    }
  }

  /**
   * 기본 홈 데이터 (API 실패 시 사용)
   */
  getDefaultHomeData() {
    return {
      slogan: {
        sub: '임상경험이 풍부한 검증된 전문가 . ADHD 특화.차별화된 프로그램',
        main: 'ADHD 전문.심리상담센터'
      },
      videoUrl: null, // 로컬 비디오 또는 기본 비디오 사용
      gallery: [...FALLBACK_GALLERY_IMAGES]
    };
  }
}

// 싱글톤 인스턴스
let apiServiceInstance: ApiService | null = null;

export function getApiService(): ApiService {
  if (!apiServiceInstance) {
    apiServiceInstance = new ApiService();
  }
  return apiServiceInstance;
}


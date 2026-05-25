/**
 * CommunityFeed — 커뮤니티 피드
 *
 * 탭(내담자 후기/상담사 칼럼), 게시글 카드(좋아요·댓글 수),
 * 글 작성 바텀시트, 신고 메뉴. localStorage 기반 목업.
 * primaryColor를 props로 받아 역할별 테마 대응.
 *
 * @author MindGarden
 * @since 2026-05-12
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart, MessageCircle, MoreHorizontal, Plus,
  Users, Flag
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useAlert } from '../../hooks/useAlert';
import './CommunityFeed.css';

const TABS = [
  { key: 'reviews', label: '내담자 후기' },
  { key: 'columns', label: '상담사 칼럼' }
];

const POST_CATEGORIES = [
  '불안', '우울', '관계', '자존감', '스트레스', '수면', '기타'
];

const INITIAL_POSTS = [
  {
    id: 1, tab: 'reviews', author: '익명의 나무', specialty: '',
    title: '첫 상담 후기', body: '처음이라 많이 긴장했는데, 상담사 선생님이 정말 편안하게 대해주셔서 좋았습니다. 그동안 혼자 끙끙 앓던 것들을 이야기하니 마음이 한결 가벼워졌어요.',
    likes: 12, comments: 3, time: '2시간 전', isConsultant: false, category: '기타'
  },
  {
    id: 2, tab: 'reviews', author: '익명의 바다', specialty: '',
    title: '3개월 상담 후 변화', body: '매주 상담을 받으면서 불안이 많이 줄었어요. 자동적 사고를 알아차리는 연습이 정말 도움이 되었습니다.',
    likes: 24, comments: 7, time: '5시간 전', isConsultant: false, category: '불안'
  },
  {
    id: 3, tab: 'reviews', author: '익명의 별', specialty: '',
    title: '상담이 처음인 분들에게', body: '용기 내서 시작해보세요. 저도 반년 전에 시작했는데 인생이 바뀌었어요. 혼자가 아니라는 걸 알게 되었습니다.',
    likes: 35, comments: 11, time: '1일 전', isConsultant: false, category: '기타'
  },
  {
    id: 4, tab: 'columns', author: '김상담', specialty: '인지행동치료 전문',
    title: '스트레스를 관리하는 마인드풀니스', body: '일상에서 마인드풀니스를 실천하는 방법에 대해 알려드립니다. 지금 이 순간에 집중하는 것만으로도 스트레스가 크게 줄어듭니다.',
    likes: 45, comments: 8, time: '3시간 전', isConsultant: true, category: '스트레스'
  },
  {
    id: 5, tab: 'columns', author: '이마음', specialty: '가족상담 전문',
    title: '부모-자녀 관계에서 경계 설정하기', body: '건강한 가족관계를 위해서는 서로의 경계를 존중하는 것이 중요합니다. 오늘은 부모-자녀 사이에서 건강한 경계를 설정하는 방법을 이야기해보겠습니다.',
    likes: 31, comments: 5, time: '1일 전', isConsultant: true, category: '관계'
  },
  {
    id: 6, tab: 'columns', author: '박치유', specialty: '우울증 전문',
    title: '우울할 때 할 수 있는 작은 일들', body: '아무것도 하고 싶지 않은 날, 정말 작은 것부터 시작하면 됩니다. 커튼 열기, 물 한 잔 마시기, 5분만 산책하기 — 이것만으로도 충분합니다.',
    likes: 52, comments: 14, time: '2일 전', isConsultant: true, category: '우울'
  }
];

const CommunityFeed = ({ primaryColor }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [alert, AlertModal] = useAlert();
  const [activeTab, setActiveTab] = useState('reviews');
  const [posts, setPosts] = useState(() => {
    try {
      const saved = localStorage.getItem('mg_community_posts');
      return saved ? JSON.parse(saved) : INITIAL_POSTS;
    } catch { return INITIAL_POSTS; }
  });
  const [likedPosts, setLikedPosts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mg_community_likes') || '[]');
    } catch { return []; }
  });
  const [showSheet, setShowSheet] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [reportPostId, setReportPostId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('mg_community_posts', JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem('mg_community_likes', JSON.stringify(likedPosts));
  }, [likedPosts]);

  const filteredPosts = posts.filter((p) => p.tab === activeTab);

  const toggleLike = (postId, e) => {
    e.stopPropagation();
    const isLiked = likedPosts.includes(postId);
    setLikedPosts((prev) =>
      isLiked ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, likes: p.likes + (isLiked ? -1 : 1) }
          : p
      )
    );
  };

  const handleSubmit = () => {
    if (!newTitle.trim() || !newBody.trim()) return;
    const newPost = {
      id: Date.now(),
      tab: activeTab,
      author: activeTab === 'reviews' ? '익명의 꽃' : '상담사',
      specialty: activeTab === 'columns' ? '전문 상담사' : '',
      title: newTitle.trim(),
      body: newBody.trim(),
      likes: 0,
      comments: 0,
      time: '방금 전',
      isConsultant: activeTab === 'columns',
      category: newCategory || '기타'
    };
    setPosts((prev) => [newPost, ...prev]);
    setNewTitle('');
    setNewBody('');
    setNewCategory('');
    setShowSheet(false);
    showToast({ message: '글이 게시되었습니다.', type: 'success' });
  };

  const handleReport = async(postId) => {
    setReportPostId(null);
    await alert({
      variant: 'success',
      messageKey: 'modal.community.report.success.message'
    });
  };

  const openPostDetail = (post) => {
    const basePath = window.location.pathname.includes('/consultant')
      ? '/consultant/more/community'
      : '/client/more/community';
    navigate(`${basePath}/${post.id}`, { state: { post, posts, likedPosts } });
  };

  const themeStyle = primaryColor ? { '--community-primary': primaryColor } : {};

  if (loading) {
    return (
      <div className="community" style={themeStyle}>
        <div className="community__skeleton">
          <div className="community__skeleton-block" />
          <div className="community__skeleton-block" />
          <div className="community__skeleton-block" />
        </div>
      </div>
    );
  }

  return (
    <div className="community" style={themeStyle}>
      {/* 탭 */}
      <div className="community__tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`community__tab${activeTab === tab.key ? ' community__tab--active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 게시글 리스트 */}
      {filteredPosts.length > 0 ? (
        <div className="community__post-list">
          {filteredPosts.map((post, idx) => {
            const isLiked = likedPosts.includes(post.id);
            return (
              <div
                key={post.id}
                className="community__post-card"
                onClick={() => openPostDetail(post)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && openPostDetail(post)}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="community__post-header">
                  <div className={`community__post-avatar${post.isConsultant ? ' community__post-avatar--consultant' : ''}`}>
                    {post.author.charAt(0)}
                  </div>
                  <div className="community__post-author-info">
                    <div className="community__post-author">{post.author}</div>
                    {post.specialty && (
                      <div className="community__post-specialty">{post.specialty}</div>
                    )}
                  </div>
                  <span className="community__post-time">{post.time}</span>
                  <div className="community__post-more-anchor">
                    <button
                      type="button"
                      className="community__post-more"
                      onClick={(e) => {
                        e.stopPropagation();
                        setReportPostId(reportPostId === post.id ? null : post.id);
                      }}
                      aria-label="더보기"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {reportPostId === post.id && (
                      <div className="community__report-menu">
                        <button
                          type="button"
                          className="community__report-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReport(post.id);
                          }}
                        >
                          <Flag size={14} className="community__report-item-icon" />
                          신고
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="community__post-title">{post.title}</div>
                <div className="community__post-body">{post.body}</div>

                <div className="community__post-actions">
                  <button
                    type="button"
                    className={`community__post-action-btn${isLiked ? ' community__post-action-btn--liked' : ''}`}
                    onClick={(e) => toggleLike(post.id, e)}
                  >
                    <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
                    {post.likes}
                  </button>
                  <button
                    type="button"
                    className="community__post-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      openPostDetail(post);
                    }}
                  >
                    <MessageCircle size={16} />
                    {post.comments}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="community__empty">
          <div className="community__empty-icon">
            <Users size={28} />
          </div>
          <p className="community__empty-text">
            아직 게시글이 없어요
          </p>
          <button
            type="button"
            className="community__empty-btn"
            onClick={() => setShowSheet(true)}
          >
            첫 글 작성하기
          </button>
        </div>
      )}

      {/* 글 작성 FAB */}
      <button
        type="button"
        className="community__fab"
        onClick={() => setShowSheet(true)}
        aria-label="글 작성"
      >
        <Plus size={24} />
      </button>

      {/* 바텀시트 폼 */}
      {showSheet && (
        <>
          <div
            className="community__sheet-overlay"
            onClick={() => setShowSheet(false)}
          />
          <div className="community__sheet">
            <div className="community__sheet-handle" />
            <div className="community__sheet-title">새 글 작성</div>

            <div className="community__sheet-chips">
              {POST_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`community__sheet-chip${newCategory === cat ? ' community__sheet-chip--active' : ''}`}
                  onClick={() => setNewCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <input
              type="text"
              className="community__sheet-input"
              placeholder="제목을 입력하세요"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <textarea
              className="community__sheet-textarea"
              placeholder="내용을 입력하세요"
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
            />

            <button
              type="button"
              className="community__sheet-submit"
              onClick={handleSubmit}
              disabled={!newTitle.trim() || !newBody.trim()}
            >
              게시 요청
            </button>
          </div>
        </>
      )}
      <AlertModal />
    </div>
  );
};

export default CommunityFeed;

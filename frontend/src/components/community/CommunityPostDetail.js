/**
 * CommunityPostDetail — 커뮤니티 게시글 상세
 *
 * 게시글 본문, 좋아요·댓글, 댓글 입력 바. localStorage 기반 목업.
 *
 * @author MindGarden
 * @since 2026-05-12
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, MessageCircle, Send } from 'lucide-react';
import {
  getAuthorAvatarInitial,
  getAuthorDisplay
} from '../../utils/communityAuthorDisplay';
import './CommunityPostDetail.css';

const MOCK_COMMENTS = [
  { id: 1, author: '익명의 구름', text: '정말 공감이 가는 글이에요. 저도 비슷한 경험이 있어서 힘이 됩니다.', time: '1시간 전' },
  { id: 2, author: '익명의 강', text: '용기 내서 공유해주셔서 감사합니다.', time: '30분 전' }
];

const CommunityPostDetail = ({ primaryColor }) => {
  const location = useLocation();
  const { t } = useTranslation('community');
  const post = location.state?.post;
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post?.likes || 0);
  const [comments, setComments] = useState(() => {
    try {
      const key = `mg_community_comments_${post?.id}`;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : MOCK_COMMENTS;
    } catch { return MOCK_COMMENTS; }
  });
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (post?.id) {
      localStorage.setItem(
        `mg_community_comments_${post.id}`,
        JSON.stringify(comments)
      );
    }
  }, [comments, post?.id]);

  const toggleLike = () => {
    setLiked((prev) => !prev);
    setLikeCount((prev) => prev + (liked ? -1 : 1));
  };

  const submitComment = () => {
    if (!newComment.trim()) return;
    const comment = {
      id: Date.now(),
      author: '나',
      text: newComment.trim(),
      time: '방금 전'
    };
    setComments((prev) => [...prev, comment]);
    setNewComment('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitComment();
    }
  };

  const themeStyle = primaryColor ? { '--community-primary': primaryColor } : {};

  if (!post) {
    return (
      <div className="post-detail" style={themeStyle}>
        <div className="community__empty">
          <p className="community__empty-text">게시글을 찾을 수 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="post-detail" style={themeStyle}>
      <div className="post-detail__card">
        <div className="post-detail__header">
          <div className={`post-detail__avatar${post.isConsultant ? ' post-detail__avatar--consultant' : ''}${post.authorAnonymized ? ' post-detail__avatar--anonymized' : ''}`}>
            {getAuthorAvatarInitial(post, t)}
          </div>
          <div className="post-detail__author-info">
            <div className="post-detail__author">{getAuthorDisplay(post, t)}</div>
            {post.specialty && !post.authorAnonymized && (
              <div className="post-detail__specialty">{post.specialty}</div>
            )}
          </div>
          <span className="post-detail__time">{post.time}</span>
        </div>

        <h1 className="post-detail__title">{post.title}</h1>
        <div className="post-detail__body">{post.body}</div>

        <div className="post-detail__actions">
          <button
            type="button"
            className={`post-detail__action-btn${liked ? ' post-detail__action-btn--liked' : ''}`}
            onClick={toggleLike}
          >
            <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
            {likeCount}
          </button>
          <button type="button" className="post-detail__action-btn">
            <MessageCircle size={18} />
            {comments.length}
          </button>
        </div>
      </div>

      {/* 댓글 리스트 */}
      <div className="post-detail__comments-section">
        <div className="post-detail__comments-title">댓글 {comments.length}개</div>

        {comments.length > 0 ? (
          <div className="post-detail__comment-list">
            {comments.map((c, idx) => (
              <div
                key={c.id}
                className="post-detail__comment"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div className={`post-detail__comment-avatar${c.authorAnonymized ? ' post-detail__comment-avatar--anonymized' : ''}`}>
                  {getAuthorAvatarInitial(c, t)}
                </div>
                <div className="post-detail__comment-body">
                  <div className="post-detail__comment-author">{getAuthorDisplay(c, t)}</div>
                  <div className="post-detail__comment-text">{c.text}</div>
                  <div className="post-detail__comment-time">{c.time}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="post-detail__no-comments">아직 댓글이 없어요. 첫 댓글을 남겨보세요.</p>
        )}
      </div>

      {/* 댓글 입력 바 */}
      <div className="post-detail__input-bar">
        <input
          type="text"
          className="post-detail__input"
          placeholder="댓글을 입력하세요..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className="post-detail__send-btn"
          onClick={submitComment}
          disabled={!newComment.trim()}
          aria-label="댓글 전송"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default CommunityPostDetail;

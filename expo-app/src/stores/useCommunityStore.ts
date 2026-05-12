/**
 * 커뮤니티 스토어 — MMKV 기반 로컬 저장
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import {
  INITIAL_COMMUNITY_POSTS,
  type CommunityPost,
  type CommunityComment,
} from '@/constants/communityData';

const mmkv = createMMKV({ id: 'community-store' });

const zustandMMKVStorage = createJSONStorage(() => ({
  getItem: (name: string) => mmkv.getString(name) ?? null,
  setItem: (name: string, value: string) => mmkv.set(name, value),
  removeItem: (name: string) => mmkv.remove(name),
}));

interface CommunityState {
  posts: CommunityPost[];
  likedPostIds: number[];
  likedCommentIds: number[];
  nextPostId: number;
  nextCommentId: number;

  togglePostLike: (postId: number) => void;
  toggleCommentLike: (commentId: number) => void;
  isPostLiked: (postId: number) => boolean;
  isCommentLiked: (commentId: number) => boolean;
  addPost: (post: Omit<CommunityPost, 'id' | 'likes' | 'comments' | 'time'>) => void;
  addComment: (postId: number, author: string, body: string) => void;
  getPostById: (id: number) => CommunityPost | undefined;
}

export const useCommunityStore = create<CommunityState>()(
  persist(
    (set, get) => ({
      posts: [...INITIAL_COMMUNITY_POSTS],
      likedPostIds: [],
      likedCommentIds: [],
      nextPostId: 100,
      nextCommentId: 100,

      togglePostLike: (postId) => {
        const { likedPostIds, posts } = get();
        const isLiked = likedPostIds.includes(postId);
        const nextLiked = isLiked
          ? likedPostIds.filter((id) => id !== postId)
          : [...likedPostIds, postId];
        const nextPosts = posts.map((p) =>
          p.id === postId
            ? { ...p, likes: p.likes + (isLiked ? -1 : 1) }
            : p,
        );
        set({ likedPostIds: nextLiked, posts: nextPosts });
      },

      toggleCommentLike: (commentId) => {
        const { likedCommentIds, posts } = get();
        const isLiked = likedCommentIds.includes(commentId);
        const nextLiked = isLiked
          ? likedCommentIds.filter((id) => id !== commentId)
          : [...likedCommentIds, commentId];
        const nextPosts = posts.map((p) => ({
          ...p,
          comments: p.comments.map((c) =>
            c.id === commentId
              ? { ...c, likes: c.likes + (isLiked ? -1 : 1) }
              : c,
          ),
        }));
        set({ likedCommentIds: nextLiked, posts: nextPosts });
      },

      isPostLiked: (postId) => get().likedPostIds.includes(postId),
      isCommentLiked: (commentId) => get().likedCommentIds.includes(commentId),

      addPost: (partial) => {
        const { nextPostId, posts } = get();
        const newPost: CommunityPost = {
          ...partial,
          id: nextPostId,
          likes: 0,
          comments: [],
          time: '방금 전',
        };
        set({ posts: [newPost, ...posts], nextPostId: nextPostId + 1 });
      },

      addComment: (postId, author, body) => {
        const { nextCommentId, posts } = get();
        const comment: CommunityComment = {
          id: nextCommentId,
          author,
          body,
          time: '방금 전',
          likes: 0,
        };
        const nextPosts = posts.map((p) =>
          p.id === postId
            ? { ...p, comments: [...p.comments, comment] }
            : p,
        );
        set({ posts: nextPosts, nextCommentId: nextCommentId + 1 });
      },

      getPostById: (id) => get().posts.find((p) => p.id === id),
    }),
    {
      name: 'community-storage',
      storage: zustandMMKVStorage,
      partialize: (state) => ({
        posts: state.posts,
        likedPostIds: state.likedPostIds,
        likedCommentIds: state.likedCommentIds,
        nextPostId: state.nextPostId,
        nextCommentId: state.nextCommentId,
      }),
    },
  ),
);

import { Post, Quiz, User } from "@prisma/client";

// https://www.tunglt.com/2018/11/bo-dau-tieng-viet-javascript-es6/
export const formatAccountName = (name: string) =>
  name
    ? name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .replace(/[^a-zA-Z_\d]/g, "")
        .toLowerCase()
    : "";

export enum QuizType {
  MCQ = "MCQ",
}

type FeedItemType = 'Post' | 'Quiz'
export type FeedPostType = Post & {
  user: User;
  _count: {
    likes: number;
    comments: number;
  };
  likedByMe: boolean;
  followedByMe: boolean;
}

export interface FeedItem {
  type: FeedItemType,
  post?: FeedPostType,
  quizzes?: Quiz[]
}
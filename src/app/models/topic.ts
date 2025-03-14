import { Post } from './post';

export interface Topic {
  id: string;
  name: string;
  posts: Post[];
}

export type Topics = Topic[];

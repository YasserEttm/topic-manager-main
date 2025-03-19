import { Post } from './post';

export interface Topic {
  id: string;
  name: string;
  posts: Post[];
  owner: string;
  readers: string[];
  writers: string[];
}

export type Topics = Topic[];

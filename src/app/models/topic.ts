import { Post } from './post';

export interface Topic {
  id: string;
  name: string;
  posts: Post[];
  owner?: string;
  readers?: string[];
  writers?: string[];
  isOwner?: boolean; 
  isReader?: boolean; 
  isWriter?: boolean;
}

export type Topics = Topic[];

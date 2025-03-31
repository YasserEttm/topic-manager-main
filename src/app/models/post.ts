export interface Post {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
}

export type Posts = Post[];

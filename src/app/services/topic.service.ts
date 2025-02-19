import { Injectable } from '@angular/core';
import { Topic, Topics } from '../models/topic';
import { Post, Posts } from '../models/post';
import { generateUUID } from '../utils/generate-uuid';
import { BehaviorSubject, map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TopicService {
  private _topics: BehaviorSubject<Topics> = new BehaviorSubject([
    { id: '1', name: 'Topic 1', posts: [{ id: '1', name: 'Post 1' }] },
    { id: '2', name: 'Topic 2', posts: [] },
  ]);

  getAll(): Observable<Topics> {
    return this._topics.asObservable();
  }

  getById(topicId: string): Observable<Topic | undefined> {
    return this._topics.pipe(
      map((topics) => topics.find((topic) => topic.id === topicId))
    );
  }

  addTopic(topic: Omit<Topic, 'id' | 'posts'>): void {
    const _topic: Topic = {
      ...topic,
      id: generateUUID(),
      posts: [],
    };
    this._topics.next([...this._topics.value, _topic]);
  }

  editTopic(topic: Topic): void {
    this._topics.next(
      this._topics.value.map((_topic) =>
        _topic.id === topic.id ? topic : _topic
      )
    );
  }

  removeTopic(topic: Topic): void {
    this._topics.next(
      this._topics.value.filter((_topic) => _topic.id !== topic.id)
    );
  }

  addPost(topicId: string, post: Omit<Post, 'id'>): void {
    this._topics.next(
      this._topics.value.map((topic) =>
        topic.id === topicId
          ? {
              ...topic,
              posts: [...topic.posts, { ...post, id: generateUUID() }],
            }
          : topic
      )
    );
  }

  editPost(topicId: string, post: Post): void {
    this._topics.next(
      this._topics.value.map((topic) =>
        topic.id === topicId
          ? {
              ...topic,
              posts: topic.posts.map((_post) =>
                _post.id === post.id ? { ...post, id: _post.id } : _post
              ),
            }
          : topic
      )
    );
  }

  removePost(topicId: string, post: Post): void {
    this._topics.next(
      this._topics.value.map((topic) =>
        topic.id === topicId
          ? {
              ...topic,
              posts: topic.posts.filter((_post) => _post.id !== post.id),
            }
          : topic
      )
    );
  }
}

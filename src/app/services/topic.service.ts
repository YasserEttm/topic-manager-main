import { inject, Injectable } from '@angular/core';
import { Topic, Topics } from '../models/topic';
import { Post } from '../models/post';
import { generateUUID } from '../utils/generate-uuid';
import { BehaviorSubject, map, Observable, of, tap } from 'rxjs';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  setDoc,
  doc,
  docData,
  query,
  where
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class TopicService {
  private firestore = inject(Firestore);
  topicsCollection = collection(this.firestore, 'topics');
  //doc(topicsCollection);

  private _topics: BehaviorSubject<Topics> = new BehaviorSubject([
    { id: '1', name: 'Topic 1', posts: [{ id: '1', name: 'Post 1' }] },
    { id: '2', name: 'Topic 2', posts: [] },
  ]);

  getAll(): Observable<Topics> {
    //query(this.topicsCollection, where('owner', '==',uid));
    return (collectionData(this.topicsCollection) as Observable<Topic[]>).pipe(
      tap(console.log)
    );
  }

  getById(topicId: string): Observable<Topic | undefined> {
    return this._topics.pipe(
      map((topics) => topics.find((topic) => topic.id === topicId))
    );
  }

  addTopic(topic: Omit<Topic, 'id' | 'posts'>): void {
    /* const _topic: Topic = {
      ...topic,
      id: generateUUID(),
      posts: [],
    };*/
    //this._topics.next([...this._topics.value, _topic]);

    addDoc(this.topicsCollection, <Topic>{
      ...topic,
      id: generateUUID(),
      posts: [],
    });
  }

  editTopic(topic: Topic): void {
    setDoc(doc(this.firestore, `topic/${topic.id}`), {name: topic.name})
    //setDoc(this.topicsCollection, topic)
    /*this._topics.next(
      this._topics.value.map((_topic) =>
        _topic.id === topic.id ? topic : _topic
      )
    );*/
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

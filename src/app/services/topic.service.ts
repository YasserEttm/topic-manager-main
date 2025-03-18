import { inject, Injectable } from '@angular/core';
import { Topic, Topics } from '../models/topic';
import { Post } from '../models/post';
import { generateUUID } from '../utils/generate-uuid';
import { BehaviorSubject, map, Observable, of, switchMap, tap } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
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
  private authService = inject(AuthService);
  topicsCollection = collection(this.firestore, 'topics');
  //doc(topicsCollection);

  getAll(): Observable<Topics> {
    //query(this.topicsCollection, where('owner', '==',uid));
    const user$ = this.authService.getConnectedUser();

    return user$.pipe(
      switchMap((user) => {
        const whereUserIsOwnerTopics = query(
          this.topicsCollection,
          where('owner', '==', user?.email)
        );
        return (collectionData(whereUserIsOwnerTopics, {
          idField: 'id',
        }) as Observable<Topic[]>).pipe(map(topics => topics.map(topic => {
          const {name, id, ...topicLight} = topic;
          return {
            ...topic,
            isOwner: true
          }
        })))
      })
    )
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

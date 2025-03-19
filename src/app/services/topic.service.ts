import { inject, Injectable } from '@angular/core';
import { Topic, Topics } from '../models/topic';
import { Post } from '../models/post';
import { generateUUID } from '../utils/generate-uuid';
import { BehaviorSubject, from, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
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
  where,
  DocumentData,
  arrayRemove,
  updateDoc,
  arrayUnion,
  getDoc,
  deleteDoc
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

  getById(id: string): Observable<Topic | undefined> {
    const topicDoc = doc(this.firestore, 'topics', id);
  
    return docData(topicDoc, { idField: 'id' }).pipe(
      map((topic: DocumentData | undefined) => {
        if (topic) {
          const topicData = topic as Topic;

          return {
            ...topicData,
            isOwner: true,
          };
        }
        return undefined;
      })
    );
  }
  
  

  addTopic(name: string, posts: Post[]): Observable<Topic> {
    const user$ = this.authService.getConnectedUser();
  
    return user$.pipe(
      switchMap((user) => {
        const topicId = generateUUID();  
  
        const newTopic: Topic = {
          id: topicId,
          name,
          posts,
          owner: user?.email || '', 
          readers: [],
          writers: [],
        };
  
        const topicRef = doc(this.firestore, 'topics', topicId);
  
        return from(setDoc(topicRef, { ...newTopic })).pipe(
          map(() => newTopic)
        );
      })
    );
  }

  addReader(topicId: string, readerEmail: string): Observable<void> {
    const user$ = this.authService.getConnectedUser();
  
    return user$.pipe(
      switchMap((user) => {
        if (user?.email !== undefined) {
          const topicRef = doc(this.firestore, 'topics', topicId);
          
          return from(updateDoc(topicRef, {
            readers: arrayUnion(readerEmail)  
          }));
        }
        return of();
      })
    );
  }
  removeReader(topicId: string, readerEmail: string): Observable<void> {
    const user$ = this.authService.getConnectedUser();
  
    return user$.pipe(
      switchMap((user) => {
        if (user?.email !== undefined) {
          const topicRef = doc(this.firestore, 'topics', topicId);
  
          return from(updateDoc(topicRef, {
            readers: arrayRemove(readerEmail)
          }));
        }
        return of();
      })
    );
  }
  addWriter(topicId: string, writerEmail: string): Observable<void> {
    const user$ = this.authService.getConnectedUser();
  
    return user$.pipe(
      switchMap((user) => {
        if (user?.email !== undefined) {
          const topicRef = doc(this.firestore, 'topics', topicId);
          
          return from(updateDoc(topicRef, {
            writers: arrayUnion(writerEmail)  
          }));
        }
        return of();
      })
    );
  }
  removeWriter(topicId: string, writerEmail: string): Observable<void> {
    const user$ = this.authService.getConnectedUser();
  
    return user$.pipe(
      switchMap((user) => {
        if (user?.email !== undefined) {
          const topicRef = doc(this.firestore, 'topics', topicId);
  
          return from(updateDoc(topicRef, {
            writers: arrayRemove(writerEmail)  
          }));
        }
        return of();
      })
    );
  }

  editTopic(topicId: string, updates: Partial<Omit<Topic, 'id' | 'owner'>>): Observable<void> {
    const user$ = this.authService.getConnectedUser();
  
    return user$.pipe(
      switchMap((user) => {
        if (!user?.email) return throwError(() => new Error('User not authenticated'));
  
        const topicRef = doc(this.firestore, 'topics', topicId);
  
        return from(getDoc(topicRef)).pipe(
          switchMap((topicSnapshot) => {
            if (!topicSnapshot.exists()) {
              return throwError(() => new Error('Topic not found'));
            }
  
            const topicData = topicSnapshot.data() as Topic;
  
            if (topicData.owner !== user.email && !(topicData.writers || []).includes(user.email ?? '')) {
              return throwError(() => new Error('Permission denied'));
            }            

            return from(updateDoc(topicRef, updates));
          })
        );
      })
    );
  }
  

  removeTopic(topicId: string): Observable<void> {
    const user$ = this.authService.getConnectedUser();
  
    return user$.pipe(
      switchMap((user) => {
        if (!user?.email) return throwError(() => new Error('User not authenticated'));
  
        const topicRef = doc(this.firestore, 'topics', topicId);
  
        return from(getDoc(topicRef)).pipe(
          switchMap((topicSnapshot) => {
            if (!topicSnapshot.exists()) {
              return throwError(() => new Error('Topic not found'));
            }
  
            const topicData = topicSnapshot.data() as Topic;
  
            if (topicData.owner !== user.email) {
              return throwError(() => new Error('Permission denied: Only the owner can delete this topic'));
            }
  
            return from(deleteDoc(topicRef));
          })
        );
      })
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
